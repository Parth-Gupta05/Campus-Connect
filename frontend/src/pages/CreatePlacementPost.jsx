import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CompanySearchInput from '../components/CompanySearchInput';
import RichTextEditor from '../components/RichTextEditor';

import {
  ArrowLeft,
  Check,
  X,
  Briefcase,
  Layers,
  FileText,
  Paperclip,
  UploadCloud,
  IndianRupee,
  Loader2
} from 'lucide-react';

const ASSESSMENT_TYPE_OPTIONS = [
  { id: 'coding_round', label: 'Coding Round (DSA)' },
  { id: 'online_test', label: 'Online Technical Test' },
  { id: 'mcq', label: 'MCQ Assessment' },
  { id: 'aptitude', label: 'Aptitude Round' },
  { id: 'case_study', label: 'Case Study' },
  { id: 'group_discussion', label: 'Group Discussion' },
  { id: 'hackathon', label: 'Hackathon / Project' },
  { id: 'take_home_assignment', label: 'Take-Home Assignment' }
];

const INTERVIEW_TYPE_OPTIONS = [
  { id: 'technical', label: 'Technical Round' },
  { id: 'system_design', label: 'System Design' },
  { id: 'hr', label: 'HR Round' },
  { id: 'behavioral', label: 'Behavioral' },
  { id: 'managerial', label: 'Managerial' },
  { id: 'culture_fit', label: 'Culture Fit' },
  { id: 'panel', label: 'Panel Interview' }
];

const INTERVIEW_MODE_OPTIONS = [
  { id: 'online', label: 'Online (Zoom / Meet)' },
  { id: 'offline', label: 'On-Campus / In-Person' },
  { id: 'hybrid', label: 'Hybrid' }
];

export default function CreatePlacementPost() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [submitting, setSubmitting] = useState(false);

  // Form States
  const [company, setCompany] = useState({
    name: '',
    domain: '',
    logoUrl: '',
    isCustom: false
  });
  const [role, setRole] = useState('');
  const [postType, setPostType] = useState('interview_experience');

  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryPeriod, setSalaryPeriod] = useState('annual');
  const [salaryCurrency, setSalaryCurrency] = useState('INR');

  const [jobType, setJobType] = useState('full_time');
  const [workMode, setWorkMode] = useState('onsite');
  const [location, setLocation] = useState('');

  const [difficulty, setDifficulty] = useState('medium');
  const [outcome, setOutcome] = useState('selected');

  // Multi-select Checkbox States
  const [assessmentTypes, setAssessmentTypes] = useState([]);
  const [interviewTypes, setInterviewTypes] = useState([]);
  const [interviewModes, setInterviewModes] = useState([]);
  const [numberOfRounds, setNumberOfRounds] = useState('3');

  const [branch, setBranch] = useState(user?.branch || '');
  const [graduationYear, setGraduationYear] = useState(user?.graduationYear || '');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Tags
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['DSA', 'InterviewExperience']);

  // Document Attachment (1 optional file)
  const [existingDoc, setExistingDoc] = useState({ url: '', name: '' });
  const [newDocFile, setNewDocFile] = useState(null);
  const docInputRef = useRef(null);

  // Load existing post if editing
  useEffect(() => {
    if (isEditing) {
      const fetchPost = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`/placements/${id}`);
          const p = res.data;

          if (user && p.author?._id !== user.id && user.role !== 'admin') {
            showToast('You are not authorized to edit this post', 'error');
            navigate('/placements');
            return;
          }

          setCompany(p.company || { name: '', domain: '', logoUrl: '', isCustom: false });
          setRole(p.role || '');
          setPostType(p.postType || 'interview_experience');

          if (p.salary?.amount) setSalaryAmount(p.salary.amount.toString());
          if (p.salary?.period) setSalaryPeriod(p.salary.period);
          if (p.salary?.currency) setSalaryCurrency(p.salary.currency);

          if (p.jobType) setJobType(p.jobType);
          if (p.workMode) setWorkMode(p.workMode);
          if (p.location) setLocation(p.location);

          if (p.difficulty) setDifficulty(p.difficulty);
          if (p.outcome) setOutcome(p.outcome);

          if (Array.isArray(p.assessmentTypes) && p.assessmentTypes.length > 0) {
            setAssessmentTypes(p.assessmentTypes);
          } else if (p.assessmentType) {
            setAssessmentTypes([p.assessmentType]);
          }

          if (Array.isArray(p.interviewTypes) && p.interviewTypes.length > 0) {
            setInterviewTypes(p.interviewTypes);
          } else if (p.interviewType) {
            setInterviewTypes([p.interviewType]);
          }

          if (Array.isArray(p.interviewModes) && p.interviewModes.length > 0) {
            setInterviewModes(p.interviewModes);
          } else if (p.interviewMode) {
            setInterviewModes([p.interviewMode]);
          }

          if (p.numberOfRounds) setNumberOfRounds(p.numberOfRounds.toString());

          if (p.branch) setBranch(p.branch);
          if (p.graduationYear) setGraduationYear(p.graduationYear);

          setTitle(p.title || '');
          setContent(p.content || '');
          setTags(p.tags || []);

          if (p.attachmentUrl) {
            setExistingDoc({ url: p.attachmentUrl, name: p.attachmentName || 'Document' });
          }
        } catch (err) {
          showToast('Failed to load post data', 'error');
          navigate('/placements');
        } finally {
          setLoading(false);
        }
      };
      fetchPost();
    }
  }, [id, isEditing, user]);

  const toggleAssessmentType = (typeId) => {
    setAssessmentTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const toggleInterviewType = (typeId) => {
    setInterviewTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const toggleInterviewMode = (modeId) => {
    setInterviewModes((prev) =>
      prev.includes(modeId) ? prev.filter((m) => m !== modeId) : [...prev, modeId]
    );
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleDocFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setNewDocFile(file);
      setExistingDoc({ url: '', name: '' });
    }
  };

  const handleRemoveDoc = () => {
    setExistingDoc({ url: '', name: '' });
    setNewDocFile(null);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!company.name.trim()) {
      showToast('Please select or enter a company name', 'error');
      return;
    }
    if (!role.trim()) {
      showToast('Please enter the job role / designation', 'error');
      return;
    }
    if (!title.trim()) {
      showToast('Please enter a post title', 'error');
      return;
    }
    if (!content.trim() || content === '<p></p>') {
      showToast('Please write some content for your experience', 'error');
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('companyName', company.name);
      formData.append('companyDomain', company.domain || '');
      formData.append('companyLogoUrl', company.logoUrl || '');
      formData.append('isCustomCompany', company.isCustom ? 'true' : 'false');

      formData.append('role', role);
      formData.append('postType', postType);

      if (salaryAmount) {
        formData.append('salaryAmount', salaryAmount);
        formData.append('salaryPeriod', salaryPeriod);
        formData.append('salaryCurrency', salaryCurrency);
      }

      formData.append('jobType', jobType);
      formData.append('workMode', workMode);
      formData.append('location', location);

      formData.append('difficulty', difficulty);
      formData.append('outcome', outcome);

      formData.append('assessmentTypes', JSON.stringify(assessmentTypes));
      formData.append('interviewTypes', JSON.stringify(interviewTypes));
      formData.append('interviewModes', JSON.stringify(interviewModes));
      formData.append('numberOfRounds', numberOfRounds || '1');

      formData.append('branch', branch);
      formData.append('graduationYear', graduationYear);

      formData.append('title', title);
      formData.append('content', content);
      formData.append('tags', JSON.stringify(tags));

      if (newDocFile) {
        formData.append('attachment', newDocFile);
      } else if (existingDoc.url) {
        formData.append('existingAttachmentUrl', existingDoc.url);
        formData.append('existingAttachmentName', existingDoc.name);
      }

      if (isEditing) {
        await axios.put(`/placements/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Placement experience updated successfully!', 'success');
        navigate(`/placements/${id}`);
      } else {
        const res = await axios.post('/placements', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        showToast('Experience posted successfully to the community!', 'success');
        navigate(`/placements/${res.data.post._id}`);
      }
    } catch (err) {
      console.error('Error saving placement post:', err);
      showToast(err.response?.data?.message || 'Failed to save experience post', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gray-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 bg-background-100">

        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
          {/* Top Back Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/placements"
              className="h-8 px-3 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors shadow-2xs inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Feed</span>
            </Link>

            <span className="text-xs text-gray-600 font-sans">
              Posting as: <span className="font-semibold text-gray-900">{user?.name}</span> ({user?.branch || 'General'} '{user?.graduationYear ? user.graduationYear.slice(-2) : ''})
            </span>
          </div>

          {/* Header Title */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-400">
            <div className="w-10 h-10 rounded-xl bg-background-100 border border-gray-400 text-gray-1000 flex items-center justify-center shrink-0 shadow-2xs">
              <FileText className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-1000">
                {isEditing ? 'Edit Placement Experience' : 'Share Placement Experience'}
              </h1>
              <p className="text-xs text-gray-700 font-sans mt-0.5">
                Share your selection rounds, questions asked, compensation breakdown, and tips for juniors.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: Company & Role Details */}
            <div className="bg-background-100 border border-gray-400 rounded-xl p-6 shadow-2xs space-y-5 text-gray-1000">
              <h2 className="text-sm font-semibold text-gray-1000 flex items-center gap-2 border-b border-gray-400 pb-3">
                <Briefcase className="w-4 h-4 text-gray-700" />
                <span>1. Company &amp; Role Details</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Company Autocomplete Input */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-800">
                    Company Name *
                  </label>
                  <CompanySearchInput
                    value={company}
                    onChange={setCompany}
                    disabled={submitting}
                  />
                  <p className="text-[11px] text-gray-600 font-sans">
                    Search from company directory or type manually if unlisted.
                  </p>
                </div>

                {/* Role / Designation */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-800">
                    Role / Position *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. SDE Intern, Graduate Analyst"
                    className="w-full h-9 px-3 rounded-md border border-gray-400 bg-background-200 text-gray-1000 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 focus:bg-background-100 text-xs font-medium transition-all shadow-2xs"
                  />
                </div>

                {/* Post Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-800">
                    Experience Type *
                  </label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-gray-400 bg-background-200 text-gray-1000 focus:outline-none focus:border-gray-900 focus:bg-background-100 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="interview_experience">Full Interview Experience</option>
                    <option value="assessment_experience">Online Assessment / Test Questions</option>
                    <option value="offer_received">Offer Received &amp; Breakdown</option>
                    <option value="rejection_experience">Rejection &amp; Key Learnings</option>
                    <option value="referral_share">Referral / Opportunity Share</option>
                    <option value="tips_and_advice">Preparation Tips &amp; Roadmap</option>
                  </select>
                </div>

                {/* Job Type */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-800">
                    Job Type
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-gray-400 bg-background-200 text-gray-1000 focus:outline-none focus:border-gray-900 focus:bg-background-100 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="full_time">Full-Time (FTE)</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract / Freelance</option>
                  </select>
                </div>

                {/* Work Mode & Location */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-800">
                    Work Mode &amp; Location
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      className="h-9 px-3 rounded-md border border-gray-400 bg-background-200 text-gray-1000 text-xs font-medium focus:outline-none focus:border-gray-900 focus:bg-background-100 cursor-pointer shadow-2xs"
                    >
                      <option value="onsite">Onsite</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bangalore, Mumbai"
                      className="flex-1 h-9 px-3 rounded-md border border-gray-400 bg-background-200 text-gray-1000 text-xs font-medium focus:outline-none focus:border-gray-900 focus:bg-background-100 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Compensation */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="block text-xs font-medium text-gray-800">
                    Compensation (CTC / Stipend)
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <IndianRupee className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                      <input
                        type="number"
                        value={salaryAmount}
                        onChange={(e) => setSalaryAmount(e.target.value)}
                        placeholder="e.g. 1500000 (15 LPA) or 45000 (monthly)"
                        className="w-full h-9 pl-9 pr-3 rounded-md border border-gray-400 bg-background-200 text-gray-1000 text-xs font-medium focus:outline-none focus:border-gray-900 focus:bg-background-100 shadow-2xs"
                      />
                    </div>
                    <select
                      value={salaryPeriod}
                      onChange={(e) => setSalaryPeriod(e.target.value)}
                      className="h-9 px-3 rounded-md border border-gray-400 bg-background-200 text-gray-1000 text-xs font-medium focus:outline-none focus:border-gray-900 focus:bg-background-100 cursor-pointer shadow-2xs"
                    >
                      <option value="annual">Annual CTC (Per Annum)</option>
                      <option value="stipend_per_month">Monthly Stipend</option>
                      <option value="monthly">Monthly Fixed</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-gray-600 font-sans">
                    Optional: Entering the compensation helps students filter experiences by tier.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: Assessment & Interview Breakdown */}
            <div className="bg-background-100 border border-gray-400 rounded-xl p-6 shadow-2xs space-y-5 text-gray-1000">
              <h2 className="text-sm font-semibold text-gray-1000 flex items-center gap-2 border-b border-gray-400 pb-3">
                <Layers className="w-4 h-4 text-gray-700" />
                <span>2. Rounds &amp; Evaluation Stages</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Final Outcome */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-800">
                    Final Outcome
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-gray-400 bg-background-200 text-gray-1000 text-xs font-medium focus:outline-none focus:border-gray-900 focus:bg-background-100 cursor-pointer shadow-2xs"
                  >
                    <option value="selected">Selected / Received Offer</option>
                    <option value="rejected">Rejected</option>
                    <option value="waitlisted">Waitlisted</option>
                    <option value="in_process">In Process</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-800">
                    Overall Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full h-9 px-3 rounded-md border border-gray-400 bg-background-200 text-gray-1000 text-xs font-medium focus:outline-none focus:border-gray-900 focus:bg-background-100 cursor-pointer shadow-2xs"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="very_hard">Very Hard</option>
                  </select>
                </div>

                {/* Number of Rounds */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-gray-800">
                    Number of Rounds
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={numberOfRounds}
                    onChange={(e) => setNumberOfRounds(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full h-9 px-3 rounded-md border border-gray-400 bg-background-200 text-gray-1000 text-xs font-medium focus:outline-none focus:border-gray-900 focus:bg-background-100 shadow-2xs"
                  />
                </div>
              </div>

              {/* Assessment Types */}
              <div className="space-y-2 pt-2 border-t border-gray-300 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-800">
                    Assessment Rounds
                  </label>
                  <span className="text-[10px] font-mono text-gray-600">Select all that applied</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ASSESSMENT_TYPE_OPTIONS.map((opt) => {
                    const isChecked = assessmentTypes.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleAssessmentType(opt.id)}
                        className={`h-8 px-2.5 rounded-md border text-xs font-medium text-left transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
                          isChecked
                            ? 'border-gray-1000 bg-gray-1000 text-background-100 font-semibold shadow-xs'
                            : 'border-gray-400 bg-background-200 text-gray-800 hover:text-gray-1000 hover:bg-gray-300 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isChecked && <Check className="w-3 h-3 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interview Types */}
              <div className="space-y-2 pt-2 border-t border-gray-300 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-800">
                    Interview Rounds
                  </label>
                  <span className="text-[10px] font-mono text-gray-600">Select all that applied</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {INTERVIEW_TYPE_OPTIONS.map((opt) => {
                    const isChecked = interviewTypes.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleInterviewType(opt.id)}
                        className={`h-8 px-2.5 rounded-md border text-xs font-medium text-left transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
                          isChecked
                            ? 'border-gray-1000 bg-gray-1000 text-background-100 font-semibold shadow-xs'
                            : 'border-gray-400 bg-background-200 text-gray-800 hover:text-gray-1000 hover:bg-gray-300 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isChecked && <Check className="w-3 h-3 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interview Modes */}
              <div className="space-y-2 pt-2 border-t border-gray-300 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-gray-800">
                    Evaluation Mode
                  </label>
                  <span className="text-[10px] font-mono text-gray-600">Optional</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {INTERVIEW_MODE_OPTIONS.map((opt) => {
                    const isChecked = interviewModes.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleInterviewMode(opt.id)}
                        className={`h-8 px-2.5 rounded-md border text-xs font-medium text-left transition-all cursor-pointer shadow-2xs flex items-center justify-between ${
                          isChecked
                            ? 'border-gray-1000 bg-gray-1000 text-background-100 font-semibold shadow-xs'
                            : 'border-gray-400 bg-background-200 text-gray-800 hover:text-gray-1000 hover:bg-gray-300 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {isChecked && <Check className="w-3 h-3 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* SECTION 3: Detailed Experience */}
            <div className="bg-background-100 border border-gray-400 rounded-xl p-6 shadow-2xs space-y-5 text-gray-1000">
              <h2 className="text-sm font-semibold text-gray-1000 flex items-center gap-2 border-b border-gray-400 pb-3">
                <FileText className="w-4 h-4 text-gray-700" />
                <span>3. Detailed Experience</span>
              </h2>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-800">
                  Post Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Google SDE Summer Internship Experience — 3 Technical Rounds & System Design"
                  className="w-full h-10 px-3.5 rounded-md border border-gray-400 bg-background-200 text-gray-1000 placeholder:text-gray-500 focus:outline-none focus:border-gray-900 focus:bg-background-100 text-sm font-medium transition-all shadow-2xs"
                />
              </div>

              {/* Text Editor */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-800">
                  Experience Content *
                </label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                />
              </div>

              {/* Tags Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-gray-800">
                  Topics / Tags (Press Enter to add)
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-gray-400 bg-background-200 min-h-[42px]">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="h-6 px-2 rounded-md bg-background-100 text-gray-900 border border-gray-400 font-mono text-xs flex items-center gap-1 shadow-2xs"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={tags.length === 0 ? "Type tag e.g. DSA, React and hit Enter" : "Add more tags..."}
                    className="flex-1 bg-transparent text-xs text-gray-1000 focus:outline-none min-w-[150px]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Attach Document (Optional) */}
            <div className="bg-background-100 border border-gray-400 rounded-xl p-6 shadow-2xs space-y-4 text-gray-1000">
              <h2 className="text-sm font-semibold text-gray-1000 flex items-center gap-2 border-b border-gray-400 pb-3">
                <Paperclip className="w-4 h-4 text-gray-700" />
                <span>4. Attach Document (Optional)</span>
              </h2>
              <p className="text-xs text-gray-700 font-sans">
                Attach relevant preparation sheets, questions list, or offer letters (.pdf, .docx, .txt). Images can be inserted directly in the editor above.
              </p>

              {existingDoc.url || newDocFile ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-background-200 border border-gray-400">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Paperclip className="w-4 h-4 text-gray-700 shrink-0" />
                    <span className="text-xs font-medium text-gray-1000 truncate">
                      {newDocFile ? newDocFile.name : existingDoc.name}
                    </span>
                    {newDocFile && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-background-100 border border-gray-400 text-gray-700">
                        New
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveDoc}
                    className="p-1 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-600 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="border border-dashed border-gray-400 hover:border-gray-900 rounded-xl flex items-center justify-center gap-2 p-5 cursor-pointer hover:bg-background-200 transition-colors">
                  <UploadCloud className="w-5 h-5 text-gray-600" />
                  <span className="text-xs font-medium text-gray-900">Upload Document (.pdf, .docx, .txt, .xlsx)</span>
                  <input
                    type="file"
                    ref={docInputRef}
                    accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
                    className="hidden"
                    onChange={handleDocFileChange}
                  />
                </label>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                to="/placements"
                className="h-9 px-4 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors shadow-2xs flex items-center justify-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="h-9 px-5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isEditing ? 'Updating...' : 'Publishing...'}</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Save Changes' : 'Publish Experience'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
