import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './Components/sidebar.jsx';
import Nav from './Components/nav.jsx'; 
import Subjects from './Components/subjects.jsx';
import Syllabus from './Components/syllabus'; 
import ProgramSelect from './Components/ProgramSelect.jsx';
import SemesterSelect from './Components/SemesterSelect.jsx';
import SubjectSelect from './Components/SubjectSelect.jsx';
import SyllabusDetail from './Components/SyllabusDetail.jsx';
import SubjectNotes from './Components/SubjectNotes.jsx';
import MockTest from './Components/MockTest.jsx';
import PYQDashboard from './Components/PYQDashboard';
import PYQNotes from './Components/PYQNotes';
import Exams from './Components/Exams';
import AdminConsole from './Components/AdminConsole';
import Login from './Components/Login.jsx'; 
import Onboarding from './Components/Onboarding.jsx';
import './App.css';
import React, { useState, useEffect } from 'react'; // 🌟 Add these
import { doc, onSnapshot } from 'firebase/firestore'; // 🌟 Add these
import { db } from './firebase'; // 🌟 Add this so we can talk to the database


// 🌟 THE LIVE SECURITY GUARD
function ProtectedLayout({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("forensync_user");
    return saved ? JSON.parse(saved) : null;
  });

  // 🌟 THE MAGIC: Listen to Firebase in real-time!
  useEffect(() => {
    if (!user || !user.uid) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const freshData = docSnap.data();
        // If the Superadmin changed their status, update the app instantly!
        if (freshData.isVerifiedAdmin !== user.isVerifiedAdmin) {
          setUser(freshData);
          localStorage.setItem("forensync_user", JSON.stringify(freshData));
        }
      }
      else {
        // 🚨 THE KILL SWITCH: If the database record is deleted, kick them out instantly!
        localStorage.removeItem("forensync_user");
        setUser(null);
        window.location.href = '/login'; 
      }
    });

    return () => unsubscribe(); // Cleanup listener
  }, [user?.uid, user?.isVerifiedAdmin]);

  // 1. If not logged in, kick to Login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // 2. If Admin but NOT verified, show the lock screen
  if (user.role === 'Admin' && user.isVerifiedAdmin === false) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', flexDirection: 'column', textAlign: 'center', padding: '20px' }}>
        <div style={{ background: 'white', padding: '40px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '450px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>⏳</div>
          <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>Verification Pending</h2>
          <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '25px', fontSize: '0.95rem' }}>
            Your Faculty/Admin account has been created successfully, but it requires manual security verification from a Superadmin before you can access the ForenSync ecosystem.
          </p>
          <button 
            onClick={() => { localStorage.removeItem('forensync_user'); window.location.href='/login'; }}
            style={{ padding: '12px 24px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // 3. Render the main layout!
  return (
    <div className="main-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div className="content-area" style={{ flex: 1, backgroundColor: '#f4f7f6', display: 'flex', flexDirection: 'column' }}>
        <Nav /> 
        <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div> 
    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* 🌟 FULL SCREEN ROUTES (No Sidebar/Nav) */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        {/* 🌟 MAIN DASHBOARD ROUTES (Wrapped in the Security Guard) */}
        <Route path="/*" element={
          <ProtectedLayout>
            <Routes>
              <Route path="/dashboard" element={<Subjects />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/notes/:programId/:semesterId/:subjectId" element={<SubjectNotes />} />
              <Route path="/practice" element={<MockTest />} />
              <Route path="/syllabus" element={<ProgramSelect />} />
              <Route path="/syllabus/:programId" element={<SemesterSelect />} />
              <Route path="/syllabus/:programId/:semesterId" element={<SubjectSelect />} />
              <Route path="/syllabus/:programId/:semesterId/:subjectId" element={<SyllabusDetail />} />
              <Route path="/pyq" element={<PYQDashboard />} />
              <Route path="/pyq/:programId/:semesterId/:subjectId" element={<PYQNotes />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/admin" element={<AdminConsole />} />
            </Routes>
          </ProtectedLayout>
        } />

      </Routes>
    </BrowserRouter>
  );
}

export default App;