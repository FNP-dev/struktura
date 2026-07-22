import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { EmployeeStatusBadge } from './badges';
import { fullName, formatDate, tenureYears, formatSalary } from '../../lib/format';
import { Mail, Phone, MapPin, Calendar, Briefcase, Award, Users as UsersIcon, ChevronRight, Wallet, Plane, HeartPulse } from 'lucide-react';
import type { EmployeeWithRelations } from '../../lib/types';
import { useEffect, useState } from 'react';
import { fetchSubordinates } from '../../lib/api';
import { useLang } from '../../hooks/useLang';

interface EmployeeDetailModalProps {
  employee: EmployeeWithRelations | null;
  onClose: () => void;
  onSelectEmployee?: (id: string) => void;
  role?: 'admin' | 'hr' | 'employee' | null;
}

export function EmployeeDetailModal({ employee, onClose, onSelectEmployee, role = null }: EmployeeDetailModalProps) {
  const { t } = useLang();
  const [reports, setReports] = useState<EmployeeWithRelations[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  useEffect(() => {
    if (!employee) {
      setReports([]);
      return;
    }
    setLoadingReports(true);
    fetchSubordinates(employee.id)
      .then(setReports)
      .catch(() => setReports([]))
      .finally(() => setLoadingReports(false));
  }, [employee]);

  if (!employee) return null;

  return (
    <Modal open={!!employee} onClose={onClose} size="lg" title={fullName(employee)} subtitle={employee.position?.title ?? '—'}>
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <Avatar src={employee.avatar_url} first={employee.first_name} last={employee.last_name} size="xl" />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-ink-900">{fullName(employee)}</h3>
              {employee.is_board_member && <Badge variant="brand">{t('employee.boardMember')}</Badge>}
            </div>
            <p className="text-sm text-ink-600">{employee.position?.title}</p>
            <div className="mt-2">
              <EmployeeStatusBadge status={employee.status} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={<Mail size={14} />} label={t('employee.email')} value={employee.email} />
          <InfoRow icon={<Phone size={14} />} label={t('employee.phone')} value={employee.phone} />
          <InfoRow icon={<Briefcase size={14} />} label={t('employee.department')} value={employee.department?.name} />
          <InfoRow icon={<MapPin size={14} />} label={t('employee.location')} value={employee.location?.name ?? employee.location?.city} />
          <InfoRow icon={<Calendar size={14} />} label={t('employee.hiredFrom')} value={formatDate(employee.hire_date)} />
          <InfoRow icon={<Calendar size={14} />} label={t('employee.tenure')} value={tenureYears(employee.hire_date)} />
        </div>

        {(role === 'admin' || role === 'hr') && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-amber-700">{t('employee.hrData')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow icon={<Wallet size={14} />} label={t('employee.salaryMonthly')} value={employee.salary != null ? formatSalary(employee.salary, null) : '—'} />
              <InfoRow icon={<Plane size={14} />} label={t('employee.leaveUsed')} value={employee.leave_used_days != null ? `${employee.leave_used_days} ${t('employee.days')}` : '—'} />
              <InfoRow icon={<HeartPulse size={14} />} label={t('employee.sickDays')} value={employee.sick_days != null ? `${employee.sick_days} ${t('employee.days')}` : '—'} />
              <InfoRow icon={<Briefcase size={14} />} label={t('employee.salaryRange')} value={formatSalary(employee.position?.min_salary ?? null, employee.position?.max_salary ?? null)} />
            </div>
          </div>
        )}

        {employee.position?.responsibilities && employee.position.responsibilities.length > 0 && (
          <Section title={t('employee.responsibilities')}>
            <ul className="space-y-1.5">
              {employee.position.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                  <ChevronRight size={14} className="text-brand-500 mt-0.5 shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {employee.position?.decision_rights && (
          <Section title={t('employee.decisionRights')}>
            <p className="text-sm text-ink-700 bg-amber-50/50 border border-amber-100 rounded-lg p-3">
              {employee.position.decision_rights}
            </p>
          </Section>
        )}

        {employee.competencies && employee.competencies.length > 0 && (
          <Section title={t('employee.competencies')} icon={<Award size={15} />}>
            <div className="flex flex-wrap gap-1.5">
              {employee.competencies.map((c) => (
                <Badge key={c} variant="info">{c}</Badge>
              ))}
            </div>
          </Section>
        )}

        {employee.specializations && employee.specializations.length > 0 && (
          <Section title={t('employee.specializations')}>
            <div className="flex flex-wrap gap-1.5">
              {employee.specializations.map((s) => (
                <Badge key={s} variant="brand">{s}</Badge>
              ))}
            </div>
          </Section>
        )}

        <Section title={t('employee.directReports', { count: reports.length })} icon={<UsersIcon size={15} />}>
          {loadingReports ? (
            <p className="text-sm text-ink-400">{t('common.loading')}</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-ink-400">{t('employee.noReports')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {reports.map((r) => (
                <button
                  key={r.id}
                  onClick={() => onSelectEmployee?.(r.id)}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-ink-50 transition-colors text-left"
                >
                  <Avatar src={r.avatar_url} first={r.first_name} last={r.last_name} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{fullName(r)}</p>
                    <p className="text-xs text-ink-400 truncate">{r.position?.title}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Section>
      </div>
    </Modal>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-ink-400 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-sm text-ink-800 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2 flex items-center gap-1.5">
        {icon}
        {title}
      </h4>
      {children}
    </div>
  );
}
