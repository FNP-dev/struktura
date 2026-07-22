import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { useLang } from '../../hooks/useLang';
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

export function GoalFormModal({ open, onClose, onSubmit, data, goal, defaultEmployeeId, loading }: GoalFormModalProps) {
  const { t } = useLang();
  const [form, setForm] = useState<GoalInput>(EMPTY_GOAL);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (goal) {
        setForm({
          employee_id: goal.employee_id,
          title: goal.title,
          description: goal.description,
          goal_type: goal.goal_type,
          quarter: goal.quarter,
          target_date: goal.target_date,
          progress: goal.progress,
          status: goal.status,
          created_by: goal.created_by,
        });
      } else {
        setForm({ ...EMPTY_GOAL, employee_id: defaultEmployeeId ?? '' });
      }
    }
  }, [open, goal, defaultEmployeeId]);

  const set = <K extends keyof GoalInput>(key: K, value: GoalInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim()) { setError(t('goalForm.err.titleRequired')); return; }
    if (!form.employee_id) { setError(t('goalForm.err.employeeRequired')); return; }
    try {
      await onSubmit(form);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error.generic'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={goal ? t('goalForm.title.edit') : t('goalForm.title.new')}
      subtitle={goal?.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? t('goalForm.saving') : goal ? t('goalForm.saveEdit') : t('goalForm.saveNew')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Select label={t('goalForm.employee')} value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)}>
          <option value="">{t('common.select')}</option>
          {data.employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
          ))}
        </Select>
        <Input label={t('goalForm.title')} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder={t('goalForm.titlePh')} />
        <div>
          <label className="label">{t('goalForm.description')}</label>
          <textarea className="input min-h-[70px] resize-y" value={form.description ?? ''} onChange={(e) => set('description', e.target.value || null)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label={t('goalForm.type')} value={form.goal_type} onChange={(e) => set('goal_type', e.target.value as GoalInput['goal_type'])}>
            <option value="quarter">{t('goalForm.typeQuarter')}</option>
            <option value="okr">{t('goalForm.typeOkr')}</option>
          </Select>
          <Input label={t('goalForm.quarter')} value={form.quarter ?? ''} onChange={(e) => set('quarter', e.target.value || null)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label={t('goalForm.targetDate')} type="date" value={form.target_date ?? ''} onChange={(e) => set('target_date', e.target.value || null)} />
          <Select label={t('goalForm.status')} value={form.status} onChange={(e) => set('status', e.target.value as GoalInput['status'])}>
            <option value="active">{t('perfPage.goalStatus.active')}</option>
            <option value="completed">{t('perfPage.goalStatus.completed')}</option>
            <option value="overdue">{t('perfPage.goalStatus.overdue')}</option>
          </Select>
        </div>
        <div>
          <label className="label">{t('goalForm.progress', { value: form.progress })}</label>
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

export function ReviewFormModal({ open, onClose, onSubmit, data, review, defaultEmployeeId, loading }: ReviewFormModalProps) {
  const { t } = useLang();
  const [form, setForm] = useState<ReviewInput>(EMPTY_REVIEW);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (review) {
        setForm({
          employee_id: review.employee_id,
          review_period: review.review_period,
          review_type: review.review_type,
          manager_rating: review.manager_rating,
          self_rating: review.self_rating,
          manager_feedback: review.manager_feedback,
          self_assessment: review.self_assessment,
          status: review.status,
          reviewed_by: review.reviewed_by,
        });
      } else {
        setForm({ ...EMPTY_REVIEW, employee_id: defaultEmployeeId ?? '' });
      }
    }
  }, [open, review, defaultEmployeeId]);

  const set = <K extends keyof ReviewInput>(key: K, value: ReviewInput[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.employee_id) { setError(t('reviewForm.err.employeeRequired')); return; }
    try {
      await onSubmit(form);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error.generic'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={review ? t('reviewForm.title.edit') : t('reviewForm.title.new')}
      subtitle={review?.review_period ?? undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? t('reviewForm.saving') : review ? t('reviewForm.saveEdit') : t('reviewForm.saveNew')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Select label={t('reviewForm.employee')} value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)}>
          <option value="">{t('common.select')}</option>
          {data.employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
          ))}
        </Select>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label={t('reviewForm.period')} value={form.review_period ?? ''} onChange={(e) => set('review_period', e.target.value || null)} />
          <Select label={t('reviewForm.type')} value={form.review_type} onChange={(e) => set('review_type', e.target.value as ReviewInput['review_type'])}>
            <option value="periodic">{t('reviewForm.typePeriodic')}</option>
            <option value="okr">{t('reviewForm.typeOkr')}</option>
            <option value="annual">{t('reviewForm.typeAnnual')}</option>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('reviewForm.managerRating')}</label>
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
            <label className="label">{t('reviewForm.selfRating')}</label>
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
          <label className="label">{t('reviewForm.managerFeedback')}</label>
          <textarea className="input min-h-[70px] resize-y" value={form.manager_feedback ?? ''} onChange={(e) => set('manager_feedback', e.target.value || null)} placeholder={t('reviewForm.managerFeedbackPh')} />
        </div>
        <div>
          <label className="label">{t('reviewForm.selfAssessment')}</label>
          <textarea className="input min-h-[70px] resize-y" value={form.self_assessment ?? ''} onChange={(e) => set('self_assessment', e.target.value || null)} placeholder={t('reviewForm.selfAssessmentPh')} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label={t('reviewForm.reviewedBy')} value={form.reviewed_by ?? ''} onChange={(e) => set('reviewed_by', e.target.value || null)} />
          <Select label={t('reviewForm.status')} value={form.status} onChange={(e) => set('status', e.target.value as ReviewInput['status'])}>
            <option value="draft">{t('perfPage.reviewStatus.draft')}</option>
            <option value="submitted">{t('perfPage.reviewStatus.submitted')}</option>
            <option value="acknowledged">{t('perfPage.reviewStatus.acknowledged')}</option>
          </Select>
        </div>
      </div>
    </Modal>
  );
}
