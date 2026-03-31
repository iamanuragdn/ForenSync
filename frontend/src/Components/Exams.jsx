import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Exams.css';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

function Exams() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date()); 
  const [viewedMonth, setViewedMonth] = useState(new Date());
  
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedReflections, setCompletedReflections] = useState(new Set());

  const saveReflectionToFirebase = async () => {
    if (!reflection.expectedMarks) {
      alert("Please enter your expected marks!");
      return;
    }

    try {
      // 1. Create a unique ID for this specific reflection
      // E.g., "rupanshu@email.com_CTBT-BSC-102_CA2"
      const userEmail = userContext.email || "guest_user";
      const reflectionId = `${userEmail}_${reviewModal.exam.code}_${reviewModal.exam.type}`.replace(/\s+/g, '-');

      const reflectionData = {
        userEmail: userEmail,
        programId: userContext.programId,
        semesterId: userContext.semesterId,
        examCode: reviewModal.exam.code,
        examName: reviewModal.exam.name,
        examType: reviewModal.exam.type,
        expectedMarks: reflection.expectedMarks,
        lostMarksNotes: reflection.lostMarksNotes,
        updatedAt: new Date().toISOString()
      };

      // 3. Send it to Firestore! (Saves in a collection called 'reflections')
      await setDoc(doc(db, "reflections", reflectionId), reflectionData);
      
      setCompletedReflections(prev => new Set(prev).add(reviewModal.exam.code));
      
      alert("Reflection successfully saved to your profile!");
      setReviewModal({ isOpen: false, exam: null });

    } catch (error) {
      console.error("Error saving reflection:", error);
      alert("Failed to save. Check console for details.");
    }
  };

  const [reviewModal, setReviewModal] = useState({ isOpen: false, exam: null });
  const [reflection, setReflection] = useState({ expectedMarks: '', lostMarksNotes: '' });

  const handleOpenReview = async (exam) => {
    setReviewModal({ isOpen: true, exam: exam, isLoading: true });
    
    setReflection({ expectedMarks: '', lostMarksNotes: '', isExisting: false }); 

    try {
      const userEmail = userContext.email || "guest_user";
      const reflectionId = `${userEmail}_${exam.code}_${exam.type}`.replace(/\s+/g, '-');

      const docRef = doc(db, "reflections", reflectionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const savedData = docSnap.data();
        setReflection({
          expectedMarks: savedData.expectedMarks || '',
          lostMarksNotes: savedData.lostMarksNotes || '',
          isExisting: true // Tells our UI that this is an update, not a new save
        });
      }
    } catch (error) {
      console.error("Error fetching reflection:", error);
    } finally {
      setReviewModal(prev => ({ ...prev, isLoading: false }));
    }
  };
  
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
          // Note: Removing the Math.max(0) cap so we can see negative numbers (past exams)
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return { ...exam, daysLeft: daysLeft }; 
        });
        
        setAllExams(processedExams);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load exams:", err);
        setLoading(false);
      });
  }, [userContext.programId, userContext.semesterId]);

  useEffect(() => {
    const fetchUserReflections = async () => {
      const userEmail = userContext.email || "guest_user";
      try {
        const q = query(collection(db, "reflections"), where("userEmail", "==", userEmail));
        const querySnapshot = await getDocs(q);
        
        const completed = new Set();
        querySnapshot.forEach((doc) => {
          completed.add(doc.data().examCode);
        });
        
        setCompletedReflections(completed);
      } catch (error) {
        console.error("Failed to load reflections:", error);
      }
    };

    fetchUserReflections();
  }, [userContext.email]);

  const today = new Date();
  const isSelectedDateToday = 
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  
  // 1. Upcoming Exams: Filter daysLeft >= 0, sort by closest date, take top 3
  const upcomingExams = allExams
    .filter(exam => exam.daysLeft >= 0)
    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate))
    .slice(0, 3);

  // 2. Past Exams: Filter daysLeft < 0, sort by most recent past date, take top 3
  const pastExams = allExams
    .filter(exam => exam.daysLeft < 0)
    .sort((a, b) => new Date(b.examDate) - new Date(a.examDate))
    .slice(0, 3);

  const displayExams = isSelectedDateToday 
    ? upcomingExams 
    : allExams.filter(exam => {
        const eDate = new Date(exam.examDate);
        return eDate.getDate() === date.getDate() &&
               eDate.getMonth() === date.getMonth() &&
               eDate.getFullYear() === date.getFullYear();
      });

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const examMatch = allExams.find((exam) => {
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

  const getBadgeClass = (type) => {
    if (!type) return 'badge-default';
    const lowerType = type.toLowerCase();
    if (lowerType.includes('ca1') || lowerType.includes('ca3')) return 'badge-ca1';
    if (lowerType.includes('ca2') || lowerType.includes('mid')) return 'badge-ca2';
    if (lowerType.includes('end')) return 'badge-end-semester';
    return 'badge-default';
  };

  return (
    <div className="exams-page-container">
      <div className="exams-page-header">
        <div className="header-title-box">
          <span className="graduation-icon">🎓</span>
          <h2>Exam Schedule</h2>
        </div>
      </div>

      <div className="exams-content-layout">
        
        <div className="exams-list-section">
          
          <div className="section-title">
            <h3>📅 {isSelectedDateToday ? "Upcoming Exams" : `Events for ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}</h3>
            
            {!isSelectedDateToday && (
              <button className="btn-back-today" onClick={() => setDate(new Date())}>
                Go to Today
              </button>
            )}
          </div>

          <div className="exams-list" style={{ marginBottom: '40px' }}>
            {loading ? (
              <p className="loading-text">Syncing schedule...</p>
            ) : displayExams.length > 0 ? (
              displayExams.map((exam) => (
                <div className="exam-card" key={`upcoming-${exam.id}`}>
                  <div className={`days-box ${exam.colorClass || 'exam-blue'}`}>
                    {/* We ensure it never shows a negative number in the "Upcoming" view */}
                    <h2>{Math.max(0, exam.daysLeft)}</h2>
                    <p>days left</p>
                  </div>
                  <div className="exam-details">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="exam-code">{exam.code}</span>
                      
                      <span className={`exam-type-badge ${getBadgeClass(exam.type)}`}>
                        {exam.type}
                      </span>
                    </div>
                    
                    <h4>{exam.name}</h4>
                    <p className="exam-date">{new Date(exam.examDate).toDateString()}</p>
                    <p className="exam-meta">{exam.time}</p>
                  </div>
                  <div className="exam-action" style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-view-details" onClick={() => navigate(`/syllabus/${userContext.programId}/${userContext.semesterId}/${exam.code}`)}>
                      📋 Syllabus
                    </button>
                    <button className="btn-prepare" onClick={() => navigate(`/notes/${userContext.programId}/${userContext.semesterId}/${exam.code}`)}>
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

          {isSelectedDateToday && pastExams.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: '30px' }}>
                <h3>✅ Recently Completed</h3>
              </div>
              
              <div>
                {pastExams.map((exam) => (
                  <div className="exam-card-past" key={`past-${exam.id}`}>
                    
                    <div className="past-icon-box">
                      ✓
                    </div>
                    
                    <div className="past-details" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: '4px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4>{exam.name}</h4>
                        
                        <span className={`exam-type-badge ${getBadgeClass(exam.type)}`} style={{ marginBottom: 0, padding: '2px 8px', fontSize: '10px' }}>
                          {exam.type}
                        </span>
                      </div>
                      
                      <span className="exam-date">• {new Date(exam.examDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    
                    <button 
                      className={`btn-review-past ${completedReflections.has(exam.code) ? 'completed' : ''}`} 
                      onClick={() => handleOpenReview(exam)}
                    >
                      {completedReflections.has(exam.code) ? 'View Reflection' : '+ Add Reflection'}
                    </button>
                    
                  </div>
                ))}
              </div>
            </>
          )}

        </div>

        <div className="exams-calendar-section">
          <div className="calendar-widget">
            <Calendar 
              onChange={(newDate) => {
                setDate(newDate);
                setViewedMonth(newDate);
              }} 
              value={date} 
              tileContent={tileContent} 
              onActiveStartDateChange={({ activeStartDate }) => setViewedMonth(activeStartDate)} 

              next2Label={null} 
              prev2Label={null}
            />
            <div className="calendar-legend">
              {allExams
                .filter(exam => {
                  const eDate = new Date(exam.examDate);
                  return eDate.getMonth() === viewedMonth.getMonth() && 
                         eDate.getFullYear() === viewedMonth.getFullYear();
                })
                .map(exam => (
                 <div className="legend-item" key={`legend-${exam.id}`}>
                   <span className="dot" style={{ backgroundColor: exam.dotColor || '#3b82f6', opacity: exam.daysLeft < 0 ? 0.3 : 1 }}></span> 
                   <span style={{ textDecoration: exam.daysLeft < 0 ? 'line-through' : 'none', color: exam.daysLeft < 0 ? '#94a3b8' : 'inherit' }}>
                     {new Date(exam.examDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}: {exam.name}
                   </span>
                 </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {reviewModal.isOpen && (
        <div className="reflection-overlay" onClick={() => setReviewModal({ isOpen: false, exam: null })}>
          <div className="reflection-modal" onClick={(e) => e.stopPropagation()}>
            
            <div className="reflection-header">
              <div>
                <span className="reflection-badge">{reviewModal.exam.code}</span>
                <h3>{reviewModal.exam.name}</h3>
              </div>
              <button className="btn-close" onClick={() => setReviewModal({ isOpen: false, exam: null })}>✕</button>
            </div>

            <div className="reflection-body">
              <div className="input-group">
                <label>Target / Expected Marks</label>
                <div className="marks-input-wrapper">
                  <input 
                    type="number" 
                    placeholder={`e.g. ${Math.round((reviewModal.exam.fullMarks || 100) * 0.85)}`} 

                    value={reflection.expectedMarks}
                    onChange={(e) => setReflection({...reflection, expectedMarks: e.target.value})}
                  />
                  

                  <span className="marks-total">/ {reviewModal.exam.fullMarks || 100}</span>
                  
                </div>
              </div>

              <div className="input-group">
                <label>Where might you lose marks?</label>
                <textarea 
                  placeholder="e.g., I completely blanked on the last question about Cyber Laws, and made a silly math error in section B..."
                  rows="4"
                  value={reflection.lostMarksNotes}
                  onChange={(e) => setReflection({...reflection, lostMarksNotes: e.target.value})}
                ></textarea>
              </div>

              {/* This section would only show up later when actual results are released! */}
              <div className="actual-results-locked">
                <span className="lock-icon">🔒</span>
                <div className="locked-text">
                  <h4>Actual Score Pending</h4>
                  <p>Check back when university results are declared to compare your expectations!</p>
                </div>
              </div>
            </div>

            <div className="reflection-footer">
              <button 
                className="btn-cancel"
                onClick={() => setReviewModal({ isOpen: false, exam: null })}
              >
                Cancel
              </button>
              
              <button 
                className="btn-save-reflection"
                onClick={saveReflectionToFirebase}
                disabled={reviewModal.isLoading}
              >
                {reviewModal.isLoading ? "Loading..." : reflection.isExisting ? "Update Reflection" : "Save Reflection"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
    
  );
}

export default Exams;