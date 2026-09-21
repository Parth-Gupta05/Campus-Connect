import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Filter, Users, RefreshCw, AlertTriangle, TrendingUp, Download, CheckCircle2, ChevronDown } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const DIMENSIONS = [
  'DSA', 'SQL', 'PROGRAMMING', 'OOP', 'DBMS', 
  'COMPUTER NETWORKS', 'OPERATING SYSTEMS', 'APTITUDE', 'COMMUNICATION'
];

const PREDEFINED_ROLES = {
  'Software Engineer': { 'DSA': 70, 'PROGRAMMING': 80, 'OOP': 70, 'DBMS': 60, 'COMMUNICATION': 60 },
  'Data Analyst': { 'SQL': 80, 'PROGRAMMING': 60, 'DBMS': 70, 'APTITUDE': 70, 'COMMUNICATION': 70 },
  'System Administrator': { 'COMPUTER NETWORKS': 80, 'OPERATING SYSTEMS': 80, 'DBMS': 50, 'COMMUNICATION': 60 },
  'Custom Requirement': {}
};

export default function AdminStudentEvaluation() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  
  // Faculty Requirement State (The "Industry Vector")
  const [selectedRole, setSelectedRole] = useState('Software Engineer');
  const [requirements, setRequirements] = useState(PREDEFINED_ROLES['Software Engineer']);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await axios.get('/admin/evaluation/students', { withCredentials: true });
        if (res.data.success) {
          setStudents(res.data.students);
        }
      } catch (err) {
        showToast('Failed to fetch students', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setRequirements(PREDEFINED_ROLES[role]);
  };

  const handleRequirementChange = (dim, value) => {
    setSelectedRole('Custom Requirement');
    setRequirements(prev => ({
      ...prev,
      [dim]: value === '' ? undefined : Number(value)
    }));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background-100">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  // Calculate gaps and readiness for each student against the requirements
  const evaluatedStudents = students.map(student => {
    let metAll = true;
    let gaps = [];
    let scoreSum = 0;
    let maxScoreSum = 0;

    const reqKeys = Object.keys(requirements).filter(k => requirements[k] !== undefined);

    if (reqKeys.length === 0 || !student.skillVector || student.skillVector.length < 9) {
      return { ...student, isReady: false, gaps: ['Unassessed'], matchPercentage: 0 };
    }

    reqKeys.forEach(dim => {
      const dimIndex = DIMENSIONS.indexOf(dim);
      const requiredScore = requirements[dim];
      const actualScore = student.skillVector[dimIndex];

      maxScoreSum += requiredScore;

      if (actualScore === undefined || actualScore === -1) {
        metAll = false;
        gaps.push(`${dim} (Not Assessed)`);
      } else {
        scoreSum += Math.min(actualScore, requiredScore); // Cap at required score for percentage
        if (actualScore < requiredScore) {
          metAll = false;
          gaps.push(`${dim} (Score: ${actualScore.toFixed(0)}, Req: ${requiredScore})`);
        }
      }
    });

    const matchPercentage = maxScoreSum > 0 ? (scoreSum / maxScoreSum) * 100 : 0;

    return {
      ...student,
      isReady: metAll,
      gaps,
      matchPercentage
    };
  });

  // Sort by match percentage (descending)
  evaluatedStudents.sort((a, b) => b.matchPercentage - a.matchPercentage);

  const readyCount = evaluatedStudents.filter(s => s.isReady).length;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background-100">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
          
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-gray-700 mb-1">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-gray-1000 font-semibold">Global Skill Matrix</span>
            </div>
            <h1 className="text-heading-24 font-bold text-gray-1000 tracking-tight flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-indigo-500" />
              Industry Readiness Engine
            </h1>
            <p className="text-xs text-gray-700 mt-1 max-w-2xl">
              Compare student vectors against industry requirements. Filter and identify exact skill gaps to formulate targeted preparation sessions.
            </p>
          </div>
        </div>

          {/* Requirement Builder (Industry Vector) */}
          <div className="bg-background-200 border border-gray-400 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-400/50 pb-4">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-bold text-gray-1000">Set Faculty / Industry Requirements</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Quick Template:</span>
                <select 
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="bg-background-100 border border-gray-400 rounded-xl px-4 py-2 text-sm font-bold text-gray-1000 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all shadow-sm"
                >
                  {Object.keys(PREDEFINED_ROLES).map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {DIMENSIONS.map(dim => (
                <div key={dim} className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-600 tracking-wide">{dim}</label>
                  <div className="relative">
                    <input 
                      type="number"
                      placeholder="No Req"
                      value={requirements[dim] || ''}
                      onChange={(e) => handleRequirementChange(dim, e.target.value)}
                      className={`w-full bg-background-100 border rounded-lg px-3 py-2 text-sm font-semibold outline-none transition-all ${
                        requirements[dim] ? 'border-indigo-500 text-indigo-600 shadow-sm' : 'border-gray-400 text-gray-500 focus:border-indigo-400'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Students Meeting All Criteria</p>
                  <p className="text-xl font-bold text-gray-1000">
                    {readyCount} <span className="text-sm font-normal text-gray-500">out of {students.length} evaluated</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-background-200 border border-gray-400 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-400/50 bg-background-200/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-4 px-6">Student Info</th>
                    <th className="py-4 px-6 text-center">Match Profile</th>
                    <th className="py-4 px-6">Identified Skill Gaps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-400/30">
                  {evaluatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-16 text-center text-gray-500">
                        No students found.
                      </td>
                    </tr>
                  ) : (
                    evaluatedStudents.map((student, idx) => (
                      <motion.tr 
                        key={student._id || idx}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-300/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-1000">{student.name}</p>
                          <p className="text-xs text-gray-500">{student.uid} • {student.branch || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-lg font-bold ${
                              student.isReady ? 'text-emerald-500' : 
                              student.matchPercentage > 50 ? 'text-yellow-500' : 'text-rose-500'
                            }`}>
                              {student.matchPercentage.toFixed(0)}%
                            </span>
                            <div className="w-24 h-1.5 bg-gray-300 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  student.isReady ? 'bg-emerald-500' : 
                                  student.matchPercentage > 50 ? 'bg-yellow-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${student.matchPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {student.isReady ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-bold border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Industry Ready
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {student.gaps.map((gap, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 text-rose-600 rounded-md text-xs font-semibold border border-rose-500/20">
                                  <AlertTriangle className="w-3 h-3" /> {gap}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
