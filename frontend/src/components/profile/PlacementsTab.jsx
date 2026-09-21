import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Code2, Briefcase, GraduationCap, FolderGit2, ExternalLink, Award, ShieldCheck, CheckCircle2, Download, FileSpreadsheet, Plus } from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import RichContentRenderer from '../RichContentRenderer';
import { formatExternalUrl } from '../../utils/profileUtils';

export default function PlacementsTab({ profile, skills, experience, education, projects, achievements, about, missingSections, profileStrength, userPlacementPosts, setShowEditor, setSelectedAchievement, setLinkingAccount, handleGenerateCodeAndVerify }) {
  return (
    <>
{/* ===================================================================
              TAB 3: PLACEMENT STORIES
              =================================================================== */}
          <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">Interview Guides &amp; Placement Experiences</h2>
                  <p className="text-xs text-gray-700 font-mono mt-0.5">
                    Interview rounds, assessment questions, and hiring tips shared by {profile.name}
                  </p>
                </div>
                <Link
                  to="/placements/create"
                  className="h-8 px-3 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Write Placement Review</span>
                </Link>
              </div>

              {/* Placement Assessments */}
              {profile?.assessments?.length > 0 && (
                <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-400 pb-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} /> Placement Assessments
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.assessments.map((assessment, index) => (
                      <div key={index} className="flex flex-col justify-between gap-3 p-4 rounded-xl border border-gray-300 bg-background-100 shadow-xs hover:border-gray-400 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                          </div>
                          <h4 className="text-xs font-semibold text-gray-1000 line-clamp-2" title={assessment.title}>{assessment.title}</h4>
                        </div>
                        <a
                          href={assessment.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-md border border-emerald-300 bg-emerald-50 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 whitespace-nowrap mt-2 sm:self-end"
                        >
                          <Download className="w-3 h-3" /> Download Report
                        </a>
                      </div>
                    )
                  </div>
                </div>
              )}

              {userPlacementPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userPlacementPosts.map((post) => (
                    <div
                      key={post._id}
                      className="rounded-xl border border-gray-400 bg-background-200 p-5 shadow-2xs hover:border-gray-500 transition-colors flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-background-100 border border-gray-400 p-1 flex items-center justify-center font-bold text-xs text-gray-1000 shrink-0 overflow-hidden shadow-2xs">
                              {post.company?.logoUrl || post.company?.name ? (
                                <>
                                  <img
                                    src={post.company?.logoUrl || `https://logo.clearbit.com/${post.company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}
                                    alt={post.company?.name}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                                    }}
                                  />
                                  <span className="hidden">
                                    {post.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                                  </span>
                                </>
                              ) : (
                                post.company?.name?.charAt(0)?.toUpperCase() || 'C'
                              )}
                            </div>
                            <div className="truncate">
                              <h3 className="text-xs font-semibold text-gray-1000 truncate">{post.company?.name}</h3>
                              <span className="text-[11px] text-gray-600 font-mono">{post.role}</span>
                            </div>
                          </div>

                          {post.outcome === 'selected' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-medium shrink-0">
                              Selected
                            </span>
                          )}
                        </div>

                        <Link to={`/placements/${post._id}`} className="block group">
                          <h4 className="text-xs font-medium text-gray-1000 group-hover:underline line-clamp-2 leading-relaxed">
                            {post.title}
                          </h4>
                        </Link>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-400 text-[11px] font-mono text-gray-600">
                        <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{post.commentCount || 0}</span>
                          </span>
                          <Link to={`/placements/${post._id}`} className="text-gray-900 font-medium hover:underline">
                            Read &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-400 bg-background-200 p-8 text-center space-y-3">
                  <p className="text-xs text-gray-700 font-mono">No placement experiences published yet.</p>
                  <Link
                    to="/placements/create"
                    className="inline-flex items-center gap-1 text-xs text-gray-1000 font-semibold underline"
                  >
                    Share your first interview round with the campus community &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          
    </>
  );
}