import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mammoth from 'mammoth';
import { FileText, Info, Trash2, Upload } from 'lucide-react';
import type { WorkspaceDoc } from '../types';
import { generateId } from '../utils';
import {
  loadProjectDocPromptRefs,
  loadProjectDocs,
  PROJECT_DOCS_UPDATED_EVENT,
  saveProjectDocPromptRefs,
  saveProjectDocs,
} from '../utils/projectStorage';
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
  /** Show only user uploads vs only Skill-imported docs. */
  listScope: 'user' | 'skill';
}

export const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ projectId, listScope }) => {
  const { t } = useLanguage();
  const bumpRemoteSync = useWorkspaceSyncBump();
  const d = t.docs;
  const [docs, setDocs] = useState<WorkspaceDoc[]>(() => loadProjectDocs(projectId));
  const [promptDocIds, setPromptDocIds] = useState<string[]>(() => loadProjectDocPromptRefs(projectId));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [bodyDraft, setBodyDraft] = useState('');
  const [savedTip, setSavedTip] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDocs(loadProjectDocs(projectId));
    setPromptDocIds(loadProjectDocPromptRefs(projectId));
  }, [projectId]);

  useEffect(() => {
    saveProjectDocs(projectId, docs);
    bumpRemoteSync();
  }, [docs, projectId, bumpRemoteSync]);

  useEffect(() => {
    saveProjectDocPromptRefs(projectId, promptDocIds);
  }, [projectId, promptDocIds]);

  useEffect(() => {
    const onExternalDocs = (e: Event) => {
      const pid = (e as CustomEvent<{ projectId: string }>).detail?.projectId;
      if (pid !== projectId) return;
      setDocs(loadProjectDocs(projectId));
      setPromptDocIds(loadProjectDocPromptRefs(projectId));
    };
    window.addEventListener(PROJECT_DOCS_UPDATED_EVENT, onExternalDocs);
    return () => window.removeEventListener(PROJECT_DOCS_UPDATED_EVENT, onExternalDocs);
  }, [projectId]);

  useEffect(() => {
    if (!savedTip) return;
    const timer = window.setTimeout(() => setSavedTip(false), 2200);
    return () => window.clearTimeout(timer);
  }, [savedTip]);

  const visibleDocs = useMemo(
    () => (listScope === 'skill' ? docs.filter((x) => x.isSkill) : docs.filter((x) => !x.isSkill)),
    [docs, listScope]
  );

  const selected = useMemo(
    () => (selectedId ? visibleDocs.find((x) => x.id === selectedId) : undefined),
    [visibleDocs, selectedId]
  );

  useEffect(() => {
    setBodyDraft(selected?.body ?? '');
    setSavedTip(false);
  }, [selected?.id]);

  useEffect(() => {
    if (visibleDocs.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !visibleDocs.some((x) => x.id === selectedId)) {
      setSelectedId(visibleDocs[0].id);
    }
  }, [visibleDocs, selectedId]);

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
        setDocs((prev) => {
          const merged = [...next, ...prev];
          saveProjectDocs(projectId, merged);
          return loadProjectDocs(projectId);
        });
        setSelectedId(() => {
          const fresh = loadProjectDocs(projectId);
          return (
            fresh.find((doc) => doc.id === next[0].id)?.id ??
            fresh.find((doc) => doc.isProjectBackground)?.id ??
            fresh[0]?.id ??
            null
          );
        });
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [d.parseError, d.unsupportedFormat, projectId]
  );

  const removeDoc = (id: string) => {
    setDocs((prev) => {
      const merged = prev.filter((x) => x.id !== id);
      saveProjectDocs(projectId, merged);
      return loadProjectDocs(projectId);
    });
    setPromptDocIds((prev) => prev.filter((x) => x !== id));
  };

  const togglePromptInject = (id: string, checked: boolean) => {
    if (checked) {
      setPromptDocIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      return;
    }
    setPromptDocIds((prev) => prev.filter((x) => x !== id));
  };

  const saveDraft = () => {
    if (!selected) return;
    setDocs((prev) => {
      const merged = prev.map((doc) => (doc.id === selected.id ? { ...doc, body: bodyDraft } : doc));
      saveProjectDocs(projectId, merged);
      return loadProjectDocs(projectId);
    });
    setSavedTip(true);
  };

  const embedChecked = !!(selected && (selected.isProjectBackground || promptDocIds.includes(selected.id)));
  const embedDisabled = !!selected?.isProjectBackground;
  const embedTooltip = selected?.isProjectBackground ? d.embedAgentTooltipFixed : d.embedAgentTooltip;

  return (
    <div className="docs-panel flex h-[min(70vh,640px)] border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm">
      <div className="w-[min(100%,280px)] flex-shrink-0 min-h-0 border-r border-gray-100 flex flex-col bg-gray-50/80">
        {listScope === 'user' ? (
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
        ) : null}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2 space-y-1">
          {visibleDocs.length === 0 ? (
            <div className="py-12 px-3 text-center text-sm text-gray-400">
              {listScope === 'skill' ? d.emptySkillList : d.emptyList}
            </div>
          ) : (
            visibleDocs.map((doc) => (
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
                  <span className="text-sm font-medium text-gray-800 truncate min-w-0">{doc.name}</span>
                </button>
                {doc.isProjectBackground ? null : (
                  <button
                    type="button"
                    onClick={() => removeDoc(doc.id)}
                    className="shrink-0 p-2 text-gray-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title={d.delete}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 min-w-0 flex flex-col bg-white">
        {!selected ? (
          <div className="min-h-full flex items-center justify-center text-gray-400 text-sm px-6">{d.previewEmpty}</div>
        ) : (
          <>
            <div className="relative z-20 shrink-0 overflow-visible border-b border-gray-100 bg-white px-4 md:px-6 py-3">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 min-w-0">
                  <span className="text-sm font-semibold text-gray-900 truncate max-w-[min(100%,320px)]" title={selected.name}>
                    {selected.name}
                  </span>
                  {selected.isProjectBackground ? (
                    <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">({d.embedFixedShort})</span>
                  ) : null}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs text-gray-600 whitespace-nowrap">{d.embedAgentLabel}</span>
                    <div className="relative z-[60] group/info">
                      <button
                        type="button"
                        className="rounded p-0.5 text-gray-400 outline-none hover:bg-gray-100 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-blue-300"
                        aria-label={embedTooltip}
                      >
                        <Info size={15} strokeWidth={2} />
                      </button>
                      {/* 向下展开：避免根节点 overflow-hidden + 向上定位被裁切 */}
                      <div
                        role="tooltip"
                        className="pointer-events-none absolute left-1/2 top-full z-[70] mt-1.5 w-[min(288px,calc(100vw-120px))] -translate-x-1/2 rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[11px] leading-snug text-gray-700 shadow-lg opacity-0 transition-opacity invisible group-hover/info:opacity-100 group-hover/info:visible group-focus-within/info:opacity-100 group-focus-within/info:visible"
                      >
                        {embedTooltip}
                      </div>
                    </div>
                    <label className={`inline-flex items-center ${embedDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={embedChecked}
                        disabled={embedDisabled}
                        onChange={(e) => {
                          if (embedDisabled) return;
                          togglePromptInject(selected.id, e.target.checked);
                        }}
                      />
                      <span
                        className="relative h-6 w-11 shrink-0 rounded-full bg-gray-200 transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:bg-black peer-checked:after:translate-x-5 peer-disabled:opacity-60"
                        aria-hidden
                      />
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={saveDraft}
                  className="shrink-0 rounded-lg bg-black px-4 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors"
                >
                  {d.saveDoc}
                </button>
              </div>
              {savedTip ? <p className="mt-2 text-xs text-emerald-600">{d.saved}</p> : null}
            </div>

            <div className="relative z-0 flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5">
              {selected.kind === 'html' ? (
                <p className="mb-2 text-[11px] text-gray-400">{d.docEditorHtmlHint}</p>
              ) : null}
              <textarea
                value={bodyDraft}
                onChange={(e) => setBodyDraft(e.target.value)}
                className="h-[min(52vh,480px)] min-h-[200px] w-full resize-y rounded-xl border border-gray-200 p-3 font-mono text-sm leading-relaxed text-gray-800 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
                spellCheck={false}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
