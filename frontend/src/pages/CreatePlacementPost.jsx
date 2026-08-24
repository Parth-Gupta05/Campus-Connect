import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import CompanySearchInput from '../components/CompanySearchInput';
import RichTextEditor from '../components/RichTextEditor';

import {
  FiArrowLeft,
  FiUploadCloud,
  FiX,
  FiPlus,
  FiPaperclip,
  FiCheck,
  FiDollarSign,
  FiBriefcase,
  FiCalendar,
  FiFileText,
  FiImage,
  FiLink,
  FiLayers
} from 'react-icons/fi';

export default function CreatePlacementPost() {
  const { id } = useParams(); // If editing
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

  const [assessmentType, setAssessmentType] = useState('coding_round');
  const [assessmentMode, setAssessmentMode] = useState('online');

  const [interviewType, setInterviewType] = useState('technical');
  const [interviewMode, setInterviewMode] = useState('online');
  const [numberOfRounds, setNumberOfRounds] = useState('3');

  const [branch, setBranch] = useState(user?.branch || '');
  const [graduationYear, setGraduationYear] = useState(user?.graduationYear || '');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Tags
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['DSA', 'InterviewExperience']);

  // Links
  const [linkInput, setLinkInput] = useState('');
  const [links, setLinks] = useState([]);

  // Attachments
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [existingDoc, setExistingDoc] = useState({ url: '', name: '' });
  const [newDocFile, setNewDocFile] = useState(null);

  const imageInputRef = useRef(null);
  const docInputRef = useRef(null);

  // Load existing post if editing
  useEffect(() => {
    if (isEditing) {
      const fetchPost = async () => {
        try {
          setLoading(true);
          const res = await axios.get(`/placements/${id}`);
          const p = res.data;

          // Verify permission
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

          if (p.assessmentType) setAssessmentType(p.assessmentType);
          if (p.assessmentMode) setAssessmentMode(p.assessmentMode);

          if (p.interviewType) setInterviewType(p.interviewType);
          if (p.interviewMode) setInterviewMode(p.interviewMode);
          if (p.numberOfRounds) setNumberOfRounds(p.numberOfRounds.toString());

          if (p.branch) setBranch(p.branch);
          if (p.graduationYear) setGraduationYear(p.graduationYear);

          setTitle(p.title || '');
          setContent(p.content || '');
          setTags(p.tags || []);
          setLinks(p.links || []);

          setExistingImages(p.images || []);
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

  // Tag Handlers
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
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Link Handlers
  const handleAddLink = () => {
    if (!linkInput.trim()) return;
    let formatted = linkInput.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://${formatted}`;
    }
    if (!links.includes(formatted)) {
      setLinks([...links, formatted]);
      setLinkInput('');
    }
  };

  const handleRemoveLink = (idx) => {
    setLinks(links.filter((_, i) => i !== idx));
  };

  // Image Upload Handlers (max 5)
  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files);
    const totalCurrent = existingImages.length + newImageFiles.length;
    const allowedCount = Math.max(0, 5 - totalCurrent);
    const validFiles = files.slice(0, allowedCount);

    setNewImageFiles([...newImageFiles, ...validFiles]);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleRemoveExistingImage = (idx) => {
    setExistingImages(existingImages.filter((_, i) => i !== idx));
  };

  const handleRemoveNewImage = (idx) => {
    setNewImageFiles(newImageFiles.filter((_, i) => i !== idx));
  };

  // Document Handler (max 1)
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

  // Submit Handler
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

      formData.append('title', title.trim());
      formData.append('content', content.trim());
      formData.append('role', role.trim());
      formData.append('postType', postType);

      formData.append('companyName', company.name);
      formData.append('companyDomain', company.domain || '');
      formData.append('companyLogoUrl', company.logoUrl || '');
      formData.append('companyIsCustom', company.isCustom ? 'true' : 'false');

      if (salaryAmount) formData.append('salaryAmount', salaryAmount);
      formData.append('salaryPeriod', salaryPeriod);
      formData.append('salaryCurrency', salaryCurrency);

      formData.append('jobType', jobType);
      formData.append('workMode', workMode);
      formData.append('location', location.trim());

      formData.append('difficulty', difficulty);
      formData.append('outcome', outcome);

      formData.append('assessmentType', assessmentType);
      formData.append('assessmentMode', assessmentMode);

      formData.append('interviewType', interviewType);
      formData.append('interviewMode', interviewMode);
      if (numberOfRounds) formData.append('numberOfRounds', numberOfRounds);

      formData.append('branch', branch.trim());
      formData.append('graduationYear', graduationYear.trim());

      formData.append('tags', JSON.stringify(tags));
      formData.append('links', JSON.stringify(links));
      formData.append('existingImages', JSON.stringify(existingImages));

      // Append new image files
      newImageFiles.forEach((file) => {
        formData.append('images', file);
      });

      // Append document file if newly added
      if (newDocFile) {
        formData.append('document', newDocFile);
      } else if (!existingDoc.url && isEditing) {
        formData.append('removeAttachment', 'true');
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
      <div className="flex h-screen bg-surface">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-surface custom-scrollbar">
        <Topbar />

        <div className="max-w-4xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
          {/* Top Back Navigation */}
          <div className="flex items-center justify-between gap-4">
            <Link
              to="/placements"
              className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
            >
              <FiArrowLeft className="text-base" /> Back to Placements Feed
            </Link>

            <span className="text-xs text-on-surface-variant font-mono">
              Posting as: <strong className="text-on-surface">{user?.name}</strong> ({user?.branch || 'Branch'} '{user?.graduationYear ? user.graduationYear.slice(-2) : ''})
            </span>
          </div>

          {/* Header Title */}
          <div className="bg-surface-container-lowest border border-border-light rounded-3xl p-6 md:p-8 shadow-xs">
            <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface mb-2">
              {isEditing ? 'Edit Placement Experience' : 'Share Your Placement & Interview Experience'}
            </h1>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Help your juniors and peers prepare by sharing your selection process, online test questions, interview rounds, package details, and preparation strategy.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: Company & Role Details */}
            <div className="bg-surface-container-lowest border border-border-light rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-border-light pb-3">
                <FiBriefcase className="text-primary" /> 1. Company &amp; Role Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Autocomplete Input */}
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Company Name *
                  </label>
                  <CompanySearchInput
                    value={company}
                    onChange={setCompany}
                    disabled={submitting}
                  />
                  <p className="text-[11px] text-on-surface-variant/70">
                    Search from Logo.dev brand directory, or type manually if unlisted.
                  </p>
                </div>

                {/* Role / Designation */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Role / Position *
                  </label>
                  <input
                    type="text"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="e.g. SDE 1, Graduate Trainee, Data Analyst"
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium transition-all shadow-2xs"
                  />
                </div>

                {/* Post Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Experience Type *
                  </label>
                  <select
                    value={postType}
                    onChange={(e) => setPostType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium transition-all shadow-2xs cursor-pointer"
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
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Job Type
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium transition-all shadow-2xs cursor-pointer"
                  >
                    <option value="full_time">Full-Time (FTE)</option>
                    <option value="internship">Internship</option>
                    <option value="contract">Contract / Freelance</option>
                  </select>
                </div>

                {/* Work Mode & Location */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Work Mode &amp; Location
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={workMode}
                      onChange={(e) => setWorkMode(e.target.value)}
                      className="px-3 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm font-medium focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
                    >
                      <option value="onsite">Onsite</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Bangalore, Pune"
                      className="flex-1 px-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm font-medium focus:outline-none focus:border-primary shadow-2xs"
                    />
                  </div>
                </div>

                {/* Compensation */}
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Compensation (CTC / Stipend)
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <FiDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-base pointer-events-none" />
                      <input
                        type="number"
                        value={salaryAmount}
                        onChange={(e) => setSalaryAmount(e.target.value)}
                        placeholder="e.g. 1500000 (15 LPA) or 45000 (stipend)"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm font-medium focus:outline-none focus:border-primary shadow-2xs"
                      />
                    </div>
                    <select
                      value={salaryPeriod}
                      onChange={(e) => setSalaryPeriod(e.target.value)}
                      className="px-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm font-medium focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
                    >
                      <option value="annual">Annual CTC (Per Annum)</option>
                      <option value="stipend_per_month">Monthly Stipend</option>
                      <option value="monthly">Monthly Fixed</option>
                    </select>
                  </div>
                  <p className="text-[11px] text-on-surface-variant/70">
                    Optional: Entering the package helps students filter by compensation tier.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 2: Evaluation Specifics */}
            <div className="bg-surface-container-lowest border border-border-light rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-border-light pb-3">
                <FiLayers className="text-primary" /> 2. Assessment &amp; Interview Breakdown
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Outcome */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Final Outcome
                  </label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm font-medium focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
                  >
                    <option value="selected">🟢 Selected / Received Offer</option>
                    <option value="rejected">🔴 Rejected</option>
                    <option value="waitlisted">🟡 Waitlisted</option>
                    <option value="in_process">🔵 In Process</option>
                  </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Overall Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm font-medium focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                    <option value="very_hard">Very Hard</option>
                  </select>
                </div>

                {/* Number of Rounds */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Number of Rounds
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={numberOfRounds}
                    onChange={(e) => setNumberOfRounds(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm font-medium focus:outline-none focus:border-primary shadow-2xs"
                  />
                </div>

                {/* Assessment Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Assessment Round Type
                  </label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm font-medium focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
                  >
                    <option value="coding_round">Coding Round (DSA/Algo)</option>
                    <option value="online_test">Online Aptitude + Technical Test</option>
                    <option value="mcq">MCQ Assessment</option>
                    <option value="aptitude">Aptitude Round</option>
                    <option value="case_study">Case Study</option>
                    <option value="group_discussion">Group Discussion (GD)</option>
                    <option value="hackathon">Hackathon / Live Project</option>
                    <option value="take_home_assignment">Take-Home Assignment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Interview Type */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Primary Interview Type
                  </label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm font-medium focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
                  >
                    <option value="technical">Technical Round</option>
                    <option value="system_design">System Design (LLD/HLD)</option>
                    <option value="hr">HR Round</option>
                    <option value="behavioral">Behavioral Round</option>
                    <option value="managerial">Managerial Round</option>
                    <option value="culture_fit">Culture Fit</option>
                    <option value="panel">Panel Interview</option>
                  </select>
                </div>

                {/* Interview Mode */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Interview Mode
                  </label>
                  <select
                    value={interviewMode}
                    onChange={(e) => setInterviewMode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-sm font-medium focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
                  >
                    <option value="online">Online (Zoom/Meet/Teams)</option>
                    <option value="offline">On-Campus / In-Person</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: Rich Experience Content */}
            <div className="bg-surface-container-lowest border border-border-light rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-border-light pb-3">
                <FiFileText className="text-primary" /> 3. Experience Details &amp; Rich Editor
              </h2>

              {/* Title */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Post Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. My Google SDE Summer Internship Experience — 3 Technical Rounds & System Design"
                  className="w-full px-4 py-3.5 rounded-xl border border-border-light bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-base font-bold transition-all shadow-2xs"
                />
              </div>

              {/* Tiptap Rich Text Editor */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Detailed Experience (Supports Markdown, Code Blocks, Inline Images) *
                </label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                />
              </div>

              {/* Tags Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Topics / Tags (Press Enter or Comma to add)
                </label>
                <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl border border-border-light bg-surface-container-low min-h-[48px]">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 text-primary font-bold text-xs"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-error transition-colors ml-1"
                      >
                        <FiX />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder={tags.length === 0 ? "Type tag e.g. DynamicProgramming, React, HR and hit Enter" : "Add more tags..."}
                    className="flex-1 bg-transparent text-sm text-on-surface focus:outline-none min-w-[160px]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Attachments & External Links */}
            <div className="bg-surface-container-lowest border border-border-light rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <h2 className="text-lg font-bold text-on-surface flex items-center gap-2 border-b border-border-light pb-3">
                <FiPaperclip className="text-primary" /> 4. Gallery Images, Document &amp; Links
              </h2>

              {/* Images Upload (Max 5) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                    Gallery Images (Max 5)
                  </label>
                  <span className="text-xs font-mono text-on-surface-variant">
                    {existingImages.length + newImageFiles.length} / 5
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {/* Existing Cloudinary Images */}
                  {existingImages.map((url, idx) => (
                    <div key={`existing-${idx}`} className="relative group rounded-xl overflow-hidden border border-border-light aspect-square shadow-xs">
                      <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-error transition-colors"
                      >
                        <FiX className="text-xs" />
                      </button>
                    </div>
                  ))}

                  {/* Newly selected image files */}
                  {newImageFiles.map((file, idx) => (
                    <div key={`new-${idx}`} className="relative group rounded-xl overflow-hidden border border-primary/40 aspect-square shadow-xs">
                      <img src={URL.createObjectURL(file)} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(idx)}
                        className="absolute top-1.5 right-1.5 p-1 bg-black/60 text-white rounded-full hover:bg-error transition-colors"
                      >
                        <FiX className="text-xs" />
                      </button>
                    </div>
                  ))}

                  {/* Add Image Button */}
                  {existingImages.length + newImageFiles.length < 5 && (
                    <label className="border-2 border-dashed border-border-light hover:border-primary rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-surface-variant/40 transition-colors aspect-square text-center">
                      <FiImage className="text-2xl text-on-surface-variant mb-1" />
                      <span className="text-[11px] font-bold text-on-surface-variant">Add Image</span>
                      <input
                        type="file"
                        ref={imageInputRef}
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Document Upload (1 file) */}
              <div className="space-y-3 pt-3 border-t border-border-light">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Attach 1 Document (Optional: Resume, Notes, Question PDF, Offer Letter)
                </label>

                {existingDoc.url || newDocFile ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-container-low border border-border-light">
                    <div className="flex items-center gap-3 min-w-0">
                      <FiPaperclip className="text-primary text-lg shrink-0" />
                      <span className="text-sm font-semibold text-on-surface truncate">
                        {newDocFile ? newDocFile.name : existingDoc.name}
                      </span>
                      {newDocFile && (
                        <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                          New File
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveDoc}
                      className="p-1.5 hover:bg-surface-variant text-on-surface-variant hover:text-error rounded-lg transition-colors"
                    >
                      <FiX />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-border-light hover:border-primary rounded-xl flex items-center justify-center gap-2 p-4 cursor-pointer hover:bg-surface-variant/40 transition-colors">
                    <FiUploadCloud className="text-xl text-primary" />
                    <span className="text-xs font-bold text-on-surface">Upload Document (.pdf, .docx, .txt, .xlsx)</span>
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

              {/* External Links (LeetCode, GitHub repo, Problem links) */}
              <div className="space-y-3 pt-3 border-t border-border-light">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  Relevant Links (LeetCode problem URLs, GitHub repo, drive links)
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FiLink className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm pointer-events-none" />
                    <input
                      type="text"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      placeholder="https://leetcode.com/problems/..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border-light bg-surface-container-low text-on-surface text-xs font-medium focus:outline-none focus:border-primary shadow-2xs"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLink}
                    className="px-4 py-2.5 bg-surface-variant hover:bg-primary hover:text-on-primary text-on-surface text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Add Link
                  </button>
                </div>

                {links.length > 0 && (
                  <div className="space-y-1.5">
                    {links.map((link, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-surface-container-low text-xs border border-border-light">
                        <span className="text-primary font-mono truncate max-w-md">{link}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveLink(idx)}
                          className="hover:text-error text-on-surface-variant transition-colors p-1"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-end gap-4 pt-4">
              <Link
                to="/placements"
                className="px-6 py-3 rounded-xl border border-border-light text-on-surface hover:bg-surface-variant text-sm font-bold transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-sm font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isEditing ? 'Updating...' : 'Publishing...'}</span>
                  </>
                ) : (
                  <>
                    <FiCheck className="text-base" />
                    <span>{isEditing ? 'Save Changes' : 'Publish Experience'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
