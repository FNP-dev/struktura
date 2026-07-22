import { useMemo, useState, useRef, useEffect } from 'react';
import {
  ChevronDown, ChevronRight, User, Network, GitBranch, List, History,
  Plus, Pencil, Trash2, Download, GripVertical, UserCog,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/ErrorState';
import { getDepartmentIcon, levelStyle } from '../components/shared/departmentIcons';
import { DepartmentFormModal } from '../components/shared/DepartmentFormModal';
import { fullName, formatDate } from '../lib/format';
import { can } from '../hooks/useAuth';
import { useLang } from '../hooks/useLang';
import {
  createDepartment, updateDepartment, deleteDepartment,
  reparentDepartment, reassignManager, setEmployeeManager,
  type DepartmentInput,
} from '../lib/api';
import type { OrgSnapshot } from '../lib/api';
import type { EmployeeWithRelations, DepartmentNode, ChangeHistory } from '../lib/types';
import { cn } from '../lib/utils';

interface OrganigramPageProps {
  data: OrgSnapshot;
  onSelectEmployee: (e: EmployeeWithRelations) => void;
  role: 'admin' | 'hr' | 'employee' | null;
  onRefresh: () => void;
}

type DeptNode = Omit<DepartmentNode, 'children'> & { children: DeptNode[]; staff: EmployeeWithRelations[] };
type ViewMode = 'tree' | 'list' | 'radial' | 'history';

export function OrganigramPage({ data, onSelectEmployee, role, onRefresh }: OrganigramPageProps) {
  const { t } = useLang();
  const [view, setView] = useState<ViewMode>('tree');
  const canWrite = can(role, 'write', 'departments');
  const canDelete = can(role, 'delete', 'departments');

  const { roots, allNodes } = useMemo(() => {
    const byId = new Map<string, DeptNode>();
    data.departments.forEach((d) => byId.set(d.id, { ...d, children: [], staff: [] }));
    data.employees.forEach((e) => {
      if (e.department_id && byId.has(e.department_id)) byId.get(e.department_id)!.staff.push(e);
    });
    const r: DeptNode[] = [];
    for (const node of byId.values()) {
      if (node.parent_id && byId.has(node.parent_id)) byId.get(node.parent_id)!.children.push(node);
      else r.push(node);
    }
    for (const node of byId.values()) {
      node.staff.sort((a, b) => {
        if (a.id === node.manager_id) return -1;
        if (b.id === node.manager_id) return 1;
        if (a.is_board_member !== b.is_board_member) return a.is_board_member ? -1 : 1;
        return fullName(a).localeCompare(fullName(b));
      });
      node.children.sort((a, b) => a.name.localeCompare(b.name));
    }
    return { roots: r, allNodes: Array.from(byId.values()) };
  }, [data.departments, data.employees]);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const effectiveExpanded = useMemo(() => {
    const set = new Set<string>();
    for (const n of allNodes) {
      if (collapsed.has(n.id)) continue;
      if (n.level <= 1) set.add(n.id);
    }
    for (const id of expanded) set.add(id);
    return set;
  }, [allNodes, expanded, collapsed]);

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      setCollapsed((c) => {
        const nc = new Set(c);
        if (next.has(id)) nc.delete(id); else nc.add(id);
        return nc;
      });
      return next;
    });

  const expandAll = () => { setExpanded(new Set(allNodes.map((n) => n.id))); setCollapsed(new Set()); };
  const collapseAll = () => { setExpanded(new Set()); setCollapsed(new Set(allNodes.map((n) => n.id))); };

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DepartmentNode | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<DepartmentNode | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [managerPickerFor, setManagerPickerFor] = useState<DepartmentNode | null>(null);

  const openCreate = (parentId: string | null) => {
    setEditing(null);
    setDefaultParentId(parentId);
    setFormOpen(true);
  };
  const openEdit = (node: DepartmentNode) => {
    setEditing(node);
    setDefaultParentId(null);
    setFormOpen(true);
  };

  const handleSubmit = async (input: DepartmentInput) => {
    setSubmitting(true);
    try {
      if (editing) await updateDepartment(editing.id, input);
      else await createDepartment(input);
      onRefresh();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteDepartment(deleting.id);
      setDeleting(null);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally { setDeleteLoading(false); }
  };

  const handleDrop = async (targetId: string) => {
    setDragOverId(null);
    if (!dragId || dragId === targetId) { setDragId(null); return; }
    const isDescendant = (root: DeptNode, lookingFor: string): boolean => {
      if (root.id === lookingFor) return true;
      return root.children.some((c) => isDescendant(c, lookingFor));
    };
    const dragged = allNodes.find((n) => n.id === dragId);
    const target = allNodes.find((n) => n.id === targetId);
    if (dragged && target && isDescendant(dragged, targetId)) {
      setDragId(null);
      alert(t('drag.descendantErr'));
      return;
    }
    const newParent = targetId === '__root' ? null : targetId;
    if (dragged?.parent_id === newParent) { setDragId(null); return; }
    try {
      await reparentDepartment(dragId, newParent);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    } finally { setDragId(null); }
  };

  const handleReassignManager = async (deptId: string, managerId: string | null) => {
    try {
      await reassignManager(deptId, managerId);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  };

  const handleReassignEmployeeManager = async (employeeId: string, managerId: string | null) => {
    try {
      await setEmployeeManager(employeeId, managerId);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error');
    }
  };

  const exportPdf = () => { window.print(); };

  const isDescendantOf = (nodeId: string, ancestorId: string): boolean => {
    const node = allNodes.find((n) => n.id === nodeId);
    if (!node) return false;
    let cur = node;
    while (cur.parent_id) {
      if (cur.parent_id === ancestorId) return true;
      cur = allNodes.find((n) => n.id === cur.parent_id)!;
      if (!cur) break;
    }
    return false;
  };

  const structureHistory = useMemo(() => {
    return data.changeHistory.filter(
      (h) => h.entity_type === 'department' || h.entity_type === 'employee' || h.entity_type === 'position'
    );
  }, [data.changeHistory]);

  const renderNode = (node: DeptNode, depth: number): React.ReactNode => {
    const Icon = getDepartmentIcon(node.icon);
    const isExpanded = effectiveExpanded.has(node.id);
    const hasChildren = node.children.length > 0;
    const style = levelStyle(depth);
    const manager = node.staff.find((s) => s.id === node.manager_id) ?? node.staff[0];
    const isDragOver = dragOverId === node.id;
    const isDragging = dragId === node.id;

    return (
      <div key={node.id} className="org-connector">
        <div
          className={cn(
            'mx-auto max-w-sm rounded-xl border bg-white shadow-soft transition-all duration-200',
            depth === 0 ? 'border-brand-300 ring-1 ring-brand-100' : 'border-ink-200',
            isDragOver && 'ring-2 ring-brand-400 border-brand-400',
            isDragging && 'opacity-40',
            canWrite && 'cursor-grab active:cursor-grabbing'
          )}
          draggable={canWrite}
          onDragStart={(e) => { setDragId(node.id); e.dataTransfer.effectAllowed = 'move'; }}
          onDragEnd={() => { setDragId(null); setDragOverId(null); }}
          onDragOver={(e) => { if (canWrite && dragId && dragId !== node.id && !isDescendantOf(node.id, dragId)) { e.preventDefault(); setDragOverId(node.id); } }}
          onDrop={(e) => { e.preventDefault(); handleDrop(node.id); }}
        >
          <div className="w-full flex items-center gap-3 p-3 text-left">
            {canWrite && (
              <span className="shrink-0 text-ink-300 hover:text-ink-500" title={t('structure.dragHint')}>
                <GripVertical size={14} />
              </span>
            )}
            <button onClick={() => hasChildren && toggle(node.id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
              <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', style.bg, style.text)}>
                <Icon size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink-900 truncate">{node.name}</span>
                  {node.code && <Badge variant="outline" size="sm">{node.code}</Badge>}
                </div>
                <p className="text-xs text-ink-400 truncate">
                  {node.staff.length} {t('structure.employees.short')} {hasChildren && `· ${node.children.length} ${t('structure.subdepartments')}`}
                </p>
              </div>
              {hasChildren && (
                <span className="shrink-0 text-ink-400">
                  {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </span>
              )}
            </button>
            {canWrite && (
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => openCreate(node.id)} className="rounded-md p-1 text-ink-400 hover:text-brand-600 hover:bg-brand-50" title={t('structure.addSub')}>
                  <Plus size={14} />
                </button>
                <button onClick={() => openEdit(node)} className="rounded-md p-1 text-ink-400 hover:text-ink-700 hover:bg-ink-100" title={t('common.edit')}>
                  <Pencil size={13} />
                </button>
                <button onClick={() => setManagerPickerFor(node)} className="rounded-md p-1 text-ink-400 hover:text-sky-600 hover:bg-sky-50" title={t('structure.changeManager')}>
                  <UserCog size={13} />
                </button>
                {canDelete && (
                  <button onClick={() => setDeleting(node)} className="rounded-md p-1 text-ink-400 hover:text-red-600 hover:bg-red-50" title={t('common.delete')}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )}
          </div>

          {manager && (
            <button
              onClick={() => onSelectEmployee(manager)}
              className="w-full flex items-center gap-2 px-3 pb-3 pt-1 border-t border-ink-50 hover:bg-ink-50/50 transition-colors text-left"
            >
              <Avatar src={manager.avatar_url} first={manager.first_name} last={manager.last_name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-ink-800 truncate">{fullName(manager)}</p>
                <p className="text-[11px] text-ink-400 truncate">{manager.position?.title}</p>
              </div>
              {manager.id === node.manager_id && (
                <Badge variant="brand" size="sm"><User size={10} /> {t('structure.manager')}</Badge>
              )}
            </button>
          )}

          {isExpanded && node.staff.length > 1 && (
            <div className="border-t border-ink-50 px-3 py-2 space-y-1 max-h-48 overflow-y-auto">
              {node.staff.filter((s) => s.id !== manager?.id).map((s) => (
                <EmployeeRow
                  key={s.id}
                  employee={s}
                  onSelect={() => onSelectEmployee(s)}
                  canWrite={canWrite}
                  employees={data.employees}
                  onReassignManager={(mid) => handleReassignEmployeeManager(s.id, mid)}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div className="relative mt-6 flex flex-col items-stretch gap-6">
            {node.children.length > 1 && <div className="absolute left-0 right-0 top-[-1.5rem] h-px bg-ink-200" />}
            {node.children.map((child) => (
              <div key={child.id} className="relative">
                {node.children.length > 1 && <div className="absolute left-1/2 top-[-1.5rem] h-6 w-px bg-ink-200 -translate-x-1/2" />}
                {renderNode(child, depth + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{t('structure.creator.title')}</h2>
            <p className="text-sm text-ink-500">
              {canWrite ? t('structure.creator.desc.write') : t('structure.creator.desc.readonly')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={exportPdf}><Download size={15} /> {t('structure.exportPdf')}</Button>
            {canWrite && <Button variant="secondary" size="sm" onClick={() => openCreate(null)}><Plus size={15} /> {t('structure.newUnit')}</Button>}
            {view === 'tree' && (
              <div className="flex gap-1">
                <button onClick={expandAll} className="px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-600 bg-ink-100 hover:bg-ink-200 transition-colors">{t('structure.expandAll')}</button>
                <button onClick={collapseAll} className="px-2.5 py-1.5 rounded-md text-xs font-medium text-ink-600 bg-ink-100 hover:bg-ink-200 transition-colors">{t('structure.collapseAll')}</button>
              </div>
            )}
            <div className="flex gap-1 rounded-lg bg-ink-100 p-1">
              <ViewBtn active={view === 'tree'} onClick={() => setView('tree')} icon={<GitBranch size={13} />}>{t('structure.viewTree')}</ViewBtn>
              <ViewBtn active={view === 'radial'} onClick={() => setView('radial')} icon={<Network size={13} />}>{t('structure.viewRadial')}</ViewBtn>
              <ViewBtn active={view === 'list'} onClick={() => setView('list')} icon={<List size={13} />}>{t('structure.viewList')}</ViewBtn>
              <ViewBtn active={view === 'history'} onClick={() => setView('history')} icon={<History size={13} />}>{t('structure.viewHistory')}</ViewBtn>
            </div>
          </div>
        </div>
      </Card>

      <div className="print-area">
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-ink-900">{data.company?.name ?? '—'} — {t('pdf.organigram')}</h1>
          <p className="text-sm text-ink-500">{t('pdf.generated')}: {new Date().toLocaleDateString()}</p>
        </div>

        {view === 'tree' && (
          <Card className="overflow-x-auto print:shadow-none print:border-0">
            <div className="min-w-fit p-6">
              <div className="flex flex-col items-center gap-6">
                {roots.length === 0 ? (
                  <p className="text-sm text-ink-400 py-8">{t('structure.empty')}</p>
                ) : (
                  roots.map((root) => (
                    <div key={root.id} className="w-full flex flex-col items-center">
                      {renderNode(root, 0)}
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        )}

        {view === 'radial' && (
          <Card className="overflow-x-auto print:shadow-none print:border-0">
            <div className="min-w-fit p-6 space-y-4">
              {roots.map((root) => <RadialNode key={root.id} node={root} depth={0} onSelectEmployee={onSelectEmployee} defaultOpen t={t} />)}
            </div>
          </Card>
        )}

        {view === 'list' && (
          <Card className="print:shadow-none print:border-0">
            <div className="space-y-1">
              {roots.map((root) => <ListRow key={root.id} node={root} depth={0} onSelectEmployee={onSelectEmployee} defaultOpen />)}
            </div>
          </Card>
        )}

        {view === 'history' && (
          <StructureHistoryView entries={structureHistory} t={t} />
        )}
      </div>

      <DepartmentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        departments={roots}
        employees={data.employees}
        department={editing}
        defaultParentId={defaultParentId}
        loading={submitting}
      />
      <ConfirmDialog
        open={!!deleting}
        title={t('confirm.deleteUnit.title')}
        message={t('confirm.deleteUnit.msg', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        destructive
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
      <ManagerPickerModal
        open={!!managerPickerFor}
        onClose={() => setManagerPickerFor(null)}
        node={managerPickerFor}
        employees={data.employees}
        onSelect={(mid) => { if (managerPickerFor) handleReassignManager(managerPickerFor.id, mid); setManagerPickerFor(null); }}
        t={t}
      />
    </div>
  );
}

type TFunc = (key: string, vars?: Record<string, string | number>) => string;

function ViewBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5', active ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}
    >
      {icon} {children}
    </button>
  );
}

function EmployeeRow({
  employee, onSelect, canWrite, employees, onReassignManager, t,
}: {
  employee: EmployeeWithRelations;
  onSelect: () => void;
  canWrite: boolean;
  employees: EmployeeWithRelations[];
  onReassignManager: (managerId: string | null) => void;
  t: TFunc;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <div className="group flex items-center gap-2 p-1.5 rounded-md hover:bg-ink-50 transition-colors">
      <button onClick={onSelect} className="flex items-center gap-2 flex-1 min-w-0 text-left">
        <Avatar src={employee.avatar_url} first={employee.first_name} last={employee.last_name} size="xs" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-ink-700 truncate">{fullName(employee)}</p>
          <p className="text-[11px] text-ink-400 truncate">{employee.position?.title}</p>
        </div>
      </button>
      {canWrite && (
        <button
          onClick={() => setPickerOpen(true)}
          className="opacity-0 group-hover:opacity-100 rounded p-1 text-ink-400 hover:text-sky-600 hover:bg-sky-50 transition-all"
          title={t('structure.changeSupervisor')}
        >
          <UserCog size={12} />
        </button>
      )}
      {pickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setPickerOpen(false)}>
          <div className="absolute inset-0 bg-ink-950/40" />
          <div className="relative bg-white rounded-xl shadow-lift p-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h4 className="text-sm font-semibold text-ink-900 mb-2">{t('supervisorPicker.title', { name: fullName(employee) })}</h4>
            <Select onChange={(e) => { onReassignManager(e.target.value || null); setPickerOpen(false); }} value={employee.manager_id ?? ''}>
              <option value="">{t('supervisorPicker.none')}</option>
              {employees.filter((m) => m.id !== employee.id).map((m) => (
                <option key={m.id} value={m.id}>{fullName(m)}</option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}

function ManagerPickerModal({
  open, onClose, node, employees, onSelect, t,
}: {
  open: boolean;
  onClose: () => void;
  node: DepartmentNode | null;
  employees: EmployeeWithRelations[];
  onSelect: (managerId: string | null) => void;
  t: TFunc;
}) {
  const [value, setValue] = useState<string>('');
  const lastNodeId = useRef<string | null>(null);

  useEffect(() => {
    if (open && node && lastNodeId.current !== node.id) {
      lastNodeId.current = node.id;
      setValue(node.manager_id ?? '');
    }
    if (!open && lastNodeId.current !== null) lastNodeId.current = null;
  }, [open, node]);

  if (!open || !node) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-lift p-5 max-w-md w-full">
        <h3 className="text-base font-semibold text-ink-900 mb-1">{t('managerPicker.title')}</h3>
        <p className="text-sm text-ink-500 mb-3">{node.name}</p>
        <Select value={value} onChange={(e) => setValue(e.target.value)}>
          <option value="">{t('managerPicker.none')}</option>
          {employees.map((m) => (
            <option key={m.id} value={m.id}>{fullName(m)}</option>
          ))}
        </Select>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button variant="primary" size="sm" onClick={() => onSelect(value || null)}>{t('common.save')}</Button>
        </div>
      </div>
    </div>
  );
}

function DepartmentIcon({ name, size }: { name?: string | null; size?: number | string }) {
  const Icon = getDepartmentIcon(name);
  return <Icon size={size} />;
}

function ListRow({
  node, depth, onSelectEmployee, defaultOpen,
}: {
  node: DeptNode;
  depth: number;
  onSelectEmployee: (e: EmployeeWithRelations) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const style = levelStyle(node.level);
  const manager = node.staff.find((s) => s.id === node.manager_id);

  return (
    <div>
      <div className="flex items-center gap-2 py-2 rounded-lg hover:bg-ink-50 transition-colors" style={{ paddingLeft: `${depth * 20 + 8}px` }}>
        {node.children.length > 0 ? (
          <button onClick={() => setOpen((o) => !o)} className="text-ink-400 hover:text-ink-700 p-0.5">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : <span className="w-5" />}
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg shrink-0', style.bg, style.text)}>
          <DepartmentIcon name={node.icon} size={14} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-ink-800">{node.name}</span>
          {node.code && <span className="ml-2 text-xs text-ink-400">{node.code}</span>}
        </div>
        <span className="text-xs text-ink-400">{node.staff.length}</span>
        {manager && (
          <button onClick={() => onSelectEmployee(manager)} className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white transition-colors">
            <Avatar src={manager.avatar_url} first={manager.first_name} last={manager.last_name} size="xs" />
            <span className="text-xs text-ink-600 hidden sm:inline">{fullName(manager)}</span>
          </button>
        )}
      </div>
      {open && (
        <div>
          {node.children.map((c) => <ListRow key={c.id} node={c} depth={depth + 1} onSelectEmployee={onSelectEmployee} />)}
        </div>
      )}
    </div>
  );
}

function RadialNode({
  node, depth, onSelectEmployee, defaultOpen, t,
}: {
  node: DeptNode;
  depth: number;
  onSelectEmployee: (e: EmployeeWithRelations) => void;
  defaultOpen?: boolean;
  t: TFunc;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const iconName = node.icon;
  const style = levelStyle(node.level);
  const hasChildren = node.children.length > 0;

  return (
    <div style={{ marginLeft: `${depth * 24}px` }}>
      <div className={cn('rounded-xl border bg-white p-3', depth === 0 ? 'border-brand-300' : 'border-ink-200')}>
        <div className="flex items-center gap-3">
          {hasChildren && (
            <button onClick={() => setOpen((o) => !o)} className="text-ink-400 hover:text-ink-700 p-1 rounded-md hover:bg-ink-100">
              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg shrink-0', style.bg, style.text)}>
            <DepartmentIcon name={iconName} size={17} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-ink-900 truncate">{node.name}</span>
              {node.code && <Badge variant="outline" size="sm">{node.code}</Badge>}
            </div>
            <p className="text-xs text-ink-400 truncate">
              {node.staff.length} prac. {hasChildren && `· ${node.children.length}`}
            </p>
          </div>
        </div>
        {node.staff.length > 0 && (
          <div className="mt-3 pt-3 border-t border-ink-100 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {node.staff.map((s) => {
              const isManager = s.id === node.manager_id;
              return (
                <button key={s.id} onClick={() => onSelectEmployee(s)} className="flex items-center gap-2 p-1.5 rounded-md hover:bg-ink-50 transition-colors text-left">
                  <Avatar src={s.avatar_url} first={s.first_name} last={s.last_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-ink-800 truncate flex items-center gap-1">
                      {fullName(s)}
                      {isManager && <Badge variant="brand" size="sm">{t('structure.manager')}</Badge>}
                    </p>
                    <p className="text-[11px] text-ink-400 truncate">{s.position?.title}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      {open && hasChildren && (
        <div className="mt-3 space-y-3 border-l-2 border-ink-100 pl-3">
          {node.children.map((c) => <RadialNode key={c.id} node={c} depth={depth + 1} onSelectEmployee={onSelectEmployee} t={t} />)}
        </div>
      )}
    </div>
  );
}

// ============ Change History View ============
function StructureHistoryView({ entries, t }: { entries: ChangeHistory[]; t: TFunc }) {
  if (entries.length === 0) {
    return (
      <Card>
        <EmptyState
          title={t('structure.history.title')}
          description={t('structure.history.empty')}
        />
      </Card>
    );
  }

  const actionIcon = (action: string) => {
    if (action === 'create') return { icon: Plus, color: 'bg-emerald-100 text-emerald-700' };
    if (action === 'update') return { icon: Pencil, color: 'bg-sky-100 text-sky-700' };
    return { icon: Trash2, color: 'bg-red-100 text-red-700' };
  };

  const entityLabel = (entityType: string): string => {
    const key = `structure.history.entity.${entityType}`;
    const val = t(key);
    return val === key ? entityType : val;
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-1">
          <h3 className="text-base font-semibold text-ink-900">{t('structure.history.title')}</h3>
          <p className="text-sm text-ink-500">{t('structure.history.desc')}</p>
        </div>
      </Card>
      <Card>
        <div className="relative">
          <div className="absolute left-5 top-2 bottom-2 w-px bg-ink-100" />
          <div className="space-y-4">
            {entries.map((entry) => {
              const { icon: Icon, color } = actionIcon(entry.action);
              return (
                <div key={entry.id} className="relative flex gap-4">
                  <div className={cn('relative z-10 flex h-10 w-10 items-center justify-center rounded-full shrink-0 ring-4 ring-white', color)}>
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0 flex-1 pb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" size="sm">{entityLabel(entry.entity_type)}</Badge>
                      <span className="text-xs font-medium text-ink-500">
                        {t(`structure.history.action.${entry.action}`)}
                      </span>
                    </div>
                    <p className="text-sm text-ink-800 mt-1">{entry.summary}</p>
                    <p className="text-xs text-ink-400 mt-0.5">
                      {entry.changed_by ? `${t('structure.history.by')} ${entry.changed_by} · ` : ''}
                      {formatDate(entry.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
// useEffect is imported from React above

