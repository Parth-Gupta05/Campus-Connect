import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FiLoader, FiSearch, FiBriefcase, FiMapPin, FiClock, FiCheckCircle, FiUploadCloud, FiZap, FiBookmark, FiExternalLink } from 'react-icons/fi';

export default function Opportunities() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [opportunities, setOpportunities] = useState([]);
  const [selectedOpp, setSelectedOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [appliedOppIds, setAppliedOppIds] = useState(new Set());
  
  // Apply Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);

  const fetchOpportunities = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedType && selectedType !== 'ALL') params.type = selectedType;

      const res = await axios.get('/opportunities', { params });
      const list = res.data.opportunities || [];
      setOpportunities(list);

      // Maintain selection or select first item
      if (list.length > 0) {
        if (!selectedOpp || !list.find(o => o._id === selectedOpp._id)) {
          setSelectedOpp(list[0]);
        }
      } else {
        setSelectedOpp(null);
      }
    } catch (err) {
      console.error('Error fetching opportunities:', err);
      showToast('Failed to load opportunities', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [selectedType]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchOpportunities();
  };

  const handleApplySubmit = async (e) => {
    if (e) e.preventDefault();
    if (!selectedOpp) return;

    setApplying(true);
    try {
      const formData = new FormData();
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const res = await axios.post(`/opportunities/${selectedOpp._id}/apply`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast(res.data.message || 'Application submitted successfully!', 'success');
      setAppliedOppIds(prev => new Set(prev).add(selectedOpp._id));
      setIsApplyModalOpen(false);
      setResumeFile(null);
    } catch (err) {
      console.error('Error applying for opportunity:', err);
      const msg = err.response?.data?.message || 'Failed to submit application';
      showToast(msg, 'error');
    } finally {
      setApplying(false);
    }
  };

  const isApplied = selectedOpp && appliedOppIds.has(selectedOpp._id);

  const filterTypes = ['ALL', 'AEDP', 'PLI', 'REGULAR', 'full-time', 'internship'];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-light px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
          <div>
            <h1 className="font-display-hero text-headline-md font-bold text-on-surface tracking-tight flex items-center gap-2">
              <FiBriefcase className="text-primary text-2xl" /> Campus Opportunities
            </h1>
            <p className="text-xs text-on-surface-variant">
              Explore placement drives, internships, AEDP, and PLI roles tailored for you.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base" />
              <input
                type="text"
                placeholder="Search jobs, skills, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-border-light rounded-xl text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-medium hover:bg-on-primary-fixed transition-colors shadow-sm"
            >
              Search
            </button>
          </form>
        </header>

        {/* Filter Pills Bar */}
        <div className="bg-surface border-b border-border-light px-6 py-2.5 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mr-2">Filter:</span>
          {filterTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                selectedType === type
                  ? 'bg-primary text-on-primary border-primary shadow-sm font-bold'
                  : 'bg-surface-container-low text-on-surface-variant border-border-light hover:border-primary/50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Main Split Content Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Opportunities List */}
          <div className="w-full md:w-5/12 lg:w-4/12 border-r border-border-light flex flex-col bg-surface overflow-y-auto shrink-0">
            <div className="p-4 border-b border-border-light flex justify-between items-center bg-surface-container-low/50">
              <span className="text-xs font-bold text-on-surface-variant">
                {opportunities.length} {opportunities.length === 1 ? 'Job' : 'Jobs'} Available
              </span>
              <span className="text-xs text-primary font-medium">Sorted by Recent</span>
            </div>

            {loading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-surface-variant/40 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : opportunities.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center flex-1 text-on-surface-variant">
                <FiBriefcase className="text-4xl text-on-surface-variant/50 mb-3" />
                <p className="font-bold text-on-surface mb-1">No Opportunities Found</p>
                <p className="text-xs">Try clearing search filters or checking back later.</p>
              </div>
            ) : (
              <div className="divide-y divide-border-light">
                {opportunities.map((opp) => {
                  const isSelected = selectedOpp && selectedOpp._id === opp._id;
                  const hasApplied = appliedOppIds.has(opp._id);

                  return (
                    <div
                      key={opp._id}
                      onClick={() => setSelectedOpp(opp)}
                      className={`p-5 cursor-pointer transition-all relative border-l-4 ${
                        isSelected
                          ? 'bg-primary-container/15 border-primary shadow-sm'
                          : 'border-transparent hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <h3 className="font-bold text-on-surface text-base line-clamp-1 leading-snug">
                          {opp.title}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface-variant text-on-surface-variant border border-border-light shrink-0 ml-2">
                          {opp.opportunityType}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-on-surface-variant mb-2 flex items-center gap-1">
                        <FiBriefcase className="text-xs text-primary shrink-0" />
                        <span>{opp.company}</span>
                        <span className="mx-1">•</span>
                        <FiMapPin className="text-xs text-on-surface-variant shrink-0" />
                        <span className="truncate">{opp.location}</span>
                      </p>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {opp.requiredSkills?.slice(0, 3).map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[10px] font-medium bg-surface-container text-primary rounded border border-border-light"
                          >
                            {skill}
                          </span>
                        ))}
                        {opp.requiredSkills?.length > 3 && (
                          <span className="text-[10px] text-on-surface-variant self-center font-medium">
                            +{opp.requiredSkills.length - 3} more
                          </span>
                        )}
                      </div>

                      <div className="flex justify-between items-center text-[11px] text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <FiClock className="text-xs" />
                          {new Date(opp.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>

                        {hasApplied && (
                          <span className="text-success font-bold flex items-center gap-1">
                            <FiCheckCircle className="text-xs" /> Applied
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Opportunity Detail View */}
          <div className="hidden md:flex flex-1 flex-col bg-surface-container-lowest overflow-y-auto p-6 md:p-8">
            {selectedOpp ? (
              <div className="max-w-4xl w-full mx-auto space-y-6">
                {/* Header Info Banner */}
                <div className="bg-surface border border-border-light rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 text-xs font-bold uppercase rounded-full bg-primary/10 text-primary border border-primary/20">
                          {selectedOpp.opportunityType}
                        </span>
                        <span className="text-xs text-on-surface-variant flex items-center gap-1">
                          <FiClock /> Posted {new Date(selectedOpp.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h2 className="text-headline-md font-bold text-on-surface leading-tight">
                        {selectedOpp.title}
                      </h2>
                      <p className="text-body-md text-on-surface-variant font-medium mt-1 flex items-center gap-2">
                        <span className="font-bold text-on-surface">{selectedOpp.company}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><FiMapPin className="text-primary" /> {selectedOpp.location}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setIsApplyModalOpen(true)}
                        disabled={isApplied || applying}
                        className={`px-6 py-2.5 rounded-xl font-button-text text-sm transition-all shadow-sm flex items-center gap-2 ${
                          isApplied
                            ? 'bg-success/15 text-success font-bold border border-success/30 cursor-default'
                            : 'bg-primary text-on-primary hover:bg-on-primary-fixed hover:shadow-md'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <FiCheckCircle className="text-base" /> Applied
                          </>
                        ) : (
                          <>
                            <FiBriefcase className="text-base" /> Apply Now
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* AI Match Feature Banner */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 via-surface-container to-secondary-container/20 border border-primary/20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-sm">
                        <FiZap className="text-xl animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-on-surface">Find out how well you match with this job</h4>
                        <p className="text-xs text-on-surface-variant">Our AI background workers generate requirement vector similarity scores.</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsApplyModalOpen(true)}
                      className="px-4 py-2 bg-surface text-on-surface text-xs font-bold rounded-lg border border-border-light hover:border-primary transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <FiUploadCloud className="text-primary text-sm" />
                      {user?.resumeUrl ? 'Apply with Resume' : 'Upload Resume'}
                    </button>
                  </div>
                </div>

                {/* Job Info Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface p-4 rounded-xl border border-border-light">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Opportunity Type</span>
                    <span className="font-bold text-on-surface text-sm capitalize">{selectedOpp.opportunityType}</span>
                  </div>
                  <div className="bg-surface p-4 rounded-xl border border-border-light">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Location</span>
                    <span className="font-bold text-on-surface text-sm">{selectedOpp.location}</span>
                  </div>
                  <div className="bg-surface p-4 rounded-xl border border-border-light">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Experience Level</span>
                    <span className="font-bold text-on-surface text-sm">{selectedOpp.experienceLevel || 'Entry Level'}</span>
                  </div>
                  <div className="bg-surface p-4 rounded-xl border border-border-light">
                    <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Stipend / Salary</span>
                    <span className="font-bold text-primary text-sm">{selectedOpp.stipendOrSalary || 'As per norms'}</span>
                  </div>
                </div>

                {/* Insights & Required Skills */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 bg-surface p-6 rounded-2xl border border-border-light space-y-4">
                    <h3 className="font-bold text-headline-sm text-on-surface border-b border-border-light pb-3">
                      Job Description
                    </h3>
                    <div className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-line font-body">
                      {selectedOpp.jobDescription}
                    </div>

                    {selectedOpp.applyLink && (
                      <div className="pt-4 border-t border-border-light">
                        <a
                          href={selectedOpp.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                        >
                          Visit Company Application Portal <FiExternalLink />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right Insights Box */}
                  <div className="bg-surface p-6 rounded-2xl border border-border-light space-y-4 h-fit">
                    <h4 className="font-bold text-sm text-on-surface uppercase tracking-wider">
                      Insights & Required Skills
                    </h4>

                    <div>
                      <span className="text-xs font-bold text-on-surface-variant block mb-2">Required Skills</span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedOpp.requiredSkills?.map((skill, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 bg-surface-container-high text-primary rounded-lg text-xs font-medium border border-border-light"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border-light text-xs text-on-surface-variant space-y-2">
                      <p className="flex justify-between">
                        <span>Application Status:</span>
                        <span className="font-bold text-on-surface">{selectedOpp.isActive ? 'Active' : 'Closed'}</span>
                      </p>
                      {selectedOpp.deadline && (
                        <p className="flex justify-between">
                          <span>Deadline:</span>
                          <span className="font-bold text-error">{new Date(selectedOpp.deadline).toLocaleDateString()}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-on-surface-variant">
                <FiBriefcase className="text-5xl mb-4 opacity-40 text-primary" />
                <h3 className="text-headline-sm font-bold text-on-surface mb-2">Select an Opportunity</h3>
                <p className="text-xs max-w-sm">Choose a job listing from the left panel to view its full details and submit your application.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Apply with Resume Modal */}
      {isApplyModalOpen && selectedOpp && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-ambient border border-border-light space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center border-b border-border-light pb-4">
              <div>
                <h3 className="font-bold text-headline-sm text-on-surface">Apply for Opportunity</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{selectedOpp.title} • {selectedOpp.company}</p>
              </div>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="space-y-5">
              {/* Resume File Upload Box */}
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">
                  Attach Resume PDF (Optional)
                </label>
                <div className="border-2 border-dashed border-border-light hover:border-primary/50 bg-surface-container-low rounded-2xl p-6 text-center transition-colors relative cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setResumeFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {resumeFile ? (
                    <div className="text-primary font-bold text-xs flex flex-col items-center gap-1">
                      <FiCheckCircle className="text-2xl text-success" />
                      <span>{resumeFile.name}</span>
                      <span className="text-[10px] text-on-surface-variant font-normal">Click to change PDF</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-on-surface-variant">
                      <FiUploadCloud className="text-3xl text-primary mb-1" />
                      <span className="text-xs font-bold text-on-surface">Upload custom PDF resume</span>
                      <span className="text-[11px]">
                        {user?.resumeUrl ? 'Or leave empty to use default profile resume' : 'Drag & drop or click to browse'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {user?.resumeUrl && !resumeFile && (
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-2">
                  <FiCheckCircle className="text-base shrink-0 text-success" />
                  <span>Default profile resume will be attached automatically.</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-variant transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={applying}
                  className="bg-primary text-on-primary px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-on-primary-fixed transition-colors shadow flex items-center gap-2 disabled:opacity-50"
                >
                  {applying ? <FiLoader className="animate-spin text-sm" /> : <FiBriefcase className="text-sm" />}
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
