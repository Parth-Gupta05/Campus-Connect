import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { ActivityCalendar } from 'react-activity-calendar';
import { fromUnixTime, format, formatDistanceToNow, subDays, parseISO } from 'date-fns';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import { FiLoader } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

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
              className="flex flex-col transition-transform duration-[1500ms] ease-[cubic-bezier(0.2,1,0.3,1)]"
              style={{ 
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

export default function StudentDashboard() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeHeatmap, setActiveHeatmap] = useState('github');
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [animMounted, setAnimMounted] = useState(false);

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
  }, []);
  
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
        const [profileRes, eventsRes] = await Promise.all([
          axios.get('/user/profile'),
          axios.get('/events/student/registered')
        ]);
        setProfile(profileRes.data);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const futureEvents = eventsRes.data
          .filter(ev => new Date(ev.date) >= today)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
          
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
    if (activeHeatmap === 'github' && profile?.githubUsername && !githubHeatmap && !heatmapLoading) {
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
  }, [activeHeatmap, profile?.githubUsername]);

  const handleRefreshMetrics = async () => {
    setRefreshing(true);
    try {
      const res = await axios.post('/user/refresh-metrics');
      setProfile(res.data.user);
      showToast('Metrics refreshed successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to refresh metrics', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Add sweeping animation delay to heatmap dots
  useEffect(() => {
    // Small delay to allow React to mount/unhide the active wrapper
    const timer = setTimeout(() => {
      const activeWrapper = document.querySelector('.heatmap-wrapper.active');
      if (!activeWrapper) return;
      
      // Select all <g> tags that DO NOT have a class starting with 'legend'
      const weeks = activeWrapper.querySelectorAll('g:not([class*="legend"])');
      weeks.forEach((week, i) => {
        // Only select squares that have activity (data-level > 0)
        const activeRects = week.querySelectorAll('rect[data-level]:not([data-level="0"])');
        activeRects.forEach(rect => {
          // Restart CSS animation by removing class, forcing reflow, and re-adding
          rect.classList.remove('animate-dot-pop');
          void rect.offsetWidth; // trigger reflow
          rect.style.animationDelay = `${i * 0.02}s`;
          rect.classList.add('animate-dot-pop');
        });
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [activeHeatmap, profile]);

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

  const dynamicGreeting = React.useMemo(() => {
    const hour = new Date().getHours();
    let timeBased = 'Good Evening';
    if (hour < 12) timeBased = 'Good Morning';
    else if (hour < 17) timeBased = 'Good Afternoon';
    
    const greetings = [
      timeBased,
      'Systems Online',
      'Welcome to the Grid',
      'Workspace Initialized',
      'Ready to Build',
      'Session Active',
      'Developer Mode: ON'
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
        <Sidebar />
        <main className="flex-1 relative">
          {/* Skeleton Header */}
          <div className="hidden md:flex bg-white/80 border-b border-border-light h-20 w-full"></div>
          
          <div className="pt-8 pb-16 px-gutter max-w-container-max mx-auto w-full space-y-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
              <div className="space-y-4 w-full lg:w-1/2">
                <div className="h-12 w-3/4 skeleton-box delay-100"></div>
                <div className="h-6 w-1/2 skeleton-box delay-200"></div>
                <div className="h-10 w-40 skeleton-box delay-300 mt-4"></div>
              </div>
              <div className="w-full lg:w-80 h-32 skeleton-box delay-400"></div>
            </div>
            <div className="w-full h-80 skeleton-box delay-500"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="h-24 skeleton-box delay-500"></div>
              <div className="h-24 skeleton-box delay-500"></div>
              <div className="h-24 skeleton-box delay-500"></div>
              <div className="h-24 skeleton-box delay-500"></div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const education = profile?.resumeDetails?.education || [];
  const github = profile?.scrapedData?.github;
  const leetcode = profile?.scrapedData?.leetcode;

  // Calculate profile strength to show a CTA if needed
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

  // Helper for Calendar
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
    // 365 days
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

  // Calculate 30-minute refresh cooldown (Temporarily disabled for testing)
  const THIRTY_MINUTES_MS = 0; // 30 * 60 * 1000;
  const timeSinceLastScrape = profile?.lastScrapedAt ? Date.now() - new Date(profile.lastScrapedAt).getTime() : Infinity;
  const isCooldownActive = timeSinceLastScrape < THIRTY_MINUTES_MS;
  const remainingMinutes = isCooldownActive ? Math.ceil((THIRTY_MINUTES_MS - timeSinceLastScrape) / 60000) : 0;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      <style>{`
        .animate-dot-pop {
          animation: heatUp 0.8s ease-out both;
        }
        @keyframes heatUp {
          0% { fill: #ebedf0; filter: blur(3px); opacity: 0.7; }
          100% { filter: blur(0); opacity: 1; }
        }
      `}</style>
      <header className="md:hidden bg-white/80 backdrop-blur-xl border-b border-border-light shadow-sm flex justify-between items-center px-gutter h-20 z-40 sticky top-0 w-full">
        <span className="font-headline-md text-headline-md font-bold text-on-surface">Campus Connect</span>
        <div className="flex gap-4">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">menu</span>
        </div>
      </header>

      <Sidebar />
      <RepoModal repo={selectedRepo} onClose={() => setSelectedRepo(null)} />

      <main className="flex-1">
        <Topbar showSearch={true} />

        <div className="p-gutter md:p-8 max-w-container-max mx-auto space-y-8">
          
          {/* Dashboard Header */}
          <section className="flex flex-col lg:flex-row gap-8 items-start justify-between">
            <div>
              <h1 className="font-display-hero-mobile md:font-display-hero text-display-hero-mobile md:text-display-hero text-on-surface mb-2">
                {dynamicGreeting}, {profile?.name?.split(' ')[0] || 'Student'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-on-surface-variant font-body-lg text-body-lg">
                {education.length > 0 ? (
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-primary">school</span> {education[0].institution}</span>
                ) : (
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-primary">school</span> University Student</span>
                )}
                <span className="w-1 h-1 rounded-full bg-border-light"></span>
              </div>
              {profile?.lastScrapedAt && (
                <div className="mt-2 text-xs text-text-slate flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">update</span> 
                  Data Last Refreshed: {new Date(profile.lastScrapedAt).toLocaleString()}
                </div>
              )}
              
              <div className="mt-6 flex gap-4">
                <button 
                  onClick={handleRefreshMetrics} 
                  disabled={refreshing || isCooldownActive} 
                  className={`px-6 py-3 rounded-lg font-button-text text-button-text transition-colors duration-200 shadow-sm flex items-center gap-2 ${
                    isCooldownActive 
                      ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed opacity-70 border border-border-light'
                      : 'bg-primary text-on-primary hover:bg-on-primary-fixed disabled:opacity-50'
                  }`}
                  title={isCooldownActive ? `Please wait ${remainingMinutes} minutes before refreshing again` : ''}
                >
                  {refreshing ? <FiLoader className="animate-spin text-sm" /> : <span className="material-symbols-outlined text-sm">{isCooldownActive ? 'timer' : 'sync'}</span>} 
                  {isCooldownActive ? `Cooldown (${remainingMinutes}m)` : 'Refresh Live Metrics'}
                </button>
              </div>
            </div>

            {/* Profile CTA if incomplete */}
            {profileStrength < 100 && (
              <div className="bg-secondary-container text-on-secondary-container border border-border-light rounded-xl p-6 shadow-md w-full lg:w-80 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined">warning</span>
                  <h3 className="font-label-caps text-label-caps uppercase">Action Required</h3>
                </div>
                <p className="font-body-md mb-3 text-sm">Your portfolio is only {profileStrength}% complete. Update your resume to unlock more opportunities.</p>
                {missingSections.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {missingSections.map(section => (
                      <span key={section} className="text-[10px] font-bold bg-white/20 text-on-secondary-container px-2 py-0.5 rounded border border-white/20">
                        {section}
                      </span>
                    ))}
                  </div>
                )}
                <a href="/profile" className="inline-block bg-on-secondary-container text-secondary-container px-4 py-2 rounded font-button-text text-sm">Go to Profile</a>
              </div>
            )}
          </section>

          {/* Pending Achievements Inbox */}
          {profile?.pendingAchievements?.length > 0 && (
            <section className="bg-primary-container text-on-primary-container rounded-xl p-6 shadow-md border border-primary/20 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary">award_star</span>
                <h3 className="font-headline-sm font-bold">New Achievements Found</h3>
                <span className="bg-primary text-on-primary text-xs px-2 py-1 rounded-full font-bold ml-2">{profile.pendingAchievements.length} Pending</span>
              </div>
              <p className="text-sm mb-6 text-on-primary-container/80">We extracted these achievements from your recent LinkedIn activity. Approve them to add them to your public portfolio.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.pendingAchievements.map((ach, idx) => (
                  <div key={idx} className="bg-surface text-on-surface rounded-lg p-4 border border-border-light flex flex-col gap-3">
                    {ach.imageUrl && (
                      <img src={ach.imageUrl} alt="Achievement" className="w-full h-32 object-contain bg-surface-container rounded-md" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm mb-1 line-clamp-1">{ach.title}</h4>
                      <p className="text-xs text-on-surface-variant line-clamp-2">{ach.description}</p>
                      <span className="text-[10px] text-text-slate mt-2 block">{formatDistanceToNow(new Date(ach.date), { addSuffix: true })}</span>
                    </div>
                    <div className="flex gap-2 mt-auto pt-2 border-t border-border-light">
                      <button onClick={() => handleApproveAchievement(ach.title)} className="flex-1 bg-primary text-on-primary py-1.5 rounded text-xs font-bold transition-colors hover:bg-primary/90">Approve</button>
                      <button onClick={() => handleDiscardAchievement(ach.title)} className="flex-1 bg-surface-container-high text-on-surface hover:text-error py-1.5 rounded text-xs font-bold transition-colors">Discard</button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Club Events */}
          {upcomingEvents.length > 0 && (
            <section className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient flex flex-col w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-headline-md text-headline-sm text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">event</span> Upcoming Club Events
                </h3>
                <Link to="/clubs" className="text-primary hover:underline text-sm font-medium">View All Clubs</Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {upcomingEvents.map(ev => (
                  <div key={ev._id} className="bg-surface-variant p-4 rounded-xl border border-border-light flex flex-col h-full hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/clubs/${ev.clubId._id}`)}>
                    <h4 className="font-bold text-label-lg mb-1">{ev.title}</h4>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mb-2">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {new Date(ev.date).toLocaleDateString()} at {ev.time}
                    </p>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mb-3">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {ev.venue}
                    </p>
                    <div className="mt-auto flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-surface overflow-hidden">
                        {ev.clubId.profilePhoto ? (
                          <img src={ev.clubId.profilePhoto} alt={ev.clubId.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant mt-1 ml-1">groups</span>
                        )}
                      </div>
                      <span className="text-xs font-medium text-on-surface">{ev.clubId.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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
                  {profile?.githubUsername ? (
                    heatmapLoading ? (
                      <div className="animate-pulse">
                        <ActivityCalendar 
                          data={generateDummyHeatmap()} 
                          colorScheme="light"
                          theme={{
                            light: ['#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1', '#cbd5e1']
                          }}
                          labels={{
                            totalCount: `Loading contributions...`,
                          }}
                        />
                      </div>
                    ) : heatmapError || !githubHeatmap ? (
                      <div className="text-error py-8">Failed to fetch GitHub activity. GitHub API might be unreachable.</div>
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
                        <h3 className="font-headline-sm font-bold text-on-surface">{github.profile?.name || github.profile?.login}</h3>
                        <a href={github.profile?.html_url} target="_blank" rel="noreferrer" className="text-sm text-on-surface-variant hover:text-primary transition-colors">@{github.profile?.login}</a>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white p-3 rounded-xl border border-border-light shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
                        <div className="text-headline-sm font-black text-primary">
                          <CountUp end={github.profile?.public_repos || 0} />
                        </div>
                        <div className="text-[10px] uppercase font-bold text-on-surface-variant mt-1 tracking-wider">Repos</div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-border-light shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
                        <div className="text-headline-sm font-black text-primary">
                          <CountUp end={github.profile?.followers || 0} />
                        </div>
                        <div className="text-[10px] uppercase font-bold text-on-surface-variant mt-1 tracking-wider">Followers</div>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-border-light shadow-sm flex flex-col justify-center transition-transform hover:-translate-y-1">
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
                            <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity text-primary">open_in_new</span>
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
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* LeetCode Stats */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient grid grid-cols-2 gap-4">
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
                  <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient flex flex-col justify-center">
                    
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
                      
                      // Base tracks (faded) lengths
                      const easyBase = totalAvailable > 0 ? (totalEasy / totalAvailable) * (V - 2 * gap) : 0;
                      const medBase = totalAvailable > 0 ? (totalMedium / totalAvailable) * (V - 2 * gap) : 0;
                      const hardBase = totalAvailable > 0 ? (totalHard / totalAvailable) * (V - 2 * gap) : 0;
                      
                      // Progress tracks (bright) lengths
                      const easyProg = totalEasy > 0 ? (easySolved / totalEasy) * easyBase : 0;
                      const medProg = totalMedium > 0 ? (mediumSolved / totalMedium) * medBase : 0;
                      const hardProg = totalHard > 0 ? (hardSolved / totalHard) * hardBase : 0;

                      return (
                        <div className="flex flex-col items-center gap-6 justify-center">
                          {/* Speedometer Arc Chart */}
                          <div className="relative w-36 h-36 shrink-0 mt-2" ref={speedometerRef}>
                            <svg viewBox="0 0 100 100" className="w-full h-full transform rotate-[135deg] drop-shadow-sm">
                              
                              {/* Faded Base Tracks */}
                              {easyBase > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#2cbb5d33" strokeWidth="4" strokeDasharray={`${Math.max(0, easyBase)} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" />}
                              {medBase > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#ffc01e33" strokeWidth="4" strokeDasharray={`${Math.max(0, medBase)} ${circumference}`} strokeDashoffset={-(easyBase + gap)} strokeLinecap="round" />}
                              {hardBase > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#ef474333" strokeWidth="4" strokeDasharray={`${Math.max(0, hardBase)} ${circumference}`} strokeDashoffset={-(easyBase + gap + medBase + gap)} strokeLinecap="round" />}
                              
                              {/* Bright Progress Tracks */}
                              {easyProg > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#2cbb5d" strokeWidth="4" strokeDasharray={`${animMounted ? Math.max(0, easyProg) : 0} ${circumference}`} strokeDashoffset={0} strokeLinecap="round" className="transition-all duration-1000 ease-out" />}
                              {medProg > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#ffc01e" strokeWidth="4" strokeDasharray={`${animMounted ? Math.max(0, medProg) : 0} ${circumference}`} strokeDashoffset={-(easyBase + gap)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />}
                              {hardProg > 0 && <circle cx="50" cy="50" r={radius} fill="none" stroke="#ef4743" strokeWidth="4" strokeDasharray={`${animMounted ? Math.max(0, hardProg) : 0} ${circumference}`} strokeDashoffset={-(easyBase + gap + medBase + gap)} strokeLinecap="round" className="transition-all duration-1000 ease-out" />}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center mt-[-10px]">
                              <div className="flex items-baseline">
                                <span className="text-3xl font-bold text-on-surface"><CountUp end={totalSolved} /></span>
                                <span className="text-xs text-on-surface-variant font-medium ml-0.5">/{totalAvailable}</span>
                              </div>
                              <div className="flex items-center text-xs text-on-surface-variant font-medium mt-1">
                                <span className="text-[#2cbb5d] mr-1 text-sm leading-none">✓</span> Solved
                              </div>
                            </div>
                          </div>
                          
                          {/* Cards (Easy, Med, Hard) */}
                          <div className="flex flex-col gap-2 w-full max-w-[160px]">
                            <div className="flex flex-col items-center justify-center py-2 px-4 rounded-lg bg-surface-container-high border border-border-light">
                              <span className="text-[#2cbb5d] font-medium text-sm">Easy</span>
                              <span className="text-on-surface font-semibold text-sm">{easySolved}<span className="text-on-surface-variant font-normal">/{totalEasy}</span></span>
                            </div>
                            <div className="flex flex-col items-center justify-center py-2 px-4 rounded-lg bg-surface-container-high border border-border-light">
                              <span className="text-[#ffc01e] font-medium text-sm">Med.</span>
                              <span className="text-on-surface font-semibold text-sm">{mediumSolved}<span className="text-on-surface-variant font-normal">/{totalMedium}</span></span>
                            </div>
                            <div className="flex flex-col items-center justify-center py-2 px-4 rounded-lg bg-surface-container-high border border-border-light">
                              <span className="text-[#ef4743] font-medium text-sm">Hard</span>
                              <span className="text-on-surface font-semibold text-sm">{hardSolved}<span className="text-on-surface-variant font-normal">/{totalHard}</span></span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* LeetCode Recent Submissions */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient flex flex-col gap-4">
                    <h3 className="font-headline-sm text-on-surface font-bold">Recent Submissions</h3>
                    {leetcode.submission?.submission?.length > 0 ? (
                      <div className="space-y-3">
                        {leetcode.submission.submission.slice(0, 4).map((sub, i) => (
                          <div key={i} className="flex flex-col p-3 border border-border-light rounded-lg bg-surface-container-low">
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-on-surface text-sm truncate pr-2">{sub.title}</span>
                              <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded ${sub.statusDisplay === 'Accepted' ? 'bg-green-500/20 text-green-700' : 'bg-red-500/20 text-red-700'}`}>
                                {sub.statusDisplay}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-on-surface-variant">
                              <span>{sub.lang}</span>
                              <span>{formatDistanceToNow(fromUnixTime(parseInt(sub.timestamp)))} ago</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-on-surface-variant text-center py-8">No recent submissions</div>
                    )}
                  </div>
                </div>

                {/* LeetCode Languages & Skills Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Languages */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient flex flex-col gap-4">
                    <h3 className="font-headline-sm text-on-surface font-bold">Top Languages</h3>
                    {leetcode.languages?.languageProblemCount?.length > 0 ? (
                      <div className="space-y-3">
                        {leetcode.languages.languageProblemCount
                          .sort((a, b) => b.problemsSolved - a.problemsSolved)
                          .slice(0, 5)
                          .map(lang => (
                          <div key={lang.languageName} className="flex justify-between items-center p-3 border border-border-light rounded-lg bg-surface-container-low">
                            <span className="font-medium text-on-surface">{lang.languageName}</span>
                            <span className="text-primary font-bold px-3 py-1 bg-primary/10 rounded-full text-sm">
                              {lang.problemsSolved} solved
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-on-surface-variant text-center py-8">No language data</div>
                    )}
                  </div>

                  {/* Skills */}
                  <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient flex flex-col gap-4">
                    <h3 className="font-headline-sm text-on-surface font-bold">Top Skills</h3>
                    {(() => {
                      const allSkills = [
                        ...(leetcode.skills?.fundamental || []),
                        ...(leetcode.skills?.intermediate || []),
                        ...(leetcode.skills?.advanced || [])
                      ].sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 8);

                      return allSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {allSkills.map(skill => (
                            <div key={skill.tagName} className="px-3 py-2 border border-border-light rounded-lg bg-surface-container-low flex flex-col">
                              <span className="text-body-sm font-medium text-on-surface">{skill.tagName}</span>
                              <span className="text-[10px] text-on-surface-variant">{skill.problemsSolved} problems</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-on-surface-variant text-center py-8">No skills data</div>
                      );
                    })()}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-surface-container-lowest rounded-xl p-8 border border-border-light shadow-ambient text-center text-on-surface-variant">
                No LeetCode data available.
              </div>
            )}
          </section>

        </div>
      </main>

      <nav className="md:hidden bg-white/80 backdrop-blur-xl fixed bottom-0 w-full flex justify-around items-center h-16 border-t border-border-light z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <a className="flex flex-col items-center gap-1 text-primary" href="#">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-semibold">Dash</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary" href="#">
          <span className="material-symbols-outlined">work</span>
          <span className="text-[10px] font-semibold">Jobs</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary" href="#">
          <span className="material-symbols-outlined">event</span>
          <span className="text-[10px] font-semibold">Events</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary" href="/profile">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-semibold">Profile</span>
        </a>
      </nav>
    </div>
  );
}
