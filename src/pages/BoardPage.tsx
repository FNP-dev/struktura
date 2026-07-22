import { Crown, Mail, Phone, ChevronRight } from 'lucide-react';
import { useLang } from '../hooks/useLang';
import { Card } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { EmployeeStatusBadge } from '../components/shared/badges';
import { fullName, formatDate, tenureYears } from '../lib/format';
import type { EmployeeWithRelations } from '../lib/types';
import type { OrgSnapshot } from '../lib/api';

interface BoardPageProps {
  data: OrgSnapshot;
  onSelectEmployee: (e: EmployeeWithRelations) => void;
}

export function BoardPage({ data, onSelectEmployee }: BoardPageProps) {
  const { t } = useLang();
  const boardMembers = data.employees.filter((e) => e.is_board_member);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="bg-gradient-to-br from-brand-50 to-white border-brand-100">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
            <Crown size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{t('board.title')}</h2>
            <p className="text-sm text-ink-500">{t('board.subtitle', { count: boardMembers.length })}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {boardMembers.map((m, idx) => (
          <Card key={m.id} hover onClick={() => onSelectEmployee(m)} className="flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="relative">
                <Avatar src={m.avatar_url} first={m.first_name} last={m.last_name} size="xl" ring />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-bold ring-2 ring-white">
                  {idx + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-ink-900 truncate">{fullName(m)}</h3>
                  <EmployeeStatusBadge status={m.status} />
                </div>
                <p className="text-sm text-ink-600 mt-0.5">{m.position?.title}</p>
                <p className="text-xs text-ink-400 mt-1">{m.department?.name}</p>
              </div>
            </div>

            {m.position?.description && (
              <p className="text-sm text-ink-600">{m.position.description}</p>
            )}

            <div className="grid grid-cols-2 gap-2 text-xs">
              {m.email && (
                <span className="flex items-center gap-1.5 text-ink-600 truncate">
                  <Mail size={12} className="text-ink-400 shrink-0" /> {m.email}
                </span>
              )}
              {m.phone && (
                <span className="flex items-center gap-1.5 text-ink-600">
                  <Phone size={12} className="text-ink-400 shrink-0" /> {m.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-ink-600">
                <ChevronRight size={12} className="text-ink-400 shrink-0" /> {t('board.since', { date: formatDate(m.hire_date) })}
              </span>
              <span className="flex items-center gap-1.5 text-ink-600">
                <Crown size={12} className="text-ink-400 shrink-0" /> {t('board.tenure', { tenure: tenureYears(m.hire_date) })}
              </span>
            </div>

            {m.position?.responsibilities && m.position.responsibilities.length > 0 && (
              <div className="pt-3 border-t border-ink-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">{t('board.responsibilities')}</p>
                <ul className="space-y-1">
                  {m.position.responsibilities.slice(0, 3).map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-700">
                      <ChevronRight size={14} className="text-brand-500 mt-0.5 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {m.position?.decision_rights && (
              <div className="rounded-lg bg-amber-50/60 border border-amber-100 p-3">
                <p className="text-xs font-semibold text-amber-700 mb-0.5">{t('board.decisionRights')}</p>
                <p className="text-xs text-ink-700">{m.position.decision_rights}</p>
              </div>
            )}

            {m.competencies && m.competencies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {m.competencies.map((c) => (
                  <Badge key={c} variant="info" size="sm">{c}</Badge>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
