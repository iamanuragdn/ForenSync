import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './PYQDashboard.css'; 

function PYQDashboard() {
  const [semesters, setSemesters] = useState([]);
  
  // instantly grab the exact semesterId from user
  const [selectedSemester, setSelectedSemester] = useState(() => {
    const saved = localStorage.getItem("forensync_user");
    return saved ? JSON.parse(saved).semesterId : "sem-1";
  });

  const [programId, setProgramId] = useState(() => {
    const saved = localStorage.getItem("forensync_user");
    return saved ? JSON.parse(saved).programId : "btech-mtech-cybersecurity";
  });

  const [selectedExam, setSelectedExam] = useState('CA2'); 
  const [subjects, setSubjects] = useState([]);

  // Fetch available semesters
  useEffect(() => {
    fetch(`http://localhost:5001/api/programs/${programId}/semesters`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSemesters(data);
        else setSemesters([]); 
      })
      .catch(err => console.error(err));
  }, [programId]);

  // Fetch syllabus subjects when semester changes
  useEffect(() => {
    if (!selectedSemester) return;

    fetch(`http://localhost:5001/api/syllabus/${programId}/${selectedSemester}`)
      .then(res => {
        if (!res.ok) throw new Error("Semester not found");
        return res.json();
      })
      .then(data => setSubjects(data.subjects || []))
      .catch(err => setSubjects([]));
  }, [programId, selectedSemester]);

  return (
    <div className="home-container">
      
      <div className="pyq-header">
        <h2>Past Year Questions</h2>
        <p>Select your semester, exam type, and subject.</p>
      </div>

      
      <div className="pyq-filters-row">
        
        
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
          subjects.map(subject => (
            <Link 
              to={`/pyq/${programId}/${selectedSemester}/${subject.id}?exam=${selectedExam}`} 
              key={subject.id} 
              className="subject-card"
            >
              <div className="subject-icon">📝</div>
              <div className="subject-info">
                <h3>{subject.name}</h3>
                <p>{subject.teacher || "NFSU"}</p>
                <span className="subject-code">{subject.id}</span>
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-state">
             <p>No subjects found for {selectedSemester.replace('-', ' ')} yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PYQDashboard;