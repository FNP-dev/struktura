import { useMemo, useState } from 'react';
import { FileText, Search, X, Download, ExternalLink, Calendar, Building2, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/ErrorState';
import { DocumentTypeBadge, DocumentStatusBadge } from '../components/shared/badges';
import { DocumentFormModal } from '../components/shared/DocumentFormModal';
import { DocumentDetailModal } from '../components/shared/DocumentDetailModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { formatDate } from '../lib/format';
import type { OrgSnapshot, DocumentInput } from '../lib/api';
import { createDocument, updateDocument, deleteDocument } from '../lib/api';
import type { DocumentItem } from '../lib/types';
import { can } from '../hooks/useAuth';
import { useLang } from '../hooks/useLang';

interface DocumentsPageProps {
  data: OrgSnapshot;
  role: 'admin' | 'hr' | 'employee' | null;
  onRefresh: () => void;
}

const TYPE_GROUPS = [
  { type: 'regulation' },
  { type: 'procedure' },
  { type: 'policy' },
  { type: 'instruction' },
];

export function DocumentsPage({ data, role, onRefresh }: DocumentsPageProps) {
  const { documents, departments } = data;
  const { t } = useLang();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');

  const [detail, setDetail] = useState<DocumentItem | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DocumentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<DocumentItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canWrite = can(role, 'write', 'documents');
  const canDelete = can(role, 'delete', 'documents');

  const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name ?? t('docPage.companyGeneral');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return documents.filter((d) => {
      if (q && ![d.title, d.description ?? ''].join(' ').toLowerCase().includes(q)) return false;
      if (typeFilter !== 'all' && d.type !== typeFilter) return false;
      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (deptFilter !== 'all' && d.department_id !== deptFilter) return false;
      return true;
    });
  }, [documents, query, typeFilter, statusFilter, deptFilter]);

  const grouped = TYPE_GROUPS.map((g) => ({ ...g, items: filtered.filter((d) => d.type === g.type) })).filter((g) => g.items.length > 0);

  const openCreate = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (doc: DocumentItem) => { setEditing(doc); setFormOpen(true); setDetail(null); };

  const handleSubmit = async (input: DocumentInput) => {
    setSubmitting(true);
    try {
      if (editing) await updateDocument(editing.id, input);
      else await createDocument(input);
      onRefresh();
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await deleteDocument(deleting.id);
      setDeleting(null);
      setDetail(null);
      onRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : t('error.deleteFailed'));
    } finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
              <input className="input pl-9" placeholder={t('docPage.searchPh')} value={query} onChange={(e) => setQuery(e.target.value)} />
              {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"><X size={14} /></button>}
            </div>
            {canWrite && (
              <Button variant="primary" onClick={openCreate}><Plus size={16} /> {t('docPage.addDocument')}</Button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">{t('docPage.filterTypeAll')}</option>
              {TYPE_GROUPS.map((g) => <option key={g.type} value={g.type}>{t(`docGroup.${g.type}`)}</option>)}
            </Select>
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{t('docPage.filterStatusAll')}</option>
              <option value="active">{t('badge.docStatus.active')}</option>
              <option value="draft">{t('badge.docStatus.draft')}</option>
              <option value="archived">{t('badge.docStatus.archived')}</option>
            </Select>
            <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
              <option value="all">{t('docPage.filterDeptAll')}</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <p className="text-xs text-ink-500">{t('docPage.results', { found: filtered.length, total: documents.length })}</p>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState title={t('docPage.empty.title')} description={t('docPage.empty.desc')} icon={<FileText size={22} />} /></Card>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.type}>
              <CardHeader title={t(`docGroup.${group.type}`)} subtitle={t('docPage.groupCount', { count: group.items.length })} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {group.items.map((doc) => (
                  <Card key={doc.id} hover className="flex flex-col gap-3 relative group" onClick={() => setDetail(doc)}>
                    {canWrite && canDelete && (
                      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(doc); }} className="rounded-md bg-white/90 hover:bg-white p-1.5 text-ink-600 hover:text-brand-600 shadow-sm border border-ink-100" title={t('common.edit')}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleting(doc); }} className="rounded-md bg-white/90 hover:bg-white p-1.5 text-ink-600 hover:text-red-600 shadow-sm border border-ink-100" title={t('common.delete')}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                    <div className="flex items-start gap-3 pr-16">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600 shrink-0">
                        <FileText size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-ink-900 truncate">{doc.title}</h3>
                        <p className="text-xs text-ink-500 line-clamp-2 mt-0.5">{doc.description ?? '—'}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <DocumentTypeBadge type={doc.type} />
                      <DocumentStatusBadge status={doc.status} />
                      {doc.version && <Badge variant="outline" size="sm">v{doc.version}</Badge>}
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-ink-100 text-xs text-ink-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Building2 size={12} /> {deptName(doc.department_id)}</span>
                        {doc.effective_date && <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(doc.effective_date)}</span>}
                      </div>
                      {doc.file_url ? (
                        <a href={doc.file_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium">
                          <ExternalLink size={12} /> {t('common.open')}
                        </a>
                      ) : (
                        <span className="flex items-center gap-1 text-ink-400"><Download size={12} /> {t('docPage.noFile')}</span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DocumentDetailModal
        open={!!detail}
        document={detail}
        data={data}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
        onDelete={(doc) => setDeleting(doc)}
        canEdit={canWrite && canDelete}
      />

      <DocumentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        data={data}
        document={editing}
        loading={submitting}
      />
      <ConfirmDialog
        open={!!deleting}
        title={t('confirm.deleteDocument.title')}
        message={t('confirm.deleteDocument.msg', { name: deleting?.title ?? '' })}
        confirmLabel={t('common.delete')}
        destructive
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
