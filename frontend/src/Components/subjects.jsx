import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './subjects.css'; 

function Subjects() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Arrays to give the database subjects nice dynamic colors and icons
  const cardColors = ['purple', 'blue', 'green', 'pink', 'teal', 'orange'];
  const cardIcons = ['∑', '🔬', '💻', '💬', '⚡', '📐'];

  // 1. Initialize viewingSemester directly from Local Storage so it's instantly accurate!
  const [viewingSemester, setViewingSemester] = useState(() => {
    const saved = localStorage.getItem("forensync_user");
    return saved ? JSON.parse(saved).semesterId : "sem-1";
  });

  // 2. Add viewingSemester to the dependency array so this re-runs when the dropdown changes!
  useEffect(() => {
    const savedUser = localStorage.getItem("forensync_user");
    if (!savedUser) {
      navigate("/login"); 
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    // This safely converts the old ID in your database to the new one we are using
    const activeProgramId = parsedUser.programId === "btech-mtech-cybersecurity" ? "btech-mtech-cybersecurity" : parsedUser.programId;

    // Use parsedUser here to prevent a crash on the very first millisecond load
    fetch(`http://localhost:5001/api/syllabus/${activeProgramId}/${viewingSemester}`)
      .then(res => res.json())
      .then(data => {
        if (data.subjects && !data.error) {
          const theorySubjects = data.subjects.filter(sub => sub.type !== "Lab");
          setSubjects(theorySubjects);
        } else {
          setSubjects([]); // If folder doesn't exist, empty the screen!
        }
        setLoading(false);
      })
      .catch(err => {
        setSubjects([]);
        setLoading(false);
      });
  }, [navigate, viewingSemester]); // <--- The magic fix!

  const handleLogout = () => {
    localStorage.removeItem("forensync_user");
    navigate("/login");
  };

  if (loading || !user) return <div className="home-dashboard">Loading your dashboard...</div>;

  return (
    <div className="home-dashboard">
      
      {/* LEFT COLUMN */}
      <div className="dashboard-left">
        <div className="welcome-banner">
          <div className="welcome-content">
            <span className="welcome-badge">✨ Welcome back</span>
            <h1>Hello, {user.name.split(' ')[0]}</h1>
            <p>You're making great progress in {user.semesterId.toUpperCase()}. Let's keep the focus sharp.</p>
            <div className="welcome-actions">
              <button className="btn-primary-gradient">📅 View Schedule</button>
            </div>
          </div>
          <div className="progress-circle-container">
            <div className="progress-circle">
              <span className="percentage">75%</span>
              <span className="label">SEMESTER</span>
            </div>
          </div>
        </div>

        {/* The Semester Switcher UI */}
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

        {/* DYNAMIC SUBJECTS FROM DATABASE! */}
        <div className="subjects-grid">
          {subjects.length === 0 ? (
            <div style={{ padding: '20px', color: '#64748b', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              No subjects found for this semester yet.
            </div>
          ) : (
            subjects.map((sub, index) => (
            <div 
                className="subject-card"
                key={sub.id || index} // FIX 1: Changed sub.code to sub.id (and added a fallback)
                style={{ cursor: 'pointer' }}
                /* Navigates based on the VIEWING semester, not the user's base semester! */
                onClick={() => navigate(`/notes/${user.programId}/${viewingSemester}/${sub.id}`)} // FIX 2: Changed sub.code to sub.id
                        >
                <div className={`card-accent accent-${cardColors[index % cardColors.length]}`}></div>
                <div className="subject-icon-box">{cardIcons[index % cardIcons.length]}</div>
                        
                <h3>{sub.name}</h3>
                <p>{sub.teacher}</p>
                <div className="card-footer">
                  <span className="subject-code-badge">{sub.id}</span> {/* FIX 3: Changed sub.code to sub.id */}
                  <span className="arrow-icon">→</span>
                </div>
            </div>
          ))
          )}
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="dashboard-right">
        {/* Next Exam Widget */}
        <div className="widget next-exam-widget">
          <div className="widget-header">
            <div className="header-left">
              <span className="icon">⏱️</span>
              <h3>Next Exam</h3>
            </div>
            <span className="urgent-badge">Urgent</span>
          </div>
          
          <div className="countdown">
            <h2>03 <span>days</span></h2>
            <p>until Physics Finals</p>
          </div>
          <button className="widget-btn-outline">View Details</button>
        </div>

        {/* Mini Stats Row */}
        <div className="mini-stats-row">
          <div className="mini-stat-card">
            <div className="stat-icon green">✓</div>
            <h2>12</h2>
            <p>Tasks Done</p>
          </div>
          <div className="mini-stat-card">
            <div className="stat-icon blue">📈</div>
            <h2>{user.cgpa}</h2>
            <p>CGPA</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Subjects;