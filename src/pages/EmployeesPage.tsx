import { useMemo, useState } from 'react';
import { Search, Filter, X, Users, LayoutGrid, List, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { EmployeeCard } from '../components/shared/EmployeeCard';
import { EmployeeStatusBadge } from '../components/shared/badges';
import { EmployeeFormModal } from '../components/shared/EmployeeFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/ErrorState';
import { Avatar } from '../components/ui/Avatar';
import { fullName } from '../lib/format';
import type { OrgSnapshot, EmployeeInput } from '../lib/api';
import { createEmployee, updateEmployee, deleteEmployee } from '../lib/api';
import type { EmployeeWithRelations } from '../lib/types';
import { can } from '../hooks/useAuth';
import { useLang } from '../hooks/useLang';
import { cn } from '../lib/utils';

interface EmployeesPageProps {
  data: OrgSnapshot;
  onSelectEmployee: (e: EmployeeWithRelations) => void;
  role: 'admin' | 'hr' | 'employee' | null;
  onRefresh: () => void;
}

type ViewMode = 'grid' | 'list';

export function EmployeesPage({ data, onSelectEmployee, role, onRefresh }: EmployeesPageProps) {
  const { employees, departments, locations } = data;
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [competencyFilter, setCompetencyFilter] = useState('all');
  const [view, setView] = useState<ViewMode>('grid');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeWithRelations | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<EmployeeWithRelations | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canWrite = can(role, 'write', 'employees');
  const canDelete = can(role, 'delete', 'employees');

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (e: EmployeeWithRelations) => { setEditing(e); setFormOpen(true); };

  const handleSubmit = async (input: EmployeeInput) => {
    setSubmitting(true);
    try {
      if (editing) await updateEmployee(editing.id, input);
      else await createEmployee(input);
      onRefresh();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteEmployee(deleting.id);
      setDeleting(null);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : t('error.deleteFailed'));
    } finally { setDeleteLoading(false); }
  };

  // Collect all competencies
  const allCompetencies = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => e.competencies?.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [employees]);

  const allLevels = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => e.position?.level && set.add(e.position.level));
    return Array.from(set).sort();
  }, [employees]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return employees.filter((e) => {
      if (q) {
        const haystack = [
          e.first_name, e.last_name, e.email ?? '', e.phone ?? '',
          e.position?.title ?? '', e.department?.name ?? '',
          ...(e.competencies ?? []), ...(e.specializations ?? []),
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (deptFilter !== 'all' && e.department_id !== deptFilter) return false;
      if (locationFilter !== 'all' && e.location_id !== locationFilter) return false;
      if (levelFilter !== 'all' && e.position?.level !== levelFilter) return false;
      if (competencyFilter !== 'all' && !(e.competencies ?? []).includes(competencyFilter)) return false;
      return true;
    });
  }, [employees, query, deptFilter, locationFilter, levelFilter, competencyFilter]);

  const activeFilters = [deptFilter, locationFilter, levelFilter, competencyFilter].filter((f) => f !== 'all').length;

  const clearFilters = () => {
    setDeptFilter('all');
    setLocationFilter('all');
    setLevelFilter('all');
    setCompetencyFilter('all');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                className="input pl-9"
                placeholder={t('empPage.searchPh')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {canWrite && (
                <Button variant="primary" size="md" onClick={openCreate}>
                  <Plus size={16} /> {t('empPage.addEmployee')}
                </Button>
              )}
              <div className="flex gap-1 rounded-lg bg-ink-100 p-1">
                <button
                  onClick={() => setView('grid')}
                  className={cn('p-1.5 rounded-md transition-all', view === 'grid' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}
                  aria-label="Siatka"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn('p-1.5 rounded-md transition-all', view === 'list' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}
                  aria-label="Lista"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input
                className="input pl-9"
                placeholder={t('empPage.searchPh')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex gap-1 rounded-lg bg-ink-100 p-1">
                <button
                  onClick={() => setView('grid')}
                  className={cn('p-1.5 rounded-md transition-all', view === 'grid' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}
                  aria-label="Siatka"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn('p-1.5 rounded-md transition-all', view === 'list' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500')}
                  aria-label="Lista"
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select label={t('empPage.filterDept')} value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="all">{t('empPage.filterDeptAll')}</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
            <Select label={t('empPage.filterLocation')} value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="all">{t('empPage.filterLocationAll')}</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </Select>
            <Select label={t('empPage.filterLevel')} value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="all">{t('empPage.filterLevelAll')}</option>
              {allLevels.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </Select>
            <Select label={t('empPage.filterCompetency')} value={competencyFilter} onChange={(e) => setCompetencyFilter(e.target.value)}>
              <option value="all">{t('empPage.filterCompetencyAll')}</option>
              {allCompetencies.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>

          <div className="flex items-center justify-between text-xs text-ink-500">
            <span className="flex items-center gap-1.5">
              <Filter size={12} />
              {t('empPage.results', { found: filtered.length, total: employees.length })}
              {activeFilters > 0 && <span className="text-brand-600">· {t('empPage.filtersActive', { count: activeFilters })}</span>}
            </span>
            {activeFilters > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X size={12} /> {t('empPage.clearFilters')}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            title={t('empPage.empty.title')}
            description={t('empPage.empty.desc')}
            icon={<Users size={22} />}
          />
        </Card>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((e) => (
            <div key={e.id} className="relative group">
              <EmployeeCard employee={e} onClick={onSelectEmployee} />
              {canWrite && canDelete && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(ev) => { ev.stopPropagation(); openEdit(e); }} className="rounded-md bg-white/90 hover:bg-white p-1.5 text-ink-600 hover:text-brand-600 shadow-sm border border-ink-100" title={t('common.edit')}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={(ev) => { ev.stopPropagation(); setDeleting(e); }} className="rounded-md bg-white/90 hover:bg-white p-1.5 text-ink-600 hover:text-red-600 shadow-sm border border-ink-100" title={t('common.delete')}>
                    <Trash2 size={13} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-xs text-ink-500 uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-3">{t('empPage.colEmployee')}</th>
                <th className="text-left font-medium px-4 py-3 hidden md:table-cell">{t('empPage.colPosition')}</th>
                <th className="text-left font-medium px-4 py-3 hidden lg:table-cell">{t('empPage.colDepartment')}</th>
                <th className="text-left font-medium px-4 py-3 hidden xl:table-cell">{t('empPage.colLocation')}</th>
                <th className="text-left font-medium px-4 py-3">{t('empPage.colStatus')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {filtered.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => onSelectEmployee(e)}
                  className="hover:bg-ink-50 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar src={e.avatar_url} first={e.first_name} last={e.last_name} size="sm" />
                      <div className="min-w-0">
                        <p className="font-medium text-ink-900 truncate flex items-center gap-1.5">
                          {fullName(e)}
                          {e.is_board_member && <Badge variant="brand" size="sm">{t('badge.board')}</Badge>}
                        </p>
                        <p className="text-xs text-ink-400 truncate md:hidden">{e.position?.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-ink-600">{e.position?.title ?? '—'}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-ink-600">{e.department?.name ?? '—'}</td>
                  <td className="px-4 py-3 hidden xl:table-cell text-ink-600">{e.location?.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <EmployeeStatusBadge status={e.status} />
                      {canWrite && canDelete && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={(ev) => { ev.stopPropagation(); openEdit(e); }} className="rounded p-1 text-ink-400 hover:text-brand-600" title={t('common.edit')}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={(ev) => { ev.stopPropagation(); setDeleting(e); }} className="rounded p-1 text-ink-400 hover:text-red-600" title={t('common.delete')}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <EmployeeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        data={data}
        employee={editing}
        loading={submitting}
        role={role}
      />
      <ConfirmDialog
        open={!!deleting}
        title={t('confirm.deleteEmployee.title')}
        message={t('confirm.deleteEmployee.msg', { name: deleting ? fullName(deleting) : '' })}
        confirmLabel={t('common.delete')}
        destructive
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
