import React from 'react';

export default function RichContentRenderer({ htmlContent, className = '' }) {
  if (!htmlContent) return null;

  return (
    <div
      className={`prose max-w-none text-on-surface text-[15px] leading-relaxed 
        prose-headings:text-on-surface prose-headings:font-bold 
        prose-p:text-on-surface/90 prose-p:my-3 
        prose-a:text-primary prose-a:underline hover:prose-a:text-primary-container
        prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-on-surface-variant prose-blockquote:my-4
        prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
        prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
        prose-li:my-1
        prose-code:font-mono prose-code:bg-surface-variant prose-code:text-primary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[13px]
        prose-pre:bg-[#282c34] prose-pre:text-[#abb2bf] prose-pre:p-4 prose-pre:rounded-xl prose-pre:shadow-inner prose-pre:my-4 prose-pre:overflow-x-auto
        prose-img:rounded-xl prose-img:shadow-md prose-img:border prose-img:border-border-light prose-img:max-h-96 prose-img:mx-auto prose-img:my-4
        ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
