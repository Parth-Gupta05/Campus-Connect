import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { Edit3, X, Loader2, Sparkles, Upload, FileText, MessageSquare, Globe, Code2, GraduationCap, Plus, Trash2, Briefcase, FolderGit2, Award, ExternalLink, AlertTriangle } from 'lucide-react';
import RichTextEditor from '../RichTextEditor';

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import ImageCropperModal from '../components/ImageCropperModal';
import PdfViewerModal from '../components/PdfViewerModal';
import AnimatedModal from '../components/ui/AnimatedModal';
import RichTextEditor from '../components/RichTextEditor';
import RichContentRenderer from '../components/RichContentRenderer';
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
  CheckCheck,
  FileSpreadsheet,
  Download
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
                    onChange={e => setFormData({ ...formData, [missingField]: e.target.value })}
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
                onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                onChange={e => setFormData({ ...formData, githubUsername: e.target.value })}
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
                onChange={e => setFormData({ ...formData, leetcodeUsername: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-medium text-gray-900 mb-1.5">LinkedIn Profile URL</label>
              <input
                type="url"
                className="w-full px-3 py-2 bg-background-200 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors font-mono"
                placeholder="https://linkedin.com/in/johndoe"
                value={formData.linkedInUrl}
                onChange={e => setFormData({ ...formData, linkedInUrl: e.target.value })}
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
                    onChange={(e) => setParsedProfileData({ ...parsedProfileData, branch: e.target.value })}
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
                        setParsedProfileData({ ...parsedProfileData, currentSem: sem, currentYear: calculateYearFromSem(sem) });
                      }}
                      className="w-full bg-background-200 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-1000 focus:outline-none focus:border-gray-900 transition-colors"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
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
                      onChange={(e) => setParsedProfileData({ ...parsedProfileData, division: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
                      className="w-full bg-background-200 border border-gray-400 rounded-lg px-3 py-2 text-sm text-gray-1000 uppercase focus:outline-none focus:border-gray-900 transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-1000 mb-1">Roll Number</label>
                  <input
                    type="number"
                    value={parsedProfileData.rollNo}
                    onChange={(e) => setParsedProfileData({ ...parsedProfileData, rollNo: e.target.value })}
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
