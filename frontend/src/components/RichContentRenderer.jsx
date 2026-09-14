import React from 'react';

export default function RichContentRenderer({ htmlContent, className = '' }) {
  if (!htmlContent) return null;

  return (
    <div
      className={`prose dark:prose-invert max-w-none text-gray-1000 text-sm leading-relaxed 
        prose-headings:text-gray-1000 prose-headings:font-bold prose-headings:tracking-tight
        prose-p:text-gray-1000 prose-p:my-3 
        prose-a:text-blue-500 prose-a:underline hover:prose-a:text-blue-600
        prose-blockquote:border-l-2 prose-blockquote:border-gray-400 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:my-4
        prose-ul:list-disc prose-ul:pl-5 prose-ul:my-2
        prose-ol:list-decimal prose-ol:pl-5 prose-ol:my-2
        prose-li:my-1
        prose-img:rounded-lg prose-img:shadow-sm prose-img:border prose-img:border-gray-400 prose-img:max-h-96 prose-img:mx-auto prose-img:my-4
        ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
