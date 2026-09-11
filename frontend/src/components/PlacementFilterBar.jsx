import React, { useState, useEffect, useRef } from 'react';
import {
  FiSearch,
  FiFilter,
  FiX,
  FiChevronDown,
  FiTrendingUp,
  FiClock,
  FiMessageSquare,
  FiDollarSign,
  FiBookmark,
  FiUserCheck
} from 'react-icons/fi';

export default function PlacementFilterBar({
  filters,
  onChange,
  onReset,
  meta = {},
  isLoggedIn = false
}) {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const dropdownRef = useRef(null);

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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (key, value) => {
    onChange({ ...filters, [key]: value, page: 1 });
  };

  const handleToggle = (key) => {
    setActiveDropdown(activeDropdown === key ? null : key);
  };

  // Count active filters (excluding default sort and page)
  const activeCount = Object.keys(filters).filter((k) => {
    if (k === 'sort' || k === 'page' || k === 'limit' || !filters[k]) return false;
    return true;
  }).length;

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
    { value: '', label: 'All Difficulties' },
    { value: 'easy', label: '🟢 Easy' },
    { value: 'medium', label: '🟡 Medium' },
    { value: 'hard', label: '🟠 Hard' },
    { value: 'very_hard', label: '🔴 Very Hard' }
  ];

  const outcomes = [
    { value: '', label: 'All Outcomes' },
    { value: 'selected', label: 'Selected / Offer' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'waitlisted', label: 'Waitlisted' },
    { value: 'in_process', label: 'In Process' }
  ];

  const jobTypes = [
    { value: '', label: 'All Job Types' },
    { value: 'full_time', label: 'Full-Time' },
    { value: 'internship', label: 'Internship' },
    { value: 'contract', label: 'Contract' }
  ];

  const workModes = [
    { value: '', label: 'All Work Modes' },
    { value: 'onsite', label: 'Onsite' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const assessmentTypes = [
    { value: '', label: 'All Assessment Types' },
    { value: 'coding_round', label: 'Coding Round' },
    { value: 'online_test', label: 'Online Test' },
    { value: 'mcq', label: 'MCQs' },
    { value: 'aptitude', label: 'Aptitude' },
    { value: 'case_study', label: 'Case Study' },
    { value: 'group_discussion', label: 'Group Discussion' },
    { value: 'hackathon', label: 'Hackathon' },
    { value: 'take_home_assignment', label: 'Take Home Assignment' }
  ];

  const interviewTypes = [
    { value: '', label: 'All Interview Types' },
    { value: 'technical', label: 'Technical' },
    { value: 'system_design', label: 'System Design' },
    { value: 'hr', label: 'HR Round' },
    { value: 'behavioral', label: 'Behavioral' },
    { value: 'managerial', label: 'Managerial' },
    { value: 'panel', label: 'Panel Interview' }
  ];

  return (
    <div className="space-y-3 mb-6 select-none" ref={dropdownRef}>
      {/* Top Row: Search + Quick Sort Segmented Control */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by company, role (e.g. SDE Intern), topics (DSA, React), or title..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border-light bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-medium shadow-xs"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onChange({ ...filters, search: '', page: 1 });
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant hover:text-on-surface"
            >
              <FiX className="text-sm" />
            </button>
          )}
        </div>

        {/* Sort Pill Buttons */}
        <div className="flex items-center gap-1 p-1 bg-surface-container-low border border-border-light rounded-xl text-xs font-semibold overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => handleFilterChange('sort', 'recent')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              (!filters.sort || filters.sort === 'recent')
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FiClock /> Latest
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('sort', 'popular')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              filters.sort === 'popular'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FiTrendingUp /> Popular
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('sort', 'most_commented')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              filters.sort === 'most_commented'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FiMessageSquare /> Most Discussed
          </button>
          <button
            type="button"
            onClick={() => handleFilterChange('sort', 'salary_high')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              filters.sort === 'salary_high'
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <FiDollarSign /> Top Package
          </button>
        </div>
      </div>

      {/* Filter Chips Row (Horizontal Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 text-xs">
        {/* Post Type Filter */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => handleToggle('postType')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition-all ${
              filters.postType
                ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest border-border-light text-on-surface hover:bg-surface-variant'
            }`}
          >
            <span>{postTypes.find((p) => p.value === filters.postType)?.label || 'Post Type'}</span>
            <FiChevronDown className="text-xs" />
          </button>

          {activeDropdown === 'postType' && (
            <div className="absolute left-0 top-full mt-1.5 w-60 bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 p-1.5 divide-y divide-border-light/40 animate-in fade-in slide-in-from-top-1 duration-150">
              {postTypes.map((pt) => (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => {
                    handleFilterChange('postType', pt.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    filters.postType === pt.value
                      ? 'bg-primary text-on-primary font-bold'
                      : 'hover:bg-surface-variant text-on-surface'
                  }`}
                >
                  {pt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Company Filter */}
        {meta.companies && meta.companies.length > 0 && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => handleToggle('company')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition-all ${
                filters.company
                  ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-xs'
                  : 'bg-surface-container-lowest border-border-light text-on-surface hover:bg-surface-variant'
              }`}
            >
              <span>{filters.company || 'Company'}</span>
              <FiChevronDown className="text-xs" />
            </button>

            {activeDropdown === 'company' && (
              <div className="absolute left-0 top-full mt-1.5 w-56 max-h-60 overflow-y-auto custom-scrollbar bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    handleFilterChange('company', '');
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                    !filters.company ? 'bg-primary text-on-primary font-bold' : 'hover:bg-surface-variant'
                  }`}
                >
                  All Companies
                </button>
                {meta.companies.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      handleFilterChange('company', c);
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                      filters.company === c ? 'bg-primary text-on-primary font-bold' : 'hover:bg-surface-variant'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Difficulty Filter */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => handleToggle('difficulty')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition-all ${
              filters.difficulty
                ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest border-border-light text-on-surface hover:bg-surface-variant'
            }`}
          >
            <span>{difficulties.find((d) => d.value === filters.difficulty)?.label || 'Difficulty'}</span>
            <FiChevronDown className="text-xs" />
          </button>

          {activeDropdown === 'difficulty' && (
            <div className="absolute left-0 top-full mt-1.5 w-44 bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => {
                    handleFilterChange('difficulty', d.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                    filters.difficulty === d.value
                      ? 'bg-primary text-on-primary font-bold'
                      : 'hover:bg-surface-variant'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Outcome Filter */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => handleToggle('outcome')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition-all ${
              filters.outcome
                ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest border-border-light text-on-surface hover:bg-surface-variant'
            }`}
          >
            <span>{outcomes.find((o) => o.value === filters.outcome)?.label || 'Outcome'}</span>
            <FiChevronDown className="text-xs" />
          </button>

          {activeDropdown === 'outcome' && (
            <div className="absolute left-0 top-full mt-1.5 w-48 bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {outcomes.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    handleFilterChange('outcome', o.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                    filters.outcome === o.value
                      ? 'bg-primary text-on-primary font-bold'
                      : 'hover:bg-surface-variant'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assessment Type Filter */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => handleToggle('assessmentType')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition-all ${
              filters.assessmentType
                ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest border-border-light text-on-surface hover:bg-surface-variant'
            }`}
          >
            <span>{assessmentTypes.find((a) => a.value === filters.assessmentType)?.label || 'Assessment Type'}</span>
            <FiChevronDown className="text-xs" />
          </button>

          {activeDropdown === 'assessmentType' && (
            <div className="absolute left-0 top-full mt-1.5 w-56 max-h-60 overflow-y-auto custom-scrollbar bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {assessmentTypes.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => {
                    handleFilterChange('assessmentType', a.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                    filters.assessmentType === a.value
                      ? 'bg-primary text-on-primary font-bold'
                      : 'hover:bg-surface-variant'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interview Type Filter */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => handleToggle('interviewType')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition-all ${
              filters.interviewType
                ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest border-border-light text-on-surface hover:bg-surface-variant'
            }`}
          >
            <span>{interviewTypes.find((i) => i.value === filters.interviewType)?.label || 'Interview Type'}</span>
            <FiChevronDown className="text-xs" />
          </button>

          {activeDropdown === 'interviewType' && (
            <div className="absolute left-0 top-full mt-1.5 w-52 max-h-60 overflow-y-auto custom-scrollbar bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {interviewTypes.map((i) => (
                <button
                  key={i.value}
                  type="button"
                  onClick={() => {
                    handleFilterChange('interviewType', i.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                    filters.interviewType === i.value
                      ? 'bg-primary text-on-primary font-bold'
                      : 'hover:bg-surface-variant'
                  }`}
                >
                  {i.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Branch Filter */}
        {meta.branches && meta.branches.length > 0 && (
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => handleToggle('branch')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition-all ${
                filters.branch
                  ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-xs'
                  : 'bg-surface-container-lowest border-border-light text-on-surface hover:bg-surface-variant'
              }`}
            >
              <span>{filters.branch || 'Branch'}</span>
              <FiChevronDown className="text-xs" />
            </button>

            {activeDropdown === 'branch' && (
              <div className="absolute left-0 top-full mt-1.5 w-44 max-h-60 overflow-y-auto custom-scrollbar bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    handleFilterChange('branch', '');
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                    !filters.branch ? 'bg-primary text-on-primary font-bold' : 'hover:bg-surface-variant'
                  }`}
                >
                  All Branches
                </button>
                {meta.branches.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      handleFilterChange('branch', b);
                      setActiveDropdown(null);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                      filters.branch === b ? 'bg-primary text-on-primary font-bold' : 'hover:bg-surface-variant'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Job Type & Work Mode */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => handleToggle('jobType')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition-all ${
              filters.jobType
                ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-xs'
                : 'bg-surface-container-lowest border-border-light text-on-surface hover:bg-surface-variant'
            }`}
          >
            <span>{jobTypes.find((j) => j.value === filters.jobType)?.label || 'Job Type'}</span>
            <FiChevronDown className="text-xs" />
          </button>

          {activeDropdown === 'jobType' && (
            <div className="absolute left-0 top-full mt-1.5 w-44 bg-surface-container-lowest border border-border-light rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {jobTypes.map((j) => (
                <button
                  key={j.value}
                  type="button"
                  onClick={() => {
                    handleFilterChange('jobType', j.value);
                    setActiveDropdown(null);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium ${
                    filters.jobType === j.value
                      ? 'bg-primary text-on-primary font-bold'
                      : 'hover:bg-surface-variant'
                  }`}
                >
                  {j.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Logged in student toggles */}
        {isLoggedIn && (
          <>
            <button
              type="button"
              onClick={() => handleFilterChange('bookmarkedOnly', filters.bookmarkedOnly === 'true' ? '' : 'true')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition-all cursor-pointer ${
                filters.bookmarkedOnly === 'true'
                  ? 'bg-primary text-on-primary border-primary shadow-xs font-bold'
                  : 'bg-surface-container-lowest border-border-light text-on-surface hover:bg-surface-variant'
              }`}
            >
              <FiBookmark className="text-xs" />
              <span>Saved</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('myPostsOnly', filters.myPostsOnly === 'true' ? '' : 'true')}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border font-semibold transition-all cursor-pointer ${
                filters.myPostsOnly === 'true'
                  ? 'bg-primary text-on-primary border-primary shadow-xs font-bold'
                  : 'bg-surface-container-lowest border-border-light text-on-surface hover:bg-surface-variant'
              }`}
            >
              <FiUserCheck className="text-xs" />
              <span>My Experiences</span>
            </button>
          </>
        )}

        {/* Clear All Filters Button */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-error/10 text-error hover:bg-error/20 font-bold transition-colors cursor-pointer"
          >
            <FiX className="text-xs" />
            <span>Reset ({activeCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}
