import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import PageHeader from '../components/ui/PageHeader';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Briefcase,
  MapPin,
  Clock,
  CheckCircle2,
  ExternalLink,
  RotateCw,
  Search,
  X,
  Sparkles,
  UploadCloud,
  FileText,
  AlertCircle,
  Building2,
  Calendar,
  IndianRupee,
  ArrowLeft,
  Loader2,
  Zap,
  GraduationCap,
  Layers,
  Check
} from 'lucide-react';

// Animated Compatibility Results with Dynamic Count-Up & Synchronized Gauge
function CompatibilityResults({ match, oppId }) {
  const [displayedScore, setDisplayedScore] = useState(0);
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    const end = Math.min(100, Math.max(0, parseInt(match.matchScore, 10) || 0));
    setDisplayedScore(0);
    setBarWidth(0);

    const startTime = performance.now();
    const duration = 1200; // 1.2s smooth count-up
    let frameId;

    // Small delay before progress bar starts expanding for dramatic effect
    const timeout = setTimeout(() => {
      setBarWidth(end);
    }, 50);

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Quintic ease out (1 - (1-t)^5) for a responsive kick and luxurious deceleration
      const easeOut = 1 - Math.pow(1 - progress, 5);
      const current = Math.round(end * easeOut);
      setDisplayedScore(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timeout);
    };
  }, [match.matchScore, oppId]);

  return (
    <div className="relative z-10 pt-3 border-t border-purple-500/20 flex flex-col gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold font-mono text-gray-1000 tracking-tight tabular-nums">
            {displayedScore}%
          </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-purple-200/90 font-mono">
            AI Match Score
          </span>
        </div>

        <div>
          {match.matchScore >= 75 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              High Compatibility
            </span>
          ) : match.matchScore >= 50 ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Moderate Alignment
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
              <AlertCircle className="w-3.5 h-3.5" />
              Developing Match
            </span>
          )}
        </div>
      </div>

      {/* Progress Gauge with synchronized smooth animation */}
      <div className="w-full h-2 rounded-full bg-background-200/80 border border-purple-500/20 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 transition-all duration-1000 ease-out rounded-full shadow-xs"
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Reasoning Feedback */}
      {match.reasoning && (
        <p className="text-xs text-gray-800 dark:text-purple-100/95 font-sans leading-relaxed">
          {match.reasoning}
        </p>
      )}

      {/* Matching Skills Chips */}
      {match.matchingSkills && match.matchingSkills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-mono text-gray-700 dark:text-purple-200/80 mr-1">Matched Skills:</span>
          {match.matchingSkills.map((sk, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <Check className="w-2.5 h-2.5 text-emerald-600" />
              {sk}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Opportunities() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [sortBy, setSortBy] = useState('recent');
  const [activeTab, setActiveTab] = useState('all');
  const [appliedOppIds, setAppliedOppIds] = useState(new Set());
  const [mobileDetailView, setMobileDetailView] = useState(false);

  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [uploadMode, setUploadMode] = useState(false);

  // AI Compatibility Check state
  const [userApplications, setUserApplications] = useState({});
  const [compatibilityResults, setCompatibilityResults] = useState({});
  const [evaluatingCompatibility, setEvaluatingCompatibility] = useState(false);
  const [isCompatModalOpen, setIsCompatModalOpen] = useState(false);
  const [compatResumeId, setCompatResumeId] = useState('');
  const [compatResumeFile, setCompatResumeFile] = useState(null);
  const [compatUploadMode, setCompatUploadMode] = useState(false);

  useEffect(() => {
    if (isApplyModalOpen || isCompatModalOpen) {
      if (user?.resumes?.length > 0) {
        setUploadMode(false);
        setCompatUploadMode(false);
        const defaultId = user.resumes[0]._id || user.resumes[0];
        setSelectedResumeId(defaultId);
        setCompatResumeId(defaultId);
      } else {
        setUploadMode(true);
        setCompatUploadMode(true);
      }
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isApplyModalOpen, isCompatModalOpen, user]);

  const fetchOpportunities = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {};
      if (selectedType && selectedType !== 'ALL') params.type = selectedType;

      const res = await axios.get('/opportunities', { params });
      const list = res.data.opportunities || [];
      setOpportunities(list);
      if (res.data.appliedOppIds) {
        setAppliedOppIds(new Set(res.data.appliedOppIds));
      }
      if (res.data.userApplications) {
        setUserApplications(res.data.userApplications);
      }

      // Maintain selection or select first item
      if (list.length > 0) {
        setSelectedOpp((prev) => {
          if (!prev || !list.find((o) => o._id === prev._id)) {
            return list[0];
          }
          return prev;
        });
      } else {
        setSelectedOpp(null);
      }
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      showToast('Failed to load opportunities', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [selectedType]);

  // Client-side filtering for scope tab, search query, and sorting
  const filteredOpportunities = useMemo(() => {
    let list = [...opportunities];

    // Scope Tab: 'applied' vs 'all'
    if (activeTab === 'applied') {
      list = list.filter((opp) => appliedOppIds.has(opp._id));
    }

    // Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (opp) =>
          opp.title?.toLowerCase().includes(q) ||
          opp.company?.toLowerCase().includes(q) ||
          opp.location?.toLowerCase().includes(q) ||
          opp.requiredSkills?.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    return list;
  }, [opportunities, activeTab, appliedOppIds, searchQuery, sortBy]);

  const handleApplySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOpp) return;

    if (!uploadMode && !selectedResumeId && (!user?.resumes || user.resumes.length === 0)) {
      showToast('Please select a resume or upload a new one.', 'error');
      return;
    }

    setApplying(true);
    try {
      const formData = new FormData();
      if (uploadMode && resumeFile) {
        formData.append('resume', resumeFile);
      } else if (!uploadMode && selectedResumeId) {
        formData.append('resumeId', selectedResumeId);
      } else if (!uploadMode && user?.resumes?.length > 0 && !selectedResumeId) {
        formData.append('resumeId', user.resumes[0]._id || user.resumes[0]);
      }

      const res = await axios.post(`/opportunities/${selectedOpp._id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast(res.data.message || 'Application submitted successfully!', 'success');
      setAppliedOppIds((prev) => new Set(prev).add(selectedOpp._id));
      setIsApplyModalOpen(false);
      setResumeFile(null);
      setSelectedResumeId('');
    } catch (err) {
      console.error('Error applying for opportunity:', err);
      const msg = err.response?.data?.message || 'Failed to submit application';
      showToast(msg, 'error');
    } finally {
      setApplying(false);
    }
  };

  const handleCheckCompatibility = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOpp) return;

    if (compatUploadMode && !compatResumeFile) {
      showToast('Please upload a resume PDF to check compatibility.', 'error');
      return;
    }

    setEvaluatingCompatibility(true);
    try {
      const formData = new FormData();
      if (compatUploadMode && compatResumeFile) {
        formData.append('resume', compatResumeFile);
      } else if (!compatUploadMode && compatResumeId) {
        formData.append('resumeId', compatResumeId);
      } else if (user?.resumes?.length > 0) {
        formData.append('resumeId', user.resumes[0]._id || user.resumes[0]);
      }

      const res = await axios.post(`/opportunities/${selectedOpp._id}/compatibility`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setCompatibilityResults((prev) => ({
        ...prev,
        [selectedOpp._id]: res.data
      }));

      showToast(`AI Match computed: ${res.data.matchScore}% Match!`, 'success');
      setIsCompatModalOpen(false);
      setCompatResumeFile(null);
    } catch (err) {
      console.error('Error evaluating compatibility:', err);
      const msg = err.response?.data?.message || 'Failed to evaluate compatibility';
      showToast(msg, 'error');
    } finally {
      setEvaluatingCompatibility(false);
    }
  };

  const isApplied = selectedOpp && appliedOppIds.has(selectedOpp._id);

  const formatDateShort = (dateStr) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? 'Recently'
      : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatDateLong = (dateStr) => {
    if (!dateStr) return 'Recently';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? 'Recently' : d.toLocaleDateString();
  };

  const getTypeBadgeStyles = (type) => {
    switch (type?.toLowerCase()) {
      case 'internship':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      case 'aedp':
      case 'pli':
        return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'full-time':
      case 'regular':
      default:
        return 'bg-background-200 text-gray-1000 border-gray-400 font-medium';
    }
  };

  // Scope Tabs definition
  const tabs = [
    {
      id: 'all',
      label: 'All Roles',
      count: opportunities.length,
      icon: Briefcase
    },
    ...(user
      ? [
          {
            id: 'applied',
            label: 'Applied',
            count: appliedOppIds.size,
            icon: CheckCircle2
          }
        ]
      : [])
  ];

  // Header Actions Cluster
  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => fetchOpportunities(true)}
        className="h-9 px-3 rounded-lg border border-gray-400 bg-background-100 text-xs font-medium text-gray-1000 hover:bg-background-200 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
        title="Refresh opportunities list"
      >
        <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background-100 text-gray-1000 font-sans selection:bg-gray-1000 selection:text-background-100">
      <Sidebar />
      <main className={`flex-1 min-w-0 bg-background-100 ${isApplyModalOpen ? 'overflow-hidden' : ''}`}>
        <Topbar />

        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
          {/* Standardized Level 1 & 2 Page Header with Scope Tabs */}
          <PageHeader
            category="Careers & Recruitment"
            title="Campus Opportunities"
            description="Explore full-time placement drives, internships, AEDP, and specialized company roles curated for your campus."
            actions={headerActions}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => {
              setActiveTab(tabId);
              setMobileDetailView(false);
            }}
          />

          {/* Level 3: Unified Single-Row Search & Filter Toolbar */}
          <div className="bg-background-100 border border-gray-400 rounded-xl p-2.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-gray-600 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search jobs by role, company, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-9 pr-8 bg-transparent text-xs text-gray-1000 placeholder:text-gray-600 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-gray-600 hover:text-gray-1000 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: Filter Dropdown & Sort */}
            <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-400 sm:border-l sm:pl-3">
              {/* Role Type Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-gray-700 hidden md:inline">Type:</span>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="h-8 px-2.5 bg-background-200 border border-gray-400 rounded-lg text-xs font-medium text-gray-1000 hover:border-gray-500 focus:outline-none focus:border-gray-600 transition-colors cursor-pointer"
                >
                  <option value="ALL" className="bg-background-200 text-gray-1000">All Types</option>
                  <option value="full-time" className="bg-background-200 text-gray-1000">Full-time</option>
                  <option value="internship" className="bg-background-200 text-gray-1000">Internship</option>
                  <option value="AEDP" className="bg-background-200 text-gray-1000">AEDP</option>
                  <option value="PLI" className="bg-background-200 text-gray-1000">PLI</option>
                  <option value="REGULAR" className="bg-background-200 text-gray-1000">Regular</option>
                  <option value="contract" className="bg-background-200 text-gray-1000">Contract</option>
                </select>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-gray-700 hidden md:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-8 px-2.5 bg-background-200 border border-gray-400 rounded-lg text-xs font-medium text-gray-1000 hover:border-gray-500 focus:outline-none focus:border-gray-600 transition-colors cursor-pointer"
                >
                  <option value="recent" className="bg-background-200 text-gray-1000">Newest</option>
                  <option value="title" className="bg-background-200 text-gray-1000">Role (A - Z)</option>
                </select>
              </div>

              <span className="text-xs font-mono text-gray-600 hidden sm:inline px-1 select-none">
                Showing {filteredOpportunities.length} of {opportunities.length}
              </span>
            </div>
          </div>

          {/* Master-Detail Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Opportunities List (5 cols on desktop) */}
            <div
              className={`lg:col-span-5 flex flex-col space-y-3 lg:sticky lg:top-20 ${
                mobileDetailView ? 'hidden lg:block' : 'block'
              }`}
            >
              <div className="flex items-center justify-between pb-1 text-xs font-mono text-gray-600 shrink-0">
                <span>
                  {filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'Opportunity' : 'Opportunities'}
                </span>
                <span className="text-[11px] uppercase tracking-wider">
                  {activeTab === 'applied' ? 'Applied Only' : selectedType === 'ALL' ? 'All Roles' : selectedType}
                </span>
              </div>

              {loading ? (
                /* Skeleton Placeholders */
                <div className="space-y-3 lg:max-h-[calc(100vh-17rem)] lg:overflow-y-auto pr-1.5 custom-scrollbar">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="bg-background-100 border border-gray-400 rounded-xl p-4.5 animate-pulse space-y-3 shadow-2xs"
                    >
                      <div className="flex justify-between items-start">
                        <div className="w-2/3 h-4 bg-background-200 rounded" />
                        <div className="w-14 h-4 bg-background-200 rounded" />
                      </div>
                      <div className="w-1/2 h-3 bg-background-200 rounded" />
                      <div className="flex gap-1.5 pt-1">
                        <div className="w-12 h-4 bg-background-200 rounded" />
                        <div className="w-16 h-4 bg-background-200 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredOpportunities.length === 0 ? (
                /* Empty State */
                <div className="bg-background-100 border border-dashed border-gray-400 rounded-2xl p-8 text-center space-y-3 shadow-2xs">
                  <div className="w-10 h-10 rounded-xl bg-background-200 border border-gray-400 text-gray-700 mx-auto flex items-center justify-center">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-1000">
                      {activeTab === 'applied' ? 'No applications submitted yet' : 'No opportunities found'}
                    </h3>
                    <p className="text-xs text-gray-700 font-sans">
                      {activeTab === 'applied'
                        ? 'Browse available campus roles and apply with your verified resume.'
                        : 'Try adjusting your search query or switching the opportunity type filter.'}
                    </p>
                  </div>
                  {activeTab === 'applied' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className="h-8 px-4 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity shadow-xs cursor-pointer"
                    >
                      Browse All Roles
                    </button>
                  )}
                </div>
              ) : (
                /* Job Cards Stream - Scrollable Container */
                <div className="space-y-2.5 lg:max-h-[calc(100vh-17rem)] lg:overflow-y-auto pr-1.5 custom-scrollbar pb-2">
                  {filteredOpportunities.map((opp) => {
                    const isSelected = selectedOpp && selectedOpp._id === opp._id;
                    const hasApplied = appliedOppIds.has(opp._id);

                    return (
                      <div
                        key={opp._id}
                        onClick={() => {
                          setSelectedOpp(opp);
                          setMobileDetailView(true);
                        }}
                        className={`p-4 rounded-xl border transition-all cursor-pointer shadow-2xs text-left relative overflow-hidden group ${
                          isSelected
                            ? 'border-gray-800 dark:border-gray-200 bg-background-200/80 shadow-xs'
                            : 'border-gray-400 bg-background-100 hover:border-gray-500 hover:bg-background-200/50'
                        }`}
                      >
                        {/* Active Selection Indicator Stripe on Left */}
                        {isSelected && (
                          <span className="absolute left-0 top-3 bottom-3 w-1 bg-gray-1000 rounded-r" />
                        )}

                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h3 className="font-bold text-sm line-clamp-1 leading-snug text-gray-1000">
                            {opp.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase border font-semibold shrink-0 ${getTypeBadgeStyles(opp.opportunityType)}`}>
                            {opp.opportunityType}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-700 mb-2.5 gap-2">
                          <span className="font-medium text-gray-1000 flex items-center gap-1.5 truncate">
                            {opp.companyLogo ? (
                              <img 
                                src={opp.companyLogo} 
                                alt={opp.company} 
                                className="w-3.5 h-3.5 rounded object-contain shrink-0 bg-background-200 border border-gray-400 p-0.5" 
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <Building2 className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                            )}
                            <span className="truncate">{opp.company}</span>
                          </span>
                          {opp.location && (
                            <span className="flex items-center gap-1 text-gray-800 text-[11px] shrink-0">
                              <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                              <span className="truncate">{opp.location}</span>
                            </span>
                          )}
                        </div>

                        {/* Skills Pills */}
                        {opp.requiredSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {opp.requiredSkills.slice(0, 3).map((skill, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 text-[10px] font-mono text-gray-1000 bg-background-200 rounded border border-gray-400"
                              >
                                {skill}
                              </span>
                            ))}
                            {opp.requiredSkills.length > 3 && (
                              <span className="text-[10px] font-mono text-gray-800 self-center">
                                +{opp.requiredSkills.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer Status, Stipend & Date */}
                        <div className="flex justify-between items-center text-[11px] font-mono text-gray-700 pt-1.5 border-t border-gray-400">
                          <span className="flex items-center gap-1 text-gray-800">
                            <Clock className="w-3 h-3 text-gray-500" />
                            {formatDateShort(opp.createdAt || opp.postedDate || opp.updatedAt)}
                          </span>

                          <div className="flex items-center gap-2">
                            {opp.stipendOrSalary && (
                              <span className="inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold text-gray-1000">
                                <IndianRupee className="w-3 h-3 text-gray-500" />
                                <span>{opp.stipendOrSalary.replace(/^₹/, '')}</span>
                              </span>
                            )}
                            {hasApplied && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                                <CheckCircle2 className="w-3 h-3" />
                                Applied
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Opportunity Detail View (7 cols on desktop) */}
            <div
              className={`lg:col-span-7 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto custom-scrollbar ${
                mobileDetailView ? 'block' : 'hidden lg:block'
              }`}
            >
              {/* Mobile Back to List Button */}
              <button
                type="button"
                onClick={() => setMobileDetailView(false)}
                className="lg:hidden mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-1000 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Job Listings</span>
              </button>

              {selectedOpp ? (
                <div className="bg-background-100 border border-gray-400 rounded-xl p-6 shadow-2xs space-y-6">
                  {/* Top Header & Apply CTA */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-400">
                    <div>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase rounded border ${getTypeBadgeStyles(selectedOpp.opportunityType)}`}>
                          {selectedOpp.opportunityType}
                        </span>
                        <span className="text-[11px] font-mono text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          Posted {formatDateLong(selectedOpp.createdAt || selectedOpp.postedDate || selectedOpp.updatedAt)}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-1000">
                        {selectedOpp.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-800 font-sans mt-1.5 flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-1000 flex items-center gap-1.5">
                          {selectedOpp.companyLogo ? (
                            <img 
                              src={selectedOpp.companyLogo} 
                              alt={selectedOpp.company} 
                              className="w-4 h-4 rounded object-contain shrink-0 bg-background-200 border border-gray-400 p-0.5" 
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <Building2 className="w-4 h-4 text-gray-500" />
                          )}
                          {selectedOpp.company}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="flex items-center gap-1 text-gray-800">
                          <MapPin className="w-3.5 h-3.5 text-gray-500" />
                          {selectedOpp.location}
                        </span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsApplyModalOpen(true)}
                      disabled={isApplied || applying}
                      className={`h-9 px-5 rounded-lg text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer ${
                        isApplied
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 cursor-default'
                          : 'bg-gray-1000 text-background-100 hover:opacity-90 active:scale-[0.98]'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-3.5 h-3.5" />
                          <span>Apply Now</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* AI Match Feature Banner (AI Powered Purple Tint & Live Compatibility Engine) */}
                  {(() => {
                    const currentMatch = compatibilityResults[selectedOpp._id] || (
                      userApplications[selectedOpp._id]?.matchScoreCalculated
                        ? {
                            matchScore: userApplications[selectedOpp._id].matchScore,
                            reasoning: userApplications[selectedOpp._id].matchDetails?.reasoning,
                            matchingSkills: [],
                            missingSkills: []
                          }
                        : null
                    );

                    return (
                      <div className="relative overflow-hidden p-4 sm:p-5 rounded-xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-purple-500/5 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-purple-900/15 border border-purple-500/30 dark:border-purple-500/40 hover:border-purple-500/50 flex flex-col gap-3.5 shadow-xs shadow-purple-500/5 transition-all duration-300">
                        <div className="absolute -top-10 -right-10 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
                        
                        {/* Header & Trigger Row */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/30 ring-1 ring-purple-400/30">
                              <Sparkles className="w-4 h-4 text-white animate-pulse" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs text-gray-1000 flex items-center gap-2 flex-wrap">
                                AI Resume Match & Compatibility
                                <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded-full bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-purple-600 dark:text-purple-400" />
                                  AI Powered
                                </span>
                              </h4>
                              <p className="text-xs text-gray-900 dark:text-purple-200/95 font-medium mt-0.5 leading-normal">
                                Evaluates semantic alignment with your profile and uploaded skills.
                              </p>
                            </div>
                          </div>

                          {/* Action Button: Check Compatibility (NO Apply button) */}
                          {!currentMatch ? (
                            <button
                              type="button"
                              onClick={() => setIsCompatModalOpen(true)}
                              disabled={evaluatingCompatibility}
                              className="relative z-10 h-8 px-3.5 rounded-lg border border-purple-500/40 bg-background-100 dark:bg-background-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
                            >
                              {evaluatingCompatibility ? (
                                <>
                                  <RotateCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 animate-spin" />
                                  <span>Calculating Match...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                  <span>Check Compatibility</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setIsCompatModalOpen(true)}
                              disabled={evaluatingCompatibility}
                              className="relative z-10 h-8 px-3 rounded-lg border border-purple-500/40 bg-background-100 dark:bg-background-200 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs active:scale-[0.98] disabled:opacity-50"
                            >
                              <RotateCw className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              <span>Re-check Resume</span>
                            </button>
                          )}
                        </div>

                        {/* Calculated Compatibility Results Display with Count-up Animation */}
                        {currentMatch && (
                          <CompatibilityResults match={currentMatch} oppId={selectedOpp._id} />
                        )}
                      </div>
                    );
                  })()}

                  {/* 4-Stat Metric Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-background-200/70 border border-gray-400 rounded-xl p-3 hover:border-gray-500 transition-colors">
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-700 uppercase tracking-wider mb-1">
                        <span>Type</span>
                        <Layers className="w-3 h-3 text-gray-500" />
                      </div>
                      <span className="font-semibold text-gray-1000 text-xs capitalize truncate block">
                        {selectedOpp.opportunityType}
                      </span>
                    </div>

                    <div className="bg-background-200/70 border border-gray-400 rounded-xl p-3 hover:border-gray-500 transition-colors">
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-700 uppercase tracking-wider mb-1">
                        <span>Location</span>
                        <MapPin className="w-3 h-3 text-gray-500" />
                      </div>
                      <span className="font-semibold text-gray-1000 text-xs truncate block">
                        {selectedOpp.location}
                      </span>
                    </div>

                    <div className="bg-background-200/70 border border-gray-400 rounded-xl p-3 hover:border-gray-500 transition-colors">
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-700 uppercase tracking-wider mb-1">
                        <span>Experience</span>
                        <GraduationCap className="w-3 h-3 text-gray-500" />
                      </div>
                      <span className="font-semibold text-gray-1000 text-xs truncate block">
                        {selectedOpp.experienceLevel || 'Entry Level'}
                      </span>
                    </div>

                    <div className="bg-background-200/70 border border-gray-400 rounded-xl p-3 hover:border-gray-500 transition-colors">
                      <div className="flex items-center justify-between text-[10px] font-mono text-gray-700 uppercase tracking-wider mb-1">
                        <span>Stipend / Salary</span>
                        <IndianRupee className="w-3 h-3 text-gray-500" />
                      </div>
                      <span className="font-bold font-mono text-gray-1000 text-xs truncate block">
                        {selectedOpp.stipendOrSalary || 'As per norms'}
                      </span>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-gray-1000 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                      <span>Role Description & Responsibilities</span>
                    </h3>
                    <div className="text-xs sm:text-sm text-gray-800 font-sans leading-relaxed whitespace-pre-line bg-background-200/40 p-4 rounded-xl border border-gray-400/60">
                      {selectedOpp.jobDescription}
                    </div>
                  </div>

                  {/* Required Skills & Insights */}
                  <div className="space-y-2.5">
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-gray-1000 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-gray-500" />
                      <span>Required Skills & Competencies</span>
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedOpp.requiredSkills?.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-background-200 hover:bg-background-100 text-gray-1000 rounded-lg text-xs font-mono font-medium border border-gray-400 hover:border-gray-500 transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer Meta & Application Portal */}
                  <div className="pt-4 border-t border-gray-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-gray-700">
                    <div className="flex items-center gap-3">
                      <span>
                        Status: <strong className="text-gray-1000 font-semibold">{selectedOpp.isActive ? 'Active' : 'Closed'}</strong>
                      </span>
                      {selectedOpp.deadline && (
                        <span>
                          Deadline: <strong className="text-gray-1000 font-mono">{new Date(selectedOpp.deadline).toLocaleDateString()}</strong>
                        </span>
                      )}
                    </div>

                    {selectedOpp.applyLink && (
                      <a
                        href={selectedOpp.applyLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-1000 hover:underline"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-background-100 border border-dashed border-gray-400 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3 shadow-2xs">
                  <Briefcase className="w-8 h-8 text-gray-500" />
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-1000">Select an Opportunity</h3>
                    <p className="text-xs text-gray-600 font-sans max-w-sm">
                      Choose a role from the left list to review detailed descriptions, skills, and submit your application.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Apply with Resume Modal (Geist Dialog) */}
        {isApplyModalOpen && selectedOpp && (
          <div 
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsApplyModalOpen(false);
            }}
          >
            <div className="bg-background-100 border border-gray-400 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-start border-b border-gray-400 pb-4">
                <div>
                  <h3 className="font-bold text-base text-gray-1000">
                    Apply for Role
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {selectedOpp.title} • {selectedOpp.company}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="p-1 rounded-md text-gray-600 hover:text-gray-1000 hover:bg-background-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleApplySubmit} className="space-y-5">
                {/* Mode Switcher Tabs */}
                {user?.resumes && user.resumes.length > 0 && (
                  <div className="flex bg-background-200 p-1 rounded-xl border border-gray-400">
                    <button
                      type="button"
                      onClick={() => setUploadMode(false)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        !uploadMode
                          ? 'bg-background-100 text-gray-1000 font-semibold shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Select Saved Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode(true)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        uploadMode
                          ? 'bg-background-100 text-gray-1000 font-semibold shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Upload Custom PDF
                    </button>
                  </div>
                )}

                {/* Option A: Select Existing Resume */}
                {!uploadMode && user?.resumes && user.resumes.length > 0 ? (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-600">
                      Choose From Saved Resumes
                    </label>
                    {user.resumes.map((res) => {
                      const resId = res._id || res;
                      const isSelected = selectedResumeId === resId;

                      return (
                        <div
                          key={resId}
                          onClick={() => setSelectedResumeId(resId)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between shadow-2xs ${
                            isSelected
                              ? 'border-gray-1000 bg-background-200/80 ring-1 ring-gray-1000'
                              : 'border-gray-400 bg-background-100 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-gray-1000 text-background-100'
                                  : 'bg-background-200 text-gray-700'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-medium text-gray-1000 truncate">
                                {res.fileName || 'Resume Document.pdf'}
                              </p>
                              <p className="text-[10px] font-mono text-gray-600">
                                Skills parsed: {res.parsedData?.skills?.length || 0}
                              </p>
                            </div>
                          </div>

                          {res.fileUrl && (
                            <a
                              href={res.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-gray-600 hover:text-gray-1000 transition-colors"
                              title="Preview PDF"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Option B: Upload New PDF Resume */
                  <div className="space-y-2">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-600">
                      Attach Custom PDF Resume
                    </label>
                    <div className="border border-dashed border-gray-400 hover:border-gray-700 bg-background-200/50 rounded-xl p-6 text-center transition-colors relative cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setResumeFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {resumeFile ? (
                        <div className="text-xs font-medium text-gray-900 flex flex-col items-center gap-1.5">
                          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-semibold text-gray-1000">{resumeFile.name}</span>
                          <span className="text-[10px] font-mono text-gray-600">Click to replace PDF</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-gray-600">
                          <UploadCloud className="w-7 h-7 text-gray-500 mb-0.5" />
                          <span className="text-xs font-medium text-gray-900">Upload PDF resume</span>
                          <span className="text-[11px] font-sans">
                            Drag & drop or click to select file
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-400">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="h-9 px-4 rounded-lg border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-800 transition-colors cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="h-9 px-5 rounded-lg bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {applying ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-3.5 h-3.5" />
                        <span>Submit Application</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* AI Compatibility Check Modal (Geist Dialog) */}
        {isCompatModalOpen && selectedOpp && (
          <div 
            className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCompatModalOpen(false);
            }}
          >
            <div className="bg-background-100 border border-purple-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-start border-b border-gray-400 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/30">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-1000 flex items-center gap-2">
                      AI Compatibility Analyzer
                    </h3>
                    <p className="text-xs text-gray-600 mt-0.5">
                      {selectedOpp.title} &bull; {selectedOpp.company}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCompatModalOpen(false)}
                  className="p-1 rounded-md text-gray-600 hover:text-gray-1000 hover:bg-background-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCheckCompatibility} className="space-y-5">
                {/* Mode Switcher Tabs */}
                {user?.resumes && user.resumes.length > 0 && (
                  <div className="flex bg-background-200 p-1 rounded-xl border border-gray-400">
                    <button
                      type="button"
                      onClick={() => setCompatUploadMode(false)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        !compatUploadMode
                          ? 'bg-background-100 text-gray-1000 font-semibold shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Select Saved Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompatUploadMode(true)}
                      className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        compatUploadMode
                          ? 'bg-background-100 text-gray-1000 font-semibold shadow-2xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Upload Custom PDF to Test
                    </button>
                  </div>
                )}

                {/* Option A: Select Existing Resume */}
                {!compatUploadMode && user?.resumes && user.resumes.length > 0 ? (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-600">
                      Choose Resume to Benchmark
                    </label>
                    {user.resumes.map((res) => {
                      const resId = res._id || res;
                      const isSelected = compatResumeId === resId;

                      return (
                        <div
                          key={resId}
                          onClick={() => setCompatResumeId(resId)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between shadow-2xs ${
                            isSelected
                              ? 'border-purple-600 bg-purple-500/10 ring-1 ring-purple-600'
                              : 'border-gray-400 bg-background-100 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-background-200 text-gray-700'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-medium text-gray-1000 truncate">
                                {res.fileName || 'Resume Document.pdf'}
                              </p>
                              <p className="text-[10px] font-mono text-gray-600">
                                Skills parsed: {res.parsedData?.skills?.length || 0}
                              </p>
                            </div>
                          </div>

                          {res.fileUrl && (
                            <a
                              href={res.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-gray-600 hover:text-gray-1000 transition-colors"
                              title="Preview PDF"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Option B: Upload New PDF Resume to Test */
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-[11px] font-mono uppercase tracking-wider text-gray-700 dark:text-gray-900 font-semibold">
                        Upload External PDF to Test
                      </label>
                      <span className="text-[10px] font-mono font-medium text-purple-600 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        Testing only &bull; Not saved to vault
                      </span>
                    </div>
                    <div className="border border-dashed border-purple-500/40 hover:border-purple-500 dark:border-purple-400/40 dark:hover:border-purple-400/80 bg-purple-500/5 hover:bg-purple-500/10 rounded-xl p-6 text-center transition-all relative cursor-pointer group">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setCompatResumeFile(e.target.files[0])}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                      {compatResumeFile ? (
                        <div className="text-xs font-medium flex flex-col items-center gap-1.5">
                          <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                          <span className="font-semibold text-gray-1000 text-sm">{compatResumeFile.name}</span>
                          <span className="text-[11px] font-mono text-purple-700 dark:text-purple-300">
                            Ready to test &bull; Click to change PDF
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-600 dark:text-purple-300 group-hover:scale-105 transition-transform">
                            <UploadCloud className="w-5 h-5" />
                          </div>
                          <span className="text-xs sm:text-sm font-bold text-gray-1000">
                            Upload PDF resume
                          </span>
                          <span className="text-xs text-gray-700 dark:text-purple-200/90 max-w-xs leading-relaxed">
                            Evaluated in-memory for testing (never saved to your resume vault)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-400">
                  <button
                    type="button"
                    onClick={() => setIsCompatModalOpen(false)}
                    className="h-9 px-4 rounded-lg border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-800 transition-colors cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={evaluatingCompatibility}
                    className="h-9 px-5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition-opacity flex items-center justify-center gap-1.5 shadow-xs shadow-purple-500/25 disabled:opacity-50 cursor-pointer"
                  >
                    {evaluatingCompatibility ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating Match...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run AI Compatibility Test</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
