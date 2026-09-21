import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Code2, Briefcase, GraduationCap, FolderGit2, ExternalLink, Award, ShieldCheck, CheckCircle2, Download, FileSpreadsheet, Plus } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import RichContentRenderer from '../RichContentRenderer';
import { formatExternalUrl } from '../../utils/profileUtils';

export default function VerificationTab({ profile, skills, experience, education, projects, achievements, about, missingSections, profileStrength, userPlacementPosts, setShowEditor, setSelectedAchievement, setLinkingAccount, handleGenerateCodeAndVerify }) {
  return (
    <>
{/* ===================================================================
              TAB 4: CONNECTED IDENTITIES & VERIFICATION
              =================================================================== */}
          <div className="space-y-6 animate-in fade-in duration-150">

              {/* Core Account Identities Card */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-3 border-b border-gray-400 pb-4">
                  <div className="w-8 h-8 rounded-lg bg-background-100 border border-gray-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-gray-1000" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-1000">Core Account Identities</h3>
                    <p className="text-[11px] text-gray-600 font-sans">Manage your primary identifiers and recovery methods</p>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  {/* Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-gray-1000">Personal Email</div>
                      <div className="text-[11px] text-gray-600 font-mono">{profile.email || 'Not connected'}</div>
                    </div>
                    {!profile.email && (
                      <button onClick={() => setLinkingAccount('email' className="text-xs font-mono text-gray-700 hover:text-gray-1000 underline cursor-pointer">Link Email</button>
                    )}
                  </div>

                  {/* University Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-gray-1000">University Email</div>
                      <div className="text-[11px] text-gray-600 font-mono">{profile.universityEmail || 'Not connected'}</div>
                    </div>
                    {!profile.universityEmail && (
                      <button onClick={() => setLinkingAccount('universityEmail')} className="text-xs font-mono text-gray-700 hover:text-gray-1000 underline cursor-pointer">Link University Email</button>
                    )}
                  </div>

                  {/* UID */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-gray-1000">Student UID</div>
                      <div className="text-[11px] text-gray-600 font-mono">{profile.uid || 'Not connected'}</div>
                    </div>
                    {!profile.uid && (
                      <button onClick={() => setLinkingAccount('uid')} className="text-xs font-mono text-gray-700 hover:text-gray-1000 underline cursor-pointer">Link UID</button>
                    )}
                  </div>
                </div>
              </div>

              {/* GitHub Card */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-400 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background-100 border border-gray-400 flex items-center justify-center">
                      <FaGithub className="w-4 h-4 text-gray-1000" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-1000">GitHub Identity Verification</h3>
                      <p className="text-[11px] text-gray-600 font-mono">
                        {profile.githubUsername ? `@${profile.githubUsername}` : 'Not connected'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {profile.githubVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Account</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGenerateCodeAndVerify('github')}
                        className="h-8 px-3 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity cursor-pointer shadow-xs"
                      >
                        Verify Ownership
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  Verifying your GitHub identity certifies your public repositories, contributions heatmap, and starred works on the Campus Connect recruiter leaderboard.
                </p>
              </div>

              {/* LeetCode Card */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-400 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ffa116]/10 border border-[#ffa116]/30 flex items-center justify-center">
                      <SiLeetcode className="w-4 h-4 text-[#ffa116]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-1000">LeetCode Identity Verification</h3>
                      <p className="text-[11px] text-gray-600 font-mono">
                        {profile.leetcodeUsername ? `@${profile.leetcodeUsername}` : 'Not connected'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {profile.leetcodeVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Account</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGenerateCodeAndVerify('leetcode')}
                        className="h-8 px-3 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity cursor-pointer shadow-xs"
                      >
                        Verify Ownership
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  Verifying your LeetCode identity confirms your contest rating, global ranking, and difficulty breakdown statistics for student analytics and recruiter discovery.
                </p>
              </div>

              {/* LinkedIn Overview Card */}
              {profile.scrapedData?.linkedin && (
                <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3 border-b border-gray-400 pb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 border border-[#0A66C2]/30 flex items-center justify-center">
                      <FaLinkedin className="w-4 h-4 text-[#0A66C2]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-1000">
                        {profile.scrapedData.linkedin.firstName} {profile.scrapedData.linkedin.lastName}
                      </h3>
                      <p className="text-[11px] text-gray-600 font-sans">{profile.scrapedData.linkedin.headline}</p>
                    </div>
                  </div>

                  {profile.scrapedData.linkedin.about && (
                    <p className="text-xs text-gray-700 font-sans leading-relaxed whitespace-pre-line">
                      {profile.scrapedData.linkedin.about}
                    </p>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      
    </>
  );
}