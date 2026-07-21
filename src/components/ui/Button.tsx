import { cn } from '../../lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md';

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-sm',
  secondary: 'bg-white text-ink-700 border border-ink-200 hover:bg-ink-50 hover:border-ink-300',
  ghost: 'text-ink-600 hover:bg-ink-100 hover:text-ink-800',
  danger: 'bg-white text-red-600 border border-red-200 hover:bg-red-50',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', children, className, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
