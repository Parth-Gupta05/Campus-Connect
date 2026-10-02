import React, { useState, useMemo, useRef } from 'react';
import axios from 'axios';
import AnimatedModal from './ui/AnimatedModal';
import { useToast } from '../context/ToastContext';
import { Upload, X, CheckCircle2, Loader2, AlertCircle, Clock } from 'lucide-react';

export default function AcademicVaultModal({ isOpen, onClose, onDismiss, profile, resumeEducation = [], onVaultUpdated }) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('semesters'); // 'semesters' or 'education'

  // Calculate missing semesters
  const currentSem = profile?.currentSem || 1;
  const requiredSems = Math.max(0, currentSem - 1);
  const uploadedSems = profile?.semesterRecords?.map(r => r.semester) || [];
  
  // Calculate missing past education
  const pastEdu = profile?.pastEducation?.map(e => e.level) || [];
  const has10th = pastEdu.includes('10th');
  const has12thOrDiploma = pastEdu.includes('12th') || pastEdu.includes('Diploma');

  // Extract prefill data from resume education
  // Resume education structure: [{ level, degree, institution, startYear, endYear }]
  const prefill = useMemo(() => {
    const data = { '10th': {}, '12th': {}, 'Diploma': {} };
    if (resumeEducation && resumeEducation.length > 0) {
      for (const edu of resumeEducation) {
        const level = (edu.level || '').toLowerCase();
        const score = edu.grade || edu.cgpa || '';
        if (level.includes('10th') || level.includes('high school') || level.includes('ssc') || level.includes('secondary')) {
          data['10th'] = { institution: edu.institution || edu.degree || '', passingYear: edu.endYear || '', score: String(score) };
        } else if (level.includes('12th') || level.includes('hsc') || level.includes('senior secondary') || level.includes('intermediate')) {
          data['12th'] = { institution: edu.institution || edu.degree || '', passingYear: edu.endYear || '', score: String(score) };
        } else if (level.includes('diploma')) {
          data['Diploma'] = { institution: edu.institution || edu.degree || '', passingYear: edu.endYear || '', score: String(score) };
        }
      }
    }
    return data;
  }, [resumeEducation]);

  // Form states for uploading a new record
  const [uploadData, setUploadData] = useState({
    type: 'semester',
    semester: '',
    level: '10th',
    institution: prefill['10th']?.institution || '',
    passingYear: prefill['10th']?.passingYear || '',
    score: '',
    file: null
  });

  const isVaultComplete = uploadedSems.length >= requiredSems && has10th && has12thOrDiploma;

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData(prev => ({ ...prev, file: e.target.files[0] }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadData.file) {
      showToast('Please select a scanned marksheet to upload', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('type', uploadData.type);
      
      if (uploadData.type === 'semester') {
        formData.append('semester', uploadData.semester);
        formData.append('score', uploadData.score); // SGPA
      } else {
        formData.append('level', uploadData.level);
        formData.append('institution', uploadData.institution);
        formData.append('passingYear', uploadData.passingYear);
        formData.append('score', uploadData.score);
      }

      const res = await axios.post('/user/academic-vault/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showToast('Document securely uploaded to vault!', 'success');
      onVaultUpdated(res.data.user);
      
      // Reset form
      setUploadData(prev => ({ ...prev, file: null, score: '', semester: '' }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to upload document', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatedModal isOpen={isOpen} onClose={() => isVaultComplete && onClose()}>
      <div className="bg-background-100 border border-gray-400 p-6 md:p-8 rounded-2xl w-full max-w-2xl shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {isVaultComplete && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-700 hover:text-gray-1000 p-1.5 rounded-md hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="mb-6 border-b border-gray-400 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
              <Upload className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-heading-18 font-bold text-gray-1000 tracking-tight">Academic Vault</h2>
          </div>
          <p className="text-sm text-gray-700 ml-11">
            Securely store your official academic records. These documents verify your academic performance.
          </p>
          
          {!isVaultComplete && (
            <div className="mt-4 flex flex-col gap-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3 text-amber-800">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <div className="text-sm">
                  <strong className="block font-semibold mb-0.5">Action Required</strong>
                  You must complete your Academic Vault before you can fully access Campus Connect opportunities.
                </div>
              </div>
              {onDismiss && (
                <button 
                  onClick={onDismiss}
                  className="self-end text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Remind me later
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 mb-6 border-b border-gray-400">
          <button
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'semesters' ? 'border-gray-1000 text-gray-1000' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => {
              setActiveTab('semesters');
              setUploadData(prev => ({ ...prev, type: 'semester', score: '', file: null }));
            }}
          >
            University Semesters
          </button>
          <button
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'education' ? 'border-gray-1000 text-gray-1000' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => {
              setActiveTab('education');
              const defaultLevel = !has10th ? '10th' : '12th';
              const pre = prefill[defaultLevel] || {};
              setUploadData(prev => ({ ...prev, type: 'pastEducation', level: defaultLevel, institution: pre.institution || '', passingYear: pre.passingYear || '', score: pre.score || '', file: null }));
            }}
          >
            Past Education
          </button>
        </div>

        {activeTab === 'semesters' && (
          <div className="space-y-6">
            <div className="bg-background-200 rounded-xl p-4 border border-gray-400 text-sm">
              <div className="font-semibold text-gray-1000 mb-1">Required Semesters ({uploadedSems.length} / {requiredSems})</div>
              <p className="text-gray-700 text-xs">Based on your current semester ({currentSem}), you must upload official marksheets for all completed semesters.</p>
              
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {Array.from({ length: requiredSems }).map((_, i) => {
                  const sem = i + 1;
                  const isUploaded = uploadedSems.includes(sem);
                  return (
                    <div key={sem} className={`p-2 rounded-lg border text-center ${isUploaded ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-background-100 border-gray-400 text-gray-600'}`}>
                      <div className="text-xs font-semibold">Semester {sem}</div>
                      {isUploaded ? <CheckCircle2 className="w-4 h-4 mx-auto mt-1" /> : <div className="text-[10px] mt-1">Pending</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {uploadedSems.length < requiredSems && (
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Select Semester</label>
                    <select 
                      className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-sm"
                      value={uploadData.semester}
                      onChange={e => setUploadData(prev => ({ ...prev, semester: e.target.value }))}
                      required
                    >
                      <option value="">Choose Semester...</option>
                      {Array.from({ length: requiredSems }).map((_, i) => {
                        const sem = i + 1;
                        if (!uploadedSems.includes(sem)) {
                          return <option key={sem} value={sem}>Semester {sem}</option>
                        }
                        return null;
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">SGPA</label>
                    <input 
                      type="number" step="0.01" min="0" max="10" required
                      className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-sm"
                      placeholder="e.g., 8.54"
                      value={uploadData.score}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '' || (Number(val) >= 0 && Number(val) <= 10)) {
                          setUploadData(prev => ({ ...prev, score: val }));
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Official Marksheet Scan (PDF/Image)</label>
                  <input 
                    ref={fileInputRef}
                    type="file" accept="image/*,.pdf" required
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-1000 file:text-background-100 hover:file:opacity-90"
                  />
                </div>

                <button 
                  type="submit" disabled={uploading || !uploadData.semester || !uploadData.score || !uploadData.file}
                  className="w-full py-2.5 rounded-lg bg-gray-1000 text-background-100 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Uploading securely...' : 'Upload to Vault'}
                </button>
              </form>
            )}
          </div>
        )}

        {activeTab === 'education' && (
          <div className="space-y-6">
            <div className="bg-background-200 rounded-xl p-4 border border-gray-400 text-sm">
              <div className="font-semibold text-gray-1000 mb-1">Required Past Education</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className={`p-2 rounded-lg border text-center ${has10th ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-background-100 border-gray-400 text-gray-600'}`}>
                  <div className="text-xs font-semibold">10th Standard</div>
                  {has10th ? <CheckCircle2 className="w-4 h-4 mx-auto mt-1" /> : <div className="text-[10px] mt-1">Pending</div>}
                </div>
                <div className={`p-2 rounded-lg border text-center ${has12thOrDiploma ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-background-100 border-gray-400 text-gray-600'}`}>
                  <div className="text-xs font-semibold">12th / Diploma</div>
                  {has12thOrDiploma ? <CheckCircle2 className="w-4 h-4 mx-auto mt-1" /> : <div className="text-[10px] mt-1">Pending</div>}
                </div>
              </div>
            </div>

            {(!has10th || !has12thOrDiploma) && (
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Education Level</label>
                    <select 
                      className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-sm"
                      value={uploadData.level}
                      onChange={e => {
                        const newLevel = e.target.value;
                        const pre = prefill[newLevel] || {};
                        setUploadData(prev => ({ 
                          ...prev, 
                          level: newLevel,
                          institution: pre.institution || '',
                          passingYear: pre.passingYear || '',
                          score: pre.score || ''
                        }));
                      }}
                    >
                      <option value="">Choose Level...</option>
                      {!has10th && <option value="10th">10th Standard</option>}
                      {!has12thOrDiploma && <option value="12th">12th Standard</option>}
                      {!has12thOrDiploma && <option value="Diploma">Diploma</option>}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Percentage / CGPA</label>
                    <input 
                      type="number" step="0.01" min="0" max="100" required
                      className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-sm"
                      placeholder="e.g., 92.4"
                      value={uploadData.score}
                      onChange={e => setUploadData(prev => ({ ...prev, score: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Institution / School Board</label>
                    <input 
                      type="text" required
                      className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-sm"
                      placeholder="e.g., CBSE, Delhi"
                      value={uploadData.institution}
                      onChange={e => setUploadData(prev => ({ ...prev, institution: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Passing Year</label>
                    <input 
                      type="text" required
                      className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-sm"
                      placeholder="e.g., 2021"
                      value={uploadData.passingYear}
                      onChange={e => setUploadData(prev => ({ ...prev, passingYear: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Official Marksheet Scan (PDF/Image)</label>
                  <input 
                    ref={fileInputRef}
                    type="file" accept="image/*,.pdf" required
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 bg-background-100 border border-gray-400 rounded-md text-sm file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-1000 file:text-background-100 hover:file:opacity-90"
                  />
                </div>

                <button 
                  type="submit" disabled={uploading || !uploadData.level || !uploadData.score || !uploadData.file}
                  className="w-full py-2.5 rounded-lg bg-gray-1000 text-background-100 text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploading ? 'Uploading securely...' : 'Upload to Vault'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </AnimatedModal>
  );
}
