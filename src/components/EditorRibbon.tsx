import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  Hand,
  Undo2,
  Redo2,
  Type,
  Edit3,
  ScanText,
  Eraser,
  Highlighter,
  Pencil,
  Image as ImageIcon,
  Circle,
  Square,
  Minus,
  ArrowRight,
  X as CrossIcon,
  Check as CheckIcon,
  PenTool,
  MessageSquare,
  Link as LinkIcon,
  Wand2,
  File,
  Files,
  Search,
  Printer,
  Download,
  Save,
  ChevronDown,
  RotateCw,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';

export type ActiveTool =
  | 'none'
  | 'move'
  | 'addText'
  | 'editText'
  | 'fontCheck'
  | 'eraser'
  | 'highlight'
  | 'pencil'
  | 'image'
  | 'shape-circle'
  | 'shape-rect'
  | 'shape-line'
  | 'shape-arrow'
  | 'stamp-cross'
  | 'stamp-check'
  | 'sign'
  | 'annotation'
  | 'link';

interface EditorRibbonProps {
  isThumbnailsOpen: boolean;
  onToggleThumbnails: () => void;
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenSignModal: () => void;
  onUploadImageClick: () => void;
  onSearchClick: () => void;
  onPrint: () => void;
  onDownload: () => void;
  onSave: () => void;
  onDone: () => void;
  onRotateCurrentPage: () => void;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  onManagePagesClick: () => void;
}

export const EditorRibbon: React.FC<EditorRibbonProps> = ({
  isThumbnailsOpen,
  onToggleThumbnails,
  activeTool,
  onSelectTool,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenSignModal,
  onUploadImageClick,
  onSearchClick,
  onPrint,
  onDownload,
  onSave,
  onDone,
  onRotateCurrentPage,
  zoom,
  onZoomChange,
  onManagePagesClick,
}) => {
  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const ribbonRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (ribbonRef.current && !ribbonRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  return (
    <div
      ref={ribbonRef}
      className="bg-white border-b border-slate-200/90 shadow-xs flex items-center justify-between px-2 py-1 select-none overflow-x-auto shrink-0 z-30"
    >
      {/* Left/Center Tools Ribbon */}
      <div className="flex items-center gap-0.5 min-w-max">
        {/* 1. Thumbnails */}
        <div className="relative">
          <button
            onClick={() => {
              onToggleThumbnails();
              setOpenDropdown(null);
            }}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              isThumbnailsOpen
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Toggle Thumbnails Panel"
          >
            <div className="flex items-center gap-0.5">
              <LayoutGrid className="w-4 h-4 mb-0.5" />
              <ChevronDown className="w-3 h-3 opacity-80" />
            </div>
            <span className="text-[10px] leading-tight">Thumbnails</span>
          </button>
        </div>

        {/* 2. Move (Hand) */}
        <button
          onClick={() => onSelectTool(activeTool === 'move' ? 'none' : 'move')}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'move'
              ? 'bg-blue-50 text-blue-600 border border-blue-200 font-semibold'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Hand Tool: Pan and Move around page"
        >
          <Hand className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Move</span>
        </button>

        {/* 3. Undo */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Undo</span>
        </button>

        {/* 4. Redo */}
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:hover:bg-transparent transition"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Redo</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

        {/* 5. Add Text */}
        <button
          onClick={() => onSelectTool(activeTool === 'addText' ? 'none' : 'addText')}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'addText'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Click on page to place a new text box"
        >
          <Type className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Add Text</span>
        </button>

        {/* 6. Edit Text */}
        <button
          onClick={() => onSelectTool(activeTool === 'editText' ? 'none' : 'editText')}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'editText'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Click any text on page to edit directly"
        >
          <Edit3 className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Edit Text</span>
        </button>

        {/* 7. Font Check (The requested core feature!) */}
        <button
          onClick={() => onSelectTool(activeTool === 'fontCheck' ? 'none' : 'fontCheck')}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition relative ${
            activeTool === 'fontCheck'
              ? 'bg-indigo-600 text-white font-semibold shadow-xs ring-2 ring-indigo-300'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Font Check: Inspect font family, size & style for each individual letter"
        >
          <div className="relative">
            <ScanText className="w-4 h-4 mb-0.5 text-indigo-500 group-hover:text-indigo-600" />
            <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
          </div>
          <span className="text-[10px] leading-tight font-bold">Font Check</span>
        </button>

        {/* 8. Eraser */}
        <div className="relative">
          <button
            onClick={() => onSelectTool(activeTool === 'eraser' ? 'none' : 'eraser')}
            className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === 'eraser'
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Eraser: Erase or whiteout text and regions"
          >
            <div className="flex items-center gap-0.5">
              <Eraser className="w-4 h-4 mb-0.5" />
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </div>
            <span className="text-[10px] leading-tight">Eraser</span>
          </button>
        </div>

        {/* 9. Highlight */}
        <button
          onClick={() => onSelectTool(activeTool === 'highlight' ? 'none' : 'highlight')}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'highlight'
              ? 'bg-amber-500 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Highlight: Add colored highlight overlay"
        >
          <Highlighter className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Highlight</span>
        </button>

        {/* 10. Pencil */}
        <button
          onClick={() => onSelectTool(activeTool === 'pencil' ? 'none' : 'pencil')}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'pencil'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Pencil: Freehand drawing and sketch on page"
        >
          <Pencil className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Pencil</span>
        </button>

        {/* 11. Image */}
        <div className="relative">
          <button
            onClick={() => {
              toggleDropdown('image');
              onUploadImageClick();
            }}
            className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Image: Upload and place an image stamp"
          >
            <div className="flex items-center gap-0.5">
              <ImageIcon className="w-4 h-4 mb-0.5" />
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </div>
            <span className="text-[10px] leading-tight">Image</span>
          </button>
        </div>

        {/* 12. Ellipse / Shapes */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('shapes')}
            className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool.startsWith('shape-')
                ? 'bg-blue-600 text-white font-semibold shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Shapes: Circle, Rectangle, Line, Arrow"
          >
            <div className="flex items-center gap-0.5">
              <Circle className="w-4 h-4 mb-0.5" />
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </div>
            <span className="text-[10px] leading-tight">Ellipse</span>
          </button>

          {/* Shapes Dropdown Menu */}
          {openDropdown === 'shapes' && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
              <button
                onClick={() => {
                  onSelectTool('shape-circle');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition"
              >
                <Circle className="w-3.5 h-3.5 text-blue-600" />
                <span>Circle / Ellipse</span>
              </button>
              <button
                onClick={() => {
                  onSelectTool('shape-rect');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition"
              >
                <Square className="w-3.5 h-3.5 text-blue-600" />
                <span>Rectangle</span>
              </button>
              <button
                onClick={() => {
                  onSelectTool('shape-line');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition"
              >
                <Minus className="w-3.5 h-3.5 text-blue-600" />
                <span>Line</span>
              </button>
              <button
                onClick={() => {
                  onSelectTool('shape-arrow');
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition"
              >
                <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                <span>Arrow</span>
              </button>
            </div>
          )}
        </div>

        {/* 13. Cross */}
        <button
          onClick={() => onSelectTool(activeTool === 'stamp-cross' ? 'none' : 'stamp-cross')}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'stamp-cross'
              ? 'bg-rose-600 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Cross Stamp: Place an X stamp on page"
        >
          <CrossIcon className="w-4 h-4 mb-0.5 text-rose-500" />
          <span className="text-[10px] leading-tight">Cross</span>
        </button>

        {/* 14. Check */}
        <button
          onClick={() => onSelectTool(activeTool === 'stamp-check' ? 'none' : 'stamp-check')}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'stamp-check'
              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Check Stamp: Place a checkmark on page"
        >
          <CheckIcon className="w-4 h-4 mb-0.5 text-emerald-600" />
          <span className="text-[10px] leading-tight">Check</span>
        </button>

        {/* 15. Sign */}
        <button
          onClick={() => {
            onOpenSignModal();
            onSelectTool('sign');
          }}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'sign'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Sign: Draw, type, or upload digital signature"
        >
          <PenTool className="w-4 h-4 mb-0.5 text-blue-600" />
          <span className="text-[10px] leading-tight">Sign</span>
        </button>

        {/* 16. Annotation... */}
        <button
          onClick={() => onSelectTool(activeTool === 'annotation' ? 'none' : 'annotation')}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'annotation'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Annotation: Place comments and sticky notes"
        >
          <MessageSquare className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Annotation...</span>
        </button>

        {/* 17. Links */}
        <button
          onClick={() => onSelectTool(activeTool === 'link' ? 'none' : 'link')}
          className={`flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
            activeTool === 'link'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title="Links: Add clickable web hyperlinks"
        >
          <LinkIcon className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Links</span>
        </button>

        {/* 18. More Tools */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('moreTools')}
            className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            title="More PDF tools & actions"
          >
            <div className="flex items-center gap-0.5">
              <Wand2 className="w-4 h-4 mb-0.5 text-indigo-500" />
              <ChevronDown className="w-2.5 h-2.5 opacity-70" />
            </div>
            <span className="text-[10px] leading-tight">More tools</span>
          </button>

          {openDropdown === 'moreTools' && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in">
              <button
                onClick={() => {
                  onRotateCurrentPage();
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-600" />
                <span>Rotate Page (90°)</span>
              </button>
              <button
                onClick={() => {
                  onZoomChange(1.0);
                  setOpenDropdown(null);
                }}
                className="w-full px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2 transition"
              >
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Reset View (100%)</span>
              </button>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1 shrink-0" />

        {/* 19. Page Layout */}
        <div className="relative">
          <button
            onClick={() => toggleDropdown('layout')}
            className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
            title="Page layout & Zoom"
          >
            <File className="w-4 h-4 mb-0.5 text-slate-600" />
            <span className="text-[10px] leading-tight">Page layout</span>
          </button>

          {openDropdown === 'layout' && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-1">Zoom Level</div>
              <div className="flex items-center justify-between bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => onZoomChange(Math.max(0.5, zoom - 0.15))}
                  className="p-1 rounded text-slate-700 hover:bg-white transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-800">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={() => onZoomChange(Math.min(2.5, zoom + 0.15))}
                  className="p-1 rounded text-slate-700 hover:bg-white transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex gap-1 pt-1">
                <button
                  onClick={() => {
                    onZoomChange(1.0);
                    setOpenDropdown(null);
                  }}
                  className="flex-1 py-1 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 text-center"
                >
                  100%
                </button>
                <button
                  onClick={() => {
                    onZoomChange(1.35);
                    setOpenDropdown(null);
                  }}
                  className="flex-1 py-1 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md border border-slate-200 text-center"
                >
                  Fit Width
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 20. Manage Pages */}
        <button
          onClick={onManagePagesClick}
          className="flex flex-col items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          title="Manage Pages: Reorder, Rotate, Delete, Duplicate"
        >
          <Files className="w-4 h-4 mb-0.5 text-slate-600" />
          <span className="text-[10px] leading-tight">Manage P...</span>
        </button>
      </div>

      {/* Right Section (Matching Image 2 exactly) */}
      <div className="flex items-center gap-2 shrink-0 pl-2">
        <div className="h-6 w-px bg-slate-200 shrink-0" />

        {/* Search */}
        <button
          onClick={onSearchClick}
          className="flex flex-col items-center justify-center px-2 py-1 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          title="Find text in document"
        >
          <Search className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Search</span>
        </button>

        <div className="h-6 w-px bg-slate-200 shrink-0" />

        {/* Print */}
        <button
          onClick={onPrint}
          className="flex flex-col items-center justify-center px-2 py-1 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          title="Print document"
        >
          <Printer className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Print</span>
        </button>

        <div className="h-6 w-px bg-slate-200 shrink-0" />

        {/* Download */}
        <button
          onClick={onDownload}
          className="flex flex-col items-center justify-center px-2 py-1 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition"
          title="Download PDF"
        >
          <Download className="w-4 h-4 mb-0.5" />
          <span className="text-[10px] leading-tight">Download</span>
        </button>

        {/* Save button (Image 2) */}
        <button
          onClick={onSave}
          className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition border border-slate-200/80 active:scale-95"
          title="Save changes to document"
        >
          Save
        </button>

        {/* Done button (Image 2 - Primary Blue) */}
        <button
          onClick={onDone}
          className="px-6 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition active:scale-95"
          title="Done: Finalize and export PDF"
        >
          Done
        </button>
      </div>
    </div>
  );
};
