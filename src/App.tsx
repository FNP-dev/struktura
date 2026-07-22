import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { LangProvider, useLang } from './hooks/useLang';
import { Sidebar, type PageKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { EmployeeDetailModal } from './components/shared/EmployeeDetailModal';
import { ErrorState, EmptyState } from './components/ui/ErrorState';
import { SkeletonCard } from './components/ui/Skeleton';
import { Button } from './components/ui/Button';
import { useOrgData } from './hooks/useOrgData';
import { fetchEmployeeById } from './lib/api';
import type { EmployeeWithRelations } from './lib/types';

import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CompanyPage } from './pages/CompanyPage';
import { BoardPage } from './pages/BoardPage';
import { DepartmentsPage } from './pages/DepartmentsPage';
import { OrganigramPage } from './pages/OrganigramPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { PositionsPage } from './pages/PositionsPage';
import { ProcessesPage } from './pages/ProcessesPage';
import { PerformancePage } from './pages/PerformancePage';
import { DocumentsPage } from './pages/DocumentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';

const PAGE_META_KEYS: Record<PageKey, { titleKey: string; subtitleKey: string }> = {
  dashboard: { titleKey: 'page.dashboard.title', subtitleKey: 'page.dashboard.subtitle' },
  company: { titleKey: 'page.company.title', subtitleKey: 'page.company.subtitle' },
  structure: { titleKey: 'page.structure.title', subtitleKey: 'page.structure.subtitle' },
  board: { titleKey: 'page.board.title', subtitleKey: 'page.board.subtitle' },
  departments: { titleKey: 'page.departments.title', subtitleKey: 'page.departments.subtitle' },
  organigram: { titleKey: 'page.organigram.title', subtitleKey: 'page.organigram.subtitle' },
  employees: { titleKey: 'page.employees.title', subtitleKey: 'page.employees.subtitle' },
  positions: { titleKey: 'page.positions.title', subtitleKey: 'page.positions.subtitle' },
  processes: { titleKey: 'page.processes.title', subtitleKey: 'page.processes.subtitle' },
  performance: { titleKey: 'page.performance.title', subtitleKey: 'page.performance.subtitle' },
  documents: { titleKey: 'page.documents.title', subtitleKey: 'page.documents.subtitle' },
  reports: { titleKey: 'page.reports.title', subtitleKey: 'page.reports.subtitle' },
  admin: { titleKey: 'page.admin.title', subtitleKey: 'page.admin.subtitle' },
};

function Shell() {
  const { session, user, profile, role, loading: authLoading, signOut } = useAuth();
  const { data, loading, error, refresh } = useOrgData();
  const { t } = useLang();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithRelations | null>(null);
  const [loadingEmployee, setLoadingEmployee] = useState(false);

  useEffect(() => {
    const main = document.getElementById('main-scroll');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const handleSelectEmployee = (e: EmployeeWithRelations) => setSelectedEmployee(e);

  const handleSelectEmployeeById = async (id: string) => {
    setLoadingEmployee(true);
    try {
      const emp = await fetchEmployeeById(id);
      if (emp) setSelectedEmployee(emp);
    } finally {
      setLoadingEmployee(false);
    }
  };

  // Auth gate
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm text-ink-500">{t('auth.loadingSession')}</p>
        </div>
      </div>
    );
  }

  if (!session || !user) {
    return <AuthPage />;
  }

  // If session exists but profile not loaded yet (trigger may still be running)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-100">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          <p className="text-sm text-ink-500">{t('auth.initProfile')}</p>
          <Button variant="ghost" size="sm" onClick={signOut}>{t('auth.cancelSignOut')}</Button>
        </div>
      </div>
    );
  }

  // Role gate for admin page
  const effectivePage = page === 'admin' && role !== 'admin' ? 'dashboard' : page;
  const metaKeys = PAGE_META_KEYS[effectivePage];
  const meta = { title: t(metaKeys.titleKey), subtitle: t(metaKeys.subtitleKey) };
  const companyName = data?.company?.name ?? 'Nordtech Solutions';

  return (
    <div className="min-h-screen bg-ink-100">
      <Sidebar
        current={effectivePage}
        onNavigate={setPage}
        companyName={companyName}
        companyLogo={data?.company?.logo_url}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
        role={role}
        displayName={profile.display_name ?? user.email}
        onSignOut={signOut}
      />

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          onMobileMenu={() => setMobileMenuOpen(true)}
          actions={
            <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:inline-flex">
              {t('auth.signOut')}
            </Button>
          }
        />

        <main id="main-scroll" className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {error ? (
            <ErrorState message={error} onRetry={refresh} />
          ) : loading || !data ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : data.employees.length === 0 && data.departments.length === 0 ? (
            <EmptyState
              title={t('error.noData.title')}
              description={t('error.noData.desc')}
            />
          ) : (
            <>
              {effectivePage === 'dashboard' && <DashboardPage data={data} onNavigate={setPage} onSelectEmployee={handleSelectEmployee} />}
              {effectivePage === 'company' && <CompanyPage data={data} onSelectEmployee={handleSelectEmployee} />}
              {effectivePage === 'structure' && <OrganigramPage data={data} onSelectEmployee={handleSelectEmployee} role={role} onRefresh={refresh} />}
              {effectivePage === 'board' && <BoardPage data={data} onSelectEmployee={handleSelectEmployee} />}
              {effectivePage === 'departments' && <DepartmentsPage data={data} onSelectEmployee={handleSelectEmployee} />}
              {effectivePage === 'organigram' && <OrganigramPage data={data} onSelectEmployee={handleSelectEmployee} role={role} onRefresh={refresh} />}
              {effectivePage === 'employees' && <EmployeesPage data={data} onSelectEmployee={handleSelectEmployee} role={role} onRefresh={refresh} />}
              {effectivePage === 'positions' && <PositionsPage data={data} role={role} onRefresh={refresh} />}
              {effectivePage === 'processes' && <ProcessesPage data={data} onSelectEmployee={handleSelectEmployee} role={role} onRefresh={refresh} />}
              {effectivePage === 'performance' && <PerformancePage data={data} role={role} onRefresh={refresh} />}
              {effectivePage === 'documents' && <DocumentsPage data={data} role={role} onRefresh={refresh} />}
              {effectivePage === 'reports' && <ReportsPage data={data} onSelectEmployee={handleSelectEmployee} />}
              {effectivePage === 'admin' && <AdminPage data={data} />}
            </>
          )}
        </main>

        <footer className="border-t border-ink-200 px-6 py-4 text-center text-xs text-ink-400">
          {companyName} · {t('footer.tagline')}
        </footer>
      </div>

      <EmployeeDetailModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        onSelectEmployee={handleSelectEmployeeById}
        role={role}
      />
      {loadingEmployee && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-white shadow-lift border border-ink-200 px-4 py-2 text-sm text-ink-600">
          {t('employee.loadingProfile')}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <Shell />
      </AuthProvider>
    </LangProvider>
  );
}
