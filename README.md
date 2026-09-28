# PDFlex — Free In-Browser PDF Text Editor

PDFlex is a 100% free, client-side web application for directly editing text in PDF documents within your browser. There are no watermarks, no page limits, no daily caps, no account requirements, and zero server-side file uploads.

---

## Key Features

1. **In-Place Text Editing**: Click on any existing text run or phrase to edit content directly in place over the original document layout.
2. **Multilingual Typography (English & Bangla)**:
   - Built-in font matching for Latin fonts: Arial, Helvetica, Times New Roman, Courier New, Inter.
   - Built-in support for Bangla fonts: **Noto Sans Bengali**, **Hind Siliguri**, **Anek Bangla**, **SolaimanLipi**, and **Kalpurush**.
   - Handles complex Indic conjuncts (**যুক্তাক্ষর**) such as ক্ত, ক্ষ, জ্ঞ, ঙ্ক, ঙ্গ, ঞ্চ, ণ্ড, ণ্ট.
3. **Hover Font Inspector**:
   - Instant lightweight tooltip appears on `mouseenter` over any text block before clicking.
   - Shows formatted font family, size in points, and weight (e.g. `Noto Sans Bengali · 15pt · Regular` or `SolaimanLipi · 12pt · Bold`).
   - Indicates fallback status if the original font was not embedded.
   - Zero layout shift, non-blocking click-through (`pointer-events-none`), single active tooltip at a time.
4. **Typography & Styling Controls**:
   - Font family picker with auto-detection
   - Font size increment / decrement / direct input
   - Bold and Italic toggles
   - Color picker with preset corporate palettes + hex picker
   - Whiteout background selection
   - Quick "Reset to Original" button
4. **Insert New Text Anywhere**:
   - Click "Add Text" in the toolbar, then click anywhere on any page to drop a new text block.
   - Drag to reposition freely.
5. **Page Management**:
   - Visual page thumbnail sidebar
   - Rotate pages (90° clockwise increments)
   - Reorder pages (Move Up / Down)
   - Delete individual pages
6. **Undo & Redo**:
   - Comprehensive history stack for all edits and page operations
   - Keyboard shortcuts: `Ctrl+Z` / `Cmd+Z` to undo, `Ctrl+Y` / `Cmd+Shift+Z` to redo
7. **Password-Protected PDFs**:
   - Automatically detects encrypted PDFs on upload
   - Prompts for password and decrypts client-side using `pdfjsLib`
8. **Export & Download**:
   - Clean client-side export using `pdf-lib` and `@pdf-lib/fontkit`
   - Unmodified vector lines, images, and tables remain 100% sharp
   - Edited text is seamlessly redacted with background fill and redrawn with embedded Unicode TrueType fonts
   - No watermark, ever.

---

## Phase 5 QA Pass & Document Support Matrix

Based on automated tests with 50+ real-world documents across different PDF generators (Microsoft Word export, Google Docs, LibreOffice, Canva, Government portals):

### ✅ Well-Supported Documents (Best Results)
- **Business Invoices & Receipts**: Standard tabular layouts, line items, totals, dates.
- **Academic & Professional Certificates**: Single-page certificates with student names, dates, course titles.
- **Official Letters, Notices & Memos**: Government and corporate letters in English or Bangla.
- **Application Forms & Single-Column Contracts**: Forms with text fields, instructions, terms of service.
- **Digitally Generated PDFs**: Documents exported directly from Word processors, desktop publishing software, or vector engines.

### ⚠️ Known Limitations for V1 (Out of Scope)
- **Scanned Bitmap Images (No Text Layer)**: PDFs created by taking photos or scanning physical paper without an OCR pass have no underlying text layer to edit. These require an OCR pre-processor.
- **Multi-Column Automatic Paragraph Reflow**: Editing a long paragraph in a magazine or newspaper with multi-column layout does not automatically reflow text into adjacent columns; edits are scoped to each block.
- **Complex Embedded Type 3 / Non-Standard Bitmapped Fonts**: If a PDF uses non-standard proprietary font encodings, PDFlex falls back to Noto Sans Bengali or Inter with a transparent notification badge.

---

## Security & Privacy Guarantee

- **Zero Server Uploads**: The entire application runs exclusively inside your browser's Web Worker and JavaScript runtime.
- **No Telemetry / Data Harvesting**: Your files and edits never leave your device.
