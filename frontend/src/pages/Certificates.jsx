import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { FiLoader } from 'react-icons/fi';

export default function Certificates() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    issuer: '',
    issueDate: '',
    credentialUrl: '',
    fileUrl: ''
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/user/profile');
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const manualCerts = profile?.resumeDetails?.certificates || [];
  const scrapedCerts = profile?.scrapedData?.linkedin?.certifications || [];
  
  // Combine them, preferring manualCerts if titles match
  const certificatesMap = new Map();
  
  scrapedCerts.forEach(cert => {
    certificatesMap.set(cert.title, {
      title: cert.title,
      issuer: cert.issuedBy,
      issueDate: cert.issuedAt,
      credentialUrl: cert.link,
      fileUrl: '',
      isComplete: false
    });
  });

  manualCerts.forEach(cert => {
    certificatesMap.set(cert.title, cert);
  });

  const certificates = Array.from(certificatesMap.values());

  const handleOpenModal = (index = null) => {
    if (index !== null) {
      setEditingIndex(index);
      setFormData(certificates[index]);
    } else {
      setEditingIndex(null);
      setFormData({ title: '', issuer: '', issueDate: '', credentialUrl: '', fileUrl: '' });
    }
    setIsModalOpen(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const form = new FormData();
    form.append('file', file);

    try {
      const res = await axios.post('/user/upload-cert-file', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, fileUrl: res.data.fileUrl, isComplete: true }));
    } catch (err) {
      console.error('File upload failed', err.response?.data || err);
      const errorMsg = err.response?.data?.details?.message || err.response?.data?.message || err.message;
      alert('Failed to upload file: ' + errorMsg);
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    let updatedCerts = [...certificates];
    
    // Determine completeness based on file URL existing
    const newCert = { ...formData, isComplete: !!formData.fileUrl };

    if (editingIndex !== null) {
      updatedCerts[editingIndex] = newCert;
    } else {
      updatedCerts.push(newCert);
    }

    try {
      await axios.put('/user/portfolio', { certificates: updatedCerts });
      await fetchProfile(); // refresh data
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save certificate', err);
      alert('Failed to save certificate');
    } finally {
      setSaving(false);
    }
  };

  // Helper to get thumbnail url. If it's a PDF on cloudinary, replacing .pdf with .jpg gets a thumbnail.
  const getThumbnailUrl = (url) => {
    if (!url) return '';
    if (url.toLowerCase().endsWith('.pdf')) {
      return url.substring(0, url.lastIndexOf('.')) + '.jpg';
    }
    return url;
  };

  return (
    <div className="flex min-h-screen bg-background text-on-surface font-body-lg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-surface-container-lowest">
        <Topbar />
        
        <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="font-display-hero text-display-hero text-on-surface">Command Center: Certificates</h1>
              <p className="text-body-lg text-on-surface-variant mt-2">Manage, upload, and verify your credentials.</p>
            </div>
            <button 
              onClick={() => handleOpenModal()} 
              className="bg-primary text-on-primary px-6 py-3 rounded-lg font-button-text hover:bg-on-primary-fixed transition-colors shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined">add</span>
              Add Certificate
            </button>
          </header>

          {loading ? (
            <div className="flex justify-center py-20">
              <FiLoader className="animate-spin text-[48px] text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {certificates.length > 0 ? (
                certificates.map((cert, index) => (
                  <div key={index} className="bg-surface-container-lowest border border-border-light rounded-2xl overflow-hidden shadow-ambient hover:shadow-md transition-all group flex flex-col">
                    {/* Thumbnail Area */}
                    <div className="h-48 bg-surface-variant relative flex items-center justify-center border-b border-border-light overflow-hidden">
                      {cert.fileUrl ? (
                        <img 
                          src={getThumbnailUrl(cert.fileUrl)} 
                          alt={cert.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Document' }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-error-container/30 backdrop-blur-sm flex flex-col items-center justify-center text-error">
                          <span className="material-symbols-outlined text-[48px] mb-2 opacity-80">error</span>
                          <span className="font-label-lg uppercase tracking-wider font-bold">Incomplete</span>
                          <span className="text-xs mt-1 opacity-80">Missing Verification Document</span>
                        </div>
                      )}
                      
                      {/* Edit overlay on hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => handleOpenModal(index)}
                          className="bg-white text-black px-4 py-2 rounded-lg font-medium flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all"
                        >
                          <span className="material-symbols-outlined text-[20px]">edit</span>
                          Edit Details
                        </button>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col justify-between bg-surface-container-lowest">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-headline-sm font-bold text-on-surface leading-tight pr-4">{cert.title}</h3>
                          {!cert.fileUrl && (
                            <span className="w-3 h-3 rounded-full bg-error shrink-0 mt-1 shadow-[0_0_8px_rgba(186,26,26,0.6)]"></span>
                          )}
                        </div>
                        <p className="text-body-md text-on-surface-variant font-medium flex items-center gap-1.5 mb-1">
                          <span className="material-symbols-outlined text-[18px]">account_balance</span>
                          {cert.issuer || 'Unknown Issuer'}
                        </p>
                        {cert.issueDate && (
                          <p className="text-sm text-text-slate flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
                            {cert.issueDate}
                          </p>
                        )}
                      </div>
                      
                      {cert.credentialUrl && (
                        <div className="mt-6 pt-4 border-t border-border-light">
                          <a 
                            href={cert.credentialUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm font-button-text text-primary flex items-center gap-1 hover:underline w-fit"
                          >
                            Verify Credential <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full bg-surface-container-low border border-border-light border-dashed rounded-2xl p-16 text-center flex flex-col items-center">
                  <span className="material-symbols-outlined text-[64px] text-on-surface-variant mb-6">workspace_premium</span>
                  <h3 className="text-headline-md font-bold text-on-surface mb-3">No Certificates Verified</h3>
                  <p className="text-on-surface-variant text-lg max-w-lg mb-8">
                    Your portfolio is currently missing certifications. Manually add your credentials or refresh your metrics to import from LinkedIn.
                  </p>
                  <button onClick={() => handleOpenModal()} className="bg-primary text-on-primary px-8 py-3 rounded-lg font-button-text hover:bg-on-primary-fixed transition-colors shadow-md">
                    Add Your First Certificate
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-surface-container-lowest w-full max-w-2xl rounded-3xl shadow-ambient border border-border-light overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-border-light flex justify-between items-center bg-surface-container-lowest">
              <h2 className="text-headline-md font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">{editingIndex !== null ? 'edit_document' : 'add_circle'}</span>
                {editingIndex !== null ? 'Edit Certificate' : 'Add New Certificate'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface p-2 bg-surface-container-high rounded-full transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto bg-surface flex-1">
              <form id="cert-form" onSubmit={handleSave} className="space-y-6">
                
                {/* File Upload Area */}
                <div className="mb-8">
                  <label className="block text-label-lg font-bold text-on-surface mb-2">Verification Document</label>
                  <div className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center transition-all ${formData.fileUrl ? 'border-primary/50 bg-primary-container/10' : 'border-border-light hover:border-primary/50 bg-surface-container-lowest'}`}>
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    
                    {uploadingFile ? (
                      <div className="flex flex-col items-center text-primary">
                        <FiLoader className="animate-spin text-[32px] mb-3" />
                        <span className="font-medium">Uploading Document...</span>
                      </div>
                    ) : formData.fileUrl ? (
                      <div className="flex flex-col items-center text-primary text-center">
                        <span className="material-symbols-outlined text-[48px] mb-2 text-primary">task</span>
                        <span className="font-bold text-lg mb-1">Document Uploaded!</span>
                        <span className="text-sm text-on-surface-variant">Click or drag to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-on-surface-variant text-center">
                        <span className="material-symbols-outlined text-[48px] mb-3 opacity-80">cloud_upload</span>
                        <span className="font-bold text-lg text-on-surface mb-1">Upload PDF or Image</span>
                        <span className="text-sm">Drag and drop or click to browse</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-label-lg font-bold text-on-surface">Certificate Title *</label>
                    <input 
                      required
                      type="text" 
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="e.g. AWS Certified Solutions Architect"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-label-lg font-bold text-on-surface">Issuing Organization *</label>
                    <input 
                      required
                      type="text" 
                      value={formData.issuer}
                      onChange={e => setFormData({...formData, issuer: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="e.g. Amazon Web Services"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-label-lg font-bold text-on-surface">Issue Date</label>
                    <input 
                      type="text" 
                      value={formData.issueDate}
                      onChange={e => setFormData({...formData, issueDate: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="e.g. May 2023 or 2023-05-12"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-label-lg font-bold text-on-surface">Credential URL</label>
                    <input 
                      type="url" 
                      value={formData.credentialUrl}
                      onChange={e => setFormData({...formData, credentialUrl: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-border-light bg-surface-container-low focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      placeholder="https://www.credly.com/badges/..."
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-border-light bg-surface-container-lowest flex justify-end gap-4">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-lg font-medium text-on-surface-variant hover:bg-surface-container-high transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="cert-form"
                disabled={saving || uploadingFile}
                className="bg-primary text-on-primary px-8 py-2.5 rounded-lg font-button-text hover:bg-on-primary-fixed transition-colors shadow flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <FiLoader className="animate-spin" /> : <span className="material-symbols-outlined text-[20px]">save</span>}
                Save Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
