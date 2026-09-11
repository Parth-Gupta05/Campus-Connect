import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiPlus, FiBriefcase, FiMapPin, FiClock } from 'react-icons/fi';
import CreateOpportunityModal from '../../components/admin/CreateOpportunityModal';
import { useToast } from '../../context/ToastContext';

export default function AdminOpportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-light px-8 py-5 flex items-center justify-between shrink-0 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Opportunities Management</h1>
          <p className="text-sm text-on-surface-variant mt-1">Create and manage job postings and internships.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-on-primary-fixed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center gap-2"
        >
          <FiPlus className="text-lg" /> Create Opportunity
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-40 bg-surface-variant/40 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <FiBriefcase className="text-2xl text-primary" />
            </div>
            <h3 className="text-lg font-bold text-on-surface">No Opportunities Yet</h3>
            <p className="text-sm text-on-surface-variant mt-1 max-w-sm">You haven't posted any opportunities. Click the button above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {opportunities.map(opp => (
              <div
                key={opp._id}
                onClick={() => navigate(`/admin/opportunities/${opp._id}`)}
                className="bg-surface border border-border-light rounded-2xl p-6 cursor-pointer transition-all duration-300 transform hover:scale-[1.02] hover:shadow-md hover:border-primary/50 group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-surface-container-high text-on-surface-variant border border-border-light group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-colors">
                    {opp.opportunityType}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${opp.isActive ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'}`}>
                    {opp.isActive ? 'Active' : 'Closed'}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-on-surface leading-tight mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                  {opp.title}
                </h3>
                <p className="text-sm font-bold text-on-surface-variant mb-4">{opp.company}</p>

                <div className="flex-1">
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {opp.requiredSkills?.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 text-[10px] font-medium bg-surface-container text-on-surface-variant rounded border border-border-light">
                        {skill}
                      </span>
                    ))}
                    {opp.requiredSkills?.length > 3 && (
                      <span className="text-[10px] text-on-surface-variant self-center font-medium">+{opp.requiredSkills.length - 3}</span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-border-light flex justify-between items-center text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><FiMapPin /> <span className="truncate max-w-[100px]">{opp.location}</span></span>
                  <span className="flex items-center gap-1.5"><FiClock /> {new Date(opp.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

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
