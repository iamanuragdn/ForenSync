import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { subjectIconMap, FallbackIcon } from '../utils/iconMap';
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

  const [selectedExam, setSelectedExam] = useState('CA2'); 
  const [subjects, setSubjects] = useState([]);


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
    if (!selectedCourse || !selectedSemester || !selectedExam) return; 

    fetch(`${import.meta.env.VITE_API_URL}/programs/${selectedCourse}/semesters/${selectedSemester}/exams/${selectedExam}/subjects`)
      .then(res => {
        if (!res.ok) throw new Error("Semester not found");
        return res.json();
      })
      .then(data => setSubjects(data || []))
      .catch(() => setSubjects([]));
  }, [selectedCourse, selectedSemester, selectedExam]);

  return (
    <div className="home-container">
      
      <div className="pyq-header">
        <h2>Past Year Questions</h2>
        <p>Select your semester, exam type, and subject.</p>
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
            <option key={sem.id} value={`sem-${sem.id}`}>{sem.name}</option>
          ))}
          {semesters.length === 0 && <option value="sem-1">Semester 1</option>}
        </select>
        
        <div className="exam-tabs">
          {['CA1', 'CA2', 'CA3', 'CA4'].map(exam => (
            <button 
              key={exam}
              onClick={() => setSelectedExam(exam)}
              className={`exam-tab-btn ${selectedExam === exam ? 'active' : 'inactive'}`}
            >
              {exam === 'CA2' ? 'CA2 (Mid-Sem)' : exam === 'CA4' ? 'CA4 (End-Sem)' : exam}
            </button>
          ))}
        </div>
      </div>

      <div className="subjects-grid">
        {subjects.length > 0 ? (
          subjects.map(subject => {
            const IconComponent = subjectIconMap[subject.id] || FallbackIcon;
            return (
              <Link 
                to={`/pyq/${selectedCourse}/${selectedSemester}/${subject.id}?exam=${selectedExam}`} 
                key={subject.id} 
                className="subject-card"
              >
                <div className="subject-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconComponent size={20} />
                </div>
                <div className="subject-info">
                <h3>{subject.name}</h3>
                <p>{subject.teacher || "NFSU"}</p>
                <span className="subject-code">{subject.id}</span>
              </div>
              </Link>
            );
          })
        ) : (
          <div className="empty-state">
             <p>No subjects found for {selectedSemester} yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PYQDashboard;