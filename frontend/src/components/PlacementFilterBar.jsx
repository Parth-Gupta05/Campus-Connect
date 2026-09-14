import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ChevronDown,
  Clock,
  TrendingUp,
  MessageSquare,
  IndianRupee,
  RotateCcw,
  SlidersHorizontal,
  Check
} from 'lucide-react';

export default function PlacementFilterBar({
  filters,
  onChange,
  onReset,
  meta = {},
  totalCount = 0
}) {
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const filterRef = useRef(null);
  const companyRef = useRef(null);

  // Local debounced search query state
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  // Sync external search resets
  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if ((filters.search || '') !== localSearch) {
        onChange({ ...filters, search: localSearch, page: 1 });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearch]);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setIsFilterPopoverOpen(false);
      }
      if (companyRef.current && !companyRef.current.contains(e.target)) {
        setIsCompanyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  // Count active criteria (excluding sort, search, page, limit, bookmarkedOnly, myPostsOnly which are views)
  const activeFilterKeys = [
    'company',
    'outcome',
    'difficulty',
    'postType',
    'jobType',
    'assessmentType',
    'interviewType'
  ];

  const activeFilters = activeFilterKeys.filter((k) => Boolean(filters[k]));
  const activeCount = activeFilters.length;

  const postTypes = [
    { value: '', label: 'All Post Types' },
    { value: 'interview_experience', label: 'Interview Experiences' },
    { value: 'assessment_experience', label: 'Online Assessments / Tests' },
    { value: 'offer_received', label: 'Offer Received' },
    { value: 'rejection_experience', label: 'Rejection & Learnings' },
    { value: 'referral_share', label: 'Referral Opportunities' },
    { value: 'tips_and_advice', label: 'Preparation Tips & Guides' }
  ];

  const difficulties = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' },
    { value: 'very_hard', label: 'Very Hard' }
  ];

  const outcomes = [
    { value: 'selected', label: 'Selected' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'waitlisted', label: 'Waitlisted' },
    { value: 'in_process', label: 'In Process' }
  ];

  const jobTypes = [
    { value: 'full_time', label: 'Full-Time' },
    { value: 'internship', label: 'Internship' },
    { value: 'contract', label: 'Contract' }
  ];

  const assessmentTypes = [
    { value: 'coding_round', label: 'Coding Round' },
    { value: 'online_test', label: 'Online Test' },
    { value: 'mcq', label: 'MCQs' },
    { value: 'aptitude', label: 'Aptitude' },
    { value: 'case_study', label: 'Case Study' },
    { value: 'group_discussion', label: 'Group Discussion' },
    { value: 'hackathon', label: 'Hackathon' },
    { value: 'take_home_assignment', label: 'Assignment' }
  ];

  const interviewTypes = [
    { value: 'technical', label: 'Technical' },
    { value: 'system_design', label: 'System Design' },
    { value: 'hr', label: 'HR Round' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'managerial', label: 'Managerial' },
    { value: 'panel', label: 'Panel Interview' }
  ];

  const getFilterLabel = (key, val) => {
    switch (key) {
      case 'outcome': return outcomes.find((o) => o.value === val)?.label || val;
      case 'difficulty': return difficulties.find((d) => d.value === val)?.label || val;
      case 'postType': return postTypes.find((p) => p.value === val)?.label || val;
      case 'jobType': return jobTypes.find((j) => j.value === val)?.label || val;
      case 'assessmentType': return assessmentTypes.find((a) => a.value === val)?.label || val;
      case 'interviewType': return interviewTypes.find((i) => i.value === val)?.label || val;
      default: return val;
    }
  };

  return (
    <div className="space-y-2.5 select-none font-sans">
      {/* Main Single-Row Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
        {/* Search Input (Takes flexible remaining width) */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search company, role (e.g. SDE), topics (DSA, React)..."
            className="w-full h-9 pl-9 pr-9 rounded-lg border border-gray-400 bg-background-100 text-gray-1000 placeholder:text-gray-500 focus:outline-none focus:border-gray-1000 focus:ring-1 focus:ring-gray-1000 transition-all text-xs font-medium shadow-2xs"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onChange({ ...filters, search: '', page: 1 });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-1000 p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls Cluster: Company Dropdown + Unified Filters + Sort */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Quick Company Filter Dropdown */}
          {meta.companies && meta.companies.length > 0 && (
            <div className="relative" ref={companyRef}>
              <button
                type="button"
                onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                className={`h-9 px-3.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  filters.company
                    ? 'border-gray-1000 bg-gray-1000 text-background-100 font-semibold'
                    : 'border-gray-400 bg-background-100 text-gray-800 hover:text-gray-1000 hover:bg-gray-200'
                }`}
              >
                <span>{filters.company || 'Company'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isCompanyDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isCompanyDropdownOpen && (
                <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-56 max-h-60 overflow-y-auto bg-background-100 border border-gray-400 rounded-xl shadow-2xl z-50 p-1 text-gray-1000 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      handleFilterChange('company', '');
                      setIsCompanyDropdownOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 text-gray-700 hover:text-gray-1000 cursor-pointer"
                  >
                    All Companies
                  </button>
                  {meta.companies.map((comp) => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => {
                        handleFilterChange('company', comp);
                        setIsCompanyDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        filters.company === comp
                          ? 'bg-background-200 text-gray-1000 font-semibold'
                          : 'hover:bg-gray-200 text-gray-800 hover:text-gray-1000'
                      }`}
                    >
                      {comp}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Unified "Filters" Popover Button */}
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterPopoverOpen(!isFilterPopoverOpen)}
              className={`h-9 px-3.5 rounded-lg border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                activeCount > 0
                  ? 'border-gray-1000 bg-gray-1000 text-background-100 font-semibold'
                  : 'border-gray-400 bg-background-100 text-gray-800 hover:text-gray-1000 hover:bg-gray-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-background-100 text-gray-1000 text-[10px] font-mono font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>

            {/* High-End Multi-Section Filters Popover Panel */}
            {isFilterPopoverOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[80vh] overflow-y-auto bg-background-100 border border-gray-400 rounded-xl shadow-2xl z-50 p-4 space-y-4 text-gray-1000 animate-in fade-in zoom-in-95 duration-150 custom-scrollbar">
                <div className="flex items-center justify-between pb-2 border-b border-gray-400">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-gray-1000" />
                    <span className="font-semibold text-xs text-gray-1000 tracking-tight">Filter Experiences</span>
                  </div>
                  {activeCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        activeFilterKeys.forEach((k) => handleFilterChange(k, ''));
                      }}
                      className="text-[11px] text-red-500 hover:underline cursor-pointer font-medium"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Section 1: Outcome */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">
                    Outcome
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {outcomes.map((o) => {
                      const isSelected = filters.outcome === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => handleFilterChange('outcome', isSelected ? '' : o.value)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-gray-1000 bg-gray-1000 text-background-100 font-semibold'
                              : 'border-gray-400 bg-background-200 text-gray-800 hover:text-gray-1000'
                          }`}
                        >
                          <span>{o.label}</span>
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">
                    Difficulty
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {difficulties.map((d) => {
                      const isSelected = filters.difficulty === d.value;
                      return (
                        <button
                          key={d.value}
                          type="button"
                          onClick={() => handleFilterChange('difficulty', isSelected ? '' : d.value)}
                          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-gray-1000 bg-gray-1000 text-background-100 font-semibold'
                              : 'border-gray-400 bg-background-200 text-gray-800 hover:text-gray-1000'
                          }`}
                        >
                          <span>{d.label}</span>
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 3: Post Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">
                    Post Type
                  </label>
                  <select
                    value={filters.postType || ''}
                    onChange={(e) => handleFilterChange('postType', e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-400 bg-background-200 text-gray-1000 text-xs focus:outline-none focus:border-gray-1000 transition-colors"
                  >
                    {postTypes.map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section 4: Job Type */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">
                    Job Type
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {jobTypes.map((j) => {
                      const isSelected = filters.jobType === j.value;
                      return (
                        <button
                          key={j.value}
                          type="button"
                          onClick={() => handleFilterChange('jobType', isSelected ? '' : j.value)}
                          className={`px-2.5 py-1 rounded-md border text-xs font-medium transition-all cursor-pointer ${
                            isSelected
                              ? 'border-gray-1000 bg-gray-1000 text-background-100 font-semibold'
                              : 'border-gray-400 bg-background-200 text-gray-800 hover:text-gray-1000'
                          }`}
                        >
                          {j.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Section 5: Rounds & Evaluation */}
                <div className="space-y-2 pt-2 border-t border-gray-400">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">
                      Assessment Format
                    </label>
                    <select
                      value={filters.assessmentType || ''}
                      onChange={(e) => handleFilterChange('assessmentType', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-400 bg-background-200 text-gray-1000 text-xs focus:outline-none focus:border-gray-1000 transition-colors"
                    >
                      <option value="">All Assessment Formats</option>
                      {assessmentTypes.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600">
                      Interview Round
                    </label>
                    <select
                      value={filters.interviewType || ''}
                      onChange={(e) => handleFilterChange('interviewType', e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-400 bg-background-200 text-gray-1000 text-xs focus:outline-none focus:border-gray-1000 transition-colors"
                    >
                      <option value="">All Interview Rounds</option>
                      {interviewTypes.map((i) => (
                        <option key={i.value} value={i.value}>
                          {i.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Popover Footer */}
                <div className="pt-2 border-t border-gray-400 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setIsFilterPopoverOpen(false)}
                    className="px-4 py-1.5 bg-gray-1000 text-background-100 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Segmented Sort Controls */}
          <div className="h-9 flex items-center gap-0.5 p-0.5 bg-background-200 border border-gray-400 rounded-lg shadow-2xs shrink-0">
            <button
              type="button"
              onClick={() => handleFilterChange('sort', 'recent')}
              className={`h-full flex items-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filters.sort === 'recent' || !filters.sort
                  ? 'bg-background-100 text-gray-1000 font-semibold shadow-2xs border border-gray-400'
                  : 'text-gray-700 hover:text-gray-1000'
              }`}
              title="Sort by latest"
            >
              <Clock className="w-3 h-3" />
              <span className="hidden sm:inline">Latest</span>
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('sort', 'popular')}
              className={`h-full flex items-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filters.sort === 'popular'
                  ? 'bg-background-100 text-gray-1000 font-semibold shadow-2xs border border-gray-400'
                  : 'text-gray-700 hover:text-gray-1000'
              }`}
              title="Sort by reactions"
            >
              <TrendingUp className="w-3 h-3" />
              <span className="hidden sm:inline">Popular</span>
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('sort', 'discussed')}
              className={`h-full flex items-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filters.sort === 'discussed'
                  ? 'bg-background-100 text-gray-1000 font-semibold shadow-2xs border border-gray-400'
                  : 'text-gray-700 hover:text-gray-1000'
              }`}
              title="Sort by comments"
            >
              <MessageSquare className="w-3 h-3" />
              <span className="hidden sm:inline">Discussed</span>
            </button>
            <button
              type="button"
              onClick={() => handleFilterChange('sort', 'salary_high')}
              className={`h-full flex items-center gap-1.5 px-2.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
                filters.sort === 'salary_high'
                  ? 'bg-background-100 text-gray-1000 font-semibold shadow-2xs border border-gray-400'
                  : 'text-gray-700 hover:text-gray-1000'
              }`}
              title="Sort by top package"
            >
              <IndianRupee className="w-3 h-3" />
              <span className="hidden sm:inline">Top Package</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips Strip (Conditional: Only visible if active filters exist) */}
      {activeCount > 0 && (
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono uppercase tracking-wider text-gray-600 mr-1">
              Active:
            </span>

            {activeFilters.map((key) => {
              const val = filters[key];
              const label = getFilterLabel(key, val);

              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background-200 border border-gray-400 text-gray-1000 text-xs font-medium"
                >
                  <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                  <span className="font-semibold">{label}</span>
                  <button
                    type="button"
                    onClick={() => handleFilterChange(key, '')}
                    className="p-0.5 hover:text-red-500 rounded-full cursor-pointer ml-0.5"
                    title={`Remove ${key} filter`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}

            <button
              type="button"
              onClick={() => {
                activeFilterKeys.forEach((k) => handleFilterChange(k, ''));
              }}
              className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium cursor-pointer ml-1"
            >
              Clear all
            </button>
          </div>

          <div className="text-xs text-gray-600 font-mono">
            {totalCount} matching {totalCount === 1 ? 'experience' : 'experiences'}
          </div>
        </div>
      )}
    </div>
  );
}
