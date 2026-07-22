import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
  containerClassName?: string;
}

export function Input({ icon, label, className, containerClassName, ...rest }: InputProps) {
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">{icon}</span>}
        <input className={cn('input', Boolean(icon) && 'pl-9', className)} {...rest} />
      </div>
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: React.ReactNode;
  containerClassName?: string;
}

export function Select({ label, children, className, containerClassName, ...rest }: SelectProps) {
  return (
    <div className={cn('w-full', containerClassName)}>
      {label && <label className="label">{label}</label>}
      <select className={cn('input appearance-none bg-white pr-8', className)} {...rest}>
        {children}
      </select>
    </div>
  );
}
