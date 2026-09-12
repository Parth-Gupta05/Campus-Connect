import React, { useEffect } from 'react';
import { FiX, FiExternalLink } from 'react-icons/fi';

export default function PdfViewerModal({ url, title = 'Resume PDF', onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-surface-container-lowest w-full max-w-4xl h-[85vh] rounded-2xl shadow-ambient flex flex-col overflow-hidden relative border border-border-light"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border-light bg-surface-container-low">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-[22px]">picture_as_pdf</span>
            <h2 className="text-label-lg font-bold text-on-surface truncate max-w-md">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={directUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="px-3 py-1.5 rounded-lg border border-border-light text-xs font-medium text-on-surface-variant hover:text-primary hover:bg-surface-variant transition-colors flex items-center gap-1.5"
              title="Open in new tab"
            >
              <FiExternalLink className="text-sm" />
              <span>Open in Tab</span>
            </a>
            <button 
              type="button"
              onClick={onClose} 
              className="w-9 h-9 flex items-center justify-center hover:bg-surface-variant rounded-full text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              title="Close modal"
            >
              <FiX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Modal PDF Viewer Body */}
        <div className="flex-1 w-full bg-surface-container relative">
          <iframe 
            src={pdfSrc} 
            className="w-full h-full border-none" 
            title={title}
          >
            <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center h-full gap-4">
              <span className="material-symbols-outlined text-[48px]">picture_as_pdf</span>
              <p className="text-sm">Your browser cannot display this PDF inline.</p>
              <a 
                href={directUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-container transition-colors"
              >
                Download PDF
              </a>
            </div>
          </iframe>
        </div>
      </div>
    </div>
  );
}
