import { cn } from '../../lib/utils';

type Variant = 'default' | 'brand' | 'info' | 'success' | 'warning' | 'error';

const variantClasses: Record<Variant, string> = {
  default: 'bg-ink-100 text-ink-700 border-ink-200',
  brand: 'bg-brand-50 text-brand-700 border-brand-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  variant?: Variant;
  trend?: string;
  sublabel?: string;
  className?: string;
}

export function StatCard({ label, value, icon, variant = 'default', trend, sublabel, className }: StatCardProps) {
  return (
    <div className={cn('card p-4 transition-all duration-200', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">{label}</span>
        {icon && (
          <span className={cn('flex items-center justify-center h-8 w-8 rounded-lg border', variantClasses[variant])}>
            {icon}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-ink-900 tabular-nums">{value}</span>
        {trend && <span className="text-xs font-medium text-emerald-600">{trend}</span>}
      </div>
      {sublabel && <p className="text-xs text-ink-400 mt-1">{sublabel}</p>}
    </div>
  );
}
