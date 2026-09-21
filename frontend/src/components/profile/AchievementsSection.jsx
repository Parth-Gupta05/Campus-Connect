import React from 'react';
import { Award, ExternalLink } from 'lucide-react';
import { FaLinkedin } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { formatExternalUrl } from '../../utils/profileUtils';

export default function AchievementsSection({ achievements, profile, onEdit, setSelectedAchievement }) {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Achievements Grid */}
      <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between border-b border-gray-400 pb-3">
          <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
            <Award className="w-3.5 h-3.5" strokeWidth={1.5} /> Verified Achievements &amp; Awards
          </h3>
          <button
            onClick={onEdit}
            className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
          >
            + Add Achievement
          </button>
        </div>

        {achievements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((ach, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedAchievement(ach)}
                className="p-4 rounded-lg border border-gray-400 bg-background-100 hover:border-gray-500 cursor-pointer transition-colors flex flex-col justify-between space-y-3"
              >
                {ach.imageUrl && (
                  <img
                    src={ach.imageUrl}
                    alt={ach.title}
                    className="w-full h-36 object-contain bg-background-200 rounded-md border border-gray-400"
                  />
                )}
                <div className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4 className="text-xs font-semibold text-gray-1000 truncate">{ach.title}</h4>
                    <span className="text-[10px] font-mono text-gray-600 shrink-0">
                      {ach.date ? new Date(ach.date).toLocaleDateString() : ''}
                    </span>
                  </div>
                  {ach.description && (
                    <p className="text-xs text-gray-700 font-sans line-clamp-2 leading-relaxed">
                      {ach.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-600 font-mono py-6 text-center">No achievements added yet.</p>
        )}
      </div>

      {/* LinkedIn Certifications Summary */}
      {Array.isArray(profile.scrapedData?.linkedin?.certifications) && profile.scrapedData.linkedin.certifications.length > 0 && (
        <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-gray-400 pb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
              <FaLinkedin className="text-[#0A66C2]" /> LinkedIn Certifications
            </h3>
            <Link to="/certificates" className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline">
              Manage All ({profile.scrapedData.linkedin.certifications.length}) &rarr;
            </Link>
          </div>

          <div className="divide-y divide-gray-400">
            {profile.scrapedData.linkedin.certifications.map((cert, i) => (
              <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-medium text-gray-1000">{cert.title}</div>
                  <div className="text-[11px] text-gray-600 font-sans mt-0.5">{cert.issuedBy}</div>
                </div>
                {cert.link && (
                  <a
                    href={formatExternalUrl(cert.link)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] font-mono text-gray-700 hover:text-gray-1000 hover:underline shrink-0 flex items-center gap-1"
                  >
                    <span>View Credential</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
