import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';

function ResumeEditorModal({ profile, onComplete, onClose }) {
  const [skillsStr, setSkillsStr] = useState(profile?.resumeDetails?.skills?.join(', ') || '');
  const [education, setEducation] = useState(profile?.resumeDetails?.education || []);
  const [experience, setExperience] = useState(profile?.resumeDetails?.experience || []);
  const [projects, setProjects] = useState(profile?.resumeDetails?.projects || []);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('resume', file);
    
    setParsing(true);
    try {
      const res = await axios.post('/user/parse-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { parsedData } = res.data;
      if (parsedData) {
        if (parsedData.skills) setSkillsStr(parsedData.skills.join(', '));
        if (parsedData.education) setEducation(parsedData.education);
        if (parsedData.experience) setExperience(parsedData.experience);
        if (parsedData.projects) setProjects(parsedData.projects);
      }
      alert('Resume parsed successfully! Review the auto-filled fields before saving.');
    } catch (err) {
      console.error('Error parsing resume', err);
      alert(err.response?.data?.message || 'Failed to parse resume');
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
        education,
        experience,
        projects
      };
      const res = await axios.put('/user/portfolio', payload);
      onComplete(res.data.user);
      onClose();
    } catch (err) {
      alert('Failed to save resume details');
    } finally {
      setLoading(false);
    }
  };

  const addEdu = () => setEducation([...education, { institution: '', degree: '', startYear: '', endYear: '' }]);
  const addExp = () => setExperience([...experience, { company: '', role: '', startDate: '', endDate: '', description: '' }]);
  const addProj = () => setProjects([...projects, { title: '', link: '', description: '' }]);

  const updateEdu = (index, field, val) => {
    const newEdu = [...education];
    newEdu[index][field] = val;
    setEducation(newEdu);
  };
  const updateExp = (index, field, val) => {
    const newExp = [...experience];
    newExp[index][field] = val;
    setExperience(newExp);
  };
  const updateProj = (index, field, val) => {
    const newProj = [...projects];
    newProj[index][field] = val;
    setProjects(newProj);
  };

  const removeEdu = (index) => setEducation(education.filter((_, i) => i !== index));
  const removeExp = (index) => setExperience(experience.filter((_, i) => i !== index));
  const removeProj = (index) => setProjects(projects.filter((_, i) => i !== index));

  return (
    <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest p-6 md:p-8 rounded-2xl shadow-ambient max-w-3xl w-full border border-border-light max-h-[90vh] overflow-y-auto relative my-8">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-surface-variant text-on-surface-variant rounded-full hover:bg-outline-variant transition-colors">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        <h2 className="text-headline-md font-bold text-on-surface mb-2">Update Resume</h2>
        <p className="text-body-md text-on-surface-variant mb-6">
          Manually enter your portfolio details or upload a PDF resume to auto-fill.
        </p>

        {/* AI Resume Parser Area */}
        <section className="mb-8 p-6 rounded-xl border border-primary/20 bg-primary/5 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-[32px] text-primary mb-2">document_scanner</span>
          <h3 className="font-bold text-label-lg text-on-surface mb-1">Auto-Fill with AI</h3>
          <p className="text-sm text-on-surface-variant mb-4">Upload your PDF resume and let our AI extract your details.</p>
          
          <label className={`cursor-pointer bg-primary text-on-primary px-6 py-2 rounded-lg font-button-text flex items-center gap-2 transition-colors ${parsing ? 'opacity-70 pointer-events-none' : 'hover:bg-on-primary-fixed'}`}>
            {parsing ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">upload</span>}
            {parsing ? 'Parsing Resume...' : 'Upload PDF'}
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={parsing} />
          </label>
        </section>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Skills Section */}
          <section className="bg-surface-container-low p-4 rounded-xl border border-border-light">
            <h3 className="font-bold text-label-lg text-on-surface mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-primary">psychology</span> Skills</h3>
            <input type="text" className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary" placeholder="React, Node.js, Python, SQL" value={skillsStr} onChange={(e) => setSkillsStr(e.target.value)} />
            <p className="text-xs text-on-surface-variant mt-2">Comma separated list of your technical skills.</p>
          </section>

          {/* Education Section */}
          <section className="bg-surface-container-low p-4 rounded-xl border border-border-light space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-label-lg text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-primary">school</span> Education</h3>
              <button type="button" onClick={addEdu} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"><span className="material-symbols-outlined text-[16px]">add</span> Add</button>
            </div>
            {education.map((edu, idx) => (
              <div key={idx} className="bg-surface p-4 rounded-lg border border-border-light relative gap-4 grid grid-cols-1 md:grid-cols-2">
                <button type="button" onClick={() => removeEdu(idx)} className="absolute top-2 right-2 text-error"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                <div><label className="text-xs font-bold text-on-surface-variant">Institution</label><input required className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={edu.institution} onChange={e => updateEdu(idx, 'institution', e.target.value)} /></div>
                <div><label className="text-xs font-bold text-on-surface-variant">Degree</label><input required className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={edu.degree} onChange={e => updateEdu(idx, 'degree', e.target.value)} /></div>
                <div><label className="text-xs font-bold text-on-surface-variant">Start Year</label><input className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={edu.startYear} onChange={e => updateEdu(idx, 'startYear', e.target.value)} /></div>
                <div><label className="text-xs font-bold text-on-surface-variant">End Year</label><input className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={edu.endYear} onChange={e => updateEdu(idx, 'endYear', e.target.value)} /></div>
              </div>
            ))}
          </section>

          {/* Experience Section */}
          <section className="bg-surface-container-low p-4 rounded-xl border border-border-light space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-label-lg text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-primary">work</span> Experience</h3>
              <button type="button" onClick={addExp} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"><span className="material-symbols-outlined text-[16px]">add</span> Add</button>
            </div>
            {experience.map((exp, idx) => (
              <div key={idx} className="bg-surface p-4 rounded-lg border border-border-light relative gap-4 grid grid-cols-1 md:grid-cols-2">
                <button type="button" onClick={() => removeExp(idx)} className="absolute top-2 right-2 text-error"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                <div><label className="text-xs font-bold text-on-surface-variant">Company</label><input required className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={exp.company} onChange={e => updateExp(idx, 'company', e.target.value)} /></div>
                <div><label className="text-xs font-bold text-on-surface-variant">Role</label><input required className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={exp.role} onChange={e => updateExp(idx, 'role', e.target.value)} /></div>
                <div><label className="text-xs font-bold text-on-surface-variant">Start Date</label><input className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={exp.startDate} onChange={e => updateExp(idx, 'startDate', e.target.value)} /></div>
                <div><label className="text-xs font-bold text-on-surface-variant">End Date</label><input className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={exp.endDate} onChange={e => updateExp(idx, 'endDate', e.target.value)} /></div>
                <div className="md:col-span-2"><label className="text-xs font-bold text-on-surface-variant">Description</label><textarea rows="2" className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={exp.description} onChange={e => updateExp(idx, 'description', e.target.value)} /></div>
              </div>
            ))}
          </section>

          {/* Projects Section */}
          <section className="bg-surface-container-low p-4 rounded-xl border border-border-light space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-label-lg text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-primary">rocket_launch</span> Projects</h3>
              <button type="button" onClick={addProj} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"><span className="material-symbols-outlined text-[16px]">add</span> Add</button>
            </div>
            {projects.map((proj, idx) => (
              <div key={idx} className="bg-surface p-4 rounded-lg border border-border-light relative gap-4 grid grid-cols-1 md:grid-cols-2">
                <button type="button" onClick={() => removeProj(idx)} className="absolute top-2 right-2 text-error"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                <div><label className="text-xs font-bold text-on-surface-variant">Title</label><input required className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={proj.title} onChange={e => updateProj(idx, 'title', e.target.value)} /></div>
                <div><label className="text-xs font-bold text-on-surface-variant">Link</label><input type="url" className="w-full p-2 border border-border-light rounded mt-1 bg-surface" placeholder="https://" value={proj.link} onChange={e => updateProj(idx, 'link', e.target.value)} /></div>
                <div className="md:col-span-2"><label className="text-xs font-bold text-on-surface-variant">Description</label><textarea rows="2" className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={proj.description} onChange={e => updateProj(idx, 'description', e.target.value)} /></div>
              </div>
            ))}
          </section>

          <button disabled={loading} type="submit" className="w-full bg-primary text-on-primary py-3 rounded-lg font-button-text hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-70 flex justify-center items-center gap-2">
            {loading ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Save Resume'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  
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

  const skills = profile?.resumeDetails?.skills || [];
  const experience = profile?.resumeDetails?.experience || [];
  const education = profile?.resumeDetails?.education || [];
  const projects = profile?.resumeDetails?.projects || [];

  // Calculate a mock strength based on fields filled
  let profileStrength = 20; // base
  if (skills.length > 0) profileStrength += 20;
  if (experience.length > 0) profileStrength += 25;
  if (education.length > 0) profileStrength += 15;
  if (projects.length > 0) profileStrength += 20;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      <header className="md:hidden bg-white/80 backdrop-blur-xl border-b border-border-light shadow-sm flex justify-between items-center px-gutter h-20 z-40 sticky top-0 w-full">
        <span className="font-headline-md text-headline-md font-bold text-on-surface">Campus Connect</span>
        <div className="flex gap-4">
          <span className="material-symbols-outlined text-on-surface-variant cursor-pointer">menu</span>
        </div>
      </header>

      <Sidebar />

      {showEditor && (
        <ResumeEditorModal 
          profile={profile} 
          onClose={() => setShowEditor(false)} 
          onComplete={(updatedProfile) => setProfile(updatedProfile)} 
        />
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="hidden md:flex bg-white/80 backdrop-blur-xl border-b border-border-light shadow-sm justify-between items-center px-gutter h-20 z-40 sticky top-0 w-full">
          <div className="relative w-96">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-border-light rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-body-md text-body-md text-on-surface placeholder:text-text-slate" placeholder="Search opportunities, events..." type="text" />
          </div>
          <div className="flex items-center gap-6">
            <span className="material-symbols-outlined text-on-surface-variant hover:text-primary cursor-pointer transition-colors">notifications</span>
          </div>
        </div>

        <div className="p-gutter md:p-12 max-w-container-max mx-auto space-y-section-gap-mobile md:space-y-section-gap-desktop">
          <section className="flex flex-col lg:flex-row gap-8 items-start justify-between">
            <div>
              <h1 className="font-display-hero-mobile md:font-display-hero text-display-hero-mobile md:text-display-hero text-on-surface mb-2">
                Good Morning, {profile?.name?.split(' ')[0] || 'Student'}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-on-surface-variant font-body-lg text-body-lg">
                {education.length > 0 ? (
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-primary">school</span> {education[0].institution}</span>
                ) : (
                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-primary">school</span> University Student</span>
                )}
                <span className="w-1 h-1 rounded-full bg-border-light"></span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-tertiary-container">verified</span> Campus Score: <strong>840</strong></span>
              </div>
              {profile?.lastScrapedAt && (
                <div className="mt-2 text-xs text-text-slate flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">update</span> 
                  Profile Last Refreshed: {new Date(profile.lastScrapedAt).toLocaleString()}
                </div>
              )}
              <div className="mt-6 flex flex-wrap gap-4">
                <button 
                  onClick={() => setShowEditor(true)}
                  className="bg-primary text-on-primary px-6 py-3 rounded-lg font-button-text text-button-text hover:bg-on-primary-fixed transition-colors duration-200 shadow-sm flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">edit_document</span> Update Resume
                </button>
              </div>
            </div>

            <div className="bg-white border border-border-light rounded-xl p-6 shadow-md w-full lg:w-80 shrink-0 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-ai-gradient-start rounded-full blur-2xl"></div>
              <h3 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-4">Profile Strength</h3>
              <div className="flex items-end justify-between mb-2">
                <span className="font-headline-lg text-headline-lg text-primary">{profileStrength}%</span>
              </div>
              <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${profileStrength}%` }}></div>
              </div>
              {profileStrength < 100 && (
                <p className="font-body-md text-body-md text-text-slate mt-4 text-sm">Complete all resume sections to reach 100%.</p>
              )}
            </div>
          </section>

          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <span className="material-symbols-outlined text-primary mb-2">psychology</span>
              <div>
                <div className="font-headline-md text-headline-md text-on-surface">{skills.length}</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Skills</div>
              </div>
            </div>
            <div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <span className="material-symbols-outlined text-secondary-container mb-2">work</span>
              <div>
                <div className="font-headline-md text-headline-md text-on-surface">{experience.length}</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Experiences</div>
              </div>
            </div>
            <div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <span className="material-symbols-outlined text-tertiary-container mb-2">rocket_launch</span>
              <div>
                <div className="font-headline-md text-headline-md text-on-surface">{projects.length}</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Projects</div>
              </div>
            </div>
            <div className="bg-white border border-border-light rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <span className="material-symbols-outlined text-surface-tint mb-2">school</span>
              <div>
                <div className="font-headline-md text-headline-md text-on-surface">{education.length}</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant uppercase mt-1">Degrees</div>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-8">
              <section className="bg-white border border-border-light rounded-xl p-6 shadow-md relative overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-surface-container-low to-transparent opacity-50 pointer-events-none"></div>
                <div className="flex justify-between items-center mb-6 relative z-10">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Your Skills</h2>
                </div>
                <div className="flex flex-wrap gap-2 relative z-10">
                  {skills.length > 0 ? skills.map((skill, idx) => (
                    <span key={idx} className="px-3 py-1 bg-surface-container text-primary rounded-full text-sm font-medium border border-border-light">{skill}</span>
                  )) : (
                    <p className="text-on-surface-variant text-sm">No skills added yet. Update your resume!</p>
                  )}
                </div>
              </section>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-8">
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-headline-md text-headline-md text-on-surface">Experience History</h2>
                </div>
                {experience.length > 0 ? (
                  <div className="relative border-l-2 border-border-light ml-3 space-y-8">
                    {experience.map((exp, idx) => (
                      <div key={idx} className="relative pl-6">
                        <div className="absolute w-4 h-4 bg-primary rounded-full -left-[9px] top-1 ring-4 ring-white shadow-sm"></div>
                        <h3 className="font-body-lg text-body-lg font-bold text-on-surface">{exp.role}</h3>
                        <p className="text-on-surface-variant font-medium text-sm mb-2">{exp.company} • {exp.startDate} - {exp.endDate || 'Present'}</p>
                        <p className="text-text-slate text-sm leading-relaxed">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-surface-container-low border border-border-light border-dashed rounded-xl p-8 text-center text-on-surface-variant">
                    No experience history. Update your resume to populate this section.
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </main>

      <nav className="md:hidden bg-white/80 backdrop-blur-xl fixed bottom-0 w-full flex justify-around items-center h-16 border-t border-border-light z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <a className="flex flex-col items-center gap-1 text-primary" href="#">
          <span className="material-symbols-outlined">dashboard</span>
          <span className="text-[10px] font-semibold">Dash</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary" href="#">
          <span className="material-symbols-outlined">work</span>
          <span className="text-[10px] font-semibold">Jobs</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary" href="#">
          <span className="material-symbols-outlined">event</span>
          <span className="text-[10px] font-semibold">Events</span>
        </a>
        <a className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary" href="#">
          <span className="material-symbols-outlined">person</span>
          <span className="text-[10px] font-semibold">Profile</span>
        </a>
      </nav>
    </div>
  );
}
