import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import Prism from '../components/Prism';
import { ActivityCalendar } from 'react-activity-calendar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import PdfViewerModal from '../components/PdfViewerModal';
import RichContentRenderer from '../components/RichContentRenderer';
import { ProfileThemeProvider } from '../profile/ProfileThemeProvider';
import { AnimatedGridPattern } from '../components/backgrounds/animated-grid-pattern';
import { InteractiveGridPattern } from '../components/backgrounds/interactive-grid-pattern';
import { HexagonPattern } from '../components/backgrounds/hexagon-pattern';
import { StripedPattern } from '../components/backgrounds/striped-pattern';
import { NoiseTexture } from '../components/backgrounds/noise-texture';
import { LightRays } from '../components/backgrounds/light-rays';
import { GlyphMatrix } from '../components/backgrounds/glyph-matrix';
import ShapeWaves from '../components/ShapeWaves';
import { cn } from '../lib/utils';
import {
  ExternalLink,
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
  Calendar,
  MapPin,
  Building2,
  ChevronRight,
  ShieldCheck,
  Code2,
  Lock,
  Layers,
  Star,
  Download,
  AlertTriangle,
  FileText,
  Trophy,
  FileSpreadsheet,
  CheckCheck
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
              className="transition-transform duration-1000 ease-geist flex flex-col"
              style={{ transform: mounted ? `translateY(-${(d + 1)}em)` : 'translateY(0)' }}
            >
              <span className="opacity-0">0</span>
              {[...Array(10)].map((_, j) => (
                <span key={j} className="text-current">{j}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

export default function PublicProfile({ previewUid = null, previewCustomization = null, previewProfileData = null }) {
  const { uid: paramUid } = useParams();
  const uid = previewUid || paramUid;

  const [profile, setProfile] = useState(previewProfileData || null);
  const [loading, setLoading] = useState(!previewProfileData);
  const [error, setError] = useState(null);

  const { user } = useContext(AuthContext);
  const isAuthenticated = !!user;
  const { resolvedTheme } = useTheme();

  const [activeHeatmap, setActiveHeatmap] = useState('github');
  const [isCertsExpanded, setIsCertsExpanded] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

  const calendarTheme = {
    light: [
      'color-mix(in srgb, var(--profile-text) 10%, transparent)',
      'color-mix(in srgb, var(--profile-accent) 40%, transparent)',
      'color-mix(in srgb, var(--profile-accent) 60%, transparent)',
      'color-mix(in srgb, var(--profile-accent) 80%, transparent)',
      'var(--profile-accent)'
    ],
    dark: [
      'color-mix(in srgb, var(--profile-text) 10%, transparent)',
      'color-mix(in srgb, var(--profile-accent) 40%, transparent)',
      'color-mix(in srgb, var(--profile-accent) 60%, transparent)',
      'color-mix(in srgb, var(--profile-accent) 80%, transparent)',
      'var(--profile-accent)'
    ],
  };

  useEffect(() => {
    if (previewProfileData) {
      setProfile(previewProfileData);
      setLoading(false);
      return;
    }

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
  }, [uid, previewProfileData]);

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
          <ShieldCheck className="w-12 h-12 text-[var(--profile-muted-text)] mb-4" />
          <h1 className="text-xl font-semibold text-[var(--profile-text)] mb-2">{error || 'Profile not found'}</h1>
          <p className="text-sm text-[var(--profile-muted-text)] mb-6 font-mono">The requested student profile could not be loaded.</p>
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
  const about = profile.resumeDetails?.about || profile.about || profile.scrapedData?.linkedin?.about || '';

  const activeCustomization = previewCustomization || profile.profileCustomization || {};
  const privacy = activeCustomization.metricsPrivacy || {};
  const showLeetcodeAchievements = privacy.leetcodeAchievements === true;

  const hasSemesterRecords = profile.semesterRecords && profile.semesterRecords.length > 0;
  const sgpaChartData = hasSemesterRecords
    ? [...profile.semesterRecords].sort((a, b) => a.semester - b.semester).map(r => ({
      name: `Sem ${r.semester}`,
      sgpa: r.sgpa
    }))
    : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 rounded bg-[var(--profile-card-bg)] border border-[var(--profile-card-border)] shadow-md text-xs">
          <p className="font-semibold text-[var(--profile-text)]">{label}</p>
          <p className="text-[var(--profile-accent)]">SGPA: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const githubHeatmap = profile?.scrapedData?.githubHeatmap || [];
  const leetcode = profile?.scrapedData?.leetcode;

  // Compute Calendar Data
  const getCalendarData = () => {
    let raw = {};
    try {
      raw = JSON.parse(leetcode?.calendar?.submissionCalendar || "{}");
    } catch (e) { }

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

  const visibility = activeCustomization.visibility || {};

  // Determine which blocks in the top strip to show
  const showProblemsSolved = visibility.showLeetcode !== false && profile.leetcodeVerified;
  const showPublicRepos = visibility.showGithub !== false && profile.githubVerified;
  const showGlobalRank = visibility.showLeetcode !== false && privacy.leetcodeRank !== false && profile.leetcodeVerified;
  const showCgpa = privacy.cgpa === true;

  const showMetricsStrip = showProblemsSolved || showPublicRepos || showGlobalRank || showCgpa;

  // Compute Layout Columns
  const hasExperience = visibility.showExperience !== false && experience.length > 0;
  const hasProjects = visibility.showProjects !== false && projects.length > 0;
  const hasLeftColumn = hasExperience || hasProjects;

  const hasEducation = visibility.showEducation !== false && education.length > 0;
  const hasSkills = profile.resumeDetails?.skills?.length > 0;
  const hasRightColumn = hasEducation || hasSkills;

  return (
    <ProfileThemeProvider customization={activeCustomization}>
      <div className={`flex min-h-screen bg-[var(--profile-bg)] text-[var(--profile-text)] selection:bg-[var(--profile-accent)] selection:text-[var(--profile-bg)] ${isAuthenticated && !previewUid ? 'flex-col md:flex-row' : ''}`}>
        {isAuthenticated && !previewUid && <Sidebar />}
        <main className="flex-1 min-w-0 bg-transparent relative isolate">
          <div className="profile-pattern-overlay" />
          <div className="relative z-10">
            {!previewUid && (
              <Topbar showSearch={isAuthenticated} defaultSearchQuery={profile?.name || ''} />
            )}

            <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8 pb-20">
              {/* Profile Header */}
              <section className="profile-card relative overflow-hidden mt-4">
                {/* Banner Texture Layer */}
                {activeCustomization.appearance?.texture && activeCustomization.appearance.texture !== 'none' && (
                  <div className="absolute inset-0 z-0 h-40 opacity-100 pointer-events-auto">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--profile-card-bg)] z-10 pointer-events-none" />
                    {activeCustomization.appearance.texture === 'animated-grid' && <AnimatedGridPattern width={40} height={40} className="[mask-image:linear-gradient(to_right,transparent_10%,white_80%)] stroke-[color-mix(in_srgb,var(--profile-accent)_30%,transparent)] fill-[color-mix(in_srgb,var(--profile-accent)_30%,transparent)]" />}
                    {activeCustomization.appearance.texture === 'interactive-grid' && (
                      <InteractiveGridPattern
                        squares={[60, 60]}
                        className={cn(
                          "[mask-image:linear-gradient(to_right,transparent_20%,white_80%)]",
                          "inset-x-[-20%] inset-y-[-100%] h-[300%] w-[150%] skew-y-12",
                          "stroke-[color-mix(in_srgb,var(--profile-accent)_20%,transparent)]"
                        )}
                        squaresClassName=""
                      />
                    )}
                    {activeCustomization.appearance.texture === 'hexagon' && (
                      <HexagonPattern
                        radius={30}
                        style={{
                          stroke: 'var(--profile-accent)',
                          strokeOpacity: 0.2,
                          fill: 'var(--profile-accent)',
                          fillOpacity: 0.8
                        }}
                        hexagons={[
                          [10, 2], [11, 4], [13, 3], [14, 5], [16, 2], [17, 4], [19, 3],
                          [21, 2], [23, 4], [25, 3], [27, 2], [29, 4], [31, 3], [33, 2]
                        ]}
                        className={cn(
                          "[mask-image:linear-gradient(to_right,transparent_10%,white_90%)]",
                          "inset-x-[-10%] inset-y-[-100%] h-[300%] w-[120%] skew-y-6"
                        )}
                      />
                    )}
                    {activeCustomization.appearance.texture === 'striped' && (
                      <StripedPattern className="[mask-image:linear-gradient(to_right,transparent_10%,white_80%)] stroke-[color-mix(in_srgb,var(--profile-accent)_20%,transparent)]" />
                    )}
                    {activeCustomization.appearance.texture === 'light-rays' && (
                      <LightRays
                        color="var(--profile-accent)"
                        className="[mask-image:linear-gradient(to_right,transparent_10%,white_40%,white_70%,transparent)]"
                      />
                    )}
                    {activeCustomization.appearance.texture === 'noise' && (
                      <NoiseTexture noiseOpacity={1.0} className="opacity-100 dark:opacity-100" />
                    )}
                    {activeCustomization.appearance.texture === 'glyph-matrix' && (
                      <GlyphMatrix
                        glyphs="01·•+*/\<>="
                        cellSize={14}
                        mutationRate={0.04}
                        interval={90}
                        fadeBottom={0.6}
                        color="var(--profile-accent)"
                        className="opacity-100 [mask-image:linear-gradient(to_right,transparent_5%,white_60%)]"
                      />
                    )}
                    {activeCustomization.appearance.texture === 'shape-waves' && (
                      <div
                        className="absolute inset-0 w-full h-full relative"
                        style={{
                          maskImage: 'linear-gradient(to right, transparent 0%, transparent 15%, black 40%, black 100%)',
                          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, transparent 15%, black 40%, black 100%)'
                        }}
                      >
                        <ShapeWaves
                          fontFamily='Geist, "Geist Sans", system-ui, sans-serif'
                          fontWeight={500}
                          textSize={0.45}
                          textOffsetX={120}
                          shapes="mixed"
                          cellSize={10}
                          dotSize={0.75}
                          color="#929292"
                          hoverColor="#ffffff"
                          backgroundColor="#000000"
                          speed={1}
                          scale={1}
                          contrast={1}
                          brightness={0.4}
                          flow={0}
                          direction={0}
                          fade={0.25}
                          interactive={true}
                          splashRadius={40}
                          splashStrength={0.4}
                          glow={0.35}
                          intro={true}
                          introDuration={1.6}
                          paused={false}
                        />
                      </div>
                    )}
                    {activeCustomization.appearance.texture === '3d-prism' && (
                      <div className="absolute inset-y-0 right-0 w-1/2">
                        <Prism />
                      </div>
                    )}
                  </div>
                )}

                <div className="p-6 relative z-10 space-y-6 pointer-events-none">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                    <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-800 border-2 border-[var(--profile-card-border)] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs relative z-20 pointer-events-auto">
                      {profile.avatarUrl ? (
                        <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-semibold text-[var(--profile-muted-text)] text-xl font-mono">
                          {profile.name?.slice(0, 2).toUpperCase() || 'ST'}
                        </span>
                      )}
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-0 pt-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <h1 className="text-xl font-semibold text-[var(--profile-text)] tracking-tight">{profile.name}</h1>
                        {profile.uid && (
                          <span className="px-2 py-0.5 rounded-full bg-[var(--profile-card-bg)] border border-[var(--profile-card-border)] text-[10px] font-mono text-[var(--profile-muted-text)]">
                            {profile.uid}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--profile-muted-text)] font-sans pointer-events-auto">
                        {education.length > 0 ? `${education[0].degree} · ${education[0].institution}` : 'Campus Connect Student'}
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-3 pointer-events-auto">
                        {profile.githubUsername && profile.githubVerified && (
                          <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-[var(--profile-card-bg)] border border-[var(--profile-card-border)] text-[var(--profile-muted-text)] hover:text-[var(--profile-accent)] hover:border-[var(--profile-accent)] transition-colors">
                            <FaGithub className="w-3.5 h-3.5" />
                            <span>{profile.githubUsername}</span>
                          </a>
                        )}
                        {profile.leetcodeUsername && profile.leetcodeVerified && (
                          <a href={`https://leetcode.com/${profile.leetcodeUsername}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-[var(--profile-card-bg)] border border-[var(--profile-card-border)] text-[var(--profile-muted-text)] hover:text-[var(--profile-accent)] hover:border-[var(--profile-accent)] transition-colors">
                            <SiLeetcode className="w-3.5 h-3.5" />
                            <span>{profile.leetcodeUsername}</span>
                          </a>
                        )}
                        {profile.linkedInUrl && (
                          <a href={formatExternalUrl(profile.linkedInUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-[var(--profile-card-bg)] border border-[var(--profile-card-border)] text-[var(--profile-muted-text)] hover:text-[var(--profile-accent)] hover:border-[var(--profile-accent)] transition-colors">
                            <FaLinkedin className="w-3.5 h-3.5" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {profile.resumeDetails?.portfolioUrl && (
                          <a href={formatExternalUrl(profile.resumeDetails.portfolioUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-md bg-[var(--profile-card-bg)] border border-[var(--profile-card-border)] text-[var(--profile-muted-text)] hover:text-[var(--profile-accent)] hover:border-[var(--profile-accent)] transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Portfolio</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* 4-Column Clean Metrics Strip */}
              {showMetricsStrip && (
                <div className="flex flex-wrap profile-card divide-y md:divide-y-0 md:divide-x divide-[var(--profile-card-border)] overflow-hidden">
                  {showProblemsSolved && (
                    <div className="flex-1 min-w-[50%] md:min-w-0 p-5 flex flex-col justify-center">
                      <div className="text-[11px] font-mono text-[var(--profile-muted-text)] uppercase tracking-wider">Problems Solved</div>
                      <div className="text-2xl font-bold font-sans text-[var(--profile-text)] mt-1">
                        {leetcode?.profile ? (
                          <>
                            <CountUp end={totalSolved} />
                            <span className="text-xs font-mono font-normal text-[var(--profile-muted-text)] ml-1">/{totalAvailable}</span>
                          </>
                        ) : (
                          <span className="text-[var(--profile-muted-text)] font-mono text-base font-normal">—</span>
                        )}
                      </div>
                    </div>
                  )}

                  {showPublicRepos && (
                    <div className="flex-1 min-w-[50%] md:min-w-0 p-5 flex flex-col justify-center">
                      <div className="text-[11px] font-mono text-[var(--profile-muted-text)] uppercase tracking-wider">Public Repos</div>
                      <div className="text-2xl font-bold font-sans text-[var(--profile-text)] mt-1">
                        {github?.profile && privacy.githubTotalStars !== false ? (
                          <CountUp end={github.profile.public_repos || 0} />
                        ) : (
                          <span className="text-[var(--profile-muted-text)] font-mono text-base font-normal">—</span>
                        )}
                      </div>
                    </div>
                  )}

                  {showGlobalRank && (
                    <div className="flex-1 min-w-[50%] md:min-w-0 p-5 flex flex-col justify-center">
                      <div className="text-[11px] font-mono text-[var(--profile-muted-text)] uppercase tracking-wider">LeetCode Global Rank</div>
                      <div className="text-2xl font-bold font-sans text-[var(--profile-text)] mt-1">
                        {leetcode?.profile?.ranking ? (
                          <div className="flex items-center">
                            <span className="mr-0.5">#</span>
                            <CountUp end={leetcode.profile.ranking} />
                          </div>
                        ) : (
                          <span className="text-[var(--profile-muted-text)] font-mono text-base font-normal">—</span>
                        )}
                      </div>
                    </div>
                  )}

                  {showCgpa && (
                    <div className="flex-1 min-w-[50%] md:min-w-0 p-5 flex flex-col justify-center">
                      <div className="text-[11px] font-mono text-[var(--profile-muted-text)] uppercase tracking-wider">Academic CGPA</div>
                      <div className="text-2xl font-bold font-sans text-[var(--profile-accent)] mt-1 flex items-baseline">
                        {studentCgpa ? (
                          <>
                            {!isNaN(Number(studentCgpa)) ? (
                              <CountUp end={Number(studentCgpa)} decimals={2} />
                            ) : (
                              <span>{studentCgpa}</span>
                            )}
                            {!String(studentCgpa).includes('/') && !isNaN(Number(studentCgpa)) && (
                              <span className="text-xs font-mono font-normal text-[var(--profile-muted-text)] ml-1.5">/ 10.0</span>
                            )}
                          </>
                        ) : (
                          <span className="text-[var(--profile-muted-text)] font-mono text-base font-normal">—</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* About Me Section */}
              {visibility.showAbout !== false && about && (
                <div className="profile-card p-6 space-y-3">
                  <h2 className="text-sm font-semibold text-[var(--profile-text)] tracking-tight">About Me</h2>
                  <RichContentRenderer htmlContent={about} className="text-[var(--profile-muted-text)]" />
                </div>
              )}

              {/* SGPA Progression Chart */}
              {hasSemesterRecords && visibility.showAcademicProgression !== false && (
                <div className="profile-card p-6 flex flex-col min-h-[280px]">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--profile-text)] tracking-tight">Academic Progression</h3>
                      <p className="text-xs text-[var(--profile-muted-text)] mt-1 font-sans">Semester-wise Grade Point Average</p>
                    </div>
                    {(() => {
                      const avgSgpa = sgpaChartData.reduce((s, d) => s + d.sgpa, 0) / sgpaChartData.length;
                      const pct = avgSgpa < 7 ? (7.1 * avgSgpa + 12).toFixed(1) : (7.4 * avgSgpa + 12).toFixed(1);
                      return (
                        <div className="text-right">
                          <div className="text-xl font-bold text-[var(--profile-accent)] font-sans">{avgSgpa.toFixed(2)}</div>
                          <div className="text-[10px] font-mono text-[var(--profile-muted-text)]">Avg CGPA · ≈{pct}%</div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="w-full" style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={sgpaChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--profile-border)" opacity={0.5} />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: 'var(--profile-muted-text)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
                          dy={10}
                        />
                        <YAxis
                          domain={[0, 10]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: 'var(--profile-muted-text)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
                          dx={-10}
                        />
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: 'var(--profile-bg)',
                            borderColor: 'var(--profile-border)',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: 'var(--profile-text)'
                          }}
                          itemStyle={{ color: 'var(--profile-accent)', fontWeight: 600 }}
                          cursor={{ stroke: 'var(--profile-border)', strokeWidth: 1, strokeDasharray: '3 3' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sgpa"
                          name="SGPA"
                          stroke="var(--profile-accent)"
                          strokeWidth={2}
                          dot={{ r: 4, fill: 'var(--profile-bg)', stroke: 'var(--profile-accent)', strokeWidth: 2 }}
                          activeDot={{ r: 6, fill: 'var(--profile-accent)', stroke: 'var(--profile-bg)', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Activity Heatmap Card */}
              {((privacy.githubHeatmap !== false && profile.githubVerified) || (privacy.leetcodeHeatmap !== false && profile.leetcodeVerified)) && (
                <div className="profile-card p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-[var(--profile-text)] tracking-tight">Verified Activity Stream</h2>
                      <p className="text-xs text-[var(--profile-muted-text)] font-mono mt-0.5">Commits and coding problem submissions across the last 365 days</p>
                    </div>

                    <div className="inline-flex p-0.5 rounded-lg bg-[var(--profile-card-bg)] border border-[var(--profile-card-border)] self-start sm:self-auto">
                      {privacy.githubHeatmap !== false && profile.githubVerified && (
                        <button
                          type="button"
                          onClick={() => setActiveHeatmap('github')}
                          className={`px-3 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${activeHeatmap === 'github' ? 'bg-[var(--profile-text)] text-[var(--profile-bg)] font-medium' : 'text-[var(--profile-muted-text)] hover:text-[var(--profile-text)]'
                            }`}
                        >
                          <span>GitHub</span>
                        </button>
                      )}
                      {privacy.leetcodeHeatmap !== false && profile.leetcodeVerified && (
                        <button
                          type="button"
                          onClick={() => setActiveHeatmap('leetcode')}
                          className={`px-3 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${activeHeatmap === 'leetcode' || privacy.githubHeatmap === false ? 'bg-[var(--profile-text)] text-[var(--profile-bg)] font-medium' : 'text-[var(--profile-muted-text)] hover:text-[var(--profile-text)]'
                            }`}
                        >
                          <span>LeetCode</span>
                        </button>
                      )}
                    </div>
                  </div>

              <div className="w-full overflow-x-auto py-2 custom-scrollbar">
                  {(activeHeatmap === 'github' && privacy.githubHeatmap !== false) || (privacy.leetcodeHeatmap === false) ? (
                    githubHeatmap.length > 0 ? (
                      <div className="min-w-[780px] w-max mx-auto flex justify-center py-2">
                      <ActivityCalendar
                        data={githubHeatmap}
                        colorScheme="light"
                        theme={calendarTheme}
                        blockSize={11}
                        blockMargin={3}
                        fontSize={11}
                        showWeekdayLabels
                        labels={{ totalCount: '{{count}} contributions in the past year' }}
                      />
                      </div>
                    ) : (
                      <div className="py-10 text-xs text-[var(--profile-muted-text)] font-mono text-center flex flex-col items-center justify-center gap-2">
                        <FaGithub className="w-6 h-6 text-[var(--profile-muted-text)]" />
                        <span className="font-semibold text-[var(--profile-text)]">No GitHub activity recorded</span>
                      </div>
                    )
                  ) : (
                    calendarData.length > 0 ? (
                      <div className="min-w-[780px] w-max mx-auto flex justify-center py-2">
                      <ActivityCalendar
                        data={calendarData}
                        colorScheme="light"
                        theme={calendarTheme}
                        blockSize={11}
                        blockMargin={3}
                        fontSize={11}
                        showWeekdayLabels
                        labels={{ totalCount: '{{count}} submissions in the past year' }}
                      />
                      </div>
                    ) : (
                      <div className="py-10 text-xs text-[var(--profile-muted-text)] font-mono text-center flex flex-col items-center justify-center gap-2">
                        <SiLeetcode className="w-6 h-6 text-[#ffa116]" />
                        <span className="font-semibold text-[var(--profile-text)]">No LeetCode activity recorded</span>
                      </div>
                    )
                  )}
              </div>
            </div>
          )}

              {/* Top Repositories & Resume Vault */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Repositories Preview */}
                {visibility.showGithub !== false && profile.githubVerified && (
                  <div className="profile-card p-6 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--profile-muted-text)] flex items-center gap-2">
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
                              <a href={repo.html_url || `https://github.com/${github.profile.login}/${repo.name}`} target="_blank" rel="noreferrer" className="text-xs font-medium text-[var(--profile-text)] hover:underline truncate inline-flex items-center gap-1.5">
                                {repo.name}
                              </a>
                              <p className="text-[11px] text-[var(--profile-muted-text)] truncate mt-0.5">
                                {repo.description || 'No description'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-mono text-[var(--profile-muted-text)] shrink-0">
                              {repo.language && (
                                <span className="text-[11px] text-[var(--profile-muted-text)]">{repo.language}</span>
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
                      <div className="text-xs text-[var(--profile-muted-text)] font-mono py-6 text-center border border-dashed border-gray-400 rounded-lg">
                        No public repositories found.
                      </div>
                    )}
                  </div>
                )}

                {/* Resume Vault Preview */}
                <div className="profile-card p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--profile-muted-text)] flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" /> Resume Vault
                    </h3>
                  </div>

                  {resumes && resumes.length > 0 ? (
                    <div className="pt-2 flex flex-col gap-3">
                      <div
                        onClick={() => setShowPdf(true)}
                        className="p-4 rounded-xl border border-[var(--profile-card-border)] bg-[var(--profile-bg)] flex flex-col items-center text-center cursor-pointer hover:border-[var(--profile-text)] transition-colors group"
                      >
                        <FileText className="w-8 h-8 text-blue-500 mb-2 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                        <span className="text-sm font-medium text-[var(--profile-text)] mb-1 group-hover:text-blue-600 transition-colors">
                          {resumes[0].name || 'Primary Resume'}
                        </span>
                        <span className="text-xs font-mono text-[var(--profile-muted-text)] mb-3">
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
                    <div className="py-6 text-center text-xs text-[var(--profile-muted-text)] font-mono border border-dashed border-gray-400 rounded-lg mt-2 flex flex-col items-center gap-2">
                      <Lock className="w-4 h-4 text-[var(--profile-muted-text)]" />
                      <span>No public resumes available.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* LeetCode Achievements (Badges, Contest Rating, etc) */}
              {privacy.leetcodeAchievements !== false && leetcode?.profile && profile.leetcodeVerified && (
                <div className="profile-card p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--profile-card-border)] pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--profile-card-bg)] border border-[var(--profile-card-border)] flex items-center justify-center shrink-0">
                        <SiLeetcode className="w-4 h-4 text-[#ffa116]" />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold text-[var(--profile-text)] tracking-tight">LeetCode Achievements</h2>
                        <p className="text-xs text-[var(--profile-muted-text)] font-mono mt-0.5">Badges, contest ratings, and algorithmic topics</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
                      <span className="px-2.5 py-1 rounded-md bg-[var(--profile-bg)] border border-[var(--profile-card-border)] text-[var(--profile-text)] font-medium flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        {leetcode?.contest?.rating > 0 ? `Rating: ${Math.round(leetcode.contest.rating)}` : 'Unranked'}
                      </span>

                      {leetcode?.contest?.topPercentage > 0 && (
                        <span className="px-2.5 py-1 rounded-md bg-[var(--profile-bg)] border border-[var(--profile-card-border)] text-[var(--profile-text)] font-medium">
                          Top {leetcode.contest.topPercentage}%
                        </span>
                      )}

                      <span className="px-2.5 py-1 rounded-md bg-[var(--profile-bg)] border border-[var(--profile-card-border)] text-[var(--profile-text)] font-medium flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {leetcode?.profile?.reputation || 0} Rep
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--profile-muted-text)] mb-3">Earned Badges</h3>
                    {leetcode?.badges?.length > 0 ? (
                      <div className="flex flex-wrap gap-4">
                        {leetcode.badges.map((b, i) => (
                          <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-lg border border-[var(--profile-card-border)] bg-[var(--profile-bg)] min-w-[80px] hover:border-[var(--profile-accent)] transition-colors">
                            <img src={b.icon.startsWith('/') ? `https://leetcode.com${b.icon}` : b.icon} alt={b.displayName} className="w-10 h-10 object-contain drop-shadow-sm" />
                            <span className="text-[10px] font-mono text-[var(--profile-muted-text)] text-center max-w-[100px] leading-tight">{b.displayName}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-[var(--profile-muted-text)] font-mono py-4 border border-dashed border-[var(--profile-card-border)] rounded-lg text-center bg-[var(--profile-bg)]/50">
                        No badges earned yet.
                      </div>
                    )}
                  </div>

                  {(leetcode?.skills?.fundamental?.length > 0 || leetcode?.skills?.intermediate?.length > 0) && (
                    <div className="pt-2">
                      <h3 className="text-xs font-mono uppercase tracking-wider text-[var(--profile-muted-text)] mb-3">Top Algorithmic Topics</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {[...(leetcode.skills?.fundamental || []), ...(leetcode.skills?.intermediate || [])]
                          .slice(0, 8)
                          .map((topic, i) => (
                            <span key={i} className="px-2 py-1 rounded-md bg-[var(--profile-bg)] border border-[var(--profile-card-border)] text-[11px] font-mono text-[var(--profile-text)]">
                              {topic.tagName} ({topic.problemsSolved})
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(hasLeftColumn || hasRightColumn) && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {hasLeftColumn && (
                    <div className={`space-y-6 ${hasRightColumn ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                      {/* Experience */}
                      {hasExperience && (
                        <section className="profile-card p-6">
                          <div className="flex items-center gap-2 mb-5">
                            <Briefcase className="w-4 h-4 text-[var(--profile-muted-text)]" />
                            <h2 className="text-sm font-semibold text-[var(--profile-text)] tracking-tight">Experience</h2>
                          </div>
                          <div className="space-y-5">
                            {experience.map((exp, i) => (
                              <div key={i} className="group flex gap-4">
                                <div className="w-10 h-10 rounded-lg bg-[var(--profile-card-bg)] border border-[var(--profile-card-border)] flex items-center justify-center shrink-0">
                                  <Building2 className="w-4 h-4 text-[var(--profile-muted-text)]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-medium text-[var(--profile-text)]">{exp.role}</h3>
                                  <div className="text-xs text-[var(--profile-muted-text)] font-mono mt-0.5">{exp.company}</div>
                                  <div className="text-[11px] text-[var(--profile-muted-text)] mt-1 flex items-center gap-3 font-mono">
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {exp.duration}</span>
                                    {exp.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {exp.location}</span>}
                                  </div>
                                  {exp.description && <p className="text-xs text-[var(--profile-muted-text)] mt-2.5 leading-relaxed">{exp.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Projects */}
                      {hasProjects && (
                        <section className="profile-card p-6">
                          <div className="flex items-center gap-2 mb-5">
                            <FolderGit2 className="w-4 h-4 text-[var(--profile-muted-text)]" />
                            <h2 className="text-sm font-semibold text-[var(--profile-text)] tracking-tight">Projects</h2>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {projects.map((proj, i) => (
                              <div key={i} className="group relative isolate p-4 rounded-lg bg-[var(--profile-card-bg)] border border-[var(--profile-card-border)] flex flex-col h-full hover:border-[var(--profile-accent)] transition-colors overflow-hidden">

                                <div className="relative z-10 flex items-start justify-between gap-2 mb-2">
                                  <h3 className="text-sm font-medium text-[var(--profile-text)] leading-tight">{proj.title}</h3>
                                  {proj.link && (
                                    <a href={formatExternalUrl(proj.link)} target="_blank" rel="noreferrer" className="text-[var(--profile-muted-text)] hover:text-[var(--profile-text)] shrink-0">
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                                <p className="text-xs text-[var(--profile-muted-text)] line-clamp-3 mb-4 flex-1">{proj.description}</p>
                                {proj.techStack && (
                                  <div className="flex flex-wrap gap-1.5 mt-auto">
                                    {proj.techStack.split(',').map((tech, ti) => (
                                      <span key={ti} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--profile-bg)] border border-[var(--profile-card-border)] text-[var(--profile-muted-text)]">{tech.trim()}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}


                    </div>
                  )}

                  {hasRightColumn && (
                    <div className={`space-y-6 ${hasLeftColumn ? 'lg:col-span-1' : 'lg:col-span-3'}`}>
                      {/* Education */}
                      {hasEducation && (
                        <section className="profile-card p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <GraduationCap className="w-4 h-4 text-[var(--profile-muted-text)]" />
                            <h2 className="text-sm font-semibold text-[var(--profile-text)] tracking-tight">Education</h2>
                          </div>
                          <div className="relative border-l-2 border-[var(--profile-card-border)] ml-1.5 space-y-6 py-1">
                            {education.map((edu, i) => (
                              <div key={i} className="relative pl-4">
                                <div className="absolute w-2 h-2 rounded-full bg-[var(--profile-muted-text)] -left-[5px] top-1.5 ring-4 ring-[var(--profile-card-bg)]"></div>
                                <h3 className="text-sm font-medium text-[var(--profile-text)] leading-tight">{edu.institution}</h3>
                                <div className="text-xs text-[var(--profile-muted-text)] mt-1 font-mono">{edu.degree}</div>
                                <div className="text-[11px] text-[var(--profile-muted-text)] mt-1 flex justify-between font-mono">
                                  <span>{edu.duration}</span>
                                  {edu.score && <span className="font-medium text-emerald-600">Score: {edu.score}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Skills */}
                      {hasSkills && (
                        <section className="profile-card p-5">
                          <div className="flex items-center gap-2 mb-4">
                            <Code2 className="w-4 h-4 text-[var(--profile-muted-text)]" />
                            <h2 className="text-sm font-semibold text-[var(--profile-text)] tracking-tight">Skills</h2>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {profile.resumeDetails.skills.map((skill, i) => (
                              <span key={i} className="px-2 py-1 bg-[var(--profile-bg)] border border-[var(--profile-card-border)] rounded-md text-[11px] font-mono text-[var(--profile-text)]">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Placement Assessments */}
              {profile.assessments && profile.assessments.length > 0 && (
                <section className="profile-card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <FileSpreadsheet className="w-4 h-4 text-[var(--profile-muted-text)]" />
                    <h2 className="text-sm font-semibold text-[var(--profile-text)] tracking-tight">Placement Assessments</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.assessments.map((assessment, i) => (
                      <div key={`assessment-${i}`} className="flex gap-3.5 p-4 rounded-xl border border-[var(--profile-card-border)] bg-[var(--profile-bg)] shadow-sm transition-all hover:border-[var(--profile-text)] items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-[var(--profile-card-bg)] border border-[var(--profile-card-border)] flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                          </div>
                          <h3 className="text-sm font-medium text-[var(--profile-text)] truncate max-w-[200px]" title={assessment.title}>{assessment.title}</h3>
                        </div>
                        <a href={assessment.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-mono text-emerald-600 hover:bg-emerald-500/10 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 border border-emerald-500/20 whitespace-nowrap">
                          Download <Download className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Achievements & Certifications */}
              {visibility.showCertificates !== false && (achievements.length > 0 || certificates.length > 0) && (
                <section className="profile-card p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-[var(--profile-muted-text)]" />
                      <h2 className="text-sm font-semibold text-[var(--profile-text)] tracking-tight">Achievements & Certifications</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.slice(0, isCertsExpanded ? achievements.length : 4).map((ach, i) => (
                      <div key={`ach-${i}`} className="flex gap-3.5 p-4 rounded-xl border border-[var(--profile-card-border)] bg-[var(--profile-bg)] shadow-sm transition-all hover:border-[var(--profile-text)]">
                        <div className="w-1.5 rounded-full bg-amber-500/50 shrink-0 mb-1 mt-1"></div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-[var(--profile-text)]">{ach.title}</h3>
                          <p className="text-xs text-[var(--profile-muted-text)] mt-1">{ach.description}</p>
                        </div>
                      </div>
                    ))}
                    {certificates.slice(0, isCertsExpanded ? certificates.length : (Math.max(0, 4 - achievements.length))).map((cert, i) => (
                      <div key={`cert-${i}`} className="flex flex-col sm:flex-row gap-3.5 p-4 rounded-xl border border-[var(--profile-card-border)] bg-[var(--profile-bg)] shadow-sm transition-all hover:border-[var(--profile-text)]">
                        <Award className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5 hidden sm:block" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-[var(--profile-text)] truncate">{cert.title}</h3>
                          <div className="text-xs text-[var(--profile-muted-text)] font-mono mt-1 flex items-center gap-2">
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
                        className="text-xs font-mono text-[var(--profile-muted-text)] hover:text-[var(--profile-text)] transition-colors inline-flex items-center gap-1"
                      >
                        {isCertsExpanded ? 'Show Less' : `Show ${achievements.length + certificates.length - 4} More`}
                      </button>
                    </div>
                  )}
                </section>
              )}
            </div>
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
    </ProfileThemeProvider>
  );
}
