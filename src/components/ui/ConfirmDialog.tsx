import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Potwierdź',
  cancelLabel = 'Anuluj',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="sm"
      title={title}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
            {loading ? 'Przetwarzanie…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
            destructive ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'
          }`}
        >
          <AlertTriangle size={20} />
        </span>
        <p className="text-sm text-ink-700 pt-1">{message}</p>
      </div>
    </Modal>
  );
}
