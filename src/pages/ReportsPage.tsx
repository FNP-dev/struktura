import { useMemo } from 'react';
import { Users, Building2, Briefcase, TrendingUp, MapPin, Award, Clock } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { cn } from '../lib/utils';
import type { OrgSnapshot } from '../lib/api';
import type { EmployeeWithRelations } from '../lib/types';

interface ReportsPageProps {
  data: OrgSnapshot;
  onSelectEmployee: (e: EmployeeWithRelations) => void;
}

export function ReportsPage({ data, onSelectEmployee }: ReportsPageProps) {
  const { employees, departments, positions, locations } = data;

  // Employees per department (including sub-departments rollup to top-level pion)
  const topLevelPions = departments.filter((d) => d.level === 1);
  const boardDept = departments.find((d) => d.level === 0);

  const descendantIds = (rootId: string): Set<string> => {
    const ids = new Set<string>([rootId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const d of departments) {
        if (d.parent_id && ids.has(d.parent_id) && !ids.has(d.id)) {
          ids.add(d.id);
          changed = true;
        }
      }
    }
    return ids;
  };

  const pionStats = topLevelPions.map((pion) => {
    const ids = descendantIds(pion.id);
    const empCount = employees.filter((e) => e.department_id && ids.has(e.department_id)).length;
    const deptCount = ids.size;
    return { pion, empCount, deptCount };
  });
  if (boardDept) {
    const ids = descendantIds(boardDept.id);
    pionStats.unshift({
      pion: boardDept,
      empCount: employees.filter((e) => e.department_id && ids.has(e.department_id)).length,
      deptCount: ids.size,
    });
  }
  const maxEmp = Math.max(...pionStats.map((p) => p.empCount), 1);

  // Employees per location
  const locStats = locations.map((l) => ({
    loc: l,
    count: employees.filter((e) => e.location_id === l.id).length,
  }));
  const maxLoc = Math.max(...locStats.map((l) => l.count), 1);

  // Status breakdown
  const statusStats = {
    active: employees.filter((e) => e.status === 'active').length,
    on_leave: employees.filter((e) => e.status === 'on_leave').length,
    terminated: employees.filter((e) => e.status === 'terminated').length,
  };

  // Position level breakdown
  const levelStats = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((e) => {
      const lvl = e.position?.level ?? 'Nieokreślony';
      map.set(lvl, (map.get(lvl) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  // Top competencies
  const competencyStats = useMemo(() => {
    const map = new Map<string, number>();
    employees.forEach((e) => e.competencies?.forEach((c) => map.set(c, (map.get(c) ?? 0) + 1)));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [employees]);
  const maxComp = Math.max(...competencyStats.map((c) => c[1]), 1);

  // Tenure distribution
  const tenureBuckets = { '<1 rok': 0, '1-3 lata': 0, '3-5 lat': 0, '5-10 lat': 0, '10+ lat': 0 };
  employees.forEach((e) => {
    if (!e.hire_date) return;
    const years = (Date.now() - new Date(e.hire_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (years < 1) tenureBuckets['<1 rok']++;
    else if (years < 3) tenureBuckets['1-3 lata']++;
    else if (years < 5) tenureBuckets['3-5 lat']++;
    else if (years < 10) tenureBuckets['5-10 lat']++;
    else tenureBuckets['10+ lat']++;
  });

  const vacantPositions = positions.filter((p) => p.is_vacant);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Pracownicy" value={employees.length} icon={<Users size={16} />} variant="brand" />
        <StatCard label="Działy" value={departments.length} icon={<Building2 size={16} />} variant="info" />
        <StatCard label="Stanowiska" value={positions.length} icon={<Briefcase size={16} />} variant="success" />
        <StatCard label="Wakaty" value={vacantPositions.length} icon={<TrendingUp size={16} />} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employees per pion — bar chart */}
        <Card>
          <CardHeader title="Zatrudnienie w pionach" subtitle="Liczba pracowników na dyrekcję (z poddziałami)" />
          <div className="space-y-3">
            {pionStats.map(({ pion, empCount, deptCount }) => (
              <div key={pion.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink-700 font-medium truncate">{pion.name}</span>
                  <span className="text-ink-500 text-xs">{empCount} prac. · {deptCount} działów</span>
                </div>
                <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-500"
                    style={{ width: `${(empCount / maxEmp) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Employees per location */}
        <Card>
          <CardHeader title="Pracownicy per lokalizacja" subtitle="Rozkład geograficzny" />
          <div className="space-y-3">
            {locStats.map(({ loc, count }) => (
              <div key={loc.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-ink-700 font-medium flex items-center gap-1.5">
                    <MapPin size={13} className="text-ink-400" />
                    {loc.name}
                    {loc.is_headquarters && <Badge variant="brand" size="sm">HQ</Badge>}
                  </span>
                  <span className="text-ink-500 text-xs">{count} prac.</span>
                </div>
                <div className="h-2.5 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-full transition-all duration-500"
                    style={{ width: `${(count / maxLoc) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status breakdown — donut */}
        <Card>
          <CardHeader title="Status zatrudnienia" />
          <div className="flex items-center gap-5">
            <Donut
              segments={[
                { value: statusStats.active, color: '#10b981', label: 'Aktywni' },
                { value: statusStats.on_leave, color: '#f59e0b', label: 'Urlop' },
                { value: statusStats.terminated, color: '#ef4444', label: 'Zatrzymani' },
              ]}
            />
            <div className="space-y-2 text-sm">
              <LegendRow color="#10b981" label="Aktywni" value={statusStats.active} total={employees.length} />
              <LegendRow color="#f59e0b" label="Na urlopie" value={statusStats.on_leave} total={employees.length} />
              <LegendRow color="#ef4444" label="Zatrzymani" value={statusStats.terminated} total={employees.length} />
            </div>
          </div>
        </Card>

        {/* Level breakdown */}
        <Card>
          <CardHeader title="Struktura stanowisk" subtitle="Rozkład poziomów" />
          <div className="space-y-2">
            {levelStats.map(([level, count]) => (
              <div key={level} className="flex items-center justify-between text-sm">
                <span className="text-ink-700">{level}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(count / employees.length) * 100}%` }} />
                  </div>
                  <span className="text-ink-600 text-xs w-6 text-right tabular-nums">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tenure */}
        <Card>
          <CardHeader title="Staż pracy" subtitle="Rozkład stażu" />
          <div className="space-y-2">
            {Object.entries(tenureBuckets).map(([bucket, count]) => (
              <div key={bucket} className="flex items-center justify-between text-sm">
                <span className="text-ink-700 flex items-center gap-1.5"><Clock size={12} className="text-ink-400" /> {bucket}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(count / employees.length) * 100}%` }} />
                  </div>
                  <span className="text-ink-600 text-xs w-6 text-right tabular-nums">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top competencies */}
        <Card>
          <CardHeader title="Najczęstsze kompetencje" subtitle="Top 8 w firmie" />
          <div className="space-y-2">
            {competencyStats.map(([comp, count]) => (
              <div key={comp} className="flex items-center justify-between text-sm">
                <span className="text-ink-700 flex items-center gap-1.5"><Award size={12} className="text-ink-400" /> {comp}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-ink-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${(count / maxComp) * 100}%` }} />
                  </div>
                  <span className="text-ink-600 text-xs w-6 text-right tabular-nums">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Vacancies */}
        <Card>
          <CardHeader title="Otwarte wakaty" subtitle={`${vacantPositions.length} stanowisk nieobsadzonych`} />
          {vacantPositions.length === 0 ? (
            <p className="text-sm text-ink-400">Brak otwartych wakatów.</p>
          ) : (
            <div className="space-y-2">
              {vacantPositions.map((p) => {
                const dept = departments.find((d) => d.id === p.department_id);
                return (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-3 rounded-lg border border-amber-100 bg-amber-50/40">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-800 truncate">{p.title}</p>
                      <p className="text-xs text-ink-400 truncate">{dept?.name}</p>
                    </div>
                    <Badge variant="warning" size="sm">{p.level}</Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Employee directory link */}
      <Card>
        <CardHeader title="Katalog pracowników" subtitle="Pełna lista zatrudnionych" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {employees.slice(0, 12).map((e) => (
            <button
              key={e.id}
              onClick={() => onSelectEmployee(e)}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-ink-50 transition-colors text-left"
            >
              <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold', e.is_board_member ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-600')}>
                {e.first_name[0]}{e.last_name[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink-800 truncate">{e.first_name} {e.last_name}</p>
                <p className="text-xs text-ink-400 truncate">{e.position?.title}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function Donut({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="14" />
      {segments.map((s, i) => {
        const len = (s.value / total) * circumference;
        const circle = (
          <circle
            key={i}
            cx="60" cy="60" r={radius} fill="none"
            stroke={s.color} strokeWidth="14"
            strokeDasharray={`${len} ${circumference - len}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 60 60)"
            strokeLinecap="butt"
          />
        );
        offset += len;
        return circle;
      })}
      <text x="60" y="56" textAnchor="middle" className="fill-ink-900 text-lg font-bold">{total}</text>
      <text x="60" y="74" textAnchor="middle" className="fill-ink-400 text-[10px]">pracowników</text>
    </svg>
  );
}

function LegendRow({ color, label, value, total }: { color: string; label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-ink-700 flex-1">{label}</span>
      <span className="text-ink-500 text-xs tabular-nums">{value} ({pct}%)</span>
    </div>
  );
}
