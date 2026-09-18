import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { 
  Building2, 
  Search, 
  Plus, 
  Users, 
  Key, 
  Copy, 
  Check, 
  Trash2, 
  Sparkles, 
  Calendar, 
  Layers, 
  ShieldCheck, 
  UserPlus, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Eye,
  EyeOff,
  X,
  FileSpreadsheet
} from 'lucide-react';

export default function AdminClubs() {
  const { showToast } = useToast();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showCoreModal, setShowCoreModal] = useState(false);
  const [selectedClubForCore, setSelectedClubForCore] = useState(null);
  const [viewCoreClub, setViewCoreClub] = useState(null);
  const [latestCredentials, setLatestCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  // Custom Delete Leader Modal state
  const [leaderToDelete, setLeaderToDelete] = useState(null);
  const [isDeletingLeader, setIsDeletingLeader] = useState(false);

  // Custom Reset Password Modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [clubToReset, setClubToReset] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  // Custom WC Roles Modal state
  const [showWcRolesModal, setShowWcRolesModal] = useState(false);
  const [clubForWcRoles, setClubForWcRoles] = useState(null);
  const [wcRolesInput, setWcRolesInput] = useState('');
  const [wcRolesList, setWcRolesList] = useState([]);
  const [isUpdatingWcRoles, setIsUpdatingWcRoles] = useState(false);

  // Custom Delete Club Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clubToDelete, setClubToDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeletingClub, setIsDeletingClub] = useState(false);

  // Create Club Form State
  const [newClubName, setNewClubName] = useState('');
  const [newClubCategory, setNewClubCategory] = useState('Technical');
  const [newClubDescription, setNewClubDescription] = useState('');
  const [newClubEmail, setNewClubEmail] = useState('');
  const [newClubPassword, setNewClubPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [coreMembersList, setCoreMembersList] = useState([]);

  // Student search for Provisioning modal
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);

  // Single Core addition modal state (with dedicated top-5 dropdown)
  const [coreModalSearchQuery, setCoreModalSearchQuery] = useState('');
  const [coreModalSearchResults, setCoreModalSearchResults] = useState([]);
  const [coreModalSearching, setCoreModalSearching] = useState(false);
  const [coreModalSelectedStudent, setCoreModalSelectedStudent] = useState(null);
  const [addCoreRole, setAddCoreRole] = useState('Core Committee Member');

  const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Social Outreach', 'Departmental', 'Literary', 'Entrepreneurship'];

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/admin/clubs');
      setClubs(res.data.clubs || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to fetch clubs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 6; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `Club@${rand}!`;
  };

  const openCreateModal = () => {
    setNewClubName('');
    setNewClubCategory('Technical');
    setNewClubDescription('');
    setNewClubEmail('');
    setNewClubPassword(generateRandomPassword());
    setCoreMembersList([]);
    setStudentSearchQuery('');
    setStudentSearchResults([]);
    setShowCreateModal(true);
  };

  // Auto-generate email based on name typing
  const handleNameChange = (e) => {
    const val = e.target.value;
    setNewClubName(val);
    const slug = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setNewClubEmail(slug ? `${slug}@campusconnect.edu` : '');
  };

  // Search students for Provisioning Modal (Top 5)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = studentSearchQuery.trim();
      if (q.length >= 1) {
        setSearchingStudents(true);
        try {
          const res = await axios.get(`/admin/students?search=${encodeURIComponent(q)}`);
          setStudentSearchResults((res.data.students || []).slice(0, 5));
        } catch (err) {
          console.error(err);
          setStudentSearchResults([]);
        } finally {
          setSearchingStudents(false);
        }
      } else {
        setStudentSearchResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [studentSearchQuery]);

  // Search students for Core Committee Appointment Modal (Top 5)
  useEffect(() => {
    const timer = setTimeout(async () => {
      const q = coreModalSearchQuery.trim();
      if (q.length >= 1) {
        setCoreModalSearching(true);
        try {
          const res = await axios.get(`/admin/students?search=${encodeURIComponent(q)}`);
          setCoreModalSearchResults((res.data.students || []).slice(0, 5));
        } catch (err) {
          console.error(err);
          setCoreModalSearchResults([]);
        } finally {
          setCoreModalSearching(false);
        }
      } else {
        setCoreModalSearchResults([]);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [coreModalSearchQuery]);

  const addStudentToCoreList = (student) => {
    if (coreMembersList.some(m => m.studentId === student._id)) {
      showToast('Student is already in Core Committee list', 'info');
      return;
    }
    setCoreMembersList(prev => [
      ...prev,
      {
        studentId: student._id,
        name: student.name,
        uid: student.uid,
        branch: student.branch,
        currentSem: student.currentSem,
        avatarUrl: student.avatarUrl,
        role: coreMembersList.length === 0 ? 'President' : coreMembersList.length === 1 ? 'Vice President' : 'Core Head'
      }
    ]);
    setStudentSearchQuery('');
    setStudentSearchResults([]);
  };

  const removeStudentFromCoreList = (studentId) => {
    setCoreMembersList(prev => prev.filter(m => m.studentId !== studentId));
  };

  const updateCoreMemberRole = (studentId, newRole) => {
    setCoreMembersList(prev => prev.map(m => m.studentId === studentId ? { ...m, role: newRole } : m));
  };

  const handleCreateClubSubmit = async (e) => {
    e.preventDefault();
    if (!newClubName.trim()) {
      showToast('Club name is required', 'error');
      return;
    }

    try {
      const payload = {
        name: newClubName.trim(),
        email: newClubEmail.trim(),
        password: newClubPassword.trim(),
        category: newClubCategory,
        description: newClubDescription,
        initialCoreMembers: coreMembersList.map(m => ({
          studentId: m.studentId,
          role: m.role
        }))
      };

      const res = await axios.post('/admin/clubs', payload);
      showToast('Club provisioned successfully!', 'success');
      setShowCreateModal(false);
      setLatestCredentials({
        clubName: newClubName,
        email: res.data.credentials.email,
        password: res.data.credentials.password
      });
      setShowCredentialsModal(true);
      fetchClubs();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create club', 'error');
    }
  };

  const handleResetPassword = (club) => {
    setClubToReset(club);
    setShowResetModal(true);
  };

  const executeResetPassword = async () => {
    if (!clubToReset) return;
    setIsResetting(true);
    try {
      const res = await axios.patch(`/admin/clubs/${clubToReset._id}/reset-password`);
      showToast('Password reset successfully!', 'success');
      setShowResetModal(false);
      setLatestCredentials({
        clubName: clubToReset.name,
        email: res.data.credentials.email,
        password: res.data.credentials.password
      });
      setShowCredentialsModal(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reset password', 'error');
    } finally {
      setIsResetting(false);
      setClubToReset(null);
    }
  };

  const handleDeleteClub = (club) => {
    setClubToDelete(club);
    setDeleteConfirmationText('');
    setShowDeleteModal(true);
  };

  const executeDeleteClub = async () => {
    if (!clubToDelete) return;
    if (deleteConfirmationText !== clubToDelete.name) {
      showToast('Club name does not match', 'error');
      return;
    }
    try {
      setIsDeletingClub(true);
      await axios.delete(`/admin/clubs/${clubToDelete._id}`);
      showToast('Club deleted successfully', 'success');
      setShowDeleteModal(false);
      setClubToDelete(null);
      setDeleteConfirmationText('');
      fetchClubs();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete club', 'error');
    } finally {
      setIsDeletingClub(false);
    }
  };

  const handleToggleMembership = async (club) => {
    try {
      const res = await axios.patch(`/admin/clubs/${club._id}/membership`);
      showToast(res.data.message, 'success');
      setClubs(clubs.map(c => c._id === club._id ? { ...c, hasMembershipSystem: !c.hasMembershipSystem } : c));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to toggle membership system', 'error');
    }
  };

  const openWcRolesModal = (club) => {
    setClubForWcRoles(club);
    setWcRolesList(club.wcRoles || []);
    setWcRolesInput('');
    setShowWcRolesModal(true);
  };

  const handleAddWcRole = (e) => {
    e.preventDefault();
    const role = wcRolesInput.trim();
    if (role && !wcRolesList.includes(role)) {
      setWcRolesList([...wcRolesList, role]);
      setWcRolesInput('');
    }
  };

  const handleRemoveWcRole = (roleToRemove) => {
    setWcRolesList(wcRolesList.filter(role => role !== roleToRemove));
  };

  const handleUpdateWcRoles = async () => {
    if (!clubForWcRoles) return;
    setIsUpdatingWcRoles(true);
    try {
      const res = await axios.patch(`/admin/clubs/${clubForWcRoles._id}/wcroles`, { wcRoles: wcRolesList });
      showToast(res.data.message, 'success');
      setClubs(clubs.map(c => c._id === clubForWcRoles._id ? { ...c, wcRoles: wcRolesList } : c));
      setShowWcRolesModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update WC roles', 'error');
    } finally {
      setIsUpdatingWcRoles(false);
    }
  };

  const openManageCoreModal = (club) => {
    setSelectedClubForCore(club);
    setCoreModalSearchQuery('');
    setCoreModalSearchResults([]);
    setCoreModalSearching(false);
    setCoreModalSelectedStudent(null);
    setAddCoreRole('Core Member');
    setShowCoreModal(true);
  };

  const handleAddCoreSubmit = async () => {
    if (!coreModalSelectedStudent) {
      showToast('Please search and select a student from the dropdown results', 'error');
      return;
    }

    try {
      await axios.post(`/admin/clubs/${selectedClubForCore._id}/core-members`, {
        studentId: coreModalSelectedStudent._id,
        role: addCoreRole || 'Core Member'
      });
      showToast('Core committee member appointed successfully!', 'success');
      setShowCoreModal(false);
      fetchClubs();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign core member', 'error');
    }
  };

  const handleInitiateRemoveCoreMember = (clubId, student, clubName, role) => {
    setLeaderToDelete({
      clubId,
      studentId: student?._id || student?.id,
      studentName: student?.name || 'this student',
      studentUid: student?.uid || '',
      clubName: clubName || viewCoreClub?.name || 'this organization',
      role: role || 'Core Member'
    });
  };

  const handleConfirmRemoveCoreMember = async () => {
    if (!leaderToDelete) return;
    const { clubId, studentId, studentName } = leaderToDelete;
    setIsDeletingLeader(true);
    try {
      await axios.delete(`/admin/clubs/${clubId}/core-members/${studentId}`);
      showToast(`${studentName} removed from Core Committee`, 'success');
      setViewCoreClub(prev => prev ? {
        ...prev,
        coreMembers: (prev.coreMembers || []).filter(m => m.student?._id !== studentId && m.student?.id !== studentId)
      } : null);
      fetchClubs();
      setLeaderToDelete(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to remove core member', 'error');
    } finally {
      setIsDeletingLeader(false);
    }
  };

  const copyCredentialsToClipboard = () => {
    if (!latestCredentials) return;
    const text = `CampusConnect Club Credentials:\nClub: ${latestCredentials.clubName}\nEmail: ${latestCredentials.email}\nPassword: ${latestCredentials.password}\nPortal: ${window.location.origin}/signin`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Credentials copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered clubs
  const filteredClubs = clubs.filter(club => {
    const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalCoreCount = clubs.reduce((acc, c) => acc + (c.coreMembersCount || 0), 0);
  const totalEventsCount = clubs.reduce((acc, c) => acc + (c.eventsCount || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-background-100 selection:bg-gray-1000 selection:text-background-100">
      
      {/* Top Header */}
      <div className="border-b border-gray-400 bg-background-100 px-6 py-5 shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gray-700 mb-1">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-gray-1000 font-semibold">Clubs & AICTE Units</span>
            </div>
            <h1 className="text-heading-24 font-bold text-gray-1000 tracking-tight">
              Club Governance & Provisioning
            </h1>
            <p className="text-xs text-gray-700 mt-1 max-w-2xl">
              Provision student-run clubs, appoint initial Core Committee leadership (awarded 2x AICTE credits automatically), generate official credentials, and oversee event operations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-lg bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Provision New Club</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-6">
        
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-background-200 border border-gray-400 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-700 uppercase">Clubs Active</span>
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-1000 font-mono mt-1">{clubs.length}</div>
            <div className="text-[11px] text-gray-600 mt-1">Official Student Units</div>
          </div>

          <div className="bg-background-200 border border-gray-400 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-700 uppercase">Core Leadership</span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-gray-1000 font-mono mt-1">{totalCoreCount}</div>
            <div className="text-[11px] text-gray-600 mt-1">2x Points &bull; Auto-Present</div>
          </div>

          <div className="bg-background-200 border border-gray-400 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-700 uppercase">Events Logged</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-gray-1000 font-mono mt-1">{totalEventsCount}</div>
            <div className="text-[11px] text-gray-600 mt-1">AICTE Accredited Events</div>
          </div>

          <div className="bg-background-200 border border-gray-400 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-700 uppercase">Points Rule</span>
              <ShieldCheck className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-1000 font-mono mt-1">4h = 1pt</div>
            <div className="text-[11px] text-gray-600 mt-1">Core & WC get 2x Mult</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-background-100 border border-gray-400 p-3 rounded-xl shadow-xs">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-gray-1000 text-background-100 font-semibold shadow-2xs'
                    : 'text-gray-700 hover:text-gray-1000 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            <input
              type="text"
              placeholder="Search club name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-background-200 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 transition-colors"
            />
          </div>
        </div>

        {/* Clubs Directory Table */}
        <div className="rounded-xl border border-gray-400 bg-background-100 overflow-hidden shadow-xs flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-background-200 border-b border-gray-400 text-xs font-mono uppercase text-gray-700">
                <tr>
                  <th className="p-4">Club Organization</th>
                  <th className="p-4">Official Email</th>
                  <th className="p-4">Core Committee Leadership</th>
                  <th className="p-4 text-center">Activities</th>
                  <th className="p-4 text-center">Membership System</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 dark:divide-gray-800 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center">
                      <div className="w-6 h-6 border-2 border-gray-1000 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="font-mono text-gray-600 text-xs">Loading clubs catalog...</p>
                    </td>
                  </tr>
                ) : filteredClubs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-12 text-center text-gray-600 font-mono">
                      No student clubs found. Click "Provision New Club" to create the first organization.
                    </td>
                  </tr>
                ) : (
                  filteredClubs.map((club) => {
                    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(club.name)}&background=3b82f6&color=fff&bold=true`;
                    
                    return (
                      <tr key={club._id} className="hover:bg-background-200/50 transition-colors">
                        {/* Club Identity */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={club.profilePhoto || fallbackAvatar}
                              alt={club.name}
                              onError={(e) => {
                                if (e.currentTarget.src !== fallbackAvatar) {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = fallbackAvatar;
                                }
                              }}
                              className="w-9 h-9 rounded-lg object-cover border border-gray-400 shrink-0 bg-background-200"
                            />
                            <div>
                              <div className="font-semibold text-gray-1000 text-sm">{club.name}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                                  {club.category || 'Technical'}
                                </span>
                                <span className="text-[11px] text-gray-600">
                                  {club.totalMembersCount || 0} members
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Login Email */}
                        <td className="p-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-background-200 text-gray-1000 px-2.5 py-1 rounded-md text-[11px] font-mono border border-gray-400 select-all font-medium">
                              {club.email}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(club.email);
                                showToast('Email copied', 'info');
                              }}
                              className="p-1 hover:bg-gray-200 rounded text-gray-600 hover:text-gray-1000 transition-colors cursor-pointer"
                              title="Copy Email"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Core Committee */}
                        <td className="p-4">
                          {club.coreMembers && club.coreMembers.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setViewCoreClub(club)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition-all cursor-pointer shadow-2xs group"
                                title="Click to view full Core Committee roster"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500 group-hover:scale-110 transition-transform" />
                                <span className="font-semibold">{club.coreMembers.length} Core Leaders</span>
                                <span className="text-[10px] text-amber-700 dark:text-amber-400 bg-background-100/80 dark:bg-black/30 px-1.5 py-0.2 rounded border border-amber-500/20 font-mono ml-0.5">
                                  View Roster &rarr;
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openManageCoreModal(club)}
                                className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                                title="Appoint new core member"
                              >
                                + Appoint
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-500 font-mono italic">No Core Assigned</span>
                              <button
                                type="button"
                                onClick={() => openManageCoreModal(club)}
                                className="px-2 py-0.5 rounded text-[11px] font-mono border border-gray-400 bg-background-200 text-gray-900 hover:bg-gray-300 transition-colors cursor-pointer"
                              >
                                + Appoint Core
                              </button>
                            </div>
                          )}
                        </td>

                        {/* Events Count */}
                        <td className="p-4 text-center">
                          <span className="font-mono text-xs font-bold text-gray-1000 bg-background-200 px-2.5 py-1 rounded-full border border-gray-400">
                            {club.eventsCount || 0} events
                          </span>
                        </td>

                        {/* Membership Toggle */}
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleToggleMembership(club)}
                            className={`px-3 py-1 text-xs font-mono font-medium rounded-md border transition-colors cursor-pointer ${
                              club.hasMembershipSystem 
                                ? 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 hover:bg-green-500/20' 
                                : 'bg-gray-500/10 border-gray-400/50 text-gray-600 hover:bg-gray-500/20'
                            }`}
                            title={`Click to ${club.hasMembershipSystem ? 'disable' : 'enable'} official membership system`}
                          >
                            {club.hasMembershipSystem ? 'Enabled' : 'Disabled'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openManageCoreModal(club)}
                              className="p-1.5 rounded-md border border-gray-400 bg-background-200 text-gray-800 hover:text-gray-1000 hover:bg-gray-300 transition-colors cursor-pointer"
                              title="Manage Core Committee"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openWcRolesModal(club)}
                              className="p-1.5 rounded-md border border-gray-400 bg-background-200 text-gray-800 hover:text-gray-1000 hover:bg-gray-300 transition-colors cursor-pointer"
                              title="Configure WC Roles"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleResetPassword(club)}
                              className="p-1.5 rounded-md border border-gray-400 bg-background-200 text-gray-800 hover:text-gray-1000 hover:bg-gray-300 transition-colors cursor-pointer"
                              title="Reset Password & Issue Credentials"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClub(club)}
                              className="p-1.5 rounded-md border border-red-500/20 bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors cursor-pointer"
                              title="Delete Club"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: PROVISION NEW CLUB */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overscroll-contain">
          <div className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-400 flex justify-between items-center bg-background-200/60">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-blue-500/10 text-blue-700 border border-blue-500/20">
                  Provisioning Wizard
                </span>
                <h2 className="text-heading-20 font-bold text-gray-1000 tracking-tight mt-1">
                  Create Club Organization
                </h2>
                <p className="text-xs text-gray-700 mt-0.5">
                  Set up official email, generate credentials, and designate founding Core Committee leaders.
                </p>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-md hover:bg-gray-200 text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateClubSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-32">
              
              {/* Club Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-1000 mb-1">
                    Club Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Society of India (CSI)"
                    value={newClubName}
                    onChange={handleNameChange}
                    className="w-full px-3 py-2 text-xs bg-background-200 border border-gray-400 rounded-lg text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-1000 mb-1">
                    Category
                  </label>
                  <select
                    value={newClubCategory}
                    onChange={(e) => setNewClubCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-background-200 border border-gray-400 rounded-lg text-gray-1000 focus:outline-none focus:border-gray-900"
                  >
                    {categories.filter(c => c !== 'All').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-1000 mb-1">
                  Brief Description & Objective
                </label>
                <textarea
                  rows="2"
                  placeholder="Official departmental body fostering technical workshops, hackathons, and AICTE accredited student activities..."
                  value={newClubDescription}
                  onChange={(e) => setNewClubDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background-200 border border-gray-400 rounded-lg text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900"
                />
              </div>

              {/* Account Credentials Generator Box */}
              <div className="p-4 rounded-xl border border-gray-400 bg-background-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-1000">
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Official Club Login Credentials</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-gray-700 mb-1">
                      Account Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={newClubEmail}
                      onChange={(e) => setNewClubEmail(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-background-100 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-mono text-gray-700">
                        Generated Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewClubPassword(generateRandomPassword())}
                        className="text-[10px] font-mono text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-2.5 h-2.5" /> Regenerate
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={newClubPassword}
                        onChange={(e) => setNewClubPassword(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono bg-background-100 border border-gray-400 rounded-md text-gray-1000 pr-8 focus:outline-none focus:border-gray-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-1000"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Core Committee Members Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold text-gray-1000">
                      Appoint Core Committee Leadership
                    </label>
                    <p className="text-[11px] text-gray-600">
                      Core members are automatically marked present with 2x AICTE points for all events hosted by this club.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                    {coreMembersList.length} Appointed
                  </span>
                </div>

                {/* Student Live Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input
                    type="text"
                    placeholder="Search student by name, email, or UID..."
                    value={studentSearchQuery}
                    onChange={(e) => setStudentSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-background-200 border border-gray-400 rounded-lg text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900"
                  />
                  {searchingStudents && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  )}

                  {/* Dropdown Results showing Top 5 Students */}
                  {studentSearchQuery.trim().length >= 1 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-background-100 border border-gray-400 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                      {studentSearchResults.length > 0 ? (
                        <div>
                          <div className="px-3 py-1.5 bg-background-200 border-b border-gray-400 text-[10px] font-mono uppercase text-gray-600 flex items-center justify-between">
                            <span>Top {studentSearchResults.length} Matching Students</span>
                            <span>Click to add</span>
                          </div>
                          <div className="divide-y divide-gray-300 dark:divide-gray-800 max-h-60 overflow-y-auto custom-scrollbar">
                            {studentSearchResults.map((s) => (
                              <div
                                key={s._id}
                                onClick={() => addStudentToCoreList(s)}
                                className="p-3 hover:bg-background-200 flex items-center justify-between cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={s.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=3b82f6&color=fff&bold=true`}
                                    alt="avatar"
                                    className="w-7 h-7 rounded-full object-cover border border-gray-400 shrink-0"
                                  />
                                  <div>
                                    <div className="text-xs font-semibold text-gray-1000 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                      <span>{s.name}</span>
                                      <span className="px-1.5 py-0.2 rounded bg-background-200 text-gray-1000 border border-gray-400 text-[10px] font-mono font-medium">
                                        {s.uid}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-gray-600 font-mono mt-0.5">
                                      {s.branch || '—'} &bull; Sem {s.currentSem || '—'} &bull; {s.email}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-medium text-blue-600 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  + Appoint
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : !searchingStudents ? (
                        <div className="p-4 text-center text-xs font-mono text-gray-600">
                          No students found matching "{studentSearchQuery}"
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Assigned Core Members List */}
                {coreMembersList.length > 0 && (
                  <div className="border border-gray-400 rounded-xl overflow-hidden divide-y divide-gray-300 dark:divide-gray-800 bg-background-100">
                    {coreMembersList.map((member) => (
                      <div key={member.studentId} className="p-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-gray-1000 flex items-center gap-1.5">
                            <span>{member.name}</span>
                            <span className="text-[10px] font-mono text-gray-600">({member.uid})</span>
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            {member.branch} &bull; Sem {member.currentSem}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Custom Role Title"
                            value={member.role}
                            onChange={(e) => updateCoreMemberRole(member.studentId, e.target.value)}
                            className="px-2 py-1 text-xs bg-background-200 border border-gray-400 rounded-md text-gray-1000 w-36 font-medium focus:outline-none focus:border-gray-900"
                            title="Position/Title in Core Committee"
                          />
                          <button
                            type="button"
                            onClick={() => removeStudentFromCoreList(member.studentId)}
                            className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              </div>

              {/* Sticky Submit & Cancel Buttons Footer */}
              <div className="p-4 border-t border-gray-400 bg-background-200/90 backdrop-blur-xs flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-400 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
                >
                  Provision Club & Issue Access
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CREDENTIALS SUCCESS DISPLAY & COPY DIALOG */}
      {/* ========================================================================= */}
      {showCredentialsModal && latestCredentials && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-1000">Club Credentials Generated</h3>
                <p className="text-xs text-gray-600">Credentials are ready for Core Committee handoff</p>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="p-4 rounded-xl bg-background-200 border border-gray-400 space-y-2.5 font-mono text-xs">
              <div>
                <span className="text-[10px] text-gray-500 uppercase">Club Organization</span>
                <div className="font-bold text-gray-1000 text-sm font-sans">{latestCredentials.clubName}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">Official Email</span>
                <div className="font-semibold text-gray-1000">{latestCredentials.email}</div>
              </div>
              <div>
                <span className="text-[10px] text-gray-500 uppercase">Login Password</span>
                <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">{latestCredentials.password}</div>
              </div>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-700 dark:text-blue-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Provide these credentials to the appointed student Core Committee. They can sign in at the standard portal to organize events and manage working committees.
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={copyCredentialsToClipboard}
                className="flex-1 py-2.5 rounded-lg bg-gray-1000 text-background-100 text-xs font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Credentials'}</span>
              </button>
              <button
                onClick={() => setShowCredentialsModal(false)}
                className="px-4 py-2.5 rounded-lg border border-gray-400 text-xs font-medium text-gray-800 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: APPOINT / MANAGE CORE COMMITTEE FOR EXISTING CLUB */}
      {/* ========================================================================= */}
      {showCoreModal && selectedClubForCore && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                  Core Committee Appointment
                </span>
                <h3 className="text-base font-bold text-gray-1000 mt-1">{selectedClubForCore.name}</h3>
                <p className="text-xs text-gray-600">Assign a student to the Core Committee (awarded 2x points for events)</p>
              </div>
              <button
                onClick={() => setShowCoreModal(false)}
                className="p-1 text-gray-600 hover:text-gray-1000 rounded hover:bg-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Core members */}
            {selectedClubForCore.coreMembers && selectedClubForCore.coreMembers.length > 0 && (
              <div className="p-3 bg-background-200 rounded-xl border border-gray-400 space-y-2">
                <span className="text-[11px] font-mono uppercase text-gray-600 font-semibold">Active Core Committee</span>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedClubForCore.coreMembers.map((m, idx) => (
                    <div key={idx} className="text-xs flex items-center justify-between text-gray-900">
                      <span className="font-medium">{m.student?.name || 'Member'} ({m.student?.uid || '—'})</span>
                      <span className="font-mono text-[10px] bg-background-100 text-gray-1000 px-2 py-0.5 rounded border border-gray-400 font-medium">
                        {m.role || 'Core Member'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Search */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-1000">
                Select Student <span className="text-red-500">*</span>
              </label>

              {coreModalSelectedStudent ? (
                /* Selected Student Card */
                <div className="p-3 bg-background-200 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
                  <div className="flex items-center gap-3">
                    <img 
                      src={coreModalSelectedStudent.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(coreModalSelectedStudent.name)}&background=10b981&color=fff&bold=true`}
                      alt="avatar"
                      className="w-8 h-8 rounded-full object-cover border border-gray-400 shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-gray-1000 flex items-center gap-1.5">
                        <span>{coreModalSelectedStudent.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-background-100 text-gray-1000 border border-gray-400 text-[10px] font-mono font-medium">
                          {coreModalSelectedStudent.uid}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-gray-600">
                        {coreModalSelectedStudent.branch || '—'} &bull; Sem {coreModalSelectedStudent.currentSem || '—'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCoreModalSelectedStudent(null);
                      setCoreModalSearchQuery('');
                      setCoreModalSearchResults([]);
                    }}
                    className="p-1.5 text-gray-600 hover:text-gray-1000 hover:bg-gray-300 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
                    title="Change Student"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Live Search Input with Dropdown */
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search student by name, UID, or email (e.g. 23-COMPA10-27)..."
                    value={coreModalSearchQuery}
                    onChange={(e) => setCoreModalSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-8 py-2 text-xs bg-background-200 border border-gray-400 rounded-lg text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900"
                    autoFocus
                  />
                  {coreModalSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                  )}

                  {/* Dropdown Results showing Top 5 Students */}
                  {coreModalSearchQuery.trim().length >= 1 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-background-100 border border-gray-400 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                      {coreModalSearchResults.length > 0 ? (
                        <div>
                          <div className="px-3 py-1.5 bg-background-200 border-b border-gray-400 text-[10px] font-mono uppercase text-gray-600 flex items-center justify-between">
                            <span>Top {coreModalSearchResults.length} Matching Students</span>
                            <span>Click to select</span>
                          </div>
                          <div className="divide-y divide-gray-300 dark:divide-gray-800 max-h-60 overflow-y-auto custom-scrollbar">
                            {coreModalSearchResults.map((s) => (
                              <div
                                key={s._id}
                                onClick={() => {
                                  setCoreModalSelectedStudent(s);
                                  setCoreModalSearchQuery(`${s.name} (${s.uid})`);
                                  setCoreModalSearchResults([]);
                                }}
                                className="p-3 hover:bg-background-200 flex items-center justify-between cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-2.5">
                                  <img
                                    src={s.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=3b82f6&color=fff&bold=true`}
                                    alt="avatar"
                                    className="w-7 h-7 rounded-full object-cover border border-gray-400 shrink-0"
                                  />
                                  <div>
                                    <div className="text-xs font-semibold text-gray-1000 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                      <span>{s.name}</span>
                                      <span className="px-1.5 py-0.2 rounded bg-background-200 text-gray-1000 border border-gray-400 text-[10px] font-mono font-medium">
                                        {s.uid}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-gray-600 font-mono mt-0.5">
                                      {s.branch || '—'} &bull; Sem {s.currentSem || '—'} &bull; {s.email}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-xs font-mono font-medium text-blue-600 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                  Select
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : !coreModalSearching ? (
                        <div className="p-4 text-center text-xs font-mono text-gray-600">
                          No students found matching "{coreModalSearchQuery}"
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Custom Role */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-gray-1000">Designation / Role Title</label>
              <input
                type="text"
                value={addCoreRole}
                onChange={(e) => setAddCoreRole(e.target.value)}
                placeholder="e.g. Creative Head, Vice President, General Secretary"
                className="w-full px-3 py-1.5 text-xs bg-background-200 border border-gray-400 rounded-lg text-gray-1000 focus:outline-none focus:border-gray-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCoreModal(false)}
                className="h-8 px-3.5 rounded-md border border-gray-400 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCoreSubmit}
                className="h-8 px-3.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer shadow-2xs"
              >
                Appoint Core Member
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: VIEW CORE COMMITTEE ROSTER MODAL */}
      {/* ========================================================================= */}
      {viewCoreClub && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[140] flex items-center justify-center p-4 overscroll-contain"
          onClick={() => setViewCoreClub(null)}
        >
          <div 
            className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col text-gray-1000 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-400 bg-background-200 shrink-0 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {(() => {
                  const fallbackClubAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewCoreClub.name)}&background=3b82f6&color=fff&bold=true`;
                  return (
                    <img 
                      src={viewCoreClub.profilePhoto || fallbackClubAvatar} 
                      alt={viewCoreClub.name}
                      onError={(e) => {
                        if (e.currentTarget.src !== fallbackClubAvatar) {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = fallbackClubAvatar;
                        }
                      }}
                      className="w-11 h-11 rounded-xl object-cover border border-gray-400 shrink-0 bg-background-100 shadow-2xs"
                    />
                  );
                })()}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                      Core Leadership Roster
                    </span>
                    <span className="text-[10px] font-mono text-gray-600 bg-background-100 px-1.5 py-0.5 rounded border border-gray-400">
                      {viewCoreClub.category || 'Organization'}
                    </span>
                  </div>
                  <h3 className="text-heading-18 font-bold text-gray-1000 tracking-tight mt-1">
                    {viewCoreClub.name}
                  </h3>
                  <p className="text-xs text-gray-600 font-sans mt-0.5">
                    {viewCoreClub.coreMembers?.length || 0} appointed Core Committee leadership members.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setViewCoreClub(null)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-200 rounded-md text-gray-600 hover:text-gray-1000 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-3.5 flex-1 max-h-[55vh] custom-scrollbar">
              {viewCoreClub.coreMembers && viewCoreClub.coreMembers.length > 0 ? (
                viewCoreClub.coreMembers.map((member, idx) => {
                  const student = member.student;
                  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'Student')}&background=6366f1&color=fff&bold=true`;
                  const avatarUrl = student?.avatarUrl || fallbackAvatar;

                  return (
                    <div 
                      key={idx}
                      className="rounded-xl border border-gray-400 bg-background-200/50 hover:bg-background-200 hover:border-gray-500 transition-all p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                    >
                      {/* Student Profile Identity */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img 
                          src={avatarUrl}
                          alt={student?.name || 'Student'}
                          onError={(e) => {
                            if (e.currentTarget.src !== fallbackAvatar) {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = fallbackAvatar;
                            }
                          }}
                          className="w-10 h-10 rounded-full object-cover border border-gray-400 shrink-0 bg-background-100"
                        />
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-gray-1000 truncate">
                              {student?.name || 'Unknown Student'}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-background-100 border border-gray-400 text-[11px] font-mono text-gray-1000 font-semibold shrink-0">
                              {student?.uid || '—'}
                            </span>
                          </div>
                          
                          <div className="text-[11px] font-mono text-gray-600">
                            {student?.branch ? `${student.branch} · Sem ${student.currentSem || '—'}` : 'Student Member'}
                          </div>
                          
                          {student?.email && (
                            <div className="text-[11px] font-mono text-gray-700 flex items-center gap-1 truncate">
                              <span>{student.email}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Role & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 shadow-2xs">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{member.role || 'Core Member'}</span>
                        </span>

                        <button
                          type="button"
                          onClick={() => handleInitiateRemoveCoreMember(viewCoreClub._id, student, viewCoreClub.name, member.role)}
                          className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Remove from Core Committee"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center border border-dashed border-gray-400 rounded-xl space-y-2">
                  <Users className="w-8 h-8 text-gray-500 mx-auto" strokeWidth={1.5} />
                  <p className="text-sm font-semibold text-gray-1000">No Core Committee Assigned</p>
                  <p className="text-xs text-gray-600 max-w-sm mx-auto">
                    There are currently no students appointed to the leadership roster for this club organization.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-background-200 border-t border-gray-400 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] font-mono text-gray-600 hidden sm:inline-block">
                All Core Committee appointments synchronize with student profiles
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setViewCoreClub(null)}
                  className="h-8 px-3.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const c = viewCoreClub;
                    setViewCoreClub(null);
                    openManageCoreModal(c);
                  }}
                  className="h-8 px-3.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Appoint Leader</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CONFIRM DELETE LEADER CUSTOM MODAL */}
      {/* ========================================================================= */}
      {leaderToDelete && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[160] flex items-center justify-center p-4 overscroll-contain animate-in fade-in duration-150"
          onClick={() => !isDeletingLeader && setLeaderToDelete(null)}
        >
          <div 
            className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-gray-1000 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header / Body */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-1000 tracking-tight">
                    Remove Leadership Appointment
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Are you sure you want to remove <strong className="text-gray-1000 font-semibold">{leaderToDelete.studentName}</strong> from the Core Committee of <strong className="text-gray-1000 font-semibold">{leaderToDelete.clubName}</strong>?
                  </p>
                </div>
              </div>

              {/* Student Summary Card */}
              <div className="p-3 rounded-xl bg-background-200 border border-gray-400 flex items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-semibold text-gray-1000">{leaderToDelete.studentName}</div>
                  {leaderToDelete.studentUid && (
                    <div className="font-mono text-[10px] text-gray-600">{leaderToDelete.studentUid}</div>
                  )}
                </div>
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  {leaderToDelete.role}
                </span>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                This will revoke this student's leadership role on the club's roster and synchronize with their portfolio.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="p-3.5 px-6 bg-background-200/80 border-t border-gray-400 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                disabled={isDeletingLeader}
                onClick={() => setLeaderToDelete(null)}
                className="h-8 px-3.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingLeader}
                onClick={handleConfirmRemoveCoreMember}
                className="h-8 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingLeader ? (
                  <span>Removing...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Leader</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: RESET CLUB PASSWORD */}
      {/* ========================================================================= */}
      {showResetModal && clubToReset && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[160] flex items-center justify-center p-4 overscroll-contain animate-in fade-in duration-150"
          onClick={() => !isResetting && setShowResetModal(false)}
        >
          <div 
            className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-gray-1000 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-600 shrink-0">
                  <Key className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-1000 tracking-tight">
                    Reset Login Password
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Are you sure you want to reset the login password for <strong className="text-gray-1000 font-semibold">{clubToReset.name}</strong>?
                  </p>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  This action will invalidate the current password immediately. You will be provided with a new set of credentials to distribute to the Core Committee.
                </span>
              </div>
            </div>
            <div className="p-3.5 px-6 bg-background-200/80 border-t border-gray-400 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetModal(false)}
                className="h-8 px-3.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={executeResetPassword}
                className="h-8 px-4 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {isResetting ? (
                  <span>Resetting...</span>
                ) : (
                  <>
                    <Key className="w-3.5 h-3.5" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: DELETE CLUB */}
      {/* ========================================================================= */}
      {showDeleteModal && clubToDelete && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-[160] flex items-center justify-center p-4 overscroll-contain animate-in fade-in duration-150"
          onClick={() => !isDeletingClub && setShowDeleteModal(false)}
        >
          <div 
            className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-gray-1000 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-600 shrink-0">
                  <Trash2 className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-gray-1000 tracking-tight">
                    Delete Organization
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    This action is permanent and cannot be undone. All events, points, and records associated with <strong className="text-gray-1000 font-semibold">{clubToDelete.name}</strong> will be lost.
                  </p>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <label className="block text-xs font-semibold text-gray-1000">
                  Type "{clubToDelete.name}" to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background-200 border border-gray-400 rounded-lg text-gray-1000 focus:outline-none focus:border-red-500"
                  placeholder={clubToDelete.name}
                  autoFocus
                />
              </div>
            </div>
            <div className="p-3.5 px-6 bg-background-200/80 border-t border-gray-400 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                disabled={isDeletingClub}
                onClick={() => setShowDeleteModal(false)}
                className="h-8 px-3.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-800 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingClub || deleteConfirmationText !== clubToDelete.name}
                onClick={executeDeleteClub}
                className="h-8 px-4 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingClub ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Club</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WC Roles Configuration Modal */}
      {showWcRolesModal && clubForWcRoles && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-1000/60 backdrop-blur-sm">
          <div className="bg-background-100 rounded-xl w-full max-w-md border border-gray-400 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-400 bg-background-200 shrink-0">
              <div>
                <h3 className="text-heading-18 font-bold text-gray-1000">Configure WC Roles</h3>
                <p className="text-xs text-gray-700 mt-0.5">{clubForWcRoles.name}</p>
              </div>
              <button 
                onClick={() => setShowWcRolesModal(false)} 
                className="p-2 rounded-full hover:bg-gray-300 transition-colors text-gray-600 hover:text-gray-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              <form onSubmit={handleAddWcRole}>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1.5 font-semibold">
                  Add New WC Role
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={wcRolesInput}
                    onChange={(e) => setWcRolesInput(e.target.value)}
                    placeholder="e.g. Technical Head"
                    className="flex-1 px-3 py-2 text-sm bg-background-200 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!wcRolesInput.trim()}
                    className="px-4 py-2 bg-gray-1000 text-background-100 text-sm font-medium rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>
              </form>

              <div className="mt-6">
                <label className="block text-xs font-mono uppercase text-gray-700 mb-2 font-semibold">
                  Configured Roles
                </label>
                {wcRolesList.length === 0 ? (
                  <p className="text-sm text-gray-600 italic p-4 bg-background-200 border border-gray-400 rounded-lg text-center">
                    No WC roles configured. Club admins will not be able to assign Working Committee members.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {wcRolesList.map((role) => (
                      <div key={role} className="flex items-center gap-1.5 px-3 py-1.5 bg-background-200 border border-gray-400 rounded-full text-sm text-gray-1000">
                        <span>{role}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveWcRole(role)}
                          className="p-0.5 rounded-full hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
                          title="Remove Role"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 sm:p-6 border-t border-gray-400 bg-background-200 shrink-0 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowWcRolesModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateWcRoles}
                disabled={isUpdatingWcRoles}
                className="px-4 py-2 rounded-md bg-gray-1000 text-background-100 text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer disabled:opacity-70"
              >
                {isUpdatingWcRoles ? (
                  <>
                    <div className="w-4 h-4 border-2 border-background-100 border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  'Save Configuration'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
