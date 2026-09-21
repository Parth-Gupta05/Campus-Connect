
import React from 'react';
import { MessageSquare } from 'lucide-react';
import RichContentRenderer from '../RichContentRenderer';

export default function AboutSection({ about, onEdit }) {
  return (
    <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between border-b border-gray-400 pb-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} /> About Me
        </h3>
        <button
          onClick={onEdit}
          className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
        >
          Edit About &rarr;
        </button>
      </div>
      {about ? (
        <RichContentRenderer htmlContent={about} className="text-gray-700" />
      ) : (
        <p className="text-xs text-gray-600 font-mono py-2">No About section added yet.</p>
      )}
    </div>
  );
}
