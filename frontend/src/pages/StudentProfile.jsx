import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import ImageCropperModal from '../components/ImageCropperModal';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import { FiLoader, FiGithub, FiLinkedin, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const formatExternalUrl = (url) => {
  if (!url) return '#';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
};

function ProfileSetupOverlay({ onComplete, user }) {
  const { showToast } = useToast();
  const isMissingCredential = !user.email || !user.uid;
  const missingLabel = !user.email ? 'College Email' : 'UID (e.g. 23-COMPA10-27)';
  const missingField = !user.email ? 'email' : 'uid';

  const [formData, setFormData] = useState({
    name: user.name || '',
    githubUsername: user.githubUsername || '',
    leetcodeUsername: user.leetcodeUsername || '',
    linkedInUrl: user.linkedInUrl || '',
    [missingField]: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (isMissingCredential && missingField === 'uid' && formData.uid) {
      const match = formData.uid.match(/^(\d{2})-([A-Za-z]+)([A-Za-z])(\d+)-(\d{2})$/);
      if (!match) {
        setError('Invalid UID format. Expected format: 23-COMPA10-27');
        setLoading(false);
        return;
      }
    }

    try {
      if (isMissingCredential && formData[missingField]) {
        await axios.post('/auth/link-account', { identifier: formData[missingField] });
      }
      const res = await axios.put('/user/profile', {
        name: formData.name,
        githubUsername: formData.githubUsername,
        leetcodeUsername: formData.leetcodeUsername,
        linkedInUrl: formData.linkedInUrl
      });
      showToast('Profile setup successfully!', 'success');
      onComplete(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest p-8 rounded-2xl shadow-ambient max-w-lg w-full border border-border-light max-h-[90vh] overflow-y-auto">
        <h2 className="text-headline-md font-bold text-on-surface mb-2">Complete Your Profile</h2>
        <p className="text-body-md text-on-surface-variant mb-6">
          {isMissingCredential 
            ? `Please link your ${!user.email ? 'Email' : 'UID'} and provide a few details to automatically fetch your coding metrics and set up your portfolio.`
            : `We need a few details to automatically fetch your coding metrics and set up your portfolio.`}
        </p>

        {error && <div className="p-3 mb-4 bg-error-container text-on-error-container rounded-lg text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isMissingCredential && (
            <div>
              <label className="block text-label-lg font-medium text-on-surface mb-1">{missingLabel}</label>
              <input required type="text" className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary transition-colors" placeholder={!user.email ? "student@university.edu" : "23-COMPA10-27"} value={formData[missingField]} onChange={e => setFormData({...formData, [missingField]: e.target.value})} />
            </div>
          )}
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
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
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
  const [githubUsername, setGithubUsername] = useState(profile?.githubUsername || '');
  const [leetcodeUsername, setLeetcodeUsername] = useState(profile?.leetcodeUsername || '');
  const [linkedInUrl, setLinkedInUrl] = useState(profile?.linkedInUrl || '');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [education, setEducation] = useState(profile?.resumeDetails?.education || []);
  const [experience, setExperience] = useState(profile?.resumeDetails?.experience || []);
  const [projects, setProjects] = useState(profile?.resumeDetails?.projects || []);
  const [achievements, setAchievements] = useState(profile?.resumeDetails?.achievements || []);
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
    if (e) e.preventDefault();
    const handlesChanged = 
      githubUsername !== (profile?.githubUsername || '') ||
      leetcodeUsername !== (profile?.leetcodeUsername || '') ||
      linkedInUrl !== (profile?.linkedInUrl || '');

    if (handlesChanged && !showConfirmModal) {
      setShowConfirmModal(true);
      return;
    }
    
    await executeSave();
  };

  const executeSave = async () => {
    setLoading(true);
    try {
      const payload = {
        portfolioUrl,
        skills: skillsStr.split(',').map(s => s.trim()).filter(Boolean),
        education,
        experience,
        projects,
        achievements,
        githubUsername,
        leetcodeUsername,
        linkedInUrl
      };
      const res = await axios.put('/user/portfolio', payload);
      onComplete(res.data.user);
      onClose();
      showToast('Resume saved successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save resume details', 'error');
    } finally {
      setLoading(false);
      setShowConfirmModal(false);
    }
  };

  const addEdu = () => setEducation([...education, { institution: '', degree: '', startYear: '', endYear: '' }]);
  const addExp = () => setExperience([...experience, { company: '', role: '', startDate: '', endDate: '', description: '' }]);
  const addProj = () => setProjects([...projects, { title: '', link: '', description: '' }]);
  const addAchieve = () => setAchievements([...achievements, { title: '', description: '', imageUrl: '', date: '' }]);

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
  const updateAchieve = (index, field, val) => {
    const newAchieve = [...achievements];
    newAchieve[index][field] = val;
    setAchievements(newAchieve);
  };

  const removeEdu = (index) => setEducation(education.filter((_, i) => i !== index));
  const removeExp = (index) => setExperience(experience.filter((_, i) => i !== index));
  const removeProj = (index) => setProjects(projects.filter((_, i) => i !== index));
  const removeAchieve = (index) => setAchievements(achievements.filter((_, i) => i !== index));

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
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-surface-variant text-on-surface-variant rounded-full hover:bg-outline-variant transition-colors">
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
          <section className="bg-surface-container-low p-4 rounded-xl border border-border-light space-y-4">
            <h3 className="font-bold text-label-lg text-on-surface mb-3 flex items-center gap-2"><span className="material-symbols-outlined text-primary">link</span> Online Profiles</h3>
            
            <div>
              <label className="block text-sm font-medium text-on-surface mb-1">Personal Portfolio</label>
              <input type="url" className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary" placeholder="https://yourportfolio.com" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">GitHub Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><FiGithub /></span>
                  <input type="text" className="w-full pl-9 p-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary" placeholder="octocat" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)} />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">LeetCode Username</label>
                <div className="relative">
                  <input type="text" className="w-full p-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary" placeholder="johndoe" value={leetcodeUsername} onChange={(e) => setLeetcodeUsername(e.target.value)} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-on-surface mb-1">LinkedIn Profile URL</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"><FiLinkedin /></span>
                  <input type="url" className="w-full pl-9 p-3 bg-surface border border-outline-variant rounded-lg text-on-surface focus:outline-none focus:border-primary" placeholder="https://linkedin.com/in/..." value={linkedInUrl} onChange={(e) => setLinkedInUrl(e.target.value)} />
                </div>
              </div>
            </div>
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

          {/* Achievements Section */}
          <section className="bg-surface-container-low p-4 rounded-xl border border-border-light space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-label-lg text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-primary">award_star</span> Achievements</h3>
              <button type="button" onClick={addAchieve} className="text-sm font-bold text-primary flex items-center gap-1 hover:underline"><span className="material-symbols-outlined text-[16px]">add</span> Add</button>
            </div>
            {achievements.map((ach, idx) => (
              <div key={idx} className="bg-surface p-4 rounded-lg border border-border-light relative gap-4 grid grid-cols-1 md:grid-cols-2">
                <button type="button" onClick={() => removeAchieve(idx)} className="absolute top-2 right-2 text-error"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                <div><label className="text-xs font-bold text-on-surface-variant">Title</label><input required className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={ach.title} onChange={e => updateAchieve(idx, 'title', e.target.value)} /></div>
                <div><label className="text-xs font-bold text-on-surface-variant">Date</label><input type="date" className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={ach.date?.split('T')[0] || ''} onChange={e => updateAchieve(idx, 'date', e.target.value)} /></div>
                <div className="md:col-span-2"><label className="text-xs font-bold text-on-surface-variant">Image URL (Optional)</label><input type="url" className="w-full p-2 border border-border-light rounded mt-1 bg-surface" placeholder="https://" value={ach.imageUrl} onChange={e => updateAchieve(idx, 'imageUrl', e.target.value)} /></div>
                <div className="md:col-span-2"><label className="text-xs font-bold text-on-surface-variant">Description</label><textarea rows="2" className="w-full p-2 border border-border-light rounded mt-1 bg-surface" value={ach.description} onChange={e => updateAchieve(idx, 'description', e.target.value)} /></div>
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
  const [avatarCropSrc, setAvatarCropSrc] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPdf, setShowPdf] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [verifyingPlatform, setVerifyingPlatform] = useState(null);
  const [verifyingLoad, setVerifyingLoad] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [userPlacementPosts, setUserPlacementPosts] = useState([]);

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

  useEffect(() => {
    if (profile?._id) {
      axios.get(`/placements/user/${profile._id}`)
        .then(res => setUserPlacementPosts(res.data || []))
        .catch(err => console.error('Failed to load user placement posts:', err));
    }
  }, [profile?._id]);

  const handleGenerateCodeAndVerify = async (platform) => {
    try {
      const res = await axios.post('/user/generate-verification-code');
      setProfile(res.data.user);
      setVerificationSuccess(false);
      setVerifyingPlatform(platform);
    } catch (err) {
      showToast('Failed to generate verification code', 'error');
    }
  };

  const handleVerify = async (platform) => {
    setVerifyingLoad(true);
    try {
      const res = await axios.post('/user/verify-platform', { platform });
      setProfile(res.data.user);
      setVerificationSuccess(true);
    } catch (err) {
      showToast(err.response?.data?.message || 'Verification failed', 'error');
    } finally {
      setVerifyingLoad(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(profile.verificationCode);
      showToast('Verification code copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy code. Please copy it manually.', 'error');
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener('load', () => setAvatarCropSrc(reader.result?.toString() || ''));
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset input
  };

  const handleAvatarCropComplete = async (croppedBlob) => {
    setAvatarCropSrc(null);
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', croppedBlob);

    try {
      const res = await axios.post('/user/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(res.data.user);
      showToast('Profile picture updated successfully!', 'success');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      showToast(err.response?.data?.message || 'Failed to update profile picture', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
        <Sidebar />
        <main className="flex-1 relative overflow-y-auto">
          <Topbar />
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
  const achievements = profile.resumeDetails?.achievements || [];
  const portfolioUrl = profile.resumeDetails?.portfolioUrl || '';
  const manualCerts = profile.resumeDetails?.certificates || [];
  const scrapedCerts = profile.scrapedData?.linkedin?.certifications || [];
  
  const certificatesMap = new Map();
  scrapedCerts.forEach(cert => certificatesMap.set(cert.title, { isComplete: false }));
  manualCerts.forEach(cert => certificatesMap.set(cert.title, cert));
  
  const allCertificates = Array.from(certificatesMap.values());
  const hasIncompleteCerts = allCertificates.length === 0 ? false : allCertificates.some(cert => !cert.isComplete);
  const hasCertificates = allCertificates.length > 0;

  const missingSections = [];
  if (skills.length === 0) missingSections.push('Skills');
  if (experience.length === 0) missingSections.push('Experience');
  if (education.length === 0) missingSections.push('Education');
  if (projects.length === 0) missingSections.push('Projects');
  if (achievements.length === 0) missingSections.push('Achievements');
  if (!portfolioUrl) missingSections.push('Portfolio');
  if (!hasCertificates || hasIncompleteCerts) missingSections.push('Certificates');

  let profileStrength = 10; // base
  if (skills.length > 0) profileStrength += 15;
  if (experience.length > 0) profileStrength += 15;
  if (education.length > 0) profileStrength += 15;
  if (projects.length > 0) profileStrength += 15;
  if (achievements.length > 0) profileStrength += 10;
  if (portfolioUrl) profileStrength += 10;
  if (hasCertificates && !hasIncompleteCerts) profileStrength += 10;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-on-surface font-body-lg">
      <Sidebar />
      {(!profile.isProfileComplete || !profile.email || !profile.uid) && <ProfileSetupOverlay onComplete={setProfile} user={profile} />}
      
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
      
      {selectedAchievement && (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-ambient max-w-2xl w-full border border-border-light max-h-[90vh] flex flex-col overflow-hidden relative">
            <div className="flex justify-between items-center p-4 md:p-6 border-b border-border-light bg-surface-container-lowest shrink-0">
              <h2 className="text-headline-sm font-bold text-on-surface">Achievement Details</h2>
              <button onClick={() => setSelectedAchievement(null)} className="w-10 h-10 flex items-center justify-center hover:bg-surface-variant rounded-full text-on-surface-variant transition-colors">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto">
              {selectedAchievement.imageUrl && (
                <img src={selectedAchievement.imageUrl} alt={selectedAchievement.title} className="w-full h-64 object-contain bg-surface-container rounded-xl mb-6 shadow-sm border border-border-light" />
              )}
              <h3 className="font-headline-md font-bold text-on-surface mb-2">{selectedAchievement.title}</h3>
              <span className="inline-block px-3 py-1 bg-surface-variant text-on-surface-variant text-xs font-bold rounded-md mb-6 uppercase tracking-wide">
                {selectedAchievement.date ? new Date(selectedAchievement.date).toLocaleDateString() : 'N/A'}
              </span>
              <p className="text-body-lg text-on-surface-variant whitespace-pre-line leading-relaxed">{selectedAchievement.description}</p>
            </div>
          </div>
        </div>
      )}

      {avatarCropSrc && (
        <ImageCropperModal
          imageSrc={avatarCropSrc}
          aspectRatio={1}
          onCropComplete={handleAvatarCropComplete}
          onCancel={() => setAvatarCropSrc(null)}
        />
      )}
      
      {verifyingPlatform && (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-ambient max-w-lg w-full border border-border-light p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-headline-sm font-bold">Verify {verifyingPlatform === 'github' ? 'GitHub' : 'LeetCode'}</h2>
              <button onClick={() => setVerifyingPlatform(null)} className="text-on-surface-variant hover:bg-surface-variant rounded-full p-1 flex items-center justify-center"><span className="material-symbols-outlined text-[20px]">close</span></button>
            </div>
            
            {verificationSuccess ? (
              <div className="text-center py-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-success text-[40px]">check_circle</span>
                </div>
                <h3 className="text-title-lg font-bold text-on-surface mb-2">Verification Successful!</h3>
                <p className="text-body-md text-on-surface-variant mb-6">
                  Your {verifyingPlatform === 'github' ? 'GitHub' : 'LeetCode'} account has been verified. You can now safely remove the code from your profile.
                </p>
                <button onClick={() => setVerifyingPlatform(null)} className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm">
                  Done
                </button>
              </div>
            ) : (
              <>
                <p className="text-body-md text-on-surface-variant mb-6 leading-relaxed">
                  To verify your account, please temporarily add the following code to your <strong>{verifyingPlatform === 'github' ? 'bio' : 'readme'}</strong> section on {verifyingPlatform === 'github' ? 'GitHub' : 'LeetCode'}.
                </p>
                <div className="bg-surface p-4 rounded-lg font-mono text-xl font-bold border border-border-light mb-6 text-primary flex items-center justify-between">
                  <span className="select-all">{profile.verificationCode}</span>
                  <button onClick={handleCopyCode} className="text-on-surface-variant hover:text-primary transition-colors p-2 rounded-md hover:bg-surface-variant flex items-center justify-center" title="Copy to clipboard">
                    <span className="material-symbols-outlined text-[20px]">content_copy</span>
                  </button>
                </div>
                <button 
                  onClick={() => handleVerify(verifyingPlatform)} 
                  disabled={verifyingLoad}
                  className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center gap-2"
                >
                  {verifyingLoad ? <FiLoader className="animate-spin text-[20px]" /> : 'Verify Now'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      <main className="flex-1 relative bg-surface">
        <Topbar />
        
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
                    <div className="relative group" title={!profile.githubVerified ? "Please verify your GitHub account" : "Verified GitHub account"}>
                      {profile.githubVerified ? (
                        <a 
                          href={`https://github.com/${profile.githubUsername}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors border bg-green-50 border-green-200 hover:bg-green-100 text-green-800"
                        >
                          <FaGithub className="text-[18px]" /> GitHub
                          <span className="material-symbols-outlined text-green-600 text-[16px]">verified</span>
                        </a>
                      ) : (
                        <button 
                          onClick={() => handleGenerateCodeAndVerify('github')}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors border bg-red-50 border-red-200 hover:bg-red-100 text-red-800"
                        >
                          <FaGithub className="text-[18px]" /> GitHub
                        </button>
                      )}
                      {!profile.githubVerified && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm pointer-events-none animate-pulse" />
                      )}
                    </div>
                  )}
                  {profile.leetcodeUsername && (
                    <div className="relative group" title={!profile.leetcodeVerified ? "Please verify your LeetCode account" : "Verified LeetCode account"}>
                      {profile.leetcodeVerified ? (
                        <a 
                          href={`https://leetcode.com/u/${profile.leetcodeUsername}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors border bg-green-50 border-green-200 hover:bg-green-100 text-green-800"
                        >
                          <SiLeetcode className="text-[18px]" /> LeetCode
                          <span className="material-symbols-outlined text-green-600 text-[16px]">verified</span>
                        </a>
                      ) : (
                        <button 
                          onClick={() => handleGenerateCodeAndVerify('leetcode')}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors border bg-red-50 border-red-200 hover:bg-red-100 text-red-800"
                        >
                          <SiLeetcode className="text-[18px]" /> LeetCode
                        </button>
                      )}
                      {!profile.leetcodeVerified && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm pointer-events-none animate-pulse" />
                      )}
                    </div>
                  )}
                  {profile.linkedInUrl && (
                    <a href={profile.linkedInUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors">
                      <FaLinkedin className="text-[18px]" /> LinkedIn
                    </a>
                  )}
                  {profile.resumeUrl && (
                    <button 
                      onClick={() => setShowPdf(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-bg-subtle border border-border-light rounded-md text-sm hover:bg-surface-variant transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span> Resume
                    </button>
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
                        <Link to="/certificates" className="text-primary text-sm font-bold hover:underline flex items-center gap-1">
                          Show More <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                      </div>
                      <div className="space-y-3">
                        {profile.scrapedData.linkedin.certifications.slice(0, 3).map((cert, i) => (
                          <div key={i} className="bg-surface-container-low p-3 rounded-xl border border-border-light flex flex-col">
                            <span className="font-bold text-on-surface text-sm truncate">{cert.title}</span>
                            <span className="text-xs text-on-surface-variant">{cert.issuedBy}</span>
                            {cert.link && (
                              <a href={formatExternalUrl(cert.link)} target="_blank" rel="noreferrer" className="text-[10px] text-primary mt-1 hover:underline truncate">
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

            <div className="mt-8 space-y-8">
              <section>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-headline-md text-headline-md text-on-surface">Projects</h2>
                  </div>
                  {projects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {projects.map((proj, idx) => (
                        <div key={idx} className="bg-surface-container-low border border-border-light rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col h-full">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-on-surface">{proj.title}</h3>
                            {proj.link && (
                              <a href={formatExternalUrl(proj.link)} target="_blank" rel="noreferrer" className="text-primary hover:bg-primary-container p-1 rounded transition-colors" title="View Project">
                                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-text-slate line-clamp-3">{proj.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-surface-container-low border border-border-light border-dashed rounded-xl p-8 text-center text-on-surface-variant">
                      No projects added. Update your resume to populate this section.
                    </div>
                  )}
                </section>

                <section className="mt-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2"><span className="material-symbols-outlined text-primary">award_star</span> Achievements</h2>
                  </div>
                  {(profile.resumeDetails?.achievements && profile.resumeDetails.achievements.length > 0) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.resumeDetails.achievements.map((ach, idx) => (
                        <div key={idx} onClick={() => setSelectedAchievement(ach)} className="bg-surface border border-border-light rounded-xl overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full cursor-pointer">
                          {ach.imageUrl && (
                            <img src={ach.imageUrl} alt={ach.title} className="w-full h-40 object-contain bg-surface-container" />
                          )}
                          <div className="p-5 flex flex-col flex-1">
                            <h3 className="font-bold text-on-surface mb-1">{ach.title}</h3>
                            <span className="text-[10px] text-text-slate mb-3 uppercase tracking-wider">{ach.date ? new Date(ach.date).toLocaleDateString() : 'N/A'}</span>
                            <p className="text-sm text-on-surface-variant line-clamp-3 mt-auto">{ach.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-surface-container-low border border-border-light border-dashed rounded-xl p-8 text-center text-on-surface-variant">
                      No achievements yet.
                    </div>
                  )}
                </section>

                {/* Placed Students Posts Section */}
                <section className="mt-10 pt-8 border-t border-border-light">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">military_tech</span>
                        {profile.name ? `${profile.name}'s Posts` : "Placement Experiences"}
                      </h2>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Interview rounds, online assessments, and placement guides shared with the community.
                      </p>
                    </div>

                    <Link
                      to="/placements/create"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container text-xs font-bold transition-all shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">add</span> Share Experience
                    </Link>
                  </div>

                  {userPlacementPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userPlacementPosts.map((post) => (
                        <div
                          key={post._id}
                          className="bg-surface-container-lowest border border-border-light hover:border-primary/40 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-surface-container-low border border-border-light p-1 flex items-center justify-center shrink-0">
                                  {post.company?.logoUrl ? (
                                    <img src={post.company.logoUrl} alt={post.company.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <span className="font-bold text-xs text-primary">{(post.company?.name || 'C').charAt(0)}</span>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-bold text-sm text-on-surface">{post.company?.name}</h3>
                                  <span className="text-xs text-on-surface-variant font-medium">{post.role}</span>
                                </div>
                              </div>

                              {post.outcome === 'selected' && (
                                <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-700 font-bold text-[10px]">
                                  Selected
                                </span>
                              )}
                            </div>

                            <Link to={`/placements/${post._id}`} className="block group">
                              <h4 className="font-bold text-sm text-on-surface group-hover:text-primary transition-colors line-clamp-2 mt-2">
                                {post.title}
                              </h4>
                            </Link>
                          </div>

                          <div className="flex items-center justify-between pt-3 mt-4 border-t border-border-light/60 text-xs text-on-surface-variant">
                            <span className="font-mono text-[11px]">
                              {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                            </span>

                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                💬 {post.commentCount || 0}
                              </span>
                              <Link
                                to={`/placements/${post._id}`}
                                className="text-primary font-bold hover:underline"
                              >
                                View →
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-surface-container-low border border-border-light border-dashed rounded-2xl p-8 text-center text-on-surface-variant space-y-2">
                      <p className="text-sm font-semibold">No placement experiences shared yet.</p>
                      <p className="text-xs text-on-surface-variant/70">
                        Help fellow students by sharing your selection process and interview insights!
                      </p>
                    </div>
                  )}
                </section>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
}
