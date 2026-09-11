import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as XLSX from 'xlsx';
import { FiDownload, FiCheckCircle, FiXCircle, FiX } from 'react-icons/fi';

export default function EventAttendees({ eventId, onClose }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [scannedQrCode, setScannedQrCode] = useState(null);
  const scannerRef = useRef(null);
  const { showToast } = useToast();

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
             setScannedStudent(res.data.student);
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

  const handleExportExcel = () => {
    if (!event) return;

    const extractDiv = (uid) => {
      if (!uid) return '';
      const match = uid.match(/^(\d{2})-([A-Za-z]+)([A-Za-z])(\d+)-(\d{2})$/);
      return match ? match[3].toUpperCase() : '';
    };

    const data = event.registeredStudents.map(student => ({
      Name: student.studentId?.name || 'Unknown',
      Email: student.studentId?.email || '',
      UID: student.studentId?.uid || '',
      Branch: student.studentId?.branch || '',
      Division: extractDiv(student.studentId?.uid) || student.studentId?.division || '',
      Semester: student.studentId?.currentSem || '',
      Status: student.attendanceStatus.toUpperCase()
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendees');
    
    // Download
    XLSX.writeFile(workbook, `${event.title.replace(/\s+/g, '_')}_Attendees.xlsx`);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!event) return <div className="p-8 text-center">Event not found</div>;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl border border-border-light">
        <div className="p-6 border-b border-border-light flex justify-between items-start bg-surface-container-lowest rounded-t-2xl">
          <div>
            <h2 className="text-headline-md font-bold text-primary mb-1">{event.title} - Attendees</h2>
            <p className="text-body-md text-on-surface-variant">
              {event.registeredStudents.length} Total Registered | 
              {' '}{event.registeredStudents.filter(s => s.attendanceStatus === 'present').length} Present
            </p>
          </div>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-2 bg-surface-container-high rounded-full">
            <FiX className="text-xl" />
          </button>
        </div>

        <div className="p-6 bg-surface-container-low flex gap-4 border-b border-border-light">
          <button 
            onClick={() => setScanning(!scanning)}
            className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${scanning ? 'bg-error text-on-error' : 'bg-primary text-on-primary'}`}
          >
            {scanning ? 'Stop Scanner' : 'Start QR Scanner'}
          </button>
          
          <button 
            onClick={handleExportExcel}
            className="px-4 py-2 bg-surface-variant text-on-surface-variant rounded-lg font-medium border border-border-light flex items-center gap-2 hover:bg-outline-variant"
          >
            <FiDownload /> Export to Excel
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 relative">
          {scanning && (
            <div className="w-full max-w-md mx-auto bg-surface p-4 rounded-xl shadow-sm border border-border-light relative">
              <div id="reader" className="w-full"></div>
              <p className="text-center text-sm text-on-surface-variant mt-4">Point camera at the student's QR code.</p>
              
              {/* Overlay Modal when scanned */}
              {scannedStudent && (
                <div className="absolute inset-0 bg-surface/90 backdrop-blur-sm z-10 flex items-center justify-center p-4 rounded-xl">
                  <div className="bg-surface border border-border-light shadow-lg rounded-2xl p-6 w-full text-center flex flex-col items-center">
                    {scannedStudent.avatarUrl ? (
                      <img src={scannedStudent.avatarUrl} alt="avatar" className="w-20 h-20 rounded-full object-cover mb-4 ring-2 ring-primary/20" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mb-4">
                        {scannedStudent.name.charAt(0)}
                      </div>
                    )}
                    <h3 className="text-xl font-display-medium text-on-surface">{scannedStudent.name}</h3>
                    <p className="text-on-surface-variant font-medium mb-1">{scannedStudent.uid}</p>
                    <p className="text-sm text-on-surface-variant mb-6">{scannedStudent.branch} • Sem {scannedStudent.currentSem}</p>
                    
                    <div className="flex w-full gap-3">
                      <button onClick={cancelAttendance} className="flex-1 py-2 rounded-lg border border-border-light font-medium text-on-surface hover:bg-surface-variant transition-colors">
                        Cancel
                      </button>
                      <button onClick={confirmAttendance} className="flex-1 py-2 rounded-lg bg-primary text-on-primary font-medium hover:bg-primary-dark transition-colors">
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-2xl border border-border-light overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-surface-variant text-on-surface-variant font-medium text-sm">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">UID</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {event.registeredStudents.map((s, i) => (
                  <tr key={i} className="border-t border-border-light">
                    <td className="p-4 font-medium flex items-center gap-3">
                      {s.studentId?.avatarUrl ? (
                        <img src={s.studentId?.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-surface-variant text-on-surface-variant flex items-center justify-center font-bold text-xs">
                          {s.studentId?.name ? s.studentId.name.charAt(0) : '?'}
                        </div>
                      )}
                      {s.studentId?.name || 'Unknown'}
                    </td>
                    <td className="p-4 text-on-surface-variant">{s.studentId?.uid}</td>
                    <td className="p-4">
                      {s.attendanceStatus === 'present' ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium text-sm"><FiCheckCircle /> Present</span>
                      ) : s.attendanceStatus === 'absent' ? (
                        <span className="flex items-center gap-1 text-red-600 font-medium text-sm"><FiXCircle /> Absent</span>
                      ) : (
                        <span className="flex items-center gap-1 text-orange-600 font-medium text-sm">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
                {event.registeredStudents.length === 0 && (
                  <tr><td colSpan="3" className="p-6 text-center text-on-surface-variant">No registrations yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
