import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FiLoader, FiEdit2, FiUsers, FiCalendar, FiMessageSquare, FiPlus, FiTrash2, FiCamera } from 'react-icons/fi';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import EventAttendees from '../components/EventAttendees';
import ImageCropperModal from '../components/ImageCropperModal';

export default function ClubDashboard() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');
  const [club, setClub] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tab Data States
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropData, setCropData] = useState(null);

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  
  // Forms States
  const [profileForm, setProfileForm] = useState({ name: '', description: '', profilePhoto: '', bannerPhoto: '', socials: { instagram: '', facebook: '', linkedin: '' } });
  const [newMemberUid, setNewMemberUid] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', venue: '', description: '' });
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
        name: profileRes.data.name,
        description: profileRes.data.description,
        profilePhoto: profileRes.data.profilePhoto,
        bannerPhoto: profileRes.data.bannerPhoto,
        socials: profileRes.data.socials || { instagram: '', facebook: '', linkedin: '' }
      });
      setEvents(eventsRes.data);
      setAnnouncements(announcementsRes.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load club data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubData();
  }, [showToast]);

  useEffect(() => {
    if (newMemberUid.length >= 2) {
      const delayFn = setTimeout(async () => {
        try {
          const res = await axios.get(`/clubs/search-students?q=${newMemberUid}`);
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

  const handleImageSelect = (e, formType, fieldName, aspectRatio = 1) => {
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
      showToast('Image uploaded successfully', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put('/clubs/profile', profileForm);
      setClub(res.data.club);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/clubs/members', { studentUid: newMemberUid });
      setClub(res.data.club);
      setNewMemberUid('');
      setShowDropdown(false);
      setShowAddMemberModal(false);
      showToast('Member added successfully', 'success');
    } catch (err) {
      showToast('Failed to update profile', 'error');
    }
  };

  const handleRemoveMember = async (studentId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await axios.delete(`/clubs/members/${studentId}`);
      setClub({ ...club, assignedStudents: club.assignedStudents.filter(m => m.studentId._id !== studentId) });
      showToast('Member removed', 'success');
    } catch (err) {
      showToast('Failed to remove member', 'error');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/clubs/events', newEvent);
      setEvents([...events, res.data.event]);
      setNewEvent({ title: '', date: '', time: '', venue: '', description: '', posterImage: '' });
      setShowCreateEventModal(false);
      showToast('Event created successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create event', 'error');
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/clubs/announcements', newAnnouncement);
      setAnnouncements([res.data.announcement, ...announcements]);
      setNewAnnouncement({ title: '', content: '' });
      setShowCreateAnnouncementModal(false);
      showToast('Announcement posted successfully', 'success');
    } catch (err) {
      showToast('Failed to post announcement', 'error');
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background"><FiLoader className="animate-spin text-4xl text-primary" /></div>;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Topbar />
        {/* Banner Area */}
        <div className="relative h-48 md:h-64 bg-surface-variant">
          {club.bannerPhoto ? (
            <img src={club.bannerPhoto} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-ai-gradient-start opacity-20"></div>
          )}
          <div className="absolute -bottom-16 left-8 md:left-12 flex items-end">
            <div className="w-32 h-32 rounded-2xl bg-surface border-4 border-background overflow-hidden flex items-center justify-center">
              {club.profilePhoto ? (
                <img src={club.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[64px] text-on-surface-variant">groups</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-20 px-8 md:px-12 max-w-container-max mx-auto pb-16">
          <div className="mb-8">
            <h1 className="font-display-hero text-headline-lg text-on-surface font-bold shadow-sm">{club.name}</h1>
            <p className="text-on-surface-variant">{club.email}</p>
          </div>
          {/* Tabs */}
          <div className="flex gap-2 border-b border-border-light mb-8 overflow-x-auto pb-2">
            {[
              { id: 'profile', icon: FiEdit2, label: 'Profile' },
              { id: 'members', icon: FiUsers, label: 'Members' },
              { id: 'events', icon: FiCalendar, label: 'Events' },
              { id: 'announcements', icon: FiMessageSquare, label: 'Announcements' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-medium transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-on-surface-variant hover:bg-surface-variant'}`}
              >
                <tab.icon /> {tab.label}
              </button>
            ))}
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border-light max-w-2xl">
              <h2 className="text-headline-sm font-bold mb-6">Edit Profile</h2>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Club Name</label>
                  <input required className="w-full p-3 bg-surface border border-outline-variant rounded-lg" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Description</label>
                  <textarea rows="4" className="w-full p-3 bg-surface border border-outline-variant rounded-lg" value={profileForm.description} onChange={e => setProfileForm({...profileForm, description: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Profile Photo</label>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {profileForm.profilePhoto ? (
                      <img src={profileForm.profilePhoto} alt="Profile preview" className="w-12 h-12 rounded-full object-cover border border-border-light shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-on-surface-variant">person</span></div>
                    )}
                    <div className="flex-1 w-full space-y-2">
                      <input type="url" placeholder="Paste image URL here..." className="w-full p-2 bg-surface border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" value={profileForm.profilePhoto} onChange={e => setProfileForm({...profileForm, profilePhoto: e.target.value})} />
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-on-surface-variant font-bold">OR</span>
                        <input type="file" accept="image/*" disabled={uploadingImage} className="w-full text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" onChange={e => handleImageSelect(e, 'profile', 'profilePhoto', 1)} />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Banner Photo</label>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    {profileForm.bannerPhoto ? (
                      <img src={profileForm.bannerPhoto} alt="Banner preview" className="w-20 h-10 rounded-md object-cover border border-border-light shrink-0" />
                    ) : (
                      <div className="w-20 h-10 rounded-md bg-surface-container flex items-center justify-center shrink-0"><span className="material-symbols-outlined text-on-surface-variant">image</span></div>
                    )}
                    <div className="flex-1 w-full space-y-2">
                      <input type="url" placeholder="Paste image URL here..." className="w-full p-2 bg-surface border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary" value={profileForm.bannerPhoto} onChange={e => setProfileForm({...profileForm, bannerPhoto: e.target.value})} />
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-on-surface-variant font-bold">OR</span>
                        <input type="file" accept="image/*" disabled={uploadingImage} className="w-full text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" onChange={e => handleImageSelect(e, 'profile', 'bannerPhoto', 4)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div>
                  <h3 className="text-label-lg font-bold text-on-surface mb-2 border-b border-border-light pb-1">Social Media Links</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-on-surface-variant mb-1">Instagram URL</label>
                      <input type="url" placeholder="https://instagram.com/yourclub" className="w-full p-2 bg-surface border border-outline-variant rounded-lg text-sm" value={profileForm.socials.instagram} onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, instagram: e.target.value}})} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-on-surface-variant mb-1">Facebook URL</label>
                      <input type="url" placeholder="https://facebook.com/yourclub" className="w-full p-2 bg-surface border border-outline-variant rounded-lg text-sm" value={profileForm.socials.facebook} onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, facebook: e.target.value}})} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-on-surface-variant mb-1">LinkedIn URL</label>
                      <input type="url" placeholder="https://linkedin.com/company/yourclub" className="w-full p-2 bg-surface border border-outline-variant rounded-lg text-sm" value={profileForm.socials.linkedin} onChange={e => setProfileForm({...profileForm, socials: {...profileForm.socials, linkedin: e.target.value}})} />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={uploadingImage} className="px-6 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container disabled:opacity-50">Save Changes</button>
              </form>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-headline-sm font-bold">Manage Members</h2>
                <button onClick={() => setShowAddMemberModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container flex items-center gap-2">
                  <FiPlus /> Add Member
                </button>
              </div>

              <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-border-light overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-surface-variant text-on-surface-variant font-medium text-sm">
                    <tr>
                      <th className="p-4">Name</th>
                      <th className="p-4">UID</th>
                      <th className="p-4">Role</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {club.assignedStudents.map((member, i) => (
                      <tr key={i} className="border-t border-border-light">
                        <td className="p-4 font-medium">{member.studentId?.name || 'Unknown'}</td>
                        <td className="p-4 text-on-surface-variant">{member.studentId?.uid}</td>
                        <td className="p-4 text-sm"><span className="px-2 py-1 bg-secondary-container text-on-secondary-container rounded-md">{member.role}</span></td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleRemoveMember(member.studentId._id)} className="text-error hover:text-red-700 p-2"><FiTrash2 /></button>
                        </td>
                      </tr>
                    ))}
                    {club.assignedStudents.length === 0 && (
                      <tr><td colSpan="4" className="p-6 text-center text-on-surface-variant">No members assigned yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-headline-sm font-bold">Manage Events</h2>
                <button onClick={() => setShowCreateEventModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container flex items-center gap-2">
                  <FiPlus /> Create Event
                </button>
              </div>
              <div className="space-y-4">
                {events.map((ev, i) => (
                  <div key={i} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border-light flex justify-between items-center">
                    <div>
                      <h3 className="text-label-lg font-bold">{ev.title}</h3>
                      <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-1">
                        <FiCalendar /> {new Date(ev.date).toLocaleDateString()} at {ev.time} | {ev.venue}
                      </p>
                      <div className="mt-3">
                        <span className="text-xs px-2 py-1 bg-surface-variant rounded-md font-medium text-on-surface-variant">{ev.status.toUpperCase()}</span>
                        <span className="text-xs px-2 py-1 bg-secondary-container text-on-secondary-container rounded-md font-medium ml-2">{ev.registeredStudents.length} Registered</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedEventId(ev._id)} className="px-4 py-2 bg-surface border border-border-light rounded-lg text-sm font-medium hover:bg-surface-variant">View Attendees</button>
                  </div>
                ))}
                {events.length === 0 && <p className="text-on-surface-variant">No events published yet.</p>}
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-headline-sm font-bold">Manage Announcements</h2>
                <button onClick={() => setShowCreateAnnouncementModal(true)} className="px-4 py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container flex items-center gap-2">
                  <FiPlus /> New Announcement
                </button>
              </div>
              <div className="space-y-4">
                {announcements.map((ann, i) => (
                  <div key={i} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border-light">
                    <h3 className="text-label-lg font-bold">{ann.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 mb-4">{new Date(ann.datePublished).toLocaleString()}</p>
                    <p className="text-body-md whitespace-pre-wrap">{ann.content}</p>
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-on-surface-variant">No announcements posted yet.</p>}
              </div>
            </div>
          )}

        </div>
        
        {selectedEventId && (
          <EventAttendees 
            eventId={selectedEventId} 
            onClose={() => setSelectedEventId(null)} 
          />
        )}
      </main>
      
      {/* Modals for Create Actions */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest p-6 rounded-2xl w-full max-w-md shadow-2xl relative border border-border-light">
            <button onClick={() => setShowAddMemberModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors w-8 h-8 flex justify-center items-center rounded-full hover:bg-surface-variant"><FiX /></button>
            <h2 className="text-headline-sm font-bold mb-6 text-on-surface">Add Member</h2>
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-on-surface mb-1">Student UID</label>
                <input 
                  required 
                  placeholder="23-COMPA10-27" 
                  className="w-full p-3 bg-surface border border-outline-variant rounded-lg uppercase focus:outline-none focus:border-primary" 
                  value={newMemberUid} 
                  onChange={e => setNewMemberUid(e.target.value)} 
                  onFocus={() => setShowDropdown(true)}
                />
                
                {/* Autocomplete Dropdown */}
                {showDropdown && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border-light shadow-lg rounded-xl overflow-hidden z-20 max-h-60 overflow-y-auto">
                    {searchSuggestions.map((s, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          setNewMemberUid(s.uid);
                          setShowDropdown(false);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-surface-variant cursor-pointer transition-colors border-b border-border-light last:border-b-0"
                      >
                        {s.avatarUrl ? (
                          <img src={s.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-bold text-on-surface-variant">
                            {s.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm text-on-surface">{s.name}</p>
                          <p className="text-xs text-on-surface-variant">{s.uid}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button type="submit" className="w-full py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container flex items-center justify-center gap-2 mt-4">Add Member</button>
            </form>
          </div>
        </div>
      )}

      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl w-full max-w-lg shadow-2xl relative border border-border-light max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCreateEventModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors w-8 h-8 flex justify-center items-center rounded-full hover:bg-surface-variant"><FiX /></button>
            <h2 className="text-headline-sm font-bold mb-6 text-on-surface">Create Event</h2>
            <form onSubmit={handleCreateEvent} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Event Title</label>
                <input required className="w-full p-3 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Date</label>
                  <input required type="date" className="w-full p-3 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-on-surface mb-1">Time</label>
                  <input required type="time" className="w-full p-3 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Venue</label>
                <input className="w-full p-3 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Event Poster (Optional)</label>
                <div className="flex flex-col gap-3">
                  {newEvent.posterImage && (
                    <img src={newEvent.posterImage} alt="Poster preview" className="w-full h-32 rounded-lg object-cover border border-border-light" />
                  )}
                  <input type="file" accept="image/*" disabled={uploadingImage} className="w-full p-2 bg-surface border border-outline-variant rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" onChange={e => handleImageSelect(e, 'event', 'posterImage', 16/9)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Description</label>
                <textarea rows="4" className="w-full p-3 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
              </div>
              <button type="submit" disabled={uploadingImage} className="w-full py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container disabled:opacity-50 mt-4">Publish Event</button>
            </form>
          </div>
        </div>
      )}

      {showCreateAnnouncementModal && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex justify-center items-center p-4 backdrop-blur-sm">
          <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl w-full max-w-lg shadow-2xl relative border border-border-light max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowCreateAnnouncementModal(false)} className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors w-8 h-8 flex justify-center items-center rounded-full hover:bg-surface-variant"><FiX /></button>
            <h2 className="text-headline-sm font-bold mb-6 text-on-surface">New Announcement</h2>
            <form onSubmit={handleCreateAnnouncement} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Title</label>
                <input required className="w-full p-3 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Content</label>
                <textarea required rows="6" className="w-full p-3 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-primary" value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container mt-4">Publish Announcement</button>
            </form>
          </div>
        </div>
      )}

      {cropData && (
        <ImageCropperModal
          imageSrc={cropData.src}
          aspectRatio={cropData.aspectRatio}
          onCropComplete={handleImageCropComplete}
          onCancel={() => setCropData(null)}
        />
      )}
    </div>
  );
}
