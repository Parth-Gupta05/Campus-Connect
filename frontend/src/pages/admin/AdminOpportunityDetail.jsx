import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { 
  ArrowLeft, 
  Filter, 
  ExternalLink, 
  Clock, 
  Zap, 
  User, 
  Mail, 
  Users, 
  Briefcase, 
  MapPin, 
  Calendar,
  FileText,
  Search,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import PdfViewerModal from '../../components/PdfViewerModal';

export default function AdminOpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [opportunity, setOpportunity] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'time' | 'name'
  const [applicantSearch, setApplicantSearch] = useState('');
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('Applicant Resume');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [oppRes, appRes] = await Promise.all([
          axios.get(`/opportunities/${id}`),
          axios.get(`/admin/opportunities/${id}/applicants`)
        ]);
        setOpportunity(oppRes.data.opportunity);
        setApplicants(appRes.data.applicants || []);
      } catch (err) {
        console.error('Error fetching opportunity details:', err);
        showToast('Failed to load opportunity data', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, showToast]);

  // Derived applicant statistics
  const totalApplicants = applicants.length;
  const scoredApplicants = applicants.filter(a => a.matchScoreCalculated);
  const avgScore = scoredApplicants.length > 0
    ? Math.round(scoredApplicants.reduce((sum, a) => sum + (a.matchScore || 0), 0) / scoredApplicants.length)
    : 0;
  const topApplicantsCount = applicants.filter(a => (a.matchScore || 0) >= 75).length;

  const filteredAndSortedApplicants = [...applicants]
    .filter(app => {
      const q = applicantSearch.toLowerCase().trim();
      if (!q) return true;
      const name = app.userId?.name?.toLowerCase() || '';
      const email = app.userId?.email?.toLowerCase() || '';
      const uid = app.userId?.uid?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || uid.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'score') {
        const scoreA = a.matchScore || 0;
        const scoreB = b.matchScore || 0;
        return scoreB - scoreA;
      }
      if (sortBy === 'name') {
        return (a.userId?.name || '').localeCompare(b.userId?.name || '');
      }
      return new Date(b.appliedAt) - new Date(a.appliedAt);
    });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background-100">
      {/* Header & Breadcrumb */}
      <div className="border-b border-gray-400 bg-background-100 px-6 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/admin/opportunities')}
              className="p-1.5 rounded-md border border-gray-400 bg-background-200 text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer shrink-0"
              title="Back to Opportunities"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gray-700">
                <span>Opportunities</span>
                <span>/</span>
                <span className="truncate text-gray-1000 font-semibold">{opportunity?.company || 'Organization'}</span>
              </div>
              <h1 className="text-heading-20 font-bold text-gray-1000 tracking-tight truncate mt-0.5">
                {opportunity?.title || 'Position Overview'}
              </h1>
            </div>
          </div>

          {opportunity && (
            <div className="flex items-center gap-2 shrink-0">
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider border ${
                opportunity.isActive
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : 'bg-gray-200 text-gray-700 border-gray-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${opportunity.isActive ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                {opportunity.isActive ? 'Active Posting' : 'Archived / Closed'}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Opportunity Details Hero Card */}
          {opportunity && (
            <div className="rounded-xl border border-gray-400 bg-background-100 p-5 sm:p-6 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-400 pb-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded bg-gray-200 border border-gray-400 font-mono text-xs uppercase font-bold text-gray-900">
                      {opportunity.opportunityType || 'REGULAR'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-background-200 border border-gray-400 text-xs text-gray-700 font-medium">
                      {opportunity.experienceLevel || 'Entry Level'}
                    </span>
                    {opportunity.stipendOrSalary && (
                      <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                        {opportunity.stipendOrSalary}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-1000 tracking-tight">
                    {opportunity.title}
                  </h2>
                  <p className="text-xs text-gray-700 font-medium mt-0.5 flex items-center gap-1.5">
                    {opportunity.companyLogo && (
                      <img 
                        src={opportunity.companyLogo} 
                        alt={opportunity.company} 
                        className="w-4 h-4 rounded object-contain bg-background-100 border border-gray-400 p-0.5 shrink-0" 
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span>Offered by <span className="text-gray-1000 font-semibold">{opportunity.company}</span></span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    <span>{opportunity.location || 'Remote'}</span>
                  </div>
                  {opportunity.deadline && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>Deadline: {new Date(opportunity.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                  {opportunity.applyLink && (
                    <a
                      href={opportunity.applyLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded border border-gray-400 bg-background-200 hover:bg-gray-200 text-gray-900 transition-colors"
                    >
                      <span>External Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Skills and Description snippet */}
              <div className="pt-4">
                <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed">
                  {opportunity.jobDescription}
                </p>
                {opportunity.requiredSkills && opportunity.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {opportunity.requiredSkills.map((sk, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-gray-200 border border-gray-400 font-mono text-[11px] text-gray-900">
                        {sk}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-gray-700 font-semibold">Total Applicants</span>
                <Users className="w-4 h-4 text-gray-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-gray-1000">
                {totalApplicants}
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">Resumes received & indexed</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-gray-700 font-semibold">Average Match Score</span>
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {avgScore}%
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">Vector similarity benchmark</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-gray-700 font-semibold">Top Tier Candidates</span>
                <Zap className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {topApplicantsCount}
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">Scoring &gt;= 75% alignment</p>
            </div>
          </div>

          {/* Toolbar: Search and Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
              <input
                type="text"
                placeholder="Search applicants by student name, email, or UID..."
                value={applicantSearch}
                onChange={e => setApplicantSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-background-200 border border-gray-400 rounded-lg text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors font-sans"
              />
            </div>

            <div className="flex items-center gap-1.5 p-0.5 rounded-lg border border-gray-400 bg-background-200 text-xs shrink-0 self-end sm:self-auto">
              <span className="pl-2.5 pr-1 text-gray-600 font-mono text-[11px] uppercase font-semibold">
                Sort:
              </span>
              <button
                onClick={() => setSortBy('score')}
                className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  sortBy === 'score'
                    ? 'bg-background-100 text-gray-1000 shadow-2xs font-semibold'
                    : 'text-gray-700 hover:text-gray-1000'
                }`}
              >
                Top AI Match
              </button>
              <button
                onClick={() => setSortBy('time')}
                className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  sortBy === 'time'
                    ? 'bg-background-100 text-gray-1000 shadow-2xs font-semibold'
                    : 'text-gray-700 hover:text-gray-1000'
                }`}
              >
                Newest
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                  sortBy === 'name'
                    ? 'bg-background-100 text-gray-1000 shadow-2xs font-semibold'
                    : 'text-gray-700 hover:text-gray-1000'
                }`}
              >
                Name
              </button>
            </div>
          </div>

          {/* Applicants Roster */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 rounded-xl border border-gray-400 bg-background-200 animate-pulse" />
              ))}
            </div>
          ) : filteredAndSortedApplicants.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-gray-400 bg-background-100">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mb-3">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-1000">No Applicants Found</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-sm">
                {applicantSearch
                  ? 'No registered candidates match your search query. Try typing a different name or UID.'
                  : 'No student candidates have submitted an application for this opportunity yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedApplicants.map((app) => {
                const user = app.userId || {};
                const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Student')}&background=6366f1&color=fff&bold=true`;
                const avatarSrc = user.avatarUrl || fallbackAvatar;
                const score = app.matchScore || 0;
                const scoreColor = 
                  score >= 75 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
                  score >= 50 ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' :
                  'text-gray-700 bg-gray-200 border-gray-400';

                return (
                  <div 
                    key={app._id}
                    className="rounded-xl border border-gray-400 bg-background-100 hover:border-gray-900 dark:hover:border-gray-100 p-4 sm:p-5 shadow-2xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Candidate Identity */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img 
                        src={avatarSrc} 
                        alt={user.name || 'Applicant'} 
                        onError={(e) => {
                          if (e.currentTarget.src !== fallbackAvatar) {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = fallbackAvatar;
                          }
                        }}
                        className="w-11 h-11 rounded-full object-cover border border-gray-400 shrink-0 bg-background-200" 
                      />

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/admin/students/${user.uid || user._id}`}
                            className="font-bold text-sm text-gray-1000 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                          >
                            {user.name || 'Unknown Student'}
                          </Link>
                          {user.uid && (
                            <span className="px-2 py-0.5 rounded bg-gray-200 border border-gray-400 font-mono text-[10px] text-gray-900 shrink-0">
                              {user.uid}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-500" />
                            <span className="truncate max-w-[180px]">{user.email || '—'}</span>
                          </span>
                          {user.branch && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-500" />
                              <span>{user.branch} {user.graduationYear ? `· '${user.graduationYear.slice(-2)}` : ''}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>Applied {new Date(app.appliedAt).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* AI Score, Resume, and Dossier Deep Link */}
                    <div className="flex items-center gap-3 self-end md:self-auto shrink-0 border-t md:border-t-0 border-gray-300 dark:border-gray-800 pt-3 md:pt-0">
                      {/* Match Score Badge */}
                      <div className="text-right">
                        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-mono font-bold border ${scoreColor}`}>
                          <Zap className="w-3 h-3" />
                          <span>{app.matchScoreCalculated ? `${score}% Match` : 'Processing'}</span>
                        </div>
                      </div>

                      {/* Resume Trigger */}
                      {(app.resumeId?.fileUrl || app.resumeUrl) ? (
                        <button
                          type="button"
                          onClick={() => {
                            const url = app.resumeId?.fileUrl || app.resumeUrl;
                            setSelectedPdfUrl(url);
                            setSelectedPdfTitle(`${user.name || 'Applicant'}'s Resume`);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-400 bg-background-200 hover:bg-gray-200 text-xs font-medium text-gray-1000 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Resume</span>
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 font-mono px-2 py-1">
                          No Resume
                        </span>
                      )}

                      {/* View Dossier Action */}
                      <Link
                        to={`/admin/students/${user.uid || user._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        <span>Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedPdfUrl && (
        <PdfViewerModal
          url={selectedPdfUrl}
          title={selectedPdfTitle}
          onClose={() => setSelectedPdfUrl(null)}
        />
      )}
    </div>
  );
}
