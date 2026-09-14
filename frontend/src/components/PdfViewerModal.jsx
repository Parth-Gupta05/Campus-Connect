import React, { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink, FileText, Download, Loader2, FileX } from 'lucide-react';

export default function PdfViewerModal({ url, title = 'Resume PDF', onClose }) {
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
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const token = localStorage.getItem('accessToken');
  
  // Build proxy URL so that headers (Content-Disposition: inline, Content-Type: application/pdf)
  // are guaranteed and cross-origin embedding issues from external buckets/Cloudinary are eliminated.
  let pdfSrc = '';
  if (url) {
    if (url.startsWith('http://localhost:5000/api/user/portfolio/resume/pdf')) {
      pdfSrc = url;
    } else {
      pdfSrc = `http://localhost:5000/api/user/portfolio/resume/pdf?url=${encodeURIComponent(url)}${token ? `&token=${token}` : ''}`;
    }
  } else {
    pdfSrc = `http://localhost:5000/api/user/portfolio/resume/pdf${token ? `?token=${token}` : ''}`;
  }

  const directUrl = url || pdfSrc;

  const fetchPdf = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(pdfSrc);
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Unable to load resume (HTTP ${response.status})`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('pdf') && !contentType.includes('octet-stream')) {
        const textMsg = await response.text().catch(() => '');
        throw new Error(textMsg || 'Received unexpected document format from storage');
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Resume file from storage is empty');
      }

      const newBlobUrl = URL.createObjectURL(blob);
      setBlobUrl(newBlobUrl);
      setLoading(false);
    } catch (err) {
      console.warn('Error loading resume PDF:', err);
      setError(err.message || 'Failed to fetch resume from storage');
      setLoading(false);
    }
  }, [pdfSrc]);

  useEffect(() => {
    fetchPdf();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [fetchPdf]);

  return (
    <div 
      className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-md flex justify-center items-center p-4 sm:p-6 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-background-100 w-full max-w-5xl h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative border border-gray-400 text-gray-1000 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-3.5 border-b border-gray-400 bg-background-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-background-100 border border-gray-400 flex items-center justify-center shrink-0 shadow-2xs text-gray-1000">
              <FileText className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-1000 truncate">{title}</h2>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-600 bg-background-100 border border-gray-400">
                  PDF Preview
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {blobUrl && (
              <a 
                href={blobUrl} 
                download="resume.pdf"
                className="h-8 px-3 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Download document"
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
              className="h-8 px-3 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Open in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span className="hidden sm:inline">Open in Tab</span>
            </a>

            <button 
              type="button"
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-md text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer"
              title="Close viewer"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Modal PDF Viewer Body */}
        <div className="flex-1 w-full bg-background-200 relative overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-background-100 border border-gray-400 flex items-center justify-center shadow-2xs text-gray-900">
                <Loader2 className="w-6 h-6 animate-spin" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-1000">Loading Resume Preview</h3>
                <p className="text-xs text-gray-700 font-sans">
                  Retrieving verified PDF document from cloud storage...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-sm mx-auto animate-in fade-in duration-150">
              <div className="w-10 h-10 rounded-xl bg-background-100 border border-gray-400 flex items-center justify-center text-gray-600 shadow-2xs mb-3">
                <FileX className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-semibold text-gray-1000">Resume unavailable</h3>
              <p className="text-xs text-gray-700 font-sans mt-1">
                Unable to load the PDF document from storage.
              </p>
            </div>
          ) : blobUrl ? (
            <div className="flex-1 w-full h-full bg-gray-100 dark:bg-gray-950 p-2 sm:p-4 flex items-center justify-center">
              <iframe 
                src={`${blobUrl}#view=FitH`} 
                className="w-full h-full rounded-xl border border-gray-400 shadow-lg bg-white" 
                title={title}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
