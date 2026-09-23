import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  Layers,
  Printer,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Square,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Info,
  Building2,
  X
} from 'lucide-react';

export default function AicteDiaryView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedEventsForDiary, setSelectedEventsForDiary] = useState(new Set());
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);
  const [showCategoryGrid, setShowCategoryGrid] = useState(false);
  const { showToast } = useToast();

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/aicte/ledger');
      setData(res.data);

      // Auto-select up to 10 events by default for physical sheet
      if (res.data?.ledger) {
        const initialSet = new Set();
        res.data.ledger.slice(0, 10).forEach(e => initialSet.add(e.eventId));
        setSelectedEventsForDiary(initialSet);
      }
    } catch (err) {
      console.error('Failed to load AICTE ledger:', err);
      showToast(err.response?.data?.message || 'Failed to load AICTE ledger', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  // Filtered events based on selected semester and category
  const filteredEvents = useMemo(() => {
    if (!data?.ledger) return [];
    return data.ledger.filter(item => {
      const matchSem = selectedSemester === 'all' || item.semester === Number(selectedSemester);
      const matchCat = !activeCategoryFilter || item.aicteCategory === activeCategoryFilter;
      return matchSem && matchCat;
    });
  }, [data, selectedSemester, activeCategoryFilter]);

  // Selected events within the current view
  const selectedInCurrentSem = useMemo(() => {
    return filteredEvents.filter(e => selectedEventsForDiary.has(e.eventId));
  }, [filteredEvents, selectedEventsForDiary]);

  const selectedPointsInSem = useMemo(() => {
    return selectedInCurrentSem.reduce((sum, e) => sum + (e.pointsAwarded || 0), 0);
  }, [selectedInCurrentSem]);

  const toggleEventSelection = (eventId) => {
    const next = new Set(selectedEventsForDiary);
    if (next.has(eventId)) {
      next.delete(eventId);
    } else {
      if (next.size >= 10 && selectedSemester !== 'all') {
        showToast('Maximum 10 entries fit on one physical semester sheet.', 'info');
      }
      next.add(eventId);
    }
    setSelectedEventsForDiary(next);
  };

  const autoSelectBestForSemester = () => {
    const next = new Set(selectedEventsForDiary);
    // Sort current semester events: highest points first, then distinct categories
    const sorted = [...filteredEvents].sort((a, b) => (b.pointsAwarded || 0) - (a.pointsAwarded || 0));
    
    // Clear current semester events from set first
    filteredEvents.forEach(e => next.delete(e.eventId));
    
    // Add top 10
    sorted.slice(0, 10).forEach(e => next.add(e.eventId));
    setSelectedEventsForDiary(next);
    showToast(`Optimized ${Math.min(sorted.length, 10)} events for physical diary sheet.`, 'success');
  };

  const selectAllInView = () => {
    const next = new Set(selectedEventsForDiary);
    filteredEvents.forEach(e => next.add(e.eventId));
    setSelectedEventsForDiary(next);
  };

  const clearSelectionInView = () => {
    const next = new Set(selectedEventsForDiary);
    filteredEvents.forEach(e => next.delete(e.eventId));
    setSelectedEventsForDiary(next);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 bg-background-100 rounded-2xl border border-gray-400 mt-4">
        <div className="w-8 h-8 border-2 border-gray-1000 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-mono text-gray-700">Connecting to University AICTE Activity Ledger...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center bg-background-100 rounded-2xl border border-gray-400 mt-4">
        <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-1000">Unable to load AICTE record</p>
        <button onClick={fetchLedger} className="mt-3 px-3 py-1.5 bg-gray-1000 text-background-100 text-xs rounded-md">
          Retry
        </button>
      </div>
    );
  }

  const { summary, student, semesters, categories } = data;
  const isSatisfied = summary.totalPoints >= summary.graduationTarget && summary.categoryRequirementSatisfied;

  return (
    <div className="flex flex-col gap-6 mt-4">
      
      {/* ===================================================================
          1. 100-POINT GRADUATION METER & BREADTH STATS
          =================================================================== */}
      <div className="bg-background-100 border border-gray-400 rounded-2xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Left info & progress */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
              <span className="inline-flex w-fit shrink-0 whitespace-nowrap items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
                <Award className="w-3.5 h-3.5" />
                AICTE Activity Point Programme
              </span>
              <span className="text-xs font-mono text-gray-600">
                {student.branch} &bull; UID: {student.uid}
              </span>
            </div>

            <h2 className="text-heading-24 font-bold text-gray-1000 tracking-tight">
              AICTE Activity Points Ledger
            </h2>
            <p className="text-xs text-gray-700 mt-1 max-w-2xl leading-relaxed">
              Mandatory graduation requirement for 4-year B.E. degree. Students must achieve at least{' '}
              <span className="font-semibold text-gray-1000">{summary.graduationTarget} Points</span> across minimum{' '}
              <span className="font-semibold text-gray-1000">4 distinct activity categories</span>. Points earned beyond target are fully credited.
            </p>

            {/* Main Gauge Meter Bar */}
            <div className="mt-5">
              <div className="flex justify-between items-baseline text-xs font-mono mb-1.5">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <span className="font-bold text-base text-gray-1000">{summary.totalPoints}</span>
                  <span>/ {summary.graduationTarget} Points Earned</span>
                  {summary.totalPoints > summary.graduationTarget && (
                    <span className="text-emerald-600 font-semibold">(+{summary.totalPoints - summary.graduationTarget} surplus)</span>
                  )}
                </span>
                <span className="font-bold text-gray-1000">{summary.percentageCompleted}% Target Achieved</span>
              </div>

              <div className="w-full h-3 bg-background-200 rounded-full overflow-hidden border border-gray-400 p-0.5">
                <div 
                  className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-teal-500 via-blue-500 to-indigo-600"
                  style={{ width: `${Math.min(100, (summary.totalPoints / summary.graduationTarget) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Right Metrics Cards */}
          <div className="grid grid-cols-2 sm:flex sm:flex-nowrap gap-3 shrink-0 w-full lg:w-auto mt-2 lg:mt-0">
            
            {/* Category Breadth Badge */}
            <div className="bg-background-200 border border-gray-400 p-3.5 rounded-xl min-w-0 sm:min-w-[150px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-600 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider">Breadth</span>
                <Layers className="w-4 h-4 text-indigo-500 shrink-0 ml-1" />
              </div>
              <div className="text-heading-20 font-bold text-gray-1000 font-mono">
                {summary.distinctCategoriesCount} / 15
              </div>
              <div className="mt-1 flex items-center gap-1 text-[11px] font-medium">
                {summary.categoryRequirementSatisfied ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 shrink-0" /> Min 4
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {4 - summary.distinctCategoriesCount} more
                  </span>
                )}
              </div>
            </div>

            {/* Total Hours Badge */}
            <div className="bg-background-200 border border-gray-400 p-3.5 rounded-xl min-w-0 sm:min-w-[140px] flex flex-col justify-between">
              <div className="flex items-center justify-between text-gray-600 mb-1">
                <span className="text-[11px] font-mono uppercase tracking-wider whitespace-nowrap">Total Time</span>
                <Clock className="w-4 h-4 text-blue-500 shrink-0 ml-1" />
              </div>
              <div className="text-heading-20 font-bold text-gray-1000 font-mono">
                {summary.totalHours} hrs
              </div>
              <span className="text-[11px] text-gray-600 font-mono mt-1">
                {summary.totalEventsAttended} events
              </span>
            </div>

            {/* Print Booklet Button */}
            <button
              onClick={() => setShowPrintModal(true)}
              className="col-span-2 sm:col-auto bg-gray-1000 text-background-100 hover:opacity-90 transition-opacity p-3.5 rounded-xl flex flex-col items-center justify-center gap-1.5 shadow-xs cursor-pointer min-w-0 sm:min-w-[130px]"
            >
              <Printer className="w-5 h-5 text-teal-400" />
              <span className="text-xs font-semibold">Print Diary Sheet</span>
              <span className="text-[10px] font-mono opacity-80">Official Booklet PDF</span>
            </button>

          </div>

        </div>

        {/* Categories Bar / Toggle */}
        <div className="mt-5 pt-4 border-t border-gray-300 dark:border-gray-800 flex items-center justify-between">
          <button
            onClick={() => setShowCategoryGrid(!showCategoryGrid)}
            className="text-xs font-mono text-gray-700 hover:text-gray-1000 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCategoryGrid ? 'rotate-180' : ''}`} />
            <span>{showCategoryGrid ? 'Hide 15 Official AICTE Categories' : 'Explore 15 Official AICTE Activity Categories'}</span>
          </button>

          {activeCategoryFilter && (
            <button
              onClick={() => setActiveCategoryFilter(null)}
              className="text-[11px] font-mono text-blue-600 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Clear Category Filter (#{activeCategoryFilter})
            </button>
          )}
        </div>

        {/* Expandable 15 Categories Grid */}
        {showCategoryGrid && (
          <div className="mt-4 pt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 animate-in fade-in duration-200">
            {categories.map(cat => {
              const count = data.ledger.filter(e => e.aicteCategory === cat.id).length;
              const isSelected = activeCategoryFilter === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setActiveCategoryFilter(isSelected ? null : cat.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-200' 
                      : count > 0
                        ? 'bg-background-200/80 border-gray-400 hover:border-gray-600 text-gray-900'
                        : 'bg-background-200/40 border-gray-300 dark:border-gray-800 opacity-60 hover:opacity-100 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold">
                    <span className="truncate">#{cat.id}. {cat.shortTitle}</span>
                    {count > 0 && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        {count} done
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                    {cat.title}
                  </p>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ===================================================================
          2. SEMESTER TABS & SELECTION TOOLBAR
          =================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background-100 p-3 rounded-xl border border-gray-400">
        
        {/* Semester Segmented Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedSemester('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 cursor-pointer ${
              selectedSemester === 'all'
                ? 'bg-gray-1000 text-background-100 font-semibold shadow-xs'
                : 'text-gray-700 hover:text-gray-1000 hover:bg-gray-200'
            }`}
          >
            All Semesters ({data.ledger.length})
          </button>
          
          {semesters.map(sem => (
            <button
              key={sem.sem}
              onClick={() => setSelectedSemester(String(sem.sem))}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                selectedSemester === String(sem.sem)
                  ? 'bg-gray-1000 text-background-100 font-semibold shadow-xs'
                  : 'text-gray-700 hover:text-gray-1000 hover:bg-gray-200'
              }`}
            >
              <span>{sem.label}</span>
              {sem.semPoints > 0 && (
                <span className={`px-1 rounded text-[10px] ${
                  selectedSemester === String(sem.sem)
                    ? 'bg-background-100 text-gray-1000 font-bold'
                    : 'bg-gray-300 dark:bg-gray-800 text-gray-700'
                }`}>
                  {sem.semPoints}p
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Diary Sheet Selection Actions */}
        <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-300 dark:border-gray-800">
          <span className="text-xs font-mono text-gray-600 hidden md:inline">
            Diary: {selectedInCurrentSem.length} / {Math.min(10, filteredEvents.length)} selected ({selectedPointsInSem} pts)
          </span>

          <button
            onClick={autoSelectBestForSemester}
            title="Auto-select top scoring events up to the 10-row physical diary sheet limit"
            className="px-2.5 py-1.5 rounded-md border border-gray-400 bg-background-200 hover:bg-gray-200 text-xs font-mono text-gray-900 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Auto-Select Best</span>
          </button>

          <button
            onClick={selectAllInView}
            className="px-2 py-1.5 rounded-md border border-gray-400 bg-background-200 hover:bg-gray-200 text-xs font-mono text-gray-900 transition-colors cursor-pointer"
          >
            All
          </button>

          <button
            onClick={clearSelectionInView}
            className="px-2 py-1.5 rounded-md border border-gray-400 bg-background-200 hover:bg-gray-200 text-xs font-mono text-gray-900 transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>

      </div>

      {/* ===================================================================
          3. INTERACTIVE LEDGER TABLE WITH DIARY SELECTION
          =================================================================== */}
      <div className="rounded-xl border border-gray-400 bg-background-100 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-background-200 border-b border-gray-400 text-xs font-mono uppercase text-gray-700">
              <tr>
                <th className="p-3.5 w-10 text-center">Sheet</th>
                <th className="p-3.5">Activity & Event</th>
                <th className="p-3.5">Organizing Club</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Designation & Multiplier</th>
                <th className="p-3.5 text-right">Hours</th>
                <th className="p-3.5 text-right">Points</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-300 dark:divide-gray-800 text-xs">
              {filteredEvents.map((item, idx) => {
                const isSelectedForDiary = selectedEventsForDiary.has(item.eventId);
                const eventDateStr = item.date ? new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  
                return (
                  <tr 
                    key={item.eventId || idx}
                    className={`transition-colors ${
                      isSelectedForDiary 
                        ? 'bg-blue-500/5 hover:bg-blue-500/10' 
                        : 'hover:bg-background-200/50'
                    }`}
                  >
                    {/* Select Checkbox for Physical Diary */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => toggleEventSelection(item.eventId)}
                        className="cursor-pointer text-gray-600 hover:text-gray-1000 p-1"
                        aria-label="Toggle inclusion in official printed diary sheet"
                      >
                        {isSelectedForDiary ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </td>
  
                    {/* Activity Name & Date */}
                    <td className="p-3.5">
                      <div className="font-semibold text-gray-1000 text-sm">{item.title}</div>
                      <div className="text-[11px] font-mono text-gray-600 mt-0.5 flex flex-wrap items-center gap-2">
                        <span className="whitespace-nowrap">{eventDateStr}</span>
                        <span className="hidden sm:inline">&bull;</span>
                        <span className="px-1.5 py-0.5 rounded bg-background-200 text-gray-1000 border border-gray-400 whitespace-nowrap">
                          {item.semesterLabel}
                        </span>
                      </div>
                    </td>
  
                    {/* Conducting Club */}
                    <td className="p-3.5">
                      <div className="font-medium text-gray-900 flex items-center gap-1.5 whitespace-nowrap">
                        <Building2 className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        <span>{item.clubName}</span>
                      </div>
                    </td>
  
                    {/* Nature of Activity (1-15) */}
                    <td className="p-3.5">
                      <span 
                        title={item.categoryTitle}
                        className="inline-block px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-gray-200 border border-gray-400 text-gray-900 max-w-[200px] truncate align-middle"
                      >
                        #{item.aicteCategory} {item.categoryShortTitle}
                      </span>
                    </td>
  
                    {/* Designation & Multiplier */}
                    <td className="p-3.5 font-mono">
                      {item.tier === 'Core' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 whitespace-nowrap">
                          <Award className="w-3 h-3 shrink-0" />
                          <span>{item.designation} (2x Core)</span>
                        </span>
                      ) : item.tier === 'WC' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 whitespace-nowrap">
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span>{item.designation} (2x WC)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] text-gray-700 bg-gray-200 border border-gray-400 whitespace-nowrap">
                          <span>{item.designation} (1x)</span>
                        </span>
                      )}
                    </td>
  
                    {/* Hours */}
                    <td className="p-3.5 text-right font-mono text-gray-900 whitespace-nowrap">
                      <span className="font-medium">{item.recordedHours} hrs</span>
                      {item.multiplier > 1 && (
                        <div className="text-[10px] text-gray-500">({item.durationHours}h &times; {item.multiplier})</div>
                      )}
                    </td>
  
                    {/* Points Awarded */}
                    <td className="p-3.5 text-right font-mono">
                      <span className="inline-flex items-center justify-center whitespace-nowrap px-2 py-0.5 rounded font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 text-xs">
                        +{item.pointsAwarded} pts
                      </span>
                    </td>
  
                    {/* Status */}
                    <td className="p-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 whitespace-nowrap">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{item.isAutoCore ? 'Auto (Core)' : 'Verified'}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
  
              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan="8" className="p-12 text-center text-gray-600 font-mono text-xs">
                    No activity point records found for this semester or category filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 px-6 bg-background-200 border-t border-gray-400 flex flex-wrap items-center justify-between text-[11px] font-mono text-gray-600 gap-2">
          <span>Official AICTE Activity Ledger &bull; All verified event points are permanently credited</span>
          <span>Showing {filteredEvents.length} events &bull; {selectedInCurrentSem.length} selected for physical sheet</span>
        </div>
      </div>

      {/* ===================================================================
          4. OFFICIAL PRINT / EXPORT AICTE DIARY SHEET MODAL
          =================================================================== */}
      {showPrintModal && (
        <PrintAicteSheetModal
          student={student}
          selectedEvents={selectedInCurrentSem.length > 0 ? selectedInCurrentSem : filteredEvents.slice(0, 10)}
          semesterLabel={selectedSemester === 'all' ? (student.currentSem ? `Semester ${student.currentSem}` : 'Current Academic Semester') : `Semester ${selectedSemester}`}
          onClose={() => setShowPrintModal(false)}
        />
      )}

    </div>
  );
}

/** Fixed print canvas (A4 @ 96dpi). Screen preview scales this block to fit — no inner scroll. */
const AICTE_PAGE_WIDTH_PX = 794;
const AICTE_PAGE_HEIGHT_PX = 1123;
const AICTE_PAGE_GAP_PX = 48;
const AICTE_SHEET_WIDTH_PX = AICTE_PAGE_WIDTH_PX;
const AICTE_SHEET_HEIGHT_PX = AICTE_PAGE_HEIGHT_PX * 2 + AICTE_PAGE_GAP_PX;

/**
 * PrintAicteSheetModal
 * Renders the exact physical booklet layout matching Gallery_20260914_114722_260914_114751.pdf
 * (Page 22: 10-row activity table; Page 23: 5-row description table)
 */
function PrintAicteSheetModal({ student, selectedEvents, semesterLabel, onClose }) {
  const printRef = useRef(null);
  const previewHostRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(0.5);

  useEffect(() => {
    const host = previewHostRef.current;
    if (!host) return;

    const updateScale = () => {
      const pad = 16;
      const w = host.clientWidth - pad;
      const h = host.clientHeight - pad;
      if (w <= 0 || h <= 0) return;
      const next = Math.min(w / AICTE_SHEET_WIDTH_PX, h / AICTE_SHEET_HEIGHT_PX);
      setPreviewScale(Math.max(0.08, next));
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(host);
    window.addEventListener('resize', updateScale);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // Pad selected events to 10 rows for Table 1 (matching physical page 22)
  const paddedEvents = [...selectedEvents];
  while (paddedEvents.length < 10) {
    paddedEvents.push(null);
  }

  // Descriptions up to 5 rows (matching physical page 23)
  const descriptionEvents = selectedEvents.slice(0, 5);
  while (descriptionEvents.length < 5) {
    descriptionEvents.push(null);
  }

  const totalSelectedHours = selectedEvents.reduce((acc, e) => acc + (e.recordedHours || 0), 0);
  const totalSelectedPoints = selectedEvents.reduce((acc, e) => acc + (e.pointsAwarded || 0), 0);

  const scaledW = AICTE_SHEET_WIDTH_PX * previewScale;
  const scaledH = AICTE_SHEET_HEIGHT_PX * previewScale;

  return (
    <div className="aicte-print-modal-backdrop fixed inset-0 bg-black/75 backdrop-blur-md z-[200] flex flex-col sm:justify-center sm:items-center p-0 sm:p-4 overscroll-contain print:static print:bg-white print:p-0">
      <div className="bg-gray-900 sm:bg-white text-black w-full sm:max-w-5xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[100dvh] max-h-[100dvh] sm:h-[min(92dvh,calc(100dvh-2rem))] sm:max-h-[min(92dvh,calc(100dvh-2rem))] print:h-auto print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Modal Toolbar (hidden when printing) */}
        <div className="print:hidden px-3 py-2.5 sm:p-4 bg-gray-900 border-b border-gray-800 flex items-center justify-between gap-2 shrink-0 min-w-0 pt-[max(0.625rem,env(safe-area-inset-top))]">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Printer className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300 shrink-0" />
            <h3 className="font-bold text-white text-xs sm:text-sm truncate">
              AICTE Activity Diary Sheet
            </h3>
            <span className="hidden md:inline text-xs font-mono text-gray-400 shrink-0">
              (Physical booklet layout)
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="h-8 px-2.5 sm:px-4 sm:py-1.5 bg-white text-black text-xs font-medium rounded-md hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition-colors cursor-pointer"
              aria-label="Close preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scaled preview — entire fixed canvas fits in viewport (no scrollbars) */}
        <div
          ref={previewHostRef}
          className="aicte-sheet-preview-host flex-1 min-h-0 overflow-hidden bg-gray-200 flex items-center justify-center p-2 sm:p-4 print:overflow-visible print:p-0 print:bg-white"
        >
          <div
            className="aicte-sheet-scale-box relative shrink-0 print:w-auto print:h-auto"
            style={{ width: scaledW, height: scaledH }}
          >
            <div
              ref={printRef}
              className="aicte-sheet-canvas absolute top-0 left-0 font-serif text-black bg-white box-border flex flex-col print:static print:transform-none"
              style={{
                width: AICTE_SHEET_WIDTH_PX,
                height: AICTE_SHEET_HEIGHT_PX,
                gap: AICTE_PAGE_GAP_PX,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
              }}
            >
          
          {/* =========================================================
              PAGE 1: ACTIVITY LOG TABLE (PAGE 22 IN BOOKLET)
              ========================================================= */}
          <div
            className="aicte-sheet-page border-2 border-orange-600 p-6 rounded-lg relative flex flex-col justify-between overflow-hidden shrink-0 print:min-h-screen print:h-auto print:border-none print:rounded-none print:p-4 print:break-after-page"
            style={{ width: AICTE_PAGE_WIDTH_PX, height: AICTE_PAGE_HEIGHT_PX }}
          >
            <div>
              {/* Header Box */}
              <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">AICTE Activity Point Programme</div>
                  <h1 className="text-lg font-bold">Activity Log & Verification Record</h1>
                  <div className="text-xs mt-1">Student: <span className="font-bold">{student.name}</span> &bull; UID: <span className="font-mono font-bold">{student.uid}</span></div>
                </div>
                <div className="text-right text-xs">
                  <div><span className="font-bold">Class / Division:</span> {student.branch} / {semesterLabel}</div>
                  <div className="mt-0.5"><span className="font-bold">Target:</span> 52 Hours / 13 points</div>
                </div>
              </div>

              {/* 10-Row Activity Table */}
              <table className="w-full border-collapse border-2 border-black text-[11px]">
                <thead>
                  <tr className="bg-[#f3f4f6] text-black text-center font-bold">
                    <th className="border border-black p-1.5 w-8">Sr. No</th>
                    <th className="border border-black p-1.5 w-20">Date</th>
                    <th className="border border-black p-1.5">Name of Activity</th>
                    <th className="border border-black p-1.5 w-32">Conducted by</th>
                    <th className="border border-black p-1.5 w-16">Nature (1-15)</th>
                    <th className="border border-black p-1.5 w-14">Total Hours</th>
                    <th className="border border-black p-1.5 w-24">Checked by (Head/CR)</th>
                    <th className="border border-black p-1.5 w-24">Verified by (Mentor)</th>
                  </tr>
                </thead>
                <tbody>
                  {paddedEvents.map((evt, index) => (
                    <tr key={index} className="h-10 text-center">
                      <td className="border border-black p-1 font-mono font-bold">{index + 1}.</td>
                      <td className="border border-black p-1 font-mono text-[10px]">
                        {evt?.date ? new Date(evt.date).toLocaleDateString('en-GB') : ''}
                      </td>
                      <td className="border border-black p-1 text-left font-medium px-2">
                        {evt?.title || ''}
                      </td>
                      <td className="border border-black p-1 text-left px-2">
                        {evt?.clubName || ''}
                      </td>
                      <td className="border border-black p-1 font-mono font-semibold">
                        {evt?.aicteCategory ? `#${evt.aicteCategory}` : ''}
                      </td>
                      <td className="border border-black p-1 font-mono font-bold">
                        {evt?.recordedHours ? `${evt.recordedHours}h` : ''}
                      </td>
                      <td className="border border-black p-1 text-[10px] text-gray-500 italic">
                        {evt ? 'Verified' : ''}
                      </td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  ))}
                  
                  {/* Total Hours Row */}
                  <tr className="font-bold bg-[#f9fafb] text-black">
                    <td colSpan="5" className="border border-black p-1.5 text-right uppercase">
                      Total Hours Achieved ({totalSelectedPoints} Points):
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono text-xs">
                      {totalSelectedHours} hrs
                    </td>
                    <td colSpan="2" className="border border-black p-1.5"></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Sign-off Box */}
            <div className="mt-8 pt-4 border-t border-gray-400 grid grid-cols-3 gap-4 text-xs text-center font-serif">
              <div>
                <div className="h-10"></div>
                <div className="border-t border-black pt-1 font-bold">Validated by Dean SSW</div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="border-t border-black pt-1 font-bold">Teacher Guardian Mentor</div>
              </div>
              <div>
                <div className="h-10"></div>
                <div className="border-t border-black pt-1 font-bold">Forwarded to Examination</div>
              </div>
            </div>
          </div>

          {/* =========================================================
              PAGE 2: ACTIVITY DESCRIPTION BOXES (PAGE 23 IN BOOKLET)
              ========================================================= */}
          <div
            className="aicte-sheet-page border-2 border-orange-600 p-6 rounded-lg relative flex flex-col justify-between overflow-hidden shrink-0 print:min-h-screen print:h-auto print:border-none print:rounded-none print:p-4 print:break-before-page"
            style={{ width: AICTE_PAGE_WIDTH_PX, height: AICTE_PAGE_HEIGHT_PX }}
          >
            <div>
              {/* Header Box */}
              <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider">AICTE Activity Point Programme</div>
                  <h2 className="text-lg font-bold">Activity Description & Learning Outcomes</h2>
                  <div className="text-xs mt-1">Student: <span className="font-bold">{student.name}</span> &bull; UID: <span className="font-mono font-bold">{student.uid}</span></div>
                </div>
                <div className="text-right text-xs">
                  <div><span className="font-bold">Class / Division:</span> {student.branch} / {semesterLabel}</div>
                  <div className="mt-0.5"><span className="font-bold">Target:</span> 52 Hours / 13 points</div>
                </div>
              </div>

              {/* 5-Row Description Table */}
              <table className="w-full border-collapse border-2 border-black text-[11px]">
                <thead>
                  <tr className="bg-[#f3f4f6] text-black text-center font-bold">
                    <th className="border border-black p-1.5 w-8">Sr. No</th>
                    <th className="border border-black p-1.5 w-20">Date</th>
                    <th className="border border-black p-1.5 w-44">Name of Activity</th>
                    <th className="border border-black p-1.5">Short description of Activity & Student Contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {descriptionEvents.map((evt, index) => (
                    <tr key={index} className="h-24">
                      <td className="border border-black p-2 font-mono font-bold text-center align-top">{index + 1}.</td>
                      <td className="border border-black p-2 font-mono text-[10px] text-center align-top">
                        {evt?.date ? new Date(evt.date).toLocaleDateString('en-GB') : ''}
                      </td>
                      <td className="border border-black p-2 font-bold align-top">
                        <div>{evt?.title || ''}</div>
                        {evt?.clubName && <div className="text-[10px] font-normal text-gray-600 mt-1">Org: {evt.clubName}</div>}
                        {evt?.pointsAwarded && <div className="text-[10px] font-mono text-emerald-700 mt-0.5">{evt.pointsAwarded} AICTE Pts ({evt.recordedHours}h)</div>}
                      </td>
                      <td className="border border-black p-2 align-top text-xs leading-relaxed">
                        {evt?.activitySummary || (evt ? `Participated actively in ${evt.title} organized by ${evt.clubName}. Gained practical exposure in Category #${evt.aicteCategory} (${evt.categoryShortTitle}) contributing ${evt.recordedHours} hours of institutional activity.` : '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Sign-off Box */}
            <div className="mt-8 pt-4 border-t border-gray-400 flex justify-between items-center text-xs font-serif">
              <div className="text-[11px] text-gray-600">
                Official Document printed via CampusConnect Portal
              </div>
              <div className="text-center">
                <div className="h-10"></div>
                <div className="border-t border-black pt-1 px-8 font-bold">Signature of Student</div>
              </div>
            </div>
          </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
