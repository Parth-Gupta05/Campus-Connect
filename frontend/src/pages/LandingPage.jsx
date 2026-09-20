import React, { useState, useMemo, useEffect, useRef, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ActivityCalendar } from 'react-activity-calendar';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import {
  ShieldCheck,
  Code2,
  Briefcase,
  GraduationCap,
  Building2,
  CheckCircle2,
  ArrowRight,
  Lock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Award,
  Terminal,
  Search,
  Users,
  Flame,
  Zap,
  Check,
  GitBranch,
  Copy,
  TrendingUp,
  Clock,
  ThumbsUp,
  MessageSquare,
  Bookmark,
  User,
  Star,
  GitFork,
  Globe,
  FileText,
  Play,
  Pause
} from 'lucide-react';
import ThemeSwitcher from '../components/ui/ThemeSwitcher';
import BrandLogo from '../components/BrandLogo';

// ============================================================================
// Microinteraction Helper Components & Animation Hooks
// ============================================================================

function useInView(options = { threshold: 0.15, triggerOnce: true }) {
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        if (options.triggerOnce) {
          observer.unobserve(entry.target);
        }
      } else if (!options.triggerOnce) {
        setInView(false);
      }
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [options.threshold, options.triggerOnce]);

  return [ref, inView];
}

function AnimatedCounter({ end, duration = 1800, decimals = 0, prefix = '', suffix = '', delay = 0, trigger = true }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;
    let startTimestamp = null;
    let frameId;
    let timer;

    timer = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(eased * end);
        if (progress < 1) {
          frameId = requestAnimationFrame(step);
        }
      };

      frameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timer);
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [end, duration, delay, trigger]);

  const formatted = decimals > 0 
    ? count.toFixed(decimals) 
    : Math.round(count).toLocaleString();

  return (
    <span style={{ fontVariantNumeric: 'tabular-nums' }}>
      {prefix}{formatted}{suffix}
    </span>
  );
}

function DynamicLeetCodeBar({ easyPct = 43.5, medPct = 44, hardPct = 12.5, delay = 800 }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className="h-2 w-full rounded-full bg-gray-300 dark:bg-gray-800 overflow-hidden flex transition-all">
      <div 
        style={{ width: mounted ? `${easyPct}%` : '0%' }} 
        className="bg-[#2cbb5d] h-full transition-all duration-1200 ease-out" 
        title="Easy: 210" 
      />
      <div 
        style={{ width: mounted ? `${medPct}%` : '0%' }} 
        className="bg-[#ffc01e] h-full transition-all duration-1200 ease-out delay-150" 
        title="Medium: 212" 
      />
      <div 
        style={{ width: mounted ? `${hardPct}%` : '0%' }} 
        className="bg-[#ef4743] h-full transition-all duration-1200 ease-out delay-300" 
        title="Hard: 60" 
      />
    </div>
  );
}

function TypewriterText({ text, speed = 16, delay = 0 }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let idx = 0;
    let timer;

    const startTimer = setTimeout(() => {
      timer = setInterval(() => {
        if (idx <= text.length) {
          setDisplayed(text.slice(0, idx));
          idx++;
        } else {
          clearInterval(timer);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimer);
      if (timer) clearInterval(timer);
    };
  }, [text, speed, delay]);

  return <span>{displayed}</span>;
}

const SAMPLE_RATE_LIMITER_CODE = `class SlidingWindowRateLimiter:
    def allow_request(self, user_id: str) -> bool:
        now, pipeline = time.time(), self.redis.pipeline()
        pipeline.zremrangebyscore(user_id, 0, now - self.window_secs)
        pipeline.zadd(user_id, {str(now): now})
        _, count = pipeline.zcard(user_id).execute()
        return count <= self.max_tokens`;

function TypewriterCode({ code = SAMPLE_RATE_LIMITER_CODE, speed = 12, delay = 2700 }) {
  const [displayedCode, setDisplayedCode] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setDisplayedCode('');
    setIsTyping(false);
    let idx = 0;
    let timer;

    const startTimer = setTimeout(() => {
      setIsTyping(true);
      timer = setInterval(() => {
        if (idx < code.length) {
          idx += 3;
          setDisplayedCode(code.slice(0, Math.min(idx, code.length)));
        } else {
          setIsTyping(false);
          clearInterval(timer);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimer);
      if (timer) clearInterval(timer);
    };
  }, [code, speed, delay]);

  return (
    <code>
      {displayedCode}
      {isTyping && <span className="inline-block w-1.5 h-3.5 bg-teal-600 animate-caret ml-0.5 align-middle" />}
    </code>
  );
}

export default function LandingPage() {
  const { resolvedTheme } = useTheme();
  const { user } = useContext(AuthContext);

  const getDashboardLink = () => {
    if (!user) return '/signin';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'club') return '/club';
    return '/dashboard';
  };

  const previewCardRef = useRef(null);
  const footerRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMockupTab, setActiveMockupTab] = useState('profile'); // 'profile' | 'placement' | 'admin'
  const [activeHeatmapStream, setActiveHeatmapStream] = useState('github'); // 'github' | 'leetcode'
  const [copiedCode, setCopiedCode] = useState(false);

  // Section in-view scroll observers
  const [heroMounted, setHeroMounted] = useState(false);
  const [footerHeight, setFooterHeight] = useState(420);
  const [mockupRef, mockupInView] = useInView({ threshold: 0.1 });
  const [statsRef, statsInView] = useInView({ threshold: 0.2 });
  const [featuresRef, featuresInView] = useInView({ threshold: 0.1 });
  const [howItWorksRef, howItWorksInView] = useInView({ threshold: 0.15 });
  const [ctaRef, ctaInView] = useInView({ threshold: 0.2 });

  useEffect(() => {
    setHeroMounted(true);
  }, []);

  useEffect(() => {
    const updateFooterHeight = () => {
      if (footerRef.current) {
        setFooterHeight(footerRef.current.offsetHeight);
      }
    };
    updateFooterHeight();
    const timer = setTimeout(updateFooterHeight, 500);
    window.addEventListener('resize', updateFooterHeight);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateFooterHeight);
    };
  }, []);

  // Automated Tour State & Animated Cursor Engine
  const [isPlayingTour, setIsPlayingTour] = useState(true);
  const [isUserHovering, setIsUserHovering] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [cursorPos, setCursorPos] = useState({ x: '26%', y: '28%' });
  const [isClicking, setIsClicking] = useState(false);
  const [cursorLabel, setCursorLabel] = useState('Viewing Alex Chen · DTU 2026');

  const handleCopy = () => {
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Tour timeline runner
  useEffect(() => {
    if (!isPlayingTour || isUserHovering) return;

    const tourTimeline = [
      // 0: Tab 1 Identity card
      {
        tab: 'profile',
        stream: 'github',
        pos: { x: '26%', y: '28%' },
        label: 'Alex Chen · 9.42 CGPA',
        duration: 3200,
        action: null,
      },
      // 1: Glide across to LeetCode card
      {
        tab: 'profile',
        stream: 'github',
        pos: { x: '72%', y: '26%' },
        label: 'Guardian · 1,948 Rating',
        duration: 3000,
        action: null,
      },
      // 2: Glide to LeetCode toggle in Activity Stream
      {
        tab: 'profile',
        stream: 'github',
        targetId: 'tour-leetcode-toggle',
        pos: { x: '88%', y: '48%' },
        label: 'Switching to LeetCode...',
        duration: 1800,
        action: null,
      },
      // 3: Click LeetCode toggle
      {
        tab: 'profile',
        stream: 'leetcode',
        targetId: 'tour-leetcode-toggle',
        pos: { x: '88%', y: '48%' },
        label: 'LeetCode Stream Active',
        duration: 3200,
        action: 'click_stream',
      },
      // 4: Glide to Tab 2 "Placement Story"
      {
        tab: 'profile',
        stream: 'leetcode',
        targetId: 'tour-tab-placement',
        pos: { x: '24%', y: '4%' },
        label: 'Opening Placement Story...',
        duration: 1800,
        action: null,
      },
      // 5: Click Tab 2
      {
        tab: 'placement',
        stream: 'leetcode',
        targetId: 'tour-tab-placement',
        pos: { x: '24%', y: '4%' },
        label: 'Google SWE Experience',
        duration: 3600,
        action: 'click_tab_placement',
      },
      // 6: Sweep across 4 rounds as rate_limiter pops up and code types
      {
        tab: 'placement',
        stream: 'leetcode',
        pos: { x: '50%', y: '34%' },
        label: '4-Round Interview Pipeline',
        duration: 4400,
        action: null,
      },
      // 7: Glide to Copy Code button
      {
        tab: 'placement',
        stream: 'leetcode',
        targetId: 'tour-copy-btn',
        pos: { x: '91%', y: '56%' },
        label: 'Copying rate_limiter.py...',
        duration: 2000,
        action: null,
      },
      // 8: Click Copy Code button
      {
        tab: 'placement',
        stream: 'leetcode',
        targetId: 'tour-copy-btn',
        pos: { x: '91%', y: '56%' },
        label: 'Copied to Clipboard!',
        duration: 2600,
        action: 'click_copy',
      },
      // 9: Glide to Tab 3 "Admin Dossier"
      {
        tab: 'placement',
        stream: 'leetcode',
        targetId: 'tour-tab-admin',
        pos: { x: '38%', y: '4%' },
        label: 'Opening Admin Dossier...',
        duration: 1800,
        action: null,
      },
      // 10: Click Tab 3
      {
        tab: 'admin',
        stream: 'leetcode',
        targetId: 'tour-tab-admin',
        pos: { x: '38%', y: '4%' },
        label: 'Placement Cell Dossier',
        duration: 3500,
        action: 'click_tab_admin',
      },
      // 11: Sweep across verification checklist
      {
        tab: 'admin',
        stream: 'leetcode',
        pos: { x: '42%', y: '32%' },
        label: 'Verifying Transcripts & CGPA',
        duration: 3200,
        action: null,
      },
      // 12: Glide to inspect top repositories
      {
        tab: 'admin',
        stream: 'leetcode',
        pos: { x: '35%', y: '64%' },
        label: 'Inspecting Go Microservices',
        duration: 3200,
        action: null,
      },
      // 13: Glide back to Tab 1 "Student Profile"
      {
        tab: 'admin',
        stream: 'leetcode',
        targetId: 'tour-tab-profile',
        pos: { x: '12%', y: '4%' },
        label: 'Returning to Profile...',
        duration: 1800,
        action: null,
      },
      // 14: Click Tab 1 and reset to start
      {
        tab: 'profile',
        stream: 'github',
        targetId: 'tour-tab-profile',
        pos: { x: '12%', y: '4%' },
        label: 'Student Profile Live',
        duration: 3200,
        action: 'click_tab_profile',
      },
    ];

    const currentStep = tourTimeline[tourStep % tourTimeline.length];

    // Compute exact position dynamically if element exists in DOM
    let targetPos = currentStep.pos;
    if (currentStep.targetId && previewCardRef.current) {
      const targetEl = previewCardRef.current.querySelector(`#${currentStep.targetId}`);
      if (targetEl) {
        const cardRect = previewCardRef.current.getBoundingClientRect();
        const elRect = targetEl.getBoundingClientRect();
        if (cardRect.width > 0 && cardRect.height > 0) {
          targetPos = {
            x: `${((elRect.left + elRect.width / 2 - cardRect.left) / cardRect.width) * 100}%`,
            y: `${((elRect.top + elRect.height / 2 - cardRect.top) / cardRect.height) * 100}%`,
          };
        }
      }
    }

    setCursorPos(targetPos);
    setCursorLabel(currentStep.label);

    if (currentStep.action) {
      setIsClicking(true);
      const clickTimer = setTimeout(() => {
        setIsClicking(false);
        if (currentStep.action === 'click_stream') {
          setActiveHeatmapStream(currentStep.stream);
        } else if (currentStep.action === 'click_tab_placement') {
          setActiveMockupTab('placement');
        } else if (currentStep.action === 'click_copy') {
          handleCopy();
        } else if (currentStep.action === 'click_tab_admin') {
          setActiveMockupTab('admin');
        } else if (currentStep.action === 'click_tab_profile') {
          setActiveMockupTab('profile');
          setActiveHeatmapStream('github');
        }
      }, 350);

      const nextTimer = setTimeout(() => {
        setTourStep((prev) => (prev + 1) % tourTimeline.length);
      }, currentStep.duration);

      return () => {
        clearTimeout(clickTimer);
        clearTimeout(nextTimer);
      };
    }

    const timer = setTimeout(() => {
      setTourStep((prev) => (prev + 1) % tourTimeline.length);
    }, currentStep.duration);

    return () => clearTimeout(timer);
  }, [tourStep, isPlayingTour, isUserHovering]);

  // Generate realistic GitHub activity calendar data for the last 6 months (~182 days)
  const githubActivityData = useMemo(() => {
    const data = [];
    const totalDays = 182;
    const now = new Date();

    for (let i = totalDays; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let count = 0;
      let level = 0;

      // Recent 6 days leading up to today (active recent streak)
      if (i <= 5) {
        const recent = [
          { count: 3, level: 2 }, // today
          { count: 5, level: 3 }, // yesterday
          { count: 2, level: 2 },
          { count: 1, level: 1 },
          { count: 4, level: 3 },
          { count: 2, level: 2 }
        ];
        count = recent[i].count;
        level = recent[i].level;
      } else {
        // Deterministic pseudo-random seed based on day index
        const hash = Math.sin(i * 91.23 + (isWeekend ? 4.17 : 1.33)) * 43758.5453;
        const rand = hash - Math.floor(hash);

        // Multi-week project sprints (hackathon/sprint peaks, exam lulls)
        const wave = Math.sin(i / 16) * 0.22 + Math.cos(i / 32) * 0.12;
        let prob = 0.44 + wave;
        if (isWeekend) prob *= 0.40; // weekends have lower commit rate

        if (rand < prob) {
          const intRand = (rand * 1000) % 1;
          if (intRand > 0.85) {
            level = 4;
            count = Math.floor(intRand * 5) + 8; // 8-12 commits
          } else if (intRand > 0.60) {
            level = 3;
            count = Math.floor(intRand * 4) + 4; // 4-7 commits
          } else if (intRand > 0.28) {
            level = 2;
            count = Math.floor(intRand * 2) + 2; // 2-3 commits
          } else {
            level = 1;
            count = 1; // 1 commit
          }
        }
      }

      data.push({ date: dateStr, count, level });
    }
    return data;
  }, []);

  // Generate realistic LeetCode activity calendar data for the last 6 months (~182 days)
  const leetcodeActivityData = useMemo(() => {
    const data = [];
    const totalDays = 182;
    const now = new Date();

    for (let i = totalDays; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      let count = 0;
      let level = 0;

      // Recent 4 days leading up to today
      if (i <= 3) {
        const recent = [
          { count: 2, level: 2 }, // today
          { count: 1, level: 1 }, // yesterday
          { count: 3, level: 3 },
          { count: 1, level: 1 }
        ];
        count = recent[i].count;
        level = recent[i].level;
      } else {
        const hash = Math.sin(i * 73.19 + (isWeekend ? 8.41 : 2.71)) * 39182.2817;
        const rand = hash - Math.floor(hash);

        // LeetCode activity: weekend contests boost
        const prepWave = Math.sin((i - 20) / 18) * 0.24 + Math.cos(i / 40) * 0.10;
        let prob = 0.38 + prepWave;
        if (isWeekend) {
          prob = Math.min(prob * 1.3, 0.62); // weekend contest boost
        } else {
          prob *= 0.85;
        }

        if (rand < prob) {
          const intRand = (rand * 1000) % 1;
          if (intRand > 0.87) {
            level = 4;
            count = Math.floor(intRand * 4) + 6; // 6-9 problems
          } else if (intRand > 0.64) {
            level = 3;
            count = Math.floor(intRand * 3) + 3; // 3-5 problems
          } else if (intRand > 0.35) {
            level = 2;
            count = 2;
          } else {
            level = 1;
            count = 1;
          }
        }
      }

      data.push({ date: dateStr, count, level });
    }
    return data;
  }, []);

  // Compute realistic dynamic totals matching activity calendar
  const totalGithubCommits = useMemo(() => {
    return githubActivityData.reduce((sum, item) => sum + item.count, 0);
  }, [githubActivityData]);

  const totalLeetCodeSubmissions = useMemo(() => {
    return leetcodeActivityData.reduce((sum, item) => sum + item.count, 0);
  }, [leetcodeActivityData]);

  return (
    <div className="min-h-screen bg-background-100 text-gray-1000 selection:bg-gray-1000 selection:text-background-100 transition-colors duration-200">
      {/* ===================================================================
          CURTAIN MAIN WRAPPER
          High z-index opaque layer that slides over the fixed parallax backdrop footer
          =================================================================== */}
      <main className="relative z-10 bg-background-100 shadow-[0_30px_70px_rgba(0,0,0,0.35)] border-b border-gray-400">
        {/* ===================================================================
            1. GEIST MARKETING NAVBAR
            =================================================================== */}
        <nav className={`sticky top-0 z-50 w-full border-b border-gray-400 bg-background-100/85 backdrop-blur-md transition-all duration-700 ${
          heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}>
          <div className="mx-auto flex h-14 max-w-[1220px] items-center justify-between px-6">
            {/* Brand Logo */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2.5 font-semibold text-sm tracking-tight text-gray-1000 hover:opacity-90 transition-opacity">
                <BrandLogo className="h-7 w-7" />
                <span className="font-sans font-semibold">Campus Connect</span>
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center gap-6 text-sm text-gray-900 font-sans">
                <a href="#features" className="transition-colors hover:text-gray-1000">Features</a>
                <a href="#how-it-works" className="transition-colors hover:text-gray-1000">How It Works</a>
                <a href="#preview" className="transition-colors hover:text-gray-1000">Live Mockup</a>
                <Link to="/opportunities" className="transition-colors hover:text-gray-1000">Opportunities</Link>
              </div>
            </div>

            {/* Right Controls */}
            <div className="hidden md:flex items-center gap-3 font-sans">
              <ThemeSwitcher small />
              <div className="h-4 w-px bg-gray-400 mx-1" />
              {user ? (
                <Link
                  to={getDashboardLink()}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity shadow-xs"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/signin"
                    className="text-xs font-medium text-gray-900 hover:text-gray-1000 px-3 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center h-8 px-3 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity shadow-xs"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <ThemeSwitcher small />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-gray-900 hover:text-gray-1000 rounded-md hover:bg-gray-100"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden border-b border-gray-400 bg-background-100 px-6 py-4 flex flex-col gap-3">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-gray-900 hover:text-gray-1000 py-1"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-gray-900 hover:text-gray-1000 py-1"
              >
                How It Works
              </a>
              <a
                href="#preview"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-gray-900 hover:text-gray-1000 py-1"
              >
                Live Mockup
              </a>
              <div className="h-px bg-gray-400 my-1" />
              <div className="flex items-center gap-3 pt-1">
                {user ? (
                  <Link
                    to={getDashboardLink()}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center text-xs font-medium bg-gray-1000 text-background-100 py-2 rounded-md"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/signin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center text-xs font-medium text-gray-1000 py-2 border border-gray-400 rounded-md"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center text-xs font-medium bg-gray-1000 text-background-100 py-2 rounded-md"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* ===================================================================
            2. HERO SECTION WITH AMBIENT GLOW & DEVELOPER GRID
            =================================================================== */}
        <section className="relative overflow-hidden pt-20 pb-24 md:pt-28 md:pb-36 geist-bg-grid">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[450px] geist-hero-glow pointer-events-none -z-10 animate-float-slow" />

          <div className="mx-auto max-w-[1220px] px-6">
            <div className="flex flex-col items-center text-center">


              {/* Display Headline */}
              <h1 
                className={`max-w-4xl text-heading-48 md:text-heading-64 text-gray-1000 font-bold tracking-tight transition-all duration-800 ${
                  heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: '200ms' }}
              >
                Build and verify your <br />
                <span className="bg-gradient-to-r from-gray-1000 via-gray-800 to-gray-500 bg-clip-text text-transparent">
                  digital campus identity.
                </span>
              </h1>

              {/* Subtext */}
              <p 
                className={`mt-6 max-w-2xl text-copy-16 md:text-copy-18 text-gray-900 font-normal leading-relaxed transition-all duration-800 ${
                  heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: '350ms' }}
              >
                Campus Connect continuously translates your academic credentials, LeetCode &amp; GitHub metrics, and real placement records into an authenticated developer identity.
              </p>

              {/* CTA Group with Button Shimmer Effect */}
              <div 
                className={`mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto font-sans transition-all duration-800 ${
                  heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: '500ms' }}
              >
                <Link
                  to="/signup"
                  className="btn-shimmer-effect inline-flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-gray-1000 text-background-100 text-sm font-medium hover:opacity-90 transition-opacity w-full sm:w-auto shadow-xs"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/signin"
                  className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-md border border-gray-400 bg-background-100 text-gray-1000 text-sm font-medium hover:bg-gray-100 hover:border-gray-500 transition-colors w-full sm:w-auto shadow-xs"
                >
                  <span>Browse Placements</span>
                  <ChevronRight className="w-4 h-4 text-gray-700" />
                </Link>
              </div>

              {/* Micro Highlights */}
              <div 
                className={`mt-8 flex items-center gap-6 text-xs text-gray-700 font-sans transition-all duration-800 ${
                  heroMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: '650ms' }}
              >
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-700" />
                  <span>Zero Manual Form Filling</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-700" />
                  <span>Live Coding &amp; Project Metrics</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-teal-700" />
                  <span>Verified University Records</span>
                </div>
              </div>
            </div>

            {/* ===================================================================
                3. REDESIGNED RICH INTERACTIVE BROWSER MOCKUP
                =================================================================== */}
            <div 
              id="preview" 
              ref={mockupRef}
              className={`mt-14 w-full relative transition-all duration-1000 ${
                mockupInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-[0.985]'
              }`}
              onMouseEnter={() => setIsUserHovering(true)}
              onMouseLeave={() => setIsUserHovering(false)}
            >
              <div 
                ref={previewCardRef}
                className="geist-specular-card rounded-xl border border-gray-400 bg-background-100 shadow-2xl overflow-hidden transition-all relative"
              >
              
              {/* Simulated Animated Cursor with Click Ripple & Floating Action Chip */}
              {isPlayingTour && !isUserHovering && (
                <div 
                  className="pointer-events-none absolute z-50 transition-all duration-700 ease-geist-out hidden sm:block"
                  style={{ left: cursorPos.x, top: cursorPos.y }}
                >
                  {/* Click ripple animation ring */}
                  {isClicking && (
                    <span className="absolute -top-3.5 -left-3.5 h-10 w-10 rounded-full bg-teal-500/40 border border-teal-400 animate-cursor-ripple pointer-events-none" />
                  )}

                  <div className={`relative transition-transform duration-150 ${isClicking ? 'scale-90' : 'scale-100'}`}>
                    <svg 
                      width="22" 
                      height="22" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      className="drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]"
                    >
                      <path 
                        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" 
                        fill="currentColor" 
                        className="text-gray-1000"
                      />
                      <path 
                        d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.86a.5.5 0 0 0-.85.35Z" 
                        stroke="currentColor" 
                        strokeWidth="1.5"
                        className="text-background-100"
                      />
                    </svg>

                    {/* Floating Action Chip beside cursor */}
                    {cursorLabel && (
                      <div className="absolute left-4 top-4 whitespace-nowrap rounded-full bg-gray-1000 text-background-100 px-2.5 py-0.5 text-[10px] font-mono font-medium shadow-lg border border-background-100/20 flex items-center gap-1.5 animate-in fade-in duration-150">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                        <span>{cursorLabel}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Browser Chrome Bar */}
              <div className="flex h-12 items-center justify-between border-b border-gray-400 bg-background-200/95 px-3 sm:px-5 gap-2 sm:gap-4">
                {/* Left: Window Controls + Authentic Campus Connect Navigation Tabs */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/80 shrink-0" />
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80 shrink-0" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 shrink-0" />
                  </div>
                  <div className="h-4 w-px bg-gray-400 hidden sm:block shrink-0" />

                  {/* Real Campus Connect App Navigation Tabs */}
                  <div className="hidden sm:flex items-center gap-1 bg-background-100 border border-gray-400 rounded-lg p-0.5 shadow-2xs shrink-0">
                    <button
                      id="tour-tab-profile"
                      type="button"
                      onClick={() => {
                        setActiveMockupTab('profile');
                        setIsPlayingTour(false);
                      }}
                      className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                        activeMockupTab === 'profile'
                          ? 'bg-background-200 text-gray-1000 shadow-2xs font-semibold'
                          : 'text-gray-700 hover:text-gray-1000'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                      <span className="whitespace-nowrap">Student Profile</span>
                    </button>
                    <button
                      id="tour-tab-placement"
                      type="button"
                      onClick={() => {
                        setActiveMockupTab('placement');
                        setIsPlayingTour(false);
                      }}
                      className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                        activeMockupTab === 'placement'
                          ? 'bg-background-200 text-gray-1000 shadow-2xs font-semibold'
                          : 'text-gray-700 hover:text-gray-1000'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                      <span className="whitespace-nowrap">Placement Story</span>
                    </button>
                    <button
                      id="tour-tab-admin"
                      type="button"
                      onClick={() => {
                        setActiveMockupTab('admin');
                        setIsPlayingTour(false);
                      }}
                      className={`px-2.5 sm:px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
                        activeMockupTab === 'admin'
                          ? 'bg-background-200 text-gray-1000 shadow-2xs font-semibold'
                          : 'text-gray-700 hover:text-gray-1000'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                      <span className="whitespace-nowrap">Admin Dossier</span>
                    </button>
                  </div>
                </div>

                {/* Real Dynamic URL Bar matching active route (Cleanly visible on desktop lg+) */}
                <div className="hidden lg:flex items-center gap-2 rounded-md border border-gray-400 bg-background-100 px-3 py-1 text-xs text-gray-900 font-mono min-w-0 max-w-[280px] xl:max-w-[390px] truncate shadow-2xs shrink">
                  <Lock className="h-3 w-3 text-teal-700 shrink-0" />
                  <span className="text-gray-600 select-none shrink-0">https://</span>
                  <span className="truncate text-gray-1000 font-medium">
                    {activeMockupTab === 'profile' && 'campusconnect.edu/profile/23-COMPA10-27'}
                    {activeMockupTab === 'placement' && 'campusconnect.edu/placements/google-swe-intern'}
                    {activeMockupTab === 'admin' && 'campusconnect.edu/admin/students/23-COMPA10-27'}
                  </span>
                </div>

                {/* Right Tour & Status Controls */}
                <div className="hidden sm:flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsPlayingTour(!isPlayingTour)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono border border-gray-400 bg-background-100 hover:bg-gray-200 text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                    title={isPlayingTour ? "Pause automated tour" : "Resume automated tour"}
                  >
                    {isPlayingTour ? <Pause className="w-3 h-3 text-teal-600 shrink-0" /> : <Play className="w-3 h-3 text-blue-600 shrink-0" />}
                    <span className="whitespace-nowrap">{isPlayingTour ? 'Tour: Active' : 'Tour Paused'}</span>
                  </button>
                </div>
              </div>

              {/* Mobile View Switcher */}
              <div className="sm:hidden flex items-center justify-around border-b border-gray-400 bg-background-200 px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMockupTab('profile');
                    setIsPlayingTour(false);
                  }}
                  className={`text-xs font-medium px-2 py-1 rounded ${activeMockupTab === 'profile' ? 'bg-gray-200 text-gray-1000 font-semibold' : 'text-gray-700'}`}
                >
                  Profile
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMockupTab('placement');
                    setIsPlayingTour(false);
                  }}
                  className={`text-xs font-medium px-2 py-1 rounded ${activeMockupTab === 'placement' ? 'bg-gray-200 text-gray-1000 font-semibold' : 'text-gray-700'}`}
                >
                  Placement Story
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMockupTab('admin');
                    setIsPlayingTour(false);
                  }}
                  className={`text-xs font-medium px-2 py-1 rounded ${activeMockupTab === 'admin' ? 'bg-gray-200 text-gray-1000 font-semibold' : 'text-gray-700'}`}
                >
                  Admin Dossier
                </button>
              </div>

              {/* Mockup Body Content */}
              <div className="p-5 sm:p-7 bg-background-100 min-h-[445px]">
                {/* -------------------------------------------------------------
                    TAB 1: STUDENT PROFILE & OVERVIEW (MATCHING STUDENTPROFILE & STUDENTDASHBOARD)
                    ------------------------------------------------------------- */}
                {activeMockupTab === 'profile' && (
                  <div key="tab-profile" className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-200 min-h-[385px]">
                    {/* Left Column (5 Cols) - Authentic Student Identity & Credentials */}
                    <div className="lg:col-span-5 flex flex-col justify-between h-full space-y-3.5">
                      {/* Identity Card (Matching StudentProfile.jsx Header) */}
                      <div 
                        className="rounded-xl border border-gray-400 bg-background-200 p-4 space-y-3 shadow-2xs animate-card-pop"
                        style={{ animationDelay: '0ms' }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="h-11 w-11 rounded-full bg-gray-200 border-2 border-gray-400 flex items-center justify-center font-bold text-gray-1000 font-mono text-sm shadow-2xs">
                                AC
                              </div>
                              <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-teal-700 border-2 border-background-200 flex items-center justify-center text-[8px] text-white">
                                ✓
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-semibold text-gray-1000 tracking-tight">Alex Chen</h3>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded bg-background-100 border border-gray-400 text-[9.5px] font-mono text-gray-700">
                                  UID: 23-COMPA10-27
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-700 font-sans mt-0.5">
                                B.Tech Computer Science &bull; Graduating 2026
                              </p>
                              <p className="text-[10px] text-gray-600">
                                Delhi Technological University
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="inline-block rounded-md bg-teal-700/10 border border-teal-700/30 px-2 py-0.5 text-xs font-mono font-bold text-teal-700 shadow-2xs">
                              <AnimatedCounter end={9.42} decimals={2} duration={1800} delay={250} /> CGPA
                            </span>
                            <p className="text-[9.5px] text-gray-700 mt-0.5 font-mono">Top 2% of Batch</p>
                          </div>
                        </div>

                        {/* Connected Identities Pills Strip (Matching StudentProfile.jsx lines 1399-1480) */}
                        <div className="pt-2.5 border-t border-gray-400 flex flex-wrap items-center gap-1.5 text-xs font-mono">
                          <span className="px-2 py-0.5 rounded-md bg-background-100 border border-gray-400 text-gray-900 flex items-center gap-1.5 text-[11px]">
                            <FaGithub className="w-3 h-3 text-gray-1000" />
                            <span>alexchen</span>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-background-100 border border-gray-400 text-gray-900 flex items-center gap-1.5 text-[11px]">
                            <SiLeetcode className="w-3 h-3 text-[#ffa116]" />
                            <span>alexchen</span>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-background-100 border border-gray-400 text-gray-800 flex items-center gap-1.5 text-[11px]">
                            <FaLinkedin className="w-3 h-3 text-[#0A66C2]" />
                            <span>LinkedIn</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-background-100 border border-gray-400 text-gray-800 flex items-center gap-1.5 text-[11px]">
                            <Globe className="w-3 h-3 text-gray-600" />
                            <span>alexchen.dev</span>
                          </span>
                        </div>

                        {/* Verified Technical Skills Matrix (Matching StudentProfile.jsx) */}
                        <div className="pt-2.5 border-t border-gray-400">
                          <div className="text-[9.5px] font-mono uppercase text-gray-700 tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Code2 className="w-3 h-3 text-gray-600" />
                            <span>Verified Technical Skills</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              'Distributed Systems',
                              'Go (Golang)',
                              'React 19',
                              'PostgreSQL',
                              'Redis',
                              'Docker'
                            ].map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 rounded-md border border-gray-400 bg-background-100 px-1.5 py-0.5 text-[11px] text-gray-900 font-mono"
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-700" />
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 4-Metric Clean Strip (From StudentDashboard.jsx lines 535-564) */}
                      <div 
                        className="rounded-xl border border-gray-400 bg-background-200 overflow-hidden shadow-2xs animate-card-pop"
                        style={{ animationDelay: '350ms' }}
                      >
                        <div className="grid grid-cols-2 divide-x divide-y divide-gray-400 text-center">
                          <div className="p-2.5">
                            <div className="text-[9.5px] font-mono text-gray-700 uppercase tracking-wider">Problems Solved</div>
                            <div className="text-base font-bold font-sans text-gray-1000 mt-0.5">
                              <AnimatedCounter end={482} duration={1800} delay={450} /> <span className="text-[9.5px] font-mono font-normal text-gray-600">/ 3,450</span>
                            </div>
                          </div>
                          <div className="p-2.5">
                            <div className="text-[9.5px] font-mono text-gray-700 uppercase tracking-wider">Public Repos</div>
                            <div className="text-base font-bold font-sans text-gray-1000 mt-0.5">
                              <AnimatedCounter end={24} duration={1500} delay={500} />
                            </div>
                          </div>
                          <div className="p-2.5">
                            <div className="text-[9.5px] font-mono text-gray-700 uppercase tracking-wider">Global Rank</div>
                            <div className="text-base font-bold font-sans text-gray-1000 mt-0.5">
                              #<AnimatedCounter end={4120} duration={1800} delay={550} />
                            </div>
                          </div>
                          <div className="p-2.5">
                            <div className="text-[9.5px] font-mono text-gray-700 uppercase tracking-wider">Portfolio Strength</div>
                            <div className="text-base font-bold font-sans text-teal-700 mt-0.5">
                              <AnimatedCounter end={96} duration={1800} delay={600} />%
                            </div>
                          </div>
                        </div>
                        <div className="px-3.5 py-2 bg-background-100/60 border-t border-gray-400 flex items-center justify-between text-xs">
                          <span className="text-gray-700 font-mono text-[10.5px]">All Academic &amp; Coding Records Verified</span>
                          <span className="text-teal-700 font-medium font-mono text-[10.5px]">Tier-1 Eligible</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Column (7 Cols) - LeetCode KPI & Dual-Stream Activity Calendar */}
                    <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-3.5">
                      {/* LeetCode Verified Stats Card (Matching StudentDashboard.jsx / AdminStudentDetail.jsx) */}
                      <div 
                        className="rounded-xl border border-gray-400 bg-background-200 p-4 space-y-2.5 shadow-2xs animate-card-pop"
                        style={{ animationDelay: '700ms' }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-5.5 w-5.5 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#ffa116]">
                              <SiLeetcode className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-mono font-semibold text-gray-1000">
                              LeetCode Verified Stats
                            </span>
                          </div>
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10.5px] font-mono font-semibold">
                            Guardian &bull; <AnimatedCounter end={1948} duration={1800} delay={800} /> Rating (Top 3.8%)
                          </span>
                        </div>

                        {/* Progress Breakdown with Dynamic Loading Bar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-gray-900">Total Solved: <strong className="text-gray-1000"><AnimatedCounter end={482} duration={1800} delay={850} /></strong> <span className="text-gray-600">/ 3,450</span></span>
                            <span className="text-gray-700">Global Rank: #4,120 &bull; 68.4% Acceptance</span>
                          </div>
                          
                          {/* Dynamic LeetCode Multi-segment Animated Bar */}
                          <DynamicLeetCodeBar easyPct={43.5} medPct={44} hardPct={12.5} delay={950} />

                          <div className="flex items-center justify-between text-[10.5px] font-mono text-gray-700 pt-0.5">
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#2cbb5d]" />
                              <strong className="text-gray-1000 font-medium">Easy:</strong> <AnimatedCounter end={210} duration={1600} delay={950} /> / 820
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#ffc01e]" />
                              <strong className="text-gray-1000 font-medium">Medium:</strong> <AnimatedCounter end={212} duration={1600} delay={1050} /> / 1,720
                            </span>
                            <span className="flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#ef4743]" />
                              <strong className="text-gray-1000 font-medium">Hard:</strong> <AnimatedCounter end={60} duration={1600} delay={1150} /> / 750
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Dual-Stream Verified Activity Heatmap (Signature feature of StudentDashboard.jsx / AdminStudentDetail.jsx) */}
                      <div 
                        className="rounded-xl border border-gray-400 bg-background-200 p-4 space-y-2.5 shadow-2xs animate-card-pop"
                        style={{ animationDelay: '1050ms' }}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-gray-400">
                          <div>
                            <div className="flex items-center gap-2">
                              <GitBranch className="h-3.5 w-3.5 text-gray-900" />
                              <span className="text-xs font-mono font-semibold text-gray-1000">
                                Verified Activity Stream
                              </span>
                            </div>
                            <p className="text-[10.5px] text-gray-700 font-mono mt-0.5">
                              {activeHeatmapStream === 'github' ? (
                                <span>
                                  <AnimatedCounter end={totalGithubCommits} duration={1800} delay={1150} /> Commits in last 6 months &bull; 14 Day Active Streak
                                </span>
                              ) : (
                                <span>
                                  <AnimatedCounter end={totalLeetCodeSubmissions} duration={1800} delay={1150} /> Submissions in last 6 months &bull; Active Today
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Authentic Dual-Toggle Button [ GitHub | LeetCode ] */}
                          <div className="inline-flex p-0.5 rounded-lg bg-background-100 border border-gray-400 self-start sm:self-auto shadow-2xs">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveHeatmapStream('github');
                                setIsPlayingTour(false);
                              }}
                              className={`px-2.5 py-0.5 text-xs font-mono rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                                activeHeatmapStream === 'github'
                                  ? 'bg-gray-200 text-gray-1000 font-semibold'
                                  : 'text-gray-700 hover:text-gray-1000'
                              }`}
                            >
                              <FaGithub className="w-3 h-3" />
                              <span>GitHub</span>
                            </button>
                            <button
                              id="tour-leetcode-toggle"
                              type="button"
                              onClick={() => {
                                setActiveHeatmapStream('leetcode');
                                setIsPlayingTour(false);
                              }}
                              className={`px-2.5 py-0.5 text-xs font-mono rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                                activeHeatmapStream === 'leetcode'
                                  ? 'bg-gray-200 text-gray-1000 font-semibold'
                                  : 'text-gray-700 hover:text-gray-1000'
                              }`}
                            >
                              <SiLeetcode className="w-3 h-3 text-[#ffa116]" />
                              <span>LeetCode</span>
                            </button>
                          </div>
                        </div>

                        {/* Activity Calendar Grid with Fade-in Wave */}
                        <div 
                          key={activeHeatmapStream} 
                          className="w-full overflow-x-auto py-1 flex items-center justify-center animate-heatmap-fade"
                        >
                          <ActivityCalendar
                            data={activeHeatmapStream === 'github' ? githubActivityData : leetcodeActivityData}
                            colorScheme={resolvedTheme === 'dark' ? 'dark' : 'light'}
                            theme={activeHeatmapStream === 'github' ? {
                              light: ['#EBEDF0', '#9BE9A8', '#40C463', '#30A14E', '#216E39'],
                              dark: ['#161B22', '#0E4429', '#006D32', '#26A641', '#39D353'],
                            } : {
                              light: ['#EBEDF0', '#FED7AA', '#FDBA74', '#FB923C', '#EA580C'],
                              dark: ['#161B22', '#431407', '#7C2D12', '#C2410C', '#FFA116'],
                            }}
                            blockSize={11}
                            blockMargin={3}
                            fontSize={11}
                            showWeekdayLabels
                            labels={{
                              totalCount: activeHeatmapStream === 'github'
                                ? '{{count}} contributions in last 6 months'
                                : '{{count}} problem submissions in last 6 months',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 2: PLACEMENT STORY (MATCHING PLACEMENTPOSTCARD & PLACEMENTPOSTDETAIL)
                    ------------------------------------------------------------- */}
                {activeMockupTab === 'placement' && (
                  <div key="tab-placement" className="animate-in fade-in duration-200">
                    <div 
                      className="rounded-xl border border-gray-400 bg-background-200 p-4 sm:p-5 shadow-2xs animate-card-pop flex flex-col justify-between h-[385px] overflow-hidden"
                      style={{ animationDelay: '0ms' }}
                    >
                      {/* Header matching PlacementPostCard */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-gray-400 shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-lg bg-background-100 border border-gray-400 flex items-center justify-center font-bold text-sm text-gray-1000 shadow-xs shrink-0">
                            G
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <h3 className="text-sm font-bold text-gray-1000">Google &bull; SWE Intern</h3>
                              <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-medium border border-blue-500/20 whitespace-nowrap">
                                Interview Story
                              </span>
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-medium border border-emerald-500/20 whitespace-nowrap">
                                <CheckCircle2 className="w-3 h-3" /> Selected (PPO Offer)
                              </span>
                              <span className="px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 font-mono text-[10px] border border-orange-500/20 whitespace-nowrap">
                                Hard
                              </span>
                            </div>
                            <p className="text-[10.5px] text-gray-900 mt-0.5 font-mono">
                              Bangalore &bull; ₹1.2L/mo Stipend &bull; ₹28 LPA CTC &bull; Alex Chen (DTU '26)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10.5px] font-mono text-gray-700 shrink-0 whitespace-nowrap">
                          <Clock className="w-3.5 h-3.5" />
                          <span>4 Rounds &bull; On-Campus</span>
                        </div>
                      </div>

                      {/* 4-Round Interactive Pipeline Progression with Fixed-Height Typewriter Containers */}
                      <div className="shrink-0">
                        <div className="text-[9.5px] font-mono uppercase text-gray-700 tracking-wider mb-1.5">
                          Hiring Pipeline Progression
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                          {/* Round 1 */}
                          <div 
                            className="rounded-lg border border-teal-700/30 bg-teal-700/5 p-2 animate-card-pop h-[58px] flex flex-col justify-between overflow-hidden"
                            style={{ animationDelay: '300ms' }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[8.5px] text-teal-700 font-bold font-mono">ROUND 1</span>
                              <CheckCircle2 className="w-3 h-3 text-teal-700" />
                            </div>
                            <div className="font-semibold text-gray-1000 text-[11px] truncate">Online Assessment</div>
                            <div className="text-[10px] text-gray-700 font-sans truncate h-[14px]">
                              <TypewriterText text="2 DP problems (100% passed)" delay={450} speed={16} />
                            </div>
                          </div>

                          {/* Round 2 */}
                          <div 
                            className="rounded-lg border border-teal-700/30 bg-teal-700/5 p-2 animate-card-pop h-[58px] flex flex-col justify-between overflow-hidden"
                            style={{ animationDelay: '650ms' }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[8.5px] text-teal-700 font-bold font-mono">ROUND 2</span>
                              <CheckCircle2 className="w-3 h-3 text-teal-700" />
                            </div>
                            <div className="font-semibold text-gray-1000 text-[11px] truncate">Technical DSA</div>
                            <div className="text-[10px] text-gray-700 font-sans truncate h-[14px]">
                              <TypewriterText text="Shortest Path + Trie lookup" delay={800} speed={16} />
                            </div>
                          </div>

                          {/* Round 3 */}
                          <div 
                            className="rounded-lg border border-teal-700/30 bg-teal-700/5 p-2 animate-card-pop h-[58px] flex flex-col justify-between overflow-hidden"
                            style={{ animationDelay: '1000ms' }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[8.5px] text-teal-700 font-bold font-mono">ROUND 3</span>
                              <CheckCircle2 className="w-3 h-3 text-teal-700" />
                            </div>
                            <div className="font-semibold text-gray-1000 text-[11px] truncate">System Design</div>
                            <div className="text-[10px] text-gray-700 font-sans truncate h-[14px]">
                              <TypewriterText text="Sliding Window Rate Limiter" delay={1150} speed={16} />
                            </div>
                          </div>

                          {/* Round 4 */}
                          <div 
                            className="rounded-lg border border-teal-700/30 bg-teal-700/5 p-2 animate-card-pop h-[58px] flex flex-col justify-between overflow-hidden"
                            style={{ animationDelay: '1350ms' }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[8.5px] text-teal-700 font-bold font-mono">ROUND 4</span>
                              <CheckCircle2 className="w-3 h-3 text-teal-700" />
                            </div>
                            <div className="font-semibold text-gray-1000 text-[11px] truncate">Googleyness &amp; Fit</div>
                            <div className="text-[10px] text-gray-700 font-sans truncate h-[14px]">
                              <TypewriterText text="Leadership, culture, impact" delay={1500} speed={16} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Code Block Snippet Preview with Typewriter Effect - fixed height container */}
                      <div 
                        className="rounded-lg border border-gray-400 bg-background-100 p-2.5 font-mono text-xs text-gray-1000 relative animate-card-pop h-[134px] flex flex-col overflow-hidden shrink-0"
                        style={{ animationDelay: '2100ms' }}
                      >
                        <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-gray-400 text-[11px] text-gray-700 shrink-0">
                          <span className="truncate">rate_limiter.py (Round 3 implementation excerpt)</span>
                          <button
                            id="tour-copy-btn"
                            type="button"
                            onClick={handleCopy}
                            className="inline-flex items-center gap-1 text-gray-900 hover:text-gray-1000 cursor-pointer px-2 py-0.5 rounded hover:bg-gray-200 transition-colors bg-background-200 border border-gray-400 shadow-2xs shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                            <span className="font-medium text-[10.5px]">{copiedCode ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <pre className="overflow-x-auto text-[10.5px] leading-relaxed text-gray-1000 flex-1 font-mono select-none">
                          <TypewriterCode code={SAMPLE_RATE_LIMITER_CODE} speed={12} delay={2700} />
                        </pre>
                      </div>

                      {/* Community Reactions Bar */}
                      <div 
                        className="pt-2 border-t border-gray-400 flex items-center justify-between text-xs font-mono text-gray-700 animate-card-pop shrink-0"
                        style={{ animationDelay: '2600ms' }}
                      >
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 text-gray-900">
                            <ThumbsUp className="w-3.5 h-3.5 text-blue-700" />
                            <span><AnimatedCounter end={142} duration={1800} delay={2700} /> Upvotes</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-gray-900">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span><AnimatedCounter end={38} duration={1800} delay={2700} /> Comments</span>
                          </span>
                        </div>
                        <span className="text-teal-700 font-medium text-[11px]">Verified by Campus Placement Cell</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* -------------------------------------------------------------
                    TAB 3: ADMIN & PLACEMENT CELL DOSSIER (MATCHING ADMINSTUDENTDETAIL.JSX)
                    ------------------------------------------------------------- */}
                {activeMockupTab === 'admin' && (
                  <div key="tab-admin" className="animate-in fade-in duration-200">
                    <div 
                      className="rounded-xl border border-gray-400 bg-background-200 p-4 sm:p-5 shadow-2xs animate-card-pop flex flex-col justify-between h-[385px] overflow-hidden"
                      style={{ animationDelay: '0ms' }}
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-gray-400 shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-700 shrink-0">
                            <ShieldCheck className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-1000">
                              Placement Cell Candidate Dossier &amp; Verification
                            </h3>
                            <p className="text-[10.5px] text-gray-700 font-mono mt-0.5">
                              Alex Chen &bull; UID: 23-COMPA10-27 &bull; Delhi Technological University
                            </p>
                          </div>
                        </div>
                        <span className="rounded-md border border-teal-700/30 bg-teal-700/10 px-2.5 py-1 text-xs font-mono font-medium text-teal-700 whitespace-nowrap shrink-0">
                          Eligible for Tier-1 Drives (&gt; ₹20 LPA)
                        </span>
                      </div>

                      {/* 4-Item Verification Checklist Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono shrink-0">
                        <div 
                          className="rounded-lg border border-gray-400 bg-background-100 p-2.5 space-y-0.5 animate-card-pop"
                          style={{ animationDelay: '300ms' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-[9px] uppercase">Enrollment</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div className="font-semibold text-gray-1000 text-[11px] truncate">UID: 23-COMPA10-27</div>
                          <div className="text-gray-700 text-[10px] font-sans truncate">DTU BE CS</div>
                        </div>

                        <div 
                          className="rounded-lg border border-gray-400 bg-background-100 p-2.5 space-y-0.5 animate-card-pop"
                          style={{ animationDelay: '600ms' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-[9px] uppercase">Academics</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div className="font-semibold text-gray-1000 text-[11px] truncate"><AnimatedCounter end={9.42} decimals={2} duration={1800} delay={650} /> CGPA</div>
                          <div className="text-gray-700 text-[10px] font-sans truncate">0 Backlogs &bull; Top 2%</div>
                        </div>

                        <div 
                          className="rounded-lg border border-gray-400 bg-background-100 p-2.5 space-y-0.5 animate-card-pop"
                          style={{ animationDelay: '900ms' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-[9px] uppercase">Profiles</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div className="font-semibold text-gray-1000 text-[11px] truncate">GitHub &amp; LeetCode</div>
                          <div className="text-gray-700 text-[10px] font-sans truncate">Verified via API</div>
                        </div>

                        <div 
                          className="rounded-lg border border-gray-400 bg-background-100 p-2.5 space-y-0.5 animate-card-pop"
                          style={{ animationDelay: '1200ms' }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 text-[9px] uppercase">Resume</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          </div>
                          <div className="font-semibold text-gray-1000 text-[11px] truncate">Alex_Resume.pdf</div>
                          <div className="text-gray-700 text-[10px] font-sans truncate">Approved (1.2 MB)</div>
                        </div>
                      </div>

                      {/* Top Repositories from AdminStudentDetail.jsx */}
                      <div className="shrink-0">
                        <div className="text-[9.5px] font-mono uppercase text-gray-700 tracking-wider mb-2 flex items-center justify-between">
                          <span>Verified High-Impact Projects &amp; Repositories</span>
                          <span className="text-[10px] text-gray-600">Synced via GitHub API</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div 
                            className="rounded-lg border border-gray-400 bg-background-100 p-2.5 space-y-1 animate-card-pop"
                            style={{ animationDelay: '1500ms' }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-gray-1000 font-mono truncate">distributed-rate-limiter</span>
                              <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 text-[9px] font-mono">Go</span>
                            </div>
                            <p className="text-[10.5px] text-gray-700 font-sans line-clamp-2">
                              Sliding window counter with Redis cluster and sub-millisecond latencies.
                            </p>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-gray-600 pt-1 border-t border-gray-400/60">
                              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> <AnimatedCounter end={142} duration={1800} delay={1600} /></span>
                              <span className="flex items-center gap-1"><GitFork className="w-3 h-3" /> <AnimatedCounter end={28} duration={1800} delay={1600} /></span>
                            </div>
                          </div>

                          <div 
                            className="rounded-lg border border-gray-400 bg-background-100 p-2.5 space-y-1 animate-card-pop"
                            style={{ animationDelay: '1750ms' }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-gray-1000 font-mono truncate">go-raft-consensus</span>
                              <span className="px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-600 text-[9px] font-mono">Go</span>
                            </div>
                            <p className="text-[10.5px] text-gray-700 font-sans line-clamp-2">
                              Fault-tolerant consensus implementation with leader election and heartbeat.
                            </p>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-gray-600 pt-1 border-t border-gray-400/60">
                              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> <AnimatedCounter end={98} duration={1800} delay={1850} /></span>
                              <span className="flex items-center gap-1"><GitFork className="w-3 h-3" /> <AnimatedCounter end={19} duration={1800} delay={1850} /></span>
                            </div>
                          </div>

                          <div 
                            className="rounded-lg border border-gray-400 bg-background-100 p-2.5 space-y-1 animate-card-pop"
                            style={{ animationDelay: '2000ms' }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-gray-1000 font-mono truncate">campus-connect-core</span>
                              <span className="px-1.5 py-0.2 rounded bg-teal-700/10 text-teal-700 text-[9px] font-mono">TS</span>
                            </div>
                            <p className="text-[10.5px] text-gray-700 font-sans line-clamp-2">
                              Real-time career hub platform with automated GraphQL metrics collection.
                            </p>
                            <div className="flex items-center gap-3 text-[10px] font-mono text-gray-600 pt-1 border-t border-gray-400/60">
                              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500" /> <AnimatedCounter end={76} duration={1800} delay={2100} /></span>
                              <span className="flex items-center gap-1"><GitFork className="w-3 h-3" /> <AnimatedCounter end={12} duration={1800} delay={2100} /></span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Admin Footer */}
                      <div 
                        className="pt-2.5 border-t border-gray-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono animate-card-pop shrink-0"
                        style={{ animationDelay: '2300ms' }}
                      >
                        <span className="text-teal-700 font-medium text-[11px]">
                          ✓ Verified by University Placement Cell &bull; All Records Cryptographically Signed
                        </span>
                        <Link
                          to="/signin"
                          className="h-6.5 px-2.5 rounded bg-gray-1000 text-background-100 font-sans text-xs font-medium flex items-center gap-1 hover:opacity-90 transition-opacity self-start sm:self-auto"
                        >
                          <span>Explore Admin Portal</span>
                          <ChevronRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* ===================================================================
            4. STATS STRIP
            =================================================================== */}
        <section ref={statsRef} className="border-y border-gray-400 bg-background-200">
          <div className="mx-auto max-w-[1220px]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-400">
              <div 
                className={`bg-background-100 p-8 text-center sm:text-left transition-all duration-700 ${
                  statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`} 
                style={{ transitionDelay: '100ms' }}
              >
                <div className="font-mono text-3xl md:text-4xl font-bold text-gray-1000 tracking-tight">
                  <AnimatedCounter end={98.4} decimals={1} suffix="%" duration={1600} trigger={statsInView} />
                </div>
                <p className="mt-1 text-xs text-gray-900 font-medium">Placement Shortlist Rate</p>
              </div>
              <div 
                className={`bg-background-100 p-8 text-center sm:text-left transition-all duration-700 ${
                  statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`} 
                style={{ transitionDelay: '200ms' }}
              >
                <div className="font-mono text-3xl md:text-4xl font-bold text-gray-1000 tracking-tight">
                  <AnimatedCounter end={12500} suffix="+" duration={1800} trigger={statsInView} />
                </div>
                <p className="mt-1 text-xs text-gray-900 font-medium">Verified Student Profiles</p>
              </div>
              <div 
                className={`bg-background-100 p-8 text-center sm:text-left transition-all duration-700 ${
                  statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`} 
                style={{ transitionDelay: '300ms' }}
              >
                <div className="font-mono text-3xl md:text-4xl font-bold text-gray-1000 tracking-tight">
                  <AnimatedCounter end={850} suffix="+" duration={1600} trigger={statsInView} />
                </div>
                <p className="mt-1 text-xs text-gray-900 font-medium">Interview Experiences Logged</p>
              </div>
              <div 
                className={`bg-background-100 p-8 text-center sm:text-left transition-all duration-700 ${
                  statsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`} 
                style={{ transitionDelay: '400ms' }}
              >
                <div className="font-mono text-3xl md:text-4xl font-bold text-gray-1000 tracking-tight">
                  <AnimatedCounter end={60} suffix="+" duration={1400} trigger={statsInView} />
                </div>
                <p className="mt-1 text-xs text-gray-900 font-medium">Enterprise Recruiting Partners</p>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            5. FEATURES BORDER GRID
            =================================================================== */}
        <section id="features" ref={featuresRef} className="py-24 md:py-32">
          <div className="mx-auto max-w-[1220px] px-6">
            <div className={`max-w-2xl mb-14 transition-all duration-800 ${
              featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}>
              <div className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-2">
                System Architecture
              </div>
              <h2 className="text-heading-32 md:text-heading-40 font-bold text-gray-1000 tracking-tight">
                Engineered for transparent, data-backed campus recruitment.
              </h2>
              <p className="mt-3 text-copy-16 text-gray-900">
                Say goodbye to unverified PDF resumes. Campus Connect replaces static declarations with continuous, provable proof of work.
              </p>
            </div>

            <div className={`geist-border-grid rounded-xl overflow-hidden border border-gray-400 transition-all duration-1000 ${
              featuresInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}>
              {/* Feature 1 */}
              <div className="geist-grid-cell card-hover-elevate p-8 flex flex-col justify-between group hover:bg-background-200 transition-all">
                <div>
                  <div className="h-10 w-10 rounded-md border border-gray-400 bg-background-200 flex items-center justify-center text-gray-1000 mb-6 group-hover:border-blue-500/50 group-hover:text-blue-600 transition-colors">
                    <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-heading-16 font-semibold text-gray-1000 mb-2 group-hover:text-blue-600 transition-colors">
                    Verified Digital Identity
                  </h3>
                  <p className="text-copy-14 text-gray-900 leading-relaxed">
                    A living, tamper-proof student record directly validating university enrollments, CGPA scores, and institutional roles.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-mono text-gray-700 group-hover:text-gray-1000 group-hover:translate-x-1 transition-all">
                  <span>Cryptographically secured</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="geist-grid-cell card-hover-elevate p-8 flex flex-col justify-between group hover:bg-background-200 transition-all">
                <div>
                  <div className="h-10 w-10 rounded-md border border-gray-400 bg-background-200 flex items-center justify-center text-gray-1000 mb-6 group-hover:border-teal-500/50 group-hover:text-teal-600 transition-colors">
                    <Terminal className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-heading-16 font-semibold text-gray-1000 mb-2 group-hover:text-teal-600 transition-colors">
                    LeetCode &amp; GitHub Sync
                  </h3>
                  <p className="text-copy-14 text-gray-900 leading-relaxed">
                    Automated continuous sync of contest ratings, problem counts, activity heatmaps, and repository contributions.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-mono text-gray-700 group-hover:text-gray-1000 group-hover:translate-x-1 transition-all">
                  <span>Automated real-time sync</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Feature 3 */}
              <div className="geist-grid-cell card-hover-elevate p-8 flex flex-col justify-between group hover:bg-background-200 transition-all">
                <div>
                  <div className="h-10 w-10 rounded-md border border-gray-400 bg-background-200 flex items-center justify-center text-gray-1000 mb-6 group-hover:border-purple-500/50 group-hover:text-purple-600 transition-colors">
                    <Briefcase className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-heading-16 font-semibold text-gray-1000 mb-2 group-hover:text-purple-600 transition-colors">
                    Real Placement Experiences
                  </h3>
                  <p className="text-copy-14 text-gray-900 leading-relaxed">
                    First-hand interview rounds, coding assessments, compensation disclosures, and tips authored by successfully placed seniors.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-mono text-gray-700 group-hover:text-gray-1000 group-hover:translate-x-1 transition-all">
                  <span>Rich-text code &amp; Q&amp;A</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Feature 4 */}
              <div className="geist-grid-cell card-hover-elevate p-8 flex flex-col justify-between group hover:bg-background-200 transition-all">
                <div>
                  <div className="h-10 w-10 rounded-md border border-gray-400 bg-background-200 flex items-center justify-center text-gray-1000 mb-6 group-hover:border-amber-500/50 group-hover:text-amber-600 transition-colors">
                    <Sparkles className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-heading-16 font-semibold text-gray-1000 mb-2 group-hover:text-amber-600 transition-colors">
                    Algorithmic Candidate Scouting
                  </h3>
                  <p className="text-copy-14 text-gray-900 leading-relaxed">
                    Recruiter panel allowing instant multi-dimensional filtering by CGPA, branch, LeetCode rating, and exact skill vectors.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-mono text-gray-700 group-hover:text-gray-1000 group-hover:translate-x-1 transition-all">
                  <span>Recruiter search engine</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Feature 5 */}
              <div className="geist-grid-cell card-hover-elevate p-8 flex flex-col justify-between group hover:bg-background-200 transition-all">
                <div>
                  <div className="h-10 w-10 rounded-md border border-gray-400 bg-background-200 flex items-center justify-center text-gray-1000 mb-6 group-hover:border-blue-500/50 group-hover:text-blue-600 transition-colors">
                    <Users className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-heading-16 font-semibold text-gray-1000 mb-2 group-hover:text-blue-600 transition-colors">
                    Clubs &amp; University Events
                  </h3>
                  <p className="text-copy-14 text-gray-900 leading-relaxed">
                    Streamlined university club management with event ticketing, attendance QR verification, and leadership portfolios.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-mono text-gray-700 group-hover:text-gray-1000 group-hover:translate-x-1 transition-all">
                  <span>Club dashboard &amp; RSVP</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Feature 6 */}
              <div className="geist-grid-cell card-hover-elevate p-8 flex flex-col justify-between group hover:bg-background-200 transition-all">
                <div>
                  <div className="h-10 w-10 rounded-md border border-gray-400 bg-background-200 flex items-center justify-center text-gray-1000 mb-6 group-hover:border-emerald-500/50 group-hover:text-emerald-600 transition-colors">
                    <Award className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-heading-16 font-semibold text-gray-1000 mb-2 group-hover:text-emerald-600 transition-colors">
                    In-App PDF Credential Modal
                  </h3>
                  <p className="text-copy-14 text-gray-900 leading-relaxed">
                    High-speed resume previewing without external tab hops, featuring automated scoring and AI summary breakdown.
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-xs font-mono text-gray-700 group-hover:text-gray-1000 group-hover:translate-x-1 transition-all">
                  <span>Native overlay viewer</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            6. HOW IT WORKS
            =================================================================== */}
        <section id="how-it-works" ref={howItWorksRef} className="py-24 border-t border-gray-400 bg-background-200 relative overflow-hidden">
          <div className="mx-auto max-w-[1220px] px-6">
            <div className={`text-center max-w-xl mx-auto mb-16 transition-all duration-800 ${
              howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
            }`}>
              <div className="text-xs font-mono uppercase tracking-wider text-blue-700 mb-2">
                Workflow
              </div>
              <h2 className="text-heading-32 font-bold text-gray-1000 tracking-tight">
                Three steps to a verified career path.
              </h2>
            </div>

            <div className="relative">
              {/* Animated Flow Connecting Beam (Desktop) */}
              <div 
                className="hidden md:block absolute top-1/2 left-8 right-8 h-0.5 -translate-y-6 bg-gradient-to-r from-blue-500/20 via-teal-500/60 to-blue-500/20 animate-beam-flow pointer-events-none z-0" 
                aria-hidden="true" 
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                <div 
                  className={`rounded-xl border border-gray-400 bg-background-100 p-8 relative card-hover-elevate transition-all duration-700 ${
                    howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                  style={{ transitionDelay: '100ms' }}
                >
                  <div className="inline-flex items-center px-2 py-0.5 rounded bg-blue-500/10 text-blue-700 border border-blue-500/20 font-mono text-xs font-semibold mb-4">
                    01 / ENROLL
                  </div>
                  <h3 className="text-heading-20 font-semibold text-gray-1000 mb-2">Create &amp; Authenticate</h3>
                  <p className="text-copy-14 text-gray-900 leading-relaxed">
                    Register with your official student credentials. Link your LeetCode and GitHub profiles with instant verification.
                  </p>
                </div>

                <div 
                  className={`rounded-xl border border-gray-400 bg-background-100 p-8 relative card-hover-elevate transition-all duration-700 ${
                    howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                  style={{ transitionDelay: '250ms' }}
                >
                  <div className="inline-flex items-center px-2 py-0.5 rounded bg-teal-500/10 text-teal-700 border border-teal-500/20 font-mono text-xs font-semibold mb-4">
                    02 / LOG EXPERIENCES
                  </div>
                  <h3 className="text-heading-20 font-semibold text-gray-1000 mb-2">Document Proof</h3>
                  <p className="text-copy-14 text-gray-900 leading-relaxed">
                    Contribute interview experiences, project achievements, and event certificates to establish your standing on campus.
                  </p>
                </div>

                <div 
                  className={`rounded-xl border border-gray-400 bg-background-100 p-8 relative card-hover-elevate transition-all duration-700 ${
                    howItWorksInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                  }`}
                  style={{ transitionDelay: '400ms' }}
                >
                  <div className="inline-flex items-center px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 border border-purple-500/20 font-mono text-xs font-semibold mb-4">
                    03 / SCOUT &amp; CONNECT
                  </div>
                  <h3 className="text-heading-20 font-semibold text-gray-1000 mb-2">Direct Placement</h3>
                  <p className="text-copy-14 text-gray-900 leading-relaxed">
                    Get discovered by university recruiters through data-driven search filters matching exact job criteria.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================================
            7. CLOSING CTA
            =================================================================== */}
        <section ref={ctaRef} className="relative overflow-hidden py-28 md:py-36 border-t border-gray-400 bg-background-100 text-center">
          {/* Ambient Glow Aura */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-blue-500/15 via-teal-500/10 to-purple-500/15 blur-3xl pointer-events-none -z-10 animate-border-glow" />

          <div className={`mx-auto max-w-[800px] px-6 transition-all duration-800 ${
            ctaInView ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-6 scale-[0.98]'
          }`}>
            <h2 className="text-heading-40 md:text-heading-48 font-bold text-gray-1000 tracking-tight">
              Ready to elevate your campus placement journey?
            </h2>
            <p className="mt-4 text-copy-16 text-gray-900 max-w-xl mx-auto leading-relaxed">
              Join thousands of university students, placement cell administrators, and hiring teams building with verified data.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 animate-fade-in delay-200">
              {user ? (
                <Link
                  to={getDashboardLink()}
                  className="btn-shimmer-effect inline-flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-gray-1000 text-background-100 text-sm font-medium hover:opacity-90 transition-opacity w-full sm:w-auto shadow-xs"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="btn-shimmer-effect inline-flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-gray-1000 text-background-100 text-sm font-medium hover:opacity-90 transition-opacity w-full sm:w-auto shadow-xs"
                  >
                    <span>Get Started with Campus Connect</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/signin"
                    className="inline-flex items-center justify-center h-10 px-6 rounded-md border border-gray-400 bg-background-100 text-gray-1000 text-sm font-medium hover:bg-gray-100 hover:border-gray-500 transition-colors w-full sm:w-auto"
                  >
                    Sign In to Account
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ===================================================================
          PARALLAX CURTAIN SPACER
          Allows document to scroll past <main> by the exact height of the fixed footer
          =================================================================== */}
      <div 
        style={{ height: `${footerHeight}px` }} 
        className="w-full pointer-events-none relative -z-10" 
        aria-hidden="true" 
      />

      {/* ===================================================================
          8. FIXED PARALLAX CURTAIN BACKDROP FOOTER
          Occupies full viewport canvas behind <main>. As user scrolls past the
          Closing CTA, <main> rolls up like a curtain, smoothly unveiling this
          spacious architectural footer and the massive minimal "Campus Connect"
          signature across the bottom without any text collisions.
          =================================================================== */}
      <footer 
        ref={footerRef}
        className="fixed bottom-0 left-0 w-full z-0 bg-background-200 overflow-hidden select-none transition-colors"
      >
        {/* Top Deck: Clean 4-Column Navigation & Brand */}
        <div className="relative z-10 mx-auto max-w-[1220px] px-6 pt-10 md:pt-12 pb-2 w-full">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 font-semibold text-sm tracking-tight text-gray-1000 mb-2">
                <BrandLogo className="h-7 w-7" />
                <span className="font-sans font-bold">Campus Connect</span>
              </div>
              <p className="text-xs text-gray-900 max-w-sm leading-relaxed mb-3">
                The developer-first campus platform for verified student identities, algorithmic scouting, and placement transparency.
              </p>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-teal-500/20 bg-teal-500/10 text-[11px] font-mono text-teal-700">
                <span className="h-2 w-2 rounded-full bg-teal-600 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>

            <div>
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-700 mb-3">
                Platform
              </div>
              <ul className="space-y-2 text-xs text-gray-900 font-sans">
                <li><a href="#features" className="hover:text-gray-1000 transition-colors">Features</a></li>
                <li><Link to="/placements" className="hover:text-gray-1000 transition-colors">Interview Stories</Link></li>
                <li><Link to="/opportunities" className="hover:text-gray-1000 transition-colors">Opportunities</Link></li>
                <li><Link to="/clubs" className="hover:text-gray-1000 transition-colors">Campus Clubs</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-700 mb-3">
                For Users
              </div>
              <ul className="space-y-2 text-xs text-gray-900 font-sans">
                <li><Link to="/signin" className="hover:text-gray-1000 transition-colors">Student Login</Link></li>
                <li><Link to="/signup" className="hover:text-gray-1000 transition-colors">Register Account</Link></li>
                <li><Link to="/admin" className="hover:text-gray-1000 transition-colors">Recruiter Portal</Link></li>
                <li><Link to="/club" className="hover:text-gray-1000 transition-colors">Club Administration</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-mono font-semibold uppercase tracking-wider text-gray-700 mb-3">
                Appearance
              </div>
              <div className="pt-1">
                <ThemeSwitcher small />
              </div>
            </div>
          </div>
        </div>

        {/* Center/Bottom Deck: Massive Minimal 'Campus Connect' Grand Finale Signature */}
        <div className="w-full overflow-hidden select-none pointer-events-none px-4 py-1 text-center -my-2">
          <span className="geist-footer-typography block font-black tracking-tighter leading-none whitespace-nowrap transition-all">
            Campus Connect
          </span>
        </div>

        {/* Base Deck: Hairline Border with Copyright & Credentials */}
        <div className="border-t border-gray-400/40 w-full z-10">
          <div className="mx-auto max-w-[1220px] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-700 font-mono">
            <div>
              © 2026 Campus Connect Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <span>Architected for University Hiring</span>
              <span>Cryptographically Verified</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
