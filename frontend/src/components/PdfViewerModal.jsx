import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, ExternalLink, FileText, Download, Loader2, FileX } from 'lucide-react';

function sanitizeDownloadName(title) {
  const base = (title || 'document')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .trim()
    .slice(0, 120);
  return base.toLowerCase().endsWith('.pdf') ? base : `${base || 'document'}.pdf`;
}

export default function PdfViewerModal({ url, title = 'Document', onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blobUrl, setBlobUrl] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const token = localStorage.getItem('accessToken');

  const pdfSrc = useMemo(() => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    if (url) {
      if (url.startsWith(`${apiUrl}/api/user/portfolio/resume/pdf`)) {
        return url;
      }
      return `${apiUrl}/api/user/portfolio/resume/pdf?url=${encodeURIComponent(url)}${token ? `&token=${token}` : ''}`;
    }
    return `${apiUrl}/api/user/portfolio/resume/pdf${token ? `?token=${token}` : ''}`;
  }, [url, token]);

  const directUrl = url || pdfSrc;
  const downloadName = sanitizeDownloadName(title);

  const fetchPdf = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    try {
      const response = await fetch(pdfSrc);
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Unable to load document (HTTP ${response.status})`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
        const textMsg = await response.text().catch(() => '');
        throw new Error(textMsg || 'Received unexpected document format from storage');
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Document file from storage is empty');
      }

      setBlobUrl(URL.createObjectURL(blob));
      setLoading(false);
    } catch (err) {
      console.warn('Error loading PDF:', err);
      setError(err.message || 'Failed to fetch document from storage');
      setLoading(false);
    }
  }, [pdfSrc]);

  useEffect(() => {
    fetchPdf();
  }, [fetchPdf]);

  return (
    <div
      className="fixed inset-0 z-[140] bg-black/70 backdrop-blur-md flex items-stretch sm:items-center justify-center p-0 sm:p-4 md:p-6 overscroll-contain animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-viewer-title"
      onClick={onClose}
    >
      <div
        className="bg-background-100 w-full sm:max-w-5xl flex flex-col overflow-hidden relative border-0 sm:border border-gray-400 text-gray-1000 shadow-none sm:shadow-2xl animate-in zoom-in-95 duration-150 min-h-0 h-[100dvh] max-h-[100dvh] sm:h-[min(88dvh,calc(100dvh-2rem))] sm:max-h-[min(88dvh,calc(100dvh-2rem))] sm:rounded-2xl pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center gap-2 px-3 py-2.5 sm:px-6 sm:py-3.5 border-b border-gray-400 bg-background-200 shrink-0 min-w-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-background-100 border border-gray-400 flex items-center justify-center shrink-0 shadow-2xs text-gray-1000">
              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h2
                  id="pdf-viewer-title"
                  className="text-xs sm:text-sm font-semibold text-gray-1000 truncate"
                  title={title}
                >
                  {title}
                </h2>
                <span className="hidden sm:inline-block shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-600 bg-background-100 border border-gray-400">
                  PDF
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {blobUrl && (
              <a
                href={blobUrl}
                download={downloadName}
                className="h-8 w-8 sm:w-auto sm:px-3 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                title="Download"
                aria-label="Download PDF"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}

            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              className="h-8 w-8 sm:w-auto sm:px-3 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              title="Open in new tab"
              aria-label="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Open in Tab</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-md text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer shrink-0"
              title="Close viewer"
              aria-label="Close PDF viewer"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Modal PDF Viewer Body */}
        <div className="flex-1 min-h-0 w-full bg-background-200 relative overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 sm:p-8 space-y-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-background-100 border border-gray-400 flex items-center justify-center shadow-2xs text-gray-900">
                <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} />
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="text-sm font-semibold text-gray-1000">Loading preview</h3>
                <p className="text-xs text-gray-700 font-sans">
                  Retrieving PDF from storage…
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto animate-in fade-in duration-150">
              <div className="w-10 h-10 rounded-xl bg-background-100 border border-gray-400 flex items-center justify-center text-gray-600 shadow-2xs mb-3">
                <FileX className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-gray-1000">Preview unavailable</h3>
              <p className="text-xs text-gray-700 font-sans mt-1 px-2">{error}</p>
              <button
                type="button"
                onClick={fetchPdf}
                className="mt-4 h-8 px-3 rounded-md border border-gray-400 bg-background-100 text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                Try again
              </button>
            </div>
          ) : blobUrl ? (
            <div className="flex-1 min-h-0 w-full bg-gray-100 dark:bg-gray-950 p-1 sm:p-3 md:p-4">
              <iframe
                src={`${blobUrl}#view=FitH&zoom=page-width`}
                className="w-full h-full min-h-0 rounded-md sm:rounded-xl border border-gray-400 shadow-lg bg-white"
                title={title}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
