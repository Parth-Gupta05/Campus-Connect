import React, { useContext, useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import PageHeader from '../components/ui/PageHeader';
import PdfViewerModal from '../components/PdfViewerModal';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  ExternalLink,
  FileText,
  Plus,
  Search,
  X,
  RotateCw,
  Edit2,
  Trash2,
  UploadCloud,
  Eye,
  Check,
  FileCheck,
  Lock,
  Sparkles
} from 'lucide-react';

export default function Certificates() {
  const { user } = useContext(AuthContext);
  const { showToast } = useToast();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search state
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'verified' | 'pending'
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('title_asc'); // 'title_asc' | 'title_desc' | 'newest' | 'verified_first'

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Document Viewer Modal (PDF / Image)
  const [viewingDoc, setViewingDoc] = useState(null); // { url, title, isPdf }

  const fetchProfile = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await axios.get('/user/profile');
      setProfile(res.data);
    } catch (err) {
      console.error('Error loading profile certificates:', err);
      showToast('Failed to load certificates', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Merge manual certificates & scraped LinkedIn certificates (preferring manual entries)
  const certificates = useMemo(() => {
    const manualCerts = profile?.resumeDetails?.certificates || [];
    const scrapedCerts = profile?.scrapedData?.linkedin?.certifications || [];

    const map = new Map();

    scrapedCerts.forEach((cert) => {
      if (cert.title) {
        map.set(cert.title, {
          title: cert.title,
          issuer: cert.issuedBy || 'Unknown Organization',
          issueDate: cert.issuedAt || '',
          credentialUrl: cert.link || '',
          fileUrl: '',
          isComplete: false,
          isImported: true
        });
      }
    });

    manualCerts.forEach((cert) => {
      const c = cert.toObject ? cert.toObject() : cert;
      if (c.title) {
        map.set(c.title, {
          ...c,
          isComplete: !!c.fileUrl,
          isVerified: c.issuedByClub ? true : !!c.fileUrl,
          issuedByClub: !!c.issuedByClub,
          clubId: c.clubId,
          eventId: c.eventId,
          isImported: false
        });
      }
    });

    return Array.from(map.values());
  }, [profile]);

  // Derived groups
  const verifiedCerts = useMemo(() => {
    return certificates.filter((c) => !!c.fileUrl);
  }, [certificates]);

  const pendingCerts = useMemo(() => {
    return certificates.filter((c) => !c.fileUrl);
  }, [certificates]);

  // Filtered & Sorted list
  const filteredCertificates = useMemo(() => {
    let base = certificates;
    if (activeTab === 'verified') base = verifiedCerts;
    else if (activeTab === 'pending') base = pendingCerts;

    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter(
        (c) =>
          c.title?.toLowerCase().includes(q) ||
          c.issuer?.toLowerCase().includes(q) ||
          c.issueDate?.toLowerCase().includes(q)
      );
    }

    return [...base].sort((a, b) => {
      if (sortBy === 'title_desc') {
        return (b.title || '').localeCompare(a.title || '');
      }
      if (sortBy === 'verified_first') {
        const aVal = a.fileUrl ? 1 : 0;
        const bVal = b.fileUrl ? 1 : 0;
        return bVal - aVal;
      }
      if (sortBy === 'newest') {
        return (b.issueDate || '').localeCompare(a.issueDate || '');
      }
      return (a.title || '').localeCompare(b.title || '');
    });
  }, [certificates, verifiedCerts, pendingCerts, activeTab, search, sortBy]);

  // Modal Open Handler
  const handleOpenModal = (index = null) => {
    if (index !== null) {
      if (certificates[index]?.issuedByClub) {
        showToast('Official credentials issued by clubs cannot be edited directly.', 'info');
        return;
      }
      setEditingIndex(index);
      setFormData({
        title: certificates[index]?.title || '',
        issuer: certificates[index]?.issuer || '',
        issueDate: certificates[index]?.issueDate || '',
        credentialUrl: certificates[index]?.credentialUrl || '',
        fileUrl: certificates[index]?.fileUrl || ''
      });
    } else {
      setEditingIndex(null);
      setFormData({
        title: '',
        issuer: '',
        issueDate: '',
        credentialUrl: '',
        fileUrl: ''
      });
    }
    setIsModalOpen(true);
  };

  // Upload certificate document to Cloudinary
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
      const uploadedFileUrl = res.data.fileUrl;
      setFormData((prev) => ({ ...prev, fileUrl: uploadedFileUrl }));
      showToast('Document uploaded! Click Save Certificate to apply changes.', 'success');
    } catch (err) {
      console.error('File upload failed:', err.response?.data || err);
      const errorMsg =
        err.response?.data?.details?.message ||
        err.response?.data?.message ||
        err.message ||
        'Upload failed';
      showToast(`Upload failed: ${errorMsg}`, 'error');
    } finally {
      setUploadingFile(false);
    }
  };

  // Save Certificate
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.issuer.trim()) {
      showToast('Title and Issuing Organization are required', 'error');
      return;
    }

    setSaving(true);
    const newCert = {
      title: formData.title.trim(),
      issuer: formData.issuer.trim(),
      issueDate: formData.issueDate.trim(),
      credentialUrl: formData.credentialUrl.trim(),
      fileUrl: formData.fileUrl.trim(),
      isComplete: !!formData.fileUrl.trim()
    };

    let updatedCerts = [...certificates];
    if (editingIndex !== null) {
      updatedCerts[editingIndex] = {
        ...updatedCerts[editingIndex],
        ...newCert
      };
    } else {
      updatedCerts.push(newCert);
    }

    try {
      await axios.put('/user/portfolio', { certificates: updatedCerts });
      showToast(
        editingIndex !== null ? 'Certificate updated successfully' : 'Certificate added successfully',
        'success'
      );
      await fetchProfile();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save certificate:', err);
      showToast('Failed to save certificate', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Delete Certificate
  const handleDelete = async (indexToDelete) => {
    if (certificates[indexToDelete]?.issuedByClub) {
      showToast('Official credentials issued by clubs cannot be deleted.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to remove this certificate?')) return;

    try {
      const updatedCerts = certificates.filter((_, idx) => idx !== indexToDelete);
      await axios.put('/user/portfolio', { certificates: updatedCerts });
      showToast('Certificate removed', 'success');
      await fetchProfile();
    } catch (err) {
      console.error('Failed to delete certificate:', err);
      showToast('Failed to remove certificate', 'error');
    }
  };

  // Helper to open document preview
  const handleViewDoc = (cert) => {
    if (!cert.fileUrl) return;
    const isPdf = cert.fileUrl.toLowerCase().includes('.pdf');
    setViewingDoc({
      url: cert.fileUrl,
      title: `${cert.title} Document`,
      isPdf
    });
  };

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (isModalOpen || viewingDoc) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen, viewingDoc]);

  // Ensure body scroll is always restored if page unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Helper to get thumbnail url (Cloudinary transforms .pdf to .jpg)
  const getThumbnailUrl = (url) => {
    if (!url) return '';
    if (url.toLowerCase().endsWith('.pdf')) {
      return url.substring(0, url.lastIndexOf('.')) + '.jpg';
    }
    return url;
  };

  // Helper to convert any valid date string to YYYY-MM-DD for native date picker
  const toIsoDateString = (dateStr) => {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) return '';
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Helper to convert YYYY-MM-DD into a formatted string (e.g. "Jan 31, 2025")
  const formatDisplayDate = (isoStr) => {
    if (!isoStr) return '';
    const parsed = new Date(isoStr + 'T00:00:00');
    if (isNaN(parsed.getTime())) return isoStr;
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Scope Tabs
  const tabs = [
    {
      id: 'all',
      label: 'All Credentials',
      count: certificates.length,
      icon: Award
    },
    {
      id: 'verified',
      label: 'Verified & Documented',
      count: verifiedCerts.length,
      icon: CheckCircle2
    },
    {
      id: 'pending',
      label: 'Missing Proof',
      count: pendingCerts.length,
      icon: AlertCircle
    }
  ];

  // Header Actions Cluster
  const headerActions = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => fetchProfile(true)}
        className="h-9 px-3 rounded-lg border border-gray-400 bg-background-100 text-xs font-medium text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
        title="Refresh credentials"
      >
        <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Refresh</span>
      </button>

      <button
        type="button"
        onClick={() => handleOpenModal()}
        className="h-9 px-4 rounded-lg bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Certificate</span>
      </button>
    </div>
  );

  return (
    <>
      <div className={`flex-1 min-w-0 bg-background-100 ${isModalOpen || viewingDoc ? 'overflow-hidden' : ''}`}>
        <div className="max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
          {/* Standardized Level 1 & 2 Page Header with Scope Tabs */}
          <PageHeader
            category="Portfolio & Credentials"
            title="Certificates & Accreditations"
            description="Manage, upload, and verify your professional licenses, course completions, and hackathon awards."
            actions={headerActions}
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => {
              setActiveTab(tabId);
              setSearch('');
            }}
          />

          {/* Level 3: Unified Single-Row Search & Filter Toolbar */}
          <div className="bg-background-100 border border-gray-400 rounded-xl p-2.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 flex items-center">
              <Search className="w-4 h-4 text-gray-600 absolute left-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search credentials by title, issuing organization, or year..."
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
                  <option value="title_asc">Title (A - Z)</option>
                  <option value="title_desc">Title (Z - A)</option>
                  <option value="verified_first">Verified First</option>
                  <option value="newest">Newest Date</option>
                </select>
              </div>

              <span className="text-xs font-mono text-gray-600 hidden sm:inline px-1 select-none">
                Showing {filteredCertificates.length} of {certificates.length}
              </span>
            </div>
          </div>

          {/* Main Content: Certificates Grid */}
          {loading ? (
            /* Skeleton Loading Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-80 rounded-xl border border-gray-400 bg-background-100 p-5 flex flex-col justify-between animate-pulse"
                >
                  <div className="space-y-3">
                    <div className="h-36 bg-gray-200 rounded-lg w-full" />
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="h-8 bg-gray-200 rounded-lg w-full" />
                </div>
              ))}
            </div>
          ) : filteredCertificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredCertificates.map((cert, index) => {
                const originalIndex = certificates.findIndex((c) => c.title === cert.title);
                const hasFile = !!cert.fileUrl;

                return (
                  <div
                    key={cert.title + index}
                    className="bg-background-100 border border-gray-400 hover:border-gray-600 rounded-xl overflow-hidden shadow-2xs transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Document Thumbnail / Placeholder Strip */}
                      <div className="relative aspect-[16/10] w-full bg-background-200 border-b border-gray-400 overflow-hidden">
                        {hasFile ? (
                          <img
                            src={getThumbnailUrl(cert.fileUrl)}
                            alt={cert.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => handleViewDoc(cert)}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}

                        {/* Fallback Display if no file or image load error */}
                        <div
                          className={`w-full h-full flex flex-col items-center justify-center p-4 text-center ${
                            hasFile ? 'hidden' : 'flex'
                          } bg-gradient-to-br from-background-100 to-background-200`}
                        >
                          {hasFile ? (
                            <FileText className="w-8 h-8 text-gray-700 mb-1" />
                          ) : (
                            <div className="flex flex-col items-center text-amber-600 dark:text-amber-500">
                              <AlertCircle className="w-7 h-7 mb-1" />
                              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider">
                                Missing Document
                              </span>
                              <span className="text-[10px] text-gray-600 mt-0.5">
                                Upload proof to verify
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Floating Status Pill (Top Right) */}
                        <div className="absolute top-2.5 right-2.5">
                          {cert.issuedByClub ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 backdrop-blur-xs text-amber-700 dark:text-amber-300 border border-amber-500/40 shadow-2xs">
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>Club Issued</span>
                            </span>
                          ) : hasFile ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-1000 text-background-100 shadow-2xs">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Verified</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-medium bg-background-100/90 backdrop-blur-xs border border-amber-400 text-amber-700 dark:text-amber-400 shadow-2xs">
                              <AlertCircle className="w-3 h-3" />
                              <span>Pending Proof</span>
                            </span>
                          )}
                        </div>


                      </div>

                      {/* Card Content Body */}
                      <div className="p-4 space-y-3">
                        {/* Title */}
                        <h3
                          className="text-sm sm:text-base font-bold text-gray-1000 tracking-tight line-clamp-1 group-hover:text-gray-900"
                          title={cert.title}
                        >
                          {cert.title}
                        </h3>

                        {/* Issuer & Issue Date */}
                        <div className="space-y-1.5 text-xs text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                            <span className="font-medium text-gray-800 line-clamp-1">
                              {cert.issuer || 'Unknown Organization'}
                            </span>
                          </div>

                          {cert.issueDate && (
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                              <span className="font-mono text-[11px] text-gray-700">
                                {cert.issueDate}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* External Credential Link (if present) */}
                        {cert.credentialUrl && (
                          <div className="pt-1">
                            <a
                              href={cert.credentialUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-1000 hover:underline"
                            >
                              <span>Verify Credential</span>
                              <ExternalLink className="w-3 h-3 text-gray-600" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="p-4 pt-0">
                      <div className="pt-3 border-t border-gray-400 flex items-center justify-between gap-2">
                        {hasFile ? (
                          <button
                            type="button"
                            onClick={() => handleViewDoc(cert)}
                            className="h-8 px-3 rounded-lg border border-gray-400 bg-background-100 hover:bg-gray-200 text-gray-1000 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Preview</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenModal(originalIndex)}
                            className="h-8 px-3 rounded-lg border border-dashed border-amber-500 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Upload Proof</span>
                          </button>
                        )}

                        {cert.issuedByClub ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-background-200 border border-gray-400 text-[10px] font-mono text-gray-600" title="Official credentials issued by clubs cannot be modified by students">
                            <Lock className="w-3 h-3 text-amber-500" />
                            <span className="hidden sm:inline">Official Credential</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenModal(originalIndex)}
                              className="h-8 w-8 rounded-lg border border-gray-400 bg-background-100 hover:bg-gray-200 text-gray-700 hover:text-gray-1000 flex items-center justify-center transition-colors cursor-pointer"
                              title="Edit Certificate"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(originalIndex)}
                              className="h-8 w-8 rounded-lg border border-gray-400 bg-background-100 hover:bg-red-500/10 text-gray-700 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                              title="Remove Certificate"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="rounded-xl border border-gray-400 bg-background-100 p-12 text-center shadow-2xs space-y-3">
              <div className="w-10 h-10 rounded-full bg-background-200 border border-gray-400 flex items-center justify-center mx-auto text-gray-600">
                <Award className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-1000">
                {activeTab === 'verified'
                  ? 'No Verified Certificates Found'
                  : activeTab === 'pending'
                  ? 'No Pending Certificates'
                  : 'No Certificates in Portfolio'}
              </h3>
              <p className="text-xs text-gray-600 max-w-sm mx-auto">
                {search
                  ? 'No credentials match your search query. Try clearing the filter.'
                  : activeTab === 'verified'
                  ? 'You have not uploaded verification documents for any certificates yet.'
                  : 'Add your licenses, course certifications, and awards to boost your student talent match score.'}
              </p>
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="h-8 px-3 rounded-lg border border-gray-400 bg-background-200 text-xs font-medium text-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
                >
                  Clear Search
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenModal()}
                  className="h-8 px-3 rounded-lg bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Add Your First Certificate
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. ADD / EDIT CERTIFICATE MODAL                          */}
      {/* ======================================================== */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-400 flex items-center justify-between bg-background-200/50 shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-gray-1000" />
                <span className="text-xs font-mono uppercase tracking-wider font-bold text-gray-1000">
                  {editingIndex !== null ? 'Edit Certificate' : 'Add New Certificate'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-600 hover:text-gray-1000 p-1 rounded-md cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              <form id="cert-form" onSubmit={handleSave} className="space-y-4">
                {/* File Upload Zone */}
                <div>
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-gray-700 mb-1.5">
                    Verification Document (PDF or Image)
                  </label>

                  <div
                    className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${
                      formData.fileUrl
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-gray-400 hover:border-gray-600 bg-background-200/40'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />

                    {uploadingFile ? (
                      <div className="flex flex-col items-center text-gray-700 space-y-2">
                        <RotateCw className="w-6 h-6 animate-spin text-gray-1000" />
                        <span className="text-xs font-medium">Uploading document to storage...</span>
                      </div>
                    ) : formData.fileUrl ? (
                      <div className="flex flex-col items-center text-emerald-700 dark:text-emerald-400 space-y-1">
                        <CheckCircle2 className="w-7 h-7 mb-1" />
                        <span className="text-xs font-bold text-gray-1000">Document Uploaded!</span>
                        <span className="text-[11px] font-mono text-gray-600">
                          Click or drag to replace file
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-gray-600 space-y-1">
                        <UploadCloud className="w-7 h-7 mb-1 text-gray-700" />
                        <span className="text-xs font-semibold text-gray-1000">
                          Upload Certificate File
                        </span>
                        <span className="text-[11px] text-gray-600">
                          PDF, PNG, or JPG up to 10MB
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-gray-700">
                    Certificate Title *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full h-9 px-3 bg-background-200 border border-gray-400 rounded-lg text-xs text-gray-1000 focus:outline-none focus:border-gray-900 transition-colors"
                    placeholder="e.g. AWS Certified Solutions Architect"
                  />
                </div>

                {/* Issuing Organization */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-gray-700">
                    Issuing Organization *
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.issuer}
                    onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
                    className="w-full h-9 px-3 bg-background-200 border border-gray-400 rounded-lg text-xs text-gray-1000 focus:outline-none focus:border-gray-900 transition-colors"
                    placeholder="e.g. Amazon Web Services, Coursera, HackerRank"
                  />
                </div>

                {/* Issue Date with Calendar Date Picker */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-gray-700">
                      Issue Date
                    </label>
                    {formData.issueDate && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-gray-600 dark:text-gray-900">
                          {formData.issueDate}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, issueDate: '' }))}
                          className="text-[10px] text-gray-500 hover:text-red-500 font-mono transition-colors cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400 absolute left-3 pointer-events-none" />
                    <input
                      type="date"
                      value={toIsoDateString(formData.issueDate)}
                      onClick={(e) => {
                        try {
                          e.target.showPicker?.();
                        } catch (err) {}
                      }}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) {
                          setFormData((prev) => ({ ...prev, issueDate: '' }));
                        } else {
                          const formatted = formatDisplayDate(val);
                          setFormData((prev) => ({ ...prev, issueDate: formatted }));
                        }
                      }}
                      className="w-full h-9 pl-9 pr-3 bg-background-200 border border-gray-400 rounded-lg text-xs text-gray-1000 focus:outline-none focus:border-gray-900 transition-colors cursor-pointer dark:[color-scheme:dark]"
                    />
                  </div>
                </div>

                {/* Credential URL */}
                <div className="space-y-1">
                  <label className="block text-xs font-mono font-semibold uppercase tracking-wider text-gray-700">
                    Credential Verification URL
                  </label>
                  <input
                    type="url"
                    value={formData.credentialUrl}
                    onChange={(e) => setFormData({ ...formData, credentialUrl: e.target.value })}
                    className="w-full h-9 px-3 bg-background-200 border border-gray-400 rounded-lg text-xs text-gray-1000 focus:outline-none focus:border-gray-900 transition-colors"
                    placeholder="https://www.credly.com/badges/..."
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-400 bg-background-200/50 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="h-9 px-4 rounded-lg border border-gray-400 bg-background-100 text-xs font-medium text-gray-700 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="cert-form"
                disabled={saving || uploadingFile}
                className="h-9 px-4 rounded-lg bg-gray-1000 text-background-100 text-xs font-semibold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shadow-2xs transition-opacity cursor-pointer"
              >
                {saving ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Certificate</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. DOCUMENT VIEWER MODAL                                 */}
      {/* ======================================================== */}
      {viewingDoc &&
        (viewingDoc.isPdf ? (
          <PdfViewerModal
            url={viewingDoc.url}
            title={viewingDoc.title}
            onClose={() => setViewingDoc(null)}
          />
        ) : (
          <div 
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
            onClick={(e) => {
              if (e.target === e.currentTarget) setViewingDoc(null);
            }}
          >
            <div className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="p-4 border-b border-gray-400 flex items-center justify-between bg-background-200/50">
                <span className="text-xs font-mono font-bold text-gray-1000 line-clamp-1">
                  {viewingDoc.title}
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={viewingDoc.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => setViewingDoc(null)}
                    className="text-gray-600 hover:text-gray-1000 p-1 rounded-md"
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setViewingDoc(null)}
                    className="text-gray-600 hover:text-gray-1000 p-1 rounded-md cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-y-auto flex items-center justify-center bg-background-200">
                <img
                  src={viewingDoc.url}
                  alt={viewingDoc.title}
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-sm"
                />
              </div>
            </div>
          </div>
        )
      )}
    </>
  );
}
