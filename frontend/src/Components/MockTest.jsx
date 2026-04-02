import React, { useState, useEffect } from 'react';
import { Target, FileText, Settings, CloudUpload } from 'lucide-react';
import './MockTest.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function MockTest() {
  // 👤 Safely grab raw user data from localStorage
  const rawUser = JSON.parse(localStorage.getItem("forensync_user")) || {};

  // ✅ Maps your specific database keys (programId, semesterId) to the app state
  const userProfile = {
    program: rawUser.programId || "btech-mtech-cybersecurity",
    semester: rawUser.semesterId || "sem-4",
    role: rawUser.role || "Student"
  };

  // --- Dynamic Database States ---
  const [dbPrograms, setDbPrograms] = useState([]);
  const [dbSemesters, setDbSemesters] = useState([]);
  const [dbSubjects, setDbSubjects] = useState([]);

  // --- Student Test Selections ---
  const [selectedProgram, setSelectedProgram] = useState(userProfile.program);
  const [selectedSemester, setSelectedSemester] = useState(userProfile.semester);
  const [selectedSubjectCode, setSelectedSubjectCode] = useState("All");
  
  // --- UI States ---
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testStatus, setTestStatus] = useState("");
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [instantFile, setInstantFile] = useState(null);
  const [instantStatus, setInstantStatus] = useState("");

  // 🔄 1. ON LOAD: Fetch Programs
  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/db/programs`);
        if (res.ok) {
          const data = await res.json();
          console.log("Fetched Programs array:", data);
          setDbPrograms(data);
        }
      } catch (err) { console.error("Failed to load programs"); }
    };
    fetchPrograms();
  }, []);

  // 🔄 2. WHEN PROGRAM CHANGES: Fetch Semesters
  useEffect(() => {
    if (!selectedProgram) {
      setDbSemesters([]);
      return;
    }
    const fetchSemesters = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/db/programs/${selectedProgram}/semesters`);
        if (res.ok) setDbSemesters(await res.json());
      } catch (err) { console.error("Failed to load semesters"); }
    };
    fetchSemesters();
  }, [selectedProgram]);

  // 🔄 3. WHEN SEMESTER CHANGES: Fetch Subjects
  useEffect(() => {
    if (!selectedProgram || !selectedSemester) {
      setDbSubjects([]);
      return;
    }
    const fetchSubjects = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/db/programs/${selectedProgram}/semesters/${selectedSemester}/subjects`);
        if (res.ok) setDbSubjects(await res.json());
      } catch (err) { console.error("Failed to load subjects"); }
    };
    fetchSubjects();
  }, [selectedProgram, selectedSemester]);

  // ⚙️ Admin Upload Logic
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setUploadStatus("Please select a file first.");
    setUploadStatus("Uploading to database... ⏳");
    const formData = new FormData();
    formData.append("paper", file); 

    try {
      const response = await fetch(`${API_BASE_URL}/upload-pyq`, { method: "POST", body: formData });
      if (response.ok) {
        setUploadStatus("✅ File accepted! Processing in background.");
        setFile(null);
        setTimeout(() => setUploadStatus(""), 5000); 
      } else setUploadStatus("❌ Error uploading file.");
    } catch { setUploadStatus("❌ Server connection failed."); }
  };

  // 🎓 Start DB Test Logic
  const startDbTest = async () => {
    setTestStatus("Fetching questions... ⏳");
    try {
      const queryParams = new URLSearchParams({
        program: selectedProgram,
        semester: selectedSemester,
        subject_code: selectedSubjectCode 
      }).toString();

      const response = await fetch(`${API_BASE_URL}/get-test?${queryParams}`);
      const data = await response.json();
      
      if (response.ok) {
        setQuestions(data); setCurrentIndex(0); setIsTestRunning(true); setTestStatus(""); 
      } else setTestStatus("❌ " + data.error);
    } catch { setTestStatus("❌ Server connection failed."); }
  };

  // ⚡ Start Instant Test Logic
  const handleInstantTest = async (e) => {
    e.preventDefault();
    if (!instantFile) return setInstantStatus("Please select a PDF first.");
    setInstantStatus("Analyzing PDF... ⏳ (~15 seconds)");
    const formData = new FormData();
    formData.append("paper", instantFile);

    try {
      const response = await fetch(`${API_BASE_URL}/instant-test`, { method: "POST", body: formData });
      const data = await response.json();
      if (response.ok) {
        setQuestions(data); setCurrentIndex(0); setIsTestRunning(true); setInstantStatus(""); setInstantFile(null);
      } else setInstantStatus("❌ " + data.error);
    } catch { setInstantStatus("❌ Server connection failed."); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Practice Arena</h1>
        <p className="subtitle">Generate customized mock tests dynamically from the syllabus database.</p>
      </div>

      <div className="practice-grid">
        
        {/* CARD 1: STUDENT DB TEST */}
        <div className="practice-card">
          <div className="card-icon-wrapper"><span className="card-icon"><Target size={28} /></span></div>
          <h2>Subject Mock Test</h2>
          <p>Select your focus area to generate a new mock test</p>
          
          <div className="action-area">
            <div>
              <label className="input-label">Academic Program</label>
              <select 
                value={selectedProgram} 
                onChange={(e) => { 
                  setSelectedProgram(e.target.value); 
                  setSelectedSemester(""); 
                  setSelectedSubjectCode("All");
                }} 
                className="subject-dropdown"
              >
                <option value="" disabled>-- Select Program --</option>
                {dbPrograms.map((prog) => (
                  <option key={prog.id} value={prog.id}>{prog.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Semester</label>
              <select 
                value={selectedSemester} 
                onChange={(e) => { 
                  setSelectedSemester(e.target.value);
                  setSelectedSubjectCode("All");
                }} 
                disabled={!selectedProgram} 
                className="subject-dropdown"
              >
                <option value="" disabled>-- Select Semester --</option>
                {dbSemesters.map((sem) => (
                  <option key={sem.id} value={sem.id}>{sem.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="input-label">Subject Focus</label>
              <select 
                value={selectedSubjectCode} 
                onChange={(e) => setSelectedSubjectCode(e.target.value)} 
                disabled={!selectedSemester}
                className="subject-dropdown"
              >
                <option value="All">Mixed Subjects (All)</option>
                {dbSubjects.map((sub) => (
                  <option key={sub.code} value={sub.code}>{sub.name} ({sub.code})</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={startDbTest} disabled={!selectedSemester} className="primary-btn mt-auto">
            Start Practice Test
          </button>
          
          {testStatus && (
            <div className={`status-toast ${testStatus.includes("❌") ? "error" : ""}`}>
               {testStatus}
            </div>
          )}
        </div>

        {/* CARD 2: INSTANT TEST */}
        <div className="practice-card">
          <div className="card-icon-wrapper"><span className="card-icon"><FileText size={28} /></span></div>
          <h2>Instant Custom Test</h2>
          <p>Upload a local PDF to instantly generate a temporary mock test.</p>
          
          <div className="action-area mt-auto">
            <form onSubmit={handleInstantTest} className="file-dropzone">
              <label className="dropzone-label">
                <span className="upload-icon"><CloudUpload size={32} /></span>
                <span className="upload-text">{instantFile ? instantFile.name : "Choose PDF File"}</span>
                <input 
                  type="file" 
                  accept="application/pdf" 
                  className="hidden-input" 
                  onChange={(e) => setInstantFile(e.target.files ? e.target.files[0] : null)} 
                />
              </label>
              <button type="submit" className="primary-btn">Generate Quick Test</button>
            </form>
          </div>
          {instantStatus && <div className={`status-toast ${instantStatus.includes("❌") ? "error" : ""}`}>{instantStatus}</div>}
        </div>

        {/* CARD 3: ADMIN UPLOAD */}
        {userProfile.role === 'Admin' && (
          <div className="practice-card">
            <div className="card-icon-wrapper"><span className="card-icon"><Settings size={28} /></span></div>
            <h2>Admin: Add PYQs</h2>
            <p>Process exam papers into the global database.</p>
            
            <div className="action-area mt-auto">
              <form onSubmit={handleUpload} className="file-dropzone">
                <label className="dropzone-label">
                  <span className="upload-icon"><CloudUpload size={32} /></span>
                  <span className="upload-text">{file ? file.name : "Choose PDF File"}</span>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className="hidden-input" 
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} 
                  />
                </label>
                <button type="submit" className="primary-btn">Process to Database</button>
              </form>
            </div>
            {uploadStatus && (
              <div className={`status-toast ${uploadStatus.includes("❌") ? 'error' : ''}`}>
                {uploadStatus}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FULL SCREEN TEST MODAL */}
      {isTestRunning && questions.length > 0 && (
        <div className="test-full-screen">
          <div className="test-card">
            <div className="test-header">
              <div className="header-left">
                <h2>Practice Test</h2>
                <span className="question-count-badge">Q {currentIndex + 1} of {questions.length}</span>
              </div>
              <button onClick={() => setIsTestRunning(false)} className="finish-btn">Finish Test</button>
            </div>
            
            <div className="test-body">
              <div className="test-tags">
                 <span className="tag-subject">
                   {questions[currentIndex].subject_name || "General"}
                 </span>
                 <span className="tag-type">
                   {questions[currentIndex].type || "Descriptive"}
                 </span>
              </div>
              <div className="question-content">
                <h3>{questions[currentIndex].question_text}</h3>
              </div>
            </div>
            
            <div className="test-footer">
              <button 
                onClick={() => setCurrentIndex(currentIndex - 1)} 
                disabled={currentIndex === 0} 
                className={`nav-btn prev-btn ${currentIndex === 0 ? 'disabled' : ''}`}
              >
                ← Previous
              </button>
              <button 
                onClick={() => setCurrentIndex(currentIndex + 1)} 
                disabled={currentIndex === questions.length - 1} 
                className={`nav-btn next-btn ${currentIndex === questions.length - 1 ? 'disabled' : ''}`}
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}