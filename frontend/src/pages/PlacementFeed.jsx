import React, { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import PageHeader from '../components/ui/PageHeader';
import PlacementFilterBar from '../components/PlacementFilterBar';
import PlacementPostCard from '../components/PlacementPostCard';
import {
  Briefcase,
  RotateCw,
  Plus,
  Loader2,
  Sparkles,
  Bookmark,
  UserCheck
} from 'lucide-react';

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

  const [tabCounts, setTabCounts] = useState({ all: 0, saved: 0, my_posts: 0 });

  // Fetch filter metadata (distinct companies, branches, and tab counts)
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await axios.get('/placements/filters/meta');
        setMeta(res.data || {});
        if (res.data?.counts) {
          setTabCounts({
            all: res.data.counts.all || 0,
            saved: res.data.counts.saved || 0,
            my_posts: res.data.counts.myPosts || 0
          });
        }
      } catch (err) {
        console.error('Error fetching filter meta:', err);
      }
    };
    fetchMeta();
  }, [user]);

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
      const count = res.data.totalCount || 0;
      setTotalCount(count);

      // Keep active tab count in sync
      setTabCounts((prev) => {
        if (filters.bookmarkedOnly) return { ...prev, saved: count };
        if (filters.myPostsOnly) return { ...prev, my_posts: count };
        return { ...prev, all: count };
      });
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

  const currentTab = filters.bookmarkedOnly ? 'saved' : (filters.myPostsOnly ? 'my_posts' : 'all');

  const handleTabChange = (tabId) => {
    if (tabId === 'saved') {
      setFilters((prev) => ({ ...prev, bookmarkedOnly: 'true', myPostsOnly: '', page: 1 }));
    } else if (tabId === 'my_posts') {
      setFilters((prev) => ({ ...prev, bookmarkedOnly: '', myPostsOnly: 'true', page: 1 }));
    } else {
      setFilters((prev) => ({ ...prev, bookmarkedOnly: '', myPostsOnly: '', page: 1 }));
    }
  };

  const tabs = [
    { id: 'all', label: 'All Experiences', count: tabCounts.all, icon: Briefcase },
    ...(user
      ? [
          { id: 'saved', label: 'Saved', count: tabCounts.saved, icon: Bookmark },
          { id: 'my_posts', label: 'My Experiences', count: tabCounts.my_posts, icon: UserCheck }
        ]
      : [])
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => fetchFeed(false)}
        className="h-9 px-3 rounded-lg border border-gray-400 bg-background-100 text-xs font-medium text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
        title="Refresh feed"
      >
        <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Refresh</span>
      </button>

      <Link
        to="/placements/create"
        className="h-9 px-4 rounded-lg bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
      >
        <Plus className="w-3.5 h-3.5" strokeWidth={2} />
        <span>Share Experience</span>
      </Link>
    </div>
  );

  return (
    <div className="flex-1 min-w-0 bg-background-100">
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
          {/* Standardized Level 1 & 2 Page Header with Scope Tabs */}
          <PageHeader
            category="Placements"
            title="Placement & Interview Experiences"
            description="Interview questions, online assessment breakdowns, and package offers shared by students and alumni."
            actions={headerActions}
            tabs={tabs}
            activeTab={currentTab}
            onTabChange={handleTabChange}
          />

          {/* Level 3 Unified Single-Row Search & Filter Toolbar */}
          <PlacementFilterBar
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            meta={meta}
            totalCount={totalCount}
          />

          {/* Post Feed List */}
          {loading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-background-100 border border-gray-400 rounded-xl p-5 animate-pulse space-y-4 shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-background-200 border border-gray-400"></div>
                    <div className="space-y-2 flex-1">
                      <div className="w-1/3 h-3.5 bg-background-200 rounded"></div>
                      <div className="w-1/4 h-2.5 bg-background-200 rounded"></div>
                    </div>
                  </div>
                  <div className="w-3/4 h-4 bg-background-200 rounded"></div>
                  <div className="w-full h-10 bg-background-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            /* Empty State */
            <div className="bg-background-100 border border-dashed border-gray-400 rounded-2xl p-12 text-center space-y-4 shadow-2xs max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-xl bg-background-200 border border-gray-400 text-gray-700 mx-auto flex items-center justify-center shadow-2xs">
                <Briefcase className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-gray-1000">No experiences found</h3>
                <p className="text-xs text-gray-700 font-sans">
                  Try adjusting your filters or be the first to share an interview experience for this company!
                </p>
              </div>
              <div className="flex items-center justify-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-8 px-3.5 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-gray-800 text-xs font-medium transition-colors cursor-pointer shadow-2xs"
                >
                  Reset Filters
                </button>
                <Link
                  to="/placements/create"
                  className="h-8 px-4 rounded-md bg-gray-1000 text-background-100 hover:opacity-90 text-xs font-medium transition-opacity shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Share Experience</span>
                </Link>
              </div>
            </div>
          ) : (
            /* Feed Cards Stream */
            <div className="space-y-4">
              {posts.map((post) => (
                <PlacementPostCard key={post._id} post={post} />
              ))}

              {/* Load More Button */}
              {posts.length < totalCount && (
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="h-9 px-6 rounded-md border border-gray-400 bg-background-100 hover:bg-gray-200 text-gray-900 text-xs font-medium shadow-2xs transition-colors disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
    </div>
  );
}
