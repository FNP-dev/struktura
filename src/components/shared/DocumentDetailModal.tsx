import { useEffect, useState } from 'react';
import {
  FileText, ExternalLink, Calendar, Building2, History, RotateCcw, Pencil, Trash2,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { DocumentTypeBadge, DocumentStatusBadge } from './badges';
import { formatDate, formatDateTime } from '../../lib/format';
import { useLang } from '../../hooks/useLang';
import type { OrgSnapshot } from '../../lib/api';
import { fetchDocumentVersions, restoreDocumentVersion } from '../../lib/api';
import type { DocumentItem, DocumentVersion } from '../../lib/types';

interface DocumentDetailModalProps {
  open: boolean;
  document: DocumentItem | null;
  data: OrgSnapshot;
  onClose: () => void;
  onEdit: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
  canEdit: boolean;
}

export function DocumentDetailModal({ open, document: doc, data, onClose, onEdit, onDelete, canEdit }: DocumentDetailModalProps) {
  const { t } = useLang();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !doc) {
      setVersions([]);
      return;
    }
    setLoadingVersions(true);
    fetchDocumentVersions(doc.id)
      .then(setVersions)
      .catch(() => setVersions([]))
      .finally(() => setLoadingVersions(false));
  }, [open, doc]);

  if (!doc) return null;

  const deptName = data.departments.find((d) => d.id === doc.department_id)?.name ?? t('docDetail.general');

  const handleRestore = async (versionId: string) => {
    setRestoringId(versionId);
    try {
      await restoreDocumentVersion(versionId);
      await fetchDocumentVersions(doc.id).then(setVersions);
      onClose();
    } catch {
      alert(t('docDetail.restoreFailed'));
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={doc.title}
      subtitle={deptName}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
          {canEdit && (
            <>
              <Button variant="secondary" onClick={() => onEdit(doc)}><Pencil size={14} /> {t('common.edit')}</Button>
              <Button variant="danger" onClick={() => onDelete(doc)}><Trash2 size={14} /> {t('common.delete')}</Button>
            </>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-1.5">
          <DocumentTypeBadge type={doc.type} />
          <DocumentStatusBadge status={doc.status} />
          {doc.version && <Badge variant="outline">{t('docDetail.version', { v: doc.version })}</Badge>}
        </div>

        {doc.description && (
          <p className="text-sm text-ink-700 leading-relaxed">{doc.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetaRow icon={<Building2 size={14} />} label={t('docDetail.department')} value={deptName} />
          <MetaRow icon={<Calendar size={14} />} label={t('docDetail.effectiveDate')} value={formatDate(doc.effective_date)} />
          <MetaRow
            icon={<FileText size={14} />}
            label={t('docDetail.file')}
            value={
              doc.file_url ? (
                <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:text-brand-700 font-medium inline-flex items-center gap-1">
                  {t('common.open')} <ExternalLink size={12} />
                </a>
              ) : t('common.noFile')
            }
          />
          <MetaRow icon={<Calendar size={14} />} label={t('docDetail.added')} value={formatDate(doc.created_at)} />
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-3 flex items-center gap-1.5">
            <History size={14} /> {t('docDetail.versionHistory', { count: versions.length })}
          </h4>
          {loadingVersions ? (
            <p className="text-sm text-ink-400">{t('common.loading')}</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-ink-400">{t('docDetail.noVersions')}</p>
          ) : (
            <div className="space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="rounded-lg border border-ink-100 p-3 hover:border-ink-200 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {v.version && <Badge variant="outline" size="sm">v{v.version}</Badge>}
                        <span className="text-sm font-medium text-ink-800 truncate">{v.title}</span>
                      </div>
                      <div className="mt-1.5 text-xs text-ink-400 space-y-0.5">
                        <p>{t('docDetail.archivedAt', { date: formatDateTime(v.archived_at) })}</p>
                        {v.archived_by && <p>{t('docDetail.archivedBy', { name: v.archived_by })}</p>}
                        {v.effective_date && <p>{t('docDetail.effectiveDateShort', { date: formatDate(v.effective_date) })}</p>}
                      </div>
                      {v.description && <p className="mt-2 text-xs text-ink-600 line-clamp-2">{v.description}</p>}
                    </div>
                    {canEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(v.id)}
                        disabled={restoringId === v.id}
                        title={t('docDetail.restoreTitle')}
                      >
                        <RotateCcw size={13} />
                        {restoringId === v.id ? '…' : t('docDetail.restore')}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-ink-400 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-ink-400">{label}</p>
        <div className="text-sm text-ink-800 truncate">{value || '—'}</div>
      </div>
    </div>
  );
}
