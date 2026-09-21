import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, Plus, UploadCloud, RefreshCw, X, FileText, ChevronRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import Topbar from '../../components/Topbar';

export default function AdminAssessments() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      // Create endpoint in backend or assume it exists
      const res = await axios.get('/admin/evaluation/uploads', { withCredentials: true });
      if (res.data.success) {
        setAssessments(res.data.uploads);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to fetch assessments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const getStatusConfig = (status) => {
    switch (status) {
      case 'COMPLETED':
        return { color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: CheckCircle2, label: 'Completed' };
      case 'PROCESSING':
        return { color: 'text-blue-500', bg: 'bg-blue-500/10', icon: RefreshCw, label: 'Processing' };
      case 'FAILED':
        return { color: 'text-red-500', bg: 'bg-red-500/10', icon: AlertCircle, label: 'Failed' };
      default:
        return { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: Clock, label: 'Pending' };
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background-100">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
          
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gray-700 mb-1">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-gray-1000 font-semibold">Assessments</span>
            </div>
            <h1 className="text-heading-24 font-bold text-gray-1000 tracking-tight">
              Placement Readiness Assessments
            </h1>
            <p className="text-xs text-gray-700 mt-1 max-w-2xl">
              Upload and manage internal placement readiness assessments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload Assessment
            </button>
          </div>
        </div>

          <div className="bg-background-200 border border-gray-400 rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <RefreshCw className="w-8 h-8 animate-spin mb-4" />
                <p>Loading assessments...</p>
              </div>
            ) : assessments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <div className="w-16 h-16 bg-gray-300 rounded-2xl flex items-center justify-center mb-4 text-gray-500">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-1000 mb-1">No Assessments Yet</h3>
                <p className="text-gray-500 text-sm max-w-sm">
                  Upload your first batch of placement test scores to generate student cohorts.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-400/50 bg-background-200/50 text-sm font-semibold text-gray-600">
                      <th className="py-4 px-6">Assessment Title</th>
                      <th className="py-4 px-6">Academic Year</th>
                      <th className="py-4 px-6">Uploaded By</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-400/30">
                    {assessments.map((item) => {
                      const status = getStatusConfig(item.status);
                      const StatusIcon = status.icon;
                      
                      return (
                        <motion.tr 
                          key={item._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-300/30 transition-colors group"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-1000">{item.title}</p>
                                <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {item.academicYear}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-700">
                            {item.uploadedBy?.name || 'System Admin'}
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.color}`}>
                              <StatusIcon className={`w-3.5 h-3.5 ${item.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                              {status.label}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button 
                              onClick={() => navigate(`/admin/evaluations/assessments/${item._id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-1000 bg-background-100 hover:bg-gray-300 rounded-lg transition-colors border border-gray-400"
                            >
                              View Results
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      <UploadModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          fetchAssessments();
        }} 
      />
    </div>
  );
}

function UploadModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title) return showToast('Please fill all fields', 'error');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('academicYear', academicYear);

    setUploading(true);
    try {
      const res = await axios.post('/admin/evaluation/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      if (res.data.success) {
        showToast('Assessment uploaded successfully', 'success');
        onSuccess();
      }
    } catch (err) {
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background-100 rounded-2xl shadow-xl border border-gray-400 z-[101] overflow-hidden"
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-400 bg-background-200/50">
              <h2 className="text-lg font-bold text-gray-1000">Upload Assessment</h2>
              <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-1000 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Assessment Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mock Placement Phase-3"
                  className="w-full bg-background-200 border border-gray-400 rounded-xl px-4 py-2.5 text-sm text-gray-1000 focus:ring-2 focus:ring-gray-1000/20 focus:border-gray-1000 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Academic Year</label>
                <select 
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full bg-background-200 border border-gray-400 rounded-xl px-4 py-2.5 text-sm text-gray-1000 focus:ring-2 focus:ring-gray-1000/20 focus:border-gray-1000 outline-none transition-all"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                  <option value="2027-2028">2027-2028</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Excel File (.xlsx)</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    required
                  />
                  <div className={`w-full border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors
                    ${file ? 'border-emerald-500 bg-emerald-500/5' : 'border-gray-400 group-hover:border-gray-500 bg-background-200'}`}
                  >
                    <UploadCloud className={`w-8 h-8 mb-3 ${file ? 'text-emerald-500' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium text-gray-1000 mb-1">
                      {file ? file.name : 'Click or drag file here'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {file ? 'Ready to upload' : 'Supports Excel (.xlsx, .xls)'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-gray-1000 text-background-100 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:bg-gray-900 active:scale-[0.98]"
                >
                  {uploading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Uploading...</>
                  ) : (
                    'Upload & Queue for Processing'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
