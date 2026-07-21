import {
  LayoutDashboard, Building2, Network, Users, Briefcase, Workflow,
  FileText, BarChart3, Shield, LogOut, Target, type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AppRole } from '../../lib/supabase';

export type PageKey =
  | 'dashboard'
  | 'company'
  | 'structure'
  | 'board'
  | 'departments'
  | 'organigram'
  | 'employees'
  | 'positions'
  | 'processes'
  | 'performance'
  | 'documents'
  | 'reports'
  | 'admin';

export interface NavItem {
  key: PageKey;
  label: string;
  icon: LucideIcon;
  badge?: string;
  children?: { key: PageKey; label: string }[];
  requiredRole?: AppRole[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Główne',
    items: [{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Organizacja',
    items: [
      { key: 'company', label: 'Firma', icon: Building2 },
      {
        key: 'structure',
        label: 'Struktura organizacyjna',
        icon: Network,
        children: [
          { key: 'board', label: 'Zarząd' },
          { key: 'departments', label: 'Działy' },
          { key: 'organigram', label: 'Organigram' },
        ],
      },
      { key: 'employees', label: 'Pracownicy', icon: Users },
      { key: 'positions', label: 'Stanowiska', icon: Briefcase },
    ],
  },
  {
    title: 'Operacje',
    items: [
      { key: 'processes', label: 'Procesy', icon: Workflow },
      { key: 'performance', label: 'Oceny pracownicze', icon: Target },
      { key: 'documents', label: 'Dokumenty', icon: FileText },
      { key: 'reports', label: 'Raporty', icon: BarChart3 },
    ],
  },
  {
    title: 'System',
    items: [{ key: 'admin', label: 'Administracja', icon: Shield, requiredRole: ['admin'] }],
  },
];

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrator',
  hr: 'HR',
  employee: 'Pracownik',
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: 'bg-red-100 text-red-700',
  hr: 'bg-sky-100 text-sky-700',
  employee: 'bg-emerald-100 text-emerald-700',
};

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  companyName?: string;
  companyLogo?: string | null;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  role: AppRole | null;
  displayName?: string | null;
  onSignOut: () => void;
}

export function Sidebar({
  current,
  onNavigate,
  companyName = 'Nordtech Solutions',
  companyLogo,
  mobileOpen = false,
  onMobileClose,
  role,
  displayName,
  onSignOut,
}: SidebarProps) {
  const isActive = (item: NavItem): boolean => {
    if (item.key === current) return true;
    if (item.key === 'structure' && (current === 'board' || current === 'departments' || current === 'organigram')) {
      return true;
    }
    return false;
  };

  const handleNav = (key: PageKey) => {
    onNavigate(key);
    onMobileClose?.();
  };

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden" onClick={onMobileClose} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-ink-200 flex flex-col transition-transform duration-200 lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-ink-100 shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white font-bold shadow-sm shrink-0">
            {companyLogo ? (
              <img src={companyLogo} alt="" className="h-full w-full rounded-lg object-cover" />
            ) : (
              companyName.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate">{companyName}</p>
            <p className="text-[11px] text-ink-400 truncate">Struktura organizacyjna</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV_SECTIONS.map((section) => {
            const visibleItems = section.items.filter((item) => {
              if (!item.requiredRole) return true;
              return role && item.requiredRole.includes(role);
            });
            if (visibleItems.length === 0) return null;
            return (
            <div key={section.title}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{section.title}</p>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);
                  const hasChildActive =
                    item.children && item.children.some((c) => c.key === current);
                  return (
                    <div key={item.key}>
                      <button
                        onClick={() => handleNav(item.key)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                          active
                            ? 'bg-brand-50 text-brand-700'
                            : hasChildActive
                            ? 'text-ink-800 bg-ink-50'
                            : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                        )}
                      >
                        <Icon size={16} className={active ? 'text-brand-600' : 'text-ink-400'} />
                        <span className="truncate text-left flex-1">{item.label}</span>
                      </button>
                      {hasChildActive && item.children && (
                        <div className="mt-0.5 ml-7 space-y-0.5 border-l border-ink-100 pl-2.5">
                          {item.children.map((c) => (
                            <button
                              key={c.key}
                              onClick={() => handleNav(c.key)}
                              className={cn(
                                'w-full px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left',
                                current === c.key ? 'text-brand-700 bg-brand-50' : 'text-ink-500 hover:text-ink-800 hover:bg-ink-50'
                              )}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            );
          })}
        </nav>

        {/* Footer — current user */}
        <div className="border-t border-ink-100 p-3 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-ink-50">
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold', role ? ROLE_COLORS[role] : 'bg-ink-200 text-ink-600')}>
              {(displayName?.[0] ?? '?').toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-ink-800 truncate">{displayName ?? 'Użytkownik'}</p>
              <p className="text-[10px] text-ink-400 truncate">{role ? ROLE_LABELS[role] : '—'}</p>
            </div>
            <button
              onClick={onSignOut}
              className="shrink-0 rounded-md p-1.5 text-ink-400 hover:bg-ink-200 hover:text-ink-700 transition-colors"
              title="Wyloguj"
              aria-label="Wyloguj"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
