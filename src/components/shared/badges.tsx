import { Badge } from '../ui/Badge';
import { CheckCircle2, Clock, UserMinus, Pause, CircleDashed } from 'lucide-react';

export function EmployeeStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="success">
          <CheckCircle2 size={12} />
          Aktywny
        </Badge>
      );
    case 'on_leave':
      return (
        <Badge variant="warning">
          <Pause size={12} />
          Na urlopie
        </Badge>
      );
    case 'terminated':
      return (
        <Badge variant="error">
          <UserMinus size={12} />
          Zatrzymany
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority?: string | null }) {
  switch (priority) {
    case 'critical':
      return <Badge variant="error">Krytyczny</Badge>;
    case 'high':
      return <Badge variant="warning">Wysoki</Badge>;
    case 'medium':
      return <Badge variant="info">Średni</Badge>;
    case 'low':
      return <Badge variant="neutral">Niski</Badge>;
    default:
      return <Badge variant="neutral">{priority ?? '—'}</Badge>;
  }
}

export function ProcessCategoryBadge({ category }: { category?: string | null }) {
  switch (category) {
    case 'Operational':
      return <Badge variant="info">Operacyjny</Badge>;
    case 'Strategic':
      return <Badge variant="brand">Strategiczny</Badge>;
    case 'Support':
      return <Badge variant="neutral">Wspierający</Badge>;
    case 'Financial':
      return <Badge variant="success">Finansowy</Badge>;
    default:
      return <Badge variant="neutral">{category ?? '—'}</Badge>;
  }
}

export function DocumentTypeBadge({ type }: { type: string }) {
  const map: Record<string, { variant: 'brand' | 'info' | 'success' | 'warning'; label: string }> = {
    regulation: { variant: 'brand', label: 'Regulamin' },
    procedure: { variant: 'info', label: 'Procedura' },
    policy: { variant: 'success', label: 'Polityka' },
    instruction: { variant: 'warning', label: 'Instrukcja' },
  };
  const cfg = map[type] ?? { variant: 'neutral' as const, label: type };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function DocumentStatusBadge({ status }: { status?: string | null }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="success">
          <CheckCircle2 size={12} />
          Obowiązujący
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="neutral">
          <CircleDashed size={12} />
          Roboczy
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="neutral">
          <Clock size={12} />
          Zarchiwizowany
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status ?? '—'}</Badge>;
  }
}

export function SubstitutionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'active':
      return <Badge variant="success">Aktywne</Badge>;
    case 'scheduled':
      return <Badge variant="info">Zaplanowane</Badge>;
    case 'ended':
      return <Badge variant="neutral">Zakończone</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
