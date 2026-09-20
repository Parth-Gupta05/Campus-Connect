import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ArrowLeft, Filter, Users, ChevronDown, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const DIMENSIONS = [
  'DSA', 'SQL', 'PROGRAMMING', 'OOP', 'DBMS', 
  'COMPUTER NETWORKS', 'OPERATING SYSTEMS', 'APTITUDE', 'COMMUNICATION'
];

export default function AssessmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filtering state
  const [subjectFilter, setSubjectFilter] = useState('DBMS');
  const [conditionFilter, setConditionFilter] = useState('<');
  const [scoreFilter, setScoreFilter] = useState('50');

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await axios.get(`/admin/evaluation/uploads/${id}`, { withCredentials: true });
        if (res.data.success) {
          setAssessment(res.data.assessment);
        }
      } catch (err) {
        showToast('Failed to fetch assessment details', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-background-100">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex-1 p-8 bg-background-100">
        <h2 className="text-xl font-bold">Assessment not found</h2>
      </div>
    );
  }

  // Filter the results
  const filteredResults = assessment.results?.filter(res => {
    const dimIndex = DIMENSIONS.indexOf(subjectFilter);
    if (dimIndex === -1) return true;
    
    const score = res.scores?.[dimIndex];
    if (score === undefined || score === -1) return false; // Skip unassessed

    const threshold = parseFloat(scoreFilter);
    if (isNaN(threshold)) return true;

    if (conditionFilter === '<') return score < threshold;
    if (conditionFilter === '>') return score > threshold;
    if (conditionFilter === '=') return score === threshold;
    return true;
  }) || [];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background-100">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
          
          {/* Header */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/admin/evaluations/assessments')}
              className="p-2 hover:bg-gray-300 rounded-full transition-colors text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-1000 tracking-tight">{assessment.title}</h1>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                  assessment.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {assessment.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Academic Year: {assessment.academicYear} • Uploaded on {new Date(assessment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-background-200 border border-gray-400 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-gray-1000 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter Cohort
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show students where</span>
                <select 
                  value={subjectFilter} 
                  onChange={(e) => setSubjectFilter(e.target.value)}
                  className="bg-background-100 border border-gray-400 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-gray-1000/20 outline-none"
                >
                  {DIMENSIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              
              <select 
                value={conditionFilter} 
                onChange={(e) => setConditionFilter(e.target.value)}
                className="bg-background-100 border border-gray-400 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-gray-1000/20 outline-none w-16 text-center"
              >
                <option value="<">&lt;</option>
                <option value=">">&gt;</option>
                <option value="=">=</option>
              </select>

              <input 
                type="number" 
                value={scoreFilter} 
                onChange={(e) => setScoreFilter(e.target.value)}
                className="bg-background-100 border border-gray-400 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-gray-1000/20 outline-none w-20"
              />
            </div>
            
            <div className="pt-2 border-t border-gray-400/50 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Found <strong className="text-gray-1000">{filteredResults.length}</strong> students matching this criteria out of {assessment.results?.length || 0} total.
              </p>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-background-200 border border-gray-400 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-400/50 bg-background-200/50 text-sm font-semibold text-gray-600">
                    <th className="py-4 px-6">Student Name</th>
                    <th className="py-4 px-6">UID</th>
                    <th className="py-4 px-6 text-center">{subjectFilter} Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-400/30">
                  {filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="py-12 text-center text-gray-500">
                        No students match this criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((res, idx) => {
                      const score = res.scores?.[DIMENSIONS.indexOf(subjectFilter)];
                      const isWeak = score < 50;
                      
                      return (
                        <motion.tr 
                          key={res._id || idx}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-gray-300/30 transition-colors"
                        >
                          <td className="py-4 px-6 font-medium text-gray-1000">
                            {res.name}
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-600">
                            {res.uid}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              isWeak ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'
                            }`}>
                              {score !== undefined && score !== -1 ? score.toFixed(1) : 'N/A'}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })
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
