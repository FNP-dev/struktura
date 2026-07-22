import { Users, Building2, Briefcase, FileText, TrendingUp, MapPin, AlertCircle, ArrowRight } from 'lucide-react';
import { StatCard } from '../components/ui/StatCard';
import { Card, CardHeader } from '../components/ui/Card';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { PriorityBadge } from '../components/shared/badges';
import { fullName, formatDate } from '../lib/format';
import { useLang } from '../hooks/useLang';
import type { OrgSnapshot } from '../lib/api';
import type { PageKey } from '../components/layout/Sidebar';
import type { EmployeeWithRelations } from '../lib/types';
import { getDepartmentIcon } from '../components/shared/departmentIcons';

interface DashboardPageProps {
  data: OrgSnapshot;
  onNavigate: (page: PageKey) => void;
  onSelectEmployee: (e: EmployeeWithRelations) => void;
}

export function DashboardPage({ data, onNavigate, onSelectEmployee }: DashboardPageProps) {
  const { lang } = useLang();
  const { company, departments, employees, positions, processes, documents, locations, changeHistory } = data;

  const vacantPositions = positions.filter((p) => p.is_vacant);
  const onLeave = employees.filter((e) => e.status === 'on_leave');
  const boardMembers = employees.filter((e) => e.is_board_member);
  const topLevelDepts = departments.filter((d) => d.level === 1);

  const recentHires = [...employees]
    .filter((e) => e.hire_date)
    .sort((a, b) => (b.hire_date! > a.hire_date! ? 1 : -1))
    .slice(0, 5);

  const criticalProcesses = processes.filter((p) => p.priority === 'critical');

  const tr = (pl: string, en: string) => lang === 'pl' ? pl : en;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ink-900 via-ink-800 to-brand-900 p-6 sm:p-8 text-white">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -right-4 bottom-0 h-32 w-32 rounded-full bg-brand-400/10 blur-2xl" />
        <div className="relative">
          <p className="text-sm text-white/60">{tr('Witaj w panelu', 'Welcome to the panel')}</p>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight">{company?.name ?? tr('Struktura organizacyjna', 'Organizational structure')}</h2>
          <p className="mt-2 max-w-2xl text-sm text-white/70">{company?.description}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="brand" className="bg-white/10 text-white border border-white/10">
              <MapPin size={12} /> {locations.length} {tr('lokalizacje', 'locations')}
            </Badge>
            <Badge variant="brand" className="bg-white/10 text-white border border-white/10">
              <Building2 size={12} /> {departments.length} {tr('jednostek org.', 'org units')}
            </Badge>
            <Badge variant="brand" className="bg-white/10 text-white border border-white/10">
              <TrendingUp size={12} /> {company?.founded_year} · {company?.industry}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={tr('Pracownicy', 'Employees')} value={employees.length} icon={<Users size={16} />} variant="brand" sublabel={`${onLeave.length} ${tr('na urlopie', 'on leave')}`} />
        <StatCard label={tr('Działy', 'Departments')} value={departments.length} icon={<Building2 size={16} />} variant="info" sublabel={`${topLevelDepts.length} ${tr('pionów', 'divisions')}`} />
        <StatCard label={tr('Stanowiska', 'Positions')} value={positions.length} icon={<Briefcase size={16} />} variant="warning" sublabel={`${vacantPositions.length} ${tr('wakatów', 'vacancies')}`} />
        <StatCard label={tr('Dokumenty', 'Documents')} value={documents.length} icon={<FileText size={16} />} variant="success" sublabel={tr('aktywne zasoby', 'active records')} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title={tr('Zarząd', 'Board')}
            subtitle={tr('Członkowie zarządu i ich zakresy', 'Board members and their scope')}
            action={
              <button onClick={() => onNavigate('board')} className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                {tr('Zobacz', 'View')} <ArrowRight size={12} />
              </button>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {boardMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectEmployee(m)}
                className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 hover:border-ink-200 hover:shadow-soft transition-all text-left"
              >
                <Avatar src={m.avatar_url} first={m.first_name} last={m.last_name} size="md" ring />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink-900 truncate">{fullName(m)}</p>
                  <p className="text-xs text-ink-500 truncate">{m.position?.title}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title={tr('Wakaty', 'Vacancies')} subtitle={tr('Otwarte stanowiska', 'Open positions')} />
          {vacantPositions.length === 0 ? (
            <p className="text-sm text-ink-400">{tr('Brak otwartych wakatów.', 'No open vacancies.')}</p>
          ) : (
            <div className="space-y-2">
              {vacantPositions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onNavigate('positions')}
                  className="w-full flex items-center justify-between gap-2 p-3 rounded-lg border border-amber-100 bg-amber-50/50 hover:bg-amber-50 transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-800 truncate">{p.title}</p>
                    <p className="text-xs text-ink-400">{p.level}</p>
                  </div>
                  <Badge variant="warning" size="sm">
                    <AlertCircle size={11} /> {tr('Wakat', 'Vacant')}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title={tr('Piony organizacyjne', 'Organizational divisions')}
            subtitle={tr('Główne dyrekcje firmy', 'Main company directorates')}
            action={
              <button onClick={() => onNavigate('departments')} className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                {tr('Zobacz', 'View')} <ArrowRight size={12} />
              </button>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {topLevelDepts.map((d) => {
              const Icon = getDepartmentIcon(d.icon);
              const childCount = departments.filter((c) => c.parent_id === d.id).length;
              const empCount = employees.filter((e) => {
                const allIds = new Set<string>([d.id]);
                let changed = true;
                while (changed) {
                  changed = false;
                  for (const dep of departments) {
                    if (dep.parent_id && allIds.has(dep.parent_id) && !allIds.has(dep.id)) {
                      allIds.add(dep.id);
                      changed = true;
                    }
                  }
                }
                return e.department_id && allIds.has(e.department_id);
              }).length;
              return (
                <button
                  key={d.id}
                  onClick={() => onNavigate('departments')}
                  className="flex items-center gap-3 p-3 rounded-xl border border-ink-100 hover:border-ink-200 hover:shadow-soft transition-all text-left"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink-900 truncate">{d.name}</p>
                    <p className="text-xs text-ink-400">{empCount} {tr('prac.', 'emp.')} · {childCount} {tr('działów', 'sub-depts')}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHeader title={tr('Ostatnie zatrudnienia', 'Recent hires')} subtitle={tr('Najnowsi pracownicy', 'Newest employees')} />
          <div className="space-y-2">
            {recentHires.map((e) => (
              <button
                key={e.id}
                onClick={() => onSelectEmployee(e)}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-ink-50 transition-colors text-left"
              >
                <Avatar src={e.avatar_url} first={e.first_name} last={e.last_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-800 truncate">{fullName(e)}</p>
                  <p className="text-xs text-ink-400 truncate">{e.position?.title}</p>
                </div>
                <span className="text-xs text-ink-400 shrink-0">{formatDate(e.hire_date)}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title={tr('Procesy krytyczne', 'Critical processes')}
            action={
              <button onClick={() => onNavigate('processes')} className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                {tr('Zobacz', 'View')} <ArrowRight size={12} />
              </button>
            }
          />
          <div className="space-y-2">
            {criticalProcesses.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-ink-100">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{p.name}</p>
                  <p className="text-xs text-ink-400 truncate">{p.description}</p>
                </div>
                <PriorityBadge priority={p.priority} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title={tr('Ostatnie zmiany', 'Recent changes')}
            action={
              <button onClick={() => onNavigate('admin')} className="text-xs font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
                {tr('Historia', 'History')} <ArrowRight size={12} />
              </button>
            }
          />
          <div className="space-y-3">
            {changeHistory.slice(0, 5).map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="flex flex-col items-center shrink-0">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600 text-[10px] font-semibold">
                    {c.action === 'create' ? '+' : c.action === 'update' ? '↻' : '−'}
                  </span>
                  <span className="w-px flex-1 bg-ink-100 mt-1" />
                </div>
                <div className="min-w-0 pb-1">
                  <p className="text-sm text-ink-700 truncate">{c.summary}</p>
                  <p className="text-xs text-ink-400">
                    {c.changed_by} · {formatDate(c.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
