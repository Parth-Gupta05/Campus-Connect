import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ActivityCalendar } from 'react-activity-calendar';
import { fromUnixTime, format, formatDistanceToNow, subDays } from 'date-fns';
import { isEventPast, getEventStartDateTime, getEventStatus, formatTime12h } from '../utils/eventUtils';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { FaGithub } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import { 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  Clock, 
  RefreshCw, 
  AlertTriangle, 
  Award, 
  Calendar, 
  MapPin, 
  Users, 
  BookOpen, 
  Code2, 
  Star, 
  GitFork, 
  GitBranch, 
  ExternalLink, 
  X, 
  FileText, 
  CheckCircle2, 
  LayoutDashboard, 
  Compass, 
  User, 
  Loader2,
  Terminal,
  Layers,
  GraduationCap,
  Flame,
  Target,
  Trophy,
  Percent,
  Lock,
  Upload,
  Trash2,
  Download,
  FileSpreadsheet,
  Eye,
  Plus,
  Edit3,
  FileUp,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import PdfViewerModal from '../components/PdfViewerModal';

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
        if (isNaN(char) || char === ' ') {
          return <span key={i}>{char}</span>;
        }
        return (
          <span key={i} className="inline-block h-[1em] overflow-hidden leading-none align-text-bottom relative">
            <span
              className="flex flex-col transition-transform ease-geist-in-out"
              style={{ 
                transitionDuration: '1500ms',
                transform: `translateY(calc(-${mounted ? char : '0'} * 1em))`,
                transitionDelay: `${i * 100}ms`
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <span key={num} className="h-[1em] flex items-center justify-center">
                  {num}
                </span>
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
      const originalBody = document.body.style.overflow;
      const originalHtml = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBody;
        document.documentElement.style.overflow = originalHtml;
      };
    }
  }, [repo]);

  if (!repo) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overscroll-contain" onClick={onClose}>
      <div className="bg-background-100 w-full max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-gray-400 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-400 flex justify-between items-start bg-background-200">
          <div>
            <h2 className="text-base font-semibold text-gray-1000 mb-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-900" strokeWidth={1.5} />
              {repo.name}
            </h2>
            <p className="text-xs text-gray-700 line-clamp-2">{repo.description || 'No description provided.'}</p>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close modal"
            className="text-gray-700 hover:text-gray-1000 transition-colors p-1.5 hover:bg-gray-200 rounded-md flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
        
        {/* Repo Meta Strip */}
        <div className="px-5 py-2.5 bg-background-100 flex flex-wrap items-center gap-4 text-xs font-mono text-gray-700 border-b border-gray-400">
          <div className="flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5 text-gray-600" />{repo.language || 'Unknown'}</div>
          <div className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />{repo.stargazers_count || 0} Stars</div>
          <div className="flex items-center gap-1.5"><GitFork className="w-3.5 h-3.5 text-gray-600" />{repo.forks_count || 0} Forks</div>
          <a href={repo.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-gray-900 hover:text-gray-1000 hover:underline ml-auto font-sans font-medium">
            View on GitHub <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Readme Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-background-100 custom-scrollbar">
          <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 mb-4">README.md</h3>
          {repo.readme ? (
            <div className="prose prose-sm dark:prose-invert max-w-none font-sans text-gray-900 leading-relaxed">
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
            <div className="text-center py-12 text-gray-700 flex flex-col items-center gap-2 bg-background-200 rounded-lg border border-gray-400">
               <FileText className="w-8 h-8 text-gray-600" strokeWidth={1.5} />
               <p className="text-xs font-mono">No README.md found for this repository.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Dynamic greeting function
const getGreeting = (name) => {
  const hour = new Date().getHours();
  let timeBasedGreeting = "";
  if (hour >= 5 && hour < 12) timeBasedGreeting = `Good morning, ${name}`;
  else if (hour >= 12 && hour < 17) timeBasedGreeting = `Good afternoon, ${name}`;
  else if (hour >= 17 && hour < 21) timeBasedGreeting = `Good evening, ${name}`;
  else timeBasedGreeting = `Up late working, ${name}?`;

  const greetings = [
    `Ready to grind, ${name}!`,
    `Welcome back, ${name}!`,
    `Let's build something amazing, ${name}.`,
    `Stay focused and keep pushing, ${name}.`,
    `Your next big opportunity is waiting, ${name}.`,
    `Time to level up your skills, ${name}.`,
    `Success is built one line at a time, ${name}.`,
    `Keep striving for excellence, ${name}.`,
    `Welcome to your command center, ${name}.`,
    `Let's make today productive, ${name}.`,
    `Your career journey continues here, ${name}.`,
    `Consistency is key. Keep at it, ${name}!`,
    `Dream big, work hard, ${name}.`,
    `Every expert was once a beginner, ${name}.`,
    `Ready to tackle new challenges, ${name}?`,
    `Your potential is limitless, ${name}.`,
    `Stay curious and keep learning, ${name}.`,
    `The best way to predict the future is to invent it, ${name}.`,
    `Small steps lead to big results, ${name}.`,
    `Focus on the process, results will follow, ${name}.`,
    `Let's hit those learning goals today, ${name}.`,
    `Your future self will thank you for today, ${name}.`,
    `Time to debug, build, and deploy, ${name}.`
  ];
  
  // 30% chance to show the time-based greeting, 70% for a random quote
  if (Math.random() < 0.3) {
    return timeBasedGreeting;
  }
  return greetings[Math.floor(Math.random() * greetings.length)];
};

const getInitials = (name) => {
  if (!name) return 'ST';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function StudentDashboard() {
  const { user } = useContext(AuthContext);

  const { showToast } = useToast();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'coding' | 'campus' | 'vault'
  
  const displayName = useMemo(() => {
    const fullName = profile?.name || user?.name || user?.email?.split('@')[0] || 'Student';
    return fullName.split(' ')[0];
  }, [profile?.name, user?.name, user?.email]);
  
  const currentGreeting = useMemo(() => getGreeting(displayName), [displayName]);
  const [displayedGreeting, setDisplayedGreeting] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    let i = 0;
    setDisplayedGreeting('');
    setShowCursor(true);
    let timeoutId;

    const typingInterval = setInterval(() => {
      if (i < currentGreeting.length) {
        setDisplayedGreeting(currentGreeting.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        timeoutId = setTimeout(() => {
          setShowCursor(false);
        }, 2000);
      }
    }, 60);

    return () => {
      clearInterval(typingInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [currentGreeting]);
  const [activeHeatmap, setActiveHeatmap] = useState('github');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [animMounted, setAnimMounted] = useState(false);

  // Resume Vault state (Max 5 resumes, Max 2MB each)
  const [resumes, setResumes] = useState([]);
  const [resumesLoading, setResumesLoading] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('Resume PDF');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deleteModalResume, setDeleteModalResume] = useState(null);
  const [deletingResume, setDeletingResume] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [settingPrimaryId, setSettingPrimaryId] = useState(null);

  // Upload Form state
  const [uploadFile, setUploadFile] = useState(null);
  const [customFileName, setCustomFileName] = useState('');
  const [uploadAsPrimary, setUploadAsPrimary] = useState(false);

  const speedometerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setAnimMounted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (speedometerRef.current) {
      observer.observe(speedometerRef.current);
    }

    return () => observer.disconnect();
  }, [activeTab]);
  
  const [githubHeatmap, setGithubHeatmap] = useState(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapError, setHeatmapError] = useState(false);
  
  const generateDummyHeatmap = () => {
    const data = [];
    const today = new Date();
    for (let i = 365; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split('T')[0],
        count: 0,
        level: 0
      });
    }
    return data;
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, eventsRes, resumesRes] = await Promise.all([
          axios.get('/user/profile'),
          axios.get('/events/student/registered'),
          axios.get('/user/resumes').catch(() => ({ data: { resumes: [] } }))
        ]);
        setProfile(profileRes.data);
        setResumes(resumesRes.data?.resumes || profileRes.data?.resumes || []);
        
        const futureEvents = eventsRes.data
          .filter(ev => !isEventPast(ev))
          .sort((a, b) => getEventStartDateTime(a) - getEventStartDateTime(b));
          
        setUpcomingEvents(futureEvents.slice(0, 3));
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeHeatmap === 'github' && profile?.githubUsername && profile?.githubVerified && !githubHeatmap && !heatmapLoading) {
      setHeatmapLoading(true);
      axios.get('/user/github-heatmap')
        .then(res => {
          setGithubHeatmap(res.data);
          setHeatmapError(false);
        })
        .catch(err => {
          console.error('Failed to fetch github heatmap', err);
          setHeatmapError(true);
        })
        .finally(() => setHeatmapLoading(false));
    }
  }, [activeHeatmap, profile?.githubUsername, profile?.githubVerified]);

  const handleRefreshMetrics = async () => {
    setRefreshing(true);
    try {
      const res = await axios.post('/user/refresh-metrics');
      setProfile(res.data.user);
      showToast('Live metrics refreshed', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to refresh metrics', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleApproveAchievement = async (title) => {
    try {
      const res = await axios.post('/user/achievements/approve', { title });
      setProfile(res.data.user);
      showToast('Achievement added to your portfolio!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to approve achievement', 'error');
    }
  };

  const handleDiscardAchievement = async (title) => {
    try {
      const res = await axios.post('/user/achievements/discard', { title });
      setProfile(res.data.user);
      showToast('Achievement discarded', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to discard achievement', 'error');
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const fetchResumes = async () => {
    try {
      setResumesLoading(true);
      const res = await axios.get('/user/resumes');
      setResumes(res.data?.resumes || []);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    } finally {
      setResumesLoading(false);
    }
  };

  const handleFileSelection = (file) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      showToast('Only PDF files are supported for resumes', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      showToast(`Resume file size (${sizeMb} MB) exceeds the 2MB limit`, 'error');
      return;
    }
    setUploadFile(file);
    if (!customFileName) {
      const cleanName = file.name.replace(/\.pdf$/i, '');
      setCustomFileName(cleanName);
    }
  };

  const handleUploadResume = async (e) => {
    if (e) e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a PDF resume file to upload', 'error');
      return;
    }
    if (uploadFile.size > 2 * 1024 * 1024) {
      showToast('Resume file size cannot exceed 2MB', 'error');
      return;
    }
    if (resumes.length >= 5) {
      showToast('Resume vault limit reached (max 5 resumes). Delete an existing resume to continue.', 'error');
      return;
    }

    setUploadingResume(true);
    try {
      const formData = new FormData();
      formData.append('resume', uploadFile);
      if (customFileName.trim()) {
        const finalName = customFileName.trim().toLowerCase().endsWith('.pdf')
          ? customFileName.trim()
          : `${customFileName.trim()}.pdf`;
        formData.append('fileName', finalName);
      }
      formData.append('isPrimary', uploadAsPrimary || resumes.length === 0);

      const res = await axios.post('/user/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(res.data?.message || 'Resume stored in vault!', 'success');
      setUploadModalOpen(false);
      setUploadFile(null);
      setCustomFileName('');
      setUploadAsPrimary(false);
      await fetchResumes();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to upload resume to vault', 'error');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSetPrimaryResume = async (resumeId) => {
    setSettingPrimaryId(resumeId);
    try {
      await axios.put(`/user/resumes/${resumeId}/primary`);
      showToast('Primary application resume updated', 'success');
      await fetchResumes();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update primary resume', 'error');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const handleDeleteResume = async () => {
    if (!deleteModalResume) return;
    setDeletingResume(true);
    try {
      await axios.delete(`/user/resumes/${deleteModalResume._id}`);
      showToast('Resume permanently removed from vault', 'success');
      setDeleteModalResume(null);
      await fetchResumes();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete resume', 'error');
    } finally {
      setDeletingResume(false);
    }
  };

  const handleSaveRename = async (resumeId) => {
    if (!editingTitle.trim()) {
      showToast('File name cannot be empty', 'error');
      return;
    }
    const finalName = editingTitle.trim().toLowerCase().endsWith('.pdf')
      ? editingTitle.trim()
      : `${editingTitle.trim()}.pdf`;
    try {
      await axios.put(`/user/resumes/${resumeId}`, { fileName: finalName });
      showToast('Resume renamed successfully', 'success');
      setEditingResumeId(null);
      await fetchResumes();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to rename resume', 'error');
    }
  };

  if (loading) {
    return (
      <>
        <div className="flex-1 relative bg-background-100">
          <div className="hidden md:flex bg-background-100 border-b border-gray-400 h-14 w-full" />
          <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-md" />
            <div className="h-20 w-full bg-gray-200 animate-pulse rounded-xl" />
            <div className="h-64 w-full bg-gray-200 animate-pulse rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  const education = profile?.resumeDetails?.education || [];
  const github = profile?.scrapedData?.github;
  const leetcode = profile?.scrapedData?.leetcode;

  const rawCgpa = profile?.cgpa || profile?.resumeDetails?.cgpa || education.find(e => e && (e.grade || e.cgpa || e.score))?.grade || education.find(e => e && (e.grade || e.cgpa || e.score))?.cgpa || null;
  const studentCgpa = rawCgpa ? String(rawCgpa).trim() : null;

  const primaryResume = resumes.find(r => r.isPrimary) || resumes[0] || null;

  // Profile strength
  const skills = profile?.resumeDetails?.skills || [];
  const experience = profile?.resumeDetails?.experience || [];
  const projects = profile?.resumeDetails?.projects || [];
  const achievements = profile?.resumeDetails?.achievements || [];
  const portfolioUrl = profile?.resumeDetails?.portfolioUrl || '';
  const manualCerts = profile?.resumeDetails?.certificates || [];
  const scrapedCerts = profile?.scrapedData?.linkedin?.certifications || [];
  
  const certificatesMap = new Map();
  scrapedCerts.forEach(cert => certificatesMap.set(cert.title, { isComplete: false }));
  manualCerts.forEach(cert => certificatesMap.set(cert.title, cert));
  
  const allCertificates = Array.from(certificatesMap.values());
  const hasIncompleteCerts = allCertificates.length === 0 ? false : allCertificates.some(cert => !cert.isComplete);
  const hasCertificates = allCertificates.length > 0;

  const missingSections = [];
  if (skills.length === 0) missingSections.push('Skills');
  if (experience.length === 0) missingSections.push('Experience');
  if (education.length === 0) missingSections.push('Education');
  if (projects.length === 0) missingSections.push('Projects');
  if (achievements.length === 0) missingSections.push('Achievements');
  if (!portfolioUrl) missingSections.push('Portfolio');
  if (!hasCertificates || hasIncompleteCerts) missingSections.push('Certificates');

  let profileStrength = 10;
  if (skills.length > 0) profileStrength += 15;
  if (experience.length > 0) profileStrength += 15;
  if (education.length > 0) profileStrength += 15;
  if (projects.length > 0) profileStrength += 15;
  if (achievements.length > 0) profileStrength += 10;
  if (portfolioUrl) profileStrength += 10;
  if (hasCertificates && !hasIncompleteCerts) profileStrength += 10;

  // LeetCode platform totals & normalization
  const LC_TOTAL_EASY = 964;
  const LC_TOTAL_MEDIUM = 2113;
  const LC_TOTAL_HARD = 974;
  const LC_TOTAL_ALL = 4051;

  const easySolved = leetcode?.solved?.easySolved ?? leetcode?.profile?.easySolved ?? 0;
  const mediumSolved = leetcode?.solved?.mediumSolved ?? leetcode?.profile?.mediumSolved ?? 0;
  const hardSolved = leetcode?.solved?.hardSolved ?? leetcode?.profile?.hardSolved ?? 0;
  const totalSolved = easySolved + mediumSolved + hardSolved;

  const rawTotalEasy = leetcode?.solved?.totalEasy ?? leetcode?.profile?.totalEasy ?? 0;
  const rawTotalMedium = leetcode?.solved?.totalMedium ?? leetcode?.profile?.totalMedium ?? 0;
  const rawTotalHard = leetcode?.solved?.totalHard ?? leetcode?.profile?.totalHard ?? 0;

  const totalEasy = rawTotalEasy > 200 ? rawTotalEasy : LC_TOTAL_EASY;
  const totalMedium = rawTotalMedium > 500 ? rawTotalMedium : LC_TOTAL_MEDIUM;
  const totalHard = rawTotalHard > 200 ? rawTotalHard : LC_TOTAL_HARD;
  const totalAvailable = (totalEasy + totalMedium + totalHard) || LC_TOTAL_ALL;

  // Acceptance rate
  const acSubAll = leetcode?.solved?.acSubmissionNum?.find(s => s.difficulty === 'All')?.submissions;
  const totalSubAll = leetcode?.solved?.totalSubmissionNum?.find(s => s.difficulty === 'All')?.submissions;
  const acceptanceRate = (acSubAll && totalSubAll && totalSubAll > 0)
    ? ((acSubAll / totalSubAll) * 100).toFixed(1)
    : (leetcode?.solved?.acceptanceRate || leetcode?.profile?.acceptanceRate || null);

  // Calendar
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

    const data = [];
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
      data.push({ date: dateStr, count, level });
    }
    return data;
  };

  const calendarData = getCalendarData();

  const calendarTheme = {
    light: ['#EBEDF0', '#9BE9A8', '#40C463', '#30A14E', '#216E39'],
    dark: ['#161B22', '#0E4429', '#006D32', '#26A641', '#39D353']
  };

  // SVG Ring Calculations for Multi-Segment LeetCode Donut
  const ringRadius = 46;
  const ringCircumference = 2 * Math.PI * ringRadius; // ~289.03
  const maxArcLength = (240 / 360) * ringCircumference;
  const activeSegmentsCount = (easySolved > 0 ? 1 : 0) + (mediumSolved > 0 ? 1 : 0) + (hardSolved > 0 ? 1 : 0);
  const ringGap = activeSegmentsCount > 1 ? 4 : 0;
  const totalRingGap = ringGap * Math.max(0, activeSegmentsCount - 1);
  const effectiveCircumference = Math.max(0, maxArcLength - totalRingGap);

  const easyRatio = totalSolved > 0 ? (easySolved / totalSolved) : 0;
  const medRatio = totalSolved > 0 ? (mediumSolved / totalSolved) : 0;
  const hardRatio = totalSolved > 0 ? (hardSolved / totalSolved) : 0;

  const easyArc = easySolved > 0 ? (easyRatio * effectiveCircumference) : 0;
  const medArc = mediumSolved > 0 ? (medRatio * effectiveCircumference) : 0;
  const hardArc = hardSolved > 0 ? (hardRatio * effectiveCircumference) : 0;

  const easyOffset = 0;
  const medOffset = -(easyArc + (easySolved > 0 ? ringGap : 0));
  const hardOffset = -(easyArc + (easySolved > 0 ? ringGap : 0) + medArc + (mediumSolved > 0 ? ringGap : 0));

  const easyPctOfSolved = totalSolved > 0 ? ((easySolved / totalSolved) * 100).toFixed(1) : 0;
  const medPctOfSolved = totalSolved > 0 ? ((mediumSolved / totalSolved) * 100).toFixed(1) : 0;
  const hardPctOfSolved = totalSolved > 0 ? ((hardSolved / totalSolved) * 100).toFixed(1) : 0;

  return (
    <>
      <RepoModal repo={selectedRepo} onClose={() => setSelectedRepo(null)} />

      <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">
          
          {/* ===================================================================
              1. MINIMALIST HEADER & CANONICAL VERCEL TABS
              =================================================================== */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-1000 tracking-tight">
                  {displayedGreeting}{showCursor && <span className="animate-pulse opacity-70">|</span>}
                </h1>
              </div>

              {/* Header Action Button */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshMetrics}
                  disabled={refreshing}
                  className="h-8 px-3 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-100 hover:border-gray-500 text-xs font-medium text-gray-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                  <span>Refresh Metrics</span>
                </button>
                <Link
                  to="/profile"
                  className="h-8 px-3 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity flex items-center gap-1 shadow-xs"
                >
                  <span>Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Canonical Vercel Underline Tab Bar */}
            <div className="flex items-center gap-6 border-b border-gray-400 text-xs font-medium overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'overview'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-700 hover:text-gray-1000'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Overview</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('coding')}
                className={`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'coding'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-700 hover:text-gray-1000'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Coding &amp; Repos</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('campus')}
                className={`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'campus'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-700 hover:text-gray-1000'
                }`}
              >
                <Layers className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Campus &amp; Clubs</span>
                {upcomingEvents.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('vault')}
                className={`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'vault'
                    ? 'border-gray-1000 text-gray-1000 font-semibold'
                    : 'border-transparent text-gray-700 hover:text-gray-1000'
                }`}
              >
                <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Resume Vault</span>
                <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                  resumes.length >= 5 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold' 
                    : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                }`}>
                  {resumes.length}/5
                </span>
              </button>
            </div>
          </section>

          {/* ===================================================================
              TAB 1: OVERVIEW (CLEAN & SPACIOUS)
              =================================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* 4-Column Clean Metrics Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 rounded-xl border border-gray-400 bg-background-200 divide-y md:divide-y-0 md:divide-x divide-gray-400 overflow-hidden shadow-2xs">
                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[11px] font-mono text-gray-700 uppercase tracking-wider">Problems Solved</div>
                  <div className="text-2xl font-bold font-sans text-gray-1000 mt-1">
                    <CountUp end={totalSolved} />
                    <span className="text-xs font-mono font-normal text-gray-600 ml-1">/{totalAvailable}</span>
                  </div>
                </div>

                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[11px] font-mono text-gray-700 uppercase tracking-wider">Public Repos</div>
                  <div className="text-2xl font-bold font-sans text-gray-1000 mt-1">
                    <CountUp end={github?.profile?.public_repos || 0} />
                  </div>
                </div>

                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[11px] font-mono text-gray-700 uppercase tracking-wider">Global Rank</div>
                  <div className="text-2xl font-bold font-sans text-gray-1000 mt-1">
                    #{leetcode?.profile?.ranking?.toLocaleString() || '—'}
                  </div>
                </div>

                <div className="p-5 flex flex-col justify-center">
                  <div className="text-[11px] font-mono text-gray-700 uppercase tracking-wider">Academic CGPA</div>
                  <div className="text-2xl font-bold font-sans text-teal-700 mt-1 flex items-baseline">
                    {studentCgpa ? (
                      <>
                        <span>{studentCgpa}</span>
                        {!studentCgpa.includes('/') && !isNaN(Number(studentCgpa)) && (
                          <span className="text-xs font-mono font-normal text-gray-600 ml-1.5">/ 10.0</span>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-500 font-mono text-base font-normal">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Incomplete profile notice (minimal, only if < 100%) */}
              {profileStrength < 100 && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    <span>Your portfolio is missing {missingSections.join(', ')}. Complete them to increase visibility.</span>
                  </div>
                  <Link to="/profile" className="text-amber-500 font-semibold hover:underline shrink-0 flex items-center gap-1">
                    Update Profile &rarr;
                  </Link>
                </div>
              )}

              {/* Activity Heatmap Card */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">Verified Activity Stream</h2>
                    <p className="text-xs text-gray-700 font-mono mt-0.5">Commits and coding problem submissions across the last 365 days</p>
                  </div>

                  <div className="inline-flex p-0.5 rounded-lg bg-background-100 border border-gray-400 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setActiveHeatmap('github')}
                      className={`px-3 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activeHeatmap === 'github' ? 'bg-gray-200 text-gray-1000 font-medium' : 'text-gray-700 hover:text-gray-1000'
                      }`}
                    >
                      <span>GitHub</span>
                      {profile?.githubVerified ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Verified Account" />
                      ) : profile?.githubUsername ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Verification Pending" />
                      ) : null}
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveHeatmap('leetcode')}
                      className={`px-3 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                        activeHeatmap === 'leetcode' ? 'bg-gray-200 text-gray-1000 font-medium' : 'text-gray-700 hover:text-gray-1000'
                      }`}
                    >
                      <span>LeetCode</span>
                      {profile?.leetcodeVerified ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Verified Account" />
                      ) : profile?.leetcodeUsername ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Verification Pending" />
                      ) : null}
                    </button>
                  </div>
                </div>

                <div className="w-full overflow-x-auto py-2 custom-scrollbar">
                  <div className="min-w-[780px] flex justify-center py-2">
                    {activeHeatmap === 'github' ? (
                      !profile?.githubUsername ? (
                        <div className="py-10 text-xs text-gray-600 font-mono text-center flex flex-col items-center justify-center gap-2">
                          <FaGithub className="w-6 h-6 text-gray-500" />
                          <span className="font-semibold text-gray-900">GitHub Profile Not Linked</span>
                          <p className="text-[11px] text-gray-600 max-w-sm">Connect your GitHub handle in your student profile to display commit activity.</p>
                          <Link to="/profile" className="mt-1 text-xs font-sans text-blue-600 dark:text-blue-400 hover:underline">
                            Link GitHub in Profile &rarr;
                          </Link>
                        </div>
                      ) : !profile?.githubVerified ? (
                        <div className="py-10 px-4 text-center flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
                            <Lock className="w-4 h-4" strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1.5">
                              <h4 className="text-xs font-semibold text-gray-1000">GitHub Verification Required</h4>
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-semibold">Unverified</span>
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                              Account <span className="font-mono text-gray-900 font-semibold">@{profile.githubUsername}</span> is linked but ownership is not verified. Add your cryptographic token to your GitHub bio to unlock your live activity stream.
                            </p>
                          </div>
                          <Link 
                            to="/profile" 
                            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity shadow-2xs cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verify GitHub Ownership &rarr;</span>
                          </Link>
                        </div>
                      ) : githubHeatmap && githubHeatmap.length > 0 ? (
                        <ActivityCalendar
                          data={githubHeatmap}
                          colorScheme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                          theme={calendarTheme}
                          blockSize={11}
                          blockMargin={3}
                          fontSize={11}
                          showWeekdayLabels
                          labels={{ totalCount: '{{count}} contributions in the past year' }}
                        />
                      ) : heatmapLoading ? (
                        <div className="py-10 text-xs text-gray-600 font-mono flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading verified contributions...
                        </div>
                      ) : (
                        <div className="py-10 text-xs text-gray-600 font-mono">No GitHub activity recorded.</div>
                      )
                    ) : (
                      !profile?.leetcodeUsername ? (
                        <div className="py-10 text-xs text-gray-600 font-mono text-center flex flex-col items-center justify-center gap-2">
                          <SiLeetcode className="w-6 h-6 text-[#ffa116]" />
                          <span className="font-semibold text-gray-900">LeetCode Account Not Linked</span>
                          <p className="text-[11px] text-gray-600 max-w-sm">Connect your LeetCode handle in your student profile to display submission activity.</p>
                          <Link to="/profile" className="mt-1 text-xs font-sans text-blue-600 dark:text-blue-400 hover:underline">
                            Link LeetCode in Profile &rarr;
                          </Link>
                        </div>
                      ) : !profile?.leetcodeVerified ? (
                        <div className="py-10 px-4 text-center flex flex-col items-center justify-center gap-2.5 max-w-md mx-auto">
                          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-2xs">
                            <Lock className="w-4 h-4" strokeWidth={1.5} />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-center gap-1.5">
                              <h4 className="text-xs font-semibold text-gray-1000">LeetCode Verification Required</h4>
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-mono font-semibold">Unverified</span>
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed font-sans">
                              Account <span className="font-mono text-gray-900 font-semibold">@{profile.leetcodeUsername}</span> is linked but ownership is not verified. Add your cryptographic token to your LeetCode about section to unlock your verified submission stream.
                            </p>
                          </div>
                          <Link 
                            to="/profile" 
                            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity shadow-2xs cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Verify LeetCode Ownership &rarr;</span>
                          </Link>
                        </div>
                      ) : leetcode ? (
                        <ActivityCalendar
                          data={calendarData}
                          colorScheme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                          theme={calendarTheme}
                          blockSize={11}
                          blockMargin={3}
                          fontSize={11}
                          showWeekdayLabels
                          labels={{ totalCount: '{{count}} submissions in the past year' }}
                        />
                      ) : (
                        <div className="py-10 text-xs text-gray-600 font-mono">No LeetCode activity recorded.</div>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Access Resume Vault Card */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-400 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-gray-1000">Resume Vault</h3>
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${
                          resumes.length >= 5 
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' 
                            : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                        }`}>
                          {resumes.length} / 5 Slots Used
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-600 font-mono mt-0.5">
                        Max 2MB per resume · Capped at 5 resumes per profile
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {resumes.length < 5 && (
                      <button
                        type="button"
                        onClick={() => {
                          setUploadFile(null);
                          setCustomFileName('');
                          setUploadAsPrimary(resumes.length === 0);
                          setUploadModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-100 text-xs font-medium text-gray-900 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Upload Resume</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab('vault')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity cursor-pointer shadow-xs"
                    >
                      <span>Manage Vault</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Primary resume preview or empty state */}
                {primaryResume ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-background-100 border border-gray-400">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-md bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-1000 truncate">{primaryResume.fileName}</span>
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-mono text-[9px] uppercase font-bold">
                            Primary
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 font-mono mt-0.5">
                          {formatBytes(primaryResume.fileSize)} · Uploaded {primaryResume.createdAt ? format(new Date(primaryResume.createdAt), 'MMM d, yyyy') : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPdfUrl(primaryResume.fileUrl);
                          setSelectedPdfTitle(primaryResume.fileName);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-400 bg-background-200 hover:bg-gray-100 text-xs font-medium text-gray-900 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>
                      <a
                        href={primaryResume.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-gray-400 bg-background-200 hover:bg-gray-100 text-xs font-medium text-gray-900 cursor-pointer"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-gray-600 font-mono border border-dashed border-gray-400 rounded-lg">
                    No resumes in your vault yet. Upload up to 5 resumes to apply to campus opportunities.
                  </div>
                )}
              </div>

              {/* 2-Column Overview Highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Repositories Preview */}
                <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                      <FaGithub className="text-sm" /> Top Repositories
                    </h3>
                    <button 
                      onClick={() => setActiveTab('coding')} 
                      className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  {github?.repositories?.length > 0 ? (
                    <div className="divide-y divide-gray-400 pt-1">
                      {github.repositories.slice(0, 3).map(repo => (
                        <div
                          key={repo.name}
                          onClick={() => setSelectedRepo(repo)}
                          className="py-3 flex items-center justify-between group cursor-pointer hover:bg-background-100/50 -mx-2 px-2 rounded-md transition-colors"
                        >
                          <div className="min-w-0 pr-4">
                            <div className="text-xs font-medium text-gray-1000 group-hover:underline truncate">
                              {repo.name}
                            </div>
                            <p className="text-[11px] text-gray-700 truncate mt-0.5">
                              {repo.description || 'No description'}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 text-xs font-mono text-gray-700 shrink-0">
                            {repo.language && (
                              <span className="text-[11px] text-gray-600">{repo.language}</span>
                            )}
                            <span className="flex items-center gap-1 text-[11px]">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                              {repo.stargazers_count || 0}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 font-mono py-6 text-center">No repositories found.</div>
                  )}
                </div>

                {/* Upcoming Events Preview */}
                <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" /> Upcoming Campus Events
                    </h3>
                    <Link to="/events" className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline">
                      All Events &rarr;
                    </Link>
                  </div>

                  {upcomingEvents.length > 0 ? (
                    <div className="divide-y divide-gray-400 pt-1">
                      {upcomingEvents.map(ev => (
                        <div
                          key={ev._id}
                          onClick={() => navigate(`/clubs/${ev.clubId?._id}`)}
                          className="py-3 flex items-center justify-between group cursor-pointer hover:bg-background-100/50 -mx-2 px-2 rounded-md transition-colors"
                        >
                          <div className="min-w-0 pr-4">
                            <div className="text-xs font-medium text-gray-1000 group-hover:underline truncate flex items-center gap-2">
                              {ev.title}
                              {ev.audience && ev.audience !== 'All' && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                                  {ev.audience === 'Department Only' ? `${ev.targetAudienceBranch} Only` : 'Members Only'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-700 font-mono mt-0.5">
                              <span>{new Date(ev.date).toLocaleDateString()}</span>
                              <span>•</span>
                              <span className="truncate">{ev.venue}</span>
                            </div>
                          </div>
                          <span className="text-[11px] text-gray-600 font-mono shrink-0">
                            {ev.clubId?.name || 'Club'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 font-mono py-6 text-center">
                      No upcoming events registered. Check the <Link to="/events" className="underline">Events catalog</Link>.
                    </div>
                  )}
                </div>
              </div>
              {/* Placement Assessments */}
              {user?.assessments?.length > 0 && (
                <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs mt-8">
                  <div className="flex items-center justify-between border-b border-gray-400 pb-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" strokeWidth={1.5} /> Placement Assessments ({user.assessments.length})
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {user.assessments.map((assessment, index) => (
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
                          className="px-3 py-1.5 rounded-md border border-emerald-300 bg-emerald-50 text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 whitespace-nowrap mt-2 sm:self-end w-max"
                        >
                          <Download className="w-3 h-3" /> Download Report
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ===================================================================
              TAB 2: CODING & TELEMETRY
              =================================================================== */}
          {activeTab === 'coding' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* LeetCode Detailed Breakdown */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-6 shadow-2xs">
                {/* Header Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-400 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ffa116]/10 border border-[#ffa116]/30 flex items-center justify-center shrink-0">
                      <SiLeetcode className="w-4 h-4 text-[#ffa116]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">LeetCode Telemetry</h2>
                        {profile?.leetcodeUsername && (
                          <span className="text-[11px] font-mono text-gray-600">@{profile.leetcodeUsername}</span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-gray-600 mt-0.5">
                        Live algorithmic problem solving breakdown &amp; submission analytics
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                    <span className="px-2.5 py-1 rounded-md bg-background-100 border border-gray-400 text-gray-800 font-medium flex items-center gap-1.5">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      Rank: #{leetcode?.profile?.ranking?.toLocaleString() || '—'}
                    </span>
                    {leetcode?.contest?.rating > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-background-100 border border-gray-400 text-gray-800 font-medium">
                        Rating: {Math.round(leetcode.contest.rating)}
                      </span>
                    )}
                    {leetcode?.contest?.topPercentage > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-background-100 border border-gray-400 text-gray-800 font-medium">
                        Top {leetcode.contest.topPercentage}%
                      </span>
                    )}
                    {leetcode?.profile?.reputation > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-background-100 border border-gray-400 text-gray-800 font-medium flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {leetcode.profile.reputation} Rep
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Telemetry Visualization: Geist Design */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-10 py-8 px-6 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
                  
                  {/* Left: Multi-Segment Donut Ring */}
                  <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: 'rotate(150deg)' }}>
                      {/* Background track */}
                      <circle
                        cx="60"
                        cy="60"
                        r={ringRadius}
                        fill="none"
                        className="stroke-gray-300"
                        strokeWidth="3"
                        strokeDasharray={`${maxArcLength} ${ringCircumference - maxArcLength}`}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                      />

                      {/* Easy Segment */}
                      {easyArc > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r={ringRadius}
                          fill="none"
                          className="stroke-emerald-500"
                          strokeWidth="4"
                          strokeDasharray={`${easyArc} ${ringCircumference - easyArc}`}
                          strokeDashoffset={easyOffset}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 1s ease-out, stroke-dashoffset 1s ease-out' }}
                        />
                      )}

                      {/* Medium Segment */}
                      {medArc > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r={ringRadius}
                          fill="none"
                          className="stroke-amber-500"
                          strokeWidth="4"
                          strokeDasharray={`${medArc} ${ringCircumference - medArc}`}
                          strokeDashoffset={medOffset}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 1s ease-out, stroke-dashoffset 1s ease-out' }}
                        />
                      )}

                      {/* Hard Segment */}
                      {hardArc > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r={ringRadius}
                          fill="none"
                          className="stroke-rose-500"
                          strokeWidth="4"
                          strokeDasharray={`${hardArc} ${ringCircumference - hardArc}`}
                          strokeDashoffset={hardOffset}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 1s ease-out, stroke-dashoffset 1s ease-out' }}
                        />
                      )}
                    </svg>

                    {/* Donut Center Display */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-1">
                      <div className="flex items-baseline justify-center">
                        <span className="text-[32px] font-bold text-gray-1000 tracking-tight leading-none font-sans">
                          <CountUp end={totalSolved} />
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[11px] font-mono font-medium text-gray-700">Solved</span>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 mt-0.5">of {totalAvailable}</span>
                    </div>
                  </div>

                  {/* Right: 3 Difficulty Breakdown Cards */}
                  <div className="flex flex-col gap-2 w-full max-w-[200px]">
                    
                    {/* Easy */}
                    <div className="rounded-lg border border-gray-400 bg-background-200 py-2.5 px-4 flex items-center justify-between gap-3 transition-colors hover:bg-background-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-1000">Easy</span>
                      </div>
                      <div className="text-xs font-mono text-gray-1000">
                        <span className="font-semibold">{easySolved}</span>
                        <span className="text-gray-500 ml-0.5">/ {totalEasy}</span>
                      </div>
                    </div>

                    {/* Medium */}
                    <div className="rounded-lg border border-gray-400 bg-background-200 py-2.5 px-4 flex items-center justify-between gap-3 transition-colors hover:bg-background-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-1000">Medium</span>
                      </div>
                      <div className="text-xs font-mono text-gray-1000">
                        <span className="font-semibold">{mediumSolved}</span>
                        <span className="text-gray-500 ml-0.5">/ {totalMedium}</span>
                      </div>
                    </div>

                    {/* Hard */}
                    <div className="rounded-lg border border-gray-400 bg-background-200 py-2.5 px-4 flex items-center justify-between gap-3 transition-colors hover:bg-background-100">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-1000">Hard</span>
                      </div>
                      <div className="text-xs font-mono text-gray-1000">
                        <span className="font-semibold">{hardSolved}</span>
                        <span className="text-gray-500 ml-0.5">/ {totalHard}</span>
                      </div>
                    </div>

                    {/* Acceptance rate inline */}
                    {acceptanceRate && (
                      <div className="flex items-center justify-between text-[11px] font-mono text-gray-600 px-1 pt-1">
                        <span>Acceptance</span>
                        <span className="text-gray-1000 font-medium">{acceptanceRate}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Multi-Segment Solution Distribution Bar */}
                {totalSolved > 0 && (
                  <div className="pt-4 border-t border-gray-400 space-y-2.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-gray-900 font-medium flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-gray-600" />
                        <span>Problem Distribution Across Categories</span>
                      </span>
                      <span className="text-gray-600 text-[11px]">
                        {totalSolved} problem{totalSolved === 1 ? '' : 's'} solved
                      </span>
                    </div>

                    <div className="h-2.5 w-full bg-gray-300 dark:bg-gray-800 rounded-full overflow-hidden flex">
                      {easySolved > 0 && (
                        <div 
                          style={{ width: `${(easySolved / totalSolved) * 100}%` }} 
                          className="bg-emerald-500 h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                          title={`Easy: ${easySolved} (${easyPctOfSolved}%)`}
                        />
                      )}
                      {mediumSolved > 0 && (
                        <div 
                          style={{ width: `${(mediumSolved / totalSolved) * 100}%` }} 
                          className="bg-amber-500 h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                          title={`Medium: ${mediumSolved} (${medPctOfSolved}%)`}
                        />
                      )}
                      {hardSolved > 0 && (
                        <div 
                          style={{ width: `${(hardSolved / totalSolved) * 100}%` }} 
                          className="bg-rose-500 h-full transition-all duration-700 first:rounded-l-full last:rounded-r-full"
                          title={`Hard: ${hardSolved} (${hardPctOfSolved}%)`}
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-mono text-gray-600 flex-wrap gap-2 pt-0.5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Easy: {easySolved} ({easyPctOfSolved}%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        Medium: {mediumSolved} ({medPctOfSolved}%)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Hard: {hardSolved} ({hardPctOfSolved}%)
                      </span>
                    </div>
                  </div>
                )}

                {/* Recent Submissions Row */}
                {leetcode?.submission?.submission?.length > 0 && (
                  <div className="pt-4 border-t border-gray-400">
                    <h4 className="text-xs font-mono uppercase text-gray-600 tracking-wider mb-3">Recent Submissions</h4>
                    <div className="divide-y divide-gray-400 text-xs font-mono">
                      {leetcode.submission.submission.slice(0, 5).map((sub, i) => (
                        <div key={i} className="py-2.5 flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate pr-4">
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sub.statusDisplay === 'Accepted' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-gray-1000 truncate font-sans">{sub.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-gray-600 text-[11px] shrink-0">
                            <span>{sub.lang}</span>
                            <span>{formatDistanceToNow(fromUnixTime(parseInt(sub.timestamp)))} ago</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* GitHub Repositories Deep Dive */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-400 pb-3">
                  <div className="flex items-center gap-2">
                    <FaGithub className="w-4 h-4 text-gray-1000" />
                    <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">Verified GitHub Repositories</h2>
                  </div>
                  <span className="text-xs font-mono text-gray-700">
                    {github?.profile?.public_repos || 0} Total Repositories
                  </span>
                </div>

                {github?.repositories?.length > 0 ? (
                  <div className="divide-y divide-gray-400 max-h-[380px] overflow-y-auto overflow-x-hidden custom-scrollbar pr-2">
                    {github.repositories.map(repo => (
                      <div
                        key={repo.name}
                        onClick={() => setSelectedRepo(repo)}
                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 group cursor-pointer hover:bg-background-100/50 px-2 rounded-md transition-colors"
                      >
                        <div className="min-w-0 pr-4">
                          <div className="text-xs font-semibold text-gray-1000 group-hover:underline flex items-center gap-1.5">
                            {repo.name}
                            <ExternalLink className="w-3 h-3 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-xs text-gray-700 truncate mt-0.5">{repo.description || 'No description provided.'}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-mono text-gray-600 shrink-0">
                          {repo.language && (
                            <span className="px-2 py-0.5 rounded bg-background-100 border border-gray-400 text-[10px] text-gray-900">
                              {repo.language}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                            {repo.stargazers_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <GitFork className="w-3 h-3 text-gray-500" />
                            {repo.forks_count || 0}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 font-mono py-8 text-center">No GitHub repositories connected.</div>
                )}
              </div>

              {/* Skills & Languages */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600">Top Programming Languages</h3>
                  {leetcode?.languages?.languageProblemCount?.length > 0 ? (
                    <div className="divide-y divide-gray-400 text-xs font-mono">
                      {leetcode.languages.languageProblemCount.slice(0, 5).map(lang => (
                        <div key={lang.languageName} className="py-2 flex justify-between items-center">
                          <span className="text-gray-1000">{lang.languageName}</span>
                          <span className="text-gray-700">{lang.problemsSolved} solved</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 font-mono py-4">No language telemetry available.</div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600">Top Algorithmic Topics</h3>
                  {leetcode?.skills?.fundamental?.length > 0 || leetcode?.skills?.intermediate?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[...(leetcode.skills?.fundamental || []), ...(leetcode.skills?.intermediate || [])]
                        .slice(0, 8)
                        .map(topic => (
                          <span key={topic.tagName} className="px-2 py-1 rounded bg-background-100 border border-gray-400 text-[11px] font-mono text-gray-900">
                            {topic.tagName} ({topic.problemsSolved})
                          </span>
                        ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 font-mono py-4">No topic taxonomy available.</div>
                  )}
                </div>
              </div>

              {leetcode?.badges?.length > 0 && (
                <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 border-b border-gray-400 pb-3">
                    <Award className="w-4 h-4 text-[#ffa116]" />
                    <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">Earned Badges</h2>
                  </div>
                  <div className="flex flex-wrap gap-4 pt-1">
                    {leetcode.badges.map((b, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-400 bg-background-100/50 min-w-[80px] hover:bg-background-100 transition-colors">
                        <img src={b.icon.startsWith('/') ? `https://leetcode.com${b.icon}` : b.icon} alt={b.displayName} className="w-10 h-10 object-contain drop-shadow-sm" />
                        <span className="text-[10px] font-mono text-gray-700 text-center max-w-[100px] leading-tight">{b.displayName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ===================================================================
              TAB 3: CAMPUS & PROFILE
              =================================================================== */}
          {activeTab === 'campus' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* Academic Details Card */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <h2 className="text-sm font-semibold text-gray-1000 tracking-tight flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-1000" strokeWidth={1.5} /> Academic Background
                </h2>

                {education.length > 0 ? (
                  <div className="space-y-4">
                    {education.map((edu, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-400 last:border-0 pb-3 last:pb-0">
                        <div>
                          <div className="text-xs font-semibold text-gray-1000">{edu.institution}</div>
                          <p className="text-xs text-gray-700 font-mono mt-0.5">{edu.degree} · {edu.fieldOfStudy}</p>
                        </div>
                        <div className="text-right font-mono text-xs text-gray-700">
                          {edu.grade && <span className="font-semibold text-teal-700 mr-2">{edu.grade} CGPA</span>}
                          <span>{edu.startYear ? `${edu.startYear} - ${edu.endYear || 'Present'}` : ''}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 font-mono py-4">No university record configured.</div>
                )}
              </div>

              {/* Verified Skills Matrix */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600">Verified Technical Skills</h3>
                  <Link to="/profile" className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline">
                    Edit Skills &rarr;
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {skills.length > 0 ? (
                    skills.map((skill, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background-100 border border-gray-400 text-xs font-mono text-gray-900">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                        {typeof skill === 'string' ? skill : skill.name}
                      </span>
                    ))
                  ) : (
                    <div className="text-xs text-gray-600 font-mono py-2">No skills registered yet.</div>
                  )}
                </div>
              </div>

              {/* Pending Achievements Inbox */}
              {profile?.pendingAchievements?.length > 0 && (
                <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-1000" strokeWidth={1.5} />
                    <h3 className="text-sm font-semibold text-gray-1000">Pending Achievements</h3>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      {profile.pendingAchievements.length} Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.pendingAchievements.map((ach, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-background-100 border border-gray-400 flex flex-col gap-2">
                        <div className="text-xs font-semibold text-gray-1000">{ach.title}</div>
                        <p className="text-xs text-gray-700 line-clamp-2">{ach.description}</p>
                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-400">
                          <button
                            onClick={() => handleApproveAchievement(ach.title)}
                            className="flex-1 bg-gray-1000 text-background-100 text-xs font-medium py-1.5 rounded hover:opacity-90 transition-opacity cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDiscardAchievement(ach.title)}
                            className="flex-1 border border-gray-400 text-gray-700 hover:text-red-500 text-xs font-medium py-1.5 rounded transition-colors cursor-pointer"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Registered Club Events */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-1000 flex items-center gap-2">
                    <Calendar className="w-4 h-4" strokeWidth={1.5} /> Registered Club Events
                  </h3>
                  <Link to="/events" className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline">
                    View Catalog &rarr;
                  </Link>
                </div>

                {upcomingEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {upcomingEvents.map(ev => (
                      <div
                        key={ev._id}
                        onClick={() => navigate(`/clubs/${ev.clubId?._id}`)}
                        className="relative p-4 rounded-lg bg-background-100 border border-gray-400 flex flex-col justify-between cursor-pointer hover:border-gray-500 transition-colors"
                      >
                        {getEventStatus(ev) === 'ONGOING' && (
                          <div className="absolute top-3 right-3 flex h-2 w-2" title="Ongoing Now">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </div>
                        )}
                        <div>
                          <div className="text-xs font-semibold text-gray-1000 truncate flex items-center gap-2">
                            {ev.title}
                            {ev.audience && ev.audience !== 'All' && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                                {ev.audience === 'Department Only' ? `${ev.targetAudienceBranch} Only` : 'Members Only'}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-700 font-mono mt-1">
                            {new Date(ev.date).toLocaleDateString()} at {ev.time ? formatTime12h(ev.time) : 'TBA'}
                          </p>
                          <p className="text-[11px] text-gray-700 font-mono">{ev.venue}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-400 flex items-center gap-2">
                          <span className="text-[11px] text-gray-900 font-medium">{ev.clubId?.name || 'Club'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-600 font-mono py-4 text-center">
                    No registered events. Explore the <Link to="/clubs" className="underline">Campus Clubs</Link>.
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ===================================================================
              TAB 4: RESUME VAULT
              =================================================================== */}
          {activeTab === 'vault' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* Header Card */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-gray-1000 tracking-tight">Resume Vault</h2>
                        <p className="text-xs text-gray-600 font-mono mt-0.5">
                          Manage multiple tailored resumes for jobs, internships, and events
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={resumes.length >= 5}
                      onClick={() => {
                        setUploadFile(null);
                        setCustomFileName('');
                        setUploadAsPrimary(resumes.length === 0);
                        setUploadModalOpen(true);
                      }}
                      className={`h-9 px-3.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs ${
                        resumes.length >= 5
                          ? 'bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-1000 text-background-100 hover:opacity-90 cursor-pointer'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{resumes.length >= 5 ? 'Vault Full (5/5)' : 'Upload New Resume'}</span>
                    </button>
                  </div>
                </div>

                {/* Storage & Limit Metrics Strip */}
                <div className="pt-3 border-t border-gray-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-gray-700 font-medium">Vault Capacity:</span>
                    {/* Visual 5-slot meter */}
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4].map((slotIdx) => {
                        const isFilled = slotIdx < resumes.length;
                        return (
                          <div
                            key={slotIdx}
                            className={`w-6 h-2 rounded-full transition-all ${
                              isFilled
                                ? 'bg-blue-600 dark:bg-blue-500 shadow-2xs'
                                : 'bg-gray-300 dark:bg-gray-800 border border-gray-400'
                            }`}
                            title={isFilled ? `Slot ${slotIdx + 1} Used` : `Slot ${slotIdx + 1} Empty`}
                          />
                        );
                      })}
                    </div>
                    <span className="font-mono font-bold text-gray-1000">
                      {resumes.length} / 5 Used
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-600 font-mono text-[11px]">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Max 2MB per file
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      PDF Format Only
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Resume Notice */}
              {primaryResume && (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    <span>
                      <strong className="font-semibold">{primaryResume.fileName}</strong> is designated as your <strong>Primary Resume</strong> for instant 1-click opportunity applications.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPdfUrl(primaryResume.fileUrl);
                      setSelectedPdfTitle(primaryResume.fileName);
                    }}
                    className="inline-flex items-center gap-1 font-semibold hover:underline shrink-0 text-emerald-700 dark:text-emerald-400 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Quick Preview &rarr;</span>
                  </button>
                </div>
              )}

              {/* Resumes Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-700">
                    Stored Documents ({resumes.length})
                  </h3>
                  {resumesLoading && (
                    <span className="text-xs font-mono text-gray-600 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Refreshing...
                    </span>
                  )}
                </div>

                {resumes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resumes.map((resume, idx) => {
                      const isEditing = editingResumeId === resume._id;
                      const isPrimary = resume.isPrimary;
                      return (
                        <div
                          key={resume._id || idx}
                          className={`rounded-xl border p-5 flex flex-col justify-between transition-all duration-150 ${
                            isPrimary
                              ? 'border-emerald-500/50 bg-background-200 shadow-xs'
                              : 'border-gray-400 bg-background-200 hover:border-gray-500 shadow-2xs'
                          }`}
                        >
                          <div>
                            {/* Card Top Strip */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  {isEditing ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={editingTitle}
                                        onChange={(e) => setEditingTitle(e.target.value)}
                                        className="px-2 py-1 text-xs border border-gray-400 rounded bg-background-100 text-gray-1000 w-full focus:outline-none focus:border-gray-900 font-medium"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleSaveRename(resume._id);
                                          if (e.key === 'Escape') setEditingResumeId(null);
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleSaveRename(resume._id)}
                                        className="p-1 rounded hover:bg-gray-200 text-emerald-600 cursor-pointer"
                                        title="Save"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditingResumeId(null)}
                                        className="p-1 rounded hover:bg-gray-200 text-gray-500 cursor-pointer"
                                        title="Cancel"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5 group">
                                      <h4 className="font-bold text-xs sm:text-sm text-gray-1000 truncate">
                                        {resume.fileName || `Resume #${idx + 1}.pdf`}
                                      </h4>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingResumeId(resume._id);
                                          setEditingTitle(resume.fileName || '');
                                        }}
                                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-gray-900 transition-opacity p-0.5 cursor-pointer"
                                        title="Rename"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 text-[11px] text-gray-600 font-mono mt-1">
                                    <span>{formatBytes(resume.fileSize)}</span>
                                    <span>·</span>
                                    <span>{resume.createdAt ? format(new Date(resume.createdAt), 'MMM d, yyyy') : 'Archived'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {isPrimary ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 font-mono text-[9px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-2.5 h-2.5" /> Primary
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={settingPrimaryId === resume._id}
                                    onClick={() => handleSetPrimaryResume(resume._id)}
                                    className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-400 hover:border-gray-500 font-mono text-[9px] uppercase font-semibold text-gray-700 hover:text-gray-1000 cursor-pointer transition-colors"
                                  >
                                    {settingPrimaryId === resume._id ? 'Updating...' : 'Set Primary'}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Card Actions Footer */}
                          <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-300 dark:border-gray-800">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPdfUrl(resume.fileUrl);
                                  setSelectedPdfTitle(resume.fileName);
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-1000 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>
                              
                              <a
                                href={resume.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-1000 transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            </div>

                            <button
                              type="button"
                              onClick={() => setDeleteModalResume(resume)}
                              className="p-1.5 rounded-md border border-transparent hover:border-red-500/30 hover:bg-red-500/10 text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Resume"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-400 bg-background-200 p-8 space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="max-w-md space-y-1">
                      <h4 className="text-sm font-bold text-gray-1000">Your Resume Vault is Empty</h4>
                      <p className="text-xs text-gray-600 font-sans leading-relaxed">
                        Store up to 5 customized resumes (max 2MB, PDF) tailored for different job profiles (e.g. Frontend Engineer, Data Science, Research).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFile(null);
                        setCustomFileName('');
                        setUploadAsPrimary(true);
                        setUploadModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload Your First Resume</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>


      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden bg-background-100/95 backdrop-blur-md fixed bottom-0 w-full flex justify-around items-center h-14 border-t border-gray-400 z-40">
        <Link className="flex flex-col items-center gap-0.5 text-gray-1000" to="/dashboard">
          <LayoutDashboard className="w-4 h-4" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Dash</span>
        </Link>
        <Link className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-gray-1000" to="/opportunities">
          <Compass className="w-4 h-4" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Jobs</span>
        </Link>
        <Link className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-gray-1000" to="/events">
          <Calendar className="w-4 h-4" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Events</span>
        </Link>
        <Link className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-gray-1000" to="/profile">
          <User className="w-4 h-4" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>

      {/* Upload to Resume Vault Modal */}
      {uploadModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overscroll-contain animate-in fade-in duration-150"
          onClick={() => !uploadingResume && setUploadModalOpen(false)}
        >
          <div 
            className="bg-background-100 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-400 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-400 flex justify-between items-center bg-background-100">
              <div className="flex items-center gap-2">
                <FileUp className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-1000">Upload to Resume Vault</h3>
              </div>
              <button 
                type="button"
                onClick={() => !uploadingResume && setUploadModalOpen(false)} 
                className="text-gray-500 hover:text-gray-1000 p-1 rounded-md hover:bg-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadResume} className="p-6 space-y-5">
              {/* Vault status banner */}
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-background-200 border border-gray-400 text-xs font-mono">
                <span className="text-gray-700">Capacity Used:</span>
                <span className="font-bold text-gray-1000">{resumes.length} / 5 slots</span>
              </div>

              {/* File Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                  Select Resume File <span className="text-red-500">*</span>
                </label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-6 text-center flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${
                    uploadFile 
                      ? 'border-blue-500/50 bg-blue-500/5' 
                      : 'border-gray-400 hover:border-gray-600 bg-background-200'
                  }`}
                  onClick={() => document.getElementById('vault-file-input').click()}
                >
                  <input
                    id="vault-file-input"
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileSelection(e.target.files[0]);
                    }}
                  />
                  
                  {uploadFile ? (
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-gray-1000 truncate max-w-xs">{uploadFile.name}</p>
                      <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                        {formatBytes(uploadFile.size)} · Ready to upload
                      </p>
                      <span className="text-[10px] text-gray-500 underline cursor-pointer">Click to replace</span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-medium text-gray-1000">
                        Click to browse or drop PDF here
                      </p>
                      <p className="text-[11px] text-gray-600 font-mono">
                        Maximum file size: 2MB · PDF only
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Custom Resume Label */}
              <div>
                <label className="block text-xs font-semibold text-gray-900 mb-1.5">
                  Resume Title / Label <span className="text-gray-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack Developer Resume"
                  value={customFileName}
                  onChange={(e) => setCustomFileName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-400 rounded-md bg-background-200 text-gray-1000 focus:outline-none focus:border-gray-900"
                />
                <p className="text-[11px] text-gray-600 font-mono mt-1">
                  Helpful for distinguishing resumes tailored for different company roles.
                </p>
              </div>

              {/* Set as Primary Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-lg bg-background-200 border border-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uploadAsPrimary || resumes.length === 0}
                  disabled={resumes.length === 0}
                  onChange={(e) => setUploadAsPrimary(e.target.checked)}
                  className="mt-0.5 rounded border-gray-400 text-gray-900 focus:ring-0"
                />
                <div className="text-xs">
                  <span className="font-semibold text-gray-900 block">Set as primary application resume</span>
                  <span className="text-gray-600 text-[11px]">
                    This resume will be pre-selected by default when applying for jobs and campus opportunities.
                  </span>
                </div>
              </label>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-400">
                <button
                  type="button"
                  disabled={uploadingResume}
                  onClick={() => setUploadModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-md border border-gray-400 text-xs font-medium text-gray-700 hover:bg-gray-200 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile || uploadingResume}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium disabled:opacity-50 cursor-pointer transition-opacity shadow-xs"
                >
                  {uploadingResume ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload to Vault</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Resume Confirmation Modal */}
      {deleteModalResume && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => !deletingResume && setDeleteModalResume(null)}
        >
          <div 
            className="bg-background-100 w-full max-w-md rounded-2xl shadow-2xl border border-gray-400 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-400 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-1000">Delete Resume</h3>
                <p className="text-xs text-gray-600">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <p className="text-gray-800">
                Are you sure you want to permanently remove <strong className="text-gray-1000 font-semibold">{deleteModalResume.fileName}</strong> from your Resume Vault?
              </p>
              {deleteModalResume.isPrimary && resumes.length > 1 && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px]">
                  This is currently your primary resume. A remaining resume will automatically become primary.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-400 flex items-center justify-end gap-2 bg-background-200">
              <button
                type="button"
                disabled={deletingResume}
                onClick={() => setDeleteModalResume(null)}
                className="px-3.5 py-1.5 rounded-md border border-gray-400 text-xs font-medium text-gray-700 hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingResume}
                onClick={handleDeleteResume}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium cursor-pointer shadow-xs"
              >
                {deletingResume ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Resume</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {selectedPdfUrl && (
        <PdfViewerModal
          url={selectedPdfUrl}
          title={selectedPdfTitle}
          onClose={() => setSelectedPdfUrl(null)}
        />
      )}
    </>
  );
}
