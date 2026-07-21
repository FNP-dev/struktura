import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Nie udało się pobrać danych.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 mb-3">
        <AlertCircle size={22} />
      </div>
      <p className="text-sm text-ink-700 font-medium">{message}</p>
      <p className="text-xs text-ink-400 mt-1">Sprawdź połączenie i spróbuj ponownie.</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          <RefreshCw size={14} />
          Spróbuj ponownie
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, icon }: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400 mb-3">{icon}</div>}
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {description && <p className="text-xs text-ink-400 mt-1 max-w-xs">{description}</p>}
    </div>
  );
}
