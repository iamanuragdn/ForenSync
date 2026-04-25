import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import SuperAdminPortal from './Components/SuperAdminPortal.jsx';
import Login from './Components/Login.jsx';
import Onboarding from './Components/Onboarding.jsx';
import SSOVerifyPage from './Components/SSOVerifyPage.jsx';
import VerifyEmail from './Components/VerifyEmail.jsx';
import './App.css';
import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';

import Search from './Components/Search';
import { AnimatePresence } from 'framer-motion';
import { Loader } from 'lucide-react';
import PageTransition from './Components/PageTransition.jsx';
import './index.css';

function ProtectedLayout({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("forensync_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    if (!user || !user.uid) {
      setIsAuthenticating(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const freshData = docSnap.data();

        const safeUser = { ...freshData };
        delete safeUser.role;
        delete safeUser.isVerifiedAdmin;
        delete safeUser.adminType;

        localStorage.setItem("forensync_user", JSON.stringify(safeUser));

        setUser(freshData);
      }
      else {
        localStorage.removeItem("forensync_user");
        setUser(null);
        window.location.href = '/login';
      }
      setIsAuthenticating(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);



  if (isAuthenticating) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)', color: 'var(--text-secondary)' }}>
        <Loader size={36} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role === 'Admin' && user.isVerifiedAdmin === false) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app)', flexDirection: 'column', textAlign: 'center', padding: '20px' }}>
        <div style={{ background: 'var(--bg-card)', padding: '40px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', maxWidth: '450px' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>⏳</div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Verification Pending</h2>
          <p style={{ color: '#64748b', lineHeight: '1.6', marginBottom: '25px', fontSize: '0.95rem' }}>
            Your Faculty/Admin account has been created successfully, but it requires manual security verification from a Superadmin before you can access the ForenSync ecosystem.
          </p>
          <button
            onClick={() => { localStorage.removeItem('forensync_user'); window.location.href = '/login'; }}
            style={{ padding: '12px 24px', background: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="main-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      <div
        className="mobile-overlay"
        onClick={() => {
          document.body.classList.remove('tablet-sidebar-open');
          document.body.classList.remove('mobile-sidebar-open');
        }}
      ></div>

      <Sidebar user={user} />

      <div className="content-area" style={{ flex: 1, backgroundColor: 'transparent', display: 'flex', flexDirection: 'column' }}>
        <Nav />
        <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}



function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        <Route path="/" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route path="/onboarding" element={<PageTransition><Onboarding /></PageTransition>} />
        <Route path="/sso-verify" element={<PageTransition><SSOVerifyPage /></PageTransition>} />
        <Route path="/verify-email" element={<PageTransition><VerifyEmail /></PageTransition>} />

        <Route path="/*" element={
          <ProtectedLayout>
            <AnimatePresence mode="wait">
              <Routes location={location} key={location.pathname}>
                <Route path="/dashboard" element={<PageTransition><Subjects /></PageTransition>} />
                <Route path="/subjects" element={<PageTransition><Subjects /></PageTransition>} />
                <Route path="/notes/:programId/:semesterId/:subjectId" element={<PageTransition><SubjectNotes /></PageTransition>} />
                <Route path="/practice" element={<PageTransition><MockTest /></PageTransition>} />
                <Route path="/syllabus" element={<PageTransition><ProgramSelect /></PageTransition>} />
                <Route path="/syllabus/:programId" element={<PageTransition><SemesterSelect /></PageTransition>} />
                <Route path="/syllabus/:programId/:semesterId" element={<PageTransition><SubjectSelect /></PageTransition>} />
                <Route path="/syllabus/:programId/:semesterId/:subjectId" element={<PageTransition><SyllabusDetail /></PageTransition>} />
                <Route path="/pyq" element={<PageTransition><PYQDashboard /></PageTransition>} />
                <Route path="/pyq/:programId/:semesterId/:subjectId" element={<PageTransition><PYQNotes /></PageTransition>} />
                <Route path="/exams" element={<PageTransition><Exams /></PageTransition>} />
                <Route path="/admin" element={<PageTransition><AdminConsole /></PageTransition>} />
                <Route path="/superadmin" element={<PageTransition><SuperAdminPortal /></PageTransition>} />
                <Route path="/search" element={<PageTransition><Search /></PageTransition>} />
              </Routes>
            </AnimatePresence>
          </ProtectedLayout>
        } />

      </Routes>
    </AnimatePresence>
  );
}

function App() {
  useEffect(() => {
    const handleContextMenu = (e) => {
      // Allow context menu only on inputs and textareas
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };
    
    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;