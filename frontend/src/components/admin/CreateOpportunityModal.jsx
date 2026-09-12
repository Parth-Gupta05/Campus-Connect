import React, { useState } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { FiX, FiPlus, FiLoader } from 'react-icons/fi';

export default function CreateOpportunityModal({ onClose, onCreated }) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: 'Remote',
    opportunityType: 'REGULAR',
    jobDescription: '',
    requiredSkills: '',
    experienceLevel: 'Entry Level',
    stipendOrSalary: '',
    applyLink: '',
    deadline: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Process required skills into an array
      const skillsArray = formData.requiredSkills.split(',').map(s => s.trim()).filter(s => s);
      
      const payload = {
        ...formData,
        requiredSkills: skillsArray,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      };

      const res = await axios.post('/admin/opportunities', payload);
      showToast(res.data.message || 'Opportunity created!', 'success');
      onCreated();
    } catch (err) {
      console.error('Error creating opportunity:', err);
      showToast(err.response?.data?.message || 'Failed to create opportunity', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full p-6 shadow-ambient border border-border-light animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center border-b border-border-light pb-4 shrink-0">
          <div>
            <h3 className="font-bold text-headline-sm text-on-surface">Create Opportunity</h3>
            <p className="text-xs text-on-surface-variant mt-1">Fill in the details to post a new job or internship.</p>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-variant p-2 rounded-xl transition-colors"
          >
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 custom-scrollbar flex-1">
          <form id="create-opp-form" onSubmit={handleSubmit} className="space-y-4 px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Title</label>
                <input required type="text" name="title" value={formData.title} onChange={handleChange} className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="e.g. Software Engineer Intern" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Company</label>
                <input required type="text" name="company" value={formData.company} onChange={handleChange} className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="e.g. Google" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Type</label>
                <select name="opportunityType" value={formData.opportunityType} onChange={handleChange} className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                  <option value="REGULAR">REGULAR</option>
                  <option value="AEDP">AEDP</option>
                  <option value="PLI">PLI</option>
                  <option value="internship">Internship</option>
                  <option value="full-time">Full-Time</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Location</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Remote, Hybrid, etc." />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Level</label>
                <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all">
                  <option value="Entry Level">Entry Level</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Senior">Senior</option>
                  <option value="All Levels">All Levels</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Job Description</label>
              <textarea required rows="4" name="jobDescription" value={formData.jobDescription} onChange={handleChange} className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Describe the responsibilities and requirements..." />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Required Skills (Comma separated)</label>
              <input type="text" name="requiredSkills" value={formData.requiredSkills} onChange={handleChange} className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="React, Node.js, Python..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Stipend / Salary</label>
                <input type="text" name="stipendOrSalary" value={formData.stipendOrSalary} onChange={handleChange} className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="e.g. 50k INR/month" />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Apply Link (Optional)</label>
                <input type="url" name="applyLink" value={formData.applyLink} onChange={handleChange} className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="External link..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Deadline</label>
                <input type="date" name="deadline" value={formData.deadline} onChange={handleChange} className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>
            </div>
          </form>
        </div>

        <div className="pt-4 border-t border-border-light flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:bg-surface-variant transition-colors">Cancel</button>
          <button type="submit" form="create-opp-form" disabled={loading} className="px-6 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-on-primary-fixed shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center gap-2">
            {loading ? <FiLoader className="animate-spin text-lg" /> : <FiPlus className="text-lg" />}
            Publish Opportunity
          </button>
        </div>
      </div>
    </div>
  );
}
