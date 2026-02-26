import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Exams.css';
import { useNavigate } from 'react-router-dom';

function Exams() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date()); 
  const [upcomingExams, setUpcomingExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const [userContext] = useState(() => {
    const saved = localStorage.getItem("forensync_user");
    return saved ? JSON.parse(saved) : { programId: "btech-mtech-cybersecurity", semesterId: "sem-2" };
  });

  useEffect(() => {
    fetch(`http://localhost:5001/api/exams/${userContext.programId}/${userContext.semesterId}`)
      .then(res => res.json())
      .then(data => {
        const processedExams = data.map(exam => {
          const eDate = new Date(exam.examDate);
          const today = new Date();
          eDate.setHours(0,0,0,0);
          today.setHours(0,0,0,0);
          
          const diffTime = eDate - today;
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { ...exam, daysLeft: daysLeft > 0 ? daysLeft : 0 };
        });
        setUpcomingExams(processedExams);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load exams:", err);
        setLoading(false);
      });
  }, [userContext.programId, userContext.semesterId]);

  const today = new Date();
  const isSelectedDateToday = 
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  const displayExams = isSelectedDateToday 
    ? upcomingExams.filter(exam => exam.daysLeft >= 0) 
    : upcomingExams.filter(exam => {
        const eDate = new Date(exam.examDate);
        return eDate.getDate() === date.getDate() &&
               eDate.getMonth() === date.getMonth() &&
               eDate.getFullYear() === date.getFullYear();
      });

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const examMatch = upcomingExams.find((exam) => {
        const eDate = new Date(exam.examDate);
        return eDate.getDate() === date.getDate() &&
               eDate.getMonth() === date.getMonth() &&
               eDate.getFullYear() === date.getFullYear();
      });
      if (examMatch) {
        return <div className="cal-dot" style={{ backgroundColor: examMatch.dotColor || '#3b82f6' }}></div>;
      }
    }
    return null;
  };

  return (
    <div className="exams-page-container">
      {/* HEADER */}
      <div className="exams-page-header">
        <div className="header-title-box">
          <span className="graduation-icon">🎓</span>
          <h2>Exam Schedule</h2>
        </div>
        {/* Search bar completely removed from here! */}
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="exams-content-layout">
        
        {/* LEFT COLUMN: EVENTS LIST */}
        <div className="exams-list-section">
          <div className="section-title">
            <h3>📅 {isSelectedDateToday ? "Upcoming Exams" : `Events for ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}</h3>
            
            {/* 🌟 The "Go to Today" button dynamically appears when you select a different date! */}
            {!isSelectedDateToday && (
              <button className="btn-back-today" onClick={() => setDate(new Date())}>
                Go to Today
              </button>
            )}
          </div>

          <div className="exams-list">
            {loading ? (
              <p className="loading-text">Syncing schedule...</p>
            ) : displayExams.length > 0 ? (
              displayExams.map((exam) => (
                <div className="exam-card" key={exam.id}>
                  <div className={`days-box ${exam.colorClass}`}>
                    <h2>{exam.daysLeft}</h2>
                    <p>days left</p>
                  </div>
                  <div className="exam-details">
                    <span className="exam-code">{exam.code}</span>
                    <h4>{exam.name}</h4>
                    <p className="exam-date">{new Date(exam.examDate).toDateString()}</p>
                    <p className="exam-meta">{exam.type} • {exam.time}</p>
                  </div>
                  <div className="exam-action" style={{ display: 'flex', gap: '10px' }}>
                    
                    {/* BUTTON 1: View Syllabus */}
                    <button 
                      className="btn-view-details"
                      onClick={() => navigate(`/syllabus/${userContext.programId}/${userContext.semesterId}/${exam.code}`)} 
                    >
                      📋 Syllabus
                    </button>

                    {/* BUTTON 2: Prepare (Goes to Notes) */}
                    <button 
                      className="btn-prepare"
                      onClick={() => navigate(`/notes/${userContext.programId}/${userContext.semesterId}/${exam.code}`)}
                    >
                      🚀 Prepare
                    </button>

                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p className="empty-title">No exams scheduled.</p>
                <p className="empty-sub">Enjoy your free time!</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CALENDAR */}
        <div className="exams-calendar-section">
          <div className="calendar-widget">
            <Calendar 
              onChange={setDate} 
              value={date} 
              tileContent={tileContent} 
              next2Label={null} 
              prev2Label={null}
            />
            <div className="calendar-legend">
              {upcomingExams.map(exam => (
                 <div className="legend-item" key={exam.id}>
                   <span className="dot" style={{ backgroundColor: exam.dotColor || '#3b82f6' }}></span> 
                   {new Date(exam.examDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: {exam.name}
                 </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Exams;