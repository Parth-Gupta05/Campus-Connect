import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../../context/ToastContext';
import { FiSearch, FiUsers, FiFilter, FiUser, FiMapPin, FiMail } from 'react-icons/fi';

export default function AdminStudents() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const [filters, setFilters] = useState({
    passingYear: '',
    department: '',
    division: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!filters.passingYear && !filters.department && !filters.division) {
      showToast('Please enter at least one filter (Passing Year, Department, or Division)', 'error');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const params = {};
      if (filters.passingYear) params.passingYear = filters.passingYear;
      if (filters.department) params.department = filters.department;
      if (filters.division) params.division = filters.division;

      const res = await axios.get('/admin/students', { params });
      setStudents(res.data.students || []);
    } catch (err) {
      console.error('Error fetching students:', err);
      showToast(err.response?.data?.message || 'Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-border-light px-8 py-5 shrink-0 shadow-sm">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Student Directory</h1>
        <p className="text-sm text-on-surface-variant mt-1">Search and filter registered students securely.</p>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Filter Section */}
        <div className="bg-surface border-b border-border-light p-6 shrink-0">
          <form onSubmit={handleSearch} className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 items-end">
            
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Passing Year</label>
              <input 
                type="text" 
                name="passingYear" 
                value={filters.passingYear} 
                onChange={handleChange} 
                placeholder="e.g. 2027 or 27" 
                className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              />
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Department</label>
              <input 
                type="text" 
                name="department" 
                value={filters.department} 
                onChange={handleChange} 
                placeholder="e.g. COMP, IT" 
                className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              />
            </div>
            
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider mb-2">Division</label>
              <input 
                type="text" 
                name="division" 
                value={filters.division} 
                onChange={handleChange} 
                placeholder="e.g. A, B" 
                className="w-full bg-surface-container-low border border-border-light rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || (!filters.passingYear && !filters.department && !filters.division)}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-on-primary-fixed shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none flex items-center gap-2 h-[42px] shrink-0 w-full md:w-auto justify-center"
            >
              <FiSearch className="text-lg" /> Search
            </button>
          </form>
        </div>

        {/* Results Section */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-32 bg-surface-variant/40 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            ) : !hasSearched ? (
              <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                  <FiFilter className="text-2xl text-on-surface-variant" />
                </div>
                <h3 className="text-lg font-bold text-on-surface">Ready to Search</h3>
                <p className="text-sm text-on-surface-variant mt-1 max-w-sm">Enter a passing year, department, or division above to find matching students.</p>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
                  <FiUsers className="text-2xl text-error" />
                </div>
                <h3 className="text-lg font-bold text-on-surface">No Students Found</h3>
                <p className="text-sm text-on-surface-variant mt-1 max-w-sm">We couldn't find any students matching your criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
                {students.map((student, idx) => (
                  <Link 
                    to={`/admin/students/${student._id}`}
                    key={student._id} 
                    style={{ animationDelay: `${idx * 50}ms` }} 
                    className="bg-surface border border-border-light rounded-2xl p-5 hover:shadow-md hover:border-primary/50 transition-all duration-300 flex items-start gap-4 animate-in slide-in-from-bottom-2 fade-in block cursor-pointer"
                  >
                    
                    <img 
                      src={student.avatarUrl || `https://ui-avatars.com/api/?name=${student.name}&background=random`} 
                      alt="Avatar" 
                      className="w-14 h-14 rounded-full object-cover bg-surface-container shrink-0" 
                    />
                    
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="font-bold text-base text-on-surface truncate">{student.name}</h4>
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                          {student.uid || 'NO UID'}
                        </span>
                      </div>
                      
                      <div className="text-xs text-on-surface-variant flex flex-col gap-1 mt-2">
                        <span className="flex items-center gap-2"><FiMail className="shrink-0" /> <span className="truncate">{student.email}</span></span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 bg-surface-container-low px-1.5 py-0.5 rounded text-[10px] font-bold"><FiUser /> {student.branch || 'N/A'} {student.division ? `- ${student.division}` : ''}</span>
                          <span className="text-[10px] font-bold">Class of {student.graduationYear || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
