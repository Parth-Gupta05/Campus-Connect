import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { ActivityCalendar } from 'react-activity-calendar';
import { fromUnixTime, format, subDays } from 'date-fns';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import { FiArrowLeft, FiLoader } from 'react-icons/fi';
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
  if (!repo) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-ambient border border-border-light overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border-light flex justify-between items-start bg-surface-container-lowest">
          <div>
            <h2 className="text-headline-md font-bold text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">book</span>
              {repo.name}
            </h2>
            <p className="text-body-md text-on-surface-variant">{repo.description || 'No description provided.'}</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 bg-surface-container-high rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div className="p-4 bg-surface-container-low flex flex-wrap gap-4 text-sm text-on-surface-variant border-b border-border-light">
          <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">code</span>{repo.language || 'Unknown'}</div>
          <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">star</span>{repo.stargazers_count || 0} Stars</div>
          <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">fork_right</span>{repo.forks_count || 0} Forks</div>
          <a href={repo.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline ml-auto">
            View on GitHub <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-surface">
          <h3 className="text-label-lg font-bold text-on-surface mb-4 uppercase tracking-wider">README.md</h3>
          {repo.readme ? (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none font-body-md text-on-surface">
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
            <div className="text-center py-12 text-on-surface-variant flex flex-col items-center gap-3 bg-surface-container-lowest rounded-xl border border-border-light">
               <span className="material-symbols-outlined text-[32px]">draft</span>
               <p>No README.md found for this repository.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const formatExternalUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

export default function AdminStudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  const [activeHeatmap, setActiveHeatmap] = useState('github');
  const [githubHeatmap, setGithubHeatmap] = useState(null);
  const [heatmapLoading, setHeatmapLoading] = useState(false);
  const [heatmapError, setHeatmapError] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('Resume PDF');
  const [animMounted, setAnimMounted] = useState(false);
  const speedometerRef = useRef(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        const res = await axios.get(`/admin/students/${id}`);
        setData(res.data.data);
      } catch (err) {
        console.error('Error fetching student details:', err);
        showToast('Failed to load student profile', 'error');
        navigate('/admin/students');
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [id, navigate, showToast]);

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
  }, [loading]);

  const profile = data?.user || {};
  const effectiveGithubUsername = profile?.githubUsername || data?.github?.profile?.login || '';
  
  useEffect(() => {
    if (activeHeatmap === 'github' && effectiveGithubUsername && !githubHeatmap && !heatmapLoading && !loading) {
      setHeatmapLoading(true);
      axios.get(`/user/github-heatmap?username=${encodeURIComponent(effectiveGithubUsername)}`)
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
  }, [activeHeatmap, effectiveGithubUsername, loading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const activeWrapper = document.querySelector('.heatmap-wrapper.active');
      if (!activeWrapper) return;
      const weeks = activeWrapper.querySelectorAll('g:not([class*="legend"])');
      weeks.forEach((week, i) => {
        const activeRects = week.querySelectorAll('rect[data-level]:not([data-level="0"])');
        activeRects.forEach(rect => {
          rect.classList.remove('animate-dot-pop');
          void rect.offsetWidth; 
          rect.style.animationDelay = `${i * 0.02}s`;
          rect.classList.add('animate-dot-pop');
        });
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [activeHeatmap, profile, loading]);

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center animate-pulse gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-on-surface-variant font-bold text-sm uppercase tracking-widest">Aggregating Profile Data...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const user = data.user || {};
  const github = data.github || (user.scrapedData?.github ? {
    profile: user.scrapedData.github.profile,
    repositories: user.scrapedData.github.repositories || []
  } : null);
  
  if (data.github && !data.github.profile) {
    data.github.profile = user.scrapedData?.github?.profile;
  }

  const leetcode = data.leetcode || (user.scrapedData?.leetcode ? {
    username: user.leetcodeUsername,
    profile: user.scrapedData.leetcode.profile,
    solved: user.scrapedData.leetcode.profile,
    badges: user.scrapedData.leetcode.badges,
    contest: user.scrapedData.leetcode.contest,
    calendar: user.scrapedData.leetcode.calendar
  } : null);

  const linkedinData = data.linkedin || user.scrapedData?.linkedin;
  const resumes = Array.isArray(data.resumes) ? data.resumes : [];
  const placements = Array.isArray(data.placements) ? data.placements : [];
  
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

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background text-on-surface font-body-lg">
      <style>{`
        .animate-dot-pop { animation: heatUp 0.8s ease-out both; }
        @keyframes heatUp {
          0% { fill: #ebedf0; filter: blur(3px); opacity: 0.7; }
          100% { filter: blur(0); opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-light px-8 py-5 shrink-0 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/students" className="p-2 rounded-xl bg-surface-variant text-on-surface-variant hover:bg-primary hover:text-on-primary transition-colors">
            <FiArrowLeft className="text-xl" />
          </Link>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Student Details</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <RepoModal repo={selectedRepo} onClose={() => setSelectedRepo(null)} />
        {selectedPdfUrl && (
          <PdfViewerModal 
            url={selectedPdfUrl} 
            title={selectedPdfTitle} 
            onClose={() => setSelectedPdfUrl(null)} 
          />
        )}
        
        <div className="max-w-7xl mx-auto space-y-8 pb-16">
          
          {/* Profile Header Section */}
          <section className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-surface-container-lowest p-6 rounded-2xl border border-border-light shadow-sm">
            <div className="w-32 h-32 rounded-full bg-primary-container flex items-center justify-center shadow-ambient shrink-0 border-4 border-surface-container-lowest overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[64px] text-on-primary-container">person</span>
              )}
            </div>
            <div className="flex-1 text-center md:text-left pt-2">
              <h1 className="font-display-hero text-headline-lg text-on-surface">{user.name}</h1>
              <p className="font-body-md text-body-lg text-on-surface-variant mb-4">{user.email}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {user.resumeDetails?.portfolioUrl && (
                  <a href={user.resumeDetails.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors">
                    <span className="material-symbols-outlined text-[18px]">language</span> Portfolio
                  </a>
                )}
                {(user.resumeUrl || resumes[0]?.fileUrl) && (
                  <button 
                    type="button"
                    onClick={() => {
                      const url = user.resumeUrl || resumes[0]?.fileUrl;
                      setSelectedPdfUrl(url);
                      setSelectedPdfTitle(resumes[0]?.fileName || `${user.name || 'Student'}'s Resume`);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">visibility</span> Resume
                  </button>
                )}
                {effectiveGithubUsername && (
                  <a href={`https://github.com/${effectiveGithubUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors border bg-green-50 border-green-200 hover:bg-green-100 text-green-800">
                    <FaGithub className="text-[18px]" /> GitHub
                  </a>
                )}
                {user.leetcodeUsername && (
                  <a href={`https://leetcode.com/u/${user.leetcodeUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors border bg-green-50 border-green-200 hover:bg-green-100 text-green-800">
                    <SiLeetcode className="text-[18px]" /> LeetCode
                  </a>
                )}
                {user.linkedInUrl && (
                  <a href={user.linkedInUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors">
                    <FaLinkedin className="text-[18px]" /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* Activity Heatmap Toggle Section */}
          <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient flex flex-col items-center overflow-hidden w-full">
            <div className="flex justify-between w-full items-center mb-6">
              <h3 className="font-headline-md text-headline-sm text-on-surface">Activity Heatmap</h3>
              <div className="flex bg-surface-container-low rounded-lg p-1 border border-border-light">
                <button 
                  onClick={() => setActiveHeatmap('github')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeHeatmap === 'github' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  GitHub
                </button>
                <button 
                  onClick={() => setActiveHeatmap('leetcode')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeHeatmap === 'leetcode' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'}`}
                >
                  LeetCode
                </button>
              </div>
            </div>
            
            <div className="w-full max-w-full overflow-x-auto pb-4 custom-scrollbar">
              <div className="min-w-[800px] min-h-[180px] relative w-full">
                {/* GitHub Heatmap */}
                <div className={`heatmap-wrapper absolute top-0 left-0 w-full flex justify-center transition-opacity duration-300 ${activeHeatmap === 'github' ? 'opacity-100 z-10 active' : 'opacity-0 z-0 pointer-events-none'}`}>
                  {effectiveGithubUsername ? (
                    heatmapLoading ? (
                      <div className="animate-pulse py-8 text-on-surface-variant">Loading contributions...</div>
                    ) : heatmapError || !githubHeatmap ? (
                      <div className="text-error py-8">Failed to fetch GitHub activity.</div>
                    ) : githubHeatmap.length === 0 ? (
                       <div className="text-on-surface-variant py-8">No GitHub activity found.</div>
                    ) : (
                      <ActivityCalendar 
                        data={githubHeatmap} 
                        colorScheme="light"
                        theme={{
                          light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39']
                        }}
                        labels={{
                          totalCount: `{{count}} contributions in the last year`,
                        }}
                      />
                    )
                  ) : (
                    <div className="text-on-surface-variant py-8">GitHub profile not linked.</div>
                  )}
                </div>

                {/* LeetCode Heatmap */}
                <div className={`heatmap-wrapper absolute top-0 left-0 w-full flex justify-center transition-opacity duration-300 ${activeHeatmap === 'leetcode' ? 'opacity-100 z-10 active' : 'opacity-0 z-0 pointer-events-none'}`}>
                  {leetcode ? (
                    <ActivityCalendar 
                      data={calendarData} 
                      colorScheme="light"
                      theme={{
                        light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
                        dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
                      }}
                      labels={{
                        totalCount: `{{count}} submissions in the last year`,
                      }}
                    />
                  ) : (
                    <div className="text-on-surface-variant py-8">LeetCode profile not linked.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* GitHub Platform Section */}
          <section className="flex flex-col gap-6">
            <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
              <FaGithub className="text-primary text-[28px]" /> GitHub Profile
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
              {/* GitHub Stats Card */}
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient flex flex-col gap-6">
                {github ? (
                  <>
                    <div className="flex items-center gap-4">
                      {github.profile?.avatar_url ? (
                        <img src={github.profile.avatar_url} alt="GitHub Avatar" className="w-16 h-16 rounded-full border-2 border-border-light shadow-sm" />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center"><FaGithub className="text-[32px] text-on-surface-variant" /></div>
                      )}
                      <div>
                        <h3 className="font-headline-sm font-bold text-on-surface">{github.profile?.name || github.profile?.login || user.githubUsername}</h3>
                        <a href={github.profile?.html_url} target="_blank" rel="noreferrer" className="text-sm text-on-surface-variant hover:text-primary transition-colors">@{github.profile?.login || user.githubUsername}</a>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white p-3 rounded-xl border border-border-light shadow-sm flex flex-col justify-center">
                        <div className="text-headline-sm font-black text-primary">
                          <CountUp end={github.profile?.public_repos || 0} />
                        </div>
                        <div className="text-[10px] uppercase font-bold text-on-surface-variant mt-1 tracking-wider">Repos</div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-border-light shadow-sm flex flex-col justify-center">
                        <div className="text-headline-sm font-black text-primary">
                          <CountUp end={github.profile?.followers || 0} />
                        </div>
                        <div className="text-[10px] uppercase font-bold text-on-surface-variant mt-1 tracking-wider">Followers</div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-border-light shadow-sm flex flex-col justify-center">
                        <div className="text-headline-sm font-black text-primary">
                          <CountUp end={github.profile?.following || 0} />
                        </div>
                        <div className="text-[10px] uppercase font-bold text-on-surface-variant mt-1 tracking-wider">Following</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-on-surface-variant text-center py-8">No GitHub data available.</div>
                )}
              </div>

              {/* GitHub Top Repos */}
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient flex flex-col gap-4">
                <h3 className="font-headline-sm text-on-surface font-bold">Top Repositories</h3>
                {github?.repositories?.length > 0 ? (
                  <div className="space-y-3">
                    {github.repositories.slice(0, 3).map(repo => (
                      <div 
                        key={repo.name} 
                        onClick={() => setSelectedRepo(repo)}
                        className="flex justify-between items-start p-4 border border-border-light rounded-xl bg-white hover:border-primary hover:shadow-md cursor-pointer transition-all group"
                      >
                        <div className="flex-1 min-w-0 pr-4">
                          <span className="text-body-md font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-1.5 mb-1">
                            {repo.name}
                          </span>
                          <p className="text-sm text-on-surface-variant line-clamp-2">{repo.description || 'No description provided.'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {repo.language && <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-bold rounded-md">{repo.language}</span>}
                          <span className="flex items-center gap-1 text-xs text-text-slate font-medium"><span className="material-symbols-outlined text-[14px]">star</span>{repo.stargazers_count || 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-on-surface-variant text-center py-8">No repositories found.</div>
                )}
              </div>
            </div>
          </section>

          {/* LeetCode Platform Section */}
          <section className="flex flex-col gap-6">
            <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
              <SiLeetcode className="text-primary text-[28px]" /> LeetCode Progress
            </h2>
            
            {leetcode ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LeetCode Stats */}
                <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient grid grid-cols-2 gap-4 lg:col-span-2">
                  <div className="flex flex-col justify-center p-4 bg-bg-subtle rounded-lg border border-border-light text-center">
                    <div className="text-label-caps text-on-surface-variant mb-1">Global Rank</div>
                    <div className="text-headline-md font-bold text-primary">
                      <CountUp end={leetcode.profile?.ranking || 0} />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-4 bg-bg-subtle rounded-lg border border-border-light text-center">
                    <div className="text-label-caps text-on-surface-variant mb-1">Contest Rating</div>
                    <div className="text-headline-md font-bold text-primary">
                      <CountUp end={Math.round(leetcode.contest?.contestRating || 0)} />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-4 bg-bg-subtle rounded-lg border border-border-light text-center">
                    <div className="text-label-caps text-on-surface-variant mb-1">Badges</div>
                    <div className="text-headline-md font-bold text-primary">
                      <CountUp end={leetcode.badges?.badgesCount || 0} />
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-4 bg-bg-subtle rounded-lg border border-border-light text-center">
                    <div className="text-label-caps text-on-surface-variant mb-1">Total Solved</div>
                    <div className="text-headline-md font-bold text-primary">
                      <CountUp end={leetcode.solved?.solvedProblem || (leetcode.profile?.totalSolved) || 0} />
                    </div>
                  </div>
                </div>

                {/* LeetCode Problems Solved (Progress) */}
                <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient flex flex-col justify-center items-center">
                  {(() => {
                    const easySolved = leetcode.solved?.easySolved || leetcode.profile?.easySolved || 0;
                    const mediumSolved = leetcode.solved?.mediumSolved || leetcode.profile?.mediumSolved || 0;
                    const hardSolved = leetcode.solved?.hardSolved || leetcode.profile?.hardSolved || 0;
                    
                    const totalEasy = leetcode.solved?.totalEasy || leetcode.profile?.totalEasy || 0;
                    const totalMedium = leetcode.solved?.totalMedium || leetcode.profile?.totalMedium || 0;
                    const totalHard = leetcode.solved?.totalHard || leetcode.profile?.totalHard || 0;
                    
                    const totalSolved = easySolved + mediumSolved + hardSolved;
                    const totalAvailable = (totalEasy + totalMedium + totalHard) || 4013;
                    
                    const radius = 40;
                    const circumference = 2 * Math.PI * radius;
                    const V = circumference * 0.75; // 270 degrees visible
                    const gap = 3;
                    
                    const easyBase = totalAvailable > 0 ? (totalEasy / totalAvailable) * (V - 2 * gap) : 0;
                    const medBase = totalAvailable > 0 ? (totalMedium / totalAvailable) * (V - 2 * gap) : 0;
                    const hardBase = totalAvailable > 0 ? (totalHard / totalAvailable) * (V - 2 * gap) : 0;
                    
                    const easyProg = totalEasy > 0 ? (easySolved / totalEasy) * easyBase : 0;
                    const medProg = totalMedium > 0 ? (mediumSolved / totalMedium) * medBase : 0;
                    const hardProg = totalHard > 0 ? (hardSolved / totalHard) * hardBase : 0;

                    return (
                      <div className="flex flex-col items-center gap-6 justify-center w-full">
                        <div className="relative w-36 h-36 shrink-0 mt-2" ref={speedometerRef}>
                          <svg viewBox="0 0 100 100" className="w-full h-full transform rotate-[135deg] drop-shadow-sm">
                            {easyBase > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#2cbb5d33" strokeWidth="4" strokeDasharray={`${Math.max(0, easyBase)} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" />}
                            {medBase > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#ffc01e33" strokeWidth="4" strokeDasharray={`${Math.max(0, medBase)} ${circumference}`} strokeDashoffset={-(easyBase + gap)} strokeLinecap="round" />}
                            {hardBase > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#ef474333" strokeWidth="4" strokeDasharray={`${Math.max(0, hardBase)} ${circumference}`} strokeDashoffset={-(easyBase + gap + medBase + gap)} strokeLinecap="round" />}
                            
                            {easyProg > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#2cbb5d" strokeWidth="4" strokeDasharray={`${animMounted ? Math.max(0, easyProg) : 0} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" className="transition-all duration-1000 ease-out" />}
                            {medProg > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#ffc01e" strokeWidth="4" strokeDasharray={`${animMounted ? Math.max(0, medProg) : 0} ${circumference}`} strokeDashoffset={-(easyBase + gap)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />}
                            {hardProg > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#ef4743" strokeWidth="4" strokeDasharray={`${animMounted ? Math.max(0, hardProg) : 0} ${circumference}`} strokeDashoffset={-(easyBase + gap + medBase + gap)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />}
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center mt-[-10px]">
                            <div className="flex items-baseline">
                              <span className="text-3xl font-bold text-on-surface"><CountUp end={totalSolved} /></span>
                              <span className="text-xs text-on-surface-variant font-medium ml-0.5">/${totalAvailable}</span>
                            </div>
                            <div className="flex items-center text-xs text-on-surface-variant font-medium mt-1">
                              <span className="text-[#2cbb5d] mr-1 text-sm leading-none">✓</span> Solved
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full grid grid-cols-3 gap-2 text-center text-xs border-t border-border-light pt-4">
                          <div>
                            <div className="text-[#2cbb5d] font-bold">Easy</div>
                            <div className="text-on-surface font-medium">${easySolved} <span className="text-on-surface-variant">/${totalEasy}</span></div>
                          </div>
                          <div>
                            <div className="text-[#ffc01e] font-bold">Med</div>
                            <div className="text-on-surface font-medium">${mediumSolved} <span className="text-on-surface-variant">/${totalMedium}</span></div>
                          </div>
                          <div>
                            <div className="text-[#ef4743] font-bold">Hard</div>
                            <div className="text-on-surface font-medium">${hardSolved} <span className="text-on-surface-variant">/${totalHard}</span></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient text-center py-12 text-on-surface-variant">
                No LeetCode data available.
              </div>
            )}
          </section>

          {/* LinkedIn Network Profile */}
          {linkedinData && (
            <section className="bg-surface-container-lowest rounded-2xl p-6 border border-border-light shadow-sm">
              <div className="flex items-center gap-3 border-b border-surface-variant pb-4 mb-4">
                <FaLinkedin className="text-[#0A66C2] text-[28px]" />
                <h2 className="font-headline-md text-headline-sm text-on-surface">LinkedIn Overview</h2>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h3 className="font-headline-sm font-bold text-on-surface mb-2">
                    {linkedinData.firstName} {linkedinData.lastName}
                  </h3>
                  <p className="text-body-md text-on-surface-variant mb-4">{linkedinData.headline}</p>
                  {linkedinData.about && (
                    <div className="bg-surface-container-low p-4 rounded-xl border border-border-light">
                      <h4 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">About</h4>
                      <p className="text-sm text-text-slate whitespace-pre-line">
                        {linkedinData.about}
                      </p>
                    </div>
                  )}
                </div>
                
                {linkedinData.certifications?.length > 0 && (
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-label-caps text-label-caps uppercase text-on-surface-variant">Top Certifications</h4>
                    </div>
                    <div className="space-y-3">
                      {linkedinData.certifications.slice(0, 3).map((cert, i) => (
                        <div key={i} className="bg-surface-container-low p-3 rounded-xl border border-border-light flex flex-col">
                          <span className="font-bold text-on-surface text-sm truncate">{cert.title}</span>
                          <span className="text-xs text-on-surface-variant">{cert.issuedBy}</span>
                          {cert.link && (
                            <a href={formatExternalUrl(cert.link)} target="_blank" rel="noreferrer" className="text-[10px] text-primary mt-1 hover:underline truncate">
                              View Credential
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Quick Stats Grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="material-symbols-outlined text-primary mb-2">psychology</span>
              <div>
                <div className="font-headline-md text-headline-md text-on-surface">{skills.length}</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Skills</div>
              </div>
            </div>
            <div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="material-symbols-outlined text-secondary-container mb-2">work</span>
              <div>
                <div className="font-headline-md text-headline-md text-on-surface">{experience.length}</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Experiences</div>
              </div>
            </div>
            <div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="material-symbols-outlined text-tertiary-container mb-2">rocket_launch</span>
              <div>
                <div className="font-headline-md text-headline-md text-on-surface">{projects.length}</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Projects</div>
              </div>
            </div>
            <div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between">
              <span className="material-symbols-outlined text-surface-tint mb-2">school</span>
              <div>
                <div className="font-headline-md text-headline-md text-on-surface">{education.length}</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Degrees</div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-8">
              <section className="bg-white border border-border-light rounded-xl p-6 shadow-md relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-transparent opacity-50 pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Skills</h2>
                </div>
                <div className="flex flex-wrap gap-2 relative z-10">
                  {skills.length > 0 ? skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-surface-container text-primary rounded-full text-sm font-medium border border-border-light">{skill}</span>
                  )) : (
                    <p className="text-on-surface-variant text-sm">No skills added.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-8">
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Experience History</h2>
                </div>
                {experience.length > 0 ? (
                  <div className="relative border-l-2 border-border-light ml-3 space-y-8">
                    {experience.map((exp, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute w-4 h-4 bg-primary rounded-full -left-[9px] top-1 ring-4 ring-white shadow-sm"></div>
                        <h3 className="font-body-lg text-body-lg font-bold text-on-surface">{exp.role}</h3>
                        <p className="text-on-surface-variant font-medium text-sm mb-2">{exp.company} • {exp.startDate} - {exp.endDate || 'Present'}</p>
                        <p className="text-text-slate text-sm leading-relaxed">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-container-low border border-border-light border-dashed rounded-xl p-8 text-center text-on-surface-variant">
                    No experience history.
                  </div>
                )}
              </section>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Projects</h2>
                </div>
                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="bg-surface-container-low border border-border-light rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col h-full">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-on-surface">{proj.title}</h3>
                          {proj.link && (
                            <a href={formatExternalUrl(proj.link)} target="_blank" rel="noreferrer" className="text-primary hover:bg-primary-container p-1 rounded transition-colors" title="View Project">
                              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-text-slate line-clamp-3">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-container-low border border-border-light border-dashed rounded-xl p-8 text-center text-on-surface-variant">
                    No projects added.
                  </div>
                )}
              </section>

              <section className="mt-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-primary">award_star</span> Achievements</h2>
                </div>
                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((ach, idx) => (
                      <div key={idx} className="bg-surface border border-border-light rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer">
                        {ach.imageUrl && (
                          <img src={ach.imageUrl} alt={ach.title} className="w-full h-40 object-contain bg-surface-container" />
                        )}
                        <div className="p-5 flex flex-col flex-1">
                          <h3 className="font-bold text-on-surface mb-1">{ach.title}</h3>
                          <span className="text-[10px] text-text-slate mb-3 uppercase tracking-wider">{ach.date ? new Date(ach.date).toLocaleDateString() : 'N/A'}</span>
                          <p className="text-sm text-on-surface-variant line-clamp-3 mt-auto">{ach.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-container-low border border-border-light border-dashed rounded-xl p-8 text-center text-on-surface-variant">
                    No achievements yet.
                  </div>
                )}
              </section>

              {/* Shared Experiences & Placements */}
              <section className="mt-10 pt-8 border-t border-border-light">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">military_tech</span>
                      {user.name ? `${user.name}'s Posts` : "Placement Experiences"}
                    </h2>
                  </div>
                </div>

                {placements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {placements.map((post) => (
                      <div
                        key={post._id}
                        className="bg-surface-container-lowest border border-border-light hover:border-primary/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-surface-container-low border border-border-light p-1 flex items-center justify-center shrink-0">
                                {post.company?.logoUrl ? (
                                  <img src={post.company.logoUrl} alt={post.company.name} className="w-full h-full object-contain" />
                                ) : (
                                  <span className="font-bold text-xs text-primary">{(post.company?.name || 'C').charAt(0)}</span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-on-surface">{post.company?.name}</h3>
                                <span className="text-xs text-on-surface-variant font-medium">{post.role}</span>
                              </div>
                            </div>

                            {post.outcome === 'selected' && (
                              <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-700 font-bold text-[10px]">
                                Selected
                              </span>
                            )}
                          </div>

                          <Link to={`/placements/${post._id}`} className="block group">
                            <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2 mt-2">
                              {post.title}
                            </h4>
                          </Link>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-4 border-t border-border-light/60 text-xs text-on-surface-variant">
                          <span className="font-mono text-[11px]">
                            {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                          </span>

                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 font-mono text-[11px]">
                              💬 {post.commentCount || 0}
                            </span>
                            <Link
                              to={`/placements/${post._id}`}
                              className="text-primary font-bold hover:underline"
                            >
                              View →
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-container-low border border-border-light border-dashed rounded-2xl p-8 text-center text-on-surface-variant space-y-2">
                    <p className="text-sm font-semibold">No placement experiences shared.</p>
                  </div>
                )}
              </section>
              
              {/* Other Information from Admin View */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10 border-t border-border-light pt-8">
                {/* Job Applications */}
                <section>
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">work_history</span> Applications
                  </h2>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {data.applications && data.applications.length > 0 ? data.applications.map((app) => (
                      <div key={app._id} className="bg-surface-container-lowest border border-border-light p-4 rounded-xl hover:border-primary/40 transition-colors">
                        <h4 className="font-bold text-sm text-on-surface line-clamp-1">{app.opportunityId?.title || 'Unknown Role'}</h4>
                        <p className="text-xs text-on-surface-variant mt-1 flex justify-between items-center">
                          <span className="truncate pr-2">{app.opportunityId?.company || 'Unknown Company'}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${app.status === 'applied' ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'}`}>{app.status || 'Applied'}</span>
                        </p>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-on-surface-variant text-xs bg-surface-container-low rounded-xl border border-dashed border-border-light">No job applications yet.</div>
                    )}
                  </div>
                </section>

                {/* Resumes */}
                <section>
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">description</span> Resumes
                  </h2>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                    {resumes.length > 0 ? resumes.map((resume) => (
                      <button 
                        key={resume._id} 
                        type="button"
                        onClick={() => {
                          setSelectedPdfUrl(resume.fileUrl);
                          setSelectedPdfTitle(resume.fileName || `${user.name || 'Student'}'s Resume`);
                        }}
                        className="w-full text-left block bg-surface-container-lowest border border-border-light p-4 rounded-xl hover:bg-primary/5 hover:border-primary transition-all cursor-pointer group shadow-sm hover:shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-on-surface line-clamp-1 flex-1 pr-4 group-hover:text-primary transition-colors">
                            {resume.fileName || 'Resume Document'}
                          </span>
                          <span className="material-symbols-outlined text-primary text-[20px]">visibility</span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-2">Uploaded {new Date(resume.createdAt).toLocaleDateString()}</p>
                      </button>
                    )) : (
                      <div className="text-center py-8 text-on-surface-variant text-xs bg-surface-container-low rounded-xl border border-dashed border-border-light">No resumes uploaded.</div>
                    )}
                  </div>
                </section>
                
                {/* Campus Engagement */}
                <section className="lg:col-span-2">
                  <h2 className="font-headline-md text-headline-md text-on-surface mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">groups</span> Campus Engagement
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-container-lowest p-6 rounded-2xl border border-border-light shadow-sm">
                    {/* Clubs */}
                    <div>
                      <h4 className="text-xs font-bold text-on-surface uppercase mb-3 text-primary border-b border-border-light pb-2">Associated Clubs</h4>
                      <div className="space-y-3">
                        {data.clubs && data.clubs.length > 0 ? data.clubs.map(club => (
                          <div key={club?._id || Math.random()} className="flex items-center gap-3">
                            <img src={club?.profilePhoto || `https://ui-avatars.com/api/?name=${club?.name || 'Club'}&background=random`} alt="" className="w-8 h-8 rounded bg-surface-container object-cover" />
                            <div>
                              <p className="text-sm font-bold text-on-surface">{club?.name || 'Unknown Club'}</p>
                              <p className="text-[10px] text-on-surface-variant uppercase">Member</p>
                            </div>
                          </div>
                        )) : <p className="text-xs text-on-surface-variant">No club memberships.</p>}
                      </div>
                    </div>

                    {/* Events */}
                    <div>
                      <h4 className="text-xs font-bold text-on-surface uppercase mb-3 text-primary border-b border-border-light pb-2">Events Attended</h4>
                      <div className="space-y-3">
                        {data.events && data.events.length > 0 ? data.events.map(ev => (
                          <div key={ev?._id || Math.random()} className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-on-surface-variant mt-0.5 text-[16px]">event</span>
                            <div>
                              <p className="text-sm font-bold text-on-surface line-clamp-1">{ev?.title || 'Unknown Event'}</p>
                              <p className="text-[10px] text-on-surface-variant">{ev?.date ? new Date(ev.date).toLocaleDateString() : 'Unknown Date'}</p>
                            </div>
                          </div>
                        )) : <p className="text-xs text-on-surface-variant">No events attended.</p>}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
          </div>
        </div>
      </main>
    </div>
  );
}
