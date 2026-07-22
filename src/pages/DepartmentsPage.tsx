import { useState } from 'react';
import { ChevronRight, ChevronDown, Users, MapPin, Building2 } from 'lucide-react';
import { useLang } from '../hooks/useLang';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/ErrorState';
import { buildDepartmentTree, flattenDepartmentTree, type OrgSnapshot } from '../lib/api';
import { getDepartmentIcon, levelStyle } from '../components/shared/departmentIcons';
import { fullName } from '../lib/format';
import type { EmployeeWithRelations } from '../lib/types';
import { cn } from '../lib/utils';

interface DepartmentsPageProps {
  data: OrgSnapshot;
  onSelectEmployee: (e: EmployeeWithRelations) => void;
}

export function DepartmentsPage({ data, onSelectEmployee }: DepartmentsPageProps) {
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const tree = buildDepartmentTree(data.departments);

  // Auto-expand top-level by default
  if (expanded.size === 0 && tree.length > 0) {
    setExpanded(new Set(tree.map((n) => n.id)));
  }

  const matches = (d: { name: string; code: string | null; description: string | null }) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      (d.code?.toLowerCase().includes(q) ?? false) ||
      (d.description?.toLowerCase().includes(q) ?? false)
    );
  };

  const flat = flattenDepartmentTree(tree);
  const filteredIds = new Set(flat.filter((d) => matches(d)).map((d) => d.id));
  // Expand ancestors of any match
  const expandedWithAncestors = new Set(expanded);
  for (const d of flat) {
    if (filteredIds.has(d.id)) {
      let p = d.parent_id;
      while (p) {
        expandedWithAncestors.add(p);
        const parent = flat.find((x) => x.id === p);
        p = parent?.parent_id ?? null;
      }
    }
  }

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const renderNode = (node: typeof tree[number], depth: number): React.ReactNode => {
    const Icon = getDepartmentIcon(node.icon);
    const isExpanded = expandedWithAncestors.has(node.id);
    const hasChildren = node.children.length > 0;
    const style = levelStyle(depth);
    const employeeCount =
      node.employee_count ??
      data.employees.filter((e) => e.department_id === node.id).length;

    // Hide nodes that don't match (and have no matching descendants)
    const hasMatchInSubtree = (n: typeof tree[number]): boolean => {
      if (filteredIds.has(n.id)) return true;
      return n.children.some(hasMatchInSubtree);
    };
    if (query && !hasMatchInSubtree(node)) return null;

    return (
      <div key={node.id}>
        <div
          className={cn(
            'flex items-center gap-2 py-2.5 pr-3 rounded-lg hover:bg-ink-50 transition-colors group',
            depth === 0 && 'mt-1'
          )}
          style={{ paddingLeft: `${depth * 20 + 4}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggle(node.id)}
              className="shrink-0 rounded p-0.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors"
              aria-label={isExpanded ? t('deptPage.collapse') : t('deptPage.expand')}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}

          <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg shrink-0', style.bg, style.text)}>
            <Icon size={15} />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink-900 truncate">{node.name}</span>
              {node.code && <Badge variant="outline" size="sm">{node.code}</Badge>}
            </div>
            {node.description && (
              <p className="text-xs text-ink-500 truncate">{node.description}</p>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {node.location && (
              <span className="flex items-center gap-1 text-xs text-ink-400">
                <MapPin size={12} /> {node.location.city}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-ink-500 font-medium">
              <Users size={12} /> {employeeCount}
            </span>
            <Badge variant={depth === 0 ? 'brand' : depth === 1 ? 'info' : 'neutral'} size="sm">
              {style.label}
            </Badge>
          </div>
        </div>

        {/* Manager chip + children */}
        {isExpanded && (
          <div style={{ paddingLeft: `${depth * 20 + 36}px` }}>
            {node.manager && (
              <button
                onClick={() => {
                  const emp = data.employees.find((e) => e.id === node.manager_id);
                  if (emp) onSelectEmployee(emp);
                }}
                className="flex items-center gap-2 py-1 px-2 -ml-2 rounded-md hover:bg-ink-50 transition-colors text-left group"
              >
                <Avatar
                  src={node.manager.avatar_url}
                  first={node.manager.first_name}
                  last={node.manager.last_name}
                  size="xs"
                />
                <span className="text-xs text-ink-500">
                  <span className="font-medium text-ink-700 group-hover:text-brand-700">
                    {t('deptPage.manager', { name: fullName({ first_name: node.manager.first_name, last_name: node.manager.last_name }) })}
                  </span>
                </span>
              </button>
            )}
            {hasChildren && (
              <div className="border-l border-ink-100 ml-2">
                {node.children.map((child) => renderNode(child, depth + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{t('deptPage.title')}</h2>
            <p className="text-sm text-ink-500">{t('deptPage.subtitle', { total: data.departments.length, pions: tree.length })}</p>
          </div>
          <div className="w-full sm:w-72">
            <Input
              icon={<Building2 size={15} />}
              placeholder={t('deptPage.filterPh')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-3 pb-3 border-b border-ink-100">
          {[0, 1, 2, 3].map((lvl) => (
            <span key={lvl} className="flex items-center gap-1.5 text-xs text-ink-500">
              <span className={cn('h-2 w-2 rounded-full', levelStyle(lvl).bg.replace('bg-', 'bg-').replace('50', '400'))} />
              {levelStyle(lvl).label}
            </span>
          ))}
        </div>

        {tree.length === 0 ? (
          <EmptyState title={t('deptPage.empty.title')} description={t('deptPage.empty.desc')} icon={<Building2 size={22} />} />
        ) : (
          <div className="space-y-0.5">{tree.map((node) => renderNode(node, 0))}</div>
        )}
      </Card>
    </div>
  );
}
