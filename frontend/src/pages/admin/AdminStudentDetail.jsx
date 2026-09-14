import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import { ActivityCalendar } from 'react-activity-calendar';
import { fromUnixTime, format, subDays } from 'date-fns';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import { 
  ArrowLeft, 
  Loader2, 
  Eye, 
  ExternalLink, 
  Star, 
  GitFork, 
  Code2, 
  BookOpen, 
  X, 
  Award, 
  Briefcase, 
  FileText, 
  Users, 
  GraduationCap, 
  Brain, 
  Rocket, 
  Calendar as CalendarIcon, 
  Mail, 
  User, 
  CheckCircle2, 
  Zap, 
  ChevronRight,
  ShieldCheck,
  Download,
  AlertCircle,
  Clock,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Copy,
  Check,
  MapPin,
  Building2,
  DollarSign
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import PdfViewerModal from '../../components/PdfViewerModal';

const CountUp = ({ end }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const valStr = String(end || 0);

  return (
    <span className="inline-flex" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {valStr.split('').map((char, i) => {
        if (isNaN(char) || char === ' ') return <span key={i}>{char}</span>;
        return (
          <span key={i} className="inline-block h-[1em] overflow-hidden leading-none align-text-bottom relative">
            <span
              className="flex flex-col transition-transform duration-[1500ms] ease-[cubic-bezier(0.2,1,0.3,1)]"
              style={{ transform: `translateY(calc(-${mounted ? char : '0'} * 1em))`, transitionDelay: `${i * 100}ms` }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <span key={num} className="h-[1em] flex items-center justify-center">{num}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

function RepoModal({ repo, onClose }) {
  useEffect(() => {
    if (repo) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [repo]);

  if (!repo) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overscroll-contain animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-background-100 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border border-gray-400 overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-gray-400 flex justify-between items-start bg-background-100">
          <div>
            <h2 className="text-base font-bold text-gray-1000 mb-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{repo.name}</span>
            </h2>
            <p className="text-xs text-gray-600">{repo.description || 'No description provided.'}</p>
          </div>
          <button onClick={onClose} className="text-gray-700 hover:text-gray-1000 transition-colors p-1.5 rounded-md hover:bg-gray-200 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="px-5 py-3 bg-background-200 flex flex-wrap items-center gap-4 text-xs font-mono text-gray-700 border-b border-gray-400">
          <div className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5" /><span>{repo.language || 'Unknown'}</span></div>
          <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500" /><span>{repo.stargazers_count || 0} Stars</span></div>
          <div className="flex items-center gap-1.5"><GitFork className="w-3.5 h-3.5" /><span>{repo.forks_count || 0} Forks</span></div>
          <a href={repo.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline ml-auto">
            <span>View on GitHub</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-background-100 custom-scrollbar">
          <h3 className="text-xs font-mono font-bold text-gray-700 uppercase tracking-wider mb-3">README.md</h3>
          {repo.readme ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-gray-900 leading-relaxed font-sans">
              <ReactMarkdown 
                rehypePlugins={[rehypeRaw]}
                components={{
                  img: ({node, ...props}) => {
                    let src = props.src;
                    if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                      const urlParts = repo.html_url.split('/');
                      const owner = urlParts[3];
                      const repoName = urlParts[4];
                      const branch = repo.default_branch || 'main';
                      src = `https://raw.githubusercontent.com/${owner}/${repoName}/${branch}/${src.replace(/^\//, '')}`;
                    }
                    return <img {...props} src={src} style={{maxWidth: '100%'}} alt={props.alt || ''} />;
                  }
                }}
              >
                {repo.readme}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-gray-600">No README found for this repository.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { resolvedTheme } = useTheme();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'technical' | 'academic' | 'campus'
  const [activeHeatmap, setActiveHeatmap] = useState('github');
  const [githubHeatmap, setGithubHeatmap] = useState(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapError, setHeatmapError] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('Resume');
  const [copiedUid, setCopiedUid] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/admin/students/${id}`);
        setData(res.data.data);
      } catch (err) {
        console.error('Error fetching student details:', err);
        showToast('Failed to load student dossier', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [id, showToast]);

  const effectiveGithubUsername = data?.github?.profile?.login || data?.user?.githubUsername;

  useEffect(() => {
    if (!effectiveGithubUsername) return;
    const fetchHeatmap = async () => {
      setHeatmapLoading(true);
      setHeatmapError(false);
      try {
        const res = await axios.get(`/user/github-heatmap/${effectiveGithubUsername}`);
        setGithubHeatmap(res.data.contributions || []);
      } catch (err) {
        console.error('Error fetching github heatmap:', err);
        setHeatmapError(true);
      } finally {
        setHeatmapLoading(false);
      }
    };
    fetchHeatmap();
  }, [effectiveGithubUsername]);

  const formatExternalUrl = (url) => {
    if (!url) return '#';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  const handleCopyUid = (uid) => {
    if (!uid) return;
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    showToast('UID copied to clipboard', 'success');
    setTimeout(() => setCopiedUid(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-14 bg-background-100 text-gray-1000 min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-1000 mb-3" />
        <p className="text-xs font-mono text-gray-700">Connecting to Student Dossier Vault...</p>
      </div>
    );
  }

  if (!data || !data.user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-14 bg-background-100 text-gray-1000 min-h-[60vh]">
        <AlertCircle className="w-10 h-10 text-gray-500 mb-3" />
        <h2 className="text-base font-bold text-gray-1000 mb-1">Student Record Not Found</h2>
        <p className="text-xs text-gray-600 mb-5">The requested student ID does not match any registered records in Campus Connect.</p>
        <Link 
          to="/admin/students" 
          className="px-4 py-2 bg-gray-1000 text-background-100 hover:opacity-90 rounded-md text-xs font-medium transition-opacity"
        >
          Return to Student Directory
        </Link>
      </div>
    );
  }

  const { user, github, leetcode, linkedin, resumes = [], applications = [], clubs = [], events = [], placements = [] } = data;
  const linkedinData = linkedin?.profileData;
  const skills = user.resumeDetails?.skills || [];
  const experience = user.resumeDetails?.experience || [];
  const education = user.resumeDetails?.education || [];
  const projects = user.resumeDetails?.projects || [];
  const achievements = user.resumeDetails?.achievements || [];

  const getCalendarData = () => {
    let raw = {};
    try {
      raw = JSON.parse(leetcode?.calendar?.submissionCalendar || "{}");
    } catch(e) {}
    
    const activityMap = {};
    Object.keys(raw).forEach(timestamp => {
      const dateStr = format(fromUnixTime(parseInt(timestamp)), 'yyyy-MM-dd');
      activityMap[dateStr] = (activityMap[dateStr] || 0) + raw[timestamp];
    });

    const out = [];
    const today = new Date();
    for (let i = 365; i >= 0; i--) {
      const d = subDays(today, i);
      const dateStr = format(d, 'yyyy-MM-dd');
      const count = activityMap[dateStr] || 0;
      let level = 0;
      if (count > 0) level = 1;
      if (count > 2) level = 2;
      if (count > 4) level = 3;
      if (count > 6) level = 4;
      out.push({ date: dateStr, count, level });
    }
    return out;
  };
  const calendarData = getCalendarData();

  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Student')}&background=6366f1&color=fff&bold=true`;
  const avatarSrc = user.avatarUrl || fallbackAvatar;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background-100 text-gray-1000 font-sans">
      {/* Top Header Bar */}
      <div className="border-b border-gray-400 bg-background-100 px-6 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/admin/students')}
              className="p-1.5 rounded-md border border-gray-400 bg-background-200 text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
              title="Back to Students Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gray-700">
                <span>Directory</span>
                <span>/</span>
                <span>{user.branch || 'Student'}</span>
                <span>/</span>
                <span className="truncate text-gray-1000 font-semibold">{user.name}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-1000 tracking-tight truncate mt-0.5">
                {user.name}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user.uid && (
              <button
                type="button"
                onClick={() => handleCopyUid(user.uid)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700 border border-gray-400 font-mono text-xs font-bold text-gray-900 transition-colors cursor-pointer"
                title="Click to copy UID"
              >
                {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-600" />}
                <span>{user.uid}</span>
              </button>
            )}
            {user.rollNo && (
              <span className="px-2.5 py-1 rounded bg-background-200 border border-gray-400 font-mono text-xs text-gray-700">
                Roll #{user.rollNo}
              </span>
            )}
            <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium">
              Verified Student
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <RepoModal repo={selectedRepo} onClose={() => setSelectedRepo(null)} />
        {selectedPdfUrl && (
          <PdfViewerModal 
            url={selectedPdfUrl} 
            title={selectedPdfTitle} 
            onClose={() => setSelectedPdfUrl(null)} 
          />
        )}
        
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
          
          {/* Profile Hero Card */}
          <section className="rounded-xl border border-gray-400 bg-background-100 p-6 shadow-2xs flex flex-col md:flex-row items-center md:items-start gap-6">
            <img 
              src={avatarSrc} 
              alt={user.name} 
              onError={(e) => {
                if (e.currentTarget.src !== fallbackAvatar) {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = fallbackAvatar;
                }
              }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-gray-400 shrink-0 bg-background-200 shadow-sm" 
            />

            <div className="flex-1 text-center md:text-left min-w-0">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center justify-center md:justify-start gap-2.5">
                    <h2 className="text-2xl font-bold text-gray-1000 tracking-tight">{user.name}</h2>
                    <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                  </div>
                  <p className="text-xs text-gray-600 mt-1 flex items-center justify-center md:justify-start gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-500" />
                    <span className="font-mono">{user.email}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                  {user.branch && (
                    <span className="px-2.5 py-1 rounded bg-background-200 border border-gray-400 text-xs font-mono text-gray-800">
                      {user.branch} {user.division ? `· Div ${user.division}` : ''}
                    </span>
                  )}
                  {user.currentSem && (
                    <span className="px-2.5 py-1 rounded bg-background-200 border border-gray-400 text-xs font-mono text-gray-800">
                      Semester {user.currentSem}
                    </span>
                  )}
                  {user.graduationYear && (
                    <span className="px-2.5 py-1 rounded bg-background-200 border border-gray-400 text-xs font-mono text-gray-800">
                      Class of {user.graduationYear}
                    </span>
                  )}
                </div>
              </div>

              {/* Social & Portfolio Action Buttons */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-4 pt-4 border-t border-gray-300 dark:border-gray-800">
                {resumes.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => {
                      setSelectedPdfUrl(resumes[0].fileUrl);
                      setSelectedPdfTitle(resumes[0].fileName || `${user.name}'s Resume`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-400 bg-background-200 hover:bg-gray-200 text-xs font-medium text-gray-1000 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Primary Resume</span>
                    <span className="px-1.5 py-0.2 rounded bg-gray-300 dark:bg-gray-700 text-[10px] font-mono">
                      {resumes.length}
                    </span>
                  </button>
                )}

                {user.resumeDetails?.portfolioUrl && (
                  <a 
                    href={formatExternalUrl(user.resumeDetails.portfolioUrl)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-400 bg-background-200 hover:bg-gray-200 text-xs font-medium text-gray-1000 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Portfolio</span>
                  </a>
                )}

                {effectiveGithubUsername ? (
                  <a 
                    href={`https://github.com/${effectiveGithubUsername}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-400 bg-background-200 hover:bg-gray-200 text-xs font-medium text-gray-1000 transition-colors"
                  >
                    <FaGithub className="w-3.5 h-3.5" />
                    <span>GitHub: @{effectiveGithubUsername}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-gray-400 text-xs text-gray-500 font-mono">
                    <FaGithub className="w-3.5 h-3.5 text-gray-400" />
                    <span>GitHub Unlinked</span>
                  </span>
                )}

                {user.leetcodeUsername ? (
                  <a 
                    href={`https://leetcode.com/u/${user.leetcodeUsername}`} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-400 bg-background-200 hover:bg-gray-200 text-xs font-medium text-amber-600 dark:text-amber-400 transition-colors"
                  >
                    <SiLeetcode className="w-3.5 h-3.5" />
                    <span>LeetCode: {user.leetcodeUsername}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-gray-400 text-xs text-gray-500 font-mono">
                    <SiLeetcode className="w-3.5 h-3.5 text-gray-400" />
                    <span>LeetCode Unlinked</span>
                  </span>
                )}

                {user.linkedInUrl ? (
                  <a 
                    href={formatExternalUrl(user.linkedInUrl)} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-400 bg-background-200 hover:bg-gray-200 text-xs font-medium text-blue-600 dark:text-blue-400 transition-colors"
                  >
                    <FaLinkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-dashed border-gray-400 text-xs text-gray-500 font-mono">
                    <FaLinkedin className="w-3.5 h-3.5 text-gray-400" />
                    <span>LinkedIn Unlinked</span>
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Quick Stats Strip */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
              <div className="flex items-center justify-between text-gray-700">
                <span className="text-xs font-mono uppercase font-semibold">Resumes Vault</span>
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-gray-1000">{resumes.length}</div>
              <p className="text-[11px] text-gray-600 mt-0.5">Uploaded documents on file</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
              <div className="flex items-center justify-between text-gray-700">
                <span className="text-xs font-mono uppercase font-semibold">Job Applications</span>
                <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-gray-1000">{applications.length}</div>
              <p className="text-[11px] text-gray-600 mt-0.5">Active opportunity pipeline</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
              <div className="flex items-center justify-between text-gray-700">
                <span className="text-xs font-mono uppercase font-semibold">Campus Roles</span>
                <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-gray-1000">{clubs.length}</div>
              <p className="text-[11px] text-gray-600 mt-0.5">Club memberships & posts</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
              <div className="flex items-center justify-between text-gray-700">
                <span className="text-xs font-mono uppercase font-semibold">Events History</span>
                <CalendarIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-gray-1000">{events.length}</div>
              <p className="text-[11px] text-gray-600 mt-0.5">Registered campus events</p>
            </div>
          </section>

          {/* Segmented Workspace Tabs */}
          <div className="border-b border-gray-400">
            <div className="flex items-center gap-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('applications')}
                className={`pb-3 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-[1px] flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'applications'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-1000'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Resumes & Applications</span>
                <span className="px-1.5 py-0.2 rounded bg-gray-200 border border-gray-400 text-[10px] font-mono">
                  {resumes.length + applications.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('technical')}
                className={`pb-3 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-[1px] flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'technical'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-1000'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>Technical & Coding Footprint</span>
                <span className="px-1.5 py-0.2 rounded bg-gray-200 border border-gray-400 text-[10px] font-mono">
                  {(github ? 1 : 0) + (leetcode ? 1 : 0) + (linkedin ? 1 : 0)}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('academic')}
                className={`pb-3 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-[1px] flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'academic'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-1000'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span>Academic & Experience</span>
                <span className="px-1.5 py-0.2 rounded bg-gray-200 border border-gray-400 text-[10px] font-mono">
                  {skills.length + experience.length + projects.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('campus')}
                className={`pb-3 text-xs sm:text-sm font-medium transition-colors border-b-2 -mb-[1px] flex items-center gap-2 cursor-pointer shrink-0 ${
                  activeTab === 'campus'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-600 hover:text-gray-1000'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Campus Activity & Forum</span>
                <span className="px-1.5 py-0.2 rounded bg-gray-200 border border-gray-400 text-[10px] font-mono">
                  {clubs.length + events.length + placements.length}
                </span>
              </button>
            </div>
          </div>

          {/* TAB 1: RESUMES & APPLICATIONS */}
          {activeTab === 'applications' && (
            <div className="space-y-6">
              {/* Uploaded Resumes Vault */}
              <div className="rounded-xl border border-gray-400 bg-background-100 p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-400 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-sm text-gray-1000 tracking-tight">
                      Uploaded Resumes Vault ({resumes.length})
                    </h3>
                  </div>
                  <span className="text-xs text-gray-600 font-mono">Stored Documents</span>
                </div>

                {resumes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resumes.map((resume, idx) => (
                      <div 
                        key={resume._id || idx}
                        className="rounded-xl border border-gray-400 bg-background-200 hover:border-gray-900 dark:hover:border-gray-100 p-4 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs sm:text-sm text-gray-1000 truncate">
                                {resume.fileName || `Resume #${idx + 1}.pdf`}
                              </h4>
                              <p className="text-[11px] text-gray-600 font-mono mt-0.5">
                                {resume.createdAt ? `Uploaded ${new Date(resume.createdAt).toLocaleDateString()}` : 'Archived document'}
                              </p>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded bg-gray-200 border border-gray-400 font-mono text-[9px] uppercase font-bold text-gray-800 shrink-0">
                            PDF
                          </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-300 dark:border-gray-800">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPdfUrl(resume.fileUrl);
                              setSelectedPdfTitle(resume.fileName || `${user.name}'s Resume`);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-1000 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                          
                          <a
                            href={resume.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-gray-600 rounded-lg border border-dashed border-gray-400 bg-background-200">
                    No resumes have been uploaded by this student.
                  </div>
                )}
              </div>

              {/* Submitted Job Applications */}
              <div className="rounded-xl border border-gray-400 bg-background-100 p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-400 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-sm text-gray-1000 tracking-tight">
                      Submitted Job Applications ({applications.length})
                    </h3>
                  </div>
                  <span className="text-xs text-gray-600 font-mono">Recruitment Pipeline</span>
                </div>

                {applications.length > 0 ? (
                  <div className="space-y-3">
                    {applications.map((app) => {
                      const opp = app.opportunityId || {};
                      const score = app.matchScore || 0;
                      const scoreColor = 
                        score >= 75 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                        score >= 50 ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' :
                        'text-gray-700 bg-gray-200 border-gray-400';

                      return (
                        <div 
                          key={app._id}
                          className="rounded-xl border border-gray-400 bg-background-200 hover:border-gray-900 dark:hover:border-gray-100 p-4 sm:p-5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h4 className="font-bold text-sm sm:text-base text-gray-1000">
                                {opp.title || 'Job Opportunity'}
                              </h4>
                              {opp.opportunityType && (
                                <span className="px-2 py-0.5 rounded bg-background-100 border border-gray-400 text-[10px] font-mono uppercase font-bold text-gray-800">
                                  {opp.opportunityType}
                                </span>
                              )}
                              {opp.status && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                                  opp.status === 'active' 
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                    : 'bg-gray-200 text-gray-600 border-gray-400'
                                }`}>
                                  {opp.status}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-700 font-medium mt-1">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                                <span>{opp.company || 'Company'}</span>
                              </span>
                              {opp.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                  <span>{opp.location}</span>
                                </span>
                              )}
                              {opp.stipendOrSalary && (
                                <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400">
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>{opp.stipendOrSalary}</span>
                                </span>
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-2.5 pt-2 border-t border-gray-300 dark:border-gray-800">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span>Applied: {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : '—'}</span>
                              </span>

                              {app.resumeId && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPdfUrl(app.resumeId.fileUrl);
                                    setSelectedPdfTitle(app.resumeId.fileName || 'Application Resume');
                                  }}
                                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Submitted Resume: {app.resumeId.fileName || 'View PDF'}</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end lg:self-center shrink-0">
                            {/* Match score badge */}
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold border ${scoreColor}`}>
                              <Zap className="w-3.5 h-3.5" />
                              <span>{score}% AI Match</span>
                            </div>

                            {/* Application Status Badge */}
                            <span className="px-3 py-1.5 rounded-md bg-background-100 border border-gray-400 text-xs font-mono font-bold uppercase text-gray-900">
                              {app.status || 'Applied'}
                            </span>

                            {/* Deep link to opportunity detail in Admin */}
                            {opp._id && (
                              <Link
                                to={`/admin/opportunities/${opp._id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-1000 transition-colors"
                                title="Inspect Opportunity in Admin"
                              >
                                <span>Inspect</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-gray-600 rounded-lg border border-dashed border-gray-400 bg-background-200">
                    No active job applications found for this student.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TECHNICAL & CODING FOOTPRINT */}
          {activeTab === 'technical' && (
            <div className="space-y-6">
              {/* Activity Heatmap */}
              <div className="rounded-xl border border-gray-400 bg-background-100 p-5 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-400">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-600" />
                    <h3 className="font-bold text-sm text-gray-1000 tracking-tight">Activity Heatmap</h3>
                  </div>
                  <div className="flex bg-background-200 rounded-lg p-0.5 border border-gray-400 text-xs">
                    <button 
                      onClick={() => setActiveHeatmap('github')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        activeHeatmap === 'github' 
                          ? 'bg-background-100 text-gray-1000 shadow-2xs font-semibold' 
                          : 'text-gray-700 hover:text-gray-1000'
                      }`}
                    >
                      GitHub
                    </button>
                    <button 
                      onClick={() => setActiveHeatmap('leetcode')}
                      className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                        activeHeatmap === 'leetcode' 
                          ? 'bg-background-100 text-gray-1000 shadow-2xs font-semibold' 
                          : 'text-gray-700 hover:text-gray-1000'
                      }`}
                    >
                      LeetCode
                    </button>
                  </div>
                </div>
                
                <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                  <div className="min-w-[700px] min-h-[160px] relative w-full flex justify-center items-center py-2">
                    {activeHeatmap === 'github' ? (
                      effectiveGithubUsername ? (
                        heatmapLoading ? (
                          <div className="py-8 text-xs font-mono text-gray-600 animate-pulse">Loading GitHub contributions...</div>
                        ) : heatmapError || !githubHeatmap ? (
                          <div className="text-xs text-red-600 py-8">Failed to fetch GitHub activity.</div>
                        ) : githubHeatmap.length === 0 ? (
                           <div className="text-xs text-gray-600 py-8">No GitHub activity recorded in the last year.</div>
                        ) : (
                          <ActivityCalendar 
                            data={githubHeatmap} 
                            colorScheme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                            theme={{
                              light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                              dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']
                            }}
                            labels={{
                              totalCount: `{{count}} contributions in the last year`,
                            }}
                          />
                        )
                      ) : (
                        <div className="text-xs text-gray-600 py-8">GitHub account has not been connected by the student.</div>
                      )
                    ) : (
                      leetcode ? (
                        <ActivityCalendar 
                          data={calendarData} 
                          colorScheme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                          theme={{
                            light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                            dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                          }}
                          labels={{
                            totalCount: `{{count}} submissions in the last year`,
                          }}
                        />
                      ) : (
                        <div className="text-xs text-gray-600 py-8">LeetCode account has not been connected by the student.</div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* GitHub and LeetCode Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* GitHub Card */}
                <div className="rounded-xl border border-gray-400 bg-background-100 p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-gray-400 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <FaGithub className="w-4 h-4 text-gray-900 dark:text-gray-100" />
                        <h3 className="font-bold text-sm text-gray-1000">GitHub Profile</h3>
                      </div>
                      {github?.profile?.html_url && (
                        <a href={github.profile.html_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                          <span>View Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {github ? (
                      <>
                        <div className="grid grid-cols-3 gap-3 text-center mb-4">
                          <div className="p-3 rounded-lg border border-gray-400 bg-background-200">
                            <div className="text-xl font-bold font-mono text-gray-1000">
                              <CountUp end={github.profile?.public_repos || 0} />
                            </div>
                            <div className="text-[10px] uppercase font-mono text-gray-600 mt-1">Repos</div>
                          </div>
                          <div className="p-3 rounded-lg border border-gray-400 bg-background-200">
                            <div className="text-xl font-bold font-mono text-gray-1000">
                              <CountUp end={github.profile?.followers || 0} />
                            </div>
                            <div className="text-[10px] uppercase font-mono text-gray-600 mt-1">Followers</div>
                          </div>
                          <div className="p-3 rounded-lg border border-gray-400 bg-background-200">
                            <div className="text-xl font-bold font-mono text-gray-1000">
                              <CountUp end={github.profile?.following || 0} />
                            </div>
                            <div className="text-[10px] uppercase font-mono text-gray-600 mt-1">Following</div>
                          </div>
                        </div>

                        <h4 className="text-xs font-mono uppercase font-bold text-gray-700 mb-2">Top Repositories</h4>
                        <div className="space-y-2">
                          {github.repositories?.slice(0, 3).map(repo => (
                            <div 
                              key={repo.name} 
                              onClick={() => setSelectedRepo(repo)}
                              className="flex justify-between items-center p-3 rounded-lg border border-gray-400 bg-background-200 hover:bg-gray-200 transition-colors cursor-pointer group"
                            >
                              <div className="min-w-0 pr-3">
                                <span className="text-xs font-bold text-gray-1000 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate block">
                                  {repo.name}
                                </span>
                                <p className="text-[11px] text-gray-600 truncate mt-0.5">{repo.description || 'No description provided.'}</p>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-gray-600">
                                {repo.language && <span className="px-2 py-0.5 rounded bg-background-100 border border-gray-400 text-[10px] text-gray-800">{repo.language}</span>}
                                <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" />{repo.stargazers_count || 0}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="py-12 text-center text-xs text-gray-600 rounded-lg border border-dashed border-gray-400 bg-background-200">
                        No GitHub profile connected for this student.
                      </div>
                    )}
                  </div>
                </div>

                {/* LeetCode Card */}
                <div className="rounded-xl border border-gray-400 bg-background-100 p-5 shadow-2xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-gray-400 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <SiLeetcode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <h3 className="font-bold text-sm text-gray-1000">LeetCode Progress</h3>
                      </div>
                      {user.leetcodeUsername && (
                        <a href={`https://leetcode.com/u/${user.leetcodeUsername}`} target="_blank" rel="noreferrer" className="text-xs text-amber-600 dark:text-amber-400 hover:underline inline-flex items-center gap-1">
                          <span>View Profile</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    {leetcode ? (
                      <div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 rounded-lg border border-gray-400 bg-background-200 text-center">
                            <div className="text-[10px] font-mono uppercase text-gray-600 mb-1">Global Ranking</div>
                            <div className="text-lg font-bold font-mono text-gray-1000">
                              <CountUp end={leetcode.profile?.ranking || 0} />
                            </div>
                          </div>
                          <div className="p-3 rounded-lg border border-gray-400 bg-background-200 text-center">
                            <div className="text-[10px] font-mono uppercase text-gray-600 mb-1">Total Solved</div>
                            <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              <CountUp end={leetcode.solved?.solvedProblem || (leetcode.profile?.totalSolved) || 0} />
                            </div>
                          </div>
                        </div>

                        {/* Progress Breakdown */}
                        {(() => {
                          const easySolved = leetcode.solved?.easySolved || leetcode.profile?.easySolved || 0;
                          const mediumSolved = leetcode.solved?.mediumSolved || leetcode.profile?.mediumSolved || 0;
                          const hardSolved = leetcode.solved?.hardSolved || leetcode.profile?.hardSolved || 0;
                          const totalEasy = leetcode.solved?.totalEasy || 964;
                          const totalMedium = leetcode.solved?.totalMedium || 2113;
                          const totalHard = leetcode.solved?.totalHard || 974;

                          return (
                            <div className="space-y-3 pt-2">
                              <div>
                                <div className="flex justify-between text-xs font-mono mb-1">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Easy</span>
                                  <span className="text-gray-700">{easySolved} / {totalEasy}</span>
                                </div>
                                <div className="w-full bg-background-200 rounded-full h-2 border border-gray-400 overflow-hidden">
                                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(100, (easySolved / totalEasy) * 100)}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-xs font-mono mb-1">
                                  <span className="font-bold text-amber-600 dark:text-amber-400">Medium</span>
                                  <span className="text-gray-700">{mediumSolved} / {totalMedium}</span>
                                </div>
                                <div className="w-full bg-background-200 rounded-full h-2 border border-gray-400 overflow-hidden">
                                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${Math.min(100, (mediumSolved / totalMedium) * 100)}%` }} />
                                </div>
                              </div>

                              <div>
                                <div className="flex justify-between text-xs font-mono mb-1">
                                  <span className="font-bold text-red-600 dark:text-red-400">Hard</span>
                                  <span className="text-gray-700">{hardSolved} / {totalHard}</span>
                                </div>
                                <div className="w-full bg-background-200 rounded-full h-2 border border-gray-400 overflow-hidden">
                                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${Math.min(100, (hardSolved / totalHard) * 100)}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs text-gray-600 rounded-lg border border-dashed border-gray-400 bg-background-200">
                        No LeetCode profile connected for this student.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LinkedIn Overview */}
              {linkedinData && (
                <div className="rounded-xl border border-gray-400 bg-background-100 p-6 shadow-2xs">
                  <div className="flex items-center gap-3 border-b border-gray-400 pb-3 mb-4">
                    <FaLinkedin className="text-blue-600 dark:text-blue-400 text-lg" />
                    <h3 className="font-bold text-sm text-gray-1000">LinkedIn Professional Dossier</h3>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h4 className="font-bold text-base text-gray-1000">
                        {linkedinData.firstName} {linkedinData.lastName}
                      </h4>
                      <p className="text-xs text-gray-700 mt-0.5 mb-3">{linkedinData.headline}</p>
                      {linkedinData.about && (
                        <p className="text-xs text-gray-600 leading-relaxed bg-background-200 p-3.5 rounded-lg border border-gray-400 whitespace-pre-line">
                          {linkedinData.about}
                        </p>
                      )}
                    </div>

                    {linkedinData.certifications?.length > 0 && (
                      <div className="flex-1">
                        <h5 className="font-mono uppercase text-xs font-bold text-gray-700 mb-2">Verified Certifications</h5>
                        <div className="space-y-2">
                          {linkedinData.certifications.slice(0, 4).map((cert, i) => (
                            <div key={i} className="p-2.5 rounded-lg border border-gray-400 bg-background-200 text-xs">
                              <p className="font-bold text-gray-1000 truncate">{cert.title}</p>
                              <p className="text-[11px] text-gray-600">{cert.issuedBy}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACADEMIC & RESUME DETAILS */}
          {activeTab === 'academic' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Skills */}
                <div className="rounded-xl border border-gray-400 bg-background-100 p-5 shadow-2xs">
                  <h3 className="font-bold text-sm text-gray-1000 mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-gray-700" />
                    <span>Technical & Domain Skills</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.length > 0 ? skills.map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded bg-background-200 border border-gray-400 font-mono text-xs text-gray-900">
                        {sk}
                      </span>
                    )) : (
                      <p className="text-xs text-gray-600">No skills declared in profile.</p>
                    )}
                  </div>
                </div>

                {/* Experience History */}
                <div className="lg:col-span-2 rounded-xl border border-gray-400 bg-background-100 p-5 shadow-2xs">
                  <h3 className="font-bold text-sm text-gray-1000 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-700" />
                    <span>Work & Internship Experience</span>
                  </h3>
                  {experience.length > 0 ? (
                    <div className="space-y-4">
                      {experience.map((exp, idx) => (
                        <div key={idx} className="border-b border-gray-300 dark:border-gray-800 pb-3 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-xs sm:text-sm text-gray-1000">{exp.role}</h4>
                            <span className="text-[11px] font-mono text-gray-600">{exp.startDate} - {exp.endDate || 'Present'}</span>
                          </div>
                          <p className="text-xs text-gray-700 font-medium mt-0.5">{exp.company}</p>
                          {exp.description && (
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed line-clamp-2">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-600">No work experience records found.</p>
                  )}
                </div>
              </div>

              {/* Projects Showcase */}
              <div className="rounded-xl border border-gray-400 bg-background-100 p-5 shadow-2xs">
                <h3 className="font-bold text-sm text-gray-1000 mb-4 flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-gray-700" />
                  <span>Projects Showcase</span>
                </h3>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-400 bg-background-200 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm text-gray-1000">{proj.title}</h4>
                            {proj.link && (
                              <a href={formatExternalUrl(proj.link)} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline p-1">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{proj.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600">No projects showcase entries on record.</p>
                )}
              </div>

              {/* Education History */}
              {education.length > 0 && (
                <div className="rounded-xl border border-gray-400 bg-background-100 p-5 shadow-2xs">
                  <h3 className="font-bold text-sm text-gray-1000 mb-4 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-700" />
                    <span>Education Records</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {education.map((edu, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-400 bg-background-200 p-4">
                        <h4 className="font-bold text-sm text-gray-1000">{edu.institution || edu.school}</h4>
                        <p className="text-xs text-gray-700 mt-0.5">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</p>
                        <p className="text-[11px] font-mono text-gray-600 mt-1">{edu.startYear} - {edu.endYear || 'Present'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              <div className="rounded-xl border border-gray-400 bg-background-100 p-5 shadow-2xs">
                <h3 className="font-bold text-sm text-gray-1000 mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-700" />
                  <span>Honors & Achievements</span>
                </h3>
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((ach, idx) => (
                      <div key={idx} className="rounded-lg border border-gray-400 bg-background-200 p-4">
                        <h4 className="font-bold text-sm text-gray-1000">{ach.title}</h4>
                        {ach.date && (
                          <span className="text-[10px] font-mono text-gray-600">{new Date(ach.date).toLocaleDateString()}</span>
                        )}
                        <p className="text-xs text-gray-600 mt-1">{ach.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600">No recorded honors or certifications.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: CAMPUS ACTIVITY & FORUM */}
          {activeTab === 'campus' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Clubs */}
                <div className="rounded-xl border border-gray-400 bg-background-100 p-5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-400 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="font-bold text-sm text-gray-1000">Club Memberships ({clubs.length})</h3>
                    </div>
                    <span className="text-xs text-gray-600 font-mono">Organizations</span>
                  </div>

                  {clubs.length > 0 ? (
                    <div className="space-y-2.5">
                      {clubs.map(c => {
                        const assignedEntry = c.assignedStudents?.find(s => s.studentId?.toString() === user._id?.toString() || s.studentId === user._id);
                        const roleName = assignedEntry?.role || 'Member';

                        return (
                          <div key={c._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-400 bg-background-200">
                            <div className="flex items-center gap-3 min-w-0">
                              <img 
                                src={c.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'Club')}&background=random`} 
                                alt={c.name} 
                                className="w-8 h-8 rounded-full object-cover border border-gray-400 shrink-0" 
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-1000 truncate">{c.name}</p>
                                <p className="text-[10px] font-mono text-gray-600">Campus Club</p>
                              </div>
                            </div>
                            <span className="px-2.5 py-0.5 rounded bg-background-100 border border-gray-400 text-[10px] font-mono uppercase font-bold text-purple-600 dark:text-purple-400 shrink-0">
                              {roleName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-600 rounded-lg border border-dashed border-gray-400 bg-background-200">
                      No active club memberships recorded for this student.
                    </div>
                  )}
                </div>

                {/* Events */}
                <div className="rounded-xl border border-gray-400 bg-background-100 p-5 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-400 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h3 className="font-bold text-sm text-gray-1000">Events Registered ({events.length})</h3>
                    </div>
                    <span className="text-xs text-gray-600 font-mono">Attendance</span>
                  </div>

                  {events.length > 0 ? (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
                      {events.map(ev => {
                        const regEntry = ev.registeredStudents?.find(s => s.studentId?.toString() === user._id?.toString() || s.studentId === user._id);
                        const attendance = regEntry?.attendanceStatus || 'pending';
                        const attendanceColor = 
                          attendance === 'present' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                          attendance === 'absent' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                          'bg-amber-500/10 text-amber-600 border-amber-500/20';

                        return (
                          <div key={ev._id} className="p-3 rounded-lg border border-gray-400 bg-background-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-gray-1000 truncate">{ev.title}</p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono mt-0.5">
                                <span>{ev.date ? new Date(ev.date).toLocaleDateString() : '—'}</span>
                                {ev.venue && <span>· {ev.venue}</span>}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${attendanceColor}`}>
                                {attendance}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-gray-600 rounded-lg border border-dashed border-gray-400 bg-background-200">
                      No event registrations on record for this student.
                    </div>
                  )}
                </div>
              </div>

              {/* Placement Forum Posts */}
              <div className="rounded-xl border border-gray-400 bg-background-100 p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-400 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="font-bold text-sm text-gray-1000">Authored Placement Experiences ({placements.length})</h3>
                  </div>
                  <span className="text-xs text-gray-600 font-mono">Forum Submissions</span>
                </div>

                {placements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {placements.map(post => (
                      <div key={post._id} className="p-4 rounded-xl border border-gray-400 bg-background-200 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="font-bold text-gray-1000">{post.company?.name || 'Company'}</span>
                            <span className="text-[10px] font-mono uppercase text-gray-600">{post.role}</span>
                          </div>
                          <Link to={`/placements/${post._id}`} className="font-bold text-xs sm:text-sm text-gray-1000 hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2 mt-1">
                            {post.title}
                          </Link>
                          {post.salary?.amount && (
                            <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                              ₹{post.salary.amount.toLocaleString()} ({post.salary.period || 'annual'})
                            </p>
                          )}
                        </div>
                        <div className="flex justify-between items-center pt-3 mt-3 border-t border-gray-300 dark:border-gray-800 text-[11px] text-gray-600">
                          <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</span>
                          <Link to={`/placements/${post._id}`} className="text-blue-600 dark:text-blue-400 font-medium hover:underline inline-flex items-center gap-1">
                            <span>Read Post</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-xs text-gray-600 rounded-lg border border-dashed border-gray-400 bg-background-200">
                    No placement forum posts authored by this student.
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
