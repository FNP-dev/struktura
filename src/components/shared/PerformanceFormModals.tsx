import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import type { GoalInput, ReviewInput, OrgSnapshot } from '../../lib/api';
import type { PerformanceGoal, PerformanceReview } from '../../lib/types';

// ============ Goal Form ============
interface GoalFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: GoalInput) => Promise<void>;
  data: OrgSnapshot;
  goal?: PerformanceGoal | null;
  defaultEmployeeId?: string | null;
  loading?: boolean;
}

const EMPTY_GOAL: GoalInput = {
  employee_id: '',
  title: '',
  description: null,
  goal_type: 'quarter',
  quarter: null,
  target_date: null,
  progress: 0,
  status: 'active',
  created_by: null,
};

export function GoalFormModal(props: GoalFormModalProps) {
  if (!props.open) return null;

  const key = props.goal
    ? `goal-${props.goal.employee_id}-${props.goal.title}`
    : `goal-${props.defaultEmployeeId ?? 'new'}`;

  return <GoalFormModalContent key={key} {...props} />;
}

function GoalFormModalContent({ onClose, onSubmit, data, goal, defaultEmployeeId, loading }: GoalFormModalProps) {
  const [form, setForm] = useState<GoalInput>(() => goal ? {
    employee_id: goal.employee_id,
    title: goal.title,
    description: goal.description,
    goal_type: goal.goal_type,
    quarter: goal.quarter,
    target_date: goal.target_date,
    progress: goal.progress,
    status: goal.status,
    created_by: goal.created_by,
  } : { ...EMPTY_GOAL, employee_id: defaultEmployeeId ?? '' });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof GoalInput>(key: K, value: GoalInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim()) { setError('Tytuł celu jest wymagany.'); return; }
    if (!form.employee_id) { setError('Wybierz pracownika.'); return; }
    try {
      await onSubmit(form);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wystąpił błąd');
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="md"
      title={goal ? 'Edytuj cel' : 'Nowy cel / OKR'}
      subtitle={goal?.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Anuluj</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Zapisywanie…' : goal ? 'Zapisz zmiany' : 'Dodaj cel'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Select label="Pracownik *" value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)}>
          <option value="">— wybierz —</option>
          {data.employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
          ))}
        </Select>
        <Input label="Tytuł celu *" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="np. Zwiększenie sprzedaży o 15%" />
        <div>
          <label className="label">Opis / Kluczowe rezultaty</label>
          <textarea className="input min-h-[70px] resize-y" value={form.description ?? ''} onChange={(e) => set('description', e.target.value || null)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Typ" value={form.goal_type} onChange={(e) => set('goal_type', e.target.value as GoalInput['goal_type'])}>
            <option value="quarter">Cel kwartalny</option>
            <option value="okr">OKR</option>
          </Select>
          <Input label="Okres (np. 2026-Q1)" value={form.quarter ?? ''} onChange={(e) => set('quarter', e.target.value || null)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Termin" type="date" value={form.target_date ?? ''} onChange={(e) => set('target_date', e.target.value || null)} />
          <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value as GoalInput['status'])}>
            <option value="active">Aktywny</option>
            <option value="completed">Zrealizowany</option>
            <option value="overdue">Przeterminowany</option>
          </Select>
        </div>
        <div>
          <label className="label">Postęp: {form.progress}%</label>
          <input type="range" min={0} max={100} step={5} value={form.progress} onChange={(e) => set('progress', Number(e.target.value))} className="w-full accent-brand-600" />
        </div>
      </div>
    </Modal>
  );
}

// ============ Review Form ============
interface ReviewFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ReviewInput) => Promise<void>;
  data: OrgSnapshot;
  review?: PerformanceReview | null;
  defaultEmployeeId?: string | null;
  loading?: boolean;
}

const EMPTY_REVIEW: ReviewInput = {
  employee_id: '',
  review_period: null,
  review_type: 'periodic',
  manager_rating: null,
  self_rating: null,
  manager_feedback: null,
  self_assessment: null,
  status: 'draft',
  reviewed_by: null,
};

export function ReviewFormModal(props: ReviewFormModalProps) {
  if (!props.open) return null;

  const key = props.review
    ? `review-${props.review.employee_id}-${props.review.review_period ?? ''}-${props.review.review_type}`
    : `review-${props.defaultEmployeeId ?? 'new'}`;

  return <ReviewFormModalContent key={key} {...props} />;
}

function ReviewFormModalContent({ onClose, onSubmit, data, review, defaultEmployeeId, loading }: ReviewFormModalProps) {
  const [form, setForm] = useState<ReviewInput>(() => review ? {
    employee_id: review.employee_id,
    review_period: review.review_period,
    review_type: review.review_type,
    manager_rating: review.manager_rating,
    self_rating: review.self_rating,
    manager_feedback: review.manager_feedback,
    self_assessment: review.self_assessment,
    status: review.status,
    reviewed_by: review.reviewed_by,
  } : { ...EMPTY_REVIEW, employee_id: defaultEmployeeId ?? '' });
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ReviewInput>(key: K, value: ReviewInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.employee_id) { setError('Wybierz pracownika.'); return; }
    try {
      await onSubmit(form);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wystąpił błąd');
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      size="lg"
      title={review ? 'Edytuj ocenę' : 'Nowa ocena pracownicza'}
      subtitle={review?.review_period ?? undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Anuluj</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Zapisywanie…' : review ? 'Zapisz zmiany' : 'Dodaj ocenę'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Select label="Pracownik *" value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)}>
          <option value="">— wybierz —</option>
          {data.employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
          ))}
        </Select>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Okres (np. 2026-Q1, 2026-H1)" value={form.review_period ?? ''} onChange={(e) => set('review_period', e.target.value || null)} />
          <Select label="Typ oceny" value={form.review_type} onChange={(e) => set('review_type', e.target.value as ReviewInput['review_type'])}>
            <option value="periodic">Ocena okresowa</option>
            <option value="okr">Ocena OKR</option>
            <option value="annual">Ocena roczna</option>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Ocena managera (1-5)</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set('manager_rating', n)}
                  className={`h-10 w-10 rounded-lg border text-sm font-semibold transition-all ${
                    form.manager_rating === n
                      ? 'bg-brand-600 text-white border-brand-600 scale-110'
                      : 'bg-white text-ink-600 border-ink-200 hover:border-brand-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Samoocena pracownika (1-5)</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => set('self_rating', n)}
                  className={`h-10 w-10 rounded-lg border text-sm font-semibold transition-all ${
                    form.self_rating === n
                      ? 'bg-sky-600 text-white border-sky-600 scale-110'
                      : 'bg-white text-ink-600 border-ink-200 hover:border-sky-400'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className="label">Feedback managera</label>
          <textarea className="input min-h-[70px] resize-y" value={form.manager_feedback ?? ''} onChange={(e) => set('manager_feedback', e.target.value || null)} placeholder="Mocne strony, obszary do rozwoju…" />
        </div>
        <div>
          <label className="label">Samoocena pracownika</label>
          <textarea className="input min-h-[70px] resize-y" value={form.self_assessment ?? ''} onChange={(e) => set('self_assessment', e.target.value || null)} placeholder="Refleksja pracownika nad własną pracą…" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Oceniający (email)" value={form.reviewed_by ?? ''} onChange={(e) => set('reviewed_by', e.target.value || null)} />
          <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value as ReviewInput['status'])}>
            <option value="draft">Robocza</option>
            <option value="submitted">Przekazana</option>
            <option value="acknowledged">Potwierdzona</option>
          </Select>
        </div>
      </div>
    </Modal>
  );
}
