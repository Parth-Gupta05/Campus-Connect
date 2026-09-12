import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { FiArrowLeft, FiFilter, FiExternalLink, FiClock, FiZap, FiUser, FiMail, FiUsers } from 'react-icons/fi';
import PdfViewerModal from '../../components/PdfViewerModal';

export default function AdminOpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [opportunity, setOpportunity] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('time'); // 'time' or 'score'
  const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState('Applicant Resume');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [oppRes, appRes] = await Promise.all([
          axios.get(`/opportunities/${id}`), // Reuse existing public route to get details
          axios.get(`/admin/opportunities/${id}/applicants`) // New admin route
        ]);
        setOpportunity(oppRes.data.opportunity);
        setApplicants(appRes.data.applicants || []);
      } catch (err) {
        console.error('Error fetching opportunity details:', err);
        showToast('Failed to load details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const sortedApplicants = [...applicants].sort((a, b) => {
    if (sortBy === 'score') {
      const scoreA = a.matchScore || 0;
      const scoreB = b.matchScore || 0;
      return scoreB - scoreA;
    } else {
      // Sort by time (newest first)
      return new Date(b.appliedAt) - new Date(a.appliedAt);
    }
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-light px-8 py-5 flex items-center gap-4 shrink-0 shadow-sm">
        <button
          onClick={() => navigate('/admin/opportunities')}
          className="p-2 -ml-2 rounded-xl text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div>
          {loading ? (
            <div className="h-6 w-48 bg-surface-variant/40 rounded animate-pulse"></div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-on-surface tracking-tight leading-none">{opportunity?.title}</h1>
              <p className="text-xs text-on-surface-variant mt-1">{opportunity?.company} • {applicants.length} Applicants</p>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-surface-variant/30 rounded-2xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Filter / Sort Bar */}
            <div className="flex items-center justify-between bg-surface-container-lowest p-2 rounded-2xl border border-border-light shadow-sm">
              <span className="px-4 text-sm font-bold text-on-surface-variant">
                Applicants List
              </span>
              <div className="flex items-center gap-2 bg-surface p-1 rounded-xl border border-border-light">
                <span className="pl-3 pr-2 text-xs font-bold text-on-surface-variant flex items-center gap-1">
                  <FiFilter /> Sort By:
                </span>
                <button
                  onClick={() => setSortBy('time')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === 'time' ? 'bg-primary text-on-primary shadow-sm transform scale-[1.02]' : 'text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  Newest First
                </button>
                <button
                  onClick={() => setSortBy('score')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    sortBy === 'score' ? 'bg-primary text-on-primary shadow-sm transform scale-[1.02]' : 'text-on-surface-variant hover:bg-surface-variant'
                  }`}
                >
                  Highest AI Match
                </button>
              </div>
            </div>

            {/* Applicants List */}
            {applicants.length === 0 ? (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container-high mb-4">
                  <FiUsers className="text-2xl text-on-surface-variant" />
                </div>
                <h3 className="text-lg font-bold text-on-surface">No Applications Yet</h3>
                <p className="text-sm text-on-surface-variant mt-1">Wait for students to apply to this opportunity.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {sortedApplicants.map((app) => (
                  <div key={app._id} className="bg-surface border border-border-light rounded-2xl p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between transition-all hover:shadow-md hover:border-primary/30">
                    
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                      <img src={app.userId?.avatarUrl || `https://ui-avatars.com/api/?name=${app.userId?.name}&background=random`} alt="Avatar" className="w-12 h-12 rounded-full object-cover bg-surface-container" />
                      <div>
                        <h4 className="font-bold text-base text-on-surface flex items-center gap-2">
                          {app.userId?.name}
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-surface-container-high text-on-surface-variant rounded-full border border-border-light">{app.userId?.rollNo || 'N/A'}</span>
                        </h4>
                        <div className="text-xs text-on-surface-variant mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1"><FiMail /> {app.userId?.email}</span>
                          <span className="flex items-center gap-1"><FiUser /> {app.userId?.branch} ({app.userId?.graduationYear})</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Score & Action */}
                    <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 md:border-l border-border-light pt-4 md:pt-0 md:pl-6">
                      
                      <div className="text-center">
                        <span className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-1">AI Match</span>
                        {app.matchScoreCalculated ? (
                          <div className="flex items-center gap-1.5 justify-center">
                            <FiZap className={`text-sm ${app.matchScore > 75 ? 'text-success' : app.matchScore > 50 ? 'text-warning' : 'text-error'}`} />
                            <span className={`font-display-hero font-bold text-xl ${app.matchScore > 75 ? 'text-success' : app.matchScore > 50 ? 'text-warning' : 'text-error'}`}>
                              {app.matchScore}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">Processing...</span>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {(app.resumeId?.fileUrl || app.resumeUrl) ? (
                          <button
                            type="button"
                            onClick={() => {
                              const url = app.resumeId?.fileUrl || app.resumeUrl;
                              setSelectedPdfUrl(url);
                              setSelectedPdfTitle(`${app.userId?.name || 'Applicant'}'s Resume`);
                            }}
                            className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2 cursor-pointer"
                          >
                            View Resume <FiExternalLink />
                          </button>
                        ) : (
                          <span className="text-xs font-medium text-error px-4 py-2 bg-error/10 rounded-xl border border-error/20">No Resume</span>
                        )}
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-1">
                          <FiClock /> Applied {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedPdfUrl && (
          <PdfViewerModal
            url={selectedPdfUrl}
            title={selectedPdfTitle}
            onClose={() => setSelectedPdfUrl(null)}
          />
        )}
      </main>
    </div>
  );
}
