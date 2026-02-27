import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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
import LandingPage from './Components/LandingPage.jsx'; 
import './App.css';

function AppContent() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/";

  if (isLandingPage) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    );
  }

  return (
    <div className="main-layout" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      
      <Sidebar />

      <div className="content-area" style={{ flex: 1, backgroundColor: '#f4f7f6', display: 'flex', flexDirection: 'column' }}>
        <Nav /> 

        <div className="page-content" style={{ flex: 1, overflowY: 'auto' }}>
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
            <Route path="/syllabus/:programId/:semesterId/:subjectId" element={<Syllabus />} />          
          </Routes>
        </div>
        
      </div> 
    </div> 
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;