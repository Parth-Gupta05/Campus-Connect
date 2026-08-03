import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import { FiLoader } from 'react-icons/fi';

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
            {loading ? <FiLoader className="animate-spin text-[24px]" /> : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}

function PdfViewerModal({ url, onClose }) {
  return (
    <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-surface-container-lowest w-full max-w-4xl h-[85vh] rounded-2xl shadow-ambient flex flex-col overflow-hidden relative">
        <div className="flex justify-between items-center p-4 border-b border-border-light">
          <h2 className="text-label-lg font-bold">Resume PDF</h2>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="flex-1 w-full bg-surface-container">
          <iframe 
            src={`http://localhost:5000/api/user/portfolio/resume/pdf?token=${localStorage.getItem('accessToken')}`} 
            className="w-full h-full border-none" 
            title="Resume PDF"
          >
            <div className="p-8 text-center text-on-surface-variant flex flex-col items-center justify-center h-full gap-4">
              <span className="material-symbols-outlined text-[48px]">picture_as_pdf</span>
              <p>Your browser cannot display this PDF inline.</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="bg-primary text-on-primary px-4 py-2 rounded-lg font-medium hover:bg-primary-container transition-colors">
                Download PDF
              </a>
            </div>
          </iframe>
        </div>
      </div>
    </div>
  );
}

function ResumeEditorModal({ profile, onComplete, onClose, onPreviewPdf }) {
  const { showToast } = useToast();
  const [skillsStr, setSkillsStr] = useState(profile?.resumeDetails?.skills?.join(', ') || '');
  const [portfolioUrl, setPortfolioUrl] = useState(profile?.resumeDetails?.portfolioUrl || '');
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
      showToast('Resume parsed successfully! Review the auto-filled fields before saving.', 'success');
    } catch (err) {
      console.error('Error parsing resume', err);
      showToast(err.response?.data?.message || 'Failed to parse resume', 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        portfolioUrl,
        skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
        education,
        experience,
        projects
      };
      const res = await axios.put('/user/portfolio', payload);
      onComplete(res.data.user);
      onClose();
      showToast('Resume saved successfully', 'success');
    } catch (err) {
      showToast('Failed to save resume details', 'error');
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
    <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-ambient max-w-3xl w-full border border-border-light max-h-[90vh] flex flex-col relative">
        {/* Fixed Header */}
        <div className="px-6 md:px-8 py-4 bg-surface-container-lowest border-b border-border-light flex justify-between items-center shrink-0 rounded-t-2xl">
          <div>
            <h2 className="text-headline-md font-bold text-on-surface mb-1">Update Resume</h2>
            <p className="text-body-md text-on-surface-variant text-sm">
              Manually enter your portfolio details or upload a PDF resume.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 bg-surface-variant text-on-surface-variant rounded-full hover:bg-outline-variant transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <button 
              onClick={handleSave} 
              disabled={loading} 
              className="bg-primary text-on-primary px-6 py-2 rounded-lg font-button-text hover:bg-primary-container hover:text-on-primary-container transition-colors disabled:opacity-70 flex justify-center items-center gap-2 shadow-sm"
            >
              {loading ? <FiLoader className="animate-spin text-[20px]" /> : 'Save'}
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 md:p-8 overflow-y-auto">
          {/* AI Resume Parser Area */}
          <section className="mb-8 p-6 rounded-xl border border-primary/20 bg-primary/5 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-[32px] text-primary mb-2">document_scanner</span>
          <h3 className="font-bold text-label-lg text-on-surface mb-1">Auto-Fill with AI</h3>
          <p className="text-sm text-on-surface-variant mb-4">Upload your PDF resume and let our AI extract your details.</p>
          
          <label className={`cursor-pointer bg-primary text-on-primary px-6 py-2 rounded-lg font-button-text flex items-center gap-2 transition-colors ${parsing ? 'opacity-70 pointer-events-none' : 'hover:bg-on-primary-fixed'}`}>
            {parsing ? <FiLoader className="animate-spin text-[20px]" /> : <span className="material-symbols-outlined">upload</span>}
            {parsing ? 'Parsing Resume...' : 'Upload PDF'}
            <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={parsing} />
          </label>
          {profile?.resumeUrl && (
             <button type="button" onClick={onPreviewPdf} className="mt-4 text-sm text-primary hover:underline flex items-center gap-1">
               <span className="material-symbols-outlined text-[16px]">visibility</span> View Current PDF
             </button>
          )}
        </section>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Portfolio Link Section */}
          <section className="bg-surface-container-low p-4 rounded-xl border border-border-light">
            <h3 className="font-bold text-label-lg text-on-surface mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-primary">link</span> Personal Portfolio</h3>
            <input type="url" className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary" placeholder="https://yourportfolio.com" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
            <p className="text-xs text-on-surface-variant mt-2">Link to your personal website or portfolio.</p>
          </section>

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
            {education.map((edu, idx) => {
              const getYearOfStudy = (start, end) => {
                if (!start || !end) return '';
                const currentYear = new Date().getFullYear();
                const currentMonth = new Date().getMonth();
                const startY = parseInt(start, 10);
                const endY = parseInt(end, 10);
                if (isNaN(startY) || isNaN(endY)) return '';
                if (currentYear > endY || (currentYear === endY && currentMonth >= 5)) return 'Alumni';
                if (currentYear < startY) return 'Incoming';
                let yearsPassed = currentYear - startY;
                if (currentMonth >= 7) yearsPassed++;
                if (yearsPassed === 1) return '1st Year';
                if (yearsPassed === 2) return '2nd Year';
                if (yearsPassed === 3) return '3rd Year';
                if (yearsPassed === 4) return '4th Year';
                if (yearsPassed === 5) return '5th Year';
                return `Year ${yearsPassed}`;
              };
              const yearText = getYearOfStudy(edu.startYear, edu.endYear);

              return (
                <div key={idx} className="bg-surface p-4 rounded-lg border border-border-light relative gap-4 grid grid-cols-1 md:grid-cols-2">
                  <button type="button" onClick={() => removeEdu(idx)} className="absolute top-2 right-2 text-error"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                  <div><label className="text-xs font-bold text-on-surface-variant">Institution</label><input required className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={edu.institution} onChange={e => updateEdu(idx, 'institution', e.target.value)} /></div>
                  <div><label className="text-xs font-bold text-on-surface-variant flex items-center gap-2">Degree {yearText && <span className="text-primary font-medium px-1.5 py-0.5 bg-primary/10 rounded text-[10px]">{yearText}</span>}</label><input required className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={edu.degree} onChange={e => updateEdu(idx, 'degree', e.target.value)} /></div>
                  <div><label className="text-xs font-bold text-on-surface-variant">Start Year</label><input className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={edu.startYear} onChange={e => updateEdu(idx, 'startYear', e.target.value)} /></div>
                  <div><label className="text-xs font-bold text-on-surface-variant">End Year</label><input className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={edu.endYear} onChange={e => updateEdu(idx, 'endYear', e.target.value)} /></div>
                </div>
              );
            })}
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
        </form>
        </div>
      </div>
    </div>
  );
}

export default function StudentProfile() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showPdf, setShowPdf] = useState(false);

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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const res = await axios.post('/user/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data.user);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      showToast(err.response?.data?.message || 'Failed to upload avatar', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
        <Sidebar />
        <main className="flex-1 relative overflow-y-auto">
          <header className="sticky top-0 w-full z-50 flex justify-between items-center px-gutter py-4 bg-surface/80 border-b border-outline-variant">
            <div className="h-8 w-40 skeleton-box delay-100"></div>
            <div className="w-8 h-8 rounded-full skeleton-box delay-100"></div>
          </header>
          
          <div className="pt-8 pb-16 px-gutter max-w-container-max mx-auto w-full space-y-8">
            <section className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 h-48 skeleton-box delay-200"></div>
              <div className="w-full lg:w-80 h-48 skeleton-box delay-300 shrink-0"></div>
            </section>
            
            <div className="w-full h-96 skeleton-box delay-400"></div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="h-24 skeleton-box delay-500"></div>
              <div className="h-24 skeleton-box delay-500"></div>
              <div className="h-24 skeleton-box delay-500"></div>
              <div className="h-24 skeleton-box delay-500"></div>
            </div>
          </div>
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

  const skills = profile.resumeDetails?.skills || [];
  const experience = profile.resumeDetails?.experience || [];
  const education = profile.resumeDetails?.education || [];
  const projects = profile.resumeDetails?.projects || [];
  const manualCerts = profile.resumeDetails?.certificates || [];
  const scrapedCerts = profile.scrapedData?.linkedin?.certifications || [];
  
  const certificatesMap = new Map();
  scrapedCerts.forEach(cert => certificatesMap.set(cert.title, { isComplete: false }));
  manualCerts.forEach(cert => certificatesMap.set(cert.title, cert));
  
  const allCertificates = Array.from(certificatesMap.values());
  const hasIncompleteCerts = allCertificates.some(cert => !cert.isComplete);

  const missingSections = [];
  if (skills.length === 0) missingSections.push('Skills');
  if (experience.length === 0) missingSections.push('Experience');
  if (education.length === 0) missingSections.push('Education');
  if (projects.length === 0) missingSections.push('Projects');
  if (hasIncompleteCerts) missingSections.push('Certificates');

  let profileStrength = 20; // base
  if (skills.length > 0) profileStrength += 15;
  if (experience.length > 0) profileStrength += 20;
  if (education.length > 0) profileStrength += 15;
  if (projects.length > 0) profileStrength += 15;
  if (!hasIncompleteCerts) profileStrength += 15;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      <Sidebar />
      {!profile.isProfileComplete && <ProfileSetupOverlay onComplete={setProfile} />}
      
      {showEditor && (
        <ResumeEditorModal 
          profile={profile} 
          onClose={() => setShowEditor(false)} 
          onComplete={(updatedProfile) => setProfile(updatedProfile)} 
          onPreviewPdf={() => setShowPdf(true)}
        />
      )}

      {showPdf && profile.resumeUrl && (
        <PdfViewerModal url={profile.resumeUrl} onClose={() => setShowPdf(false)} />
      )}
      
      <main className="flex-1 relative overflow-y-auto">
        <header className="sticky top-0 w-full z-50 flex justify-between items-center px-gutter py-4 bg-surface/80 backdrop-blur-xl border-b border-outline-variant shadow-sm">
          <div className="font-display-hero text-headline-md font-bold text-primary tracking-tight">My Profile</div>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shadow-sm overflow-hidden border border-border-light">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-[20px]">person</span>
              )}
            </div>
          </div>
        </header>

        {profile.isProfileComplete && (
          <div className="pt-8 pb-16 px-gutter max-w-container-max mx-auto w-full space-y-8">
            {/* Header Section */}
            <section className="flex flex-col md:flex-row items-center md:items-start gap-6 bg-surface-container-lowest p-6 rounded-2xl border border-border-light shadow-sm">
              <div className="relative group w-32 h-32 rounded-full bg-primary-container flex items-center justify-center shadow-ambient shrink-0 border-4 border-surface-container-lowest overflow-hidden">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-[64px] text-on-primary-container">person</span>
                )}
                {uploadingAvatar && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <FiLoader className="animate-spin text-white text-[32px]" />
                  </div>
                )}
                {!uploadingAvatar && (
                  <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity z-10">
                    <span className="material-symbols-outlined text-[24px]">photo_camera</span>
                    <span className="text-[10px] font-medium mt-1">Upload</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                )}
              </div>
              <div className="flex-1 text-center md:text-left pt-2">
                <h1 className="font-display-hero text-headline-lg text-on-surface">{profile.name}</h1>
                <p className="font-body-md text-body-lg text-on-surface-variant mb-4">{profile.email}</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-3">
                  {profile.resumeDetails?.portfolioUrl && (
                    <a href={profile.resumeDetails.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors">
                      <span className="material-symbols-outlined text-[18px]">language</span> Portfolio
                    </a>
                  )}
                  {profile.githubUsername && (
                    <a href={`https://github.com/${profile.githubUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors">
                      <FaGithub className="text-[18px]" /> GitHub
                    </a>
                  )}
                  {profile.leetcodeUsername && (
                    <a href={`https://leetcode.com/u/${profile.leetcodeUsername}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors">
                      <SiLeetcode className="text-[18px]" /> LeetCode
                    </a>
                  )}
                  {profile.linkedInUrl && (
                    <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors">
                      <FaLinkedin className="text-[18px]" /> LinkedIn
                    </a>
                  )}
                </div>
              </div>

              {/* Profile Strength Widget */}
              <div className="bg-white border border-border-light rounded-xl p-6 shadow-md w-full lg:w-80 shrink-0 relative overflow-hidden mt-6 md:mt-0">
                <div className="absolute -right-8 -top-8 w-32 h-32 bg-ai-gradient-start rounded-full blur-2xl"></div>
                <h3 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-4">Profile Strength</h3>
                <div className="flex items-end justify-between mb-2">
                  <span className="font-headline-lg text-headline-lg text-primary">{profileStrength}%</span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden mb-4">
                  <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${profileStrength}%` }}></div>
                </div>
                {profileStrength < 100 && missingSections.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {missingSections.map(section => (
                      <span key={section} className="text-[10px] font-bold bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded border border-border-light">
                        {section}
                      </span>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 flex flex-col gap-3">
                  <button 
                    onClick={() => setShowEditor(true)}
                    className="w-full bg-primary text-on-primary py-2 rounded-lg font-button-text hover:bg-on-primary-fixed transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit_document</span> Update Resume
                  </button>
                  {profile.resumeDetails?.portfolioUrl && (
                    <a 
                      href={profile.resumeDetails.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-surface-variant text-on-surface-variant py-2 rounded-lg font-button-text hover:bg-outline-variant transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">language</span> View Portfolio
                    </a>
                  )}
                  {profile.resumeUrl && (
                    <button 
                      onClick={() => setShowPdf(true)}
                      className="w-full bg-surface-variant text-on-surface-variant py-2 rounded-lg font-button-text hover:bg-outline-variant transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span> View PDF
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* LinkedIn Network Profile */}
            {profile.scrapedData?.linkedin && (
              <section className="bg-surface-container-lowest rounded-2xl p-6 border border-border-light shadow-sm">
                <div className="flex items-center gap-3 border-b border-surface-variant pb-4 mb-4">
                  <FaLinkedin className="text-[#0A66C2] text-[28px]" />
                  <h2 className="font-headline-md text-headline-sm text-on-surface">LinkedIn Overview</h2>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <h3 className="font-headline-sm font-bold text-on-surface mb-2">
                      {profile.scrapedData.linkedin.firstName} {profile.scrapedData.linkedin.lastName}
                    </h3>
                    <p className="text-body-md text-on-surface-variant mb-4">{profile.scrapedData.linkedin.headline}</p>
                    {profile.scrapedData.linkedin.about && (
                      <div className="bg-surface-container-low p-4 rounded-xl border border-border-light">
                        <h4 className="font-label-caps text-label-caps uppercase text-on-surface-variant mb-2">About</h4>
                        <p className="text-sm text-text-slate whitespace-pre-line">
                          {profile.scrapedData.linkedin.about.slice(0, 300)}
                          {profile.scrapedData.linkedin.about.length > 300 ? '...' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {profile.scrapedData.linkedin.certifications?.length > 0 && (
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-label-caps text-label-caps uppercase text-on-surface-variant">Top Certifications</h4>
                        <a href="/certificates" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                          Show More <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </a>
                      </div>
                      <div className="space-y-3">
                        {profile.scrapedData.linkedin.certifications.slice(0, 3).map((cert, i) => (
                          <div key={i} className="bg-surface-container-low p-3 rounded-xl border border-border-light flex flex-col">
                            <span className="font-bold text-on-surface text-sm truncate">{cert.title}</span>
                            <span className="text-xs text-on-surface-variant">{cert.issuedBy}</span>
                            {cert.link && (
                              <a href={cert.link} target="_blank" rel="noreferrer" className="text-[10px] text-primary mt-1 hover:underline truncate">
                                View Credential
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Quick Stats Grid */}
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
        )}
      </main>
    </div>
  );
}
