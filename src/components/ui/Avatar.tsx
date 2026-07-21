import { cn } from '../../lib/utils';
import { initials } from '../../lib/format';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizeClasses: Record<Size, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

interface AvatarProps {
  src?: string | null;
  first: string;
  last: string;
  size?: Size;
  className?: string;
  ring?: boolean;
}

export function Avatar({ src, first, last, size = 'md', className, ring }: AvatarProps) {
  const dims = sizeClasses[size];
  const shared = cn(
    'inline-flex items-center justify-center rounded-full object-cover bg-ink-200 text-ink-600 font-semibold shrink-0 overflow-hidden',
    dims,
    ring && 'ring-2 ring-white shadow-sm',
    className
  );
  if (src) {
    return <img src={src} alt={`${first} ${last}`} className={cn(shared, 'bg-ink-100')} loading="lazy" />;
  }
  return <span className={cn(shared, 'bg-gradient-to-br from-brand-100 to-brand-200 text-brand-700')}>{initials(first, last)}</span>;
}
  