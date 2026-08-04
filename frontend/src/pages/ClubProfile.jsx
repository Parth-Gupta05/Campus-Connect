import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { FiLoader, FiCalendar, FiMapPin, FiMessageSquare, FiUsers, FiCheck } from 'react-icons/fi';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';

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
        const [clubRes, eventsRes, announcementsRes] = await Promise.all([
          axios.get(`/clubs/${id}`),
          axios.get(`/events/public?clubId=${id}`),
          axios.get('/clubs/announcements/public')
        ]);
        setClub(clubRes.data);
        setEvents(eventsRes.data);
        // Filter announcements on client-side for now since public route gets all
        setAnnouncements(announcementsRes.data.filter(a => a.clubId?._id === id));
      } catch (err) {
        console.error(err);
        showToast('Failed to load club details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchClubData();
  }, [id, showToast]);

  const handleRegister = async () => {
    if (!selectedEvent) return;
    setRegistering(true);
    try {
      await axios.post(`/events/${selectedEvent._id}/register`);
      showToast('Successfully registered for event!', 'success');
      
      // Update local state to reflect registration
      setEvents(events.map(ev => {
        if (ev._id === selectedEvent._id) {
          return {
            ...ev,
            registeredStudents: [...ev.registeredStudents, { studentId: user._id }]
          };
        }
        return ev;
      }));
      
      setSelectedEvent(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><FiLoader className="animate-spin text-4xl text-primary" /></div>;
  if (!club) return <div className="flex min-h-screen items-center justify-center bg-background"><p>Club not found</p></div>;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Topbar />
        {/* Banner Area */}
        <div className="relative h-48 md:h-72 bg-surface-variant">
          {club.bannerPhoto ? (
            <img src={club.bannerPhoto} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-ai-gradient-start opacity-20"></div>
          )}
          <div className="absolute -bottom-16 left-8 md:left-12 flex items-end">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-surface border-4 border-background overflow-hidden flex items-center justify-center">
              {club.profilePhoto ? (
                <img src={club.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <FiUsers className="text-5xl text-on-surface-variant" />
              )}
            </div>
          </div>
        </div>

        <div className="mt-20 px-8 md:px-12 max-w-container-max mx-auto pb-16">
          <h1 className="font-display-hero text-headline-lg font-bold shadow-sm">{club.name}</h1>
          <p className="text-on-surface-variant mt-4 text-body-lg max-w-3xl whitespace-pre-wrap">{club.description || 'No description provided.'}</p>
          
          <div className="flex gap-4 mt-6">
            <div className="px-4 py-2 bg-surface-variant text-on-surface-variant rounded-full text-sm font-medium">
              {club.assignedStudents?.length || 0} Members
            </div>
            <div className="px-4 py-2 bg-primary-container text-on-primary-container rounded-full text-sm font-medium">
              {events.length} Upcoming Events
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Events */}
            <div>
              <h2 className="text-title-lg font-bold mb-6 flex items-center gap-2"><FiCalendar /> Upcoming Events</h2>
              <div className="space-y-4">
                {events.map(ev => (
                  <div key={ev._id} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border-light hover:shadow-md transition-shadow">
                    {ev.posterImage && (
                      <div className="w-full h-40 mb-4 bg-surface-variant overflow-hidden rounded-lg">
                        <img src={ev.posterImage} alt={ev.title} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                      </div>
                    )}
                    <h3 className="text-label-lg font-bold">{ev.title}</h3>
                    <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-2">
                      <FiCalendar /> {new Date(ev.date).toLocaleDateString()} at {ev.time}
                    </p>
                    <p className="text-sm text-on-surface-variant flex items-center gap-2 mt-1">
                      <FiMapPin /> {ev.venue}
                    </p>
                    <p className="text-body-md mt-4 line-clamp-3">{ev.description}</p>
                    
                    {ev.registeredStudents?.some(s => s.studentId === user?._id || s.studentId?._id === user?._id) ? (
                      <button 
                        disabled
                        className="mt-6 w-full py-2 bg-surface-variant text-primary rounded-lg font-medium flex items-center justify-center gap-2 opacity-80"
                      >
                        <FiCheck /> Already Registered
                      </button>
                    ) : (
                      <button 
                        onClick={() => setSelectedEvent(ev)}
                        className="mt-6 w-full py-2 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container transition-colors"
                      >
                        Register Now
                      </button>
                    )}
                  </div>
                ))}
                {events.length === 0 && <p className="text-on-surface-variant">No upcoming events right now.</p>}
              </div>
            </div>

            {/* Announcements */}
            <div>
              <h2 className="text-title-lg font-bold mb-6 flex items-center gap-2"><FiMessageSquare /> Announcements</h2>
              <div className="space-y-4">
                {announcements.map(ann => (
                  <div key={ann._id} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-border-light">
                    <h3 className="text-label-lg font-bold">{ann.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-1 mb-4">{new Date(ann.datePublished).toLocaleString()}</p>
                    <p className="text-body-md whitespace-pre-wrap">{ann.content}</p>
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-on-surface-variant">No announcements posted recently.</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Registration Modal */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl border border-border-light">
              <h2 className="text-headline-sm font-bold mb-2">Register for Event</h2>
              <p className="text-on-surface-variant mb-6">You are about to register for <strong>{selectedEvent.title}</strong>.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setSelectedEvent(null)} 
                  disabled={registering}
                  className="flex-1 py-3 bg-surface-variant text-on-surface-variant rounded-lg font-medium hover:bg-outline-variant disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRegister} 
                  disabled={registering}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-lg font-medium hover:bg-primary-container disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {registering ? <><FiLoader className="animate-spin" /> Processing...</> : 'Confirm Registration'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
