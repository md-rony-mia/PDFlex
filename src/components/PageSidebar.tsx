import React from 'react';
import { RotateCw, ArrowUp, ArrowDown, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { PageMeta } from '../types/pdf';

interface PageSidebarProps {
  pages: PageMeta[];
  activePageIndex: number;
  onSelectPage: (originalIndex: number) => void;
  onRotatePage: (originalIndex: number) => void;
  onMovePage: (fromIndex: number, direction: 'up' | 'down') => void;
  onDeletePage: (originalIndex: number) => void;
  modifiedCountPerPage: Record<number, number>;
}

export const PageSidebar: React.FC<PageSidebarProps> = ({
  pages,
  activePageIndex,
  onSelectPage,
  onRotatePage,
  onMovePage,
  onDeletePage,
  modifiedCountPerPage,
}) => {
  const visiblePages = pages.filter((p) => !p.isDeleted);

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-full select-none shrink-0">
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Pages ({visiblePages.length})
          </span>
        </div>
        <span className="text-[11px] text-slate-500">Reorder & Rotate</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {visiblePages.map((pageMeta, displayIdx) => {
          const isActive = pageMeta.originalIndex === activePageIndex;
          const modifiedCount = modifiedCountPerPage[pageMeta.originalIndex] || 0;
          const isLandscape = pageMeta.width > pageMeta.height;

          return (
            <div
              key={pageMeta.id}
              onClick={() => onSelectPage(pageMeta.originalIndex)}
              className={`group relative rounded-xl border p-2.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/15 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                  : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
              }`}
            >
              {/* Header row: Page # and Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {displayIdx + 1}
                  </span>
                  <span className="text-xs font-medium text-slate-300">
                    Page {pageMeta.originalIndex + 1}
                  </span>
                </div>

                {modifiedCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                    <CheckCircle2 className="w-3 h-3" />
                    {modifiedCount} edited
                  </span>
                )}
              </div>

              {/* Page Miniature Representation */}
              <div className="w-full flex items-center justify-center py-2">
                <div
                  className={`border border-slate-600 bg-white/95 rounded shadow-sm flex flex-col justify-between p-1.5 transition-transform duration-200 ${
                    isLandscape ? 'w-28 h-20' : 'w-20 h-28'
                  }`}
                  style={{ transform: `rotate(${pageMeta.rotation}deg)` }}
                >
                  <div className="w-full space-y-1">
                    <div className="w-3/4 h-1 bg-slate-300 rounded" />
                    <div className="w-full h-1 bg-slate-200 rounded" />
                    <div className="w-5/6 h-1 bg-slate-200 rounded" />
                  </div>
                  <div className="w-full space-y-1">
                    <div className="w-full h-1 bg-slate-200 rounded" />
                    <div className="w-2/3 h-1 bg-slate-200 rounded" />
                  </div>
                  <div className="text-[8px] text-slate-400 text-center font-mono font-medium">
                    {displayIdx + 1}
                  </div>
                </div>
              </div>

              {/* Action Toolbar on thumbnail */}
              <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between text-slate-400">
                <div className="flex items-center gap-1">
                  <button
                    disabled={displayIdx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovePage(displayIdx, 'up');
                    }}
                    title="Move Page Up"
                    className="p-1 hover:text-white hover:bg-slate-700/80 rounded disabled:opacity-20 disabled:hover:bg-transparent transition"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={displayIdx === visiblePages.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMovePage(displayIdx, 'down');
                    }}
                    title="Move Page Down"
                    className="p-1 hover:text-white hover:bg-slate-700/80 rounded disabled:opacity-20 disabled:hover:bg-transparent transition"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotatePage(pageMeta.originalIndex);
                    }}
                    title={`Rotate Page 90° Clockwise (Currently ${pageMeta.rotation}°)`}
                    className="p-1 hover:text-indigo-300 hover:bg-indigo-500/20 rounded transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  {visiblePages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeletePage(pageMeta.originalIndex);
                      }}
                      title="Delete Page"
                      className="p-1 hover:text-rose-400 hover:bg-rose-500/20 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
