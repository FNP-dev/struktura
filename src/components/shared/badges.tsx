import { Badge } from '../ui/Badge';
import { CheckCircle2, Clock, UserMinus, Pause, CircleDashed } from 'lucide-react';
import { useLang } from '../../hooks/useLang';

export function EmployeeStatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  switch (status) {
    case 'active':
      return (
        <Badge variant="success">
          <CheckCircle2 size={12} />
          {t('badge.status.active')}
        </Badge>
      );
    case 'on_leave':
      return (
        <Badge variant="warning">
          <Pause size={12} />
          {t('badge.status.on_leave')}
        </Badge>
      );
    case 'terminated':
      return (
        <Badge variant="error">
          <UserMinus size={12} />
          {t('badge.status.terminated')}
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}

export function PriorityBadge({ priority }: { priority?: string | null }) {
  const { t } = useLang();
  switch (priority) {
    case 'critical':
      return <Badge variant="error">{t('badge.priority.critical')}</Badge>;
    case 'high':
      return <Badge variant="warning">{t('badge.priority.high')}</Badge>;
    case 'medium':
      return <Badge variant="info">{t('badge.priority.medium')}</Badge>;
    case 'low':
      return <Badge variant="neutral">{t('badge.priority.low')}</Badge>;
    default:
      return <Badge variant="neutral">{priority ?? '—'}</Badge>;
  }
}

export function ProcessCategoryBadge({ category }: { category?: string | null }) {
  const { t } = useLang();
  const key = `badge.category.${category}`;
  const label = t(key);
  switch (category) {
    case 'Operational':
      return <Badge variant="info">{label}</Badge>;
    case 'Strategic':
      return <Badge variant="brand">{label}</Badge>;
    case 'Support':
      return <Badge variant="neutral">{label}</Badge>;
    case 'Financial':
      return <Badge variant="success">{label}</Badge>;
    default:
      return <Badge variant="neutral">{category ?? '—'}</Badge>;
  }
}

export function DocumentTypeBadge({ type }: { type: string }) {
  const { t } = useLang();
  const map: Record<string, 'brand' | 'info' | 'success' | 'warning'> = {
    regulation: 'brand',
    procedure: 'info',
    policy: 'success',
    instruction: 'warning',
  };
  const variant = map[type] ?? 'neutral';
  return <Badge variant={variant}>{t(`badge.docType.${type}`)}</Badge>;
}

export function DocumentStatusBadge({ status }: { status?: string | null }) {
  const { t } = useLang();
  switch (status) {
    case 'active':
      return (
        <Badge variant="success">
          <CheckCircle2 size={12} />
          {t('badge.docStatus.active')}
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="neutral">
          <CircleDashed size={12} />
          {t('badge.docStatus.draft')}
        </Badge>
      );
    case 'archived':
      return (
        <Badge variant="neutral">
          <Clock size={12} />
          {t('badge.docStatus.archived')}
        </Badge>
      );
    default:
      return <Badge variant="neutral">{status ?? '—'}</Badge>;
  }
}

export function SubstitutionStatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  switch (status) {
    case 'active':
      return <Badge variant="success">{t('badge.subst.active')}</Badge>;
    case 'scheduled':
      return <Badge variant="info">{t('badge.subst.scheduled')}</Badge>;
    case 'ended':
      return <Badge variant="neutral">{t('badge.subst.ended')}</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
}
