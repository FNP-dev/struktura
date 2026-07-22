import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { useLang } from '../../hooks/useLang';
import type { OrgSnapshot, ProcessInput } from '../../lib/api';
import type { ProcessWithRelations } from '../../lib/types';

interface ProcessFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: ProcessInput) => Promise<void>;
  data: OrgSnapshot;
  process?: ProcessWithRelations | null;
  loading?: boolean;
}

const EMPTY: ProcessInput = {
  name: '',
  description: null,
  owner_id: null,
  category: 'Operational',
  status: 'active',
  priority: 'medium',
};

const CATEGORIES = ['Operational', 'Strategic', 'Support', 'Financial'];
const PRIORITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES = ['active', 'draft', 'archived'];

export function ProcessFormModal({ open, onClose, onSubmit, data, process, loading }: ProcessFormModalProps) {
  const { t } = useLang();
  const [form, setForm] = useState<ProcessInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (process) {
        setForm({
          name: process.name,
          description: process.description,
          owner_id: process.owner_id,
          category: process.category ?? 'Operational',
          status: process.status ?? 'active',
          priority: process.priority ?? 'medium',
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, process]);

  const set = <K extends keyof ProcessInput>(key: K, value: ProcessInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError(t('procForm.err.nameRequired'));
      return;
    }
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
      title={process ? t('procForm.title.edit') : t('procForm.title.new')}
      subtitle={process?.name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? t('procForm.saving') : process ? t('procForm.saveEdit') : t('procForm.saveNew')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <Input label={t('procForm.name')} value={form.name} onChange={(e) => set('name', e.target.value)} />
        <div>
          <label className="label">{t('procForm.description')}</label>
          <textarea
            className="input min-h-[80px] resize-y"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value || null)}
          />
        </div>
        <Select label={t('procForm.owner')} value={form.owner_id ?? ''} onChange={(e) => set('owner_id', e.target.value || null)}>
          <option value="">—</option>
          {data.employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
          ))}
        </Select>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label={t('procForm.category')} value={form.category ?? ''} onChange={(e) => set('category', e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{t(`badge.category.${c}`)}</option>)}
          </Select>
          <Select label={t('procForm.priority')} value={form.priority ?? ''} onChange={(e) => set('priority', e.target.value)}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{t(`badge.priority.${p}`)}</option>)}
          </Select>
          <Select label={t('procForm.status')} value={form.status ?? ''} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`badge.docStatus.${s}`)}</option>)}
          </Select>
        </div>
      </div>
    </Modal>
  );
}
