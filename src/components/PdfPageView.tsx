import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PageMeta, TextItemData } from '../types/pdf';
import { isItemModified } from '../services/pdfEngine';
import { Move, Check, Edit3, Trash2, RotateCcw } from 'lucide-react';
import { ActiveTool } from './EditorRibbon';

interface PdfPageViewProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageMeta: PageMeta;
  zoom: number;
  textItems: TextItemData[];
  selectedItemId: string | null;
  onSelectItem: (item: TextItemData | null) => void;
  onUpdateItem: (id: string, updates: Partial<TextItemData>) => void;
  onDeleteItem: (id: string) => void;
  onResetItem: (id: string) => void;
  isAddTextMode: boolean;
  onAddTextAtPoint: (pageIndex: number, pdfX: number, pdfY: number) => void;
  activeTool?: ActiveTool;
  onPlaceToolAction?: (pageIndex: number, pdfX: number, pdfY: number, tool: ActiveTool) => void;
  searchQuery?: string;
}

interface HoveredLetterInfo {
  char: string;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  screenX: number;
  screenY: number;
}

function getCssFontFamily(family: string): string {
  if (family === 'Helvetica') return 'Helvetica, Arial, sans-serif';
  if (family === 'Times New Roman') return "'Times New Roman', Times, Georgia, serif";
  if (family === 'Courier New') return "'Courier New', Courier, monospace";
  if (family === 'Inter') return "'Inter', sans-serif";
  return family;
}

export const PdfPageView: React.FC<PdfPageViewProps> = ({
  pdfDoc,
  pageMeta,
  zoom,
  textItems,
  selectedItemId,
  onSelectItem,
  onUpdateItem,
  onDeleteItem,
  onResetItem,
  isAddTextMode,
  onAddTextAtPoint,
  activeTool = 'editText',
  onPlaceToolAction,
  searchQuery = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = useState<any>(null);
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [dragState, setDragState] = useState<{
    itemId: string;
    startX: number;
    startY: number;
    initialPdfX: number;
    initialPdfY: number;
  } | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [hoveredLetter, setHoveredLetter] = useState<HoveredLetterInfo | null>(null);

  // Pencil freehand drawing state
  const pencilCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPencilDrawing, setIsPencilDrawing] = useState(false);

  // Render PDF page to canvas
  useEffect(() => {
    let isCancelled = false;
    let renderTask: any = null;

    async function renderPage() {
      if (!canvasRef.current || !pdfDoc) return;

      try {
        const page = await pdfDoc.getPage(pageMeta.originalIndex + 1);
        if (isCancelled) return;

        const vp = page.getViewport({
          scale: zoom,
          rotation: pageMeta.rotation,
        });
        setViewport(vp);

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(vp.width * dpr);
        canvas.height = Math.floor(vp.height * dpr);
        canvas.style.width = `${vp.width}px`;
        canvas.style.height = `${vp.height}px`;

        ctx.scale(dpr, dpr);

        renderTask = page.render({
          canvas,
          canvasContext: ctx,
          viewport: vp,
        });

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, pageMeta.originalIndex, pageMeta.rotation, zoom]);

  // Handle clicking on page to add text, stamps, shapes, or annotations
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewport || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert viewport screen coords to PDF point coords
    const [pdfX, pdfY] = viewport.convertToPdfPoint(clickX, clickY);

    if (isAddTextMode || activeTool === 'addText') {
      onAddTextAtPoint(pageMeta.originalIndex, pdfX, pdfY);
    } else if (onPlaceToolAction && activeTool && activeTool !== 'none' && activeTool !== 'editText' && activeTool !== 'fontCheck' && activeTool !== 'move') {
      onPlaceToolAction(pageMeta.originalIndex, pdfX, pdfY, activeTool);
    }
  };

  // Convert PDF coords to screen coords
  const getScreenCoords = (item: TextItemData) => {
    if (!viewport) return { x: 0, y: 0, width: 20, height: 16 };
    // [screenX, screenBaselineY]
    const [screenX, screenBaselineY] = viewport.convertToViewportPoint(item.pdfX, item.pdfY);
    const itemHeight = Math.max(item.fontSize * zoom, 14);
    const itemWidth = Math.max(item.pdfWidth * zoom, 24);

    // Screen Y is top-left
    const screenY = screenBaselineY - (item.fontSize * zoom * 0.85);

    return {
      x: screenX,
      y: screenY,
      width: itemWidth,
      height: itemHeight,
    };
  };

  const handleStartEditing = (item: TextItemData) => {
    setIsEditingId(item.id);
    setEditingText(item.currentText);
    onSelectItem(item);
  };

  const handleFinishEditing = (itemId: string) => {
    if (isEditingId === itemId) {
      onUpdateItem(itemId, { currentText: editingText });
      setIsEditingId(null);
    }
  };

  // Dragging reposition handlers
  const handleMouseDownOnHandle = (e: React.MouseEvent, item: TextItemData) => {
    e.stopPropagation();
    setDragState({
      itemId: item.id,
      startX: e.clientX,
      startY: e.clientY,
      initialPdfX: item.pdfX,
      initialPdfY: item.pdfY,
    });
  };

  useEffect(() => {
    if (!dragState || !viewport) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaScreenX = e.clientX - dragState.startX;
      const deltaScreenY = e.clientY - dragState.startY;

      // In PDF coordinate space, Y is inverted (up is positive)
      const scaleFactor = 1 / zoom;
      const newPdfX = dragState.initialPdfX + deltaScreenX * scaleFactor;
      const newPdfY = dragState.initialPdfY - deltaScreenY * scaleFactor;

      onUpdateItem(dragState.itemId, {
        pdfX: Math.round(newPdfX),
        pdfY: Math.round(newPdfY),
      });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, viewport, zoom, onUpdateItem]);

  const getContainerCursorClass = () => {
    if (activeTool === 'move') return 'cursor-grab active:cursor-grabbing';
    if (activeTool === 'addText' || isAddTextMode) return 'cursor-crosshair ring-2 ring-blue-500';
    if (activeTool === 'fontCheck') return 'cursor-help ring-2 ring-indigo-400/50';
    if (activeTool === 'eraser') return 'cursor-not-allowed';
    if (activeTool === 'highlight') return 'cursor-text';
    if (activeTool === 'pencil') return 'cursor-crosshair';
    if (activeTool && (activeTool.startsWith('stamp-') || activeTool.startsWith('shape-') || activeTool === 'annotation')) {
      return 'cursor-crosshair';
    }
    return 'cursor-default';
  };

  // Pencil drawing handlers
  const handlePencilMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool !== 'pencil') return;
    setIsPencilDrawing(true);
    const canvas = pencilCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handlePencilMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPencilDrawing || activeTool !== 'pencil') return;
    const canvas = pencilCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2563eb';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handlePencilMouseUp = () => {
    setIsPencilDrawing(false);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 select-none">
      <div
        ref={containerRef}
        onClick={handlePageClick}
        onMouseLeave={() => {
          setHoveredItemId(null);
          setHoveredLetter(null);
          setIsPencilDrawing(false);
        }}
        className={`relative shadow-2xl rounded-sm bg-white overflow-hidden transition-shadow ${getContainerCursorClass()}`}
        style={{
          width: viewport ? `${viewport.width}px` : `${pageMeta.width * zoom}px`,
          height: viewport ? `${viewport.height}px` : `${pageMeta.height * zoom}px`,
        }}
      >
        {/* PDF Canvas Layer */}
        <canvas ref={canvasRef} className="block pointer-events-none" />

        {/* Pencil Drawing Layer */}
        <canvas
          ref={pencilCanvasRef}
          width={viewport ? viewport.width : pageMeta.width * zoom}
          height={viewport ? viewport.height : pageMeta.height * zoom}
          onMouseDown={handlePencilMouseDown}
          onMouseMove={handlePencilMouseMove}
          onMouseUp={handlePencilMouseUp}
          className={`absolute inset-0 z-25 ${
            activeTool === 'pencil' ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
          }`}
        />

        {/* Global Floating Letter-level Font Inspector Tooltip */}
        {hoveredLetter && (
          <div
            className="absolute z-50 pointer-events-none -translate-x-1/2 -translate-y-full mb-1 px-2.5 py-1 rounded-lg bg-slate-900/95 text-slate-100 text-[11px] font-mono font-medium border border-slate-700/80 shadow-2xl flex items-center gap-1.5 backdrop-blur-xs select-none transition-all duration-75 animate-in fade-in zoom-in-95"
            style={{
              left: `${hoveredLetter.screenX}px`,
              top: `${hoveredLetter.screenY - 4}px`,
              lineHeight: '1.2',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span className="font-semibold text-white font-sans">{hoveredLetter.fontFamily}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-200">{hoveredLetter.fontSize}pt</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-300">
              {hoveredLetter.bold
                ? hoveredLetter.italic
                  ? 'Bold Italic'
                  : 'Bold'
                : hoveredLetter.italic
                ? 'Italic'
                : 'Regular'}
            </span>
          </div>
        )}

        {/* Text Elements Layer */}
        {viewport &&
          textItems.map((item) => {
            if (item.isDeleted) {
              // Draw whiteout over deleted text
              const pos = getScreenCoords(item);
              return (
                <div
                  key={item.id}
                  className="absolute pointer-events-none border border-dashed border-rose-300/40"
                  style={{
                    left: `${pos.x - 2}px`,
                    top: `${pos.y - 2}px`,
                    width: `${pos.width + 4}px`,
                    height: `${pos.height + 4}px`,
                    backgroundColor: item.backgroundColor || '#ffffff',
                  }}
                  title="Deleted text (will be blank in export)"
                />
              );
            }

            const pos = getScreenCoords(item);
            const isSelected = selectedItemId === item.id;
            const isEditing = isEditingId === item.id;
            const isHovered = hoveredItemId === item.id && !isSelected && !isEditing && !isAddTextMode && !dragState;
            const isModified = isItemModified(item);
            const isSearchMatch = Boolean(
              searchQuery && searchQuery.trim().length > 0 &&
              item.currentText.toLowerCase().includes(searchQuery.toLowerCase())
            );

            const fontWeightLabel = item.bold
              ? item.italic
                ? 'Bold Italic'
                : 'Bold'
              : item.italic
              ? 'Italic'
              : 'Regular';

            return (
              <div
                key={item.id}
                onMouseEnter={() => {
                  if (!isEditingId && !isAddTextMode && !dragState) {
                    setHoveredItemId(item.id);
                  }
                }}
                onMouseLeave={() => {
                  if (hoveredItemId === item.id) {
                    setHoveredItemId(null);
                  }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === 'eraser') {
                    onDeleteItem(item.id);
                    return;
                  }
                  if (activeTool === 'highlight') {
                    onUpdateItem(item.id, {
                      backgroundColor: item.backgroundColor === '#fef08a' ? '#ffffff' : '#fef08a',
                    });
                    return;
                  }
                  setHoveredItemId(null);
                  onSelectItem(item);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setHoveredItemId(null);
                  handleStartEditing(item);
                }}
                className={`absolute cursor-pointer transition-all ${
                  isSelected
                    ? 'ring-2 ring-blue-500 z-20'
                    : isSearchMatch
                    ? 'ring-2 ring-amber-400 bg-amber-400/25 z-15'
                    : 'z-10'
                } ${isModified ? 'shadow-xs' : ''}`}
                style={{
                  left: `${pos.x - 2}px`,
                  top: `${pos.y - 2}px`,
                  minWidth: `${Math.max(pos.width + 4, 20)}px`,
                  minHeight: `${pos.height + 4}px`,
                }}
              >
                {/* When modified or custom added, hide original canvas text with whiteout patch */}
                {(isModified || item.isCustomAdded) && (
                  <div
                    className="absolute inset-0 -z-10 rounded-xs pointer-events-none"
                    style={{ backgroundColor: item.backgroundColor || '#ffffff' }}
                  />
                )}

                {/* In-place Text Display or Active Input */}
                {isEditing ? (
                  <div className="relative w-full h-full flex items-start">
                    <textarea
                      autoFocus
                      rows={Math.max(1, (editingText.match(/\n/g) || []).length + 1)}
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={() => handleFinishEditing(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault();
                          handleFinishEditing(item.id);
                        }
                        if (e.key === 'Escape') setIsEditingId(null);
                      }}
                      className="bg-white text-slate-900 border border-indigo-500 rounded-xs outline-none p-1 font-medium leading-tight resize-none shadow-xl overflow-hidden"
                      style={{
                        fontFamily: getCssFontFamily(item.fontFamily),
                        fontSize: `${item.fontSize * zoom}px`,
                        fontWeight: item.bold ? '700' : '400',
                        fontStyle: item.italic ? 'italic' : 'normal',
                        color: item.color,
                        width: `${Math.max(pos.width + 12, 120)}px`,
                        minHeight: `${Math.max(pos.height + 4, 26)}px`,
                        lineHeight: 1.15,
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFinishEditing(item.id);
                      }}
                      className="absolute -right-7 -top-2 bg-indigo-600 text-white p-1 rounded-full shadow-md hover:bg-indigo-500 transition z-30"
                      title="Save text (Ctrl+Enter)"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="px-0.5 leading-tight whitespace-pre-wrap break-words"
                    style={{
                      fontSize: `${item.fontSize * zoom}px`,
                      color: item.color,
                      width: `${pos.width + 4}px`,
                      minHeight: `${pos.height}px`,
                      lineHeight: 1.15,
                    }}
                  >
                    {item.tokens && item.tokens.length > 0 ? (
                      item.tokens.map((token, tIdx) => {
                        const tokenFamily = getCssFontFamily(token.fontFamily);
                        const isCustomOrMod = isModified || item.isCustomAdded;
                        return (
                          <span
                            key={tIdx}
                            style={{
                              fontFamily: tokenFamily,
                              fontWeight: token.bold ? '700' : '400',
                              fontStyle: token.italic ? 'italic' : 'normal',
                            }}
                          >
                            {token.text.split('').map((c, cIdx) => (
                              <span
                                key={cIdx}
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
                                  setHoveredLetter({
                                    char: c,
                                    fontFamily: token.fontFamily,
                                    fontSize: token.fontSize || item.fontSize,
                                    bold: token.bold,
                                    italic: token.italic,
                                    screenX: rect.left - containerRect.left + rect.width / 2,
                                    screenY: rect.top - containerRect.top,
                                  });
                                }}
                                onMouseLeave={() => setHoveredLetter(null)}
                                className={`inline-block cursor-text transition-all rounded-[1px] hover:bg-indigo-500/25 hover:ring-1 hover:ring-indigo-400 ${
                                  isCustomOrMod ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                                }`}
                              >
                                {c === ' ' ? '\u00A0' : c}
                              </span>
                            ))}
                          </span>
                        );
                      })
                    ) : (
                      item.currentText.split('').map((c, cIdx) => {
                        const isCustomOrMod = isModified || item.isCustomAdded;
                        return (
                          <span
                            key={cIdx}
                            style={{
                              fontFamily: getCssFontFamily(item.fontFamily),
                              fontWeight: item.bold ? '700' : '400',
                              fontStyle: item.italic ? 'italic' : 'normal',
                            }}
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const containerRect = containerRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
                              setHoveredLetter({
                                char: c,
                                fontFamily: item.fontFamily,
                                fontSize: item.fontSize,
                                bold: item.bold,
                                italic: item.italic,
                                screenX: rect.left - containerRect.left + rect.width / 2,
                                screenY: rect.top - containerRect.top,
                              });
                            }}
                            onMouseLeave={() => setHoveredLetter(null)}
                            className={`inline-block cursor-text transition-all rounded-[1px] hover:bg-indigo-500/25 hover:ring-1 hover:ring-indigo-400 ${
                              isCustomOrMod ? 'opacity-100' : 'opacity-0 hover:opacity-100'
                            }`}
                          >
                            {c === ' ' ? '\u00A0' : c}
                          </span>
                        );
                      })
                    )}
                  </div>
                )}

                {/* Selection Badges and Controls */}
                {isSelected && !isEditing && (
                  <div className="absolute -top-7 left-0 flex items-center gap-1 bg-slate-900 text-white px-2 py-0.5 rounded-lg shadow-lg text-[10px] whitespace-nowrap z-30 pointer-events-auto">
                    {/* Drag Move Handle */}
                    <div
                      onMouseDown={(e) => handleMouseDownOnHandle(e, item)}
                      className="cursor-move p-0.5 hover:text-indigo-400"
                      title="Drag to reposition text"
                    >
                      <Move className="w-3 h-3" />
                    </div>

                    {/* Edit Text */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEditing(item);
                      }}
                      className="p-0.5 hover:text-indigo-400 flex items-center gap-0.5"
                      title="Edit text content"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {/* Reset if modified */}
                    {isModified && !item.isCustomAdded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResetItem(item.id);
                        }}
                        className="p-0.5 hover:text-amber-400"
                        title="Reset to original"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteItem(item.id);
                      }}
                      className="p-0.5 hover:text-rose-400"
                      title="Delete text"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
