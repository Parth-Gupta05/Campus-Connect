
import React from 'react';
import { Briefcase } from 'lucide-react';

export default function ExperienceSection({ experience, onEdit }) {
  return (
    <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-gray-400 pb-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
          <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} /> Work Experience
        </h3>
        <button
          onClick={onEdit}
          className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
        >
          + Add Role
        </button>
      </div>

      {experience.length > 0 ? (
        <div className="relative border-l border-gray-400 ml-3 space-y-6 pt-2 pb-1">
          {experience.map((exp, idx) => (
            <div key={idx} className="relative pl-6 space-y-1">
              <div className="absolute w-2.5 h-2.5 bg-gray-1000 rounded-full -left-[5px] top-1.5 ring-4 ring-background-200" />
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                <h4 className="text-sm font-semibold text-gray-1000">{exp.role}</h4>
                <span className="text-[11px] font-mono text-gray-600">
                  {exp.startDate} – {exp.endDate || 'Present'}
                </span>
              </div>
              <p className="text-xs text-gray-700 font-mono">{exp.company}</p>
              {exp.description && (
                <p className="text-xs text-gray-700 font-sans leading-relaxed pt-1 whitespace-pre-line">
                  {exp.description}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600 font-mono py-4">No work experience added yet.</p>
      )}
    </div>
  );
}
