
import React from 'react';
import { GraduationCap } from 'lucide-react';

export default function EducationSection({ education, onEdit }) {
  return (
    <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-gray-400 pb-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5" strokeWidth={1.5} /> Academic Background
        </h3>
        <button
          onClick={onEdit}
          className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
        >
          + Add Degree
        </button>
      </div>

      {education.length > 0 ? (
        <div className="divide-y divide-gray-400">
          {education.map((edu, idx) => (
            <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-xs font-semibold text-gray-1000">{edu.degree}</div>
                <div className="text-xs text-gray-700 font-sans mt-0.5">{edu.institution}</div>
              </div>
              <span className="text-[11px] font-mono text-gray-600 shrink-0">
                {edu.startYear} – {edu.endYear || 'Present'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600 font-mono py-4">No educational history registered.</p>
      )}
    </div>
  );
}
