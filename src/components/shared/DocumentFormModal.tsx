import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { useLang } from '../../hooks/useLang';
import type { OrgSnapshot, DocumentInput } from '../../lib/api';
import type { DocumentItem } from '../../lib/types';

interface DocumentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: DocumentInput) => Promise<void>;
  data: OrgSnapshot;
  document?: DocumentItem | null;
  loading?: boolean;
}

const EMPTY: DocumentInput = {
  title: '',
  type: 'procedure',
  description: null,
  department_id: null,
  file_url: null,
  version: '1.0',
  effective_date: null,
  status: 'active',
};

const TYPES: { value: DocumentInput['type'] }[] = [
  { value: 'regulation' },
  { value: 'procedure' },
  { value: 'policy' },
  { value: 'instruction' },
];

const STATUSES = ['active', 'draft', 'archived'];

export function DocumentFormModal({ open, onClose, onSubmit, data, document: doc, loading }: DocumentFormModalProps) {
  const { t } = useLang();
  const [form, setForm] = useState<DocumentInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (doc) {
        setForm({
          title: doc.title,
          type: doc.type,
          description: doc.description,
          department_id: doc.department_id,
          file_url: doc.file_url,
          version: doc.version ?? '1.0',
          effective_date: doc.effective_date,
          status: doc.status ?? 'active',
        });
      } else {
        setForm(EMPTY);
      }
    }
  }, [open, doc]);

  const set = <K extends keyof DocumentInput>(key: K, value: DocumentInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.title.trim()) {
      setError(t('docForm.err.titleRequired'));
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
      title={doc ? t('docForm.title.edit') : t('docForm.title.new')}
      subtitle={doc?.title}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? t('docForm.saving') : doc ? t('docForm.saveEdit') : t('docForm.saveNew')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <Input label={t('docForm.title')} value={form.title} onChange={(e) => set('title', e.target.value)} />
        <div>
          <label className="label">{t('docForm.description')}</label>
          <textarea
            className="input min-h-[70px] resize-y"
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value || null)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label={t('docForm.type')} value={form.type} onChange={(e) => set('type', e.target.value as DocumentInput['type'])}>
            {TYPES.map((tp) => <option key={tp.value} value={tp.value}>{t(`badge.docType.${tp.value}`)}</option>)}
          </Select>
          <Select label={t('docForm.status')} value={form.status ?? ''} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`badge.docStatus.${s}`)}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label={t('docForm.department')} value={form.department_id ?? ''} onChange={(e) => set('department_id', e.target.value || null)}>
            <option value="">{t('docForm.departmentGeneral')}</option>
            {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Input label={t('docForm.version')} value={form.version ?? ''} onChange={(e) => set('version', e.target.value || null)} placeholder="1.0" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label={t('docForm.effectiveDate')} type="date" value={form.effective_date ?? ''} onChange={(e) => set('effective_date', e.target.value || null)} />
          <Input label={t('docForm.fileUrl')} value={form.file_url ?? ''} onChange={(e) => set('file_url', e.target.value || null)} placeholder="https://…" />
        </div>
      </div>
    </Modal>
  );
}
