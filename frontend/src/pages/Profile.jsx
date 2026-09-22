import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Settings2, RefreshCcw, Save, Loader2, User, Eye, Lock, CheckCircle2, AlertCircle, ChevronDown, PanelLeft } from 'lucide-react';
import { ProfileThemeProvider } from '../profile/ProfileThemeProvider';
import PublicProfile from './PublicProfile';
import { PROFILE_PRESETS, ACCENT_COLORS } from '../config/profilePresets';
import { useToast } from '../context/ToastContext';

const PRESET_OPTIONS = Object.keys(PROFILE_PRESETS).map(id => ({
  id,
  label: id.charAt(0).toUpperCase() + id.slice(1)
}));

const CARD_STYLES = [
  { id: 'default', label: 'Default', desc: 'Standard borders and shadows' },
  { id: 'glass', label: 'Glass', desc: 'Frosted glass effect with blur' },
  { id: 'outlined', label: 'Outlined', desc: 'Borders only, transparent background' },
  { id: 'paper', label: 'Paper', desc: 'Sharp edges, crisp shadows' }
];

const TEXTURE_STYLES = [
  { id: 'none', label: 'None', desc: 'Solid color background' },
  { id: 'animated-grid', label: 'Animated Grid', desc: 'Fading grid squares' },
  { id: 'interactive-grid', label: 'Interactive Grid', desc: 'Hover responsive grid' },
  { id: 'hexagon', label: 'Hexagon Pattern', desc: 'Clean geometric hexagons' },
  { id: 'striped', label: 'Striped Pattern', desc: 'Diagonal subtle lines' },
  { id: 'light-rays', label: 'Light Rays', desc: 'Smooth rotating gradients' },
  { id: 'noise', label: 'Noise Texture', desc: 'Subtle TV static overlay' },
  { id: 'glyph-matrix', label: 'Glyph Matrix', desc: 'Falling digital letters' },
  { id: 'shape-waves', label: 'Shape Waves', desc: 'Interactive fluid waves' },
  { id: '3d-prism', label: '3D Prism', desc: 'Rotating 3D Prism' },
];

const MOTION_STYLES = [
  { id: 'none', label: 'None', desc: 'Static, maximum performance' },
  { id: 'subtle', label: 'Subtle', desc: 'Gentle fades and lifts' },
  { id: 'interactive', label: 'Interactive', desc: 'Playful hover effects' }
];

export default function Profile() {
  const { user } = useContext(AuthContext);
  
  // Entire customisation state
  const [customization, setCustomization] = useState({
    appearance: {
      preset: 'geist',
      accent: 'default',
      cardStyle: 'default',
      motion: 'subtle',
      texture: 'none'
    },
    visibility: {
      showAbout: true,
      showGithub: true,
      showLeetcode: true,
      showExperience: true,
      showEducation: true,
      showProjects: true,
      showCertificates: true
    },
    metricsPrivacy: {
      githubHeatmap: true,
      githubTotalStars: true,
      leetcodeHeatmap: true,
      leetcodeRank: true,
      leetcodeAchievements: true,
      cgpa: false
    }
  });

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCertificateListOpen, setIsCertificateListOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('/user/profile');
        if (res.data) {
          setProfileData(res.data);
          if (res.data.profileCustomization) {
            setCustomization(prev => ({
              appearance: { ...prev.appearance, ...(res.data.profileCustomization.appearance || {}) },
              visibility: { ...prev.visibility, ...(res.data.profileCustomization.visibility || {}) },
              metricsPrivacy: { ...prev.metricsPrivacy, ...(res.data.profileCustomization.metricsPrivacy || {}) }
            }));
          }
        }
      } catch (err) {
        console.error('Failed to load profile settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAppearanceChange = (key, value) => {
    setCustomization(prev => ({
      ...prev,
      appearance: { ...prev.appearance, [key]: value }
    }));
  };

  const handleVisibilityChange = (key) => {
    setCustomization(prev => ({
      ...prev,
      visibility: { ...prev.visibility, [key]: !prev.visibility[key] }
    }));
  };

  const handlePrivacyChange = (key) => {
    setCustomization(prev => ({
      ...prev,
      metricsPrivacy: { ...prev.metricsPrivacy, [key]: !prev.metricsPrivacy[key] }
    }));
  };

  const handleCertVisibilityChange = (certIndex) => {
    setProfileData(prev => {
      if (!prev || !prev.resumeDetails || !prev.resumeDetails.certificates) return prev;
      const newCerts = [...prev.resumeDetails.certificates];
      newCerts[certIndex] = { ...newCerts[certIndex], isHidden: !newCerts[certIndex].isHidden };
      return {
        ...prev,
        resumeDetails: {
          ...prev.resumeDetails,
          certificates: newCerts
        }
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.patch('/user/profile/customization', customization);
      
      if (profileData?.resumeDetails) {
        await axios.put('/user/portfolio', profileData.resumeDetails);
      }
      
      showToast('Profile settings saved successfully!', 'success');
    } catch (err) {
      console.error('Failed to save settings', err);
      showToast('Failed to save settings. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCustomization(prev => ({
      ...prev,
      appearance: {
        preset: 'geist',
        accent: 'default',
        cardStyle: 'default',
        motion: 'subtle',
        texture: 'none'
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  // Create a mock profile object that PublicProfile can consume via Context or Props.
  // Wait, PublicProfile fetches from /public/:uid inside its own useEffect!
  // To avoid iframe and API spam, we can just use CSS variables injected at the root of the preview container!
  // ProfileThemeProvider will wrap the preview container and inject the CSS variables directly.
  
  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden md:h-[calc(100vh-56px)]">
      {/* Profile settings panel (Left) */}
          <div className={`w-full max-h-[45vh] sm:max-h-[52vh] md:max-h-none border-b md:border-b-0 md:border-r border-gray-300 bg-background-100 overflow-y-auto shrink-0 flex flex-col md:transition-[width] md:duration-300 md:ease-geist ${isSettingsPanelOpen ? 'md:w-[min(400px,100%)]' : 'md:w-14'}`}>
            <div className={`border-b border-gray-300 flex items-center sticky top-0 bg-background-100/90 backdrop-blur-md z-10 ${isSettingsPanelOpen ? 'p-6 justify-between' : 'p-6 justify-between md:p-2 md:justify-center'}`}>
              <div className={isSettingsPanelOpen ? '' : 'md:hidden'}>
                <h1 className="text-xl font-bold tracking-tight">Profile</h1>
                <p className="text-xs text-gray-500 mt-1">Customize your public profile</p>
              </div>
              <button
                onClick={handleSave} 
                disabled={saving}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-gray-1000 text-background-100 rounded-md text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors ${isSettingsPanelOpen ? '' : 'md:hidden'}`}
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setIsSettingsPanelOpen(open => !open)}
                className="hidden md:flex w-9 h-9 items-center justify-center rounded-md text-gray-700 hover:bg-background-200 hover:text-gray-1000 transition-colors"
                aria-label={isSettingsPanelOpen ? 'Collapse profile settings' : 'Expand profile settings'}
                title={isSettingsPanelOpen ? 'Collapse settings panel' : 'Expand settings panel'}
              >
                <PanelLeft className={`w-4 h-4 transition-transform duration-300 ease-geist ${isSettingsPanelOpen ? '' : 'rotate-180'}`} />
              </button>
            </div>
            
            <div className={`p-6 space-y-8 pb-20 ${isSettingsPanelOpen ? '' : 'md:hidden'}`}>
              
              {/* Presets */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold tracking-tight">Design Preset</h2>
                  <button onClick={handleReset} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
                    <RefreshCcw className="w-3 h-3" /> Reset
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_OPTIONS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => handleAppearanceChange('preset', preset.id)}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        customization.appearance.preset === preset.id 
                          ? 'border-gray-1000 bg-gray-100 dark:bg-gray-800' 
                          : 'border-gray-300 hover:border-gray-500 bg-transparent'
                      }`}
                    >
                      <div className="text-sm font-medium capitalize">{preset.label}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5 capitalize">{PROFILE_PRESETS[preset.id].typography} / {PROFILE_PRESETS[preset.id].pattern}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Accent Colors */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold tracking-tight">Accent Color</h2>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ACCENT_COLORS).map(([id, color]) => (
                    <button
                      key={id}
                      onClick={() => handleAppearanceChange('accent', id)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${
                        customization.appearance.accent === id ? 'border-gray-1000 scale-110' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: id === 'default' ? 'var(--ds-gray-500)' : color }}
                      title={id}
                    />
                  ))}
                </div>
              </section>

              {/* Card Style */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold tracking-tight">Card Style</h2>
                <div className="space-y-2">
                  {CARD_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => handleAppearanceChange('cardStyle', style.id)}
                      className={`w-full p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                        customization.appearance.cardStyle === style.id 
                          ? 'border-gray-1000 bg-gray-100 dark:bg-gray-800' 
                          : 'border-gray-300 hover:border-gray-500 bg-transparent'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${customization.appearance.cardStyle === style.id ? 'border-gray-1000' : 'border-gray-400'}`}>
                        {customization.appearance.cardStyle === style.id && <div className="w-2 h-2 rounded-full bg-gray-1000" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium leading-none mb-1">{style.label}</div>
                        <div className="text-xs text-gray-500">{style.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Motion */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold tracking-tight">Motion & Effects</h2>
                <div className="space-y-2">
                  {MOTION_STYLES.map(motion => (
                    <button
                      key={motion.id}
                      onClick={() => handleAppearanceChange('motion', motion.id)}
                      className={`w-full p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${
                        customization.appearance.motion === motion.id 
                          ? 'border-gray-1000 bg-gray-100 dark:bg-gray-800' 
                          : 'border-gray-300 hover:border-gray-500 bg-transparent'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${customization.appearance.motion === motion.id ? 'border-gray-1000' : 'border-gray-400'}`}>
                        {customization.appearance.motion === motion.id && <div className="w-2 h-2 rounded-full bg-gray-1000" />}
                      </div>
                      <div>
                        <div className="text-sm font-medium leading-none mb-1">{motion.label}</div>
                        <div className="text-xs text-gray-500">{motion.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Texture Selection */}
              <section className="space-y-3">
                <h2 className="text-sm font-semibold tracking-tight">Banner Texture</h2>
                <div className="grid grid-cols-2 gap-2">
                  {TEXTURE_STYLES.map(texture => (
                    <button
                      key={texture.id}
                      onClick={() => handleAppearanceChange('texture', texture.id)}
                      className={`p-3 rounded-lg border text-left transition-colors flex flex-col justify-center ${
                        customization.appearance.texture === texture.id 
                          ? 'border-gray-1000 bg-gray-100 dark:bg-gray-800' 
                          : 'border-gray-300 hover:border-gray-500 bg-transparent'
                      }`}
                    >
                      <div className="text-sm font-medium leading-tight mb-1">{texture.label}</div>
                      <div className="text-[10px] text-gray-500 leading-tight">{texture.desc}</div>
                    </button>
                  ))}
                </div>
              </section>

              {/* Privacy Toggles */}
              <section className="space-y-3 pt-4 border-t border-gray-300">
                <h2 className="text-sm font-semibold tracking-tight flex items-center gap-1.5"><Eye className="w-4 h-4" /> Section Visibility</h2>
                <div className="space-y-2">
                  {[
                    { key: 'showAbout', label: 'About Me' },
                    { key: 'showGithub', label: 'GitHub Activity' },
                    { key: 'showLeetcode', label: 'LeetCode Stats' },
                    { key: 'showExperience', label: 'Experience' },
                    { key: 'showEducation', label: 'Education' },
                    { key: 'showProjects', label: 'Projects' },
                    { key: 'showCertificates', label: 'Certifications' },
                    { key: 'showAcademicProgression', label: 'Academic Progression Graph' },
                  ].map(item => (
                    <React.Fragment key={item.key}>
                      <label className="flex items-center justify-between text-sm p-2 hover:bg-background-200 rounded-md cursor-pointer">
                        <span>{item.label}</span>
                        <input
                          type="checkbox"
                          className="rounded text-gray-900 border-gray-300 focus:ring-gray-900"
                          checked={customization.visibility[item.key]}
                          onChange={() => handleVisibilityChange(item.key)}
                        />
                      </label>

                      {item.key === 'showCertificates' && customization.visibility.showCertificates && profileData?.resumeDetails?.certificates?.length > 0 && (
                        <div className="px-2 pb-1">
                          <button
                            type="button"
                            onClick={() => setIsCertificateListOpen(open => !open)}
                            aria-expanded={isCertificateListOpen}
                            aria-controls="individual-certifications"
                            className="w-full flex items-center justify-between gap-3 rounded-lg border border-gray-400 bg-background-100 px-3 py-2 text-left text-xs font-medium text-gray-1000 transition-colors hover:border-gray-600 hover:bg-background-200"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="truncate">Individual certifications</span>
                              <span className="shrink-0 rounded-full bg-background-200 px-1.5 py-0.5 font-mono text-[10px] text-gray-700 border border-gray-400">
                                {profileData.resumeDetails.certificates.length}
                              </span>
                            </span>
                            <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isCertificateListOpen ? 'rotate-180' : ''}`} />
                          </button>

                          <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isCertificateListOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="min-h-0 overflow-hidden">
                              <div id="individual-certifications" className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-400 bg-background-100 p-1.5 custom-scrollbar">
                                {profileData.resumeDetails.certificates.map((cert, index) => (
                                  <label key={cert._id || index} className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 text-[13px] hover:bg-background-200 cursor-pointer transition-colors">
                                    <span className="min-w-0 truncate text-gray-1000" title={cert.title || 'Untitled Certificate'}>{cert.title || 'Untitled Certificate'}</span>
                                    <input
                                      type="checkbox"
                                      className="rounded text-gray-900 border-gray-300 focus:ring-gray-900 w-3.5 h-3.5 shrink-0"
                                      checked={!cert.isHidden}
                                      onChange={() => handleCertVisibilityChange(index)}
                                    />
                                  </label>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </section>
              
              <section className="space-y-3 pt-4 border-t border-gray-300">
                <h2 className="text-sm font-semibold tracking-tight flex items-center gap-1.5 text-red-600 dark:text-red-400"><Lock className="w-4 h-4" /> Metric Privacy</h2>
                <p className="text-[10px] text-gray-500 leading-tight">Disabled metrics are completely removed from public API responses.</p>
                <div className="space-y-2">
                  {[
                    { key: 'cgpa', label: 'Display CGPA' },
                    { key: 'githubHeatmap', label: 'GitHub Heatmap' },
                    { key: 'githubTotalStars', label: 'Total Stars' },
                    { key: 'leetcodeHeatmap', label: 'LeetCode Heatmap' },
                    { key: 'leetcodeRank', label: 'LeetCode Global Rank' },
                    { key: 'leetcodeAchievements', label: 'LeetCode Achievements' },
                  ].map(item => (
                    <label key={item.key} className="flex items-center justify-between text-sm p-2 hover:bg-background-200 rounded-md cursor-pointer">
                      <span>{item.label}</span>
                      <input 
                        type="checkbox" 
                        className="rounded text-red-600 border-gray-300 focus:ring-red-600" 
                        checked={customization.metricsPrivacy[item.key]} 
                        onChange={() => handlePrivacyChange(item.key)} 
                      />
                    </label>
                  ))}
                </div>
              </section>

            </div>
          </div>

          {/* Live Preview (Right) */}
          <div className="flex-1 min-w-0 min-h-[70vh] bg-gray-200/50 dark:bg-gray-950 overflow-y-auto relative isolate">
            <div className="sticky top-0 p-3 bg-gray-100/80 backdrop-blur-sm border-b border-gray-300 text-xs font-mono text-gray-500 flex items-center justify-center z-50">
              Live Preview (Read Only)
            </div>
            <div className="p-4 sm:p-8 min-h-full">
              <div className="bg-background-100 rounded-xl shadow-2xl border border-gray-400 overflow-hidden relative" style={{ minHeight: '1000px' }}>
                <div className="w-full h-full transform origin-top left-0 overflow-y-auto">
                  {profileData?.uid ? (
                    (() => {
                      const getFilteredPreviewProfileData = () => {
                        if (!profileData) return profileData;
                        const filtered = JSON.parse(JSON.stringify(profileData));
                        if (filtered.resumeDetails && filtered.resumeDetails.certificates) {
                          filtered.resumeDetails.certificates = filtered.resumeDetails.certificates.filter(c => !c.isHidden);
                        }
                        return filtered;
                      };
                      return <PublicProfile previewUid={profileData.uid} previewCustomization={customization} previewProfileData={getFilteredPreviewProfileData()} />;
                    })()
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mb-4" />
                      <p>Loading preview...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
    </div>
  );
}
