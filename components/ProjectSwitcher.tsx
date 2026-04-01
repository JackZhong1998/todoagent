import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Check, Pencil, Plus } from 'lucide-react';
import type { ProjectMeta } from '../utils/projectStorage';
import { useLanguage } from '../contexts/LanguageContext';

interface ProjectSwitcherProps {
  activeProjectId: string;
  projects: ProjectMeta[];
  onSelectProject: (id: string) => void;
  onAddProject: () => void;
  editing: boolean;
  onToggleEditing: () => void;
  onRenameProject: (id: string, name: string) => void;
  /** 浮层关闭时调用：退出「编辑名称」态（名称已在输入时持久化） */
  onPopoverClose?: () => void;
}

export const ProjectSwitcher: React.FC<ProjectSwitcherProps> = ({
  activeProjectId,
  projects,
  onSelectProject,
  onAddProject,
  editing,
  onToggleEditing,
  onRenameProject,
  onPopoverClose,
}) => {
  const { t } = useLanguage();
  const p = t.projects;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const closePopover = useCallback(() => {
    setOpen((wasOpen) => {
      if (wasOpen) onPopoverClose?.();
      return false;
    });
  }, [onPopoverClose]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) closePopover();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, closePopover]);

  const active = projects.find((x) => x.id === activeProjectId);

  return (
    <div ref={rootRef} className="relative w-full z-10">
      <button
        type="button"
        onClick={() => (open ? closePopover() : setOpen(true))}
        className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors text-left"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate flex-1 min-w-0">{active?.name ?? p.switchProject}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-20 rounded-2xl border border-gray-100 bg-white shadow-lg shadow-black/8 py-2 px-2 space-y-2"
          role="listbox"
        >
          <div className="max-h-[min(60vh,320px)] overflow-y-auto overscroll-contain space-y-0.5">
            {projects.map((proj) => (
              <div key={proj.id} className="rounded-xl">
                {editing ? (
                  <input
                    type="text"
                    value={proj.name}
                    onChange={(e) => onRenameProject(proj.id, e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={p.renameAria(proj.name)}
                  />
                ) : (
                  <button
                    type="button"
                    role="option"
                    aria-selected={proj.id === activeProjectId}
                    onClick={() => {
                      onSelectProject(proj.id);
                      closePopover();
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                      proj.id === activeProjectId
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Check
                      size={16}
                      className={`shrink-0 ${
                        proj.id === activeProjectId ? 'text-emerald-600 opacity-100' : 'opacity-0'
                      }`}
                      aria-hidden
                    />
                    <span className="truncate flex-1 min-w-0">{proj.name}</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                onAddProject();
                closePopover();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl bg-black text-white text-xs font-semibold hover:bg-zinc-800 transition-colors"
            >
              <Plus size={14} aria-hidden />
              {p.add}
            </button>
            <button
              type="button"
              onClick={() => onToggleEditing()}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Pencil size={14} aria-hidden />
              {editing ? p.doneEdit : p.edit}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
