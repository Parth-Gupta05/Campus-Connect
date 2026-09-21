const fs = require('fs');

const profileDir = 'src/components/profile';
if (!fs.existsSync(profileDir)) {
  fs.mkdirSync(profileDir, { recursive: true });
}

// 1. ExperienceSection.jsx
fs.writeFileSync(`${profileDir}/ExperienceSection.jsx`, `
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
`);

// 2. EducationSection.jsx
fs.writeFileSync(`${profileDir}/EducationSection.jsx`, `
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
`);

// 3. ProjectsSection.jsx
fs.writeFileSync(`${profileDir}/ProjectsSection.jsx`, `
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
`);

// 4. SkillsSection.jsx
fs.writeFileSync(`${profileDir}/SkillsSection.jsx`, `
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
`);

// 5. AboutSection.jsx
fs.writeFileSync(`${profileDir}/AboutSection.jsx`, `
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
`);
