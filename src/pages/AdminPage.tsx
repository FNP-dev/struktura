import { Shield, Check, X, History, Users, Lock, Eye, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatDateTime } from '../lib/format';
import type { OrgSnapshot } from '../lib/api';
import { cn } from '../lib/utils';
import { useLang } from '../hooks/useLang';

interface AdminPageProps {
  data: OrgSnapshot;
}

const RESOURCES = ['company', 'employees', 'documents', 'processes', 'reports', 'admin'];

export function AdminPage({ data }: AdminPageProps) {
  const { roles, accessControls, changeHistory } = data;
  const { t } = useLang();

  const getAccess = (roleId: string, resource: string) =>
    accessControls.find((a) => a.role_id === roleId && a.resource === resource);

  const actionIcon = (action: string) => {
    switch (action) {
      case 'create': return <span className="text-emerald-600 font-bold">+</span>;
      case 'update': return <span className="text-sky-600 font-bold">↻</span>;
      case 'delete': return <span className="text-red-600 font-bold">−</span>;
      default: return '•';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <Card className="bg-gradient-to-br from-ink-900 to-ink-800 text-white border-0">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white border border-white/10">
            <Shield size={20} />
          </span>
          <div>
            <h2 className="text-lg font-semibold">{t('admin.title')}</h2>
            <p className="text-sm text-white/60">{t('admin.subtitle')}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-ink-500"><Users size={16} /><span className="text-xs font-medium uppercase tracking-wide">{t('admin.roles')}</span></div>
          <p className="text-2xl font-bold text-ink-900 mt-1">{roles.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-ink-500"><Lock size={16} /><span className="text-xs font-medium uppercase tracking-wide">{t('admin.accessRules')}</span></div>
          <p className="text-2xl font-bold text-ink-900 mt-1">{accessControls.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-ink-500"><History size={16} /><span className="text-xs font-medium uppercase tracking-wide">{t('admin.historyEvents')}</span></div>
          <p className="text-2xl font-bold text-ink-900 mt-1">{changeHistory.length}</p>
        </Card>
      </div>

      {/* Roles overview */}
      <Card>
        <CardHeader title={t('admin.rolesTitle')} subtitle={t('admin.rolesSub')} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map((role) => (
            <div key={role.id} className="rounded-xl border border-ink-100 p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold" style={{ background: role.color ?? '#64748b' }}>
                  {role.name.charAt(0)}
                </span>
                <div>
                  <h4 className="text-sm font-semibold text-ink-900">{role.name}</h4>
                  <p className="text-xs text-ink-400">{role.description}</p>
                </div>
              </div>
              {role.permissions && role.permissions.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {role.permissions.map((p) => <Badge key={p} variant="outline" size="sm">{p}</Badge>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Access control matrix */}
      <Card className="overflow-hidden p-0">
        <div className="p-5 border-b border-ink-100">
          <h3 className="text-base font-semibold text-ink-900">{t('admin.matrixTitle')}</h3>
          <p className="text-sm text-ink-500 mt-0.5">{t('admin.matrixSub')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-50 text-xs text-ink-500 uppercase tracking-wide">
              <tr>
                <th className="text-left font-medium px-4 py-3 sticky left-0 bg-ink-50">{t('admin.resource')}</th>
                {roles.map((r) => (
                  <th key={r.id} className="text-center font-medium px-3 py-3 min-w-[90px]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ background: r.color ?? '#64748b' }} />
                      {r.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {RESOURCES.map((res) => (
                <tr key={res} className="hover:bg-ink-50/50">
                  <td className="px-4 py-3 font-medium text-ink-800 sticky left-0 bg-white">{t('admin.resource.' + res)}</td>
                  {roles.map((r) => {
                    const a = getAccess(r.id, res);
                    return (
                      <td key={r.id} className="px-3 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <PermIcon active={!!a?.can_read} icon={<Eye size={13} />} title={t('admin.permRead')} />
                          <PermIcon active={!!a?.can_write} icon={<Pencil size={13} />} title={t('admin.permWrite')} />
                          <PermIcon active={!!a?.can_delete} icon={<Trash2 size={13} />} title={t('admin.permDelete')} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-ink-100 flex items-center gap-4 text-xs text-ink-500">
          <span className="flex items-center gap-1"><Check size={12} className="text-emerald-600" /> {t('admin.allowed')}</span>
          <span className="flex items-center gap-1"><X size={12} className="text-ink-300" /> {t('admin.denied')}</span>
        </div>
      </Card>

      {/* Change history */}
      <Card className="overflow-hidden p-0">
        <div className="p-5 border-b border-ink-100">
          <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2"><History size={18} /> {t('admin.historyTitle')}</h3>
          <p className="text-sm text-ink-500 mt-0.5">{t('admin.historySub')}</p>
        </div>
        {changeHistory.length === 0 ? (
          <p className="p-5 text-sm text-ink-400">{t('admin.noHistory')}</p>
        ) : (
          <div className="divide-y divide-ink-100">
            {changeHistory.map((c) => (
              <div key={c.id} className="flex items-start gap-3 p-4 hover:bg-ink-50/50 transition-colors">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-sm shrink-0">
                  {actionIcon(c.action)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-800">{c.summary}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-ink-400">
                    <Badge variant="outline" size="sm">{c.entity_type}</Badge>
                    <Badge variant={c.action === 'create' ? 'success' : c.action === 'update' ? 'info' : 'error'} size="sm">{c.action}</Badge>
                    <span>· {c.changed_by}</span>
                    <span>· {formatDateTime(c.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function PermIcon({ active, icon, title }: { active: boolean; icon: React.ReactNode; title: string }) {
  return (
    <span
      title={title}
      className={cn(
        'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
        active ? 'bg-emerald-50 text-emerald-600' : 'bg-ink-50 text-ink-300'
      )}
    >
      {active ? icon : <X size={11} />}
    </span>
  );
}
