import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { X, Plus, Loader2, Briefcase, MapPin, Calendar, DollarSign, Layers } from 'lucide-react';
import CompanySearchInput from '../CompanySearchInput';

export default function CreateOpportunityModal({ onClose, onCreated }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const isAlreadyLocked = document.body.style.overflow === 'hidden';
    if (!isAlreadyLocked) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    }
  }, []);

  const [formData, setFormData] = useState({
    title: '',
    company: '',
    companyLogo: '',
    companyDomain: '',
    location: 'Remote',
    opportunityType: 'REGULAR',
    jobDescription: '',
    requiredSkills: '',
    experienceLevel: 'Entry Level',
    stipendOrSalary: '',
    applyLink: '',
    deadline: ''
  });

  const [companySelection, setCompanySelection] = useState({
    name: '',
    domain: '',
    logoUrl: '',
    isCustom: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCompanyChange = (item) => {
    setCompanySelection(item || { name: '', domain: '', logoUrl: '', isCustom: false });
    setFormData(prev => ({
      ...prev,
      company: item?.name || '',
      companyLogo: item?.logoUrl || '',
      companyDomain: item?.domain || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const companyName = (companySelection.name || formData.company || '').trim();
    if (!companyName) {
      showToast('Please specify a company / organization', 'error');
      return;
    }

    setLoading(true);

    try {
      const skillsArray = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);
      
      const payload = {
        ...formData,
        company: companyName,
        companyLogo: companySelection.logoUrl || formData.companyLogo || '',
        companyDomain: companySelection.domain || formData.companyDomain || '',
        requiredSkills: skillsArray,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      };

      const res = await axios.post('/admin/opportunities', payload);
      showToast(res.data.message || 'Opportunity created successfully', 'success');
      onCreated();
    } catch (err) {
      console.error('Error creating opportunity:', err);
      showToast(err.response?.data?.message || 'Failed to create opportunity', 'error');
    } finally {
      setLoading(false);
    }
  };

  const parsedSkills = formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 overscroll-contain animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-background-100 border border-gray-400 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-start border-b border-gray-400 pb-4 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gray-200 border border-gray-400 flex items-center justify-center text-gray-1000">
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              <h3 className="font-bold text-base text-gray-1000 tracking-tight">Create New Opportunity</h3>
            </div>
            <p className="text-xs text-gray-600 mt-1">Post a new job, internship, or hackathon to student discovery feeds.</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-700 hover:text-gray-1000 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <div className="overflow-y-auto py-4 custom-scrollbar flex-1 pr-1">
          <form id="create-opp-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Position Title *</label>
                <input 
                  required 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none transition-colors" 
                  placeholder="e.g. Graduate Software Engineer" 
                />
              </div>
              <div className="relative z-30">
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Company / Organization *</label>
                <CompanySearchInput
                  value={companySelection}
                  onChange={handleCompanyChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Opportunity Type</label>
                <select 
                  name="opportunityType" 
                  value={formData.opportunityType} 
                  onChange={handleChange} 
                  className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none transition-colors"
                >
                  <option value="REGULAR">REGULAR</option>
                  <option value="AEDP">AEDP</option>
                  <option value="PLI">PLI</option>
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-Time</option>
                  <option value="contract">Contract</option>
                  <option value="hackathon">Hackathon</option>
                  <option value="project">Project</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Location / Mode</label>
                <input 
                  type="text" 
                  name="location" 
                  value={formData.location} 
                  onChange={handleChange} 
                  className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none transition-colors" 
                  placeholder="Remote, Bengaluru, Hybrid" 
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Experience Level</label>
                <select 
                  name="experienceLevel" 
                  value={formData.experienceLevel} 
                  onChange={handleChange} 
                  className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none transition-colors"
                >
                  <option value="Entry Level">Entry Level</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Senior">Senior</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Job Description & Responsibilities *</label>
              <textarea 
                required 
                rows="4" 
                name="jobDescription" 
                value={formData.jobDescription} 
                onChange={handleChange} 
                className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none transition-colors font-sans" 
                placeholder="Detail role objectives, eligibility criteria, interview process, and expectations..." 
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">
                Required Technical Skills (Comma-separated)
              </label>
              <input 
                type="text" 
                name="requiredSkills" 
                value={formData.requiredSkills} 
                onChange={handleChange} 
                className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none transition-colors" 
                placeholder="React, TypeScript, Node.js, PostgreSQL, Docker" 
              />
              {parsedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parsedSkills.map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-gray-200 border border-gray-400 text-[11px] font-mono text-gray-900">
                      {sk}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Stipend / CTC</label>
                <input 
                  type="text" 
                  name="stipendOrSalary" 
                  value={formData.stipendOrSalary} 
                  onChange={handleChange} 
                  className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none transition-colors" 
                  placeholder="e.g. ₹50,000/mo or 14 LPA" 
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">External Apply Link</label>
                <input 
                  type="url" 
                  name="applyLink" 
                  value={formData.applyLink} 
                  onChange={handleChange} 
                  className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none transition-colors" 
                  placeholder="https://careers.company.com/..." 
                />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Application Deadline</label>
                <input 
                  type="date" 
                  name="deadline" 
                  value={formData.deadline} 
                  onChange={handleChange} 
                  className="w-full bg-background-200 border border-gray-400 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-gray-1000 focus:border-gray-900 dark:focus:border-gray-100 focus:outline-none transition-colors" 
                />
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-gray-400 flex justify-end gap-2.5 shrink-0">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 rounded-md text-xs font-medium text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="create-opp-form" 
            disabled={loading} 
            className="px-4 py-2 bg-gray-1000 text-background-100 rounded-md text-xs font-medium hover:opacity-90 shadow-xs transition-opacity disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Publish Opportunity</span>
          </button>
        </div>
      </div>
    </div>
  );
}
