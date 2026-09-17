import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Users,
  Calendar,
  Megaphone,
  SlidersHorizontal,
  Plus,
  Trash2,
  Camera,
  X,
  ExternalLink,
  ShieldCheck,
  Mail,
  MapPin,
  Clock,
  QrCode,
  Search,
  Check,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  UserPlus,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { FaInstagram, FaFacebookF, FaLinkedinIn } from 'react-icons/fa';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import EventAttendees from '../components/EventAttendees';
import ImageCropperModal from '../components/ImageCropperModal';
import { getEventStatus, formatTime12h } from '../utils/eventUtils';

export default function ClubDashboard() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'members' | 'events' | 'announcements'
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab Data States
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropData, setCropData] = useState(null);

  // Modal Visibility States
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);

  // Form States
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    profilePhoto: '',
    bannerPhoto: '',
    socials: { instagram: '', facebook: '', linkedin: '' }
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Member Management State
  const [newMemberUid, setNewMemberUid] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Member');
  const [newMemberTier, setNewMemberTier] = useState('Member');
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState('all');

  // Event Management State
  const [newEvent, setNewEvent] = useState({ 
    title: '', 
    date: '', 
    time: '', 
    registrationDeadline: '',
    venue: '', 
    description: '', 
    posterImage: '',
    durationHours: 2,
    aicteCategory: 5,
    activitySummary: ''
  });
  const [editingEventId, setEditingEventId] = useState(null);
  const [eventFilter, setEventFilter] = useState('all'); // 'all' | 'upcoming' | 'completed'

  // Announcement State
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });

  const fetchClubData = async () => {
    try {
      const [profileRes, eventsRes, announcementsRes] = await Promise.all([
        axios.get('/clubs/profile'),
        axios.get('/events/club'),
        axios.get('/clubs/announcements')
      ]);
      setClub(profileRes.data);
      setProfileForm({
        name: profileRes.data.name || '',
        description: profileRes.data.description || '',
        profilePhoto: profileRes.data.profilePhoto || '',
        bannerPhoto: profileRes.data.bannerPhoto || '',
        socials: profileRes.data.socials || { instagram: '', facebook: '', linkedin: '' }
      });
      setEvents(eventsRes.data || []);
      setAnnouncements(announcementsRes.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load club dossier', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, [showToast]);

  // Live student search for member assignment
  useEffect(() => {
    if (newMemberUid.trim().length >= 2) {
      const delayFn = setTimeout(async () => {
        try {
          const res = await axios.get(`/clubs/search-students?q=${newMemberUid.trim()}`);
          setSearchSuggestions(res.data);
          setShowDropdown(true);
        } catch (e) {
          console.error(e);
        }
      }, 300);
      return () => clearTimeout(delayFn);
    } else {
      setSearchSuggestions([]);
      setShowDropdown(false);
    }
  }, [newMemberUid]);

  // Modal active detection & background scroll lock
  const isAnyModalOpen = Boolean(
    selectedEventId ||
    showAddMemberModal ||
    showCreateEventModal ||
    showCreateAnnouncementModal ||
    cropData ||
    memberToRemove
  );

  useEffect(() => {
    if (isAnyModalOpen) {
      const savedScrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
        window.scrollTo(0, savedScrollY);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isAnyModalOpen]);

  // Ensure body scroll is always restored on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleImageSelect = (e, formType, fieldName, aspectRatio = null) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setCropData({ src: reader.result?.toString(), formType, fieldName, aspectRatio });
    });
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleImageCropComplete = async (croppedBlob) => {
    const { formType, fieldName } = cropData;
    setCropData(null);
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('image', croppedBlob);

    try {
      const res = await axios.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (formType === 'profile') {
        setProfileForm(prev => ({ ...prev, [fieldName]: res.data.url }));
      } else if (formType === 'event') {
        setNewEvent(prev => ({ ...prev, [fieldName]: res.data.url }));
      }
      showToast('Media uploaded successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload media asset', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const res = await axios.put('/clubs/profile', profileForm);
      setClub(res.data.club);
      showToast('Club identity and settings updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update profile settings', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleRoleChange = (roleVal) => {
    setNewMemberRole(roleVal);
    if (/core|lead|president|head|chairperson|secretary|treasurer|director|convenor|executive/i.test(roleVal)) {
      setNewMemberTier('Core');
    } else if (/wc|working committee|associate|coordinator/i.test(roleVal)) {
      setNewMemberTier('WC');
    } else {
      setNewMemberTier('Member');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberUid.trim()) return;
    try {
      const res = await axios.post('/clubs/members', { 
        uid: newMemberUid.trim().toUpperCase(),
        role: newMemberRole,
        tier: newMemberTier
      });
      // Update local assigned students
      if (res.data.assignedStudents) {
        setClub({ ...club, assignedStudents: res.data.assignedStudents });
      } else {
        await fetchClubData();
      }
      setNewMemberUid('');
      setNewMemberRole('Member');
      setNewMemberTier('Member');
      setShowDropdown(false);
      setShowAddMemberModal(false);
      showToast('Team member added successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add team member', 'error');
    }
  };

  const handleRemoveMember = (studentId) => {
    setMemberToRemove(studentId);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await axios.delete(`/clubs/members/${memberToRemove}`);
      setClub({ ...club, assignedStudents: club.assignedStudents.filter(m => m.studentId?._id !== memberToRemove) });
      showToast('Member removed from club roster', 'success');
    } catch (err) {
      showToast('Failed to remove member', 'error');
    } finally {
      setMemberToRemove(null);
    }
  };

  const openCreateEventModal = () => {
    setEditingEventId(null);
    setNewEvent({ 
      title: '', date: '', time: '', registrationDeadline: '', venue: '', description: '', posterImage: '', durationHours: 2, aicteCategory: 5, activitySummary: ''
    });
    setShowCreateEventModal(true);
  };

  const openEditEventModal = (ev) => {
    setEditingEventId(ev._id);
    setNewEvent({
      title: ev.title || '',
      date: ev.date ? new Date(ev.date).toISOString().split('T')[0] : '',
      time: ev.time || '',
      registrationDeadline: ev.registrationDeadline ? new Date(ev.registrationDeadline).toISOString().slice(0,16) : '',
      venue: ev.venue || '',
      description: ev.description || '',
      posterImage: ev.posterImage || '',
      durationHours: ev.durationHours || 2,
      aicteCategory: ev.aicteCategory || 5,
      activitySummary: ev.activitySummary || ''
    });
    setShowCreateEventModal(true);
  };

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    try {
      if (editingEventId) {
        const res = await axios.put(`/events/${editingEventId}`, newEvent);
        setEvents(events.map(ev => ev._id === editingEventId ? res.data.event : ev));
        showToast('Event updated successfully', 'success');
      } else {
        const res = await axios.post('/events', newEvent);
        setEvents([res.data.event, ...events]);
        showToast('Event created and published with AICTE points', 'success');
      }
      
      setNewEvent({ 
        title: '', date: '', time: '', registrationDeadline: '', venue: '', description: '', posterImage: '', durationHours: 2, aicteCategory: 5, activitySummary: ''
      });
      setEditingEventId(null);
      setShowCreateEventModal(false);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save event', 'error');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/clubs/announcements', newAnnouncement);
      setAnnouncements([res.data.announcement, ...announcements]);
      setNewAnnouncement({ title: '', content: '' });
      setShowCreateAnnouncementModal(false);
      showToast('Announcement broadcasted to campus network', 'success');
    } catch (err) {
      showToast('Failed to post announcement', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <div className="w-9 h-9 border-2 border-gray-1000 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono text-gray-700">Connecting to Club Administration...</p>
      </div>
    );
  }

  // Filtered members calculation
  const assignedMembers = club?.assignedStudents || [];
  const filteredMembers = assignedMembers.filter(m => {
    const name = m.studentId?.name || '';
    const uid = m.studentId?.uid || '';
    const query = memberSearchQuery.toLowerCase();
    const matchesSearch = name.toLowerCase().includes(query) || uid.toLowerCase().includes(query);
    const matchesRole = memberRoleFilter === 'all' || m.role?.toLowerCase() === memberRoleFilter.toLowerCase();
    return matchesSearch && matchesRole;
  });

  // Filtered events calculation
  const filteredEvents = events.filter(ev => {
    if (eventFilter === 'all') return true;
    const status = getEventStatus(ev);
    if (eventFilter === 'upcoming') {
      return status === 'UPCOMING' || status === 'ONGOING';
    }
    if (eventFilter === 'completed') {
      return status === 'COMPLETED';
    }
    return true;
  });

  // Aggregate event attendees
  const totalRegisteredAttendees = events.reduce((sum, ev) => sum + (ev.registeredStudents?.length || 0), 0);


  return (
    <>
    <div className="flex-1 min-w-0 bg-background-100">

        {/* ===================================================================
            1. CLUB COVER BANNER & BRANDING HEADER
            =================================================================== */}
        <div className="relative h-48 sm:h-60 w-full overflow-hidden bg-background-200 border-b border-gray-400">
          {club.bannerPhoto ? (
            <img 
              src={club.bannerPhoto} 
              alt="Club Cover Banner" 
              className="w-full h-full object-cover object-center" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-950 flex items-center justify-center opacity-90">
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              <span className="text-xs font-mono uppercase tracking-widest text-gray-400">
                Official Club Header Canvas
              </span>
            </div>
          )}

          {/* Floating 'Change Cover' Button */}
          <label 
            className="absolute bottom-4 right-4 sm:right-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-background-100/90 hover:bg-background-100 backdrop-blur-md border border-gray-400 text-xs font-medium text-gray-1000 shadow-sm cursor-pointer transition-all hover:border-gray-500"
            title="Upload custom club cover photo"
          >
            <Camera className="w-3.5 h-3.5 text-gray-700" />
            <span>Update Cover</span>
            <input 
              type="file" 
              accept="image/*" 
              disabled={uploadingImage} 
              className="hidden" 
              onChange={e => handleImageSelect(e, 'profile', 'bannerPhoto', 4)} 
            />
          </label>
        </div>

        {/* ===================================================================
            2. CLUB IDENTITY PROFILE & QUICK STAT METRICS STRIP
            =================================================================== */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-16">
          
          {/* Identity Row */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-8 relative z-10">
            
            {/* Avatar & Title Info */}
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <div className="relative group w-28 h-28 sm:w-36 sm:h-36 -mt-14 sm:-mt-18 rounded-2xl bg-background-100 border-4 border-background-100 shadow-xl overflow-hidden shrink-0">
                {club.profilePhoto ? (
                  <img 
                    src={club.profilePhoto} 
                    alt={club.name} 
                    className="w-full h-full object-cover object-center" 
                  />
                ) : (
                  <div className="w-full h-full bg-background-200 flex items-center justify-center text-gray-600 font-bold text-3xl">
                    {club.name?.charAt(0) || 'C'}
                  </div>
                )}

                {/* Avatar change overlay on hover */}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-xs">
                  <Camera className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-medium font-mono uppercase tracking-wider">Change</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    disabled={uploadingImage} 
                    className="hidden" 
                    onChange={e => handleImageSelect(e, 'profile', 'profilePhoto', 1)} 
                  />
                </label>
              </div>

              <div className="pt-2 sm:pt-3">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Verified University Organization</span>
                  </span>
                  <span className="text-xs font-mono text-gray-600">
                    ID: {club._id.slice(-6)}
                  </span>
                </div>
                
                <h1 className="text-heading-28 sm:text-heading-36 font-bold text-gray-1000 tracking-tight">
                  {club.name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700 font-mono mt-1.5">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-600" />
                    <span>{club.email}</span>
                  </span>
                  <span>&bull;</span>
                  <span>Delhi Technological University</span>
                </div>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex items-center gap-3 pt-2 sm:pt-3 self-start sm:self-auto">
              <Link
                to={`/clubs/${club._id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border border-gray-400 bg-background-100 text-gray-1000 text-xs font-medium hover:bg-gray-200 transition-colors shadow-xs"
              >
                <span>View Public Profile</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-600" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-gray-400 border border-gray-400 rounded-xl overflow-hidden mb-8 shadow-xs">
            <div className="bg-background-100 p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs font-mono text-gray-700 uppercase mb-1">
                <span>Core Members</span>
                <Users className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-gray-1000 tracking-tight">
                {assignedMembers.length}
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">Assigned to team roster</p>
            </div>

            <div className="bg-background-100 p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs font-mono text-gray-700 uppercase mb-1">
                <span>Events Hosted</span>
                <Calendar className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-gray-1000 tracking-tight">
                {events.length}
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">Published workshops &amp; drives</p>
            </div>

            <div className="bg-background-100 p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs font-mono text-gray-700 uppercase mb-1">
                <span>Total Reach</span>
                <TrendingUp className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-teal-700 tracking-tight">
                {totalRegisteredAttendees}
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">Cumulative student RSVPs</p>
            </div>

            <div className="bg-background-100 p-4 sm:p-5">
              <div className="flex items-center justify-between text-xs font-mono text-gray-700 uppercase mb-1">
                <span>Announcements</span>
                <Megaphone className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <div className="text-2xl font-bold font-mono text-gray-1000 tracking-tight">
                {announcements.length}
              </div>
              <p className="text-[11px] text-gray-600 mt-0.5">Broadcasted to students</p>
            </div>
          </div>

          {/* ===================================================================
              3. SEGMENTED NAVIGATION TABS
              =================================================================== */}
          <div className="border-b border-gray-400 mb-8 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-1 sm:gap-2">
              {[
                { id: 'profile', icon: SlidersHorizontal, label: 'Overview & Settings' },
                { id: 'members', icon: Users, label: 'Members & Roster', count: assignedMembers.length },
                { id: 'events', icon: Calendar, label: 'Events & Registration', count: events.length },
                { id: 'announcements', icon: Megaphone, label: 'Announcements', count: announcements.length }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-4 py-3 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'border-gray-1000 text-gray-1000 font-semibold'
                        : 'border-transparent text-gray-700 hover:text-gray-1000 hover:border-gray-400'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-gray-1000' : 'text-gray-600'}`} strokeWidth={1.5} />
                    <span>{tab.label}</span>
                    {tab.count !== undefined && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                        isActive 
                          ? 'bg-gray-1000 text-background-100 font-bold' 
                          : 'bg-background-200 text-gray-700 border border-gray-400'
                      }`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===================================================================
              TAB 1: OVERVIEW & SETTINGS
              =================================================================== */}
          {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-200">
              {/* Left 2 Columns: Identity & Description & Socials */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Form Card */}
                <div className="rounded-xl border border-gray-400 bg-background-100 p-6 sm:p-8 shadow-xs">
                  <div className="mb-6">
                    <h2 className="text-heading-18 font-bold text-gray-1000 tracking-tight">General Organization Details</h2>
                    <p className="text-xs text-gray-700 mt-1">Configure your organization's official public profile across Campus Connect.</p>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-5">
                    <div>
                      <label className="block text-xs font-mono uppercase text-gray-700 mb-1.5 font-semibold">
                        Club Organization Name
                      </label>
                      <input 
                        required 
                        className="w-full px-3.5 py-2 text-sm bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors font-sans"
                        value={profileForm.name} 
                        onChange={e => setProfileForm({...profileForm, name: e.target.value})} 
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-mono uppercase text-gray-700 font-semibold">
                          About &amp; Mission Statement
                        </label>
                        <span className="text-[10px] font-mono text-gray-600">
                          {profileForm.description?.length || 0} characters
                        </span>
                      </div>
                      <textarea 
                        rows="5" 
                        placeholder="Detail your club's objectives, annual flagships, and community mission..."
                        className="w-full px-3.5 py-2 text-sm bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors font-sans leading-relaxed"
                        value={profileForm.description} 
                        onChange={e => setProfileForm({...profileForm, description: e.target.value})} 
                      />
                    </div>

                    {/* Social Handles Section */}
                    <div className="pt-4 border-t border-gray-400">
                      <h3 className="text-xs font-mono uppercase text-gray-700 mb-3 font-semibold">
                        Public Social Media &amp; Community Channels
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Instagram URL</label>
                          <div className="relative">
                            <FaInstagram className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-pink-600 pointer-events-none" />
                            <input 
                              type="url" 
                              placeholder="https://instagram.com/yourclub" 
                              className="w-full pl-9 pr-3.5 py-2 text-xs bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors font-mono" 
                              value={profileForm.socials.instagram} 
                              onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, instagram: e.target.value}})} 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 mb-1">LinkedIn URL</label>
                          <div className="relative">
                            <FaLinkedinIn className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-600 pointer-events-none" />
                            <input 
                              type="url" 
                              placeholder="https://linkedin.com/company/yourclub" 
                              className="w-full pl-9 pr-3.5 py-2 text-xs bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors font-mono" 
                              value={profileForm.socials.linkedin} 
                              onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, linkedin: e.target.value}})} 
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-700 mb-1">Facebook URL</label>
                          <div className="relative">
                            <FaFacebookF className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-700 pointer-events-none" />
                            <input 
                              type="url" 
                              placeholder="https://facebook.com/yourclub" 
                              className="w-full pl-9 pr-3.5 py-2 text-xs bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors font-mono" 
                              value={profileForm.socials.facebook} 
                              onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, facebook: e.target.value}})} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={isUpdatingProfile || uploadingImage} 
                        className="btn-shimmer-effect inline-flex items-center justify-center gap-2 h-10 px-6 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-xs"
                      >
                        {isUpdatingProfile ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-background-100 border-t-transparent rounded-full animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 text-teal-400" />
                            <span>Save Profile Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right Column: Visual Assets Preview Cards */}
              <div className="space-y-6">
                
                {/* Visual Assets Card */}
                <div className="rounded-xl border border-gray-400 bg-background-100 p-6 shadow-xs space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-1000">Branding &amp; Assets</h3>
                    <p className="text-xs text-gray-700 mt-0.5">Direct image asset previews for official university representation.</p>
                  </div>

                  {/* Profile Avatar Spec */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono uppercase text-gray-700 font-semibold flex justify-between">
                      <span>Square Avatar Icon</span>
                      <span className="text-gray-600 font-normal">1:1 Ratio</span>
                    </div>
                    <div className="flex items-center gap-4 p-3 rounded-lg border border-gray-400 bg-background-200">
                      {profileForm.profilePhoto ? (
                        <img src={profileForm.profilePhoto} alt="Preview" className="w-14 h-14 rounded-xl object-cover border border-gray-400" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gray-300 dark:bg-gray-800 flex items-center justify-center text-gray-600 font-bold">
                          {profileForm.name?.charAt(0) || 'C'}
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer shadow-2xs">
                          <UploadCloud className="w-3.5 h-3.5 text-gray-700" />
                          <span>Upload Image</span>
                          <input type="file" accept="image/*" disabled={uploadingImage} className="hidden" onChange={e => handleImageSelect(e, 'profile', 'profilePhoto', 1)} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Banner Spec */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono uppercase text-gray-700 font-semibold flex justify-between">
                      <span>Cover Banner Asset</span>
                      <span className="text-gray-600 font-normal">4:1 Ratio</span>
                    </div>
                    <div className="rounded-lg border border-gray-400 overflow-hidden bg-background-200">
                      {profileForm.bannerPhoto ? (
                        <img src={profileForm.bannerPhoto} alt="Cover Preview" className="w-full h-20 object-cover" />
                      ) : (
                        <div className="w-full h-20 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-center text-gray-500 text-xs font-mono">
                          No Banner Uploaded
                        </div>
                      )}
                      <div className="p-2.5 bg-background-100 border-t border-gray-400 flex justify-end">
                        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer shadow-2xs">
                          <UploadCloud className="w-3.5 h-3.5 text-gray-700" />
                          <span>Upload Banner</span>
                          <input type="file" accept="image/*" disabled={uploadingImage} className="hidden" onChange={e => handleImageSelect(e, 'profile', 'bannerPhoto', 4)} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Box */}
                <div className="rounded-xl border border-gray-400 bg-background-200 p-5 text-xs font-mono space-y-2">
                  <div className="flex items-center gap-2 text-teal-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cryptographic Org Ledger</span>
                  </div>
                  <p className="text-gray-700 font-sans leading-relaxed">
                    All administrative actions, event attendee verifications, and student roster changes are logged to the university audit trail.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 2: MEMBERS & ROSTER MANAGEMENT
              =================================================================== */}
          {activeTab === 'members' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header & Controls Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-heading-20 font-bold text-gray-1000 tracking-tight">Organization Roster</h2>
                  <p className="text-xs text-gray-700 mt-0.5">Manage executive officers, technical leads, and core members assigned to this club.</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Search input */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder="Filter by name or UID..." 
                      value={memberSearchQuery}
                      onChange={e => setMemberSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-background-200 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors"
                    />
                  </div>

                  {/* Role filter */}
                  <select
                    value={memberRoleFilter}
                    onChange={e => setMemberRoleFilter(e.target.value)}
                    className="h-8 px-2.5 rounded-md border border-gray-400 bg-background-200 text-xs font-mono text-gray-1000 focus:outline-none focus:border-gray-900 cursor-pointer"
                  >
                    <option value="all">All Roles</option>
                    <option value="Lead">Leads &amp; Heads</option>
                    <option value="Core Member">Core Members</option>
                    <option value="Member">General Members</option>
                  </select>

                  <button 
                    onClick={() => setShowAddMemberModal(true)} 
                    className="h-8 px-3.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>
              </div>

              {/* Members Table */}
              <div className="rounded-xl border border-gray-400 bg-background-100 overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-background-200 border-b border-gray-400 text-xs font-mono uppercase text-gray-700">
                    <tr>
                      <th className="p-3.5">Student Member</th>
                      <th className="p-3.5">University UID</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Assigned Role</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300 dark:divide-gray-800 text-xs">
                    {filteredMembers.map((member, i) => {
                      const student = member.studentId;
                      const role = member.role || 'Member';
                      const isLead = role.toLowerCase().includes('lead') || role.toLowerCase().includes('head') || role.toLowerCase().includes('president');
                      const isCore = role.toLowerCase().includes('core');

                      return (
                        <tr key={i} className="hover:bg-background-200/50 transition-colors">
                          <td className="p-3.5 font-medium text-gray-1000 flex items-center gap-3">
                            {(() => {
                              const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(student?.name || 'Student')}&background=6366f1&color=fff&bold=true`;
                              const avatarSrc = student?.avatarUrl || student?.profilePhoto || student?.avatar || fallbackAvatar;
                              return (
                                <img 
                                  src={avatarSrc} 
                                  alt={student?.name || 'Member Avatar'} 
                                  onError={(e) => {
                                    if (e.currentTarget.src !== fallbackAvatar) {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = fallbackAvatar;
                                    }
                                  }}
                                  className="w-8 h-8 rounded-full object-cover border border-gray-400 shrink-0 bg-background-200" 
                                />
                              );
                            })()}
                            <div>
                              <div className="font-semibold text-gray-1000">{student?.name || 'Unknown Student'}</div>
                              <div className="text-[11px] text-gray-600 font-normal">{student?.email || ''}</div>
                            </div>
                          </td>
                          <td className="p-3.5 text-gray-900 font-mono">
                            <span className="px-2 py-0.5 rounded bg-gray-200 border border-gray-400 text-[11px]">
                              {student?.uid || '—'}
                            </span>
                          </td>
                          <td className="p-3.5 text-gray-700">
                            {student?.branch ? `${student.branch} · Sem ${student.currentSem || '—'}` : '—'}
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium border ${
                              isLead 
                                ? 'bg-blue-500/10 text-blue-700 border-blue-500/30' 
                                : isCore 
                                ? 'bg-teal-500/10 text-teal-700 border-teal-500/30' 
                                : 'bg-gray-200 text-gray-800 border-gray-400'
                            }`}>
                              {role}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {student?._id && (
                              <button 
                                onClick={() => handleRemoveMember(student._id)} 
                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
                                title="Remove member from club"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {filteredMembers.length === 0 && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-600 font-mono text-xs">
                          {memberSearchQuery ? 'No club members match your search criteria.' : 'No members assigned to this club yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===================================================================
              TAB 3: EVENTS MANAGEMENT
              =================================================================== */}
          {activeTab === 'events' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header & Controls Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-heading-20 font-bold text-gray-1000 tracking-tight">Events &amp; Registrations</h2>
                  <p className="text-xs text-gray-700 mt-0.5">Publish campus events, monitor student registration counts, and scan attendance QR codes.</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="inline-flex rounded-lg border border-gray-400 bg-background-200 p-0.5 text-xs font-mono">
                    <button 
                      onClick={() => setEventFilter('all')}
                      className={`px-3 py-1 rounded-md transition-all ${eventFilter === 'all' ? 'bg-background-100 text-gray-1000 font-semibold shadow-xs' : 'text-gray-700 hover:text-gray-1000'}`}
                    >
                      All ({events.length})
                    </button>
                    <button 
                      onClick={() => setEventFilter('upcoming')}
                      className={`px-3 py-1 rounded-md transition-all ${eventFilter === 'upcoming' ? 'bg-background-100 text-gray-1000 font-semibold shadow-xs' : 'text-gray-700 hover:text-gray-1000'}`}
                    >
                      Upcoming
                    </button>
                    <button 
                      onClick={() => setEventFilter('completed')}
                      className={`px-3 py-1 rounded-md transition-all ${eventFilter === 'completed' ? 'bg-background-100 text-gray-1000 font-semibold shadow-xs' : 'text-gray-700 hover:text-gray-1000'}`}
                    >
                      Completed
                    </button>
                  </div>

                  <button 
                    onClick={() => openCreateEventModal()} 
                    className="h-8 px-3.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Event</span>
                  </button>
                </div>
              </div>

              {/* Event Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((ev, i) => {
                  const status = getEventStatus(ev);
                  const isPast = status === 'COMPLETED';
                  const registeredCount = ev.registeredStudents?.length || 0;

                  return (
                    <div 
                      key={i} 
                      className="rounded-xl border border-gray-400 bg-background-100 overflow-hidden shadow-xs hover:border-gray-500 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Event Poster Header */}
                        <div className="relative h-44 w-full bg-background-200 border-b border-gray-400 overflow-hidden">
                          {ev.posterImage ? (
                            <img src={ev.posterImage} alt={ev.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                              <Calendar className="w-8 h-8 text-gray-600 mb-2" strokeWidth={1.5} />
                              <span className="text-xs font-mono uppercase tracking-wider">{ev.title}</span>
                            </div>
                          )}
                          
                          {/* Status Pill Badge */}
                          <div className="absolute top-3 left-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border backdrop-blur-md shadow-xs ${
                              status === 'COMPLETED' 
                                ? 'bg-background-100/90 text-gray-700 border-gray-400' 
                                : status === 'ONGOING'
                                ? 'bg-green-600 text-white border-green-500 animate-pulse'
                                : 'bg-blue-600 text-white border-blue-500'
                            }`}>
                              {status}
                            </span>
                          </div>
                        </div>

                        {/* Event Content Details */}
                        <div className="p-5 space-y-3">
                          <h3 className="text-heading-16 font-bold text-gray-1000 line-clamp-1">{ev.title}</h3>
                          
                          <div className="space-y-1.5 text-xs text-gray-700 font-mono">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                              <span>{new Date(ev.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                              <span>{ev.time ? formatTime12h(ev.time) : 'TBA'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                              <span className="truncate">{ev.venue || 'Campus Auditorium'}</span>
                            </div>
                            {ev.registrationDeadline && (
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                <span className="text-gray-700">
                                  Reg. Deadline: {new Date(ev.registrationDeadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                              </div>
                            )}
                          </div>

                          {ev.description && (
                            <p className="text-xs text-gray-700 line-clamp-2 leading-relaxed pt-1">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer CTA & Attendees Action */}
                      <div className="p-4 bg-background-200 border-t border-gray-400 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-900 font-medium">
                          <Users className="w-3.5 h-3.5 text-teal-600" />
                          <span>{registeredCount} Registered</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => openEditEventModal(ev)} 
                            className="h-8 px-3 rounded-md bg-background-200 border border-gray-400 text-gray-700 hover:text-gray-1000 text-xs font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setSelectedEventId(ev._id)} 
                            className="h-8 px-3.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer shadow-2xs shrink-0"
                          >
                            <QrCode className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                            <span>Attendees &amp; QR</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredEvents.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-400 p-12 text-center text-gray-700">
                  <Calendar className="w-10 h-10 mx-auto mb-3 text-gray-500" strokeWidth={1.5} />
                  <h3 className="text-sm font-bold text-gray-1000">No events found</h3>
                  <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                    {eventFilter === 'all' 
                      ? 'Publish your first campus workshop, hackathon, or tech drive.' 
                      : `No ${eventFilter} events in the archive.`}
                  </p>
                  <button
                    onClick={() => openCreateEventModal()}
                    className="mt-4 inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Event Now</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              TAB 4: ANNOUNCEMENTS
              =================================================================== */}
          {activeTab === 'announcements' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              
              {/* Header & Controls Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-heading-20 font-bold text-gray-1000 tracking-tight">Campus Broadcasts &amp; Announcements</h2>
                  <p className="text-xs text-gray-700 mt-0.5">Post official announcements sent directly to enrolled university students.</p>
                </div>

                <button 
                  onClick={() => setShowCreateAnnouncementModal(true)} 
                  className="h-8 px-3.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Announcement</span>
                </button>
              </div>

              {/* Announcements Feed */}
              <div className="space-y-4">
                {announcements.map((ann, i) => (
                  <div 
                    key={i} 
                    className="rounded-xl border border-gray-400 bg-background-100 p-6 shadow-xs hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded bg-blue-500/10 text-blue-700 border border-blue-500/20">
                          <Megaphone className="w-3.5 h-3.5" />
                        </span>
                        <h3 className="text-heading-16 font-bold text-gray-1000">{ann.title}</h3>
                      </div>
                      <span className="text-[11px] font-mono text-gray-600 shrink-0">
                        {new Date(ann.datePublished).toLocaleString(undefined, { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>

                    <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap pl-7">
                      {ann.content}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-800 flex items-center justify-between text-[11px] font-mono text-gray-600 pl-7">
                      <span>Broadcasted by {club.name}</span>
                      <span className="text-teal-700 font-medium">Delivered to Campus Feed</span>
                    </div>
                  </div>
                ))}

                {announcements.length === 0 && (
                  <div className="rounded-xl border border-dashed border-gray-400 p-12 text-center text-gray-700">
                    <Megaphone className="w-10 h-10 mx-auto mb-3 text-gray-500" strokeWidth={1.5} />
                    <h3 className="text-sm font-bold text-gray-1000">No announcements published yet</h3>
                    <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                      Keep your student followers updated about auditions, meetings, and upcoming competitions.
                    </p>
                    <button
                      onClick={() => setShowCreateAnnouncementModal(true)}
                      className="mt-4 inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Announcement</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Selected Event Attendees Modal Overlay */}
      {selectedEventId && (
        <EventAttendees 
          eventId={selectedEventId} 
          isEventCompleted={(() => {
            const ev = events.find(e => e._id === selectedEventId);
            return getEventStatus(ev) === 'COMPLETED';
          })()} 
          onClose={() => setSelectedEventId(null)} 
        />
      )}

      {/* ===================================================================
          MODAL: ADD MEMBER WITH LIVE AUTOCOMPLETE
          =================================================================== */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex justify-center items-center p-4 overscroll-contain">
          <div className="bg-background-100 border border-gray-400 p-6 rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowAddMemberModal(false)} 
              className="absolute top-4 right-4 text-gray-700 hover:text-gray-1000 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="mb-5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-semibold">Team Roster</span>
              <h2 className="text-heading-18 font-bold text-gray-1000 tracking-tight mt-0.5">Assign Student Member</h2>
              <p className="text-xs text-gray-700 mt-1">Search student by university UID to grant organization team permissions.</p>
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="relative">
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">
                  Student University UID
                </label>
                <input 
                  required 
                  placeholder="e.g. 23-COMPA10-27" 
                  className="w-full px-3.5 py-2 text-sm bg-background-200 border border-gray-400 rounded-md uppercase font-mono text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100" 
                  value={newMemberUid} 
                  onChange={e => setNewMemberUid(e.target.value)} 
                  onFocus={() => setShowDropdown(true)} 
                />
                
                {/* Autocomplete Dropdown */}
                {showDropdown && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background-100 border border-gray-400 shadow-xl rounded-xl overflow-hidden z-30 max-h-60 overflow-y-auto">
                    {searchSuggestions.map((s, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setNewMemberUid(s.uid);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-background-200 cursor-pointer transition-colors border-b border-gray-300 dark:border-gray-800 last:border-b-0"
                      >
                        {(() => {
                          const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(s?.name || 'Student')}&background=6366f1&color=fff&bold=true`;
                          const avatarSrc = s?.avatarUrl || fallbackAvatar;
                          return (
                            <img 
                              src={avatarSrc} 
                              alt={s?.name || 'avatar'} 
                              onError={(e) => {
                                if (e.currentTarget.src !== fallbackAvatar) {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = fallbackAvatar;
                                }
                              }}
                              className="w-7 h-7 rounded-full object-cover border border-gray-400 shrink-0 bg-background-200" 
                            />
                          );
                        })()}
                        <div>
                          <p className="font-semibold text-xs text-gray-1000">{s.name}</p>
                          <p className="text-[11px] font-mono text-gray-600">{s.uid}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">
                    Designated Club Position Title
                  </label>
                  <input
                    list="role-presets"
                    placeholder="e.g. President, Creative WC, Technical Head, Member"
                    value={newMemberRole}
                    onChange={e => handleRoleChange(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-background-200 border border-gray-400 rounded-md text-gray-1000 font-mono focus:outline-none focus:border-gray-900"
                  />
                  <datalist id="role-presets">
                    <option value="President" />
                    <option value="Vice President" />
                    <option value="General Secretary" />
                    <option value="Technical Head" />
                    <option value="Creative WC" />
                    <option value="Technical WC" />
                    <option value="PR & Outreach WC" />
                    <option value="Event Coordinator" />
                    <option value="Core Member" />
                    <option value="Member" />
                  </datalist>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">
                    Hierarchy Tier & AICTE Multiplier
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewMemberTier('Core')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        newMemberTier === 'Core'
                          ? 'bg-purple-500/15 border-purple-500 text-purple-900 dark:text-purple-200 font-semibold'
                          : 'bg-background-200 border-gray-400 text-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-[11px] font-bold">🌟 Core Team</div>
                      <div className="text-[10px] opacity-80 mt-0.5">2x Pts & Auto-Present</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewMemberTier('WC')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        newMemberTier === 'WC'
                          ? 'bg-blue-500/15 border-blue-500 text-blue-900 dark:text-blue-200 font-semibold'
                          : 'bg-background-200 border-gray-400 text-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-[11px] font-bold">⚡ Working Comm.</div>
                      <div className="text-[10px] opacity-80 mt-0.5">2x Pts via QR Scan</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setNewMemberTier('Member')}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        newMemberTier === 'Member'
                          ? 'bg-gray-1000 text-background-100 font-semibold'
                          : 'bg-background-200 border-gray-400 text-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="text-[11px] font-bold">👥 Club Member</div>
                      <div className="text-[10px] opacity-80 mt-0.5">1x Pts via QR Scan</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full py-2.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Assign to Club Roster</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: CREATE EVENT
          =================================================================== */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex justify-center items-center p-4 overflow-y-auto overscroll-contain">
          <div className="bg-background-100 border border-gray-400 p-6 md:p-8 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowCreateEventModal(false)} 
              className="absolute top-4 right-4 text-gray-700 hover:text-gray-1000 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="mb-5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-semibold">{editingEventId ? 'Edit Event' : 'Publish Event'}</span>
              <h2 className="text-heading-18 font-bold text-gray-1000 tracking-tight mt-0.5">{editingEventId ? 'Update Campus Event' : 'Create Campus Event'}</h2>
              <p className="text-xs text-gray-700 mt-1">{editingEventId ? 'Modify details of an existing event.' : 'Host a workshop, hackathon, or cultural drive for enrolled university students.'}</p>
            </div>

            <form onSubmit={handleSubmitEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Event Title</label>
                <input 
                  required 
                  placeholder="e.g. Distributed Systems & Golang Workshop"
                  className="w-full px-3.5 py-2 text-sm bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100" 
                  value={newEvent.title} 
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Date</label>
                  <input 
                    required 
                    type="date" 
                    className="w-full px-3 py-2 text-xs font-mono bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100" 
                    value={newEvent.date} 
                    onChange={e => setNewEvent({...newEvent, date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Time</label>
                  <input 
                    required 
                    type="time" 
                    className="w-full px-3 py-2 text-xs font-mono bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100" 
                    value={newEvent.time} 
                    onChange={e => setNewEvent({...newEvent, time: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Registration Deadline (Optional)</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-3 py-2 text-xs font-mono bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100" 
                  value={newEvent.registrationDeadline} 
                  onChange={e => {
                    const selected = new Date(e.target.value);
                    const eventStart = new Date(`${newEvent.date}T${newEvent.time || '00:00'}`);
                    if (newEvent.date && newEvent.time && selected > eventStart) {
                      showToast('Deadline cannot be after event start time', 'error');
                    } else {
                      setNewEvent({...newEvent, registrationDeadline: e.target.value});
                    }
                  }} 
                />
                <p className="text-[10px] text-gray-500 mt-1 font-mono">
                  If left blank, registration closes exactly when the event starts.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">
                    Event Duration (Hours)
                  </label>
                  <input 
                    required 
                    type="number" 
                    min="0.5"
                    step="0.5"
                    placeholder="e.g. 4"
                    className="w-full px-3 py-2 text-xs font-mono bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100" 
                    value={newEvent.durationHours} 
                    onChange={e => setNewEvent({...newEvent, durationHours: e.target.value})} 
                  />
                  <p className="text-[10px] text-gray-500 mt-1 font-mono">
                    Points: {Math.max(1, Math.ceil((Number(newEvent.durationHours) || 2) / 4))} pt (Member) / {Math.max(1, Math.ceil((Number(newEvent.durationHours) || 2) / 4)) * 2} pts (Core/WC)
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">
                    AICTE Activity Category
                  </label>
                  <select
                    value={newEvent.aicteCategory}
                    onChange={e => setNewEvent({...newEvent, aicteCategory: Number(e.target.value)})}
                    className="w-full px-2.5 py-2 text-xs bg-background-200 border border-gray-400 rounded-md text-gray-1000 font-mono focus:outline-none focus:border-gray-900 cursor-pointer"
                  >
                    <option value={1}>#1. School Education Support</option>
                    <option value={2}>#2. Village Business Proposal</option>
                    <option value={3}>#3. Water Conservation</option>
                    <option value={4}>#4. Tourism Innovation</option>
                    <option value={5}>#5. Promotion of Appropriate Tech</option>
                    <option value={6}>#6. Energy Consumption Reduction</option>
                    <option value={7}>#7. Rural Skill Development</option>
                    <option value={8}>#8. 100% Digitized Money Literacy</option>
                    <option value={9}>#9. Agri-Tech Information</option>
                    <option value={10}>#10. Garbage Disposal & Waste Mgmt</option>
                    <option value={11}>#11. Rural Produce Marketing</option>
                    <option value={12}>#12. Food Preservation/Packaging</option>
                    <option value={13}>#13. Automation of Local Activities</option>
                    <option value={14}>#14. Rural Outreach Awareness</option>
                    <option value={15}>#15. National Level Initiatives</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">
                  Official Activity Summary (Auto-fills into Student AICTE Diaries)
                </label>
                <input 
                  placeholder="e.g. Conducted hands-on technical workshop on cloud computing architecture"
                  className="w-full px-3.5 py-2 text-xs bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 font-sans" 
                  value={newEvent.activitySummary} 
                  onChange={e => setNewEvent({...newEvent, activitySummary: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Venue / Auditorium</label>
                <input 
                  placeholder="e.g. BR Ambedkar Auditorium / Hall B"
                  className="w-full px-3.5 py-2 text-sm bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100" 
                  value={newEvent.venue} 
                  onChange={e => setNewEvent({...newEvent, venue: e.target.value})} 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-mono uppercase text-gray-700 font-semibold">
                    Event Poster / Banner
                  </label>
                  <span className="text-[10px] font-mono text-gray-600 bg-background-200 border border-gray-400 px-2 py-0.5 rounded">
                    Any Aspect Ratio (16:9, Flyer, 1:1, etc.)
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {newEvent.posterImage && (
                    <div className="w-full max-h-60 rounded-xl overflow-hidden border border-gray-400 bg-background-200 flex items-center justify-center p-2">
                      <img 
                        src={newEvent.posterImage} 
                        alt="Poster preview" 
                        className="max-h-56 max-w-full rounded-lg object-contain shadow-xs" 
                      />
                    </div>
                  )}
                  <label className="inline-flex items-center justify-center gap-2 p-3 border border-dashed border-gray-400 bg-background-200 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-900 cursor-pointer transition-colors">
                    <UploadCloud className="w-4 h-4 text-gray-600" />
                    <span>{newEvent.posterImage ? 'Replace Poster Image' : 'Upload Poster Image'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      disabled={uploadingImage} 
                      className="hidden" 
                      onChange={e => handleImageSelect(e, 'event', 'posterImage', null)} 
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Description</label>
                <textarea 
                  rows="4" 
                  placeholder="Agenda, prerequisites, speaker bio, and event milestones..."
                  className="w-full px-3.5 py-2 text-sm bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 font-sans" 
                  value={newEvent.description} 
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})} 
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={uploadingImage} 
                  className="w-full py-2.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>{editingEventId ? 'Save Changes' : 'Publish Event to Campus'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: CREATE ANNOUNCEMENT
          =================================================================== */}
      {showCreateAnnouncementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[150] flex justify-center items-center p-4 overscroll-contain">
          <div className="bg-background-100 border border-gray-400 p-6 md:p-8 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setShowCreateAnnouncementModal(false)} 
              className="absolute top-4 right-4 text-gray-700 hover:text-gray-1000 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="mb-5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-semibold">Broadcast</span>
              <h2 className="text-heading-18 font-bold text-gray-1000 tracking-tight mt-0.5">Post Announcement</h2>
              <p className="text-xs text-gray-700 mt-1">This announcement will be delivered immediately to student notification feeds.</p>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Headline</label>
                <input 
                  required 
                  placeholder="e.g. Auditions Shortlist Announced · Round 2 Details"
                  className="w-full px-3.5 py-2 text-sm bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 font-sans" 
                  value={newAnnouncement.title} 
                  onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} 
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-gray-700 mb-1 font-semibold">Message Content</label>
                <textarea 
                  required 
                  rows="6" 
                  placeholder="Full announcement text, schedule changes, links, or instructions for participants..."
                  className="w-full px-3.5 py-2 text-sm bg-background-200 border border-gray-400 rounded-md text-gray-1000 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 font-sans leading-relaxed" 
                  value={newAnnouncement.content} 
                  onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} 
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  className="w-full py-2.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  <span>Broadcast Announcement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Removing Member */}
      {memberToRemove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background-100 border border-gray-400 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-1000 font-mono tracking-tight mb-2">
                Remove Member
              </h3>
              <p className="text-sm text-gray-700">
                Are you sure you want to remove this student from your club roster? This action cannot be undone.
              </p>
            </div>
            <div className="bg-background-200 border-t border-gray-400 p-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 hover:text-gray-1000 hover:bg-background-100 border border-transparent hover:border-gray-400 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveMember}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all cursor-pointer"
              >
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Media Image Cropper Integration */}
      {cropData && (
        <ImageCropperModal
          imageSrc={cropData.src}
          aspectRatio={cropData.aspectRatio}
          title={cropData.formType === 'event' ? 'Adjust Event Poster / Flyer' : undefined}
          onCropComplete={handleImageCropComplete}
          onCancel={() => setCropData(null)}
        />
      )}
    </>
  );
}
