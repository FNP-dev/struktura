import { cn } from '../../lib/utils';

type Variant = 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'muted' | 'overline';

const variantClasses: Record<Variant, string> = {
  h1: 'text-2xl font-bold text-ink-900 tracking-tight',
  h2: 'text-xl font-semibold text-ink-900 tracking-tight',
  h3: 'text-base font-semibold text-ink-900',
  body: 'text-sm text-ink-700',
  small: 'text-xs text-ink-600',
  muted: 'text-sm text-ink-500',
  overline: 'text-[11px] font-semibold uppercase tracking-wider text-ink-500',
};

interface TextProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
  as?: 'p' | 'span' | 'div';
}

export function Text({ variant = 'body', children, className, as = 'p' }: TextProps) {
  const Tag = as;
  return <Tag className={cn(variantClasses[variant], className)}>{children}</Tag>;
}
