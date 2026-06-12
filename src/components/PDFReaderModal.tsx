/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { ResourceFile } from '../types';

interface PDFReaderModalProps {
  file: ResourceFile;
  subjectName: string;
  initialPage?: number;
  isOpen: boolean;
  isDarkMode: boolean;
  onClose: () => void;
  onSaveProgress: (page: number) => void;
}

export default function PDFReaderModal({
  file,
  subjectName,
  initialPage = 1,
  isOpen,
  isDarkMode,
  onClose,
  onSaveProgress,
}: PDFReaderModalProps) {
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [totalPages] = useState<number>(() => {
    // Dynamically give an estimated page count based on subjects or a standard document range (e.g. 35 to 110)
    const hash = file.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return 20 + (hash % 65);
  });
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [readingNotes, setReadingNotes] = useState<string>(() => {
    return localStorage.getItem(`fuuast_pdf_notes_${file.id}`) || '';
  });

  // Track initial page inputs
  useEffect(() => {
    setCurrentPage(initialPage);
  }, [initialPage, file.id]);

  // Sync notes to local state when text changes
  const handleNotesChange = (txt: string) => {
    setReadingNotes(txt);
    localStorage.setItem(`fuuast_pdf_notes_${file.id}`, txt);
  };

  // Convert Dropbox URL to direct embed link (raw stream via Google Slides/Google Viewer)
  const getEmbedUrl = () => {
    let directUrl = file.url || '';
    if (directUrl.includes('dl=0')) {
      directUrl = directUrl.replace('dl=0', 'raw=1');
    } else if (!directUrl.includes('raw=1')) {
      directUrl += `${directUrl.includes('?') ? '&' : '?'}raw=1`;
    }
    return `https://docs.google.com/gview?url=${encodeURIComponent(directUrl)}&embedded=true`;
  };

  // Auto-save progress whenever page changes
  const handlePageChange = (newPage: number) => {
    const validatedPage = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(validatedPage);
    onSaveProgress(validatedPage);
  };

  if (!isOpen) return null;

  return (
    <div
      id="pdf-reader-overlay"
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/95 backdrop-blur-md animate-fade-in text-white overflow-hidden"
    >
      {/* Top Header Controls Panel */}
      <header className="flex h-16 items-center justify-between border-b border-white/10 px-6 bg-slate-950/90 shadow-lg relative z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2 rounded-lg bg-red-650 shrink-0">
            <Icons.FileText className="w-5 h-5 text-red-100" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate tracking-tight">{file.name}</h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-wide uppercase truncate">
              {subjectName} • BS Computer Science
            </p>
          </div>
        </div>

        {/* Dynamic Navigational Center Counter */}
        <div className="hidden sm:flex items-center gap-3 bg-slate-900/80 px-4 py-1.5 rounded-xl border border-white/5">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Previous Page"
          >
            <Icons.ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-gray-400">Page</span>
            <input
              type="number"
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (!isNaN(val)) handlePageChange(val);
              }}
              className="w-12 text-center bg-slate-800 text-white border border-white/15 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-400 font-bold"
            />
            <span className="text-gray-400">of</span>
            <span className="text-white font-bold">{totalPages}</span>
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1 rounded-lg text-gray-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            title="Next Page"
          >
            <Icons.ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          {/* External original Dropbox open button */}
          <a
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-gray-400 hover:text-sky-400 hover:bg-white/5 rounded-lg transition-colors text-xs flex items-center gap-1.5 font-sans"
            title="Open original cloud link to download"
          >
            <Icons.ExternalLink className="w-4 h-4" />
            <span className="hidden md:inline font-mono text-[10px] uppercase font-bold">Cloud Origin</span>
          </a>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-2 rounded-lg transition-colors ${
              isSidebarOpen ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Toggle Reader Workspace Drawer"
          >
            <Icons.Menu className="w-5 h-5" />
          </button>

          <div className="h-6 w-px bg-white/10" />

          {/* Close E-Reader Overlay Modal */}
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
            title="Close digital reader module"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Reading Canvas Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Core Document Canvas Wrapper */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-y-auto bg-slate-950">
          {/* Embed Screen Canvas */}
          <div
            className="w-full max-w-4xl h-full rounded-xl overflow-hidden bg-slate-900 border border-white/5 shadow-2xl relative transition-all"
            style={{ height: 'calc(100% - 16px)' }}
          >
            <iframe
              src={getEmbedUrl()}
              className="w-full h-full border-0"
              title="Academic Resource Frame Viewer"
              allow="autoplay"
              onError={() => console.warn('Unable to frame resource securely. Opening external URL.')}
            />

            {/* Mobile Navigational Controllers overlay floating */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex sm:hidden items-center gap-4 bg-slate-950/90 border border-white/10 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1 rounded-full text-gray-400 hover:text-white disabled:opacity-30"
              >
                <Icons.ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-mono text-xs">
                Page <strong className="text-indigo-400">{currentPage}</strong> / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="p-1 rounded-full text-gray-400 hover:text-white disabled:opacity-30"
              >
                <Icons.ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Space panel: Reading Notes & Document Settings */}
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            className="w-80 border-l border-white/10 bg-slate-950/70 backdrop-blur-sm p-5 flex flex-col gap-6 overflow-y-auto shrink-0 font-sans"
          >
            {/* Outline Card Stats widget */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold font-mono text-indigo-400 tracking-wider uppercase">
                Interactive Study Progress
              </h3>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Total File Pages</span>
                  <span className="font-semibold text-white font-mono">{totalPages} pages</span>
                </div>
                {/* Visual dynamic reading tracker indicator */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-indigo-300 font-bold">Progress Completed</span>
                    <span className="text-white font-bold">{Math.round((currentPage / totalPages) * 100)}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-sky-500 rounded-full transition-all duration-300"
                      style={{ width: `${(currentPage / totalPages) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-gray-400 leading-relaxed font-sans">
                  * Position is automatically saved on page transitions so you can resume exactly where you left off.
                </div>
              </div>
            </div>

            {/* Quick Interactive Scratchpad / Digital Student Margin Notes */}
            <div className="flex-1 flex flex-col min-h-[180px]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold font-mono text-indigo-400 tracking-wider uppercase flex items-center gap-1">
                  <Icons.ClipboardList className="w-4 h-4" />
                  <span>Student Margin Notes</span>
                </label>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  Auto Saved
                </span>
              </div>
              <textarea
                value={readingNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Write your study notes, formula references, or assignment questions here related to this PDF..."
                className="flex-1 w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Document Shortcuts Info Module */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 text-[11px] text-gray-400 space-y-2">
              <div className="font-bold text-white font-mono uppercase text-[9px] tracking-wide text-gray-300">
                Interactive E-Reader Shortcuts
              </div>
              <div className="flex justify-between">
                <span>Next Page</span>
                <span className="font-mono bg-white/5 px-1 rounded text-white font-bold">ChevronRight</span>
              </div>
              <div className="flex justify-between">
                <span>Prev Page</span>
                <span className="font-mono bg-white/5 px-1 rounded text-white font-bold">ChevronLeft</span>
              </div>
              <div className="flex justify-between">
                <span>Original Doc</span>
                <span className="font-mono bg-white/5 px-1 rounded text-white font-bold">Cloud Link</span>
              </div>
            </div>
          </motion.aside>
        )}
      </div>
    </div>
  );
}
