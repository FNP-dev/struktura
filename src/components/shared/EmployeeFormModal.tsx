import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { useLang } from '../../hooks/useLang';
import type { OrgSnapshot, EmployeeInput } from '../../lib/api';
import type { EmployeeWithRelations } from '../../lib/types';

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: EmployeeInput) => Promise<void>;
  data: OrgSnapshot;
  employee?: EmployeeWithRelations | null;
  loading?: boolean;
  role: 'admin' | 'hr' | 'employee' | null;
}

const EMPTY: EmployeeInput = {
  first_name: '',
  last_name: '',
  email: null,
  phone: null,
  position_id: null,
  department_id: null,
  manager_id: null,
  location_id: null,
  avatar_url: null,
  competencies: null,
  specializations: null,
  hire_date: null,
  status: 'active',
  is_board_member: false,
  salary: null,
  leave_used_days: 0,
  sick_days: 0,
};

export function EmployeeFormModal({ open, onClose, onSubmit, data, employee, loading, role }: EmployeeFormModalProps) {
  const { t } = useLang();
  const [form, setForm] = useState<EmployeeInput>(EMPTY);
  const [competenciesText, setCompetenciesText] = useState('');
  const [specializationsText, setSpecializationsText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (employee) {
        setForm({
          first_name: employee.first_name,
          last_name: employee.last_name,
          email: employee.email,
          phone: employee.phone,
          position_id: employee.position_id,
          department_id: employee.department_id,
          manager_id: employee.manager_id,
          location_id: employee.location_id,
          avatar_url: employee.avatar_url,
          competencies: employee.competencies,
          specializations: employee.specializations,
          hire_date: employee.hire_date,
          status: employee.status,
          is_board_member: employee.is_board_member,
          salary: employee.salary,
          leave_used_days: employee.leave_used_days,
          sick_days: employee.sick_days,
        });
        setCompetenciesText((employee.competencies ?? []).join(', '));
        setSpecializationsText((employee.specializations ?? []).join(', '));
      } else {
        setForm(EMPTY);
        setCompetenciesText('');
        setSpecializationsText('');
      }
    }
  }, [open, employee]);

  const set = <K extends keyof EmployeeInput>(key: K, value: EmployeeInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError(t('empForm.err.nameRequired'));
      return;
    }
    const competencies = competenciesText.split(',').map((s) => s.trim()).filter(Boolean);
    const specializations = specializationsText.split(',').map((s) => s.trim()).filter(Boolean);
    try {
      await onSubmit({
        ...form,
        competencies: competencies.length ? competencies : null,
        specializations: specializations.length ? specializations : null,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('error.generic'));
    }
  };

  const managers = data.employees.filter((e) => e.id !== employee?.id);

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={employee ? t('empForm.title.edit') : t('empForm.title.new')}
      subtitle={employee ? `${employee.first_name} ${employee.last_name}` : t('empForm.subtitle.new')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>{t('common.cancel')}</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? t('empForm.saving') : employee ? t('empForm.saveEdit') : t('empForm.saveNew')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label={t('empForm.firstName')} value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
          <Input label={t('empForm.lastName')} value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label={t('empForm.email')} type="email" value={form.email ?? ''} onChange={(e) => set('email', e.target.value || null)} />
          <Input label={t('empForm.phone')} value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value || null)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label={t('empForm.position')} value={form.position_id ?? ''} onChange={(e) => set('position_id', e.target.value || null)}>
            <option value="">—</option>
            {data.positions.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </Select>
          <Select label={t('empForm.department')} value={form.department_id ?? ''} onChange={(e) => set('department_id', e.target.value || null)}>
            <option value="">—</option>
            {data.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label={t('empForm.manager')} value={form.manager_id ?? ''} onChange={(e) => set('manager_id', e.target.value || null)}>
            <option value="">—</option>
            {managers.map((m) => <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>)}
          </Select>
          <Select label={t('empForm.location')} value={form.location_id ?? ''} onChange={(e) => set('location_id', e.target.value || null)}>
            <option value="">—</option>
            {data.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label={t('empForm.hireDate')} type="date" value={form.hire_date ?? ''} onChange={(e) => set('hire_date', e.target.value || null)} />
          <Select label={t('empForm.status')} value={form.status} onChange={(e) => set('status', e.target.value as EmployeeInput['status'])}>
            <option value="active">{t('badge.status.active')}</option>
            <option value="on_leave">{t('badge.status.on_leave')}</option>
            <option value="terminated">{t('badge.status.terminated')}</option>
          </Select>
        </div>
        <Input label={t('empForm.avatarUrl')} value={form.avatar_url ?? ''} onChange={(e) => set('avatar_url', e.target.value || null)} placeholder="https://…" />
        <Input label={t('empForm.competencies')} value={competenciesText} onChange={(e) => setCompetenciesText(e.target.value)} placeholder={t('empForm.competenciesPh')} />
        <Input label={t('empForm.specializations')} value={specializationsText} onChange={(e) => setSpecializationsText(e.target.value)} placeholder={t('empForm.specializationsPh')} />
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.is_board_member}
            onChange={(e) => set('is_board_member', e.target.checked)}
            className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200"
          />
          <span className="text-sm text-ink-700">{t('empForm.isBoardMember')}</span>
        </label>

        {(role === 'admin' || role === 'hr') && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
            <div className="flex items-center gap-2 text-amber-700">
              <span className="text-xs font-semibold uppercase tracking-wide">{t('empForm.hrData')}</span>
            </div>
            <Input label={t('empForm.salary')} type="number" value={form.salary ?? ''} onChange={(e) => set('salary', e.target.value ? Number(e.target.value) : null)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label={t('empForm.leaveDays')} type="number" min={0} value={form.leave_used_days ?? 0} onChange={(e) => set('leave_used_days', e.target.value ? Number(e.target.value) : 0)} />
              <Input label={t('empForm.sickDays')} type="number" min={0} value={form.sick_days ?? 0} onChange={(e) => set('sick_days', e.target.value ? Number(e.target.value) : 0)} />
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
