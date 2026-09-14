import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  MessageSquare,
  Users,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Share2,
  Loader2,
  X,
  Bell,
  Building2,
  UserCheck
} from 'lucide-react';
import { FiInstagram, FiLinkedin, FiFacebook } from 'react-icons/fi';

export default function ClubProfile() {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const { showToast } = useToast();

  // Registration Modal State
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true);
        const [clubRes, eventsRes, announcementsRes] = await Promise.all([
          axios.get(`/clubs/${id}`),
          axios.get(`/events/public?clubId=${id}`),
          axios.get('/clubs/announcements/public')
        ]);
        setClub(clubRes.data);
        setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : []);
        // Filter announcements for this specific club
        const clubAnnouncements = Array.isArray(announcementsRes.data)
          ? announcementsRes.data.filter((a) => (a.clubId?._id || a.clubId) === id)
          : [];
        setAnnouncements(clubAnnouncements);
      } catch (err) {
        console.error('Error fetching club details:', err);
        showToast('Failed to load club details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchClubData();
  }, [id, showToast]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedEvent) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedEvent]);

  const handleRegister = async () => {
    if (!selectedEvent) return;
    setRegistering(true);
    try {
      await axios.post(`/events/${selectedEvent._id}/register`);
      showToast('Successfully registered for event!', 'success');

      // Update local state to reflect registration
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev._id === selectedEvent._id) {
            return {
              ...ev,
              registeredStudents: [
                ...(ev.registeredStudents || []),
                { studentId: user?._id || user?.id }
              ]
            };
          }
          return ev;
        })
      );

      setSelectedEvent(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Club link copied to clipboard!', 'success');
    }
  };

  const isUserMember = () => {
    if (!user?._id || !club?.assignedStudents) return false;
    return club.assignedStudents.some((member) => {
      const memberId = member.studentId?._id || member.studentId || member;
      return memberId?.toString() === user._id?.toString();
    });
  };

  const isClubManager = user?.role === 'club' && (user._id === id || user.id === id);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background-100 text-gray-1000 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-gray-800" />
              <p className="text-xs font-mono text-gray-600">Loading organization details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex min-h-screen bg-background-100 text-gray-1000 font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar />
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="bg-background-100 border border-dashed border-gray-400 rounded-2xl p-12 text-center max-w-md shadow-2xs space-y-4">
              <div className="w-12 h-12 rounded-xl bg-background-200 border border-gray-400 text-gray-700 mx-auto flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-1000">Club Not Found</h3>
                <p className="text-xs text-gray-700">The organization you are looking for does not exist or has been removed.</p>
              </div>
              <Link
                to="/clubs"
                className="inline-flex items-center gap-2 h-8 px-4 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Clubs</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background-100 text-gray-1000 font-sans selection:bg-gray-1000 selection:text-background-100">
      <Sidebar />
      <main className={`flex-1 min-w-0 bg-background-100 pb-16 ${selectedEvent ? 'overflow-hidden' : ''}`}>
        <Topbar />

        {/* Top Breadcrumb & Actions Bar */}
        <div className="border-b border-gray-400 bg-background-100/80 backdrop-blur-xs sticky top-14 z-30 px-4 sm:px-8 py-2.5">
          <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4">
              <Link
                to="/clubs"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 hover:text-gray-1000 transition-colors cursor-pointer group"
              >
                <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                <span>Back to Organizations</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="h-8 px-3 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title="Share club link"
                >
                  <Share2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Share</span>
                </button>

                {isClubManager && (
                  <Link
                    to="/club/dashboard"
                    className="h-8 px-3.5 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Club Dashboard</span>
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Banner Area */}
          <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden bg-background-200 border-b border-gray-400">
            {club.bannerPhoto ? (
              <img
                src={club.bannerPhoto}
                alt={`${club.name} Banner`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-background-200 via-background-100 to-background-200 relative">
                <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:12px_12px]" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>

          {/* Overlapping Profile Header Content */}
          <div className="max-w-6xl w-full mx-auto px-4 sm:px-8 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 md:-mt-20 mb-6">
              {/* Profile Avatar */}
              <div className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl bg-background-100 border-4 border-background-100 shadow-md overflow-hidden flex items-center justify-center p-1 relative z-20 shrink-0">
                {club.profilePhoto ? (
                  <img
                    src={club.profilePhoto}
                    alt={club.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-background-200 text-gray-900 flex items-center justify-center font-mono font-bold text-3xl rounded-xl">
                    {club.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Status Badges on Mobile/Desktop */}
              <div className="flex items-center gap-2 flex-wrap pt-2 sm:pt-0">
                {isUserMember() && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Member</span>
                  </span>
                )}
              </div>
            </div>

            {/* Club Identity, Description & Socials */}
            <div className="space-y-4 pb-6 border-b border-gray-400">
              <div>
                <div className="text-[10px] font-mono font-semibold uppercase tracking-wider text-gray-600 mb-1 select-none">
                  Student Organization
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-1000">
                  {club.name}
                </h1>
                <p className="text-xs sm:text-sm text-gray-700 font-sans mt-2.5 max-w-3xl leading-relaxed whitespace-pre-wrap">
                  {club.description || 'Dedicated student organization advancing peer learning, technical projects, and campus culture.'}
                </p>
              </div>

              {/* Metadata Badges & Social Links */}
              <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background-200 border border-gray-400 text-xs font-mono text-gray-800">
                    <Users className="w-3.5 h-3.5 text-gray-600" />
                    <span>{club.assignedStudents?.length || 0} Members</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background-200 border border-gray-400 text-xs font-mono text-gray-800">
                    <Calendar className="w-3.5 h-3.5 text-gray-600" />
                    <span>{events.length} {events.length === 1 ? 'Event' : 'Events'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background-200 border border-gray-400 text-xs font-mono text-gray-800">
                    <Bell className="w-3.5 h-3.5 text-gray-600" />
                    <span>{announcements.length} {announcements.length === 1 ? 'Notice' : 'Notices'}</span>
                  </span>
                </div>

                {/* Social Media Links */}
                {club.socials && (
                  <div className="flex items-center gap-2">
                    {club.socials.instagram && (
                      <a
                        href={club.socials.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-lg bg-background-200 border border-gray-400 flex items-center justify-center text-gray-700 hover:text-gray-1000 hover:border-gray-600 transition-colors shadow-2xs"
                        title="Instagram"
                      >
                        <FiInstagram className="w-4 h-4" />
                      </a>
                    )}
                    {club.socials.linkedin && (
                      <a
                        href={club.socials.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-lg bg-background-200 border border-gray-400 flex items-center justify-center text-gray-700 hover:text-gray-1000 hover:border-gray-600 transition-colors shadow-2xs"
                        title="LinkedIn"
                      >
                        <FiLinkedin className="w-4 h-4" />
                      </a>
                    )}
                    {club.socials.facebook && (
                      <a
                        href={club.socials.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-lg bg-background-200 border border-gray-400 flex items-center justify-center text-gray-700 hover:text-gray-1000 hover:border-gray-600 transition-colors shadow-2xs"
                        title="Facebook"
                      >
                        <FiFacebook className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 2-Column Content Grid: Events & Announcements / Members */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Upcoming Events (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-gray-1000">
                      Upcoming Events
                    </h2>
                  </div>
                  <span className="text-xs font-mono text-gray-600">
                    {events.length} {events.length === 1 ? 'Event' : 'Events'}
                  </span>
                </div>

                {events.length === 0 ? (
                  <div className="bg-background-100 border border-dashed border-gray-400 rounded-xl p-8 text-center space-y-2 shadow-2xs">
                    <Calendar className="w-8 h-8 text-gray-500 mx-auto" />
                    <p className="text-xs text-gray-700 font-sans">
                      No upcoming events scheduled right now. Check back soon!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {events.map((ev) => {
                      const isRegistered = ev.registeredStudents?.some(
                        (s) =>
                          s.studentId === user?._id ||
                          s.studentId?._id === user?._id ||
                          s.studentId === user?.id
                      );

                      return (
                        <div
                          key={ev._id}
                          className="bg-background-100 border border-gray-400 rounded-xl overflow-hidden shadow-2xs hover:border-gray-900 transition-all duration-200 flex flex-col"
                        >
                          {ev.posterImage && (
                            <div className="w-full h-44 sm:h-48 bg-background-200 border-b border-gray-400 overflow-hidden relative">
                              <img
                                src={ev.posterImage}
                                alt={ev.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-700 bg-background-200 border border-gray-400 px-2 py-0.5 rounded">
                                  <Calendar className="w-3 h-3 text-gray-600" />
                                  {new Date(ev.date).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                                {ev.time && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-gray-700 bg-background-200 border border-gray-400 px-2 py-0.5 rounded">
                                    <Clock className="w-3 h-3 text-gray-600" />
                                    {ev.time}
                                  </span>
                                )}
                                {ev.venue && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-sans text-gray-700 bg-background-200 border border-gray-400 px-2 py-0.5 rounded">
                                    <MapPin className="w-3 h-3 text-gray-600" />
                                    {ev.venue}
                                  </span>
                                )}
                              </div>

                              <h3 className="font-bold text-base text-gray-1000">
                                {ev.title}
                              </h3>
                              <p className="text-xs text-gray-700 mt-2 font-sans leading-relaxed line-clamp-3">
                                {ev.description}
                              </p>
                            </div>

                            {/* Registration Button */}
                            <div className="pt-2 border-t border-gray-400 flex items-center justify-between">
                              <span className="text-[11px] font-mono text-gray-600">
                                {ev.registeredStudents?.length || 0} Attendees
                              </span>

                              {isRegistered ? (
                                <span className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-md bg-background-200 border border-gray-400 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Registered</span>
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedEvent(ev)}
                                  className="h-8 px-4 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <span>Register Now</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column: Announcements & Core Team (5 cols) */}
              <div className="lg:col-span-5 space-y-8">
                {/* Announcements Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-600" />
                      <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-gray-1000">
                        Announcements
                      </h2>
                    </div>
                    <span className="text-xs font-mono text-gray-600">
                      {announcements.length} {announcements.length === 1 ? 'Notice' : 'Notices'}
                    </span>
                  </div>

                  {announcements.length === 0 ? (
                    <div className="bg-background-100 border border-dashed border-gray-400 rounded-xl p-6 text-center shadow-2xs">
                      <p className="text-xs text-gray-700 font-sans">
                        No announcements posted recently.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {announcements.map((ann) => (
                        <div
                          key={ann._id}
                          className="bg-background-100 border border-gray-400 rounded-xl p-4 shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-gray-600 bg-background-200 border border-gray-400 uppercase tracking-wider">
                              Notice
                            </span>
                            <span className="text-[11px] font-mono text-gray-600">
                              {new Date(ann.datePublished || ann.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h4 className="font-semibold text-xs sm:text-sm text-gray-1000">
                            {ann.title}
                          </h4>
                          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
                            {ann.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Team / Members Section */}
                {club.assignedStudents && club.assignedStudents.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-600" />
                        <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-gray-1000">
                          Core Team & Members
                        </h2>
                      </div>
                      <span className="text-xs font-mono text-gray-600">
                        {club.assignedStudents.length}
                      </span>
                    </div>

                    <div className="bg-background-100 border border-gray-400 rounded-xl p-4 shadow-2xs divide-y divide-gray-400">
                      {club.assignedStudents.map((member, idx) => {
                        const student = member.studentId;
                        const name = student?.name || 'Student Member';
                        const role = member.role || 'Member';
                        const avatar = student?.avatarUrl;

                        return (
                          <div
                            key={member._id || idx}
                            className={`flex items-center justify-between gap-3 ${idx === 0 ? 'pb-3' : 'py-3'}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-full bg-background-200 border border-gray-400 text-gray-900 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-2xs">
                                <img 
                                  src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true`} 
                                  alt={name} 
                                  onError={(e) => {
                                    const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true`;
                                    if (e.currentTarget.src !== fallback) {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = fallback;
                                    }
                                  }}
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-gray-1000 truncate">
                                  {name}
                                </p>
                                {student?.branch && (
                                  <p className="text-[10px] font-mono text-gray-600 truncate">
                                    {student.branch} {student.currentSem ? `• Sem ${student.currentSem}` : ''}
                                  </p>
                                )}
                              </div>
                            </div>

                            <span className="px-2 py-0.5 rounded text-[10px] font-mono text-gray-700 bg-background-200 border border-gray-400 shrink-0">
                              {role}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Event Registration Confirmation Modal (Geist Dialog) */}
          {selectedEvent && (
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4 animate-in fade-in duration-150"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedEvent(null);
              }}
            >
              <div className="bg-background-100 border border-gray-400 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-700" />
                    <h3 className="text-base font-bold text-gray-1000">
                      Confirm Registration
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    className="p-1 rounded-md text-gray-600 hover:text-gray-1000 hover:bg-background-200 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-gray-700 font-sans leading-relaxed">
                  You are registering to attend this event organized by <strong>{club.name}</strong>.
                </p>

                {/* Event Summary Box */}
                <div className="bg-background-200 border border-gray-400 rounded-xl p-3.5 space-y-2 text-xs">
                  <p className="font-semibold text-gray-1000 text-sm">
                    {selectedEvent.title}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-mono text-gray-700 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-600" />
                      {new Date(selectedEvent.date).toLocaleDateString()}
                    </span>
                    {selectedEvent.time && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-600" />
                        {selectedEvent.time}
                      </span>
                    )}
                    {selectedEvent.venue && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-600" />
                        {selectedEvent.venue}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEvent(null)}
                    disabled={registering}
                    className="h-9 px-4 rounded-lg border border-gray-400 bg-background-100 hover:bg-gray-200 text-xs font-medium text-gray-800 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={registering}
                    className="h-9 px-5 rounded-lg bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      <span>Confirm Registration</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
    </div>
  );
}
