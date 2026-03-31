import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './Exams.css';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase'; // Ensure this path points correctly to your firebase setup file
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

function Exams() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date()); 
  const [viewedMonth, setViewedMonth] = useState(new Date());
  
  // 🌟 State to hold all the exams
  const [allExams, setAllExams] = useState([]);
  const [loading, setLoading] = useState(true);
  // 🌟 NEW: State to track which exams already have reflections
  const [completedReflections, setCompletedReflections] = useState(new Set());

  // 🌟 NEW: Saves the reflection to Firestore!
  const saveReflectionToFirebase = async () => {
    // Basic validation to make sure they typed something
    if (!reflection.expectedMarks) {
      alert("Please enter your expected marks!");
      return;
    }

    try {
      // 1. Create a unique ID for this specific reflection
      // E.g., "rupanshu@email.com_CTBT-BSC-102_CA2"
      const userEmail = userContext.email || "guest_user";
      const reflectionId = `${userEmail}_${reviewModal.exam.code}_${reviewModal.exam.type}`.replace(/\s+/g, '-');

      // 2. Package the data
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
      // 3. Send it to Firestore!
      await setDoc(doc(db, "reflections", reflectionId), reflectionData);
      
      // 🌟 NEW: Instantly update the UI to show it's completed!
      setCompletedReflections(prev => new Set(prev).add(reviewModal.exam.code));
      
      alert("Reflection successfully saved to your profile!");
      
      alert("Reflection successfully saved to your profile!");
      setReviewModal({ isOpen: false, exam: null }); // Close the modal

    } catch (error) {
      console.error("Error saving reflection:", error);
      alert("Failed to save. Check console for details.");
    }
  };

  // 🌟 NEW: State for the Review/Reflection Modal
  const [reviewModal, setReviewModal] = useState({ isOpen: false, exam: null });
  const [reflection, setReflection] = useState({ expectedMarks: '', lostMarksNotes: '' });

  // Function to handle opening the modal
  // 🌟 UPGRADED: Opens the modal AND fetches past data from Firebase
  const handleOpenReview = async (exam) => {
    // 1. Open the modal immediately so the UI feels fast
    setReviewModal({ isOpen: true, exam: exam, isLoading: true });
    
    // Clear out any old data from a previous click
    setReflection({ expectedMarks: '', lostMarksNotes: '', isExisting: false }); 

    try {
      // 2. Re-calculate the exact ID we used to save it
      const userEmail = userContext.email || "guest_user";
      const reflectionId = `${userEmail}_${exam.code}_${exam.type}`.replace(/\s+/g, '-');

      // 3. Ask Firebase: "Do you have a document with this ID?"
      const docRef = doc(db, "reflections", reflectionId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // 4. BINGO! We found old data. Let's inject it into the inputs!
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
      // Turn off the loading state
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
        // Calculate the difference in days for every exam
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

  // 🌟 NEW: Fetch the user's existing reflections on page load
  useEffect(() => {
    const fetchUserReflections = async () => {
      const userEmail = userContext.email || "guest_user";
      try {
        // Search the "reflections" collection for this user's email
        const q = query(collection(db, "reflections"), where("userEmail", "==", userEmail));
        const querySnapshot = await getDocs(q);
        
        // Create a Set of examCodes that have been completed
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

  // 🌟 THE MAGIC: Splitting the master list into Upcoming vs Past!
  
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

  // Logic for what displays when the user clicks a specific date on the calendar
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

  // Helper function to color-code the exam type badge
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
      {/* HEADER */}
      <div className="exams-page-header">
        <div className="header-title-box">
          <span className="graduation-icon">🎓</span>
          <h2>Exam Schedule</h2>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT */}
      <div className="exams-content-layout">
        
        <div className="exams-list-section">
          
          {/* 🌟 1. UPCOMING EXAMS BLOCK 🌟 */}
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
                      
                      {/* 🌟 NEW: The bold Exam Type Badge */}
                      <span className={`exam-type-badge ${getBadgeClass(exam.type)}`}>
                        {exam.type}
                      </span>
                    </div>
                    
                    <h4>{exam.name}</h4>
                    <p className="exam-date">{new Date(exam.examDate).toDateString()}</p>
                    <p className="exam-meta">{exam.time}</p> {/* 🌟 Removed exam.type from here since it's a badge now! */}
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

{/* 🌟 2. RECENTLY COMPLETED EXAMS BLOCK 🌟 */}
          {isSelectedDateToday && pastExams.length > 0 && (
            <>
              <div className="section-title" style={{ marginTop: '30px' }}>
                <h3>✅ Recently Completed</h3>
              </div>
              
              {/* Uses a simple div without the heavy spacing */}
              <div>
                {pastExams.map((exam) => (
                  <div className="exam-card-past" key={`past-${exam.id}`}>
                    
                    {/* Tiny Checkmark Icon */}
                    <div className="past-icon-box">
                      ✓
                    </div>
                    
                    {/* Compact Details on One Line */}
                    {/* Compact Details on One Line */}
                    <div className="past-details" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px', padding: '4px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4>{exam.name}</h4>
                        
                        {/* 🌟 NEW: The bold Exam Type Badge for Past Exams! */}
                        <span className={`exam-type-badge ${getBadgeClass(exam.type)}`} style={{ marginBottom: 0, padding: '2px 8px', fontSize: '10px' }}>
                          {exam.type}
                        </span>
                      </div>
                      
                      <span className="exam-date">• {new Date(exam.examDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    
                    {/* 🌟 UPGRADED: Smart Button that checks the completedReflections Set */}
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

        {/* CALENDAR */}
        <div className="exams-calendar-section">
          <div className="calendar-widget">
            <Calendar 
              onChange={(newDate) => {
                setDate(newDate);
                setViewedMonth(newDate); // Updates viewed month if they click a specific day
              }} 
              value={date} 
              tileContent={tileContent} 
              onActiveStartDateChange={({ activeStartDate }) => setViewedMonth(activeStartDate)} // 🌟 MAGIC: Fires when they click the < or > arrows!
              next2Label={null} 
              prev2Label={null}
            />
            <div className="calendar-legend">
              {allExams
                .filter(exam => {
                  // 🌟 NEW: Only keep exams that match the currently viewed month and year
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

      {/* 🌟 THE POST-EXAM REFLECTION MODAL 🌟 */}
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
                    placeholder={`e.g. ${Math.round((reviewModal.exam.fullMarks || 100) * 0.85)}`} // 🌟 Bonus: Dynamically suggests an 85% score as the placeholder!
                    value={reflection.expectedMarks}
                    onChange={(e) => setReflection({...reflection, expectedMarks: e.target.value})}
                  />
                  
                  {/* 🌟 MAGIC: Dynamically pulls the max marks from your backend! */}
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
                {/* 🌟 MAGIC: Changes text based on whether Firebase found old data! */}
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