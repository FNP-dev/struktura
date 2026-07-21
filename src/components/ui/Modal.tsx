import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({ open, onClose, title, subtitle, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-lift animate-scale-in max-h-[90vh] flex flex-col',
          sizeClasses[size]
        )}
      >
        {(title || subtitle) && (
          <div className="flex items-start justify-between gap-3 p-5 border-b border-ink-100">
            <div className="min-w-0">
              {title && <h2 className="text-lg font-semibold text-ink-900 truncate">{title}</h2>}
              {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors"
              aria-label="Zamknij"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-5 flex-1">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 p-4 border-t border-ink-100 bg-ink-50/50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}
