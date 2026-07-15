import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';

const CountUp = ({ end }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(t);
  }, []);

  const valStr = String(end || 0);

  return (
    <span className="inline-flex" style={{ fontVariantNumeric: 'tabular-nums' }}>
      {valStr.split('').map((char, i) => {
        if (isNaN(char) || char === ' ') {
          return <span key={i}>{char}</span>;
        }
        return (
          <span key={i} className="inline-block h-[1em] overflow-hidden leading-none align-text-bottom relative">
            <span
              className="flex flex-col transition-transform duration-[1500ms] ease-[cubic-bezier(0.2,1,0.3,1)]"
              style={{ 
                transform: `translateY(calc(-${mounted ? char : '0'} * 1em))`,
                transitionDelay: `${i * 100}ms`
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <span key={num} className="h-[1em] flex items-center justify-center">
                  {num}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
};

function ProfileSetupOverlay({ onComplete }) {
  const [formData, setFormData] = useState({
    name: '',
    githubUsername: '',
    leetcodeUsername: '',
    linkedInUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.put('/user/profile', formData);
      onComplete(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-ambient max-w-lg w-full border border-border-light">
        <h2 className="text-headline-md font-bold text-on-surface mb-2">Complete Your Profile</h2>
        <p className="text-body-md text-on-surface-variant mb-6">
          We need a few details to automatically fetch your coding metrics and set up your portfolio.
        </p>

        {error && <div className="p-3 mb-4 bg-error-container text-on-error-container rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-1">Full Name</label>
            <input required type="text" className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary transition-colors" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-1">GitHub Username</label>
            <input required type="text" className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary transition-colors" placeholder="johndoe" value={formData.githubUsername} onChange={e => setFormData({...formData, githubUsername: e.target.value})} />
          </div>
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-1">LeetCode Username</label>
            <input required type="text" className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary transition-colors" placeholder="johndoe" value={formData.leetcodeUsername} onChange={e => setFormData({...formData, leetcodeUsername: e.target.value})} />
          </div>
          <div>
            <label className="block text-label-lg font-medium text-on-surface mb-1">LinkedIn URL</label>
            <input type="url" className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary transition-colors" placeholder="https://linkedin.com/in/johndoe" value={formData.linkedInUrl} onChange={e => setFormData({...formData, linkedInUrl: e.target.value})} />
          </div>

          <button disabled={loading} type="submit" className="w-full mt-6 bg-primary text-on-primary py-3 rounded-lg font-button-text hover:bg-primary-container transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
            {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}

function RepoModal({ repo, onClose }) {
  if (!repo) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-ambient border border-border-light overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-border-light flex justify-between items-start bg-surface-container-lowest">
          <div>
            <h2 className="text-headline-md font-bold text-primary mb-2 flex items-center gap-2">
              <span className="material-symbols-outlined">book</span>
              {repo.name}
            </h2>
            <p className="text-body-md text-on-surface-variant">{repo.description || 'No description provided.'}</p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors p-1 bg-surface-container-high rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        
        <div className="p-4 bg-surface-container-low flex flex-wrap gap-4 text-sm text-on-surface-variant border-b border-border-light">
          <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">code</span>{repo.language || 'Unknown'}</div>
          <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">star</span>{repo.stargazers_count || 0} Stars</div>
          <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[16px]">fork_right</span>{repo.forks_count || 0} Forks</div>
          <a href={repo.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-primary hover:underline ml-auto">
            View on GitHub <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </a>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-surface">
          <h3 className="text-label-lg font-bold text-on-surface mb-4 uppercase tracking-wider">README.md</h3>
          {repo.readme ? (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none font-body-md text-on-surface">
              <ReactMarkdown>{repo.readme}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-12 text-on-surface-variant flex flex-col items-center gap-3 bg-surface-container-lowest rounded-xl border border-border-light">
               <span className="material-symbols-outlined text-[32px]">draft</span>
               <p>No README.md found for this repository.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


export default function StudentProfile() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/user/profile');
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleRefreshMetrics = async () => {
    setRefreshing(true);
    try {
      const res = await axios.post('/user/refresh-metrics');
      setProfile(res.data.user);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to refresh metrics');
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
        <Sidebar />
        <main className="flex-1 relative overflow-y-auto flex justify-center items-center">
          <span className="material-symbols-outlined animate-spin text-[48px] text-primary">autorenew</span>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
        <Sidebar />
        <main className="flex-1 relative overflow-y-auto flex justify-center items-center">
          Error loading profile.
        </main>
      </div>
    );
  }

  const github = profile.scrapedData?.github;
  const leetcode = profile.scrapedData?.leetcode;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      <Sidebar />
      {!profile.isProfileComplete && <ProfileSetupOverlay onComplete={setProfile} />}
      <RepoModal repo={selectedRepo} onClose={() => setSelectedRepo(null)} />
      
      <main className="flex-1 relative overflow-y-auto">
        <header className="sticky top-0 w-full z-50 flex justify-between items-center px-gutter py-4 bg-surface/80 backdrop-blur-xl border-b border-outline-variant shadow-sm">
          <div className="font-display-hero text-headline-md font-bold text-primary tracking-tight">Campus Connect</div>
          <div className="flex items-center gap-4">
            <button onClick={handleRefreshMetrics} disabled={refreshing} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface-variant text-on-surface-variant font-button-text rounded-lg hover:bg-outline-variant transition-colors shadow-sm disabled:opacity-50">
              <span className={`material-symbols-outlined ${refreshing ? 'animate-spin' : ''}`}>sync</span> Refresh Metrics
            </button>
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center cursor-pointer shadow-sm">
              <span className="material-symbols-outlined text-[20px]">person</span>
            </div>
          </div>
        </header>

        {profile.isProfileComplete && (
          <div className="pt-8 pb-16 px-gutter max-w-container-max mx-auto w-full space-y-8">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-surface-container-lowest p-6 rounded-2xl border border-border-light shadow-sm">
              <div className="w-32 h-32 rounded-full bg-primary-container flex items-center justify-center shadow-ambient shrink-0 border-4 border-surface-container-lowest">
                <span className="material-symbols-outlined text-[64px] text-on-primary-container">person</span>
              </div>
              <div className="flex-1 text-center md:text-left pt-2">
                <h1 className="font-display-hero text-headline-lg text-on-surface">{profile.name}</h1>
                <p className="font-body-md text-body-lg text-on-surface-variant mb-4">{profile.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {profile.githubUsername && (
                    <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors">
                      <span className="material-symbols-outlined text-[18px]">code</span> GitHub
                    </a>
                  )}
                  {profile.leetcodeUsername && (
                    <a href={`https://leetcode.com/u/${profile.leetcodeUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors">
                      <span className="material-symbols-outlined text-[18px]">terminal</span> LeetCode
                    </a>
                  )}
                  {profile.linkedInUrl && (
                    <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors">
                      <span className="material-symbols-outlined text-[18px]">link</span> LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* GitHub Card */}
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-surface-variant pb-4">
                  <span className="material-symbols-outlined text-primary text-[28px]">code_blocks</span>
                  <h3 className="font-headline-md text-headline-sm text-on-surface">GitHub Metrics</h3>
                </div>
                {github ? (
                  <>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div className="bg-bg-subtle p-3 rounded-lg border border-border-light">
                        <div className="text-headline-md font-bold text-primary">
                          <CountUp end={github.profile?.public_repos || 0} />
                        </div>
                        <div className="text-label-caps text-on-surface-variant mt-1">Repos</div>
                      </div>
                      <div className="bg-bg-subtle p-3 rounded-lg border border-border-light">
                        <div className="text-headline-md font-bold text-primary">
                          <CountUp end={github.profile?.followers || 0} />
                        </div>
                        <div className="text-label-caps text-on-surface-variant mt-1">Followers</div>
                      </div>
                      <div className="bg-bg-subtle p-3 rounded-lg border border-border-light">
                        <div className="text-headline-md font-bold text-primary">
                          <CountUp end={github.profile?.following || 0} />
                        </div>
                        <div className="text-label-caps text-on-surface-variant mt-1">Following</div>
                      </div>
                    </div>
                    {github.repositories && github.repositories.length > 0 && (
                      <div className="mt-2 space-y-3">
                        <h4 className="text-label-lg font-bold text-on-surface">Top Repositories</h4>
                        {github.repositories.slice(0, 3).map(repo => (
                          <div 
                            key={repo.name} 
                            onClick={() => setSelectedRepo(repo)}
                            className="flex justify-between items-center p-3 border border-border-light rounded-lg bg-surface-container-lowest hover:border-primary hover:shadow-sm cursor-pointer transition-all group"
                          >
                            <div className="flex-1 min-w-0 pr-4">
                              <span className="text-body-md font-bold text-primary group-hover:underline flex items-center gap-1.5">
                                {repo.name}
                                <span className="material-symbols-outlined text-[14px] opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                              </span>
                              <p className="text-body-sm text-on-surface-variant truncate">{repo.description || 'No description'}</p>
                            </div>
                            <div className="flex gap-3 text-label-sm text-on-surface-variant shrink-0">
                              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">star</span>{repo.stargazers_count || 0}</span>
                              <span className="px-2 py-0.5 bg-surface-container-high rounded">{repo.language || 'Code'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-on-surface-variant p-8">No GitHub data available.</div>
                )}
              </div>

              {/* LeetCode Card */}
              <div className="bg-surface-container-lowest rounded-xl p-6 border border-border-light shadow-ambient flex flex-col gap-4">
                <div className="flex items-center gap-3 border-b border-surface-variant pb-4">
                  <span className="material-symbols-outlined text-primary text-[28px]">terminal</span>
                  <h3 className="font-headline-md text-headline-sm text-on-surface">LeetCode Metrics</h3>
                </div>
                {leetcode ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-bg-subtle rounded-lg border border-border-light">
                      <div className="text-body-lg font-medium text-on-surface">Global Ranking</div>
                      <div className="text-headline-md font-bold text-primary">
                        <CountUp end={leetcode.profile?.ranking || 0} />
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <h4 className="text-label-lg font-bold text-on-surface mb-3">Problems Solved</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-body-sm mb-1">
                            <span className="text-on-surface">
                              Easy (<CountUp end={leetcode.profile?.easySolved || 0} duration={1000}/>/<CountUp end={leetcode.profile?.totalEasy || 0} duration={1000}/>)
                            </span>
                          </div>
                          <div className="w-full bg-surface-container-high rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{width: `${(leetcode.profile?.easySolved / leetcode.profile?.totalEasy) * 100 || 0}%`}}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-body-sm mb-1">
                            <span className="text-on-surface">
                              Medium (<CountUp end={leetcode.profile?.mediumSolved || 0} duration={1000}/>/<CountUp end={leetcode.profile?.totalMedium || 0} duration={1000}/>)
                            </span>
                          </div>
                          <div className="w-full bg-surface-container-high rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{width: `${(leetcode.profile?.mediumSolved / leetcode.profile?.totalMedium) * 100 || 0}%`}}></div>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-body-sm mb-1">
                            <span className="text-on-surface">
                              Hard (<CountUp end={leetcode.profile?.hardSolved || 0} duration={1000}/>/<CountUp end={leetcode.profile?.totalHard || 0} duration={1000}/>)
                            </span>
                          </div>
                          <div className="w-full bg-surface-container-high rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full transition-all duration-1000 ease-out" style={{width: `${(leetcode.profile?.hardSolved / leetcode.profile?.totalHard) * 100 || 0}%`}}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-on-surface-variant p-8">No LeetCode data available.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
