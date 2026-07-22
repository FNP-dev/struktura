import { useMemo, useState } from 'react';
import { Workflow, Search, X, ArrowRight, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/ErrorState';
import { PriorityBadge, ProcessCategoryBadge } from '../components/shared/badges';
import { ProcessFormModal } from '../components/shared/ProcessFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { fullName } from '../lib/format';
import type { OrgSnapshot, ProcessInput } from '../lib/api';
import { createProcess, updateProcess, deleteProcess } from '../lib/api';
import type { EmployeeWithRelations, ProcessWithRelations } from '../lib/types';
import { can } from '../hooks/useAuth';
import { useLang } from '../hooks/useLang';

interface ProcessesPageProps {
  data: OrgSnapshot;
  onSelectEmployee: (e: EmployeeWithRelations) => void;
  role: 'admin' | 'hr' | 'employee' | null;
  onRefresh: () => void;
}

export function ProcessesPage({ data, onSelectEmployee, role, onRefresh }: ProcessesPageProps) {
  const { processes } = data;
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ProcessWithRelations | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<ProcessWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canWrite = can(role, 'write', 'processes');
  const canDelete = can(role, 'delete', 'processes');

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: ProcessWithRelations) => { setEditing(p); setFormOpen(true); };

  const handleSubmit = async (input: ProcessInput) => {
    setSubmitting(true);
    try {
      if (editing) await updateProcess(editing.id, input);
      else await createProcess(input);
      onRefresh();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteProcess(deleting.id);
      setDeleting(null);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : t('error.deleteFailed'));
    } finally { setDeleteLoading(false); }
  };

  const categories = useMemo(() => Array.from(new Set(processes.map((p) => p.category).filter(Boolean))) as string[], [processes]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return processes.filter((p) => {
      if (q && ![p.name, p.description ?? ''].join(' ').toLowerCase().includes(q)) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
      return true;
    });
  }, [processes, query, categoryFilter, priorityFilter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input pl-9" placeholder={t('procPage.searchPh')} value={query} onChange={(e) => setQuery(e.target.value)} />
              {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"><X size={14} /></button>}
            </div>
            {canWrite && (
              <Button variant="primary" onClick={openCreate}><Plus size={16} /> {t('procPage.addProcess')}</Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">{t('procPage.filterCategoryAll')}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="all">{t('procPage.filterPriorityAll')}</option>
              <option value="critical">{t('badge.priority.critical')}</option>
              <option value="high">{t('badge.priority.high')}</option>
              <option value="medium">{t('badge.priority.medium')}</option>
              <option value="low">{t('badge.priority.low')}</option>
            </Select>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState title={t('procPage.empty.title')} description={t('procPage.empty.desc')} icon={<Workflow size={22} />} /></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((p: ProcessWithRelations) => (
            <Card key={p.id} className="flex flex-col gap-4 relative group">
              {canWrite && canDelete && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(p)} className="rounded-md bg-white/90 hover:bg-white p-1.5 text-ink-600 hover:text-brand-600 shadow-sm border border-ink-100" title={t('common.edit')}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => setDeleting(p)} className="rounded-md bg-white/90 hover:bg-white p-1.5 text-ink-600 hover:text-red-600 shadow-sm border border-ink-100" title={t('common.delete')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
              <div className="flex items-start justify-between gap-2 pr-16">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-ink-900">{p.name}</h3>
                  <p className="text-sm text-ink-500 mt-1">{p.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <ProcessCategoryBadge category={p.category} />
                <PriorityBadge priority={p.priority} />
              </div>

              {p.owner && (
                <button
                  onClick={() => {
                    const emp = data.employees.find((e) => e.id === p.owner_id);
                    if (emp) onSelectEmployee(emp);
                  }}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-ink-50 hover:bg-ink-100 transition-colors text-left w-full"
                >
                  <Avatar src={p.owner.avatar_url} first={p.owner.first_name} last={p.owner.last_name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-ink-400">{t('procPage.owner')}</p>
                    <p className="text-sm font-medium text-ink-800 truncate">{fullName({ first_name: p.owner.first_name, last_name: p.owner.last_name })}</p>
                  </div>
                </button>
              )}

              {p.departments && p.departments.length > 0 && (
                <div className="pt-3 border-t border-ink-100">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2 flex items-center gap-1.5">
                    <Users size={12} /> {t('procPage.relatedDepts')}
                  </p>
                  <div className="space-y-1.5">
                    {p.departments.map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="text-ink-700 flex items-center gap-1.5">
                          <ArrowRight size={12} className="text-ink-400" />
                          {d.name}
                        </span>
                        {d.role && <Badge variant="outline" size="sm">{d.role}</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ProcessFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        data={data}
        process={editing}
        loading={submitting}
      />
      <ConfirmDialog
        open={!!deleting}
        title={t('confirm.deleteProcess.title')}
        message={t('confirm.deleteProcess.msg', { name: deleting?.name ?? '' })}
        confirmLabel={t('common.delete')}
        destructive
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
