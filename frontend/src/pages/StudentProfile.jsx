import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import ImageCropperModal from '../components/ImageCropperModal';
import PdfViewerModal from '../components/PdfViewerModal';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { calculateProfileCompleteness } from '../utils/profileUtils';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import {
  Camera,
  Edit3,
  ExternalLink,
  FileText,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  Award,
  FolderGit2,
  Calendar,
  MapPin,
  Building2,
  MessageSquare,
  Share2,
  Globe,
  ShieldCheck,
  Layers,
  LayoutDashboard,
  User,
  X,
  Upload,
  AlertTriangle,
  Code2,
  CheckCheck
} from 'lucide-react';
import { parseUID, generateUID, BRANCHES, calculateYearFromSem } from '../utils/uidUtils';

const formatExternalUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

// =============================================================================
// 1. ONBOARDING SETUP OVERLAY (Geist Material Modal)
// =============================================================================
function ProfileSetupOverlay({ onComplete, user }) {
  const { showToast } = useToast();
  const isMissingCredential = !user.email || !user.uid;
  const missingLabel = !user.email ? 'University Email' : 'UID (e.g. 23-COMPA10-27)';
  const missingField = !user.email ? 'email' : 'uid';
  const [formData, setFormData] = useState({
    name: user.name || '',
    githubUsername: user.githubUsername || '',
    leetcodeUsername: user.leetcodeUsername || '',
    linkedInUrl: user.linkedInUrl || '',
    [missingField]: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // UID Verification State
  const [uidVerified, setUidVerified] = useState(false);
  const [showUidModal, setShowUidModal] = useState(false);
  const [isEditingUid, setIsEditingUid] = useState(false);
  const [parsedProfileData, setParsedProfileData] = useState(null);

  const [verifiedUid, setVerifiedUid] = useState(null);

  useEffect(() => {
    if (uidVerified && missingField === 'uid' && formData.uid !== verifiedUid) setUidVerified(false);
  }, [formData.uid, missingField, verifiedUid]);

  const handleVerifyUID = () => {
    const trimmedIdentifier = formData.uid?.trim() || '';
    if (!trimmedIdentifier) return;
    const match = trimmedIdentifier.match(/^(\d{2})-([A-Za-z]+)([A-Za-z])(\d+)-(\d{2})$/);
    if (!match) {
      setError('Invalid UID format. Expected format: 23-COMPA10-27');
      return;
    }
    const data = parseUID(trimmedIdentifier);
    if (data) {
      setParsedProfileData(data);
      setIsEditingUid(false);
      setShowUidModal(true);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (isMissingCredential && missingField === 'uid' && formData.uid) {
      const match = formData.uid.match(/^(\d{2})-([A-Za-z]+)([A-Za-z])(\d+)-(\d{2})$/);
      if (!match) {
        setError('Invalid UID format. Expected format: 23-COMPA10-27');
        setLoading(false);
        return;
      }
      if (!uidVerified) {
        setError('Please verify your UID to confirm your details before completing setup.');
        setLoading(false);
        return;
      }
    }

    try {
      if (isMissingCredential && formData[missingField]) {
        await axios.post('/auth/link-account', { 
          identifier: formData[missingField],
          profileData: (missingField === 'uid' && uidVerified) ? parsedProfileData : null
        });
      }
      const res = await axios.put('/user/profile', {
        name: formData.name,
        githubUsername: formData.githubUsername,
        leetcodeUsername: formData.leetcodeUsername,
        linkedInUrl: formData.linkedInUrl
      });
      showToast('Profile setup successfully!', 'success');
      onComplete(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-background-100 rounded-xl shadow-2xl max-w-lg w-full border border-gray-400 max-h-[90vh] flex flex-col overflow-hidden text-gray-1000">
        
        {/* Header Strip */}
        <div className="px-6 py-5 bg-background-200 border-b border-gray-400 flex items-start gap-3.5 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-background-100 border border-gray-400 flex items-center justify-center shrink-0 shadow-2xs text-gray-1000">
            <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-1000 tracking-tight">Complete Profile Setup</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                Required
              </span>
            </div>
            <p className="text-xs text-gray-700 font-sans mt-0.5 leading-relaxed">
              {isMissingCredential 
                ? `Link your university ${!user.email ? 'email' : 'UID'} to synchronize verified coding telemetry and activate campus portfolio access.`
                : `Enter your student details to automatically link repository contributions and algorithmic profiles.`}
            </p>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-lg text-xs font-mono flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form id="profile-setup-form" onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
            {isMissingCredential && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-medium text-gray-900">{missingLabel}</label>
                  {missingField === 'uid' && (
                    <span className="text-[10px] font-mono text-gray-600">Format: 23-COMPA10-27</span>
                  )}
                </div>
                <div className="relative flex items-center">
                  <input 
                    required 
                    type="text" 
                    className="w-full px-3 py-2 pr-24 bg-background-200 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors font-mono" 
                    placeholder={!user.email ? "student@university.edu" : "23-COMPA10-27"} 
                    value={formData[missingField]} 
                    onChange={e => setFormData({...formData, [missingField]: e.target.value})} 
                  />
                  {missingField === 'uid' && formData.uid && /^\d{2}-/.test(formData.uid) && (
                    <div className="absolute right-1">
                      {uidVerified ? (
                        <div className="flex items-center text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded text-[10px] font-semibold gap-1 border border-emerald-500/20 whitespace-nowrap">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Verified</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyUID}
                          className="text-[10px] font-semibold bg-gray-1000 text-background-100 px-2.5 py-1 rounded hover:opacity-90 transition-opacity whitespace-nowrap cursor-pointer"
                        >
                          Verify UID
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className="block font-medium text-gray-900 mb-1.5">Full Name</label>
              <input 
                required 
                type="text" 
                className="w-full px-3 py-2 bg-background-200 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors" 
                placeholder="e.g. John Doe" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
              />
            </div>
            <div>
              <label className="block font-medium text-gray-900 mb-1.5">GitHub Username</label>
              <input 
                required 
                type="text" 
                className="w-full px-3 py-2 bg-background-200 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors font-mono" 
                placeholder="octocat" 
                value={formData.githubUsername} 
                onChange={e => setFormData({...formData, githubUsername: e.target.value})} 
              />
            </div>
            <div>
              <label className="block font-medium text-gray-900 mb-1.5">LeetCode Username</label>
              <input 
                required 
                type="text" 
                className="w-full px-3 py-2 bg-background-200 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors font-mono" 
                placeholder="johndoe" 
                value={formData.leetcodeUsername} 
                onChange={e => setFormData({...formData, leetcodeUsername: e.target.value})} 
              />
            </div>
            <div>
              <label className="block font-medium text-gray-900 mb-1.5">LinkedIn Profile URL</label>
              <input 
                type="url" 
                className="w-full px-3 py-2 bg-background-200 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors font-mono" 
                placeholder="https://linkedin.com/in/johndoe" 
                value={formData.linkedInUrl} 
                onChange={e => setFormData({...formData, linkedInUrl: e.target.value})} 
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-background-200 border-t border-gray-400 flex justify-end shrink-0">
          <button 
            form="profile-setup-form"
            disabled={loading} 
            type="submit" 
            className="w-full sm:w-auto px-6 py-2.5 bg-gray-1000 text-background-100 rounded-md text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer shadow-xs"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Setup & Synchronize'}
          </button>
        </div>
      </div>

      {/* UID Verification Modal */}
      <AnimatedModal isOpen={showUidModal} onClose={() => setShowUidModal(false)}>
        {showUidModal && parsedProfileData && (
          <div className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-blue-500/10 text-blue-700 border border-blue-500/20">
                  UID Verification
                </span>
                <h3 className="text-lg font-bold text-gray-1000 mt-1">Verify Your Details</h3>
                <p className="text-xs text-gray-600 mt-1">We extracted this information from your UID. Is this correct?</p>
              </div>
              <button 
                onClick={() => setShowUidModal(false)}
                className="p-1 text-gray-600 hover:text-gray-1000 rounded hover:bg-gray-200 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isEditingUid ? (
              <div className="space-y-4 pt-2 relative z-10">
                <div>
                  <label className="block text-xs font-semibold text-gray-1000 mb-1">Branch</label>
                  <select 
                    value={parsedProfileData.branch}
                    onChange={(e) => setParsedProfileData({...parsedProfileData, branch: e.target.value})}
                    className="w-full bg-background-200 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-1000 focus:outline-none focus:border-gray-900 transition-colors"
                  >
                    {BRANCHES.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-1000 mb-1">Semester</label>
                    <select
                      value={parsedProfileData.currentSem}
                      onChange={(e) => {
                        const sem = parseInt(e.target.value);
                        setParsedProfileData({...parsedProfileData, currentSem: sem, currentYear: calculateYearFromSem(sem)});
                      }}
                      className="w-full bg-background-200 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-1000 focus:outline-none focus:border-gray-900 transition-colors"
                    >
                      {[1,2,3,4,5,6,7,8].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-1000 mb-1">Division</label>
                    <input
                      type="text"
                      maxLength={1}
                      value={parsedProfileData.division}
                      onChange={(e) => setParsedProfileData({...parsedProfileData, division: e.target.value.toUpperCase().replace(/[^A-Z]/g, '')})}
                      className="w-full bg-background-200 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-1000 uppercase focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-1000 mb-1">Roll Number</label>
                  <input
                    type="number"
                    value={parsedProfileData.rollNo}
                    onChange={(e) => setParsedProfileData({...parsedProfileData, rollNo: e.target.value})}
                    className="w-full bg-background-200 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-1000 focus:outline-none focus:border-gray-900 transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-background-200 rounded-xl border border-gray-400 p-4 space-y-3 relative z-10 shadow-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-mono text-gray-500 font-semibold tracking-wider">Branch</span>
                  <span className="text-sm font-semibold text-gray-1000">{parsedProfileData.branch}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-mono text-gray-500 font-semibold tracking-wider">Semester</span>
                    <span className="text-sm font-medium text-gray-1000">Sem {parsedProfileData.currentSem}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-mono text-gray-500 font-semibold tracking-wider">Division</span>
                    <span className="text-sm font-medium text-gray-1000">Div {parsedProfileData.division}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-mono text-gray-500 font-semibold tracking-wider">Roll No</span>
                    <span className="text-sm font-medium text-gray-1000">{parsedProfileData.rollNo}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-400 relative z-10">
              {isEditingUid ? (
                <button
                  type="button"
                  onClick={() => setIsEditingUid(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer"
                >
                  Cancel Edit
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingUid(true)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 hover:text-gray-1000 hover:bg-gray-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-gray-400"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>No, let me edit</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const newUid = generateUID(parsedProfileData);
                  if (missingField === 'uid') {
                    setFormData(prev => ({ ...prev, uid: newUid }));
                    setVerifiedUid(newUid);
                  }
                  setUidVerified(true);
                  setShowUidModal(false);
                }}
                className="px-5 py-2 text-xs font-semibold bg-gray-1000 text-background-100 hover:opacity-90 rounded-md transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isEditingUid ? 'Save & Confirm' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        )}
      </AnimatedModal>
    </div>
  );
}

// =============================================================================
// 2. RESUME & PORTFOLIO EDITOR MODAL (Geist Workspace Modal)
// =============================================================================
function ResumeEditorModal({ profile, onComplete, onClose, onPreviewPdf, initialSectionId }) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('all');
  const [skillsStr, setSkillsStr] = useState(profile?.resumeDetails?.skills?.join(', ') || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.resumeDetails?.portfolioUrl || '');
  const [githubUsername, setGithubUsername] = useState(profile?.githubUsername || '');
  const [leetcodeUsername, setLeetcodeUsername] = useState(profile?.leetcodeUsername || '');
  const [linkedInUrl, setLinkedInUrl] = useState(profile?.linkedInUrl || '');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const defaultEducation = [
    { level: 'High School (10th Std)', degree: '', institution: '', startYear: '', endYear: '' },
    { level: '11th and 12th or Diploma', degree: '', institution: '', startYear: '', endYear: '' },
    { level: 'Undergrad Degree', degree: '', institution: '', startYear: '', endYear: '' }
  ];
  const [education, setEducation] = useState(() => {
    const existing = profile?.resumeDetails?.education;
    if (existing && existing.length > 0) return existing;
    return defaultEducation;
  });
  const [experience, setExperience] = useState(profile?.resumeDetails?.experience || []);
  const [projects, setProjects] = useState(profile?.resumeDetails?.projects || []);
  const [achievements, setAchievements] = useState(profile?.resumeDetails?.achievements || []);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  useEffect(() => {
    if (initialSectionId) {
      setTimeout(() => {
        const el = document.getElementById(initialSectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }, [initialSectionId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('resume', file);
    
    setParsing(true);
    try {
      const res = await axios.post('/user/parse-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { parsedData } = res.data;
      if (parsedData) {
        if (parsedData.skills) setSkillsStr(parsedData.skills.join(', '));
        if (parsedData.education) setEducation(parsedData.education);
        if (parsedData.experience) setExperience(parsedData.experience);
        if (parsedData.projects) setProjects(parsedData.projects);
      }
      showToast('Resume parsed successfully with Gemini! Review the auto-filled fields before saving.', 'success');
    } catch (err) {
      console.error('Error parsing resume', err);
      showToast(err.response?.data?.message || 'Failed to parse resume', 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const handlesChanged = 
      githubUsername !== (profile?.githubUsername || '') ||
      leetcodeUsername !== (profile?.leetcodeUsername || '') ||
      linkedInUrl !== (profile?.linkedInUrl || '');

    if (handlesChanged && !showConfirmModal) {
      setShowConfirmModal(true);
      return;
    }
    
    await executeSave();
  };

  const executeSave = async () => {
    setLoading(true);
    try {
      const payload = {
        portfolioUrl,
        skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
        education,
        experience,
        projects,
        achievements,
        githubUsername,
        leetcodeUsername,
        linkedInUrl
      };
      const res = await axios.put('/user/portfolio', payload);
      onComplete(res.data.user);
      onClose();
      showToast('Portfolio details saved successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save portfolio details', 'error');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const addEdu = () => setEducation([...education, { level: 'Other', institution: '', degree: '', startYear: '', endYear: '' }]);
  const addExp = () => setExperience([...experience, { company: '', role: '', startDate: '', endDate: '', description: '' }]);
  const addProj = () => setProjects([...projects, { title: '', link: '', description: '' }]);
  const addAchieve = () => setAchievements([...achievements, { title: '', description: '', imageUrl: '', date: '' }]);

  const updateEdu = (index, field, val) => {
    const newEdu = [...education];
    newEdu[index][field] = val;
    setEducation(newEdu);
  };
  const updateExp = (index, field, val) => {
    const newExp = [...experience];
    newExp[index][field] = val;
    setExperience(newExp);
  };
  const updateProj = (index, field, val) => {
    const newProj = [...projects];
    newProj[index][field] = val;
    setProjects(newProj);
  };
  const updateAchieve = (index, field, val) => {
    const newAchieve = [...achievements];
    newAchieve[index][field] = val;
    setAchievements(newAchieve);
  };

  const removeEdu = (index) => setEducation(education.filter((_, i) => i !== index));
  const removeExp = (index) => setExperience(experience.filter((_, i) => i !== index));
  const removeProj = (index) => setProjects(projects.filter((_, i) => i !== index));
  const removeAchieve = (index) => setAchievements(achievements.filter((_, i) => i !== index));

  const tabs = [
    { id: 'all', label: 'All Sections' },
    { id: 'handles', label: 'Profiles & Handles' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: `Education (${education.length})` },
    { id: 'experience', label: `Experience (${experience.length})` },
    { id: 'projects', label: `Projects (${projects.length})` },
    { id: 'achievements', label: `Honors (${achievements.length})` }
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-background-100 rounded-xl shadow-2xl max-w-4xl w-full border border-gray-400 max-h-[90vh] flex flex-col relative text-gray-1000 overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-background-200 border-b border-gray-400 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-background-100 border border-gray-400 flex items-center justify-center shrink-0 shadow-2xs text-gray-1000">
              <Edit3 className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-1000 tracking-tight">Update Portfolio &amp; Resume</h2>
              <p className="text-xs text-gray-700 font-sans mt-0.5">
                Edit your verified handles, educational degrees, work history, and achievements.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={onClose} 
              className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-md text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button 
              type="button"
              onClick={handleSave} 
              disabled={loading} 
              className="bg-gray-1000 text-background-100 px-4 py-1.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="px-6 py-2.5 bg-background-100 border-b border-gray-400 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1 p-1 bg-background-200 border border-gray-400 rounded-lg w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1 text-xs rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-background-100 text-gray-1000 font-medium shadow-2xs border border-gray-400'
                    : 'text-gray-700 hover:text-gray-1000'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* AI Resume Parser Strip */}
          <div className="p-4 rounded-xl border border-teal-500/30 bg-teal-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center shrink-0 text-teal-600 dark:text-teal-400">
                <Sparkles className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-semibold text-gray-1000">Auto-Fill with Gemini AI Parser</h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-teal-500/15 text-teal-700 dark:text-teal-300 font-medium">AI Powered</span>
                </div>
                <p className="text-[11px] text-gray-700 font-sans mt-0.5">
                  Upload your PDF resume to parse skills, degrees, and work history in seconds.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <label className={`cursor-pointer h-8 px-3.5 rounded-md bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs ${parsing ? 'opacity-70 pointer-events-none' : ''}`}>
                {parsing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                <span>{parsing ? 'Parsing PDF...' : 'Upload PDF'}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={parsing} />
              </label>
              {profile?.resumeUrl && (
                <button
                  type="button"
                  onClick={onPreviewPdf}
                  className="h-8 px-3 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-gray-600" strokeWidth={1.5} />
                  <span>Current PDF</span>
                </button>
              )}
            </div>
          </div>

          {/* Form Sections */}
          <form id="resume-editor-form" onSubmit={handleSave} className="space-y-6 text-xs font-sans">
            
            {/* Online Profiles */}
            {(activeTab === 'all' || activeTab === 'handles') && (
              <div id="section-handles" className="rounded-xl border border-gray-400 bg-background-200 p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-400/70 pb-3">
                  <div className="w-6 h-6 rounded-md bg-background-100 border border-gray-400 flex items-center justify-center text-gray-900">
                    <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-1000">Connected Profiles &amp; Handles</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="md:col-span-2">
                    <label className="block text-gray-900 font-medium mb-1.5">Personal Portfolio Website</label>
                    <input 
                      type="url" 
                      className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors font-mono" 
                      placeholder="https://yourportfolio.dev" 
                      value={portfolioUrl} 
                      onChange={(e) => setPortfolioUrl(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-1.5">GitHub Username</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors font-mono" 
                      placeholder="octocat" 
                      value={githubUsername} 
                      onChange={(e) => setGithubUsername(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-gray-900 font-medium mb-1.5">LeetCode Username</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors font-mono" 
                      placeholder="johndoe" 
                      value={leetcodeUsername} 
                      onChange={(e) => setLeetcodeUsername(e.target.value)} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-900 font-medium mb-1.5">LinkedIn Profile URL</label>
                    <input 
                      type="url" 
                      className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors font-mono" 
                      placeholder="https://linkedin.com/in/johndoe" 
                      value={linkedInUrl} 
                      onChange={(e) => setLinkedInUrl(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Technical Skills */}
            {(activeTab === 'all' || activeTab === 'skills') && (
              <div className="rounded-xl border border-gray-400 bg-background-200 p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-400/70 pb-3">
                  <div className="w-6 h-6 rounded-md bg-background-100 border border-gray-400 flex items-center justify-center text-gray-900">
                    <Code2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-1000">Technical Skills &amp; Stack</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-gray-900 font-medium">Core Frameworks &amp; Languages</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors" 
                    placeholder="React, TypeScript, Node.js, Go, Python, PostgreSQL, Docker, TailwindCSS" 
                    value={skillsStr} 
                    onChange={(e) => setSkillsStr(e.target.value)} 
                  />
                  <p className="text-[11px] text-gray-600 font-mono">Comma-separated list of programming languages, libraries, and developer tooling.</p>
                </div>
              </div>
            )}

            {/* Education History */}
            {(activeTab === 'all' || activeTab === 'education') && (
              <div id="section-education" className="rounded-xl border border-gray-400 bg-background-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-400/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-background-100 border border-gray-400 flex items-center justify-center text-gray-900">
                      <GraduationCap className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xs font-semibold text-gray-1000">Education History ({education.length})</h3>
                  </div>
                  <button 
                    type="button" 
                    onClick={addEdu} 
                    className="px-3 py-1.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-900 hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Degree
                  </button>
                </div>

                {education.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-gray-400 rounded-lg bg-background-100/50">
                    <GraduationCap className="w-6 h-6 text-gray-500 mx-auto mb-1.5" strokeWidth={1.5} />
                    <p className="text-xs text-gray-700 font-sans">No education records added yet.</p>
                    <button type="button" onClick={addEdu} className="mt-1.5 text-xs font-medium text-gray-900 hover:text-gray-1000 underline cursor-pointer">+ Add First Degree</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {education.map((edu, idx) => (
                      <div key={idx} className="bg-background-100 p-4 rounded-lg border border-gray-400 space-y-3 relative shadow-2xs">
                        <div className="flex items-center justify-between border-b border-gray-400/50 pb-2">
                          <span className="text-[11px] font-mono font-medium text-gray-600 uppercase tracking-wider">Degree #{idx + 1}</span>
                          <button 
                            type="button" 
                            onClick={() => removeEdu(idx)} 
                            className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors cursor-pointer"
                            title="Remove degree"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">Institution</label>
                            <input 
                              required 
                              placeholder="e.g. Stanford University"
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 focus:outline-none focus:border-gray-900" 
                              value={edu.institution} 
                              onChange={e => updateEdu(idx, 'institution', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">Education Level</label>
                            <select
                              required
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 focus:outline-none focus:border-gray-900 appearance-none"
                              value={edu.level || ''}
                              onChange={e => updateEdu(idx, 'level', e.target.value)}
                            >
                              <option value="" disabled>Select Level</option>
                              <option value="High School (10th Std)">High School (10th Std)</option>
                              <option value="11th and 12th or Diploma">11th and 12th or Diploma</option>
                              <option value="Undergrad Degree">Undergrad Degree</option>
                              <option value="Postgrad Degree">Postgrad Degree</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">Degree / Major</label>
                            <input 
                              required 
                              placeholder="e.g. B.Tech Computer Science"
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 focus:outline-none focus:border-gray-900" 
                              value={edu.degree} 
                              onChange={e => updateEdu(idx, 'degree', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">Start Year</label>
                            <input 
                              placeholder="2021"
                              pattern="^(19|20)[0-9]{2}$"
                              title="Please enter a valid 4-digit year (e.g. 2021)"
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 font-mono focus:outline-none focus:border-gray-900" 
                              value={edu.startYear} 
                              onChange={e => updateEdu(idx, 'startYear', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">End Year</label>
                            <input 
                              placeholder="2025"
                              pattern="^(19|20)[0-9]{2}$"
                              title="Please enter a valid 4-digit year (e.g. 2025)"
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 font-mono focus:outline-none focus:border-gray-900" 
                              value={edu.endYear} 
                              onChange={e => updateEdu(idx, 'endYear', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">
                              {['High School (10th Std)', '11th and 12th or Diploma'].includes(edu.level) ? 'Percentage / Grade' : 'CGPA / Grade'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={['High School (10th Std)', '11th and 12th or Diploma'].includes(edu.level) ? "100" : "10"}
                              step="0.01"
                              placeholder={['High School (10th Std)', '11th and 12th or Diploma'].includes(edu.level) ? 'e.g. 85.5' : 'e.g. 8.85'}
                              title={['High School (10th Std)', '11th and 12th or Diploma'].includes(edu.level) ? "Please enter a valid percentage (0-100)" : "Please enter a valid CGPA (0-10)"}
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 font-mono focus:outline-none focus:border-gray-900" 
                              value={edu.grade || edu.cgpa || ''} 
                              onChange={e => {
                                updateEdu(idx, 'grade', e.target.value);
                                updateEdu(idx, 'cgpa', e.target.value);
                              }} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Experience History */}
            {(activeTab === 'all' || activeTab === 'experience') && (
              <div id="section-experience" className="rounded-xl border border-gray-400 bg-background-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-400/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-background-100 border border-gray-400 flex items-center justify-center text-gray-900">
                      <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xs font-semibold text-gray-1000">Work Experience ({experience.length})</h3>
                  </div>
                  <button 
                    type="button" 
                    onClick={addExp} 
                    className="px-3 py-1.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-900 hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Experience
                  </button>
                </div>

                {experience.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-gray-400 rounded-lg bg-background-100/50">
                    <Briefcase className="w-6 h-6 text-gray-500 mx-auto mb-1.5" strokeWidth={1.5} />
                    <p className="text-xs text-gray-700 font-sans">No work experience entries added yet.</p>
                    <button type="button" onClick={addExp} className="mt-1.5 text-xs font-medium text-gray-900 hover:text-gray-1000 underline cursor-pointer">+ Add Experience</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {experience.map((exp, idx) => (
                      <div key={idx} className="bg-background-100 p-4 rounded-lg border border-gray-400 space-y-3 relative shadow-2xs">
                        <div className="flex items-center justify-between border-b border-gray-400/50 pb-2">
                          <span className="text-[11px] font-mono font-medium text-gray-600 uppercase tracking-wider">Role #{idx + 1}</span>
                          <button 
                            type="button" 
                            onClick={() => removeExp(idx)} 
                            className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors cursor-pointer"
                            title="Remove role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">Company / Organization</label>
                            <input 
                              required 
                              placeholder="e.g. Acme Corp"
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 focus:outline-none focus:border-gray-900" 
                              value={exp.company} 
                              onChange={e => updateExp(idx, 'company', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">Role / Title</label>
                            <input 
                              required 
                              placeholder="e.g. Software Engineer Intern"
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 focus:outline-none focus:border-gray-900" 
                              value={exp.role} 
                              onChange={e => updateExp(idx, 'role', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">Start Date</label>
                            <input 
                              placeholder="Jun 2024"
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 font-mono focus:outline-none focus:border-gray-900" 
                              value={exp.startDate} 
                              onChange={e => updateExp(idx, 'startDate', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">End Date</label>
                            <input 
                              placeholder="Present"
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 font-mono focus:outline-none focus:border-gray-900" 
                              value={exp.endDate} 
                              onChange={e => updateExp(idx, 'endDate', e.target.value)} 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[11px] font-medium text-gray-800">Key Contributions &amp; Impact</label>
                            <textarea 
                              rows="2" 
                              placeholder="Designed and deployed microservices reducing API latency by 40%..."
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 focus:outline-none focus:border-gray-900 leading-relaxed" 
                              value={exp.description} 
                              onChange={e => updateExp(idx, 'description', e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Featured Projects */}
            {(activeTab === 'all' || activeTab === 'projects') && (
              <div id="section-projects" className="rounded-xl border border-gray-400 bg-background-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-400/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-background-100 border border-gray-400 flex items-center justify-center text-gray-900">
                      <FolderGit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xs font-semibold text-gray-1000">Featured Projects ({projects.length})</h3>
                  </div>
                  <button 
                    type="button" 
                    onClick={addProj} 
                    className="px-3 py-1.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-900 hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project
                  </button>
                </div>

                {projects.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-gray-400 rounded-lg bg-background-100/50">
                    <FolderGit2 className="w-6 h-6 text-gray-500 mx-auto mb-1.5" strokeWidth={1.5} />
                    <p className="text-xs text-gray-700 font-sans">No portfolio projects listed yet.</p>
                    <button type="button" onClick={addProj} className="mt-1.5 text-xs font-medium text-gray-900 hover:text-gray-1000 underline cursor-pointer">+ Add Project</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((proj, idx) => (
                      <div key={idx} className="bg-background-100 p-4 rounded-lg border border-gray-400 space-y-3 relative shadow-2xs">
                        <div className="flex items-center justify-between border-b border-gray-400/50 pb-2">
                          <span className="text-[11px] font-mono font-medium text-gray-600 uppercase tracking-wider">Project #{idx + 1}</span>
                          <button 
                            type="button" 
                            onClick={() => removeProj(idx)} 
                            className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors cursor-pointer"
                            title="Remove project"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">Project Title</label>
                            <input 
                              required 
                              placeholder="e.g. Distributed Task Queue"
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 focus:outline-none focus:border-gray-900" 
                              value={proj.title} 
                              onChange={e => updateProj(idx, 'title', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">Live URL / Repository</label>
                            <input 
                              type="url" 
                              placeholder="https://github.com/..."
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 font-mono focus:outline-none focus:border-gray-900" 
                              value={proj.link} 
                              onChange={e => updateProj(idx, 'link', e.target.value)} 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[11px] font-medium text-gray-800">Description</label>
                            <textarea 
                              rows="2" 
                              placeholder="High-throughput distributed asynchronous job processing library in Go..."
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 focus:outline-none focus:border-gray-900 leading-relaxed" 
                              value={proj.description} 
                              onChange={e => updateProj(idx, 'description', e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Honors & Achievements */}
            {(activeTab === 'all' || activeTab === 'achievements') && (
              <div id="section-achievements" className="rounded-xl border border-gray-400 bg-background-200 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-400/70 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-background-100 border border-gray-400 flex items-center justify-center text-gray-900">
                      <Award className="w-3.5 h-3.5" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xs font-semibold text-gray-1000">Honors &amp; Achievements ({achievements.length})</h3>
                  </div>
                  <button 
                    type="button" 
                    onClick={addAchieve} 
                    className="px-3 py-1.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-900 hover:bg-gray-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Achievement
                  </button>
                </div>

                {achievements.length === 0 ? (
                  <div className="text-center py-6 border border-dashed border-gray-400 rounded-lg bg-background-100/50">
                    <Award className="w-6 h-6 text-gray-500 mx-auto mb-1.5" strokeWidth={1.5} />
                    <p className="text-xs text-gray-700 font-sans">No honors or certificates recorded yet.</p>
                    <button type="button" onClick={addAchieve} className="mt-1.5 text-xs font-medium text-gray-900 hover:text-gray-1000 underline cursor-pointer">+ Add Achievement</button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {achievements.map((ach, idx) => (
                      <div key={idx} className="bg-background-100 p-4 rounded-lg border border-gray-400 space-y-3 relative shadow-2xs">
                        <div className="flex items-center justify-between border-b border-gray-400/50 pb-2">
                          <span className="text-[11px] font-mono font-medium text-gray-600 uppercase tracking-wider">Achievement #{idx + 1}</span>
                          <button 
                            type="button" 
                            onClick={() => removeAchieve(idx)} 
                            className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors cursor-pointer"
                            title="Remove achievement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">Title</label>
                            <input 
                              required 
                              placeholder="e.g. 1st Place - University Hackathon"
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 focus:outline-none focus:border-gray-900" 
                              value={ach.title} 
                              onChange={e => updateAchieve(idx, 'title', e.target.value)} 
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-gray-800">Date Received</label>
                            <input 
                              type="date" 
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 font-mono focus:outline-none focus:border-gray-900" 
                              value={ach.date?.split('T')[0] || ''} 
                              onChange={e => updateAchieve(idx, 'date', e.target.value)} 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[11px] font-medium text-gray-800">Certificate / Badge Image URL (Optional)</label>
                            <input 
                              type="url" 
                              placeholder="https://..."
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 font-mono focus:outline-none focus:border-gray-900" 
                              value={ach.imageUrl} 
                              onChange={e => updateAchieve(idx, 'imageUrl', e.target.value)} 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-[11px] font-medium text-gray-800">Description</label>
                            <textarea 
                              rows="2" 
                              placeholder="Awarded for creating an autonomous agent system..."
                              className="w-full px-2.5 py-1.5 border border-gray-400 rounded-md bg-background-200 text-gray-1000 mt-1 focus:outline-none focus:border-gray-900 leading-relaxed" 
                              value={ach.description} 
                              onChange={e => updateAchieve(idx, 'description', e.target.value)} 
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </form>
        </div>

        {/* Modal Sticky Bottom Footer */}
        <div className="px-6 py-3.5 bg-background-200 border-t border-gray-400 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-gray-600 hidden sm:inline-block">
            All updates sync with your campus portfolio
          </span>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-5 py-1.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Portfolio & Sync'}
            </button>
          </div>
        </div>

        {/* Handles Change Warning Confirmation Modal */}
        {showConfirmModal && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-30 flex items-center justify-center p-6 rounded-xl animate-in fade-in duration-150">
            <div className="max-w-md w-full p-6 border border-amber-500/30 bg-background-100 shadow-2xl rounded-xl text-center space-y-4 text-gray-1000 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-2xs">
                <AlertTriangle className="w-6 h-6" strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-1000">Confirm Handle Modification</h4>
                <p className="text-xs text-gray-700 font-sans mt-1.5 leading-relaxed">
                  Updating your GitHub, LeetCode, or LinkedIn handles will re-sync your platform identity. Handles can only be updated once every 24 hours.
                </p>
              </div>
              <div className="flex gap-2.5 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-1.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSave}
                  disabled={loading}
                  className="px-4 py-1.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm &amp; Update</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// =============================================================================
// 3. MAIN STUDENT PROFILE PAGE
// =============================================================================
export default function StudentProfile() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarCropSrc, setAvatarCropSrc] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [verifyingPlatform, setVerifyingPlatform] = useState(null);
  const [verifyingLoad, setVerifyingLoad] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [userPlacementPosts, setUserPlacementPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('portfolio');
  const [copiedCode, setCopiedCode] = useState(false);
  const [linkingAccount, setLinkingAccount] = useState(null);
  const [linkingInput, setLinkingInput] = useState('');
  const [linkingLoading, setLinkingLoading] = useState(false);
  const [linkingOtpRequired, setLinkingOtpRequired] = useState(false);
  const [linkingOtp, setLinkingOtp] = useState('');

  const handleLinkAccount = async () => {
    if (!linkingInput || !linkingInput.trim()) return;
    setLinkingLoading(true);
    try {
      const resp = await axios.post('/auth/link-account', { identifier: linkingInput.trim() });
      if (resp.data.requiresOtp) {
        setLinkingOtpRequired(true);
        showToast('OTP sent to your email', 'success');
      } else {
        const res = await axios.get('/user/profile');
        setProfile(res.data);
        setLinkingAccount(null);
        setLinkingInput('');
        showToast('Account linked successfully!', 'success');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to link account', 'error');
    } finally {
      setLinkingLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!linkingOtp || !linkingOtp.trim()) return;
    setLinkingLoading(true);
    try {
      await axios.post('/auth/verify-link-otp', { otp: linkingOtp.trim() });
      const res = await axios.get('/user/profile');
      setProfile(res.data);
      setLinkingAccount(null);
      setLinkingInput('');
      setLinkingOtp('');
      setLinkingOtpRequired(false);
      showToast('Email verified and linked successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Invalid OTP', 'error');
    } finally {
      setLinkingLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/user/profile');
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?._id) {
      axios.get(`/placements/user/${profile._id}`)
        .then(res => setUserPlacementPosts(res.data || []))
        .catch(err => console.error('Failed to load user placement posts:', err));
    }
  }, [profile?._id]);

  const handleGenerateCodeAndVerify = async (platform) => {
    try {
      const res = await axios.post('/user/generate-verification-code');
      setProfile(res.data.user);
      setVerificationSuccess(false);
      setVerifyingPlatform(platform);
    } catch (err) {
      showToast('Failed to generate verification code', 'error');
    }
  };

  const handleVerify = async (platform) => {
    setVerifyingLoad(true);
    try {
      const res = await axios.post('/user/verify-platform', { platform });
      setProfile(res.data.user);
      setVerificationSuccess(true);
      showToast(`${platform === 'github' ? 'GitHub' : 'LeetCode'} verified successfully!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Verification failed', 'error');
    } finally {
      setVerifyingLoad(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(profile.verificationCode);
      setCopiedCode(true);
      showToast('Verification code copied to clipboard!', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      showToast('Failed to copy code. Please copy it manually.', 'error');
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => setAvatarCropSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAvatarCropComplete = async (croppedBlob) => {
    setAvatarCropSrc(null);
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', croppedBlob);

    try {
      const res = await axios.post('/user/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data.user);
      showToast('Profile picture updated successfully!', 'success');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      showToast(err.response?.data?.message || 'Failed to update profile picture', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const isProfileModalOpen = Boolean(
    showEditor ||
    showPdf ||
    selectedAchievement ||
    verifyingPlatform ||
    avatarCropSrc ||
    linkingAccount ||
    (profile && (!profile.isProfileComplete || !profile.email || !profile.uid))
  );

  useEffect(() => {
    if (isProfileModalOpen) {
      const originalBody = document.body.style.overflow;
      const originalHtml = document.documentElement.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalBody;
        document.documentElement.style.overflow = originalHtml;
      };
    }
  }, [isProfileModalOpen]);

  if (loading) {
    return (
      <div className="flex-1 relative">
        <div className="hidden md:flex bg-background-100 border-b border-gray-400 h-14 w-full" />
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-md" />
          <div className="h-36 w-full bg-gray-200 animate-pulse rounded-xl" />
          <div className="h-64 w-full bg-gray-200 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <main className="flex-1 flex justify-center items-center p-8 text-xs font-mono text-gray-600">
        Profile not found or error loading data.
      </main>
    );
  }

  // Calculate metrics and missing sections
  const skills = profile.resumeDetails?.skills || [];
  const experience = profile.resumeDetails?.experience || [];
  const education = profile.resumeDetails?.education || [];
  const projects = profile.resumeDetails?.projects || [];
  const achievements = profile.resumeDetails?.achievements || [];
  const portfolioUrl = profile.resumeDetails?.portfolioUrl || '';
  const manualCerts = profile.resumeDetails?.certificates || [];
  const scrapedCerts = profile.scrapedData?.linkedin?.certifications || [];
  
  const certificatesMap = new Map();
  scrapedCerts.forEach(cert => certificatesMap.set(cert.title, { isComplete: false }));
  manualCerts.forEach(cert => certificatesMap.set(cert.title, cert));
  
  const allCertificates = Array.from(certificatesMap.values());
  const hasIncompleteCerts = allCertificates.length === 0 ? false : allCertificates.some(cert => !cert.isComplete);
  const hasCertificates = allCertificates.length > 0;

  const { profileStrength, missingSections } = profile ? calculateProfileCompleteness(profile) : { profileStrength: 0, missingSections: [] };

  const handleShareProfile = async () => {
    if (!profile.uid) {
      showToast('UID is missing, cannot share profile', 'error');
      return;
    }
    // Support parsing like 23-COMPA10-27 to make it URL friendly, or just use the exact UID
    const publicUrl = `${window.location.origin}/student/${profile.uid.toUpperCase()}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      showToast('Public profile link copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy URL', 'error');
    }
  };

  return (
    <>
      
      {/* Onboarding Overlay if profile incomplete */}
      {(!profile.isProfileComplete || !profile.email || !profile.uid) && (
        <ProfileSetupOverlay onComplete={setProfile} user={profile} />
      )}

      {/* Resume Editor Modal */}
      {showEditor && (
        <ResumeEditorModal 
          initialSectionId={typeof showEditor === 'string' ? showEditor : null}
          profile={profile} 
          onClose={() => setShowEditor(false)} 
          onComplete={(updatedProfile) => setProfile(updatedProfile)} 
          onPreviewPdf={() => setShowPdf(true)}
        />
      )}

      {/* PDF Viewer Modal */}
      {showPdf && profile.resumeUrl && (
        <PdfViewerModal url={profile.resumeUrl} onClose={() => setShowPdf(false)} />
      )}

      {/* Link Account Modal */}
      {linkingAccount && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-150" onClick={() => { setLinkingAccount(null); setLinkingOtpRequired(false); setLinkingOtp(''); }}>
          <div className="bg-background-100 rounded-xl shadow-2xl max-w-md w-full border border-gray-400 p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-gray-400">
              <h2 className="text-sm font-semibold text-gray-1000">
                {linkingOtpRequired ? 'Verify OTP' : `Link ${linkingAccount === 'email' ? 'Personal Email' : linkingAccount === 'universityEmail' ? 'University Email' : 'Student UID'}`}
              </h2>
              <button onClick={() => { setLinkingAccount(null); setLinkingOtpRequired(false); setLinkingOtp(''); }} className="text-gray-700 hover:text-gray-1000"><X className="w-4 h-4" /></button>
            </div>
            
            {!linkingOtpRequired ? (
              <>
                <div>
                  <p className="text-xs text-gray-700 mb-3 font-sans">
                    {linkingAccount === 'email' ? 'Enter your personal email address. E.g. name@gmail.com' : 
                     linkingAccount === 'universityEmail' ? 'Enter your university email address. E.g. name@tcetmumbai.in' : 
                     'Enter your 14-character student UID. E.g. 23-COMPA10-27'}
                  </p>
                  <input
                    type="text"
                    value={linkingInput}
                    onChange={(e) => setLinkingInput(e.target.value)}
                    placeholder={linkingAccount === 'email' ? 'name@gmail.com' : linkingAccount === 'universityEmail' ? 'name@tcetmumbai.in' : '23-COMPA10-27'}
                    className="w-full px-3 py-2 text-xs border border-gray-400 bg-background-200 rounded-md text-gray-1000 focus:outline-none focus:border-gray-600"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => { setLinkingAccount(null); setLinkingOtpRequired(false); setLinkingOtp(''); }} className="px-4 py-1.5 rounded-md border border-gray-400 text-xs font-medium text-gray-800 hover:bg-gray-200 transition-colors">Cancel</button>
                  <button onClick={handleLinkAccount} disabled={linkingLoading} className="px-4 py-1.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity">
                    {linkingLoading ? 'Processing...' : (linkingAccount !== 'uid' ? 'Send OTP' : 'Link Account')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs text-gray-700 mb-3 font-sans">
                    Please enter the 6-digit OTP sent to <strong>{linkingInput}</strong>.
                  </p>
                  <input
                    type="text"
                    value={linkingOtp}
                    onChange={(e) => setLinkingOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    className="w-full px-3 py-2 text-xs border border-gray-400 bg-background-200 rounded-md text-gray-1000 focus:outline-none focus:border-gray-600 font-mono tracking-widest text-center text-lg"
                    maxLength={6}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => { setLinkingOtpRequired(false); setLinkingOtp(''); }} className="px-4 py-1.5 rounded-md border border-gray-400 text-xs font-medium text-gray-800 hover:bg-gray-200 transition-colors">Back</button>
                  <button onClick={handleVerifyOtp} disabled={linkingLoading} className="px-4 py-1.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity">
                    {linkingLoading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Achievement Details Modal */}
      {selectedAchievement && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedAchievement(null)}
        >
          <div 
            className="bg-background-100 rounded-xl shadow-2xl max-w-xl w-full border border-gray-400 max-h-[90vh] flex flex-col overflow-hidden text-gray-1000"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-400 bg-background-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-2xs">
                  <Award className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">Achievement Details</h2>
                  <span className="text-[10px] font-mono text-gray-600">Verified Credential Showcase</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAchievement(null)} 
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-md text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              {selectedAchievement.imageUrl && (
                <div className="rounded-xl border border-gray-400 p-2.5 bg-background-200 flex items-center justify-center overflow-hidden shadow-2xs">
                  <img 
                    src={selectedAchievement.imageUrl} 
                    alt={selectedAchievement.title} 
                    className="w-full max-h-64 object-contain rounded-lg" 
                  />
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base font-semibold text-gray-1000 tracking-tight">{selectedAchievement.title}</h3>
                  {selectedAchievement.date && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background-200 border border-gray-400 text-[10px] font-mono text-gray-700 uppercase tracking-wider">
                      <Calendar className="w-3 h-3" />
                      {new Date(selectedAchievement.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-background-200 border border-gray-400">
                <p className="text-xs text-gray-1000 font-sans whitespace-pre-line leading-relaxed">
                  {selectedAchievement.description || 'No detailed description provided.'}
                </p>
              </div>
            </div>
            <div className="px-6 py-3.5 bg-background-200 border-t border-gray-400 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedAchievement(null)}
                className="px-4 py-1.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {avatarCropSrc && (
        <ImageCropperModal
          imageSrc={avatarCropSrc}
          aspectRatio={1}
          onCropComplete={handleAvatarCropComplete}
          onCancel={() => setAvatarCropSrc(null)}
        />
      )}

      {/* Platform Verification Modal */}
      {verifyingPlatform && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setVerifyingPlatform(null)}
        >
          <div 
            className="bg-background-100 rounded-xl shadow-2xl max-w-md w-full border border-gray-400 overflow-hidden text-gray-1000 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-4 bg-background-200 border-b border-gray-400">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-background-100 border border-gray-400 flex items-center justify-center shadow-2xs">
                  {verifyingPlatform === 'github' ? <FaGithub className="w-4 h-4 text-gray-1000" /> : verifyingPlatform === 'leetcode' ? <SiLeetcode className="w-4 h-4 text-[#ffa116]" /> : <FaLinkedin className="w-4 h-4 text-[#0A66C2]" />}
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">Verify {verifyingPlatform === 'github' ? 'GitHub' : verifyingPlatform === 'leetcode' ? 'LeetCode' : 'LinkedIn'}</h2>
                  <span className="text-[10px] font-mono text-gray-600">Cryptographic Identity Verification</span>
                </div>
              </div>
              <button 
                onClick={() => setVerifyingPlatform(null)} 
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-md text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {verificationSuccess ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-2xs">
                  <CheckCircle2 className="w-6 h-6" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-1000">Verification Successful!</h3>
                  <p className="text-xs text-gray-700 font-sans mt-1 leading-relaxed">
                    Your {verifyingPlatform === 'github' ? 'GitHub' : verifyingPlatform === 'leetcode' ? 'LeetCode' : 'LinkedIn'} identity is now cryptographically verified. You can safely remove the verification tag from your profile.
                  </p>
                </div>
                <button 
                  onClick={() => setVerifyingPlatform(null)} 
                  className="w-full bg-gray-1000 text-background-100 py-2.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-4 text-xs font-sans">
                <div className="space-y-2">
                  <p className="text-gray-700 leading-relaxed">
                    To verify ownership of <strong>{verifyingPlatform === 'github' ? profile.githubUsername : verifyingPlatform === 'leetcode' ? profile.leetcodeUsername : 'LinkedIn Profile'}</strong>, copy the one-time token below and paste it temporarily into your <strong>{verifyingPlatform === 'github' ? 'GitHub Bio' : verifyingPlatform === 'leetcode' ? 'LeetCode About/Readme' : 'LinkedIn About Section'}</strong>:
                  </p>

                  <div className="bg-background-200 p-3.5 rounded-lg border border-gray-400 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-mono text-gray-600 block uppercase tracking-wider mb-0.5">Verification Token</span>
                      <span className="font-mono text-xs font-bold text-gray-1000 select-all tracking-wider break-all">{profile.verificationCode}</span>
                    </div>
                    <button 
                      onClick={handleCopyCode} 
                      className="h-8 px-2.5 rounded-md bg-background-100 border border-gray-400 hover:bg-gray-200 text-gray-700 hover:text-gray-1000 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer text-xs font-mono" 
                      title="Copy code"
                    >
                      {copiedCode ? (
                        <>
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-medium">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[11px] text-amber-700 dark:text-amber-400 space-y-1">
                  <span className="font-semibold block">3-Step Verification:</span>
                  <p className="text-gray-700 font-sans">1. Copy token &rarr; 2. Add to your account bio &rarr; 3. Click "Verify Account Now".</p>
                </div>

                <button 
                  onClick={() => handleVerify(verifyingPlatform)} 
                  disabled={verifyingLoad}
                  className="w-full bg-gray-1000 text-background-100 py-2.5 rounded-md text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer shadow-xs"
                >
                  {verifyingLoad ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify Account Now'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 min-w-0">

        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">
          
          {/* ===================================================================
              PROFILE HEADER & IDENTITY OVERVIEW
              =================================================================== */}
          <section className="rounded-xl border border-gray-400 bg-background-200 p-6 shadow-2xs space-y-6">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
              
              {/* Avatar & Core Metadata */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
                
                {/* Avatar with Camera Trigger */}
                <div className="relative group w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-800 border-2 border-gray-400 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                  {profile.avatarUrl ? (
                    <img src={profile.avatarUrl} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-semibold text-gray-700 text-xl font-mono">
                      {profile.name?.slice(0, 2).toUpperCase() || 'ST'}
                    </span>
                  )}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                  {!uploadingAvatar && (
                    <label className="absolute inset-0 bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                      <Camera className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-[10px] font-mono mt-0.5">Upload</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  )}
                </div>

                {/* Name, Email, Institution */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h1 className="text-xl font-semibold text-gray-1000 tracking-tight">{profile.name}</h1>
                    {profile.uid && (
                      <span className="px-2 py-0.5 rounded-full bg-background-100 border border-gray-400 text-[10px] font-mono text-gray-700">
                        {profile.uid}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-mono">{profile.email}</p>
                  <p className="text-xs text-gray-600 font-sans pt-0.5">
                    {education.length > 0 ? `${education[0].degree} · ${education[0].institution}` : 'Campus Connect Student'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditor(true)}
                  className="h-8 px-3 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit3 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Edit Resume</span>
                </button>
                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="h-8 px-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-medium text-emerald-700 dark:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Share Profile</span>
                </button>
                {profile.resumeUrl && (
                  <button
                    type="button"
                    onClick={() => setShowPdf(true)}
                    className="h-8 px-3 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
                    <span>View PDF</span>
                  </button>
                )}
                <Link
                  to="/placements/create"
                  className="h-8 px-3 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-900 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Share Experience</span>
                </Link>
              </div>
            </div>

            {/* Connected Identities Pills Strip */}
            <div className="pt-4 border-t border-gray-400 flex flex-wrap items-center gap-2.5">
              {profile.githubUsername && (
                <div className="inline-flex items-center gap-1.5 text-xs font-mono">
                  {profile.githubVerified ? (
                    <a
                      href={`https://github.com/${profile.githubUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      title="Verified GitHub profile"
                    >
                      <FaGithub className="w-3.5 h-3.5" />
                      <span>{profile.githubUsername}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleGenerateCodeAndVerify('github')}
                      className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                      title="Click to verify GitHub"
                    >
                      <FaGithub className="w-3.5 h-3.5" />
                      <span>{profile.githubUsername}</span>
                      <span className="text-[10px] font-sans font-medium px-1 rounded bg-amber-500/20">Verify</span>
                    </button>
                  )}
                </div>
              )}

              {profile.leetcodeUsername && (
                <div className="inline-flex items-center gap-1.5 text-xs font-mono">
                  {profile.leetcodeVerified ? (
                    <a
                      href={`https://leetcode.com/u/${profile.leetcodeUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      title="Verified LeetCode profile"
                    >
                      <SiLeetcode className="w-3.5 h-3.5 text-[#ffa116]" />
                      <span>{profile.leetcodeUsername}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleGenerateCodeAndVerify('leetcode')}
                      className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                      title="Click to verify LeetCode"
                    >
                      <SiLeetcode className="w-3.5 h-3.5 text-[#ffa116]" />
                      <span>{profile.leetcodeUsername}</span>
                      <span className="text-[10px] font-sans font-medium px-1 rounded bg-amber-500/20">Verify</span>
                    </button>
                  )}
                </div>
              )}

              {profile.linkedInUrl && (
                <div className="inline-flex items-center gap-1.5 text-xs font-mono">
                  {profile.linkedInVerified ? (
                    <a
                      href={profile.linkedInUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                      title="Verified LinkedIn profile"
                    >
                      <FaLinkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                      <span>LinkedIn</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleGenerateCodeAndVerify('linkedin')}
                      className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                      title="Click to verify LinkedIn"
                    >
                      <FaLinkedin className="w-3.5 h-3.5 text-[#0A66C2]" />
                      <span>LinkedIn</span>
                      <span className="text-[10px] font-sans font-medium px-1 rounded bg-amber-500/20">Verify</span>
                    </button>
                  )}
                </div>
              )}

              {profile.resumeDetails?.portfolioUrl && (
                <a
                  href={formatExternalUrl(profile.resumeDetails.portfolioUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-md bg-background-100 border border-gray-400 text-gray-800 flex items-center gap-1.5 text-xs font-mono hover:text-gray-1000 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-gray-600" />
                  <span>Portfolio</span>
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </a>
              )}
            </div>

            {/* Profile Strength Progress Strip */}
            <div className="pt-4 border-t border-gray-400 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-gray-700 font-medium">Portfolio Completion</span>
                <span className="text-gray-1000 font-bold">{profileStrength}%</span>
              </div>
              <div className="h-1.5 w-full bg-gray-300 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-700 rounded-full transition-all duration-700" 
                  style={{ width: `${profileStrength}%` }} 
                />
              </div>
              {profileStrength < 100 && missingSections.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-mono pt-1">
                  <span className="text-gray-700 font-medium">Incomplete:</span>
                  {missingSections.map(sec => (
                    <span 
                      key={sec} 
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-[10px] font-mono font-medium transition-colors"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                      <span>{sec}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ===================================================================
              CANONICAL VERCEL UNDERLINE TAB BAR
              =================================================================== */}
          <div className="flex items-center gap-6 border-b border-gray-400 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('portfolio')}
              className={`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'portfolio'
                  ? 'border-gray-1000 text-gray-1000 font-semibold'
                  : 'border-transparent text-gray-700 hover:text-gray-1000'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Portfolio &amp; Career</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('honors')}
              className={`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'honors'
                  ? 'border-gray-1000 text-gray-1000 font-semibold'
                  : 'border-transparent text-gray-700 hover:text-gray-1000'
              }`}
            >
              <Award className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Honors &amp; Credentials</span>
              {achievements.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-background-200 border border-gray-400 text-[10px] font-mono">
                  {achievements.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('placements')}
              className={`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'placements'
                  ? 'border-gray-1000 text-gray-1000 font-semibold'
                  : 'border-transparent text-gray-700 hover:text-gray-1000'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Placement Stories</span>
              {userPlacementPosts.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-background-200 border border-gray-400 text-[10px] font-mono">
                  {userPlacementPosts.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('identities')}
              className={`pb-3 transition-colors border-b-2 -mb-px cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'identities'
                  ? 'border-gray-1000 text-gray-1000 font-semibold'
                  : 'border-transparent text-gray-700 hover:text-gray-1000'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>Verification</span>
            </button>
          </div>

          {/* ===================================================================
              TAB 1: PORTFOLIO & CAREER (CLEAN, NO CLUTTER)
              =================================================================== */}
          {activeTab === 'portfolio' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* 4-Column Quick Metric Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 rounded-xl border border-gray-400 bg-background-200 divide-y md:divide-y-0 md:divide-x divide-gray-400 overflow-hidden shadow-2xs">
                <div className="p-4 flex flex-col justify-center">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gray-600">Technical Skills</span>
                  <span className="text-xl font-bold font-sans text-gray-1000 mt-1">{skills.length}</span>
                </div>
                <div className="p-4 flex flex-col justify-center">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gray-600">Work Experience</span>
                  <span className="text-xl font-bold font-sans text-gray-1000 mt-1">{experience.length}</span>
                </div>
                <div className="p-4 flex flex-col justify-center">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gray-600">Projects</span>
                  <span className="text-xl font-bold font-sans text-gray-1000 mt-1">{projects.length}</span>
                </div>
                <div className="p-4 flex flex-col justify-center">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gray-600">Degrees</span>
                  <span className="text-xl font-bold font-sans text-gray-1000 mt-1">{education.length}</span>
                </div>
              </div>

              {/* Skills Tags Cloud */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                    <Code2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Verified Technical Skills
                  </h3>
                  <button
                    onClick={() => setShowEditor('section-skills')}
                    className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
                  >
                    Manage Skills &rarr;
                  </button>
                </div>

                {skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {skills.map((skill, idx) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 rounded-md bg-background-100 border border-gray-400 text-xs font-mono text-gray-900 font-medium hover:border-gray-500 transition-colors"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 font-mono py-4">No skills registered. Click Update Resume to add skills.</p>
                )}
              </div>

              {/* Work Experience Timeline */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-400 pb-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5" strokeWidth={1.5} /> Work Experience
                  </h3>
                  <button
                    onClick={() => setShowEditor('section-experience')}
                    className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
                  >
                    + Add Role
                  </button>
                </div>

                {experience.length > 0 ? (
                  <div className="relative border-l border-gray-400 ml-3 space-y-6 pt-2 pb-1">
                    {experience.map((exp, idx) => (
                      <div key={idx} className="relative pl-6 space-y-1">
                        <div className="absolute w-2.5 h-2.5 bg-gray-1000 rounded-full -left-[5px] top-1.5 ring-4 ring-background-200" />
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <h4 className="text-sm font-semibold text-gray-1000">{exp.role}</h4>
                          <span className="text-[11px] font-mono text-gray-600">
                            {exp.startDate} – {exp.endDate || 'Present'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 font-mono">{exp.company}</p>
                        {exp.description && (
                          <p className="text-xs text-gray-700 font-sans leading-relaxed pt-1 whitespace-pre-line">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 font-mono py-4">No work experience added yet.</p>
                )}
              </div>

              {/* Education Background */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-400 pb-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                    <GraduationCap className="w-3.5 h-3.5" strokeWidth={1.5} /> Academic Background
                  </h3>
                  <button
                    onClick={() => setShowEditor('section-education')}
                    className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
                  >
                    + Add Degree
                  </button>
                </div>

                {education.length > 0 ? (
                  <div className="divide-y divide-gray-400">
                    {education.map((edu, idx) => (
                      <div key={idx} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-semibold text-gray-1000">{edu.degree}</div>
                          <div className="text-xs text-gray-700 font-sans mt-0.5">{edu.institution}</div>
                        </div>
                        <span className="text-[11px] font-mono text-gray-600 shrink-0">
                          {edu.startYear} – {edu.endYear || 'Present'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 font-mono py-4">No educational history registered.</p>
                )}
              </div>

              {/* Featured Projects Grid */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-400 pb-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                    <FolderGit2 className="w-3.5 h-3.5" strokeWidth={1.5} /> Featured Projects
                  </h3>
                  <button
                    onClick={() => setShowEditor('section-projects')}
                    className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
                  >
                    + Add Project
                  </button>
                </div>

                {projects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((proj, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 rounded-lg border border-gray-400 bg-background-100 flex flex-col justify-between space-y-3 hover:border-gray-500 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-semibold text-gray-1000 truncate">{proj.title}</h4>
                            {proj.link && (
                              <a 
                                href={formatExternalUrl(proj.link)} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-gray-600 hover:text-gray-1000 transition-colors p-1"
                                title="Open project link"
                              >
                                <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                              </a>
                            )}
                          </div>
                          {proj.description && (
                            <p className="text-xs text-gray-700 font-sans line-clamp-3 leading-relaxed">
                              {proj.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 font-mono py-4">No projects listed. Update your resume to showcase projects.</p>
                )}
              </div>

            </div>
          )}

          {/* ===================================================================
              TAB 2: HONORS & CREDENTIALS
              =================================================================== */}
          {activeTab === 'honors' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              
              {/* Achievements Grid */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center justify-between border-b border-gray-400 pb-3">
                  <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                    <Award className="w-3.5 h-3.5" strokeWidth={1.5} /> Verified Achievements &amp; Awards
                  </h3>
                  <button
                    onClick={() => setShowEditor('section-achievements')}
                    className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline cursor-pointer"
                  >
                    + Add Achievement
                  </button>
                </div>

                {achievements.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((ach, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedAchievement(ach)} 
                        className="p-4 rounded-lg border border-gray-400 bg-background-100 hover:border-gray-500 cursor-pointer transition-colors flex flex-col justify-between space-y-3"
                      >
                        {ach.imageUrl && (
                          <img 
                            src={ach.imageUrl} 
                            alt={ach.title} 
                            className="w-full h-36 object-contain bg-background-200 rounded-md border border-gray-400" 
                          />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <h4 className="text-xs font-semibold text-gray-1000 truncate">{ach.title}</h4>
                            <span className="text-[10px] font-mono text-gray-600 shrink-0">
                              {ach.date ? new Date(ach.date).toLocaleDateString() : ''}
                            </span>
                          </div>
                          {ach.description && (
                            <p className="text-xs text-gray-700 font-sans line-clamp-2 leading-relaxed">
                              {ach.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 font-mono py-6 text-center">No achievements added yet.</p>
                )}
              </div>

              {/* LinkedIn Certifications Summary */}
              {profile.scrapedData?.linkedin?.certifications?.length > 0 && (
                <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-gray-400 pb-3">
                    <h3 className="text-xs font-mono uppercase tracking-wider text-gray-600 flex items-center gap-2">
                      <FaLinkedin className="text-[#0A66C2]" /> LinkedIn Certifications
                    </h3>
                    <Link to="/certificates" className="text-xs text-gray-700 hover:text-gray-1000 font-mono hover:underline">
                      Manage All ({profile.scrapedData.linkedin.certifications.length}) &rarr;
                    </Link>
                  </div>

                  <div className="divide-y divide-gray-400">
                    {profile.scrapedData.linkedin.certifications.map((cert, i) => (
                      <div key={i} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="text-xs font-medium text-gray-1000">{cert.title}</div>
                          <div className="text-[11px] text-gray-600 font-sans mt-0.5">{cert.issuedBy}</div>
                        </div>
                        {cert.link && (
                          <a 
                            href={formatExternalUrl(cert.link)} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-[11px] font-mono text-gray-700 hover:text-gray-1000 hover:underline shrink-0 flex items-center gap-1"
                          >
                            <span>View Credential</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ===================================================================
              TAB 3: PLACEMENT STORIES
              =================================================================== */}
          {activeTab === 'placements' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-1000 tracking-tight">Interview Guides &amp; Placement Experiences</h2>
                  <p className="text-xs text-gray-700 font-mono mt-0.5">
                    Interview rounds, assessment questions, and hiring tips shared by {profile.name}
                  </p>
                </div>
                <Link
                  to="/placements/create"
                  className="h-8 px-3 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Write Placement Review</span>
                </Link>
              </div>

              {userPlacementPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userPlacementPosts.map((post) => (
                    <div
                      key={post._id}
                      className="rounded-xl border border-gray-400 bg-background-200 p-5 shadow-2xs hover:border-gray-500 transition-colors flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-background-100 border border-gray-400 p-1 flex items-center justify-center font-bold text-xs text-gray-1000 shrink-0 overflow-hidden shadow-2xs">
                              {post.company?.logoUrl || post.company?.name ? (
                                <>
                                  <img 
                                    src={post.company?.logoUrl || `https://logo.clearbit.com/${post.company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`} 
                                    alt={post.company?.name} 
                                    className="w-full h-full object-contain" 
                                    onError={(e) => {
                                      e.target.onerror = null;
                                      e.target.style.display = 'none';
                                      if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline';
                                    }}
                                  />
                                  <span className="hidden">
                                    {post.company?.name?.charAt(0)?.toUpperCase() || 'C'}
                                  </span>
                                </>
                              ) : (
                                post.company?.name?.charAt(0)?.toUpperCase() || 'C'
                              )}
                            </div>
                            <div className="truncate">
                              <h3 className="text-xs font-semibold text-gray-1000 truncate">{post.company?.name}</h3>
                              <span className="text-[11px] text-gray-600 font-mono">{post.role}</span>
                            </div>
                          </div>

                          {post.outcome === 'selected' && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-medium shrink-0">
                              Selected
                            </span>
                          )}
                        </div>

                        <Link to={`/placements/${post._id}`} className="block group">
                          <h4 className="text-xs font-medium text-gray-1000 group-hover:underline line-clamp-2 leading-relaxed">
                            {post.title}
                          </h4>
                        </Link>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-400 text-[11px] font-mono text-gray-600">
                        <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            <span>{post.commentCount || 0}</span>
                          </span>
                          <Link to={`/placements/${post._id}`} className="text-gray-900 font-medium hover:underline">
                            Read &rarr;
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-gray-400 bg-background-200 p-8 text-center space-y-3">
                  <p className="text-xs text-gray-700 font-mono">No placement experiences published yet.</p>
                  <Link
                    to="/placements/create"
                    className="inline-flex items-center gap-1 text-xs text-gray-1000 font-semibold underline"
                  >
                    Share your first interview round with the campus community &rarr;
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              TAB 4: CONNECTED IDENTITIES & VERIFICATION
              =================================================================== */}
          {activeTab === 'identities' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Core Account Identities Card */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex items-center gap-3 border-b border-gray-400 pb-4">
                  <div className="w-8 h-8 rounded-lg bg-background-100 border border-gray-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-gray-1000" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-1000">Core Account Identities</h3>
                    <p className="text-[11px] text-gray-600 font-sans">Manage your primary identifiers and recovery methods</p>
                  </div>
                </div>
                
                <div className="space-y-4 pt-1">
                  {/* Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-gray-1000">Personal Email</div>
                      <div className="text-[11px] text-gray-600 font-mono">{profile.email || 'Not connected'}</div>
                    </div>
                    {!profile.email && (
                      <button onClick={() => setLinkingAccount('email')} className="text-xs font-mono text-gray-700 hover:text-gray-1000 underline cursor-pointer">Link Email</button>
                    )}
                  </div>
                  
                  {/* University Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-gray-1000">University Email</div>
                      <div className="text-[11px] text-gray-600 font-mono">{profile.universityEmail || 'Not connected'}</div>
                    </div>
                    {!profile.universityEmail && (
                      <button onClick={() => setLinkingAccount('universityEmail')} className="text-xs font-mono text-gray-700 hover:text-gray-1000 underline cursor-pointer">Link University Email</button>
                    )}
                  </div>

                  {/* UID */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold text-gray-1000">Student UID</div>
                      <div className="text-[11px] text-gray-600 font-mono">{profile.uid || 'Not connected'}</div>
                    </div>
                    {!profile.uid && (
                      <button onClick={() => setLinkingAccount('uid')} className="text-xs font-mono text-gray-700 hover:text-gray-1000 underline cursor-pointer">Link UID</button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* GitHub Card */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-400 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-background-100 border border-gray-400 flex items-center justify-center">
                      <FaGithub className="w-4 h-4 text-gray-1000" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-1000">GitHub Identity Verification</h3>
                      <p className="text-[11px] text-gray-600 font-mono">
                        {profile.githubUsername ? `@${profile.githubUsername}` : 'Not connected'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {profile.githubVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Account</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGenerateCodeAndVerify('github')}
                        className="h-8 px-3 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity cursor-pointer shadow-xs"
                      >
                        Verify Ownership
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  Verifying your GitHub identity certifies your public repositories, contributions heatmap, and starred works on the Campus Connect recruiter leaderboard.
                </p>
              </div>

              {/* LeetCode Card */}
              <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-400 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ffa116]/10 border border-[#ffa116]/30 flex items-center justify-center">
                      <SiLeetcode className="w-4 h-4 text-[#ffa116]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-1000">LeetCode Identity Verification</h3>
                      <p className="text-[11px] text-gray-600 font-mono">
                        {profile.leetcodeUsername ? `@${profile.leetcodeUsername}` : 'Not connected'}
                      </p>
                    </div>
                  </div>

                  <div>
                    {profile.leetcodeVerified ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Account</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleGenerateCodeAndVerify('leetcode')}
                        className="h-8 px-3 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity cursor-pointer shadow-xs"
                      >
                        Verify Ownership
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  Verifying your LeetCode identity confirms your contest rating, global ranking, and difficulty breakdown statistics for student analytics and recruiter discovery.
                </p>
              </div>

              {/* LinkedIn Overview Card */}
              {profile.scrapedData?.linkedin && (
                <div className="rounded-xl border border-gray-400 bg-background-200 p-6 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-3 border-b border-gray-400 pb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#0A66C2]/10 border border-[#0A66C2]/30 flex items-center justify-center">
                      <FaLinkedin className="w-4 h-4 text-[#0A66C2]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-1000">
                        {profile.scrapedData.linkedin.firstName} {profile.scrapedData.linkedin.lastName}
                      </h3>
                      <p className="text-[11px] text-gray-600 font-sans">{profile.scrapedData.linkedin.headline}</p>
                    </div>
                  </div>

                  {profile.scrapedData.linkedin.about && (
                    <p className="text-xs text-gray-700 font-sans leading-relaxed whitespace-pre-line">
                      {profile.scrapedData.linkedin.about}
                    </p>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </>
  );
}
