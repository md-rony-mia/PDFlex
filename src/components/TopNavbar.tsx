import React from 'react';
import {
  FileEdit,
  Download,
  Upload,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  PlusSquare,
  ShieldCheck,
  HelpCircle,
  Loader2,
  MousePointer,
  Sparkles
} from 'lucide-react';
import { ZoomMode } from '../types/pdf';

interface TopNavbarProps {
  fileName: string;
  currentPageDisplay: number;
  totalPages: number;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isAddTextMode: boolean;
  onToggleAddTextMode: () => void;
  onExportPdf: () => void;
  isExporting: boolean;
  onOpenDocGuide: () => void;
  onResetFile: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  fileName,
  currentPageDisplay,
  totalPages,
  zoom,
  onZoomChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  isAddTextMode,
  onToggleAddTextMode,
  onExportPdf,
  isExporting,
  onOpenDocGuide,
  onResetFile,
}) => {
  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-3 text-slate-100 shrink-0 z-30 select-none">
      {/* Left: Brand & File Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onResetFile} title="Back to home">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-white">PDFlex</span>
              <span className="text-[10px] font-medium bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" /> 100% Client-Side
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[200px] md:max-w-[280px]" title={fileName}>
              {fileName}
            </p>
          </div>
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-800 mx-1" />

        {/* Page counter */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-lg border border-slate-700/50">
          <span>Page</span>
          <span className="font-bold text-slate-200">{currentPageDisplay}</span>
          <span>of</span>
          <span className="font-bold text-slate-200">{totalPages}</span>
        </div>
      </div>

      {/* Center: Tools (Undo, Redo, Add Text, Zoom) */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Add Text Toggle */}
        <button
          onClick={onToggleAddTextMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
            isAddTextMode
              ? 'bg-indigo-600 text-white border-indigo-500 ring-2 ring-indigo-500/40'
              : 'bg-slate-800/80 text-slate-200 hover:text-white hover:bg-slate-700/80 border-slate-700/60'
          }`}
          title={isAddTextMode ? 'Click on page to place text' : 'Add new text box'}
        >
          {isAddTextMode ? (
            <>
              <MousePointer className="w-3.5 h-3.5 animate-pulse" />
              <span>Click on Page...</span>
            </>
          ) : (
            <>
              <PlusSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>Add Text</span>
            </>
          )}
        </button>

        {/* Zoom controls */}
        <div className="hidden md:flex items-center bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60">
          <button
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.15))}
            title="Zoom out"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium px-2 text-slate-300 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.5, zoom + 0.15))}
            title="Zoom in"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => onZoomChange(1.0)}
            title="Reset to 100%"
            className="px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          >
            100%
          </button>
        </div>
      </div>

      {/* Right: Compatibility, Open New, and Export */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenDocGuide}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700/50 transition"
          title="Document compatibility & QA notes"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Guide</span>
        </button>

        <button
          onClick={onResetFile}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700/50 transition"
          title="Upload or pick another PDF"
        >
          <Upload className="w-3.5 h-3.5 text-slate-400" />
          <span>Change PDF</span>
        </button>

        {/* Primary Export Button */}
        <button
          onClick={onExportPdf}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl shadow-lg shadow-indigo-600/25 active:scale-95 disabled:opacity-50 transition"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
