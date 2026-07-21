import { useMemo, useState } from 'react';
import { Target, ClipboardList, Plus, Pencil, Trash2, Search, X, TrendingUp, Calendar, Star } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/ErrorState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { GoalFormModal, ReviewFormModal } from '../components/shared/PerformanceFormModals';
import { fullName, formatDate } from '../lib/format';
import { can } from '../hooks/useAuth';
import type { OrgSnapshot, GoalInput, ReviewInput } from '../lib/api';
import { createGoal, updateGoal, deleteGoal, createReview, updateReview, deleteReview } from '../lib/api';
import type { PerformanceGoal, PerformanceReview } from '../lib/types';

interface PerformancePageProps {
  data: OrgSnapshot;
  role: 'admin' | 'hr' | 'employee' | null;
  onRefresh: () => void;
}

type Tab = 'goals' | 'reviews' | 'history';

export function PerformancePage({ data, role, onRefresh }: PerformancePageProps) {
  const [tab, setTab] = useState<Tab>('goals');
  const [query, setQuery] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);
  const [deleting, setDeleting] = useState<{ kind: 'goal' | 'review'; id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [historyEmployee, setHistoryEmployee] = useState<string>('all');

  const canWrite = can(role, 'write', 'performance');
  const canDelete = can(role, 'delete', 'performance');

  const handleGoalSubmit = async (input: GoalInput) => {
    setSubmitting(true);
    try {
      if (editingGoal) await updateGoal(editingGoal.id, input);
      else await createGoal(input);
      onRefresh();
    } finally { setSubmitting(false); }
  };

  const handleReviewSubmit = async (input: ReviewInput) => {
    setSubmitting(true);
    try {
      if (editingReview) await updateReview(editingReview.id, input);
      else await createReview(input);
      onRefresh();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      if (deleting.kind === 'goal') await deleteGoal(deleting.id);
      else await deleteReview(deleting.id);
      setDeleting(null);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Nie udało się usunąć');
    } finally { setDeleteLoading(false); }
  };

  const filteredGoals = useMemo(() => {
    const q = query.toLowerCase().trim();
    return data.goals.filter((g) => {
      if (employeeFilter !== 'all' && g.employee_id !== employeeFilter) return false;
      if (q && ![g.title, g.description ?? '', g.quarter ?? ''].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.goals, query, employeeFilter]);

  const filteredReviews = useMemo(() => {
    const q = query.toLowerCase().trim();
    return data.reviews.filter((r) => {
      if (employeeFilter !== 'all' && r.employee_id !== employeeFilter) return false;
      if (q && ![r.review_period ?? '', r.manager_feedback ?? '', r.self_assessment ?? ''].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data.reviews, query, employeeFilter]);

  const historyEmployeeObj = data.employees.find((e) => e.id === historyEmployee) ?? null;
  const employeeGoals = data.goals.filter((g) => g.employee_id === historyEmployee);
  const employeeReviews = data.reviews.filter((r) => r.employee_id === historyEmployee);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input pl-9" placeholder="Szukaj…" value={query} onChange={(e) => setQuery(e.target.value)} />
              {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"><X size={14} /></button>}
            </div>
            <Select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} containerClassName="sm:w-56">
              <option value="all">Wszyscy pracownicy</option>
              {data.employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
              ))}
            </Select>
            {canWrite && tab !== 'history' && (
              <Button
                variant="primary"
                onClick={() => tab === 'goals' ? (setEditingGoal(null), setGoalFormOpen(true)) : (setEditingReview(null), setReviewFormOpen(true))}
              >
                <Plus size={16} /> {tab === 'goals' ? 'Dodaj cel' : 'Dodaj ocenę'}
              </Button>
            )}
          </div>
          <div className="flex gap-1 rounded-lg bg-ink-100 p-1 w-fit">
            <TabButton active={tab === 'goals'} onClick={() => setTab('goals')} icon={<Target size={14} />}>Cele / OKR</TabButton>
            <TabButton active={tab === 'reviews'} onClick={() => setTab('reviews')} icon={<ClipboardList size={14} />}>Oceny okresowe</TabButton>
            <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={<TrendingUp size={14} />}>Historia</TabButton>
          </div>
        </div>
      </Card>

      {tab === 'goals' && (
        filteredGoals.length === 0 ? (
          <Card><EmptyState title="Brak celów" description="Nie znaleziono celów spełniających kryteria." icon={<Target size={22} />} /></Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredGoals.map((g) => {
              const emp = data.employees.find((e) => e.id === g.employee_id);
              return (
                <Card key={g.id} className="relative group">
                  {canWrite && canDelete && (
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingGoal(g); setGoalFormOpen(true); }} className="rounded-md bg-white/90 hover:bg-white p-1.5 text-ink-600 hover:text-brand-600 shadow-sm border border-ink-100" title="Edytuj">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleting({ kind: 'goal', id: g.id, name: g.title })} className="rounded-md bg-white/90 hover:bg-white p-1.5 text-ink-600 hover:text-red-600 shadow-sm border border-ink-100" title="Usuń">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-start gap-3 pr-16">
                    <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${g.goal_type === 'okr' ? 'bg-violet-50 text-violet-700' : 'bg-brand-50 text-brand-700'}`}>
                      {g.goal_type === 'okr' ? <Target size={15} /> : <TrendingUp size={15} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-ink-900">{g.title}</h3>
                      {g.description && <p className="text-xs text-ink-500 mt-1 line-clamp-2">{g.description}</p>}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge variant={g.goal_type === 'okr' ? 'brand' : 'outline'} size="sm">{g.goal_type === 'okr' ? 'OKR' : 'Kwartalny'}</Badge>
                    {g.quarter && <Badge variant="outline" size="sm">{g.quarter}</Badge>}
                    <Badge variant={g.status === 'completed' ? 'success' : g.status === 'overdue' ? 'error' : 'outline'} size="sm">
                      {g.status === 'completed' ? 'Zrealizowany' : g.status === 'overdue' ? 'Przeterminowany' : 'Aktywny'}
                    </Badge>
                  </div>
                  {g.target_date && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-400">
                      <Calendar size={12} /> Termin: {formatDate(g.target_date)}
                    </p>
                  )}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-ink-500 mb-1">
                      <span>Postęp</span><span>{g.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${g.progress >= 100 ? 'bg-emerald-500' : g.progress >= 50 ? 'bg-brand-500' : 'bg-amber-500'}`}
                        style={{ width: `${g.progress}%` }}
                      />
                    </div>
                  </div>
                  {emp && (
                    <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-2">
                      <Avatar src={emp.avatar_url} first={emp.first_name} last={emp.last_name} size="xs" />
                      <span className="text-xs text-ink-600">{fullName(emp)}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}

      {tab === 'reviews' && (
        filteredReviews.length === 0 ? (
          <Card><EmptyState title="Brak ocen" description="Nie znaleziono ocen spełniających kryteria." icon={<ClipboardList size={22} />} /></Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredReviews.map((r) => {
              const emp = data.employees.find((e) => e.id === r.employee_id);
              return (
                <Card key={r.id} className="relative group">
                  {canWrite && canDelete && (
                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingReview(r); setReviewFormOpen(true); }} className="rounded-md bg-white/90 hover:bg-white p-1.5 text-ink-600 hover:text-brand-600 shadow-sm border border-ink-100" title="Edytuj">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleting({ kind: 'review', id: r.id, name: r.review_period ?? r.review_type })} className="rounded-md bg-white/90 hover:bg-white p-1.5 text-ink-600 hover:text-red-600 shadow-sm border border-ink-100" title="Usuń">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                  <div className="flex items-start gap-3 pr-16">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-ink-900">{r.review_period ?? 'Ocena'}</h3>
                        <Badge variant="outline" size="sm">
                          {r.review_type === 'periodic' ? 'Okresowa' : r.review_type === 'okr' ? 'OKR' : 'Roczna'}
                        </Badge>
                      </div>
                      <Badge variant={r.status === 'acknowledged' ? 'success' : r.status === 'submitted' ? 'brand' : 'outline'} size="sm" className="mt-1">
                        {r.status === 'acknowledged' ? 'Potwierdzona' : r.status === 'submitted' ? 'Przekazana' : 'Robocza'}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <RatingBlock label="Ocena managera" rating={r.manager_rating} color="brand" />
                    <RatingBlock label="Samoocena" rating={r.self_rating} color="sky" />
                  </div>
                  {r.manager_feedback && (
                    <div className="mt-3 pt-3 border-t border-ink-100">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1">Feedback managera</p>
                      <p className="text-xs text-ink-600">{r.manager_feedback}</p>
                    </div>
                  )}
                  {r.self_assessment && (
                    <div className="mt-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1">Samoocena</p>
                      <p className="text-xs text-ink-600">{r.self_assessment}</p>
                    </div>
                  )}
                  {emp && (
                    <div className="mt-3 pt-3 border-t border-ink-100 flex items-center gap-2">
                      <Avatar src={emp.avatar_url} first={emp.first_name} last={emp.last_name} size="xs" />
                      <span className="text-xs text-ink-600">{fullName(emp)}</span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <Card>
            <Select label="Pracownik" value={historyEmployee} onChange={(e) => setHistoryEmployee(e.target.value)}>
              <option value="all">— wybierz pracownika —</option>
              {data.employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
              ))}
            </Select>
          </Card>
          {!historyEmployeeObj ? (
            <Card><EmptyState title="Wybierz pracownika" description="Wybierz pracownika, aby zobaczyć historię jego celów i ocen." icon={<TrendingUp size={22} />} /></Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <div className="flex items-center gap-3">
                  <Avatar src={historyEmployeeObj.avatar_url} first={historyEmployeeObj.first_name} last={historyEmployeeObj.last_name} size="md" />
                  <div>
                    <h3 className="text-base font-semibold text-ink-900">{fullName(historyEmployeeObj)}</h3>
                    <p className="text-sm text-ink-500">{historyEmployeeObj.position?.title ?? '—'}</p>
                  </div>
                </div>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <h4 className="text-sm font-semibold text-ink-900 mb-3 flex items-center gap-2"><Target size={15} /> Cele ({employeeGoals.length})</h4>
                  {employeeGoals.length === 0 ? (
                    <p className="text-xs text-ink-400">Brak celów.</p>
                  ) : (
                    <div className="space-y-2">
                      {employeeGoals.map((g) => (
                        <div key={g.id} className="rounded-lg border border-ink-100 p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-ink-800 truncate">{g.title}</span>
                            <Badge variant={g.status === 'completed' ? 'success' : g.status === 'overdue' ? 'error' : 'outline'} size="sm">
                              {g.status === 'completed' ? 'Zrealizowany' : g.status === 'overdue' ? 'Przeterminowany' : 'Aktywny'}
                            </Badge>
                          </div>
                          {g.quarter && <p className="text-[11px] text-ink-400 mt-0.5">{g.quarter}</p>}
                          <div className="mt-1.5 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${g.progress}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
                <Card>
                  <h4 className="text-sm font-semibold text-ink-900 mb-3 flex items-center gap-2"><ClipboardList size={15} /> Oceny ({employeeReviews.length})</h4>
                  {employeeReviews.length === 0 ? (
                    <p className="text-xs text-ink-400">Brak ocen.</p>
                  ) : (
                    <div className="space-y-2">
                      {employeeReviews.map((r) => (
                        <div key={r.id} className="rounded-lg border border-ink-100 p-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-ink-800">{r.review_period ?? r.review_type}</span>
                            <Badge variant={r.status === 'acknowledged' ? 'success' : r.status === 'submitted' ? 'brand' : 'outline'} size="sm">
                              {r.status === 'acknowledged' ? 'Potwierdzona' : r.status === 'submitted' ? 'Przekazana' : 'Robocza'}
                            </Badge>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-ink-500">
                            <span className="flex items-center gap-1"><Star size={10} className="text-brand-500" /> M: {r.manager_rating ?? '—'}</span>
                            <span className="flex items-center gap-1"><Star size={10} className="text-sky-500" /> S: {r.self_rating ?? '—'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      <GoalFormModal
        open={goalFormOpen}
        onClose={() => setGoalFormOpen(false)}
        onSubmit={handleGoalSubmit}
        data={data}
        goal={editingGoal}
        loading={submitting}
      />
      <ReviewFormModal
        open={reviewFormOpen}
        onClose={() => setReviewFormOpen(false)}
        onSubmit={handleReviewSubmit}
        data={data}
        review={editingReview}
        loading={submitting}
      />
      <ConfirmDialog
        open={!!deleting}
        title={deleting?.kind === 'goal' ? 'Usunąć cel?' : 'Usunąć ocenę?'}
        message={`Czy na pewno chcesz usunąć "${deleting?.name ?? ''}"? Tej operacji nie można cofnąć.`}
        confirmLabel="Usuń"
        destructive
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
        active ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
      }`}
    >
      {icon} {children}
    </button>
  );
}

function RatingBlock({ label, rating, color }: { label: string; rating: number | null; color: 'brand' | 'sky' }) {
  const activeClass = color === 'brand' ? 'bg-brand-500 text-white border-brand-500' : 'bg-sky-500 text-white border-sky-500';
  return (
    <div className="rounded-lg bg-ink-50 p-2.5">
      <p className="text-[11px] text-ink-500 mb-1.5">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className={`h-6 w-6 rounded flex items-center justify-center text-[11px] font-semibold border ${
              rating && n <= rating ? activeClass : 'bg-white border-ink-200 text-ink-300'
            }`}
          >
            {n}
          </span>
        ))}
      </div>
    </div>
  );
}
