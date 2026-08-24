import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import PlacementFilterBar from '../components/PlacementFilterBar';
import PlacementPostCard from '../components/PlacementPostCard';

import {
  FiPlus,
  FiBriefcase,
  FiTrendingUp,
  FiAward,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';

export default function PlacementFeed() {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [meta, setMeta] = useState({ companies: [], branches: [], graduationYears: [], tags: [] });

  // Filters State
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    company: searchParams.get('company') || '',
    postType: searchParams.get('postType') || '',
    difficulty: searchParams.get('difficulty') || '',
    outcome: searchParams.get('outcome') || '',
    assessmentType: searchParams.get('assessmentType') || '',
    interviewType: searchParams.get('interviewType') || '',
    branch: searchParams.get('branch') || '',
    jobType: searchParams.get('jobType') || '',
    sort: searchParams.get('sort') || 'recent',
    bookmarkedOnly: searchParams.get('bookmarkedOnly') || '',
    myPostsOnly: searchParams.get('myPostsOnly') || '',
    page: 1,
    limit: 10
  });

  // Fetch filter metadata (distinct companies, branches, etc.)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await axios.get('/placements/filters/meta');
        setMeta(res.data || {});
      } catch (err) {
        console.error('Error fetching filter meta:', err);
      }
    };
    fetchMeta();
  }, []);

  // Fetch feed posts
  const fetchFeed = async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = {};
      Object.keys(filters).forEach((k) => {
        if (filters[k]) params[k] = filters[k];
      });

      const res = await axios.get('/placements', { params });
      if (isLoadMore) {
        setPosts((prev) => [...prev, ...(res.data.posts || [])]);
      } else {
        setPosts(res.data.posts || []);
      }
      setTotalCount(res.data.totalCount || 0);
    } catch (err) {
      console.error('Error fetching placement feed:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchFeed(false);
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      company: '',
      postType: '',
      difficulty: '',
      outcome: '',
      assessmentType: '',
      interviewType: '',
      branch: '',
      jobType: '',
      sort: 'recent',
      bookmarkedOnly: '',
      myPostsOnly: '',
      page: 1,
      limit: 10
    });
  };

  const handleLoadMore = () => {
    setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
  };

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-surface custom-scrollbar">
        <Topbar />

        <div className="max-w-5xl w-full mx-auto px-4 md:px-8 py-8 space-y-6">
          {/* Hero Banner Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-container to-secondary-container rounded-3xl p-6 md:p-8 text-on-primary shadow-md">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-extrabold uppercase tracking-wider">
                  Community Hub
                </span>
                <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                  Placement &amp; Interview Experiences
                </h1>
                <p className="text-sm md:text-base text-white/80 leading-relaxed">
                  Real interview questions, coding round breakdowns, HR insights, and packages shared by seniors and peers.
                </p>
              </div>

              {/* Share Experience Button */}
              <Link
                to="/placements/create"
                className="shrink-0 flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-surface-container-lowest text-primary hover:bg-white text-sm font-extrabold shadow-lg hover:scale-105 transition-all cursor-pointer"
              >
                <FiPlus className="text-lg" />
                <span>Share Experience</span>
              </Link>
            </div>

            {/* Subtle decorative background circles */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -left-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
          </div>

          {/* Filter Bar */}
          <PlacementFilterBar
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            meta={meta}
            isLoggedIn={Boolean(user)}
          />

          {/* Results Summary & Refresh */}
          <div className="flex items-center justify-between text-xs font-semibold text-on-surface-variant px-1 select-none">
            <div>
              Showing <span className="font-bold text-on-surface">{posts.length}</span> of{' '}
              <span className="font-bold text-on-surface">{totalCount}</span> experiences
            </div>

            <button
              type="button"
              onClick={() => fetchFeed(false)}
              className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
            >
              <FiRefreshCw className={`text-xs ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Feed</span>
            </button>
          </div>

          {/* Post Feed List */}
          {loading ? (
            <div className="space-y-4 py-8">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-surface-container-lowest border border-border-light rounded-2xl p-6 animate-pulse space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-surface-variant"></div>
                    <div className="space-y-2 flex-1">
                      <div className="w-1/3 h-4 bg-surface-variant rounded"></div>
                      <div className="w-1/4 h-3 bg-surface-variant rounded"></div>
                    </div>
                  </div>
                  <div className="w-3/4 h-5 bg-surface-variant rounded"></div>
                  <div className="w-full h-12 bg-surface-variant rounded"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="bg-surface-container-lowest border border-dashed border-border-light rounded-3xl p-12 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center text-3xl">
                <FiBriefcase />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-lg font-bold text-on-surface">No experiences found</h3>
                <p className="text-sm text-on-surface-variant">
                  Try adjusting your filters or be the first to share an interview experience for this company!
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-4 py-2.5 rounded-xl border border-border-light hover:bg-surface-variant text-xs font-bold transition-colors"
                >
                  Reset Filters
                </button>
                <Link
                  to="/placements/create"
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold transition-colors shadow-xs"
                >
                  Share an Experience
                </Link>
              </div>
            </div>
          ) : (
            /* Feed Cards Grid / Stream */
            <div className="space-y-4">
              {posts.map((post) => (
                <PlacementPostCard key={post._id} post={post} />
              ))}

              {/* Load More Button */}
              {posts.length < totalCount && (
                <div className="pt-6 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="px-8 py-3 rounded-2xl bg-surface-container-lowest border border-border-light hover:border-primary text-on-surface hover:text-primary text-sm font-bold shadow-xs hover:shadow-md transition-all disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    {loadingMore ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span>Loading more experiences...</span>
                      </>
                    ) : (
                      <span>Load More Experiences ({totalCount - posts.length} remaining)</span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
