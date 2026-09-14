import React, { useState, useEffect, useContext, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import PageHeader from '../components/ui/PageHeader';
import { AuthContext } from '../context/AuthContext';
import {
  RotateCw,
  Search,
  X,
  Users,
  Building2,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  SlidersHorizontal,
  Compass,
  Award
} from 'lucide-react';
import AicteDiaryView from '../components/AicteDiaryView';

export default function Clubs() {
  const { user } = useContext(AuthContext);
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClubs = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await axios.get('/clubs');
      setClubs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching clubs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  // Check if current user is an assigned member of a club
  const isUserMember = (club) => {
    if (!user?._id || !club.assignedStudents) return false;
    return club.assignedStudents.some((member) => {
      const memberId = member.studentId?._id || member.studentId || member;
      return memberId?.toString() === user._id?.toString();
    });
  };

  // Filtered & Sorted Clubs
  const { filteredAndSortedClubs, myClubsCount } = useMemo(() => {
    const myClubs = clubs.filter((c) => isUserMember(c));
    const myClubsCount = myClubs.length;

    let base = activeTab === 'my_clubs' ? myClubs : clubs;

    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q)
      );
    }

    const sorted = [...base].sort((a, b) => {
      if (sortBy === 'members') {
        const aCount = a.assignedStudents?.length || 0;
        const bCount = b.assignedStudents?.length || 0;
        return bCount - aCount;
      }
      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    return { filteredAndSortedClubs: sorted, myClubsCount };
  }, [clubs, search, activeTab, sortBy, user]);

  // Scope Tabs definition
  const tabs = [
    {
      id: 'all',
      label: 'All Organizations',
      count: clubs.length,
      icon: Building2
    },
    ...(user
      ? [
          {
            id: 'my_clubs',
            label: 'My Clubs',
            count: myClubsCount,
            icon: UserCheck
          },
          ...(user.role === 'student'
            ? [
                {
                  id: 'aicte_diary',
                  label: 'AICTE Activity Diary',
                  badge: '100 Pts Target',
                  icon: Award
                }
              ]
            : [])
        ]
      : [])
  ];

  // Header Actions
  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => fetchClubs(true)}
        className="h-9 px-3 rounded-lg border border-gray-400 bg-background-100 text-xs font-medium text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
        title="Refresh clubs list"
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

  return (
    <div className="flex min-h-screen bg-background-100 text-gray-1000 font-sans selection:bg-gray-1000 selection:text-background-100">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-background-100">
        <Topbar />

        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
          {/* Standardized Level 1 & 2 Page Header with Scope Tabs */}
          <PageHeader
            category="Campus Directory"
            title="Clubs & Student Organizations"
            description="Discover student-led technical societies, cultural associations, and specialized clubs across campus."
            actions={headerActions}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId)}
          />

          {/* Level 3: AICTE Activity Diary Tab Content OR Clubs Directory */}
          {activeTab === 'aicte_diary' ? (
            <AicteDiaryView />
          ) : (
            <>
              {/* Level 3: Unified Single-Row Search & Sort Toolbar */}
              <div className="bg-background-100 border border-gray-400 rounded-xl p-2.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-gray-600 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search clubs by name or keywords..."
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

            {/* Right: Sort & Count Controls */}
            <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-400 sm:border-l sm:pl-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-gray-600 hidden md:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-8 px-2.5 bg-background-200 border border-gray-400 rounded-lg text-xs font-medium text-gray-800 hover:border-gray-600 focus:outline-none focus:border-gray-900 transition-colors cursor-pointer"
                >
                  <option value="name">Name (A - Z)</option>
                  <option value="members">Most Members</option>
                  <option value="newest">Newest Added</option>
                </select>
              </div>

              <span className="text-xs font-mono text-gray-600 hidden sm:inline px-1 select-none">
                Showing {filteredAndSortedClubs.length} of {clubs.length}
              </span>
            </div>
          </div>

          {/* Clubs Grid */}
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-background-100 border border-gray-400 rounded-xl overflow-hidden animate-pulse shadow-2xs flex flex-col"
                >
                  <div className="relative">
                    <div className="h-32 sm:h-36 bg-background-200 border-b border-gray-400" />
                    <div className="absolute -bottom-6 left-5 w-14 h-14 rounded-xl bg-background-200 border-2 border-background-100 shadow-sm" />
                  </div>
                  <div className="p-5 pt-8 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-end">
                        <div className="w-20 h-4 bg-background-200 rounded" />
                      </div>
                      <div className="w-2/3 h-5 bg-background-200 rounded" />
                      <div className="w-full h-3 bg-background-200 rounded" />
                      <div className="w-4/5 h-3 bg-background-200 rounded" />
                    </div>
                    <div className="border-t border-gray-400 pt-3 flex justify-between items-center">
                      <div className="w-24 h-3 bg-background-200 rounded" />
                      <div className="w-4 h-4 bg-background-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredAndSortedClubs.length === 0 ? (
            /* Empty State */
            <div className="bg-background-100 border border-dashed border-gray-400 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto shadow-2xs">
              <div className="w-12 h-12 rounded-xl bg-background-200 border border-gray-400 text-gray-700 mx-auto flex items-center justify-center shadow-2xs">
                <Building2 className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-1000">
                  {activeTab === 'my_clubs'
                    ? "You haven't joined any clubs yet"
                    : 'No clubs found matching your search'}
                </h3>
                <p className="text-xs text-gray-700 font-sans">
                  {activeTab === 'my_clubs'
                    ? 'Explore the campus directory and connect with technical or cultural clubs.'
                    : 'Try clearing your search query or sorting to browse all organizations.'}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2.5">
                {activeTab === 'my_clubs' ? (
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="h-8 px-4 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity shadow-xs cursor-pointer"
                  >
                    Browse All Organizations
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="h-8 px-3.5 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-gray-800 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                  >
                    Clear Search Filter
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Main Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAndSortedClubs.map((club) => {
                const isMember = isUserMember(club);
                const memberCount = club.assignedStudents?.length || 0;

                return (
                  <Link
                    to={`/clubs/${club._id}`}
                    key={club._id}
                    className="group bg-background-100 border border-gray-400 rounded-xl overflow-hidden hover:border-gray-900 transition-all duration-200 shadow-2xs hover:shadow-xs flex flex-col cursor-pointer"
                  >
                    {/* Banner Header with Overlapping Logo */}
                    <div className="relative">
                      {/* Banner Photo Container (overflow-hidden keeps zoom effect inside) */}
                      <div className="h-32 sm:h-36 relative overflow-hidden bg-background-200 border-b border-gray-400">
                        {club.bannerPhoto ? (
                          <img
                            src={club.bannerPhoto}
                            alt={club.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-background-200 via-background-100 to-background-200 relative">
                            <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:12px_12px]" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                        {/* Top Right Status Badges (Inside Banner) */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                          {isMember && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/90 text-white shadow-xs backdrop-blur-xs">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              Member
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Overlapping Club Profile Logo (Placed outside overflow-hidden so it doesn't get clipped!) */}
                      <div className="absolute -bottom-6 left-5 w-14 h-14 rounded-xl bg-background-100 border-2 border-background-100 shadow-md flex items-center justify-center p-0.5 z-20 overflow-hidden">
                        {club.profilePhoto ? (
                          <img
                            src={club.profilePhoto}
                            alt={club.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-full bg-background-200 text-gray-900 flex items-center justify-center font-mono font-bold text-lg rounded-lg">
                            {club.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 pt-8 flex-1 flex flex-col justify-between">
                      <div>
                        {/* Member Count Pill (Right-aligned to balance with floating left logo) */}
                        <div className="flex items-center justify-end gap-2 mb-2 min-h-[26px]">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background-200 border border-gray-400 text-gray-700 font-mono text-[11px]">
                            <Users className="w-3 h-3 text-gray-600" />
                            <span>
                              {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
                            </span>
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="font-bold text-base text-gray-1000 group-hover:text-gray-900 transition-colors line-clamp-1">
                          {club.name}
                        </h2>

                        {/* Description */}
                        <p className="text-xs text-gray-700 line-clamp-2 mt-2 leading-relaxed font-sans">
                          {club.description ||
                            'Dedicated student organization advancing peer learning, technical projects, and campus activities.'}
                        </p>
                      </div>

                      {/* Footer Link Strip */}
                      <div className="border-t border-gray-400 pt-3.5 mt-5 flex items-center justify-between text-xs font-medium text-gray-700 group-hover:text-gray-1000 transition-colors">
                        <span className="group-hover:underline">Explore Club & Events</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })}
              </div>
            )}
          </>
        )}
        </div>
      </main>
    </div>
  );
}
