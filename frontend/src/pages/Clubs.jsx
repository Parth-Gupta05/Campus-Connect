import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { FiLoader, FiSearch, FiUsers } from 'react-icons/fi';

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const res = await axios.get('/clubs');
        setClubs(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClubs();
  }, []);

  const filteredClubs = clubs.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      <Sidebar />
      <main className="flex-1 p-6 md:p-12 overflow-y-auto">
        <div className="max-w-container-max mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="font-display-hero text-display-md text-on-surface font-bold tracking-tight">College Clubs</h1>
              <p className="text-on-surface-variant mt-2">Discover and join technical and cultural clubs across the campus.</p>
            </div>
            <div className="relative w-full md:w-80">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"><FiSearch /></span>
              <input 
                type="text" 
                placeholder="Search clubs..." 
                className="w-full pl-11 p-3 bg-surface border border-outline-variant rounded-xl focus:outline-none focus:border-primary transition-colors"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center p-12"><FiLoader className="animate-spin text-4xl text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClubs.map(club => (
                <Link to={`/clubs/${club._id}`} key={club._id} className="bg-surface-container-lowest rounded-2xl border border-border-light shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                  <div className="h-32 bg-surface-variant relative">
                    {club.bannerPhoto ? (
                      <img src={club.bannerPhoto} alt={club.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-ai-gradient-start opacity-20"></div>
                    )}
                    <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-xl bg-surface border-4 border-surface-container-lowest overflow-hidden flex items-center justify-center">
                      {club.profilePhoto ? (
                        <img src={club.profilePhoto} alt={club.name} className="w-full h-full object-cover" />
                      ) : (
                        <FiUsers className="text-2xl text-on-surface-variant" />
                      )}
                    </div>
                  </div>
                  <div className="p-6 pt-10">
                    <h2 className="font-headline-sm font-bold text-on-surface mb-2 group-hover:text-primary transition-colors">{club.name}</h2>
                    <p className="text-body-md text-on-surface-variant line-clamp-2">{club.description || 'No description provided.'}</p>
                  </div>
                </Link>
              ))}
              {filteredClubs.length === 0 && (
                <div className="col-span-full text-center py-12 text-on-surface-variant">
                  No clubs found matching your search.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
