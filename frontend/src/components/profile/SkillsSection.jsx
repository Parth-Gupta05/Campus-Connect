
import React from 'react';
import { Code2 } from 'lucide-react';

export default function SkillsSection({ skills, onEdit }) {
  return (
    <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
          <Code2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Verified Technical Skills
        </h3>
        <button
          onClick={onEdit}
          className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
        >
          Manage Skills &rarr;
        </button>
      </div>

      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2 pt-1">
          {skills.map((skill, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 rounded-md bg-background-100 border border-gray-400 text-xs font-mono text-gray-900 font-medium hover:border-gray-500 transition-colors"
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600 font-mono py-4">No skills registered. Click Update Resume to add skills.</p>
      )}
    </div>
  );
}
