import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import PageHeader from '../components/ui/PageHeader';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Ticket,
  Megaphone,
  Search,
  X,
  RotateCw,
  ShieldCheck,
  ArrowRight,
  QrCode,
  Copy,
  Check,
  Clock,
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function Events() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'registered' | 'announcements'
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [registeringEventId, setRegisteringEventId] = useState(null);

  // Search & Filter controls
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_asc'); // 'date_asc' | 'date_desc' | 'popular'

  // Modals state
  const [selectedEventForPass, setSelectedEventForPass] = useState(null);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [eventsRes, announcementsRes] = await Promise.all([
        axios.get('/events/public'),
        axios.get('/clubs/announcements/public')
      ]);

      const sortedEvents = (eventsRes.data || []).sort((a, b) => new Date(a.date) - new Date(b.date));
      setEvents(sortedEvents);

      const sortedAnnouncements = (announcementsRes.data || []).sort(
        (a, b) => new Date(b.datePublished || b.createdAt) - new Date(a.datePublished || a.createdAt)
      );
      setAnnouncements(sortedAnnouncements);
    } catch (err) {
      console.error('Error loading events & announcements:', err);
      showToast('Failed to load events feed', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const userId = user?.id || user?._id;

  // Helper to check if student is registered for an event
  const getRegistrationInfo = (event) => {
    if (!userId || !event.registeredStudents) return { isRegistered: false, qrCode: null };
    const match = event.registeredStudents.find((s) => {
      const sId = s.studentId?._id || s.studentId;
      return sId?.toString() === userId?.toString();
    });
    return {
      isRegistered: !!match,
      qrCode: match?.qrCode || null,
      attendanceStatus: match?.attendanceStatus || 'pending'
    };
  };

  const handleRegister = async (event) => {
    setRegisteringEventId(event._id);
    try {
      const res = await axios.post(`/events/${event._id}/register`);
      showToast('Successfully registered for event!', 'success');

      const qrCode = res.data?.qrCode || '';

      // Optimistic update
      setEvents((prev) =>
        prev.map((ev) => {
          if (ev._id === event._id) {
            const currentList = ev.registeredStudents || [];
            return {
              ...ev,
              registeredStudents: [
                ...currentList,
                { studentId: { _id: userId, name: user?.name, email: user?.email }, qrCode, attendanceStatus: 'pending' }
              ]
            };
          }
          return ev;
        })
      );

      // Auto open digital pass modal for immediate confirmation
      setSelectedEventForPass({
        ...event,
        currentUserQrCode: qrCode
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      showToast(msg, 'error');
    } finally {
      setRegisteringEventId(null);
    }
  };

  // Filtered Events
  const registeredEvents = useMemo(() => {
    return events.filter((ev) => getRegistrationInfo(ev).isRegistered);
  }, [events, userId]);

  const filteredEvents = useMemo(() => {
    const baseList = activeTab === 'registered' ? registeredEvents : events;
    let filtered = baseList;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((ev) => {
        const titleMatch = ev.title?.toLowerCase().includes(q);
        const descMatch = ev.description?.toLowerCase().includes(q);
        const venueMatch = ev.venue?.toLowerCase().includes(q);
        const clubMatch = ev.clubId?.name?.toLowerCase().includes(q);
        return titleMatch || descMatch || venueMatch || clubMatch;
      });
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.date) - new Date(a.date);
      }
      if (sortBy === 'popular') {
        return (b.registeredStudents?.length || 0) - (a.registeredStudents?.length || 0);
      }
      return new Date(a.date) - new Date(b.date);
    });
  }, [events, registeredEvents, activeTab, search, sortBy]);

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    if (!search.trim()) return announcements;
    const q = search.toLowerCase();
    return announcements.filter((ann) => {
      const titleMatch = ann.title?.toLowerCase().includes(q);
      const contentMatch = ann.content?.toLowerCase().includes(q);
      const clubMatch = ann.clubId?.name?.toLowerCase().includes(q);
      return titleMatch || contentMatch || clubMatch;
    });
  }, [announcements, search]);

  const copyToken = (token) => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    showToast('Pass token copied to clipboard', 'info');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  // Format Helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Scope Tabs
  const tabs = [
    {
      id: 'events',
      label: 'Upcoming Events',
      count: events.length,
      icon: Calendar
    },
    ...(user
      ? [
          {
            id: 'registered',
            label: 'My Registrations',
            count: registeredEvents.length,
            icon: Ticket
          }
        ]
      : []),
    {
      id: 'announcements',
      label: 'Announcements',
      count: announcements.length,
      icon: Megaphone
    }
  ];

  // Header Actions Cluster
  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => fetchData(true)}
        className="h-9 px-3 rounded-lg border border-gray-400 bg-background-100 text-xs font-medium text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
        title="Refresh events feed"
      >
        <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Refresh</span>
      </button>

      {user?.role === 'club' && (
        <Link
          to="/club/dashboard"
          className="h-9 px-4 rounded-lg bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Club Dashboard</span>
        </Link>
      )}
    </div>
  );

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (selectedEventForPass || selectedEventForDetail) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedEventForPass, selectedEventForDetail]);

  return (
    <div className="flex min-h-screen bg-background-100 text-gray-1000 font-sans selection:bg-gray-1000 selection:text-background-100">
      <Sidebar />
      <main className={`flex-1 min-w-0 bg-background-100 ${selectedEventForPass || selectedEventForDetail ? 'overflow-hidden' : ''}`}>
        <Topbar />

        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
          {/* Standardized Level 1 & 2 Page Header with Scope Tabs */}
          <PageHeader
            category="Campus Life"
            title="Events & Announcements"
            description="Discover student hackathons, workshops, cultural festivals, guest lectures, and official notices across campus."
            actions={headerActions}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => {
              setActiveTab(tabId);
              setSearch('');
            }}
          />

          {/* Level 3: Unified Single-Row Search & Filter Toolbar */}
          <div className="bg-background-100 border border-gray-400 rounded-xl p-2.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-gray-600 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  activeTab === 'announcements'
                    ? 'Search announcements by title, content, or club...'
                    : 'Search events by name, venue, or club...'
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-8 pl-9 pr-8 bg-transparent text-xs text-gray-1000 placeholder:text-gray-600 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 text-gray-600 hover:text-gray-1000 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: Sort & Count Controls (Only for Events tabs) */}
            {activeTab !== 'announcements' && (
              <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-400 sm:border-l sm:pl-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-mono text-gray-600 hidden md:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="h-8 px-2.5 bg-background-200 border border-gray-400 rounded-lg text-xs font-medium text-gray-800 hover:border-gray-600 focus:outline-none focus:border-gray-900 transition-colors cursor-pointer"
                  >
                    <option value="date_asc">Soonest Date</option>
                    <option value="date_desc">Latest Date</option>
                    <option value="popular">Most Attendees</option>
                  </select>
                </div>

                <span className="text-xs font-mono text-gray-600 hidden sm:inline px-1 select-none">
                  Showing {filteredEvents.length} of {activeTab === 'registered' ? registeredEvents.length : events.length}
                </span>
              </div>
            )}

            {activeTab === 'announcements' && (
              <div className="flex items-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-400 sm:border-l sm:pl-3">
                <span className="text-xs font-mono text-gray-600 hidden sm:inline px-1 select-none">
                  Showing {filteredAnnouncements.length} of {announcements.length}
                </span>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-96 rounded-xl border border-gray-400 bg-background-100 p-5 flex flex-col justify-between animate-pulse"
                >
                  <div className="space-y-4">
                    <div className="h-44 bg-gray-200 rounded-lg w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-9 bg-gray-200 rounded-lg w-full" />
                </div>
              ))}
            </div>
          ) : activeTab === 'announcements' ? (
            /* Announcements Feed */
            filteredAnnouncements.length > 0 ? (
              <div className="space-y-4">
                {filteredAnnouncements.map((ann) => {
                  const club = ann.clubId;
                  const dateStr = formatDate(ann.datePublished || ann.createdAt);

                  return (
                    <article
                      key={ann._id}
                      className="bg-background-100 border border-gray-400 hover:border-gray-600 rounded-xl p-5 shadow-2xs transition-colors"
                    >
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3">
                          <Link to={`/clubs/${club?._id}`} className="shrink-0 group">
                            {club?.profilePhoto ? (
                              <img
                                src={club.profilePhoto}
                                alt={club.name || 'Club'}
                                className="w-10 h-10 rounded-full object-cover border border-gray-400 group-hover:border-gray-900 transition-colors"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-background-200 border border-gray-400 flex items-center justify-center font-bold text-gray-800 text-xs">
                                {club?.name?.charAt(0) || 'C'}
                              </div>
                            )}
                          </Link>
                          <div>
                            <Link
                              to={`/clubs/${club?._id}`}
                              className="text-xs font-semibold text-gray-1000 hover:underline flex items-center gap-1.5"
                            >
                              <span>{club?.name || 'Campus Organization'}</span>
                              <ChevronRight className="w-3 h-3 text-gray-600" />
                            </Link>
                            <span className="text-[11px] font-mono text-gray-600">{dateStr}</span>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-background-200 text-gray-700 border border-gray-400">
                          <Megaphone className="w-2.5 h-2.5 text-gray-600" />
                          Official Notice
                        </span>
                      </div>

                      {/* Content */}
                      <h3 className="text-sm sm:text-base font-bold text-gray-1000 mb-2 tracking-tight">
                        {ann.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {ann.content}
                      </p>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* Empty State for Announcements */
              <div className="rounded-xl border border-gray-400 bg-background-100 p-12 text-center shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-full bg-background-200 border border-gray-400 flex items-center justify-center mx-auto text-gray-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-1000">No Announcements Found</h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  {search ? 'Try clearing your search query.' : 'There are currently no club announcements broadcasted.'}
                </p>
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="h-8 px-3 rounded-lg border border-gray-400 bg-background-200 text-xs font-medium text-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            )
          ) : (
            /* Events Grid (Upcoming or Registered) */
            filteredEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEvents.map((ev) => {
                  const club = ev.clubId;
                  const { isRegistered, qrCode } = getRegistrationInfo(ev);
                  const isRegistering = registeringEventId === ev._id;
                  const attendeeCount = ev.registeredStudents?.length || 0;
                  const eventDateStr = formatDate(ev.date);

                  return (
                    <div
                      key={ev._id}
                      className="bg-background-100 border border-gray-400 hover:border-gray-600 rounded-xl overflow-hidden shadow-2xs transition-all duration-200 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Poster Media Strip */}
                        <div className="relative aspect-[16/9] w-full bg-background-200 border-b border-gray-400 overflow-hidden">
                          {ev.posterImage ? (
                            <img
                              src={ev.posterImage}
                              alt={ev.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-background-100 to-background-200 p-4 text-center">
                              <Calendar className="w-8 h-8 text-gray-600 mb-1" />
                              <span className="text-[11px] font-mono text-gray-600 uppercase tracking-wider font-semibold">
                                Campus Event
                              </span>
                            </div>
                          )}

                          {/* Floating Top-Left Date Pill */}
                          <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-md bg-background-100/90 backdrop-blur-xs border border-gray-400 shadow-2xs flex items-center gap-1.5 text-[11px] font-mono font-medium text-gray-1000">
                            <Calendar className="w-3 h-3 text-gray-700" />
                            <span>{eventDateStr}</span>
                          </div>

                          {/* Floating Top-Right Registration Status */}
                          {isRegistered && (
                            <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-gray-1000 text-background-100 shadow-2xs flex items-center gap-1 text-[10px] font-mono font-bold tracking-tight">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Registered</span>
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                          {/* Club Meta Link */}
                          <div className="flex items-center justify-between gap-2">
                            <Link
                              to={`/clubs/${club?._id}`}
                              className="flex items-center gap-2 group/club hover:underline"
                            >
                              {club?.profilePhoto ? (
                                <img
                                  src={club.profilePhoto}
                                  alt={club.name || 'Club'}
                                  className="w-5 h-5 rounded-full object-cover border border-gray-400"
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-background-200 border border-gray-400 flex items-center justify-center text-[10px] font-bold text-gray-700">
                                  {club?.name?.charAt(0) || 'C'}
                                </div>
                              )}
                              <span className="text-xs font-medium text-gray-700 group-hover/club:text-gray-1000 transition-colors line-clamp-1">
                                {club?.name || 'Club'}
                              </span>
                            </Link>

                            <span className="text-[11px] font-mono text-gray-600 shrink-0 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{attendeeCount}</span>
                            </span>
                          </div>

                          {/* Event Title */}
                          <h3
                            onClick={() => setSelectedEventForDetail(ev)}
                            className="text-sm sm:text-base font-bold text-gray-1000 tracking-tight line-clamp-1 hover:text-gray-900 cursor-pointer"
                            title={ev.title}
                          >
                            {ev.title}
                          </h3>

                          {/* Details strip (Time & Venue) */}
                          <div className="space-y-1 text-xs text-gray-600 font-sans">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                              <span className="font-mono text-[11px] text-gray-700">{ev.time}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                              <span className="line-clamp-1">{ev.venue || 'Campus Venue TBA'}</span>
                            </div>
                          </div>

                          {/* Description Snippet */}
                          {ev.description && (
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {ev.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Card Action Footer */}
                      <div className="p-4 pt-0 space-y-2">
                        <div className="flex items-center gap-2">
                          {isRegistered ? (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedEventForPass({
                                  ...ev,
                                  currentUserQrCode: qrCode
                                })
                              }
                              className="flex-1 h-9 px-3 rounded-lg border border-gray-400 bg-background-100 hover:bg-gray-200 text-gray-1000 text-xs font-semibold shadow-2xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>View Digital Pass</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleRegister(ev)}
                              disabled={isRegistering}
                              className="flex-1 h-9 px-3 rounded-lg bg-gray-1000 text-background-100 hover:opacity-90 disabled:opacity-50 text-xs font-medium shadow-2xs flex items-center justify-center gap-1.5 transition-opacity cursor-pointer"
                            >
                              {isRegistering ? (
                                <>
                                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Registering...</span>
                                </>
                              ) : (
                                <>
                                  <span>Register Now</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedEventForDetail(ev)}
                            className="h-9 w-9 rounded-lg border border-gray-400 bg-background-100 hover:bg-gray-200 text-gray-700 hover:text-gray-1000 flex items-center justify-center shadow-2xs transition-colors cursor-pointer shrink-0"
                            title="View Event Details"
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State for Events */
              <div className="rounded-xl border border-gray-400 bg-background-100 p-12 text-center shadow-2xs space-y-3">
                <div className="w-10 h-10 rounded-full bg-background-200 border border-gray-400 flex items-center justify-center mx-auto text-gray-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-gray-1000">
                  {activeTab === 'registered' ? 'No Registered Events' : 'No Events Found'}
                </h3>
                <p className="text-xs text-gray-600 max-w-sm mx-auto">
                  {activeTab === 'registered'
                    ? 'You have not registered for any upcoming events yet. Check out the Upcoming Events tab to join!'
                    : search
                    ? 'No events match your current search query. Try clearing the filter.'
                    : 'There are no upcoming events scheduled at the moment. Check back soon!'}
                </p>
                {activeTab === 'registered' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('events')}
                    className="h-8 px-3 rounded-lg bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Browse Upcoming Events
                  </button>
                ) : search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="h-8 px-3 rounded-lg border border-gray-400 bg-background-200 text-xs font-medium text-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
                  >
                    Clear Search
                  </button>
                ) : null}
              </div>
            )
          )}
        </div>
      </main>

      {/* ======================================================== */}
      {/* 1. DIGITAL PASS & QR CODE MODAL                          */}
      {/* ======================================================== */}
      {selectedEventForPass && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEventForPass(null);
          }}
        >
          <div className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-400 flex items-center justify-between bg-background-200/50">
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gray-1000" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-gray-1000">
                  Event Entry Pass
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventForPass(null)}
                className="text-gray-600 hover:text-gray-1000 p-1 rounded-md cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-center">
              {/* Event Title & Club */}
              <div>
                <span className="text-[11px] font-mono text-gray-600 uppercase tracking-wider">
                  {selectedEventForPass.clubId?.name || 'Club'}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-gray-1000 mt-0.5 tracking-tight">
                  {selectedEventForPass.title}
                </h3>
              </div>

              {/* QR Code Container */}
              <div className="p-4 rounded-xl border border-gray-400 bg-white inline-block shadow-2xs">
                {selectedEventForPass.currentUserQrCode ? (
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                      selectedEventForPass.currentUserQrCode
                    )}`}
                    alt="Event QR Pass"
                    className="w-48 h-48 mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs font-mono text-gray-600">
                    Generating pass...
                  </div>
                )}
              </div>

              {/* Token Display with 1-Click Copy */}
              {selectedEventForPass.currentUserQrCode && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[11px] font-mono text-gray-600">Pass Token:</span>
                    <code className="text-xs font-mono font-bold text-gray-1000 bg-background-200 px-2 py-0.5 rounded border border-gray-400">
                      {selectedEventForPass.currentUserQrCode.slice(0, 16)}...
                    </code>
                    <button
                      type="button"
                      onClick={() => copyToken(selectedEventForPass.currentUserQrCode)}
                      className="p-1 rounded text-gray-600 hover:text-gray-1000 cursor-pointer"
                      title="Copy full token"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5 text-gray-1000" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Attendee Details & Instructions */}
              <div className="p-3 bg-background-200 rounded-xl border border-gray-400 text-left space-y-1.5 text-xs text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-600">Attendee:</span>
                  <span className="font-semibold text-gray-1000">{user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-mono text-gray-1000">{formatDate(selectedEventForPass.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time & Venue:</span>
                  <span className="text-gray-1000">
                    {selectedEventForPass.time} • {selectedEventForPass.venue}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-gray-600 leading-relaxed">
                Present this digital QR pass at the entrance. Organizers will scan it to verify your registration and mark your attendance.
              </p>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-400 bg-background-200/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEventForPass(null)}
                className="h-8 px-4 rounded-lg bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. EVENT DETAILS MODAL                                   */}
      {/* ======================================================== */}
      {selectedEventForDetail && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEventForDetail(null);
          }}
        >
          <div className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-400 flex items-center justify-between bg-background-200/50 shrink-0">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-1000" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-gray-1000">
                  Event Information
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventForDetail(null)}
                className="text-gray-600 hover:text-gray-1000 p-1 rounded-md cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Media Poster */}
              {selectedEventForDetail.posterImage && (
                <div className="w-full max-h-80 rounded-xl overflow-hidden border border-gray-400 bg-background-200 flex items-center justify-center p-1">
                  <img
                    src={selectedEventForDetail.posterImage}
                    alt={selectedEventForDetail.title}
                    className="max-h-76 max-w-full rounded-lg object-contain"
                  />
                </div>
              )}

              {/* Title & Host */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/clubs/${selectedEventForDetail.clubId?._id}`}
                    className="text-xs font-semibold text-gray-700 hover:text-gray-1000 hover:underline flex items-center gap-1"
                  >
                    <span>Hosted by {selectedEventForDetail.clubId?.name || 'Club'}</span>
                    <ExternalLink className="w-3 h-3 text-gray-600" />
                  </Link>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-1000 tracking-tight">
                  {selectedEventForDetail.title}
                </h2>
              </div>

              {/* Key Details Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-background-200 rounded-xl border border-gray-400 text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Date
                  </span>
                  <p className="font-semibold text-gray-1000 font-mono">
                    {formatDate(selectedEventForDetail.date)}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-gray-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Time
                  </span>
                  <p className="font-semibold text-gray-1000 font-mono">
                    {selectedEventForDetail.time}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-gray-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Venue
                  </span>
                  <p className="font-semibold text-gray-1000">
                    {selectedEventForDetail.venue || 'TBA'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-gray-600 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Registered
                  </span>
                  <p className="font-semibold text-gray-1000 font-mono">
                    {selectedEventForDetail.registeredStudents?.length || 0} students
                  </p>
                </div>

                {selectedEventForDetail.contactPerson && (
                  <div className="col-span-2 pt-2 border-t border-gray-400 space-y-1">
                    <span className="text-[11px] font-mono text-gray-600">Contact Organizer:</span>
                    <p className="font-medium text-gray-1000">{selectedEventForDetail.contactPerson}</p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider font-semibold text-gray-600">
                  About Event
                </h4>
                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedEventForDetail.description || 'No detailed description provided.'}
                </p>
              </div>
            </div>

            {/* Modal Footer with Registration Action */}
            <div className="p-4 border-t border-gray-400 bg-background-200/50 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedEventForDetail(null)}
                className="h-9 px-4 rounded-lg border border-gray-400 bg-background-100 text-xs font-medium text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Close
              </button>

              {(() => {
                const { isRegistered, qrCode } = getRegistrationInfo(selectedEventForDetail);
                if (isRegistered) {
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const evToPass = { ...selectedEventForDetail, currentUserQrCode: qrCode };
                        setSelectedEventForDetail(null);
                        setSelectedEventForPass(evToPass);
                      }}
                      className="h-9 px-4 rounded-lg bg-gray-1000 text-background-100 text-xs font-semibold hover:opacity-90 flex items-center gap-1.5 shadow-2xs transition-opacity cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>View Pass</span>
                    </button>
                  );
                }
                return (
                  <button
                    type="button"
                    onClick={() => {
                      handleRegister(selectedEventForDetail);
                      setSelectedEventForDetail(null);
                    }}
                    disabled={registeringEventId === selectedEventForDetail._id}
                    className="h-9 px-4 rounded-lg bg-gray-1000 text-background-100 text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shadow-2xs transition-opacity cursor-pointer"
                  >
                    <span>Register for Event</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
