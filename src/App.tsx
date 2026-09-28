import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PageMeta, TextItemData, SUPPORTED_FONTS } from './types/pdf';
import {
  loadPdfDocument,
  extractAllPagesData,
  exportModifiedPdf,
  detectIsBangla,
  isItemModified,
} from './services/pdfEngine';
import { TopNavbar } from './components/TopNavbar';
import { EditorRibbon, ActiveTool } from './components/EditorRibbon';
import { PageSidebar } from './components/PageSidebar';
import { PdfPageView } from './components/PdfPageView';
import { TextFormatToolbar } from './components/TextFormatToolbar';
import { LandingDropzone } from './components/LandingDropzone';
import { PasswordModal } from './components/PasswordModal';
import { DocumentationModal } from './components/DocumentationModal';
import { SignatureModal } from './components/SignatureModal';
import { SearchModal } from './components/SearchModal';

interface HistorySnapshot {
  pages: PageMeta[];
  textItems: Record<string, TextItemData>;
}

export default function App() {
  // Document state
  const [rawPdfBytes, setRawPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [fileName, setFileName] = useState<string>('document.pdf');
  const [pages, setPages] = useState<PageMeta[]>([]);
  const [textItems, setTextItems] = useState<Record<string, TextItemData>>({});
  const [activePageIndex, setActivePageIndex] = useState<number>(0);

  // Editor UI state
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1.15);
  const [isAddTextMode, setIsAddTextMode] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  // Extended Ribbon Tool state matching user request
  const [activeTool, setActiveTool] = useState<ActiveTool>('editText');
  const [isThumbnailsOpen, setIsThumbnailsOpen] = useState<boolean>(true);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password modal state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pendingEncryptedBytes, setPendingEncryptedBytes] = useState<Uint8Array | null>(null);

  // Documentation / Guide modal
  const [isDocGuideOpen, setIsDocGuideOpen] = useState<boolean>(false);

  // Undo / Redo history
  const [history, setHistory] = useState<HistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Push new history state
  const pushHistory = useCallback(
    (newPages: PageMeta[], newTextItems: Record<string, TextItemData>) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, { pages: newPages, textItems: newTextItems }];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = useCallback(() => {
    if (!canUndo) return;
    const targetIdx = historyIndex - 1;
    const snapshot = history[targetIdx];
    if (snapshot) {
      setPages(snapshot.pages);
      setTextItems(snapshot.textItems);
      setHistoryIndex(targetIdx);
    }
  }, [canUndo, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (!canRedo) return;
    const targetIdx = historyIndex + 1;
    const snapshot = history[targetIdx];
    if (snapshot) {
      setPages(snapshot.pages);
      setTextItems(snapshot.textItems);
      setHistoryIndex(targetIdx);
    }
  }, [canRedo, history, historyIndex]);

  // Global keyboard shortcuts (Ctrl+Z, Ctrl+Y, Escape, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Escape') {
        setSelectedItemId(null);
        setIsAddTextMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Process and load PDF ArrayBuffer or Uint8Array
  const processPdfData = async (input: ArrayBuffer | Uint8Array, name: string, password?: string) => {
    setIsLoading(true);
    setLoadingMessage('Loading PDF document...');
    setPasswordError(null);

    // Make an isolated, pristine clone of the input bytes
    const u8 = input instanceof Uint8Array
      ? new Uint8Array(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength))
      : new Uint8Array(input.slice(0));

    try {
      // Pass a clone to loadPdfDocument so u8 remains completely untouched and never detached
      const doc = await loadPdfDocument(new Uint8Array(u8), password);
      setLoadingMessage('Extracting text positions & fonts...');
      const pagesData = await extractAllPagesData(doc);

      const newPages: PageMeta[] = pagesData.map((pd) => pd.meta);
      const newItemsMap: Record<string, TextItemData> = {};

      pagesData.forEach((pd) => {
        pd.textItems.forEach((item) => {
          newItemsMap[item.id] = item;
        });
      });

      // Store a fresh clone in state
      setRawPdfBytes(new Uint8Array(u8));
      setPdfDoc(doc);
      setFileName(name);
      setPages(newPages);
      setTextItems(newItemsMap);
      setActivePageIndex(0);
      setSelectedItemId(null);
      setIsPasswordModalOpen(false);
      setPendingEncryptedBytes(null);

      // Initialize history
      setHistory([{ pages: newPages, textItems: newItemsMap }]);
      setHistoryIndex(0);
    } catch (err: any) {
      console.warn('PDF load caught error:', err);
      // Check if password exception
      if (
        err?.name === 'PasswordException' ||
        err?.message?.toLowerCase().includes('password') ||
        err?.code === 1
      ) {
        setPendingEncryptedBytes(new Uint8Array(u8));
        setFileName(name);
        setIsPasswordModalOpen(true);
        if (password) {
          setPasswordError('Incorrect password. Please try again.');
        }
      } else {
        alert(`Failed to parse PDF: ${err?.message || 'Unsupported format'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Upload handler
  const handleFileSelected = async (file: File) => {
    try {
      const buffer = await file.arrayBuffer();
      await processPdfData(buffer, file.name);
    } catch (err: any) {
      alert(`Could not read file: ${err.message}`);
    }
  };

  // Load sample documents
  const handleLoadSample = async (samplePath: string, sampleName: string) => {
    setIsLoading(true);
    setLoadingMessage('Fetching sample document...');
    try {
      const res = await fetch(samplePath);
      if (!res.ok) throw new Error('Sample not found');
      const buffer = await res.arrayBuffer();
      await processPdfData(buffer, sampleName);
    } catch (err: any) {
      alert(`Could not load sample: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Password submission
  const handlePasswordSubmit = async (password: string) => {
    if (!pendingEncryptedBytes) return;
    await processPdfData(new Uint8Array(pendingEncryptedBytes), fileName, password);
  };

  // Text Item updates
  const handleUpdateItem = useCallback(
    (id: string, updates: Partial<TextItemData>) => {
      setTextItems((prev) => {
        const item = prev[id];
        if (!item) return prev;
        const updated = { ...item, ...updates, isModified: true };

        // Auto-detect Bangla if text content is changed
        if (updates.currentText !== undefined) {
          updated.isBangla = detectIsBangla(updates.currentText);
          if (updated.isBangla && !item.isBangla) {
            updated.fontFamily = 'Noto Sans Bengali';
          }
        }

        const next = { ...prev, [id]: updated };
        pushHistory(pages, next);
        return next;
      });
    },
    [pages, pushHistory]
  );

  const handleDeleteItem = useCallback(
    (id: string) => {
      setTextItems((prev) => {
        const item = prev[id];
        if (!item) return prev;
        const updated = { ...item, isDeleted: true, isModified: true };
        const next = { ...prev, [id]: updated };
        pushHistory(pages, next);
        return next;
      });
      setSelectedItemId(null);
    },
    [pages, pushHistory]
  );

  const handleResetItem = useCallback(
    (id: string) => {
      setTextItems((prev) => {
        const item = prev[id];
        if (!item) return prev;
        const updated: TextItemData = {
          ...item,
          currentText: item.originalText,
          fontSize: item.originalFontSize || 12,
          fontFamily: item.originalFontFamily || item.fontFamily,
          bold: item.originalBold ?? false,
          italic: item.originalItalic ?? false,
          color: item.originalColor || '#0f172a',
          isModified: false,
          isDeleted: false,
        };
        const next = { ...prev, [id]: updated };
        pushHistory(pages, next);
        return next;
      });
    },
    [pages, pushHistory]
  );

  // Add new text element on page
  const handleAddTextAtPoint = useCallback(
    (pageIndex: number, pdfX: number, pdfY: number) => {
      const newId = `custom-txt-${pageIndex}-${Date.now()}`;
      const newItem: TextItemData = {
        id: newId,
        originalText: '',
        currentText: 'New Text Block',
        pageIndex,
        pdfX: Math.round(pdfX),
        pdfY: Math.round(pdfY),
        pdfWidth: 120,
        pdfHeight: 20,
        fontSize: 14,
        fontFamily: 'Inter',
        isBangla: false,
        color: '#0f172a',
        bold: false,
        italic: false,
        isCustomAdded: true,
        isDeleted: false,
        originalFontName: 'CustomAdded',
        isFallbackFont: false,
        backgroundColor: '#ffffff',
      };

      setTextItems((prev) => {
        const next = { ...prev, [newId]: newItem };
        pushHistory(pages, next);
        return next;
      });

      setSelectedItemId(newId);
      setIsAddTextMode(false);
    },
    [pages, pushHistory]
  );

  // Show temporary toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Place stamp, shape, or annotation action
  const handlePlaceToolAction = useCallback(
    (pageIndex: number, pdfX: number, pdfY: number, tool: ActiveTool) => {
      const newId = `tool-${tool}-${pageIndex}-${Date.now()}`;
      let text = '';
      let color = '#2563eb';
      let fontSize = 14;
      let backgroundColor = '#ffffff';

      if (tool === 'stamp-cross') {
        text = '✕';
        color = '#ef4444';
        fontSize = 24;
      } else if (tool === 'stamp-check') {
        text = '✓';
        color = '#10b981';
        fontSize = 24;
      } else if (tool === 'shape-circle') {
        text = '⭕';
        fontSize = 28;
      } else if (tool === 'shape-rect') {
        text = '🔲';
        fontSize = 28;
      } else if (tool === 'shape-line') {
        text = '──────────';
        color = '#2563eb';
        fontSize = 14;
      } else if (tool === 'shape-arrow') {
        text = '➔';
        color = '#2563eb';
        fontSize = 20;
      } else if (tool === 'annotation') {
        text = '📌 Note: Click to edit note...';
        color = '#92400e';
        backgroundColor = '#fef3c7';
        fontSize = 12;
      } else if (tool === 'link') {
        text = '🔗 https://';
        color = '#2563eb';
        fontSize = 12;
      } else {
        return;
      }

      const newItem: TextItemData = {
        id: newId,
        originalText: '',
        currentText: text,
        pageIndex,
        pdfX: Math.round(pdfX),
        pdfY: Math.round(pdfY),
        pdfWidth: Math.max(text.length * (fontSize * 0.6), 40),
        pdfHeight: fontSize + 6,
        fontSize,
        fontFamily: 'Inter',
        isBangla: false,
        color,
        bold: false,
        italic: false,
        isCustomAdded: true,
        isDeleted: false,
        originalFontName: 'StampTool',
        isFallbackFont: false,
        backgroundColor,
      };

      setTextItems((prev) => {
        const next = { ...prev, [newId]: newItem };
        pushHistory(pages, next);
        return next;
      });

      setSelectedItemId(newId);
      showToast(`${tool} placed on page!`);
    },
    [pages, pushHistory, showToast]
  );

  // Signature placement
  const handleSaveSignature = useCallback(
    (dataUrl: string) => {
      const newId = `sign-${activePageIndex}-${Date.now()}`;
      const newItem: TextItemData = {
        id: newId,
        originalText: '',
        currentText: '✍️ Signature',
        pageIndex: activePageIndex,
        pdfX: 100,
        pdfY: 200,
        pdfWidth: 150,
        pdfHeight: 40,
        fontSize: 20,
        fontFamily: 'Times New Roman',
        isBangla: false,
        bold: true,
        italic: true,
        color: '#1e3a8a',
        isCustomAdded: true,
        isDeleted: false,
        originalFontName: 'Signature',
        isFallbackFont: false,
        backgroundColor: '#ffffff',
      };
      setTextItems((prev) => {
        const next = { ...prev, [newId]: newItem };
        pushHistory(pages, next);
        return next;
      });
      setSelectedItemId(newId);
      showToast('Signature added to page!');
    },
    [activePageIndex, pages, pushHistory, showToast]
  );

  // Image insertion
  const handleImageUploaded = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const newId = `img-${activePageIndex}-${Date.now()}`;
      const newItem: TextItemData = {
        id: newId,
        originalText: '',
        currentText: `🖼️ [Image: ${file.name}]`,
        pageIndex: activePageIndex,
        pdfX: 80,
        pdfY: 250,
        pdfWidth: 160,
        pdfHeight: 30,
        fontSize: 14,
        fontFamily: 'Inter',
        isBangla: false,
        bold: false,
        italic: false,
        color: '#0f172a',
        isCustomAdded: true,
        isDeleted: false,
        originalFontName: 'ImagePlaceholder',
        isFallbackFont: false,
        backgroundColor: '#f1f5f9',
      };
      setTextItems((prev) => {
        const next = { ...prev, [newId]: newItem };
        pushHistory(pages, next);
        return next;
      });
      setSelectedItemId(newId);
      showToast('Image inserted onto page!');
      e.target.value = '';
    },
    [activePageIndex, pages, pushHistory, showToast]
  );

  // Print document
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Save document state
  const handleSave = useCallback(() => {
    pushHistory(pages, textItems);
    showToast('Document saved successfully! All edits recorded.');
  }, [pages, textItems, pushHistory, showToast]);

  // Page manipulation: Rotate
  const handleRotatePage = useCallback(
    (originalIndex: number) => {
      setPages((prev) => {
        const next = prev.map((p) =>
          p.originalIndex === originalIndex ? { ...p, rotation: (p.rotation + 90) % 360 } : p
        );
        pushHistory(next, textItems);
        return next;
      });
    },
    [textItems, pushHistory]
  );

  // Page manipulation: Move Up / Down
  const handleMovePage = useCallback(
    (displayIdx: number, direction: 'up' | 'down') => {
      setPages((prev) => {
        const visible = prev.filter((p) => !p.isDeleted);
        const targetIdx = direction === 'up' ? displayIdx - 1 : displayIdx + 1;
        if (targetIdx < 0 || targetIdx >= visible.length) return prev;

        const next = [...prev];
        const itemA = visible[displayIdx];
        const itemB = visible[targetIdx];
        const indexInAllA = next.findIndex((p) => p.id === itemA.id);
        const indexInAllB = next.findIndex((p) => p.id === itemB.id);

        const temp = next[indexInAllA];
        next[indexInAllA] = next[indexInAllB];
        next[indexInAllB] = temp;

        pushHistory(next, textItems);
        return next;
      });
    },
    [textItems, pushHistory]
  );

  // Page manipulation: Delete
  const handleDeletePage = useCallback(
    (originalIndex: number) => {
      setPages((prev) => {
        const next = prev.map((p) =>
          p.originalIndex === originalIndex ? { ...p, isDeleted: true } : p
        );
        const remaining = next.filter((p) => !p.isDeleted);
        if (remaining.length > 0 && activePageIndex === originalIndex) {
          setActivePageIndex(remaining[0].originalIndex);
        }
        pushHistory(next, textItems);
        return next;
      });
    },
    [activePageIndex, textItems, pushHistory]
  );

  // Count modified items per page
  const modifiedCountPerPage = useMemo(() => {
    const counts: Record<number, number> = {};
    Object.values(textItems).forEach((item) => {
      if (isItemModified(item)) {
        counts[item.pageIndex] = (counts[item.pageIndex] || 0) + 1;
      }
    });
    return counts;
  }, [textItems]);

  // Export & Download
  const handleExportPdf = async () => {
    if (!rawPdfBytes) return;
    setIsExporting(true);

    try {
      const exportedBytes = await exportModifiedPdf(new Uint8Array(rawPdfBytes), pages, textItems);
      const blob = new Blob([new Uint8Array(exportedBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = fileName.replace(/\.pdf$/i, '');
      a.download = `${baseName}-edited.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert(`Export error: ${err.message || 'Failed to generate PDF'}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Reset to landing view
  const handleResetFile = () => {
    if (Object.keys(modifiedCountPerPage).length > 0) {
      if (!confirm('Discard current document edits and open a new file?')) {
        return;
      }
    }
    setRawPdfBytes(null);
    setPdfDoc(null);
    setPages([]);
    setTextItems({});
    setSelectedItemId(null);
  };

  // Current active page
  const currentPageMeta = pages.find((p) => p.originalIndex === activePageIndex);
  const visiblePages = pages.filter((p) => !p.isDeleted);
  const currentDisplayPageNumber = visiblePages.findIndex((p) => p.originalIndex === activePageIndex) + 1;

  // Selected item reference
  const selectedItem = selectedItemId ? textItems[selectedItemId] || null : null;

  // Items on active page
  const activePageItems = useMemo(() => {
    return Object.values(textItems).filter((item) => item.pageIndex === activePageIndex);
  }, [textItems, activePageIndex]);

  // If no document is loaded, show the clean Landing Page
  if (!rawPdfBytes || !pdfDoc || !currentPageMeta) {
    return (
      <>
        <LandingDropzone
          onFileSelected={handleFileSelected}
          onLoadSample={handleLoadSample}
          onOpenDocGuide={() => setIsDocGuideOpen(true)}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
        />
        <PasswordModal
          fileName={fileName}
          isOpen={isPasswordModalOpen}
          error={passwordError}
          onSubmit={handlePasswordSubmit}
          onCancel={() => {
            setIsPasswordModalOpen(false);
            setPendingEncryptedBytes(null);
          }}
        />
        <DocumentationModal
          isOpen={isDocGuideOpen}
          onClose={() => setIsDocGuideOpen(false)}
        />
      </>
    );
  }

  // Search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return Object.values(textItems).filter((item) =>
      item.currentText.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [textItems, searchQuery]);

  return (
    <div className="flex flex-col h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* Top Brand Navbar */}
      <TopNavbar
        fileName={fileName}
        currentPageDisplay={Math.max(1, currentDisplayPageNumber)}
        totalPages={visiblePages.length}
        zoom={zoom}
        onZoomChange={setZoom}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isAddTextMode={activeTool === 'addText'}
        onToggleAddTextMode={() => setActiveTool(activeTool === 'addText' ? 'editText' : 'addText')}
        onExportPdf={handleExportPdf}
        isExporting={isExporting}
        onOpenDocGuide={() => setIsDocGuideOpen(true)}
        onResetFile={handleResetFile}
      />

      {/* Primary Editor Ribbon (Matching User Images 1 & 2) */}
      <EditorRibbon
        isThumbnailsOpen={isThumbnailsOpen}
        onToggleThumbnails={() => setIsThumbnailsOpen(!isThumbnailsOpen)}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenSignModal={() => setIsSignatureModalOpen(true)}
        onUploadImageClick={() => fileInputRef.current?.click()}
        onSearchClick={() => setIsSearchModalOpen(true)}
        onPrint={handlePrint}
        onDownload={handleExportPdf}
        onSave={handleSave}
        onDone={handleExportPdf}
        onRotateCurrentPage={() => handleRotatePage(currentPageMeta.originalIndex)}
        zoom={zoom}
        onZoomChange={setZoom}
        onManagePagesClick={() => setIsThumbnailsOpen(true)}
      />

      {/* Hidden file input for image stamps */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageUploaded}
        className="hidden"
      />

      {/* In-Document Search Popover */}
      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => {
          setIsSearchModalOpen(false);
          setSearchQuery('');
        }}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setCurrentMatchIndex(0);
        }}
        matchesCount={searchMatches.length}
        currentMatchIndex={currentMatchIndex}
        onNextMatch={() => {
          if (searchMatches.length > 0) {
            const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
            setCurrentMatchIndex(nextIdx);
            const matchItem = searchMatches[nextIdx];
            if (matchItem) {
              setActivePageIndex(matchItem.pageIndex);
              setSelectedItemId(matchItem.id);
            }
          }
        }}
        onPrevMatch={() => {
          if (searchMatches.length > 0) {
            const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
            setCurrentMatchIndex(prevIdx);
            const matchItem = searchMatches[prevIdx];
            if (matchItem) {
              setActivePageIndex(matchItem.pageIndex);
              setSelectedItemId(matchItem.id);
            }
          }
        }}
      />

      {/* Editor Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Thumbnails Sidebar */}
        {isThumbnailsOpen && (
          <PageSidebar
            pages={pages}
            activePageIndex={activePageIndex}
            onSelectPage={(idx) => {
              setActivePageIndex(idx);
              setSelectedItemId(null);
            }}
            onRotatePage={handleRotatePage}
            onMovePage={handleMovePage}
            onDeletePage={handleDeletePage}
            modifiedCountPerPage={modifiedCountPerPage}
          />
        )}

        {/* Center Canvas View Area */}
        <main
          onClick={() => {
            if (activeTool !== 'addText' && !activeTool.startsWith('shape-') && !activeTool.startsWith('stamp-')) {
              setSelectedItemId(null);
            }
          }}
          className="flex-1 bg-slate-200/70 overflow-auto flex flex-col items-center relative p-4 sm:p-8"
        >
          {/* Floating Toast Notification */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* Floating Text Format Toolbar */}
          {selectedItem && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="sticky top-2 z-40 mb-4 max-w-2xl w-full"
            >
              <TextFormatToolbar
                selectedItem={selectedItem}
                onUpdateItem={(updates) => handleUpdateItem(selectedItem.id, updates)}
                onDeleteItem={handleDeleteItem}
                onResetItem={handleResetItem}
                onDeselect={() => setSelectedItemId(null)}
              />
            </div>
          )}

          {/* Page Canvas Container */}
          <PdfPageView
            pdfDoc={pdfDoc}
            pageMeta={currentPageMeta}
            zoom={zoom}
            textItems={activePageItems}
            selectedItemId={selectedItemId}
            onSelectItem={(item) => setSelectedItemId(item ? item.id : null)}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
            onResetItem={handleResetItem}
            isAddTextMode={activeTool === 'addText'}
            onAddTextAtPoint={handleAddTextAtPoint}
            activeTool={activeTool}
            onPlaceToolAction={handlePlaceToolAction}
            searchQuery={searchQuery}
          />
        </main>
      </div>

      {/* Signature Creation Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={handleSaveSignature}
      />

      {/* Security and Guide Modals */}
      <PasswordModal
        fileName={fileName}
        isOpen={isPasswordModalOpen}
        error={passwordError}
        onSubmit={handlePasswordSubmit}
        onCancel={() => {
          setIsPasswordModalOpen(false);
          setPendingEncryptedBytes(null);
        }}
      />

      <DocumentationModal
        isOpen={isDocGuideOpen}
        onClose={() => setIsDocGuideOpen(false)}
      />
    </div>
  );
}
