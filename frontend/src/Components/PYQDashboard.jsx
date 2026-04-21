import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subjectIconMap, FallbackIcon } from '../utils/iconMap';
import LoadingState from './LoadingState.jsx';
import { motion } from 'framer-motion';
import './PYQDashboard.css'; 

function PYQDashboard() {
  const [semesters, setSemesters] = useState([]);
  
  const [selectedSemester, setSelectedSemester] = useState(() => {
    const user = JSON.parse(localStorage.getItem('forensync_user')) || {};
    return user.semesterId || "sem-1";
  });
  const [selectedCourse, setSelectedCourse] = useState(() => {
    const user = JSON.parse(localStorage.getItem('forensync_user')) || {};
    return user.programId || "btech-mtech-cybersecurity";
  });

  // const [selectedExam, setSelectedExam] = useState('CA2'); 
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    if (!selectedCourse) return;

    fetch(`${import.meta.env.VITE_API_URL}/db/programs/${selectedCourse}/semesters`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSemesters(data);
        else setSemesters([]); 
      })
      .catch(err => console.error(err));
  }, [selectedCourse]);


useEffect(() => {
    // Removed !selectedExam from the check
    if (!selectedCourse || !selectedSemester) return; 

    setLoading(true);

    // Updated URL: We are now hitting a more general endpoint 
    // You will need to ensure your backend supports this route:
    // /api/programs/:programId/semesters/:semesterId/subjects
    fetch(`${import.meta.env.VITE_API_URL}/programs/${selectedCourse}/semesters/${selectedSemester}/exams/all/subjects`)
      .then(res => {
        if (!res.ok) throw new Error("Semester not found");
        return res.json();
      })
      .then(data => {
          setSubjects(data || []);
          setLoading(false);
      })
      .catch(() => {
          setSubjects([]);
          setLoading(false);
      });
  }, [selectedCourse, selectedSemester]); // Removed selectedExam from dependencies

  return (
    <motion.div 
      className="home-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      
      <div className="pyq-header">
        <h2>Past Year Questions</h2>
        <p>Select your semester and subject.</p>
      </div>
      
      <div className="pyq-filters-row">
        <select 
          className="theme-dropdown"
          value={selectedCourse} 
          onChange={(e) => setSelectedCourse(e.target.value)}
        >
          <option value="btech-mtech-cybersecurity">B.Tech-M.Tech Cybersecurity</option>
          <option value="bsc-msc-forensic">BSc-MSc Forensic Science</option>
        </select>

        <select 
          className="theme-dropdown"
          value={selectedSemester} 
          onChange={(e) => setSelectedSemester(e.target.value)}
        >
          {semesters.map(sem => (
            <option key={sem.id} value={sem.id}>{sem.name}</option>
          ))}
          {semesters.length === 0 && <option value={selectedSemester}>{selectedSemester.replace('sem-', 'Semester ')}</option>}
        </select>
        
        {/* <div className="exam-tabs">
          {['CA1', 'CA2', 'CA3', 'CA4'].map(exam => (
            <button 
              key={exam}
              onClick={() => setSelectedExam(exam)}
              className={`exam-tab-btn ${selectedExam === exam ? 'active' : 'inactive'}`}
            >
              {exam === 'CA2' ? 'CA2 (Mid-Sem)' : exam === 'CA4' ? 'CA4 (End-Sem)' : exam}
            </button>
          ))}
        </div> */}
      </div>

      {loading ? (
        <LoadingState text="Loading subjects..." />
      ) : subjects.length > 0 ? (
        <div className="subjects-grid">
          {subjects.map((subject, index) => {
            const IconComponent = subjectIconMap[subject.id] || FallbackIcon;
            return (
              <motion.div 
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
              >
                <Link 
                  to={`/pyq/${selectedCourse}/${selectedSemester}/${subject.id}`} 
                  className="subject-card"
                  style={{ position: 'relative' }}
                >
                  {subject.hasPYQs ? (
                    <span className="pyq-status-dot available">✓ Available</span>
                  ) : (
                    <span className="pyq-status-dot unavailable">Empty</span>
                  )}
                  <div className="subject-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComponent size={20} />
                  </div>
                  <div className="subject-info">
                  <h3>{subject.name}</h3>
                  <p>{subject.teacher || "NFSU"}</p>
                  <span className="subject-code">{subject.id}</span>
                </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
           <p>No subjects found for {selectedSemester} yet.</p>
        </div>
      )}
    </motion.div>
  );
}

export default PYQDashboard;