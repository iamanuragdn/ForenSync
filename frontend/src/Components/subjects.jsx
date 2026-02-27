import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './subjects.css'; 

function Subjects() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semesterDates, setSemesterDates] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [nextExam, setNextExam] = useState(null); 
  const cardColors = ['purple', 'blue', 'green', 'pink', 'teal', 'orange'];
  const cardIcons = ['∑', '🔬', '💻', '💬', '⚡', '📐'];
  const [viewingSemester, setViewingSemester] = useState(() => {
    const saved = localStorage.getItem("forensync_user");
    return saved ? JSON.parse(saved).semesterId : "sem-1";
  });

  // Fetch Subjects
  useEffect(() => {
    const savedUser = localStorage.getItem("forensync_user");
    if (!savedUser) {
      navigate("/login"); 
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    const activeProgramId = parsedUser.programId === "btech-mtech-cse" ? "btech-mtech-cybersecurity" : parsedUser.programId;

    fetch(`http://localhost:5001/api/syllabus/${activeProgramId}/${viewingSemester}`)
      .then(res => res.json())
      .then(data => {
        if (data.subjects && !data.error) {
          const theorySubjects = data.subjects.filter(sub => sub.type !== "Lab");
          setSubjects(theorySubjects);
        } else {
          setSubjects([]); 
        }
        setLoading(false);
      })
      .catch(err => {
        setSubjects([]);
        setLoading(false);
      });
  }, [navigate, viewingSemester]); 

  // Fetch Exams
  useEffect(() => {
    if (!user) return;
    
    const activeProgramId = user.programId === "btech-mtech-cse" ? "btech-mtech-cybersecurity" : user.programId;

    fetch(`http://localhost:5001/api/exams/${activeProgramId}/${user.semesterId}`)
      .then(res => res.json())
      .then(data => {
        const today = new Date();
        today.setHours(0,0,0,0);

        const futureExams = data.filter(exam => {
          const eDate = new Date(exam.examDate);
          eDate.setHours(0,0,0,0);
          return eDate >= today;
        });

        if (futureExams.length > 0) {
          const closestExam = futureExams[0];
          const eDate = new Date(closestExam.examDate);
          eDate.setHours(0,0,0,0);

          const diffTime = eDate - today;
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          setNextExam({ ...closestExam, daysLeft });
        } else {
          setNextExam(null); 
        }
      })
      .catch(err => console.error("Error fetching next exam:", err));
  }, [user]); 

  useEffect(() => {
    if (!user) return;
    const activeProgramId = user.programId === "btech-mtech-cse" ? "btech-mtech-cybersecurity" : user.programId;

    fetch(`http://localhost:5001/api/semester-info/${activeProgramId}/${viewingSemester}`)
      .then(res => res.json())
      .then(data => {
        if (data.startDate && data.endDate) {
          setSemesterDates({ start: data.startDate, end: data.endDate });
        } else {
          setSemesterDates(null); 
        }
      })
      .catch(err => console.error("Error fetching dates:", err));
  }, [user, viewingSemester]);

  const handleLogout = () => {
    localStorage.removeItem("forensync_user");
    navigate("/login");
  };

  const getSemesterProgress = () => {
    if (!semesterDates) return 0; 

    const startDate = new Date(semesterDates.start);
    const endDate = new Date(semesterDates.end);
    const today = new Date();

    if (today < startDate) return 0;   
    if (today > endDate) return 100;   

    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const passedDays = (today - startDate) / (1000 * 60 * 60 * 24);
    
    return Math.round((passedDays / totalDays) * 100);
  };
  
  const progressPercentage = getSemesterProgress();

  if (loading || !user) return <div className="home-dashboard">Loading your dashboard...</div>;

  return (
    <div className="home-dashboard">
      
      <div className="dashboard-left">
        <div className="welcome-banner">
          <div className="welcome-content">
            <span className="welcome-badge">✨ Welcome back</span>
            <h1>Hello, {user.name.split(' ')[0]}</h1>
            <p>You're making great progress in {user.semesterId.toUpperCase()}. Let's keep the focus sharp.</p>
          </div>
          
          <div className="progress-circle-container">
            <div 
              className="progress-circle"
              style={{
          
                background: `radial-gradient(closest-side, white 79%, transparent 80% 100%), conic-gradient(#4B6583 ${progressPercentage}%, #f1f5f9 0)`
              }}
            >
              <span className="percentage">
                {progressPercentage}%
              </span>
              <span className="label">
                SEMESTER
              </span>
            </div>
          </div>

        </div>

        <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '30px' }}>
          <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="icon" style={{ fontSize: '1.5rem' }}>📚</span>
            <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#1e293b' }}>Study Materials</h3>
          </div>
          
          <select 
            value={viewingSemester} 
            onChange={(e) => setViewingSemester(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '2px solid #e2e8f0', backgroundColor: 'white', fontWeight: 'bold', color: '#334155', cursor: 'pointer', outline: 'none' }}
          >
            <option value="sem-1">Semester 1</option>
            <option value="sem-2">Semester 2</option>
            <option value="sem-3">Semester 3</option>
            <option value="sem-4">Semester 4</option>
          </select>
        </div>

        <div className="subjects-grid">
          {subjects.length === 0 ? (
            <div style={{ padding: '20px', color: '#64748b', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              No subjects found for this semester yet.
            </div>
          ) : (
            subjects.map((sub, index) => (
            <div 
                className="subject-card"
                key={sub.id || index} 
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/notes/${user.programId}/${viewingSemester}/${sub.id}`)} 
            >
                <div className={`card-accent accent-${cardColors[index % cardColors.length]}`}></div>
                <div className="subject-icon-box">{cardIcons[index % cardIcons.length]}</div>
                        
                <h3>{sub.name}</h3>
                <p>{sub.teacher}</p>
                <div className="card-footer">
                  <span className="subject-code-badge">{sub.id}</span> 
                  <span className="arrow-icon">→</span>
                </div>
            </div>
          ))
          )}
        </div>
      </div>


      <div className="dashboard-right">
        
        <div className="widget next-exam-widget">
          <div className="widget-header">
            <div className="header-left">
              <span className="icon">⏱️</span>
              <h3>Next Exam</h3>
            </div>
            {nextExam && nextExam.daysLeft <= 7 && <span className="urgent-badge">Urgent</span>}
          </div>
          
          <div className="countdown">
            {nextExam ? (
              <>
                <h2>
                  {nextExam.daysLeft < 10 ? `0${nextExam.daysLeft}` : nextExam.daysLeft} 
                  <span>days</span>
                </h2>
                <p>until {nextExam.name}</p>
              </>
            ) : (
              <>
                <h2>-- <span>days</span></h2>
                <p>No upcoming exams</p>
              </>
            )}
          </div>
          
          <button className="widget-btn-outline" onClick={() => navigate('/exams')}>
            View Details
          </button>
        </div>

        <div className="mini-stats-row">

          <div 
            className="mini-stat-card" 
            style={{ position: 'relative', cursor: 'pointer' }}
            onMouseEnter={() => setShowAttendance(true)}
            onMouseLeave={() => setShowAttendance(false)}
          >
            <div className="stat-icon green" style={{ background: '#dcfce7', color: '#166534' }}>📊</div>
            
            <h2>{user?.attendance?.total || "--"}%</h2>
            <p>Attendance</p>

            {showAttendance && user?.attendance && (
              <div className="attendance-details">
                <h4>Attendance Breakdown</h4>
                <div className="att-row">
                  <span className="subject-name">Mathematics</span> 
                  <span className="subject-score">{user.attendance.math}%</span>
                </div>
                <div className="att-row">
                  <span className="subject-name">Prof. Ethics</span> 
                  <span className="subject-score">{user.attendance.ethics}%</span>
                </div>
                <div className="att-row">
                  <span className="subject-name">Physics</span> 
                  <span className="subject-score">{user.attendance.physics}%</span>
                </div>
              </div>
            )}
          </div>

          <div className="mini-stat-card">
            <div className="stat-icon blue">📈</div>
            <h2>{user?.cgpa || "--"}</h2>
            <p>CGPA</p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Subjects;