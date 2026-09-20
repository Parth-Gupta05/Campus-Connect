import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  Briefcase, 
  MapPin, 
  Clock, 
  Search, 
  SlidersHorizontal, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Users, 
  ChevronRight,
  Sparkles,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import CreateOpportunityModal from '../../components/admin/CreateOpportunityModal';
import { useToast } from '../../context/ToastContext';

export default function AdminOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'closed'
  const [typeFilter, setTypeFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const navigate = useNavigate();
  const { showToast } = useToast();

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/admin/opportunities');
      setOpportunities(res.data.opportunities || []);
    } catch (err) {
      console.error('Error fetching admin opportunities:', err);
      showToast('Failed to load opportunities', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleToggleStatus = async (e, oppId) => {
    e.stopPropagation();
    setActionLoadingId(oppId);
    try {
      const res = await axios.patch(`/admin/opportunities/${oppId}/status`);
      setOpportunities(prev => prev.map(o => o._id === oppId ? { ...o, isActive: res.data.opportunity.isActive } : o));
      showToast(res.data.message || 'Status updated', 'success');
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteOpportunity = async (e, oppId, title) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete "${title}" and all its applicant records?`)) return;
    
    setActionLoadingId(oppId);
    try {
      await axios.delete(`/admin/opportunities/${oppId}`);
      setOpportunities(prev => prev.filter(o => o._id !== oppId));
      showToast('Opportunity removed successfully', 'success');
    } catch (err) {
      showToast('Failed to delete opportunity', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Derived statistics
  const totalCount = opportunities.length;
  const activeCount = opportunities.filter(o => o.isActive).length;
  const closedCount = totalCount - activeCount;

  // Filtered list
  const filteredOpportunities = opportunities.filter(opp => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = !query || 
      opp.title?.toLowerCase().includes(query) ||
      opp.company?.toLowerCase().includes(query) ||
      opp.requiredSkills?.some(s => s.toLowerCase().includes(query));

    const matchesStatus = 
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? opp.isActive :
      !opp.isActive;

    const matchesType = typeFilter === 'all' || opp.opportunityType?.toLowerCase() === typeFilter.toLowerCase();

    return matchesQuery && matchesStatus && matchesType;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background-100">
      {/* Page Header */}
      <div className="border-b border-gray-400 bg-background-100 px-6 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gray-700">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-gray-1000 font-semibold">Opportunities</span>
            </div>
            <h1 className="text-heading-24 font-bold text-gray-1000 tracking-tight mt-1">
              Opportunities Management
            </h1>
            <p className="text-xs text-gray-600 mt-1">
              Create, review, and govern campus recruitment postings, internships, and technical challenges.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-1000 text-background-100 rounded-md text-xs font-medium hover:opacity-90 shadow-xs transition-opacity cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Opportunity</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-gray-700 font-semibold">Total Postings</span>
                <Briefcase className="w-4 h-4 text-gray-600" />
              </div>
              <div className="mt-3 text-2xl font-bold font-mono text-gray-1000">
                {totalCount}
              </div>
              <p className="text-[11px] text-gray-600 mt-1">All posted roles across campus</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-gray-700 font-semibold">Active Pipeline</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-3 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {activeCount}
              </div>
              <p className="text-[11px] text-gray-600 mt-1">Open for student applications</p>
            </div>

            <div className="p-4 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-gray-700 font-semibold">Closed / Archived</span>
                <XCircle className="w-4 h-4 text-gray-600" />
              </div>
              <div className="mt-3 text-2xl font-bold font-mono text-gray-800 dark:text-gray-400">
                {closedCount}
              </div>
              <p className="text-[11px] text-gray-600 mt-1">Past deadline or filled positions</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-xl border border-gray-400 bg-background-100 shadow-2xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
              <input
                type="text"
                placeholder="Search postings by role, company, or required skill..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm bg-background-200 border border-gray-400 rounded-lg text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors font-sans"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {/* Status Segmented Control */}
              <div className="flex items-center p-0.5 rounded-lg border border-gray-400 bg-background-200 text-xs shrink-0">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-background-100 text-gray-1000 shadow-2xs'
                      : 'text-gray-700 hover:text-gray-1000'
                  }`}
                >
                  All Status
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-background-100 text-gray-1000 shadow-2xs'
                      : 'text-gray-700 hover:text-gray-1000'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('closed')}
                  className={`px-3 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                    statusFilter === 'closed'
                      ? 'bg-background-100 text-gray-1000 shadow-2xs'
                      : 'text-gray-700 hover:text-gray-1000'
                  }`}
                >
                  Closed
                </button>
              </div>

              {/* Type Select */}
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-400 bg-background-200 text-xs font-mono text-gray-900 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors shrink-0"
              >
                <option value="all">All Types</option>
                <option value="REGULAR">REGULAR</option>
                <option value="AEDP">AEDP</option>
                <option value="PLI">PLI</option>
                <option value="internship">Internship</option>
                <option value="full-time">Full-Time</option>
                <option value="hackathon">Hackathon</option>
              </select>
            </div>
          </div>

          {/* Opportunities Grid / List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-56 rounded-xl border border-gray-400 bg-background-200 animate-pulse" />
              ))}
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-dashed border-gray-400 bg-background-100">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mb-3">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-1000">No Opportunities Found</h3>
              <p className="text-xs text-gray-600 mt-1 max-w-sm">
                {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'No postings match your current filter parameters. Try clearing your filters.'
                  : 'You have not created any opportunities yet. Click "Create Opportunity" to publish your first role.'}
              </p>
              {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setTypeFilter('all');
                  }}
                  className="mt-4 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-400 text-gray-900 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOpportunities.map(opp => (
                <div
                  key={opp._id}
                  onClick={() => navigate(`/admin/opportunities/${opp._id}`)}
                  className="group relative rounded-xl border border-gray-400 bg-background-100 hover:border-gray-900 dark:hover:border-gray-100 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Card Header Pills */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-gray-200 border border-gray-400 font-mono text-[10px] uppercase font-bold text-gray-800">
                          {opp.opportunityType || 'Role'}
                        </span>
                        {opp.experienceLevel && (
                          <span className="px-2 py-0.5 rounded bg-background-200 border border-gray-400 text-[10px] text-gray-700">
                            {opp.experienceLevel}
                          </span>
                        )}
                        {opp.jobDomainSpecificity !== undefined && (
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-[10px] font-mono text-purple-700 dark:text-purple-400 font-bold tracking-tight" title="Domain Specificity Strictness">
                            Domain Strictness: {Math.round(opp.jobDomainSpecificity * 100)}%
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleToggleStatus(e, opp._id)}
                        disabled={actionLoadingId === opp._id}
                        title={`Click to mark ${opp.isActive ? 'Closed' : 'Active'}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          opp.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-gray-200 text-gray-700 border border-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${opp.isActive ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                        <span>{opp.isActive ? 'Active' : 'Closed'}</span>
                      </button>
                    </div>

                    {/* Job Title & Company */}
                    <h3 className="text-sm font-bold text-gray-1000 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                      {opp.title}
                    </h3>
                    <p className="text-xs font-medium text-gray-700 mt-0.5 mb-3 flex items-center gap-1.5">
                      {opp.companyLogo ? (
                        <img 
                          src={opp.companyLogo} 
                          alt={opp.company} 
                          className="w-4 h-4 rounded object-contain bg-background-100 border border-gray-400 p-0.5 shrink-0" 
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : null}
                      <span>{opp.company}</span>
                    </p>

                    {/* Skills Tags */}
                    {opp.requiredSkills && opp.requiredSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {opp.requiredSkills.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 text-[10px] font-mono bg-background-200 text-gray-700 rounded border border-gray-400">
                            {skill}
                          </span>
                        ))}
                        {opp.requiredSkills.length > 3 && (
                          <span className="text-[10px] font-mono text-gray-600 self-center">
                            +{opp.requiredSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Strip */}
                  <div className="pt-3 border-t border-gray-400 flex items-center justify-between text-xs text-gray-600">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        <span className="truncate max-w-[90px]">{opp.location || 'Remote'}</span>
                      </span>
                      {opp.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span>{new Date(opp.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleDeleteOpportunity(e, opp._id, opp.title)}
                        title="Delete opportunity"
                        disabled={actionLoadingId === opp._id}
                        className="p-1 text-gray-500 hover:text-red-600 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CreateOpportunityModal
          onClose={() => setIsModalOpen(false)}
          onCreated={() => {
            setIsModalOpen(false);
            fetchOpportunities();
          }}
        />
      )}
    </div>
  );
}
