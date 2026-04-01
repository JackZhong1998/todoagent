import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mammoth from 'mammoth';
import { FileText, Trash2, Upload } from 'lucide-react';
import type { WorkspaceDoc } from '../types';
import { generateId } from '../utils';
import { loadProjectDocs, saveProjectDocs } from '../utils/projectStorage';
import { useLanguage } from '../contexts/LanguageContext';
import { useWorkspaceSyncBump } from '../contexts/WorkspaceSyncContext';

export type { WorkspaceDoc, WorkspaceDocKind } from '../types';

async function fileToDoc(file: File): Promise<WorkspaceDoc> {
  const id = generateId();
  const createdAt = Date.now();
  const lower = file.name.toLowerCase();

  if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
    const body = await file.text();
    return { id, name: file.name, kind: 'markdown', body, createdAt };
  }

  if (lower.endsWith('.txt')) {
    const body = await file.text();
    return { id, name: file.name, kind: 'text', body, createdAt };
  }

  if (lower.endsWith('.docx')) {
    const buf = await file.arrayBuffer();
    const { value } = await mammoth.convertToHtml({ arrayBuffer: buf });
    return { id, name: file.name, kind: 'html', body: value || '<p></p>', createdAt };
  }

  throw new Error('UNSUPPORTED');
}

export interface DocumentsPanelProps {
  projectId: string;
}

export const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ projectId }) => {
  const { t } = useLanguage();
  const bumpRemoteSync = useWorkspaceSyncBump();
  const d = t.docs;
  const [docs, setDocs] = useState<WorkspaceDoc[]>(() => loadProjectDocs(projectId));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveProjectDocs(projectId, docs);
    bumpRemoteSync();
  }, [docs, projectId, bumpRemoteSync]);

  useEffect(() => {
    if (docs.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !docs.some((x) => x.id === selectedId)) {
      setSelectedId(docs[0].id);
    }
  }, [docs, selectedId]);

  const selected = useMemo(
    () => (selectedId ? docs.find((x) => x.id === selectedId) : undefined),
    [docs, selectedId]
  );

  const onFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setUploadError(null);
      const next: WorkspaceDoc[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          next.push(await fileToDoc(file));
        } catch (e) {
          if (e instanceof Error && e.message === 'UNSUPPORTED') {
            setUploadError(d.unsupportedFormat);
          } else {
            setUploadError(d.parseError);
          }
        }
      }
      if (next.length) {
        setDocs((prev) => [...next, ...prev]);
        setSelectedId(next[0].id);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [d.parseError, d.unsupportedFormat]
  );

  const removeDoc = (id: string) => {
    setDocs((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="flex h-[min(70vh,640px)] border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="w-[min(100%,280px)] flex-shrink-0 min-h-0 border-r border-gray-100 flex flex-col bg-gray-50/80">
        <div className="p-3 border-b border-gray-100 space-y-2 shrink-0">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.markdown,.txt,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            className="hidden"
            onChange={(e) => void onFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-black text-white text-sm font-semibold hover:bg-zinc-800 transition-colors"
          >
            <Upload size={18} />
            {d.upload}
          </button>
          {uploadError ? <p className="text-xs text-rose-600 px-1">{uploadError}</p> : null}
          <p className="text-[11px] text-gray-400 leading-snug px-1">{d.hint}</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-1">
          {docs.length === 0 ? (
            <div className="py-12 px-3 text-center text-sm text-gray-400">{d.emptyList}</div>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                className={`group flex items-stretch gap-1 rounded-xl border transition-colors ${
                  doc.id === selectedId
                    ? 'bg-white border-gray-200 shadow-sm'
                    : 'border-transparent hover:bg-white/80 hover:border-gray-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedId(doc.id)}
                  className="flex-1 min-w-0 text-left px-3 py-2.5 flex items-start gap-2"
                >
                  <FileText size={16} className="text-gray-400 shrink-0 mt-0.5" />
                  <span className="text-sm font-medium text-gray-800 truncate">{doc.name}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeDoc(doc.id)}
                  className="shrink-0 p-2 text-gray-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={d.delete}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overscroll-contain p-6 md:p-8">
        {!selected ? (
          <div className="min-h-full flex items-center justify-center text-gray-400 text-sm">{d.previewEmpty}</div>
        ) : selected.kind === 'markdown' ? (
          <article className="prose prose-sm prose-gray max-w-none prose-headings:font-semibold prose-a:text-blue-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{selected.body}</ReactMarkdown>
          </article>
        ) : selected.kind === 'text' ? (
          <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{selected.body}</pre>
        ) : (
          <div
            className="docx-preview text-sm text-gray-800 leading-relaxed space-y-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:p-2 [&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_th]:bg-gray-50"
            dangerouslySetInnerHTML={{ __html: selected.body }}
          />
        )}
      </div>
    </div>
  );
};
