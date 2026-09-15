import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ActivityCalendar } from 'react-activity-calendar';
import PdfViewerModal from '../components/PdfViewerModal';
import {
  ExternalLink,
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
  Calendar,
  MapPin,
  Building2,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  Code2,
  Lock,
  Layers,
  Star,
  Download,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';

const formatExternalUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

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
        if (isNaN(parseInt(char))) return <span key={i}>{char}</span>;
        const d = parseInt(char);
        return (
          <span key={i} className="inline-flex flex-col h-[1em] overflow-hidden leading-none relative">
            <span 
              className="transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col"
              style={{ transform: mounted ? `translateY(-${(d + 1)}em)` : 'translateY(0)' }}
            >
              <span className="opacity-0">0</span>
              {[...Array(10)].map((_, j) => (
                <span key={j} className="text-gray-1000">{j}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

export default function PublicProfile() {
  const { uid } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { user } = useContext(AuthContext);
  const isAuthenticated = !!user;
  const { resolvedTheme } = useTheme();
  
  const [activeHeatmap, setActiveHeatmap] = useState('github');
  const [isCertsExpanded, setIsCertsExpanded] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  const calendarTheme = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#1f2937', '#0e4429', '#006d32', '#26a641', '#39d353'],
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/user/public/${uid}`);
        setProfile(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Profile not found');
      } finally {
        setLoading(false);
      }
    };
    if (uid) fetchProfile();
  }, [uid]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-100 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background-100 flex flex-col">
        <Topbar showSearch={false} />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <ShieldCheck className="w-12 h-12 text-gray-400 mb-4" />
          <h1 className="text-xl font-semibold text-gray-1000 mb-2">{error || 'Profile not found'}</h1>
          <p className="text-sm text-gray-600 mb-6 font-mono">The requested student profile could not be loaded.</p>
          <Link to="/" className="px-4 py-2 bg-gray-1000 text-background-100 text-xs font-medium rounded-md hover:opacity-90">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const education = profile.resumeDetails?.education || [];
  const experience = profile.resumeDetails?.experience || [];
  const projects = profile.resumeDetails?.projects || [];
  const achievements = profile.resumeDetails?.achievements || [];
  const certificates = profile.resumeDetails?.certificates || [];

  const githubHeatmap = profile?.scrapedData?.githubHeatmap || [];
  const leetcode = profile?.scrapedData?.leetcode;
  
  // Compute Calendar Data
  const getCalendarData = () => {
    let raw = {};
    try {
      raw = JSON.parse(leetcode?.calendar?.submissionCalendar || "{}");
    } catch(e) {}
    
    const activityMap = {};
    Object.keys(raw).forEach(timestamp => {
      const date = new Date(parseInt(timestamp) * 1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      activityMap[dateStr] = (activityMap[dateStr] || 0) + raw[timestamp];
    });

    const data = [];
    const today = new Date();
    for (let i = 365; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
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
  
  const github = profile?.scrapedData?.github;
  
  const easySolved = leetcode?.solved?.easySolved ?? leetcode?.profile?.easySolved ?? 0;
  const mediumSolved = leetcode?.solved?.mediumSolved ?? leetcode?.profile?.mediumSolved ?? 0;
  const hardSolved = leetcode?.solved?.hardSolved ?? leetcode?.profile?.hardSolved ?? 0;
  const totalSolved = easySolved + mediumSolved + hardSolved;

  const LC_TOTAL_EASY = 964;
  const LC_TOTAL_MEDIUM = 2113;
  const LC_TOTAL_HARD = 974;
  const LC_TOTAL_ALL = 4051;

  const rawTotalEasy = leetcode?.solved?.totalEasy ?? leetcode?.profile?.totalEasy ?? 0;
  const rawTotalMedium = leetcode?.solved?.totalMedium ?? leetcode?.profile?.totalMedium ?? 0;
  const rawTotalHard = leetcode?.solved?.totalHard ?? leetcode?.profile?.totalHard ?? 0;

  const totalEasy = rawTotalEasy > 200 ? rawTotalEasy : LC_TOTAL_EASY;
  const totalMedium = rawTotalMedium > 500 ? rawTotalMedium : LC_TOTAL_MEDIUM;
  const totalHard = rawTotalHard > 200 ? rawTotalHard : LC_TOTAL_HARD;
  const totalAvailable = (totalEasy + totalMedium + totalHard) || LC_TOTAL_ALL;
  const studentCgpa = profile.cgpa || '';
  const resumes = profile.resumes || [];

  return (
    <div className={`flex min-h-screen bg-background-100 text-gray-1000 font-sans selection:bg-gray-1000 selection:text-background-100 ${isAuthenticated ? 'flex-col md:flex-row' : ''}`}>
      {isAuthenticated && <Sidebar />}
      <main className="flex-1 min-w-0 bg-background-100">
        <Topbar showSearch={isAuthenticated} defaultSearchQuery={profile?.name || ''} />
        
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8 pb-20">
            {/* Profile Header */}
            <section className="rounded-xl border border-gray-400 bg-background-200 p-6 shadow-2xs space-y-6 mt-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
              <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-800 border-2 border-gray-400 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="font-semibold text-gray-700 text-xl font-mono">
                    {profile.name?.slice(0, 2).toUpperCase() || 'ST'}
                  </span>
                )}
              </div>
              <div className="space-y-1.5 flex-1 min-w-0 pt-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl font-semibold text-gray-1000 tracking-tight">{profile.name}</h1>
                  {profile.uid && (
                    <span className="px-2 py-0.5 rounded-full bg-background-100 border border-gray-400 text-[10px] font-mono text-gray-700">
                      {profile.uid}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 font-sans">
                  {education.length > 0 ? `${education[0].degree} · ${education[0].institution}` : 'Campus Connect Student'}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-3">
                  {profile.githubUsername && profile.githubVerified && (
                    <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:opacity-80 transition-opacity">
                      <FaGithub className="w-3.5 h-3.5" />
                      <span>{profile.githubUsername}</span>
                    </a>
                  )}
                  {profile.leetcodeUsername && profile.leetcodeVerified && (
                    <a href={`https://leetcode.com/${profile.leetcodeUsername}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 hover:opacity-80 transition-opacity">
                      <SiLeetcode className="w-3.5 h-3.5" />
                      <span>{profile.leetcodeUsername}</span>
                    </a>
                  )}
                  {profile.linkedInUrl && (
                    <a href={formatExternalUrl(profile.linkedInUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-400 hover:opacity-80 transition-opacity">
                      <FaLinkedin className="w-3.5 h-3.5" />
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {profile.resumeDetails?.portfolioUrl && (
                    <a href={formatExternalUrl(profile.resumeDetails.portfolioUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-400 hover:opacity-80 transition-opacity">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Portfolio</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* 4-Column Clean Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 rounded-xl border border-gray-400 bg-background-200 divide-y md:divide-y-0 md:divide-x divide-gray-400 overflow-hidden shadow-2xs">
            <div className="p-5 flex flex-col justify-center">
              <div className="text-[11px] font-mono text-gray-700 uppercase tracking-wider">Problems Solved</div>
              <div className="text-2xl font-bold font-sans text-gray-1000 mt-1">
                {leetcode?.profile ? (
                  <>
                    <CountUp end={totalSolved} />
                    <span className="text-xs font-mono font-normal text-gray-600 ml-1">/{totalAvailable}</span>
                  </>
                ) : (
                  <span className="text-gray-500 font-mono text-base font-normal">—</span>
                )}
              </div>
            </div>

            <div className="p-5 flex flex-col justify-center">
              <div className="text-[11px] font-mono text-gray-700 uppercase tracking-wider">Public Repos</div>
              <div className="text-2xl font-bold font-sans text-gray-1000 mt-1">
                {github?.profile ? (
                  <CountUp end={github.profile.public_repos || 0} />
                ) : (
                  <span className="text-gray-500 font-mono text-base font-normal">—</span>
                )}
              </div>
            </div>

            <div className="p-5 flex flex-col justify-center">
              <div className="text-[11px] font-mono text-gray-700 uppercase tracking-wider">Global Rank</div>
              <div className="text-2xl font-bold font-sans text-gray-1000 mt-1">
                {leetcode?.profile?.ranking ? (
                  `#${leetcode.profile.ranking.toLocaleString()}`
                ) : (
                  <span className="text-gray-500 font-mono text-base font-normal">—</span>
                )}
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
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHeatmap('leetcode')}
                    className={`px-3 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeHeatmap === 'leetcode' ? 'bg-gray-200 text-gray-1000 font-medium' : 'text-gray-700 hover:text-gray-1000'
                    }`}
                  >
                    <span>LeetCode</span>
                  </button>
                </div>
              </div>

              <div className="w-full overflow-x-auto py-2 custom-scrollbar">
                <div className="min-w-[780px] flex justify-center py-2">
                  {activeHeatmap === 'github' ? (
                    githubHeatmap.length > 0 ? (
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
                    ) : (
                      <div className="py-10 text-xs text-gray-600 font-mono text-center flex flex-col items-center justify-center gap-2">
                        <FaGithub className="w-6 h-6 text-gray-500" />
                        <span className="font-semibold text-gray-900">No GitHub activity recorded</span>
                      </div>
                    )
                  ) : (
                    calendarData.length > 0 ? (
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
                      <div className="py-10 text-xs text-gray-600 font-mono text-center flex flex-col items-center justify-center gap-2">
                        <SiLeetcode className="w-6 h-6 text-[#ffa116]" />
                        <span className="font-semibold text-gray-900">No LeetCode activity recorded</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

          {/* Top Repositories & Resume Vault */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Repositories Preview */}
            <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                  <FaGithub className="text-sm" /> Top Repositories
                </h3>
              </div>

              {github?.repositories?.length > 0 ? (
                <div className="divide-y divide-gray-400 pt-1">
                  {github.repositories.slice(0, 3).map(repo => (
                    <div
                      key={repo.name}
                      className="py-3 flex items-center justify-between group px-2 rounded-md transition-colors"
                    >
                      <div className="min-w-0 pr-4">
                        <a href={repo.html_url || `https://github.com/${github.profile.login}/${repo.name}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-gray-1000 hover:underline truncate inline-flex items-center gap-1.5">
                          {repo.name}
                        </a>
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
                <div className="text-xs text-gray-600 font-mono py-6 text-center border border-dashed border-gray-400 rounded-lg">
                  No public repositories found.
                </div>
              )}
            </div>

            {/* Resume Vault Preview */}
            <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Resume Vault
                </h3>
              </div>

              {resumes && resumes.length > 0 ? (
                <div className="pt-2 flex flex-col gap-3">
                  <div 
                    onClick={() => setShowPdf(true)}
                    className="p-4 rounded-xl border border-gray-400 bg-background-100 flex flex-col items-center text-center cursor-pointer hover:border-gray-600 transition-colors group"
                  >
                    <FileText className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                    <span className="text-sm font-medium text-gray-1000 mb-1 group-hover:text-blue-600 transition-colors">
                      {resumes[0].name || 'Primary Resume'}
                    </span>
                    <span className="text-xs font-mono text-gray-600 mb-3">
                      Publicly available resume
                    </span>
                    <button
                      type="button"
                      className="px-4 py-1.5 bg-gray-1000 text-background-100 text-xs font-medium rounded-md hover:bg-gray-800 flex items-center gap-2 transition-colors pointer-events-none"
                    >
                      <FileText className="w-3 h-3" />
                      <span>View PDF</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-gray-600 font-mono border border-dashed border-gray-400 rounded-lg mt-2 flex flex-col items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  <span>No public resumes available.</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Experience */}
              {experience.length > 0 && (
                <section className="bg-background-200 border border-gray-400 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Briefcase className="w-4 h-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">Experience</h2>
                  </div>
                  <div className="space-y-5">
                    {experience.map((exp, i) => (
                      <div key={i} className="group flex gap-4">
                        <div className="w-10 h-10 rounded-lg bg-background-100 border border-gray-400 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4 text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-1000">{exp.role}</h3>
                          <div className="text-xs text-gray-600 font-mono mt-0.5">{exp.company}</div>
                          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-3 font-mono">
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {exp.duration}</span>
                            {exp.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {exp.location}</span>}
                          </div>
                          {exp.description && <p className="text-xs text-gray-700 mt-2.5 leading-relaxed">{exp.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <section className="bg-background-200 border border-gray-400 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <FolderGit2 className="w-4 h-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">Projects</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {projects.map((proj, i) => (
                      <div key={i} className="group relative isolate p-4 rounded-lg bg-background-100 border border-gray-400 flex flex-col h-full hover:border-gray-900 transition-colors overflow-hidden">
                        {/* Bottom Right Color Leak Effect & Fading Border Glow */}
                        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-400/15 blur-[40px] rounded-full pointer-events-none z-0 transition-all duration-500 group-hover:bg-indigo-500/30 group-hover:scale-125" />
                        
                        <div 
                          className="absolute inset-0 rounded-lg pointer-events-none z-20 transition-opacity duration-500 opacity-40 group-hover:opacity-100"
                          style={{
                            borderRight: '1.5px solid rgba(99, 102, 241, 0.6)',
                            borderBottom: '1.5px solid rgba(99, 102, 241, 0.6)',
                            WebkitMaskImage: 'radial-gradient(circle at bottom right, black 0%, transparent 80%)',
                            maskImage: 'radial-gradient(circle at bottom right, black 0%, transparent 80%)'
                          }}
                        />
                        
                        <div className="relative z-10 flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-medium text-gray-1000 leading-tight">{proj.title}</h3>
                          {proj.link && (
                            <a href={formatExternalUrl(proj.link)} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-gray-900 shrink-0">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-3 mb-4 flex-1">{proj.description}</p>
                        {proj.techStack && (
                          <div className="flex flex-wrap gap-1.5 mt-auto">
                            {proj.techStack.split(',').map((tech, ti) => (
                              <span key={ti} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-200 text-gray-700">{tech.trim()}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}


            </div>

            <div className="space-y-6">
              {/* Education */}
              {education.length > 0 && (
                <section className="bg-background-200 border border-gray-400 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <GraduationCap className="w-4 h-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">Education</h2>
                  </div>
                  <div className="space-y-4">
                    {education.map((edu, i) => (
                      <div key={i} className="relative pl-4 border-l-2 border-gray-300">
                        <div className="absolute w-2 h-2 rounded-full bg-gray-400 -left-[5px] top-1.5 border-2 border-background-200"></div>
                        <h3 className="text-sm font-medium text-gray-1000 leading-tight">{edu.institution}</h3>
                        <div className="text-xs text-gray-600 mt-1 font-mono">{edu.degree}</div>
                        <div className="text-[11px] text-gray-500 mt-1 flex justify-between font-mono">
                          <span>{edu.duration}</span>
                          {edu.score && <span className="font-medium text-emerald-600">Score: {edu.score}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Skills */}
              {profile.resumeDetails?.skills?.length > 0 && (
                <section className="bg-background-200 border border-gray-400 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Code2 className="w-4 h-4 text-gray-500" />
                    <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">Skills</h2>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.resumeDetails.skills.map((skill, i) => (
                      <span key={i} className="px-2 py-1 bg-background-100 border border-gray-300 rounded-md text-[11px] font-mono text-gray-800">
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          {/* Achievements & Certifications */}
          {(achievements.length > 0 || certificates.length > 0) && (
            <section className="bg-background-200 border border-gray-400 rounded-xl p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">Achievements & Certifications</h2>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.slice(0, isCertsExpanded ? achievements.length : 4).map((ach, i) => (
                  <div key={`ach-${i}`} className="flex gap-3.5 p-4 rounded-xl border border-gray-300 bg-background-100 shadow-sm transition-all hover:border-gray-400">
                    <div className="w-1.5 rounded-full bg-amber-500/50 shrink-0 mb-1 mt-1"></div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-1000">{ach.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{ach.description}</p>
                    </div>
                  </div>
                ))}
                {certificates.slice(0, isCertsExpanded ? certificates.length : (Math.max(0, 4 - achievements.length))).map((cert, i) => (
                  <div key={`cert-${i}`} className="flex flex-col sm:flex-row gap-3.5 p-4 rounded-xl border border-gray-300 bg-background-100 shadow-sm transition-all hover:border-gray-400">
                    <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 hidden sm:block" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{cert.title}</h3>
                      <div className="text-xs text-gray-600 font-mono mt-1 flex items-center gap-2">
                        <span className="truncate">{cert.issuer}</span>
                        {cert.issueDate && (
                          <>
                            <span>&bull;</span>
                            <span className="shrink-0">{cert.issueDate}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {cert.credentialUrl && (
                      <a href={formatExternalUrl(cert.credentialUrl)} target="_blank" rel="noreferrer" className="text-xs font-mono text-emerald-600 hover:bg-emerald-500/10 px-3 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1.5 sm:self-center whitespace-nowrap mt-3 sm:mt-0 border border-emerald-500/20">
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {(achievements.length + certificates.length > 4) && (
                <div className="mt-6 text-center border-t border-gray-300 pt-4">
                  <button 
                    onClick={() => setIsCertsExpanded(!isCertsExpanded)}
                    className="text-xs font-mono text-gray-600 hover:text-gray-1000 transition-colors inline-flex items-center gap-1"
                  >
                    {isCertsExpanded ? 'Show Less' : `Show ${achievements.length + certificates.length - 4} More`}
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </main>

      {/* PDF Viewer Modal */}
      {showPdf && resumes?.[0]?.fileUrl && (
        <PdfViewerModal 
          url={resumes[0].fileUrl} 
          title={resumes[0].name || 'Primary Resume'}
          onClose={() => setShowPdf(false)} 
        />
      )}
    </div>
  );
}
