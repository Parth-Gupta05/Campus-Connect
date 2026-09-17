import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  X, 
  QrCode, 
  Search, 
  Users, 
  Check, 
  AlertCircle,
  Sparkles,
  Zap,
  Award,
  FileSpreadsheet,
  ChevronDown,
  Upload,
  FileCheck,
  FileText,
  Loader2
} from 'lucide-react';
import PdfViewerModal from './PdfViewerModal';

const extractDivisionFromStudent = (student) => {
  if (student?.division && String(student.division).trim()) {
    return String(student.division).trim().toUpperCase();
  }
  const uid = student?.uid || (typeof student === 'string' ? student : '');
  if (!uid) return '';
  const matchHyphen = uid.match(/^\d{2}-[A-Za-z]+([A-Za-z])\d+-\d{2}$/i);
  if (matchHyphen) return matchHyphen[1].toUpperCase();
  const matchAlpha = uid.match(/^[0-9]+[A-Z]+([A-Z0-9])/i);
  if (matchAlpha) return matchAlpha[1].toUpperCase();
  return '';
};

export default function EventAttendees({ eventId, onClose, isEventCompleted }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [scannedQrCode, setScannedQrCode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingMatrix, setExportingMatrix] = useState(false);
  const scannerRef = useRef(null);
  const { showToast } = useToast();

  // Certificate management state
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [certAudience, setCertAudience] = useState('present');
  const [certFile, setCertFile] = useState(null);
  const [certUploading, setCertUploading] = useState(false);
  const [certResult, setCertResult] = useState(null);
  const [viewingCertUrl, setViewingCertUrl] = useState(null);
  const [singleUploadingId, setSingleUploadingId] = useState(null);

  const fetchEventDetails = async () => {
    try {
      const res = await axios.get(`/events/${eventId}`);
      setEvent(res.data.event);
    } catch (err) {
      showToast('Failed to load attendees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    const isAlreadyLocked = document.body.style.overflow === 'hidden';
    if (!isAlreadyLocked) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow || '';
      };
    }
  }, []);

  useEffect(() => {
    if (scanning) {
      const scanner = new Html5QrcodeScanner('reader', { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scannerRef.current = scanner;
      
      scanner.render(async (decodedText) => {
        scanner.pause();
        
        try {
          const res = await axios.post(`/events/${eventId}/scan-qr`, { qrCode: decodedText });
          if (res.data.attendanceStatus === 'present') {
             showToast('Student is already marked present!', 'info');
             setTimeout(() => scanner.resume(), 2000);
          } else {
             setScannedStudent({
               ...res.data.student,
               tier: res.data.tier,
               designation: res.data.designation,
               pointsAwarded: res.data.pointsAwarded,
               multiplier: res.data.multiplier
             });
             setScannedQrCode(decodedText);
          }
        } catch (err) {
          showToast(err.response?.data?.message || 'Invalid QR Code', 'error');
          setTimeout(() => scanner.resume(), 2000);
        }
      }, (error) => {
        // ignore scan failures
      });

      return () => {
        scanner.clear().catch(console.error);
        scannerRef.current = null;
      };
    }
  }, [scanning, eventId, showToast]);

  const confirmAttendance = async () => {
    try {
       await axios.post(`/events/${eventId}/verify-qr`, { qrCode: scannedQrCode });
       showToast('Attendance marked successfully!', 'success');
       await fetchEventDetails();
    } catch (err) {
       showToast(err.response?.data?.message || 'Failed to mark attendance', 'error');
    } finally {
       setScannedStudent(null);
       setScannedQrCode(null);
       if (scannerRef.current) scannerRef.current.resume();
    }
  };

  const cancelAttendance = () => {
       setScannedStudent(null);
       setScannedQrCode(null);
       if (scannerRef.current) scannerRef.current.resume();
  };

  const handleManualToggle = async (studentId, currentStatus) => {
    const newStatus = currentStatus === 'present' ? 'absent' : 'present';
    try {
      await axios.post(`/events/${eventId}/manual-attendance`, {
        studentId,
        status: newStatus
      });
      showToast(`Attendance updated to ${newStatus}`, 'success');
      await fetchEventDetails();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update attendance', 'error');
    }
  };

  const handleExportSingleRoster = () => {
    if (!event) return;

    const extractDiv = (uid) => {
      if (!uid) return '';
      const matchHyphen = uid.match(/^\d{2}-[A-Za-z]+([A-Za-z])\d+-\d{2}$/i);
      if (matchHyphen) return matchHyphen[1].toUpperCase();
      const matchAlpha = uid.match(/^[0-9]+[A-Z]+([A-Z0-9])/i);
      if (matchAlpha) return matchAlpha[1].toUpperCase();
      return '';
    };

    const sortedStudents = [...event.registeredStudents].sort((a, b) => {
      const divA = a.studentId?.division || extractDiv(a.studentId?.uid);
      const divB = b.studentId?.division || extractDiv(b.studentId?.uid);
      if (divA && divB && divA !== divB) {
        return divA.localeCompare(divB, undefined, { numeric: true });
      }
      return (a.studentId?.uid || '').localeCompare(b.studentId?.uid || '');
    });

    const data = sortedStudents.map((record, index) => ({
      'S.No': index + 1,
      'Student Name': record.studentId?.name || 'N/A',
      'University UID': record.studentId?.uid || 'N/A',
      'Role / Designation': record.designation || 'Member',
      'Tier': record.tier || 'Member',
      'Branch': record.studentId?.branch || 'N/A',
      'Division': record.studentId?.division || extractDiv(record.studentId?.uid) || 'N/A',
      'Semester': record.studentId?.currentSem || 'N/A',
      'AICTE Hours': record.attendanceStatus === 'present' ? (record.aicteHours || event.durationHours || 2) : 0,
      'AICTE Points': record.attendanceStatus === 'present' ? (record.aictePoints || 1) : 0,
      'Attendance Status': record.attendanceStatus.toUpperCase(),
      'Verification Mode': record.tier === 'Core' ? 'Auto-Verified (Core)' : 'QR Code Scan'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Event Attendees');
    XLSX.writeFile(workbook, `${event.title.replace(/[^a-z0-9]/gi, '_')}_roster.xlsx`);
    showToast('Event attendance sheet exported!', 'success');
  };

  const handleExportClubMatrix = async () => {
    if (!event?.clubId?._id && !event?.clubId) return;
    const clubId = event.clubId._id || event.clubId;
    setExportingMatrix(true);

    try {
      const res = await axios.get(`/aicte/club-matrix/${clubId}`);
      const { club, events: clubEvents, matrix } = res.data;

      const extractDivFallback = (uid) => {
        if (!uid) return '';
        const matchHyphen = uid.match(/^\d{2}-[A-Za-z]+([A-Za-z])\d+-\d{2}$/i);
        if (matchHyphen) return matchHyphen[1].toUpperCase();
        const matchAlpha = uid.match(/^[0-9]+[A-Z]+([A-Z0-9])/i);
        if (matchAlpha) return matchAlpha[1].toUpperCase();
        return '';
      };

      // Transform cross-tabulated matrix to flat rows matching CSI_AICTE_Points_24-25 Final.xlsx
      const rows = matrix.map((stu, index) => {
        const row = {
          'Sr. No': index + 1,
          'Name of Student': stu.name || 'N/A',
          'Student UID': stu.uid || 'N/A',
          'Designation': stu.role || stu.tier,
          'Core / WC': stu.tier,
          'Branch': stu.branch || 'N/A',
          'Division': stu.division || extractDivFallback(stu.uid) || 'N/A',
          'Sem': stu.currentSem || 'N/A'
        };

        // Add each event as a column showing awarded hours
        clubEvents.forEach(e => {
          const eventColHeader = `${e.title} (${e.durationHours}h)`;
          const eventRecord = stu.events[e.id];
          row[eventColHeader] = (eventRecord && eventRecord.attended) ? eventRecord.hours : '-';
        });

        row['Total Hours'] = stu.totalHours;
        row['Total AICTE Points'] = stu.totalPoints;
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'AICTE Matrix');
      XLSX.writeFile(workbook, `${(club.name || 'Club').replace(/[^a-z0-9]/gi, '_')}_AICTE_Points_YearEnd.xlsx`);
      showToast('Official Club Year-End Matrix exported successfully!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to export club matrix', 'error');
    } finally {
      setExportingMatrix(false);
    }
  };

  const handleDownloadOrderSheet = async (format = 'xlsx') => {
    if (!event) return;

    let targetAttendees = event.registeredStudents;
    if (certAudience === 'present') {
      targetAttendees = targetAttendees.filter(s => s.attendanceStatus === 'present');
    }

    const sortedStudents = [...targetAttendees].sort((a, b) => {
      const divA = a.studentId?.division || extractDivisionFromStudent(a.studentId);
      const divB = b.studentId?.division || extractDivisionFromStudent(b.studentId);
      if (divA && divB && divA !== divB) {
        return divA.localeCompare(divB, undefined, { numeric: true });
      }
      return (a.studentId?.uid || '').localeCompare(b.studentId?.uid || '');
    });

    const sanitizedTitle = (event.title || 'event').replace(/[^a-z0-9]/gi, '_');

    if (format === 'xlsx') {
      const data = sortedStudents.map((record, index) => ({
        'Page Number (in PDF)': index + 1,
        'Student Name': record.studentId?.name || 'Attendee',
        'University UID': record.studentId?.uid || '',
        'Branch': record.studentId?.branch || '',
        'Division': record.studentId?.division || extractDivisionFromStudent(record.studentId) || '',
        'Semester': record.studentId?.currentSem || '',
        'Role / Designation': record.designation || 'Member',
        'Tier': record.tier || 'Member',
        'Email': record.studentId?.email || '',
        'Event Title': event.title,
        'Event Date': event.date ? new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '',
        'Issuing Organization': event.clubId?.name || 'CampusConnect Club'
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Certificate Order');
      XLSX.writeFile(workbook, `${sanitizedTitle}_Certificate_Order_Sheet.xlsx`);
      showToast('Certificate Order Sheet (.xlsx) downloaded!', 'success');
      return;
    }

    try {
      const res = await axios.get(`/events/${eventId}/certificates/roster-csv?audience=${certAudience}`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${sanitizedTitle}_Certificate_Order_Sheet.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Certificate Order Sheet (.csv) downloaded!', 'success');
    } catch (err) {
      console.error('Error downloading roster CSV:', err);
      showToast(err.response?.data?.message || 'Failed to download roster CSV', 'error');
    }
  };

  const handleBatchUploadCertificates = async () => {
    if (!certFile) {
      showToast('Please select a multi-page certificate PDF document.', 'error');
      return;
    }

    setCertUploading(true);
    const formData = new FormData();
    formData.append('file', certFile);
    formData.append('audience', certAudience);

    try {
      const res = await axios.post(`/events/${eventId}/certificates/upload-batch`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setCertResult(res.data);
      showToast(res.data.message || 'Certificates successfully sliced and issued!', 'success');
      await fetchEventDetails();
    } catch (err) {
      console.error('Failed to upload certificates batch:', err);
      showToast(err.response?.data?.message || 'Failed to issue certificates. Check page count vs attendees.', 'error');
    } finally {
      setCertUploading(false);
    }
  };

  const handleSingleCertUpload = async (studentId, file) => {
    if (!file) return;
    setSingleUploadingId(studentId);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post(`/events/${eventId}/certificates/single/${studentId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Certificate assigned successfully!', 'success');
      await fetchEventDetails();
    } catch (err) {
      console.error('Single certificate upload failed:', err);
      showToast(err.response?.data?.message || 'Failed to upload certificate', 'error');
    } finally {
      setSingleUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-background-100 border border-gray-400 rounded-2xl p-8 flex flex-col items-center gap-3 shadow-2xl">
          <div className="w-8 h-8 border-2 border-gray-1000 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-gray-700">Loading attendee registry...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="bg-background-100 border border-gray-400 rounded-2xl p-8 flex flex-col items-center gap-4 text-center max-w-sm shadow-2xl">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <div>
            <h3 className="text-base font-bold text-gray-1000">Event Not Found</h3>
            <p className="text-xs text-gray-700 mt-1">Unable to locate the specified event record.</p>
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-gray-1000 text-background-100 text-xs font-medium rounded-md hover:opacity-90">
            Close Modal
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = isEventCompleted ?? (event?.status === 'completed' || (event?.date && new Date(event.date) < new Date()));
  const totalRegistered = event.registeredStudents.length;
  const presentCount = event.registeredStudents.filter(s => s.attendanceStatus === 'present').length;
  const absentCount = event.registeredStudents.filter(s => s.attendanceStatus === 'absent').length;
  const pendingCount = totalRegistered - presentCount - absentCount;
  const attendanceRate = totalRegistered > 0 ? ((presentCount / totalRegistered) * 100).toFixed(0) : 0;
  const corePresentCount = event.registeredStudents.filter(s => s.tier === 'Core' && s.attendanceStatus === 'present').length;

  const filteredStudents = event.registeredStudents.filter(s => {
    const name = s.studentId?.name || '';
    const uid = s.studentId?.uid || '';
    const role = s.designation || '';
    const div = extractDivisionFromStudent(s.studentId) || '';
    const branch = s.studentId?.branch || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || 
           uid.toLowerCase().includes(query) || 
           role.toLowerCase().includes(query) ||
           div.toLowerCase().includes(query) ||
           branch.toLowerCase().includes(query);
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overscroll-contain selection:bg-gray-1000 selection:text-background-100">
      <div className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-400 flex justify-between items-start bg-background-200/60">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-blue-500/10 text-blue-700 border border-blue-500/20">
                Attendance & Points Console
              </span>
              {isCompleted ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-background-200 text-gray-700 border border-gray-400">
                  Concluded
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                  Active / In-Session
                </span>
              )}
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold bg-purple-500/10 text-purple-700 border border-purple-500/20">
                {event.durationHours || 2}h Event &bull; Cat {event.aicteCategory || 5}
              </span>
              <span className="text-xs text-gray-600 font-mono">
                ID: {event._id.slice(-6)}
              </span>
            </div>
            <h2 className="text-heading-20 font-bold text-gray-1000 tracking-tight">{event.title}</h2>
            
            {/* Quick Metrics Bar */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-gray-900">
                <Users className="w-3.5 h-3.5 text-gray-700" />
                <span>{totalRegistered} Registered</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{presentCount} Present ({attendanceRate}%)</span>
              </div>
              {corePresentCount > 0 && (
                <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{corePresentCount} Core (Auto)</span>
                </div>
              )}
              {absentCount > 0 && (
                <div className="flex items-center gap-1.5 text-red-600 font-medium">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{absentCount} Absent</span>
                </div>
              )}
              {pendingCount > 0 && (
                <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{pendingCount} Pending</span>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="text-gray-700 hover:text-gray-1000 p-2 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Banner when Event is Completed */}
        {isCompleted && (
          <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>This event has concluded. QR scanner is disabled; attendance and AICTE point records are archived.</span>
            </div>
            <span className="text-[11px] font-mono text-gray-600 hidden sm:inline">Records Sealed</span>
          </div>
        )}

        {/* Action Controls & Search Toolbar */}
        <div className="p-4 bg-background-100 border-b border-gray-400 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button 
              disabled={isCompleted}
              onClick={() => !isCompleted && setScanning(!scanning)}
              title={isCompleted ? 'QR attendance scanner is disabled for completed events' : undefined}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-all shadow-xs ${
                isCompleted
                  ? 'bg-background-200 text-gray-500 border border-gray-400 cursor-not-allowed opacity-60'
                  : scanning 
                    ? 'bg-red-600 text-white hover:bg-red-700 cursor-pointer' 
                    : 'bg-gray-1000 text-background-100 hover:opacity-90 cursor-pointer'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>{isCompleted ? 'Scanner Disabled' : scanning ? 'Stop Scanner' : 'Launch QR Scanner'}</span>
            </button>
            
            <button 
              onClick={handleExportSingleRoster}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-400 bg-background-200 text-gray-900 hover:text-gray-1000 hover:border-gray-500 flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              title="Export attendees and points for this specific event"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>Event Roster</span>
            </button>

            <button 
              onClick={handleExportClubMatrix}
              disabled={exportingMatrix}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
              title="Export complete year-end cross-tabulated AICTE matrix for all events and club members (CSI format)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{exportingMatrix ? 'Generating...' : 'Export Club Matrix (Year-End)'}</span>
            </button>

            <button 
              onClick={() => { setIsCertModalOpen(true); setCertResult(null); }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium border flex items-center gap-2 transition-colors cursor-pointer shadow-xs ${
                event.certificatesIssued
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
                  : 'border-gray-400 bg-background-200 text-gray-900 hover:text-gray-1000 hover:border-gray-500'
              }`}
              title="Issue official verified certificates via multi-page PDF"
            >
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>{event.certificatesIssued ? 'Certificates Issued ✓' : 'Issue Certificates'}</span>
            </button>
          </div>

          {/* Instant Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
            <input 
              type="text" 
              placeholder="Search by name, UID, or role..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-background-200 border border-gray-400 rounded-md text-gray-1000 placeholder:text-gray-600 focus:outline-none focus:border-gray-900 dark:focus:border-gray-100 transition-colors"
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative">
          
          {/* Active Camera Viewport */}
          {scanning && (
            <div className="w-full max-w-md mx-auto bg-background-200 border border-gray-400 p-4 rounded-xl shadow-md relative animate-in fade-in duration-200">
              <div id="reader" className="w-full rounded-lg overflow-hidden border border-gray-400 bg-black"></div>
              <p className="text-center text-xs text-gray-700 mt-3 font-mono">
                Align student attendee QR code within the viewfinder.
              </p>
              
              {/* Scanned Verification Dialog Overlay */}
              {scannedStudent && (
                <div className="absolute inset-0 bg-background-100/95 backdrop-blur-sm z-20 flex items-center justify-center p-4 rounded-xl border border-gray-400 animate-in zoom-in-95 duration-150">
                  <div className="w-full text-center flex flex-col items-center">
                    {(() => {
                      const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(scannedStudent.name || 'Student')}&background=0d9488&color=fff&bold=true`;
                      return (
                        <img 
                          src={scannedStudent.avatarUrl || fallback} 
                          alt="avatar" 
                          onError={(e) => {
                            if (e.currentTarget.src !== fallback) {
                              e.currentTarget.onerror = null;
                              e.currentTarget.src = fallback;
                            }
                          }}
                          className="w-16 h-16 rounded-full object-cover mb-3 border-2 border-teal-500 shadow-sm" 
                        />
                      );
                    })()}
                    <h3 className="text-base font-bold text-gray-1000">{scannedStudent.name}</h3>
                    <p className="text-xs font-mono text-gray-700 mt-0.5">{scannedStudent.uid}</p>
                    <p className="text-xs text-gray-600 mt-1">{scannedStudent.branch} &bull; Sem {scannedStudent.currentSem}</p>
                    
                    {/* Tier badge and points preview */}
                    <div className="mt-3 mb-4 flex items-center justify-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${
                        scannedStudent.tier === 'Core'
                          ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                          : scannedStudent.tier === 'WC'
                          ? 'bg-purple-500/15 text-purple-600 border border-purple-500/30'
                          : 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                      }`}>
                        {scannedStudent.designation || scannedStudent.tier} ({scannedStudent.multiplier || 1}x)
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        +{scannedStudent.pointsAwarded || 1} pts
                      </span>
                    </div>

                    <div className="flex w-full gap-2">
                      <button 
                        onClick={cancelAttendance} 
                        className="flex-1 py-2 rounded-md border border-gray-400 bg-background-100 text-xs font-medium text-gray-900 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmAttendance} 
                        className="flex-1 py-2 rounded-md bg-gray-1000 text-background-100 text-xs font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5 text-teal-400" />
                        <span>Confirm Present</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attendees Table */}
          <div className="rounded-xl border border-gray-400 bg-background-100 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-background-200 border-b border-gray-400 text-xs font-mono uppercase text-gray-700">
                <tr>
                  <th className="p-3.5">Student</th>
                  <th className="p-3.5">UID</th>
                  <th className="p-3.5">Designation & Tier</th>
                  <th className="p-3.5 text-center">AICTE Credit</th>
                  <th className="p-3.5 text-center">Certificate</th>
                  <th className="p-3.5 text-right">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300 dark:divide-gray-800 text-xs">
                {filteredStudents.map((s, i) => {
                  const isCore = s.tier === 'Core';
                  const isWC = s.tier === 'WC';
                  const points = s.aictePoints || (s.attendanceStatus === 'present' ? (isCore || isWC ? 2 : 1) : 0);
                  const hours = s.aicteHours || (s.attendanceStatus === 'present' ? (event.durationHours || 2) * (isCore || isWC ? 2 : 1) : 0);

                  return (
                    <tr key={i} className="hover:bg-background-200/50 transition-colors">
                      <td className="p-3.5 font-medium text-gray-1000 flex items-center gap-3">
                        {(() => {
                          const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(s.studentId?.name || 'Student')}&background=6366f1&color=fff&bold=true`;
                          return (
                            <img 
                              src={s.studentId?.avatarUrl || fallback} 
                              alt="avatar" 
                              onError={(e) => {
                                if (e.currentTarget.src !== fallback) {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = fallback;
                                }
                              }}
                              className="w-7 h-7 rounded-full object-cover border border-gray-400 shrink-0" 
                            />
                          );
                        })()}
                        <div>
                          <div className="font-semibold text-gray-1000 flex items-center gap-1.5">
                            <span>{s.studentId?.name || 'Unknown'}</span>
                            {isCore && (
                              <span title="Core member: automatically marked present for all club activities with 2x points">
                                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-600 font-normal">
                            {s.studentId?.branch ? (
                              <span>
                                {s.studentId.branch}
                                {extractDivisionFromStudent(s.studentId) ? ` · Div ${extractDivisionFromStudent(s.studentId)}` : ''}
                                {` · Sem ${s.studentId.currentSem || '—'}`}
                              </span>
                            ) : (
                              s.studentId?.email || ''
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-3.5 text-gray-900 font-mono">
                        <span className="px-2 py-0.5 rounded bg-background-200 text-gray-1000 border border-gray-400 text-[11px]">
                          {s.studentId?.uid || '—'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-gray-1000 text-xs">
                            {s.designation || (isCore ? 'Core Member' : isWC ? 'Working Committee' : 'Member')}
                          </span>
                          <div>
                            {isCore ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                <Sparkles className="w-2.5 h-2.5" /> Core Team (2x Auto)
                              </span>
                            ) : isWC ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/30">
                                <Zap className="w-2.5 h-2.5" /> WC (2x via QR)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                                Regular (1x)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-center">
                        {s.attendanceStatus === 'present' ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              +{points} pts
                            </span>
                            <span className="text-[10px] font-mono text-gray-500">
                              {hours} hrs logged
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-mono text-xs">—</span>
                        )}
                      </td>

                      {/* Certificate Status & Actions */}
                      <td className="p-3.5 text-center">
                        {s.certificateUrl ? (
                          <button
                            type="button"
                            onClick={() => setViewingCertUrl(s.certificateUrl)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-colors cursor-pointer"
                            title="Click to view verified certificate"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            <span>Issued ✓</span>
                          </button>
                        ) : s.attendanceStatus === 'present' ? (
                          <label 
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono text-gray-600 hover:text-gray-1000 border border-dashed border-gray-400 hover:border-gray-600 transition-colors cursor-pointer ${
                              singleUploadingId === (s.studentId?._id || s.studentId) ? 'opacity-50 pointer-events-none' : ''
                            }`}
                            title="Upload single 1-page certificate PDF for this attendee"
                          >
                            {singleUploadingId === (s.studentId?._id || s.studentId) ? (
                              <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                            ) : (
                              <Upload className="w-3 h-3 text-gray-500" />
                            )}
                            <span>{singleUploadingId === (s.studentId?._id || s.studentId) ? 'Uploading...' : 'Assign PDF'}</span>
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) => e.target.files[0] && handleSingleCertUpload(s.studentId?._id || s.studentId, e.target.files[0])}
                            />
                          </label>
                        ) : (
                          <span className="text-gray-400 font-mono text-xs" title="Student must be present to receive a certificate">—</span>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        {s.attendanceStatus === 'present' ? (
                          <div className="inline-flex flex-col items-end gap-1">
                            <button
                              onClick={() => !isCompleted && handleManualToggle(s.studentId?._id || s.studentId, s.attendanceStatus)}
                              disabled={isCompleted}
                              title={isCompleted ? 'Concluded' : 'Click to toggle status'}
                              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Present
                            </button>
                            {isCore && (
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                                By-default Core
                              </span>
                            )}
                          </div>
                        ) : s.attendanceStatus === 'absent' ? (
                          <button
                            onClick={() => !isCompleted && handleManualToggle(s.studentId?._id || s.studentId, s.attendanceStatus)}
                            disabled={isCompleted}
                            title={isCompleted ? 'Concluded' : 'Click to toggle status'}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-red-500/10 text-red-600 border border-red-500/20 hover:bg-red-500/20 transition-colors cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Absent
                          </button>
                        ) : (
                          <button
                            onClick={() => !isCompleted && handleManualToggle(s.studentId?._id || s.studentId, s.attendanceStatus)}
                            disabled={isCompleted}
                            title={isCompleted ? 'Concluded' : 'Click to mark present manually'}
                            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-600 font-mono text-xs">
                      {searchQuery ? 'No attendees match your search query.' : 'No students have registered for this event yet.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="p-3 px-6 bg-background-200 border-t border-gray-400 flex items-center justify-between text-[11px] font-mono text-gray-600">
          <div className="flex items-center gap-3">
            <span>AICTE Point Calculator Active</span>
            <span>&bull;</span>
            <span className="text-emerald-600">Present students earn verified points</span>
          </div>
          <span>Showing {filteredStudents.length} of {totalRegistered} attendees</span>
        </div>
      </div>

      {/* Multi-Page PDF Certificate Issuance Modal */}
      {isCertModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="bg-background-100 border border-gray-400 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-400 flex items-center justify-between bg-background-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-1000">Issue Event Certificates</h3>
                  <p className="text-xs text-gray-600 mt-0.5">Split multi-page PDF & deposit directly to verified portfolios</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsCertModalOpen(false); setCertFile(null); setCertResult(null); }}
                className="text-gray-600 hover:text-gray-1000 p-1.5 rounded-md hover:bg-gray-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Audience Selector */}
              <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-background-200 border border-gray-400">
                <span className="text-xs font-semibold text-gray-1000">Recipients:</span>
                <label className="flex items-center gap-1.5 text-xs text-gray-900 cursor-pointer">
                  <input
                    type="radio"
                    name="audience"
                    value="present"
                    checked={certAudience === 'present'}
                    onChange={() => { setCertAudience('present'); setCertResult(null); }}
                    className="accent-gray-1000 cursor-pointer"
                  />
                  <span>Present Only ({presentCount})</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-900 cursor-pointer">
                  <input
                    type="radio"
                    name="audience"
                    value="all"
                    checked={certAudience === 'all'}
                    onChange={() => { setCertAudience('all'); setCertResult(null); }}
                    className="accent-gray-1000 cursor-pointer"
                  />
                  <span>All Registered ({totalRegistered})</span>
                </label>
              </div>

              {/* Step 1: Certificate Order Sheet Helper */}
              <div className="p-4 rounded-xl border border-gray-400 bg-background-200/40 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center justify-center text-[10px] font-bold">
                      1
                    </span>
                    <span className="font-bold text-gray-1000 uppercase font-mono tracking-wide text-[11px]">
                      Download Student Order Sheet
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadOrderSheet('xlsx')}
                      className="px-2.5 py-1.5 rounded-md text-xs font-semibold border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Download Excel spreadsheet with explicit Page Numbers for each student"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Order Sheet (.xlsx)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadOrderSheet('csv')}
                      className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-gray-400 bg-background-100 hover:bg-background-200 text-gray-1000 flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      title="Download CSV for mail merge"
                    >
                      <Download className="w-3.5 h-3.5 text-blue-600" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Design certificates using whatever tool you prefer (Word Mail Merge, Google Slides, Canva, etc.). Make sure all certificates are exported into a single multi-page PDF in the exact order shown in this sheet (<b>Page 1 = Row 1 in Excel, Page 2 = Row 2</b>, etc.).
                </p>
              </div>

              {/* Step 2: PDF Upload Dropzone */}
              <div className="p-4 rounded-xl border border-gray-400 bg-background-200/40 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  <span className="font-bold text-gray-1000 uppercase font-mono tracking-wide text-[11px]">
                    Upload Multi-Page PDF (1 Page Per Student)
                  </span>
                </div>

                <label className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
                  certFile ? 'border-teal-500/50 bg-teal-500/5' : 'border-gray-400 hover:border-gray-600 bg-background-100'
                }`}>
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setCertFile(e.target.files[0]);
                        setCertResult(null);
                      }
                    }}
                  />
                  {certFile ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center">
                        <FileCheck className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-gray-1000">{certFile.name}</span>
                      <span className="text-[10px] font-mono text-gray-500">
                        {(certFile.size / (1024 * 1024)).toFixed(2)} MB &bull; Click to change file
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800 text-gray-600 flex items-center justify-center">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-gray-1000">Choose or drop multi-page Certificate PDF</span>
                      <span className="text-[10px] text-gray-500">Single document containing 1 page per recipient</span>
                    </div>
                  )}
                </label>
              </div>

              {/* Step 3: Success Banner or Distribution Action */}
              {certResult ? (
                <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col gap-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{certResult.message}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    All {certResult.matchedCount} certificates were sliced, verified, and placed into each student's portfolio. Real-time in-app notifications have been delivered.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setIsCertModalOpen(false); setCertResult(null); setCertFile(null); }}
                    className="mt-1 self-end px-3 py-1.5 rounded-md bg-gray-1000 text-background-100 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2 border-t border-gray-400">
                  <div className="text-[11px] text-gray-600 font-mono">
                    Target: <span className="font-bold text-gray-1000">{certAudience === 'present' ? presentCount : totalRegistered} recipients</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCertModalOpen(false)}
                      className="px-3.5 py-2 rounded-md border border-gray-400 text-xs font-medium text-gray-900 hover:text-gray-1000 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!certFile || certUploading}
                      onClick={handleBatchUploadCertificates}
                      className="px-4 py-2 rounded-md bg-gray-1000 text-background-100 text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                    >
                      {certUploading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Slicing & Distributing...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Slice & Issue Certificates</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {viewingCertUrl && (
        <PdfViewerModal
          url={viewingCertUrl}
          title={`${event.title} - Certificate of Participation`}
          onClose={() => setViewingCertUrl(null)}
        />
      )}
    </div>
  );
}

