import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { useLang } from '../../hooks/useLang';
import type { OrgSnapshot, PositionInput } from '../../lib/api';
import type { Position } from '../../lib/types';

interface PositionFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: PositionInput) => Promise<void>;
  data: OrgSnapshot;
  position?: Position | null;
  loading?: boolean;
}

const EMPTY: PositionInput = {
  title: '',
  department_id: null,
  description: null,
  responsibilities: null,
  decision_rights: null,
  requirements: null,
  level: 'Specialist',
  min_salary: null,
  max_salary: null,
  is_vacant: false,
};

const LEVELS = ['C-level', 'Director', 'Manager', 'Specialist', 'Junior'];

export function PositionFormModal({ open, onClose, onSubmit, data, position, loading }: PositionFormModalProps) {
  const { t } = useLang();
  const [form, setForm] = useState<PositionInput>(EMPTY);
  const [responsibilitiesText, setResponsibilitiesText] = useState('');
  const [requirementsText, setRequirementsText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (position) {
        setForm({
          title: position.title,
          department_id: position.department_id,
          description: position.description,
          responsibilities: position.responsibilities,
          decision_rights: position.decision_rights,
          requirements: position.requirements,
          level: position.level ?? 'Specialist',
          min_salary: position.min_salary,
          max_salary: position.max_salary,
          is_vacant: position.is_vacant,
        });
        setResponsibilitiesText((position.responsibilities ?? []).join('\n'));
        setRequirementsText((position.requirements ?? []).join(', '));
      } else {
        setForm(EMPTY);
        setResponsibilitiesText('');
        setRequirementsText('');
      }
    }
  }, [open, position]);

  const set = <K extends keyof PositionInput>(key: K, value: PositionInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError(t('posForm.err.titleRequired'));
      return;
    }
    const responsibilities = responsibilitiesText.split('\n').map((s) => s.trim()).filter(Boolean);
    const requirements = requirementsText.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      await onSubmit({
        ...form,
        min_salary: form.min_salary ? Number(form.min_salary) : null,
        max_salary: form.max_salary ? Number(form.max_salary) : null,
        responsibilities: responsibilities.length ? responsibilities : null,
        requirements: requirements.length ? requirements : null,
      });
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
      title={position ? t('posForm.title.edit') : t('posForm.title.new')}
      subtitle={position?.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? t('posForm.saving') : position ? t('posForm.saveEdit') : t('posForm.saveNew')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <Input label={t('posForm.title')} value={form.title} onChange={(e) => set('title', e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label={t('posForm.department')} value={form.department_id ?? ''} onChange={(e) => set('department_id', e.target.value || null)}>
            <option value="">—</option>
            {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select label={t('posForm.level')} value={form.level ?? ''} onChange={(e) => set('level', e.target.value || null)}>
            {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label={t('posForm.minSalary')} type="number" value={form.min_salary ?? ''} onChange={(e) => set('min_salary', e.target.value ? Number(e.target.value) : null)} />
          <Input label={t('posForm.maxSalary')} type="number" value={form.max_salary ?? ''} onChange={(e) => set('max_salary', e.target.value ? Number(e.target.value) : null)} />
        </div>
        <div>
          <label className="label">{t('posForm.description')}</label>
          <textarea
            className="input min-h-[80px] resize-y"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value || null)}
          />
        </div>
        <div>
          <label className="label">{t('posForm.responsibilities')}</label>
          <textarea
            className="input min-h-[120px] resize-y font-mono text-xs"
            value={responsibilitiesText}
            onChange={(e) => setResponsibilitiesText(e.target.value)}
            placeholder={t('posForm.responsibilitiesPh')}
          />
        </div>
        <div>
          <label className="label">{t('posForm.decisionRights')}</label>
          <textarea
            className="input min-h-[60px] resize-y"
            value={form.decision_rights ?? ''}
            onChange={(e) => set('decision_rights', e.target.value || null)}
          />
        </div>
        <Input label={t('posForm.requirements')} value={requirementsText} onChange={(e) => setRequirementsText(e.target.value)} placeholder={t('posForm.requirementsPh')} />
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_vacant}
            onChange={(e) => set('is_vacant', e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200"
          />
          <span className="text-sm text-ink-700">{t('posForm.isVacant')}</span>
        </label>
      </div>
    </Modal>
  );
}
