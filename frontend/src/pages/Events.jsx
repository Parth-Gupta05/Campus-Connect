import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
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
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-12">
          
          <div className="mb-10 text-center">
            <h1 className="text-display-sm font-display-hero font-bold mb-4">Campus Feed</h1>
            <p className="text-on-surface-variant">Stay updated with the latest events and announcements across campus.</p>
          </div>

          {/* YouTube-style Tabs/Chips */}
          <div className="flex justify-center gap-3 mb-10 sticky top-4 z-10 backdrop-blur-md bg-background/80 py-3 rounded-full">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                activeTab === 'events' 
                  ? 'bg-primary text-on-primary shadow-md' 
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              Upcoming Events
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                activeTab === 'announcements' 
                  ? 'bg-primary text-on-primary shadow-md' 
                  : 'bg-surface-container hover:bg-surface-variant text-on-surface'
              }`}
            >
              Announcements
            </button>
          </div>

          <div className="space-y-8">
            {activeTab === 'events' ? (
              events.length > 0 ? (
                events.map(ev => {
                  const isRegistered = ev.registeredStudents?.some(s => s.studentId === user?._id || s.studentId?._id === user?._id);
                  const isRegistering = registeringEventId === ev._id;

                  return (
                    <article key={ev._id} className="bg-surface-container-lowest rounded-2xl shadow-sm border border-border-light overflow-hidden transition-shadow hover:shadow-md">
                      {ev.posterImage && (
                        <div className="w-full h-48 md:h-64 bg-surface-variant overflow-hidden">
                          <img src={ev.posterImage} alt={ev.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                        </div>
                      )}
                      <div className="p-6 md:p-8">
                        <div className="flex items-center gap-3 mb-4">
                          <Link to={`/clubs/${ev.clubId?._id}`} className="shrink-0">
                            {ev.clubId?.profilePhoto ? (
                              <img src={ev.clubId.profilePhoto} alt="Club" className="w-10 h-10 rounded-full object-cover border border-border-light" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center font-bold text-on-surface-variant">
                                {ev.clubId?.name?.charAt(0) || '?'}
                              </div>
                            )}
                          </Link>
                          <div>
                            <Link to={`/clubs/${ev.clubId?._id}`} className="font-bold text-sm hover:underline">{ev.clubId?.name}</Link>
                            <p className="text-xs text-on-surface-variant">Posted an event</p>
                          </div>
                        </div>

                        <h3 className="text-title-lg md:text-headline-sm font-bold mb-3">{ev.title}</h3>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mb-4 text-sm text-on-surface-variant font-medium">
                          <span className="flex items-center gap-2">
                            <FiCalendar className="text-primary" /> {new Date(ev.date).toLocaleDateString()} at {ev.time}
                          </span>
                          <span className="flex items-center gap-2">
                            <FiMapPin className="text-primary" /> {ev.venue}
                          </span>
                        </div>

                        <p className="text-body-lg text-on-surface whitespace-pre-wrap mb-6">{ev.description}</p>

                        <div className="pt-4 border-t border-border-light">
                          {isRegistered ? (
                            <button disabled className="w-full sm:w-auto px-6 py-2.5 bg-surface-variant text-primary rounded-lg font-medium flex items-center justify-center gap-2 opacity-80">
                              <FiCheck /> Already Registered
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleRegister(ev)}
                              disabled={isRegistering}
                              className="w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                            >
                              {isRegistering ? <><FiLoader className="animate-spin" /> Processing...</> : 'Register Now'}
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="text-center py-20 text-on-surface-variant">
                  <FiCalendar className="text-6xl mx-auto mb-4 opacity-50" />
                  <h3 className="text-title-lg font-bold">No Upcoming Events</h3>
                  <p>Check back later for new events across campus.</p>
                </div>
              )
            ) : (
              announcements.length > 0 ? (
                announcements.map(ann => (
                  <article key={ann._id} className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-sm border border-border-light transition-shadow hover:shadow-md">
                    <div className="flex items-center gap-3 mb-6">
                      <Link to={`/clubs/${ann.clubId?._id}`} className="shrink-0">
                        {ann.clubId?.profilePhoto ? (
                          <img src={ann.clubId.profilePhoto} alt="Club" className="w-12 h-12 rounded-full object-cover border border-border-light" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-surface-variant flex items-center justify-center font-bold text-on-surface-variant text-lg">
                            {ann.clubId?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </Link>
                      <div>
                        <Link to={`/clubs/${ann.clubId?._id}`} className="font-bold text-label-lg hover:underline">{ann.clubId?.name}</Link>
                        <p className="text-xs text-on-surface-variant">{new Date(ann.datePublished).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <h3 className="text-title-lg font-bold mb-3">{ann.title}</h3>
                    <p className="text-body-lg whitespace-pre-wrap">{ann.content}</p>
                  </article>
                ))
              ) : (
                <div className="text-center py-20 text-on-surface-variant">
                  <FiMessageSquare className="text-6xl mx-auto mb-4 opacity-50" />
                  <h3 className="text-title-lg font-bold">No Announcements</h3>
                  <p>No recent announcements from clubs.</p>
                </div>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
