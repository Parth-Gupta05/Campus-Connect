
import React from 'react';
import { FolderGit2, ExternalLink } from 'lucide-react';
import { formatExternalUrl } from '../../utils/profileUtils';

export default function ProjectsSection({ projects, onEdit }) {
  return (
    <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
      <div className="flex items-center justify-between border-b border-gray-400 pb-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
          <FolderGit2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Featured Projects
        </h3>
        <button
          onClick={onEdit}
          className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
        >
          + Add Project
        </button>
      </div>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj, idx) => (
            <div
              key={idx}
              className="p-4 rounded-lg border border-gray-400 bg-background-100 flex flex-col justify-between space-y-3 hover:border-gray-500 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-gray-1000 truncate">{proj.title}</h4>
                  {proj.link && (
                    <a
                      href={formatExternalUrl(proj.link)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-600 hover:text-gray-1000 transition-colors p-1"
                      title="Open project link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </a>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-gray-700 font-sans line-clamp-3 leading-relaxed">
                    {proj.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-600 font-mono py-4">No projects listed. Update your resume to showcase projects.</p>
      )}
    </div>
  );
}
