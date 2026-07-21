import { cn } from '../../lib/utils';

type Variant = 'default' | 'brand' | 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'outline';
type Size = 'sm' | 'md';

const variantClasses: Record<Variant, string> = {
  default: 'bg-ink-100 text-ink-700',
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
  info: 'bg-sky-50 text-sky-700',
  neutral: 'bg-ink-200 text-ink-700',
  outline: 'border border-ink-200 text-ink-600',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

interface BadgeProps {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', size = 'md', children, className }: BadgeProps) {
  return (
    <span className={cn('badge font-medium', variantClasses[variant], sizeClasses[size], className)}>{children}</span>
  );
}
