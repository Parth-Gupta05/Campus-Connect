import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { 
  Search, 
  Users, 
  Filter, 
  User, 
  Mail, 
  GraduationCap, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';

export default function AdminStudents() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [localSearch, setLocalSearch] = useState('');

  const [filters, setFilters] = useState({
    passingYear: '',
    department: '',
    division: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    
    if (!filters.passingYear && !filters.department && !filters.division) {
      showToast('Please enter at least one filter (Passing Year, Department, or Division)', 'error');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const params = {};
      if (filters.passingYear) params.passingYear = filters.passingYear;
      if (filters.department) params.department = filters.department;
      if (filters.division) params.division = filters.division;

      const res = await axios.get('/admin/students', { params });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      showToast(err.response?.data?.message || 'Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset) => {
    setFilters(preset);
    // Trigger search after state update
    setTimeout(async () => {
      setLoading(true);
      setHasSearched(true);
      try {
        const res = await axios.get('/admin/students', { params: preset });
        setStudents(res.data.students || []);
      } catch (err) {
        showToast('Failed to fetch students', 'error');
      } finally {
        setLoading(false);
      }
    }, 50);
  };

  // Filtered by local instant search (name/email/uid)
  const filteredStudents = students.filter(student => {
    const q = localSearch.toLowerCase().trim();
    if (!q) return true;
    const name = student.name?.toLowerCase() || '';
    const email = student.email?.toLowerCase() || '';
    const uid = student.uid?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || uid.includes(q);
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background-100">
      {/* Header */}
      <div className="border-b border-gray-400 bg-background-100 px-6 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gray-700">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-gray-1000 font-semibold">Students Directory</span>
            </div>
            <h1 className="text-heading-24 font-bold text-gray-1000 tracking-tight mt-1">
              Student Records & Profiles
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Search, filter, and inspect verified student technical dossiers, GitHub portfolios, and placement status.
            </p>
          </div>

          {hasSearched && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-lg border border-gray-400 bg-background-200 text-xs font-mono text-gray-900">
                <span className="font-bold text-gray-1000">{filteredStudents.length}</span> students found
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Search Filter Panel */}
          <div className="p-5 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">
                    Passing Year
                  </label>
                  <input 
                    type="text" 
                    name="passingYear" 
                    value={filters.passingYear} 
                    onChange={handleChange} 
                    placeholder="e.g. 2027 or 27" 
                    className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors font-mono" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">
                    Department / Branch
                  </label>
                  <input 
                    type="text" 
                    name="department" 
                    value={filters.department} 
                    onChange={handleChange} 
                    placeholder="e.g. COMP, IT, AIDS, EXTC" 
                    className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors font-mono uppercase" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">
                    Division (Optional)
                  </label>
                  <input 
                    type="text" 
                    name="division" 
                    value={filters.division} 
                    onChange={handleChange} 
                    placeholder="e.g. A, B, C" 
                    className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors font-mono uppercase" 
                  />
                </div>
              </div>

              {/* Action Buttons & Presets */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-gray-300 dark:border-gray-800">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
                  <span className="font-mono text-[11px] uppercase mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset({ passingYear: '2027', department: 'COMP', division: '' })}
                    className="px-2.5 py-1 rounded bg-background-200 hover:bg-gray-200 border border-gray-400 font-mono text-[11px] text-gray-800 transition-colors cursor-pointer"
                  >
                    COMP '27
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset({ passingYear: '2027', department: 'IT', division: '' })}
                    className="px-2.5 py-1 rounded bg-background-200 hover:bg-gray-200 border border-gray-400 font-mono text-[11px] text-gray-800 transition-colors cursor-pointer"
                  >
                    IT '27
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset({ passingYear: '2026', department: 'COMP', division: '' })}
                    className="px-2.5 py-1 rounded bg-background-200 hover:bg-gray-200 border border-gray-400 font-mono text-[11px] text-gray-800 transition-colors cursor-pointer"
                  >
                    COMP '26
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || (!filters.passingYear && !filters.department && !filters.division)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2 bg-gray-1000 text-background-100 rounded-md text-xs font-medium hover:opacity-90 shadow-xs transition-opacity disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Execute Search</span>
                </button>
              </div>
            </form>
          </div>

          {/* Instant Client Filter on Results */}
          {hasSearched && students.length > 0 && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
              <input
                type="text"
                placeholder="Filter search results by student name, university UID, or email..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-background-200 border border-gray-400 rounded-lg text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors font-sans"
              />
            </div>
          )}

          {/* Results Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-44 rounded-xl border border-gray-400 bg-background-200 animate-pulse" />
              ))}
            </div>
          ) : !hasSearched ? (
            <div className="flex flex-col items-center justify-center p-14 text-center rounded-xl border border-dashed border-gray-400 bg-background-100">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mb-3">
                <Filter className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-1000">Filter Directory Database</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-sm">
                Enter a graduation year, department, or division to query enrolled student rosters.
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-14 text-center rounded-xl border border-dashed border-gray-400 bg-background-100">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-1000">No Student Records Found</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-sm">
                {localSearch
                  ? 'No students match your active search keyword. Try adjusting the query string.'
                  : 'No student profiles matched the criteria. Please check the spelling or year.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((student) => {
                const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'Student')}&background=6366f1&color=fff&bold=true`;
                const avatarSrc = student.avatarUrl || fallbackAvatar;

                return (
                  <Link 
                    key={student._id}
                    to={`/admin/students/${student._id}`}
                    className="group rounded-xl border border-gray-400 bg-background-100 hover:border-gray-900 dark:hover:border-gray-100 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer"
                  >
                    <div>
                      {/* Top Row: Avatar & Identity */}
                      <div className="flex items-start gap-3 mb-3">
                        <img 
                          src={avatarSrc} 
                          alt={student.name || 'Student Avatar'} 
                          onError={(e) => {
                            if (e.currentTarget.src !== fallbackAvatar) {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = fallbackAvatar;
                            }
                          }}
                          className="w-11 h-11 rounded-full object-cover border border-gray-400 shrink-0 bg-background-200" 
                        />

                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-sm text-gray-1000 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {student.name || 'Anonymous Student'}
                          </h4>
                          <p className="text-xs text-gray-600 truncate mt-0.5">
                            {student.email}
                          </p>
                          {student.uid && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-gray-200 border border-gray-400 font-mono text-[10px] text-gray-900">
                              {student.uid}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Academic Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs text-gray-700">
                        <span className="px-2 py-0.5 rounded bg-background-200 border border-gray-400 text-[11px] font-mono">
                          {student.branch || 'Branch'}{student.division ? ` · Div ${student.division}` : ''}
                        </span>
                        {student.graduationYear && (
                          <span className="px-2 py-0.5 rounded bg-background-200 border border-gray-400 text-[11px] font-mono text-gray-600">
                            Class '{student.graduationYear.slice(-2)}
                          </span>
                        )}
                        {student.currentSem && (
                          <span className="px-2 py-0.5 rounded bg-background-200 border border-gray-400 text-[11px] font-mono text-gray-600">
                            Sem {student.currentSem}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Strip: Social Footprint & Dossier Link */}
                    <div className="pt-3 border-t border-gray-400 flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        {student.githubUsername && (
                          <span title={`GitHub: ${student.githubUsername}`} className="text-gray-700 hover:text-gray-1000">
                            <FaGithub className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {student.leetcodeUsername && (
                          <span title={`LeetCode: ${student.leetcodeUsername}`} className="text-amber-600 dark:text-amber-400">
                            <SiLeetcode className="w-3.5 h-3.5" />
                          </span>
                        )}
                        {student.linkedInUrl && (
                          <span title="LinkedIn Connected" className="text-blue-600 dark:text-blue-400">
                            <FaLinkedin className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <span className="inline-flex items-center gap-1 font-medium text-gray-900 group-hover:text-gray-1000 group-hover:translate-x-0.5 transition-all text-xs">
                        <span>View Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
