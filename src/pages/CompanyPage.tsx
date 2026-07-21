import { Building2, MapPin, Mail, Phone, Globe, Calendar, Briefcase, Users } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { fullName } from '../lib/format';
import type { OrgSnapshot } from '../lib/api';
import type { EmployeeWithRelations } from '../lib/types';

interface CompanyPageProps {
  data: OrgSnapshot;
  onSelectEmployee: (e: EmployeeWithRelations) => void;
}

export function CompanyPage({ data, onSelectEmployee }: CompanyPageProps) {
  const { company, locations, employees, departments } = data;
  if (!company) return <p className="text-sm text-ink-500">Brak danych firmy.</p>;

  const boardMembers = employees.filter((e) => e.is_board_member);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Company header */}
      <Card className="overflow-hidden">
        <div className="relative -m-5 mb-5 bg-gradient-to-br from-ink-900 to-brand-900 p-6 sm:p-8 text-white">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/10 text-white text-2xl sm:text-3xl font-bold shrink-0 backdrop-blur-sm border border-white/10">
              {company.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">{company.name}</h2>
              <p className="mt-2 max-w-3xl text-sm text-white/70">{company.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {company.industry && (
                  <Badge variant="brand" className="bg-white/10 text-white border border-white/10">
                    <Briefcase size={12} /> {company.industry}
                  </Badge>
                )}
                {company.founded_year && (
                  <Badge variant="brand" className="bg-white/10 text-white border border-white/10">
                    <Calendar size={12} /> Założono {company.founded_year}
                  </Badge>
                )}
                <Badge variant="brand" className="bg-white/10 text-white border border-white/10">
                  <Users size={12} /> {employees.length} pracowników
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={<Mail size={16} />} label="Email" value={company.email} href={company.email ? `mailto:${company.email}` : undefined} />
          <InfoRow icon={<Phone size={16} />} label="Telefon" value={company.phone} href={company.phone ? `tel:${company.phone}` : undefined} />
          <InfoRow icon={<Globe size={16} />} label="Strona WWW" value={company.website} href={company.website ?? undefined} />
          <InfoRow icon={<MapPin size={16} />} label="Adres centrali" value={company.address} />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Locations */}
        <Card className="lg:col-span-2">
          <CardHeader title="Lokalizacje oddziałów" subtitle={`${locations.length} lokalizacji`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {locations.map((loc) => (
              <div key={loc.id} className="rounded-xl border border-ink-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <Building2 size={16} />
                    </span>
                    <h4 className="text-sm font-semibold text-ink-900">{loc.name}</h4>
                  </div>
                  {loc.is_headquarters && <Badge variant="brand" size="sm">Centrala</Badge>}
                </div>
                <div className="space-y-1 text-xs text-ink-500">
                  <p className="flex items-start gap-1.5"><MapPin size={12} className="mt-0.5 shrink-0" /> {loc.address}</p>
                  {loc.phone && <p className="flex items-center gap-1.5"><Phone size={12} /> {loc.phone}</p>}
                  {loc.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {loc.email}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Board snapshot */}
        <Card>
          <CardHeader title="Zarząd" subtitle={`${boardMembers.length} członków`} />
          <div className="space-y-2">
            {boardMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelectEmployee(m)}
                className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-ink-50 transition-colors text-left"
              >
                <Avatar src={m.avatar_url} first={m.first_name} last={m.last_name} size="sm" ring />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-800 truncate">{fullName(m)}</p>
                  <p className="text-xs text-ink-400 truncate">{m.position?.title}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick stats footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="text-center py-6">
          <p className="text-3xl font-bold text-brand-600">{employees.length}</p>
          <p className="text-xs text-ink-500 mt-1">Pracowników</p>
        </Card>
        <Card className="text-center py-6">
          <p className="text-3xl font-bold text-sky-600">{departments.length}</p>
          <p className="text-xs text-ink-500 mt-1">Jednostek org.</p>
        </Card>
        <Card className="text-center py-6">
          <p className="text-3xl font-bold text-violet-600">{locations.length}</p>
          <p className="text-xs text-ink-500 mt-1">Lokalizacji</p>
        </Card>
        <Card className="text-center py-6">
          <p className="text-3xl font-bold text-emerald-600">{new Date().getFullYear() - (company.founded_year ?? new Date().getFullYear())}</p>
          <p className="text-xs text-ink-500 mt-1">Lat działalności</p>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, href }: { icon: React.ReactNode; label: string; value?: string | null; href?: string }) {
  const content = (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-ink-100 hover:border-ink-200 transition-colors">
      <span className="text-ink-400 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-ink-400">{label}</p>
        <p className="text-sm text-ink-800 truncate">{value || '—'}</p>
      </div>
    </div>
  );
  return href && value ? <a href={href} target="_blank" rel="noreferrer" className="block">{content}</a> : content;
}
