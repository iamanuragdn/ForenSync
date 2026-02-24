import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './Components/sidebar.jsx';
import Nav from './Components/nav.jsx'; 
import Subjects from './Components/subjects.jsx'; 

import ProgramSelect from './Components/ProgramSelect.jsx';
import SemesterSelect from './Components/SemesterSelect.jsx';
import SubjectSelect from './Components/SubjectSelect.jsx';
import SyllabusDetail from './Components/SyllabusDetail.jsx';
import SubjectNotes from './Components/SubjectNotes.jsx';
import MockTest from './Components/MockTest.jsx';


// Make sure you created LandingPage.jsx from my previous message!
import LandingPage from './Components/LandingPage.jsx'; 

import './App.css';

// We put the routing logic in a separate component so we can use "useLocation"
function AppContent() {
  const location = useLocation();
  
  // 1. Check if we are on the root URL (The Landing Page)
  const isLandingPage = location.pathname === "/";

  // 2. If we are on the landing page, ONLY show the landing page (No Sidebar or Nav!)
  if (isLandingPage) {
    return (
      <Routes>
        {/* The Landing Page is now your main website entrance */}
        <Route path="/" element={<LandingPage />} />
      </Routes>
    );
  }

  // 3. Otherwise, show the full ForenSync application layout!
  return (
    <div className="main-layout" style={{ display: 'flex', minHeight: '100vh' }}>
      
      <Sidebar />

      <div className="content-area" style={{ flex: 1, backgroundColor: '#f4f7f6', display: 'flex', flexDirection: 'column' }}>
        <Nav /> 

        <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
          <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            {/* 1. The Dashboard is the main hub */}
            <Route path="/dashboard" element={<Subjects />} />
            
            {/* 2. The Subjects page gets its own route */}
            <Route path="/subjects" element={<Subjects />} />
            
            <Route path="/notes/:programId/:semesterId/:subjectId" element={<SubjectNotes />} />
            <Route path="/practice" element={<MockTest />} />
            
            {/* The 4-Step Syllabus Funnel */}
            <Route path="/syllabus" element={<ProgramSelect />} />
            <Route path="/syllabus/:programId" element={<SemesterSelect />} />
            <Route path="/syllabus/:programId/:semesterId" element={<SubjectSelect />} />
            <Route path="/syllabus/:programId/:semesterId/:subjectId" element={<SyllabusDetail />} />
          </Routes>
        </div>
        </div> 
        
      </div> 
    </div> 
  );
}

// The main App component just wraps everything in the Router
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;