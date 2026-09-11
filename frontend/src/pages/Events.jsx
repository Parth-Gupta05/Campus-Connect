import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { FiLoader, FiCalendar, FiMapPin, FiMessageSquare, FiCheck } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

export default function Events() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('events'); // 'events' or 'announcements'
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringEventId, setRegisteringEventId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, announcementsRes] = await Promise.all([
          axios.get('/events/public'),
          axios.get('/clubs/announcements/public')
        ]);
        
        // Sort events by date closest to now
        const sortedEvents = eventsRes.data.sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(sortedEvents);
        
        // Announcements come sorted by datePublished desc from backend, but double check
        setAnnouncements(announcementsRes.data.sort((a, b) => new Date(b.datePublished) - new Date(a.datePublished)));
      } catch (err) {
        console.error(err);
        showToast('Failed to load feed', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [showToast]);

  const handleRegister = async (event) => {
    setRegisteringEventId(event._id);
    try {
      await axios.post(`/events/${event._id}/register`);
      showToast('Successfully registered for event!', 'success');
      
      // Optimistic update
      setEvents(events.map(ev => {
        if (ev._id === event._id) {
          return {
            ...ev,
            registeredStudents: [...ev.registeredStudents, { studentId: { _id: user._id } }]
          };
        }
        return ev;
      }));
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setRegisteringEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <FiLoader className="animate-spin text-4xl text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-surface-container-lowest sm:bg-background">
        <Topbar />
        <div className="max-w-[600px] mx-auto w-full pb-12 sm:pt-6">
          
          <div className="hidden sm:block mb-6 text-center px-4">
            <h1 className="text-headline-md font-bold text-on-surface">For You</h1>
            <p className="text-sm text-on-surface-variant">Stay updated with the latest events across campus.</p>
          </div>

          {/* Sleek Instagram-style Tabs */}
          <div className="flex justify-center gap-8 mb-4 sm:mb-8 sticky top-0 z-10 bg-surface-container-lowest/95 sm:bg-background/95 backdrop-blur-md pt-4 pb-0 border-b border-border-light sm:rounded-t-2xl sm:mx-4">
            <button
              onClick={() => setActiveTab('events')}
              className={`pb-3 text-sm font-bold transition-colors relative ${
                activeTab === 'events' 
                  ? 'text-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Upcoming Events
              {activeTab === 'events' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`pb-3 text-sm font-bold transition-colors relative ${
                activeTab === 'announcements' 
                  ? 'text-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Announcements
              {activeTab === 'announcements' && <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full" />}
            </button>
          </div>

          <div className="space-y-4 sm:space-y-8 sm:px-4">
            {activeTab === 'events' ? (
              events.length > 0 ? (
                events.map(ev => {
                  const userId = user?.id || user?._id;
                  const isRegistered = ev.registeredStudents?.some(s => {
                    const sId = s.studentId?._id || s.studentId;
                    return sId?.toString() === userId?.toString();
                  });
                  const isRegistering = registeringEventId === ev._id;

                  return (
                    <article key={ev._id} className="bg-surface-container-lowest sm:rounded-xl sm:border border-border-light overflow-hidden transition-shadow shadow-sm mb-4 sm:mb-0 pb-2 sm:pb-0">
                      
                      {/* Header (Top) */}
                      <div className="flex items-center gap-3 p-4 sm:p-5">
                        <Link to={`/clubs/${ev.clubId?._id}`} className="shrink-0">
                          {ev.clubId?.profilePhoto ? (
                            <img src={ev.clubId.profilePhoto} alt="Club" className="w-10 h-10 rounded-full object-cover border border-border-light" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center font-bold text-on-surface-variant">
                              {ev.clubId?.name?.charAt(0) || '?'}
                            </div>
                          )}
                        </Link>
                        <div className="flex-1">
                          <Link to={`/clubs/${ev.clubId?._id}`} className="font-bold text-sm text-on-surface hover:underline">{ev.clubId?.name}</Link>
                          <p className="text-xs text-on-surface-variant">Posted an event</p>
                        </div>
                      </div>

                      {/* Media (Edge to edge) */}
                      {ev.posterImage && (
                        <div className="w-full bg-surface-variant border-y border-border-light relative">
                          <img src={ev.posterImage} alt={ev.title} className="w-full max-h-[500px] object-cover" />
                        </div>
                      )}

                      {/* Body */}
                      <div className="p-4 sm:p-5">
                        <h3 className="text-title-lg font-bold mb-2 text-on-surface leading-tight">{ev.title}</h3>
                        
                        <div className="flex flex-col gap-1.5 mb-4 text-sm text-on-surface-variant font-medium">
                          <span className="flex items-center gap-2">
                            <FiCalendar className="text-primary shrink-0 text-base" /> 
                            {new Date(ev.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {ev.time}
                          </span>
                          <span className="flex items-center gap-2">
                            <FiMapPin className="text-primary shrink-0 text-base" /> {ev.venue}
                          </span>
                        </div>

                        <p className="text-body-md text-on-surface whitespace-pre-wrap mb-2 line-clamp-4 hover:line-clamp-none transition-all cursor-pointer">{ev.description}</p>
                      </div>

                      {/* Action Bar */}
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                        {isRegistered ? (
                          <button disabled className="w-full py-2.5 bg-surface-variant text-primary rounded-lg font-bold flex items-center justify-center gap-2 opacity-80 text-sm">
                            <FiCheck className="text-lg" /> Registered
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleRegister(ev)}
                            disabled={isRegistering}
                            className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-bold hover:bg-primary-container disabled:opacity-50 flex items-center justify-center gap-2 transition-colors text-sm"
                          >
                            {isRegistering ? <><FiLoader className="animate-spin text-lg" /> Processing...</> : 'Register Now'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="text-center py-20 text-on-surface-variant bg-surface-container-lowest sm:rounded-xl sm:border border-border-light">
                  <FiCalendar className="text-4xl mx-auto mb-3 opacity-50" />
                  <h3 className="text-title-md font-bold text-on-surface">No Upcoming Events</h3>
                  <p className="text-sm">Check back later for new events across campus.</p>
                </div>
              )
            ) : (
              announcements.length > 0 ? (
                announcements.map(ann => (
                  <article key={ann._id} className="bg-surface-container-lowest sm:rounded-xl sm:border border-border-light overflow-hidden transition-shadow shadow-sm mb-4 sm:mb-0">
                    <div className="flex items-start gap-3 p-4 sm:p-5">
                      <Link to={`/clubs/${ann.clubId?._id}`} className="shrink-0">
                        {ann.clubId?.profilePhoto ? (
                          <img src={ann.clubId.profilePhoto} alt="Club" className="w-10 h-10 rounded-full object-cover border border-border-light" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center font-bold text-on-surface-variant">
                            {ann.clubId?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </Link>
                      <div className="flex-1 pt-0.5">
                        <div className="flex justify-between items-start">
                          <Link to={`/clubs/${ann.clubId?._id}`} className="font-bold text-sm text-on-surface hover:underline">{ann.clubId?.name}</Link>
                          <p className="text-xs text-on-surface-variant">{new Date(ann.datePublished).toLocaleDateString()}</p>
                        </div>
                        <h3 className="text-label-lg font-bold mt-2 mb-1 text-on-surface">{ann.title}</h3>
                        <p className="text-body-sm text-on-surface whitespace-pre-wrap">{ann.content}</p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="text-center py-20 text-on-surface-variant bg-surface-container-lowest sm:rounded-xl sm:border border-border-light">
                  <FiMessageSquare className="text-4xl mx-auto mb-3 opacity-50" />
                  <h3 className="text-title-md font-bold text-on-surface">No Announcements</h3>
                  <p className="text-sm">No recent announcements from clubs.</p>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
