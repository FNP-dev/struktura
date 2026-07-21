import { useEffect, useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import type { DepartmentInput } from '../../lib/api';
import type { DepartmentNode, EmployeeWithRelations } from '../../lib/types';

interface DepartmentFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: DepartmentInput) => Promise<void>;
  departments: DepartmentNode[];
  employees: EmployeeWithRelations[];
  department?: DepartmentNode | null;
  defaultParentId?: string | null;
  loading?: boolean;
}

const ICON_OPTIONS = ['building', 'briefcase', 'cpu', 'code', 'server', 'package', 'compass', 'palette', 'trending-up', 'handshake', 'megaphone', 'users', 'user-plus', 'landmark', 'calculator'];

const EMPTY: DepartmentInput = {
  name: '',
  code: null,
  parent_id: null,
  manager_id: null,
  icon: 'building',
  level: 0,
  description: null,
};

export function DepartmentFormModal({ open, onClose, onSubmit, departments, employees, department, defaultParentId, loading }: DepartmentFormModalProps) {
  const [form, setForm] = useState<DepartmentInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (department) {
        setForm({
          name: department.name,
          code: department.code,
          parent_id: department.parent_id,
          manager_id: department.manager_id,
          icon: department.icon ?? 'building',
          level: department.level,
          description: department.description,
        });
      } else {
        setForm({ ...EMPTY, parent_id: defaultParentId ?? null });
      }
    }
  }, [open, department, defaultParentId]);

  const set = <K extends keyof DepartmentInput>(key: K, value: DepartmentInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async () => {
    setError(null);
    if (!form.name.trim()) {
      setError('Nazwa działu jest wymagana.');
      return;
    }
    const parent = form.parent_id ? departments.find((d) => d.id === form.parent_id) : null;
    const level = parent ? parent.level + 1 : 0;
    try {
      await onSubmit({ ...form, level });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wystąpił błąd');
    }
  };

  const flatNonSelf = (excludeId?: string): DepartmentNode[] => {
    const out: DepartmentNode[] = [];
    const walk = (nodes: DepartmentNode[]) => {
      for (const n of nodes) {
        if (n.id !== excludeId) {
          out.push(n);
          if (n.children?.length) walk(n.children);
        }
      }
    };
    walk(departments);
    return out;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title={department ? 'Edytuj jednostkę organizacyjną' : 'Nowa jednostka organizacyjna'}
      subtitle={department?.name}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Anuluj</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Zapisywanie…' : department ? 'Zapisz zmiany' : 'Dodaj'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Input label="Nazwa *" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="np. Produkcja" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Kod" value={form.code ?? ''} onChange={(e) => set('code', e.target.value || null)} placeholder="np. PROD" />
          <Select label="Ikona" value={form.icon ?? 'building'} onChange={(e) => set('icon', e.target.value)}>
            {ICON_OPTIONS.map((i) => <option key={i} value={i}>{i}</option>)}
          </Select>
        </div>
        <Select label="Jednostka nadrzędna" value={form.parent_id ?? ''} onChange={(e) => set('parent_id', e.target.value || null)}>
          <option value="">— (poziom główny)</option>
          {flatNonSelf(department?.id).map((d) => (
            <option key={d.id} value={d.id}>{'— '.repeat(d.level)}{d.name}</option>
          ))}
        </Select>
        <Select label="Kierownik" value={form.manager_id ?? ''} onChange={(e) => set('manager_id', e.target.value || null)}>
          <option value="">—</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
          ))}
        </Select>
        <div>
          <label className="label">Opis</label>
          <textarea className="input min-h-[60px] resize-y" value={form.description ?? ''} onChange={(e) => set('description', e.target.value || null)} />
        </div>
      </div>
    </Modal>
  );
}
