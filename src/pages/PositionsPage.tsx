import { useMemo, useState } from 'react';
import { Briefcase, Search, X, ChevronRight, AlertCircle, CheckCircle2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/ErrorState';
import { PositionFormModal } from '../components/shared/PositionFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatSalary } from '../lib/format';
import type { OrgSnapshot, PositionInput } from '../lib/api';
import { createPosition, updatePosition, deletePosition } from '../lib/api';
import type { Position } from '../lib/types';
import { can } from '../hooks/useAuth';

interface PositionsPageProps {
  data: OrgSnapshot;
  role: 'admin' | 'hr' | 'employee' | null;
  onRefresh: () => void;
}

const LEVEL_VARIANT: Record<string, 'brand' | 'info' | 'success' | 'warning' | 'neutral'> = {
  'C-level': 'brand',
  Director: 'info',
  Manager: 'success',
  Specialist: 'warning',
  Junior: 'neutral',
};

export function PositionsPage({ data, role, onRefresh }: PositionsPageProps) {
  const { positions, departments, employees } = data;
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [vacancyFilter, setVacancyFilter] = useState<'all' | 'vacant' | 'filled'>('all');
  const [selected, setSelected] = useState<Position | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Position | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<Position | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canWrite = can(role, 'write', 'positions');
  const canDelete = can(role, 'delete', 'positions');

  const levels = useMemo(() => Array.from(new Set(positions.map((p) => p.level).filter(Boolean))) as string[], [positions]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return positions.filter((p) => {
      if (q) {
        const hay = [p.title, p.description ?? '', p.level ?? '', ...(p.requirements ?? [])].join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (deptFilter !== 'all' && p.department_id !== deptFilter) return false;
      if (levelFilter !== 'all' && p.level !== levelFilter) return false;
      if (vacancyFilter === 'vacant' && !p.is_vacant) return false;
      if (vacancyFilter === 'filled' && p.is_vacant) return false;
      return true;
    });
  }, [positions, query, deptFilter, levelFilter, vacancyFilter]);

  const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name ?? '—';
  const holder = (p: Position) => employees.find((e) => e.position_id === p.id);

  const vacantCount = positions.filter((p) => p.is_vacant).length;

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (p: Position) => { setEditing(p); setFormOpen(true); };

  const handleSubmit = async (input: PositionInput) => {
    setSubmitting(true);
    try {
      if (editing) await updatePosition(editing.id, input);
      else await createPosition(input);
      onRefresh();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deletePosition(deleting.id);
      setDeleting(null);
      if (selected?.id === deleting.id) setSelected(null);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Nie udało się usunąć');
    } finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4"><p className="text-2xl font-bold text-ink-900">{positions.length}</p><p className="text-xs text-ink-500 mt-0.5">Stanowisk</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-amber-600">{vacantCount}</p><p className="text-xs text-ink-500 mt-0.5">Wakatów</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-emerald-600">{positions.length - vacantCount}</p><p className="text-xs text-ink-500 mt-0.5">Obsadzonych</p></Card>
        <Card className="p-4"><p className="text-2xl font-bold text-sky-600">{levels.length}</p><p className="text-xs text-ink-500 mt-0.5">Poziomów</p></Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input pl-9" placeholder="Szukaj stanowiska…" value={query} onChange={(e) => setQuery(e.target.value)} />
              {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"><X size={14} /></button>}
            </div>
            {canWrite && (
              <Button variant="primary" onClick={openCreate}><Plus size={16} /> Dodaj stanowisko</Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="all">Wszystkie działy</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
              <option value="all">Wszystkie poziomy</option>
              {levels.map((l) => <option key={l} value={l}>{l}</option>)}
            </Select>
            <Select value={vacancyFilter} onChange={(e) => setVacancyFilter(e.target.value as typeof vacancyFilter)}>
              <option value="all">Wszystkie statusy</option>
              <option value="filled">Obsadzone</option>
              <option value="vacant">Wakaty</option>
            </Select>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState title="Brak stanowisk" description="Nie znaleziono stanowisk spełniających kryteria." icon={<Briefcase size={22} />} /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const h = holder(p);
            return (
              <Card key={p.id} hover onClick={() => setSelected(p)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-ink-900 truncate">{p.title}</h3>
                    <p className="text-xs text-ink-400 truncate mt-0.5">{deptName(p.department_id)}</p>
                  </div>
                  {p.is_vacant ? (
                    <Badge variant="warning" size="sm"><AlertCircle size={11} /> Wakat</Badge>
                  ) : (
                    <Badge variant="success" size="sm"><CheckCircle2 size={11} /> Obsadzone</Badge>
                  )}
                </div>
                <p className="text-sm text-ink-600 line-clamp-2">{p.description ?? '—'}</p>
                <div className="mt-3 flex items-center justify-between">
                  {p.level && <Badge variant={LEVEL_VARIANT[p.level] ?? 'neutral'} size="sm">{p.level}</Badge>}
                  <span className="text-xs text-ink-500">{formatSalary(p.min_salary, p.max_salary)}</span>
                </div>
                {h && <p className="mt-2 pt-2 border-t border-ink-100 text-xs text-ink-500 truncate">Obsadzone przez: <span className="text-ink-700 font-medium">{h.first_name} {h.last_name}</span></p>}
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        size="lg"
        title={selected?.title}
        subtitle={selected ? deptName(selected.department_id) : undefined}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>Zamknij</Button>
            {selected && canWrite && <Button variant="secondary" onClick={() => { openEdit(selected); setSelected(null); }}><Pencil size={14} /> Edytuj</Button>}
            {selected && canDelete && <Button variant="danger" onClick={() => { setDeleting(selected); }}><Trash2 size={14} /> Usuń</Button>}
          </>
        }
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {selected.level && <Badge variant={LEVEL_VARIANT[selected.level] ?? 'neutral'}>{selected.level}</Badge>}
              {selected.is_vacant ? <Badge variant="warning">Wakat</Badge> : <Badge variant="success">Obsadzone</Badge>}
            </div>
            {selected.description && <p className="text-sm text-ink-700">{selected.description}</p>}

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-ink-100 p-3">
                <p className="text-xs text-ink-400">Widełki wynagrodzenia</p>
                <p className="text-sm font-medium text-ink-800 mt-0.5">{formatSalary(selected.min_salary, selected.max_salary)}</p>
              </div>
              <div className="rounded-lg border border-ink-100 p-3">
                <p className="text-xs text-ink-400">Dział</p>
                <p className="text-sm font-medium text-ink-800 mt-0.5">{deptName(selected.department_id)}</p>
              </div>
            </div>

            {selected.responsibilities && selected.responsibilities.length > 0 && (
              <Section title="Zakres obowiązków">
                <ul className="space-y-1.5">
                  {selected.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink-700"><ChevronRight size={14} className="text-brand-500 mt-0.5 shrink-0" />{r}</li>
                  ))}
                </ul>
              </Section>
            )}

            {selected.decision_rights && (
              <Section title="Uprawnienia decyzyjne">
                <p className="text-sm text-ink-700 bg-amber-50/60 border border-amber-100 rounded-lg p-3">{selected.decision_rights}</p>
              </Section>
            )}

            {selected.requirements && selected.requirements.length > 0 && (
              <Section title="Wymagania">
                <div className="flex flex-wrap gap-1.5">
                  {selected.requirements.map((r) => <Badge key={r} variant="info">{r}</Badge>)}
                </div>
              </Section>
            )}
          </div>
        )}
      </Modal>

      <PositionFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        data={data}
        position={editing}
        loading={submitting}
      />
      <ConfirmDialog
        open={!!deleting}
        title="Usunąć stanowisko?"
        message={`Czy na pewno chcesz usunąć stanowisko „${deleting?.title ?? ''}"? Tej operacji nie można cofnąć.`}
        confirmLabel="Usuń"
        destructive
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-2">{title}</h4>
      {children}
    </div>
  );
}
