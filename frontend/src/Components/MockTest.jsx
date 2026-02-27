import { useState, useEffect } from 'react';
import './MockTest.css';

function MockTest() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [activeQuestions, setActiveQuestions] = useState(null); 
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Fetch subjects when page loads
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/get-subjects');
        if (response.ok) {
          const data = await response.json();
          setSubjects(data);
          if (data.length > 0) setSelectedSubject('All');
        }
      } catch (error) {
        console.error("Failed to fetch subjects", error);
      } finally {
        setIsLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  // Start Test from the Bank
  const handleStartBankTest = async () => {
    if (!selectedSubject) return;
    setTestLoading(true);
    setTestError(null);
    
    try {
      const response = await fetch(`http://localhost:5001/api/get-test?subject=${encodeURIComponent(selectedSubject)}`);
      if (!response.ok) throw new Error("Failed to fetch questions.");
      const data = await response.json();
      setActiveQuestions(data);
      setCurrentIndex(0);
    } catch (err) {
      setTestError(err.message);
    } finally {
      setTestLoading(false);
    }
  };

  // DRAG AND DROP HANDLERS
  const handleDragOver = (e) => {
    e.preventDefault(); 
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      
      if (droppedFile.type === "application/pdf") {
        setSelectedFile(droppedFile);
        setUploadStatus('');
      } else {
        alert("Please upload a PDF file.");
      }
    }
  };

  // Upload File & Start Instant Test
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus('');
    }
  };

  const handleUploadTest = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadStatus('');
    setTestError(null);

    const formData = new FormData();
    formData.append('paper', selectedFile);

    try {
      const response = await fetch('http://localhost:5001/api/instant-test', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const extractedData = await response.json();
        setActiveQuestions(extractedData);
        setCurrentIndex(0);
        setSelectedFile(null); 
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  if (testLoading || testError || activeQuestions) {
    if (testLoading) return <div className="test-full-screen"><div className="status-card">Generating your test...</div></div>;
    if (testError) return <div className="test-full-screen"><div className="status-card error">{testError} <button onClick={() => setTestError(null)}>Go Back</button></div></div>;
    if (activeQuestions.length === 0) return <div className="test-full-screen"><div className="status-card">No questions found. <button onClick={() => setActiveQuestions(null)}>Go Back</button></div></div>;

    const currentQ = activeQuestions[currentIndex];

    return (
      <div className="test-full-screen">
        <div className="test-card">
          <div className="test-header">
            <div className="header-left">
              <h2>Practice Test</h2>
              <span className="question-count-badge">
                Question {currentIndex + 1} of {activeQuestions.length}
              </span>
            </div>
            <button className="finish-btn" onClick={() => setActiveQuestions(null)}>Finish Test</button>
          </div>

          <div className="test-body">
            <div className="test-tags">
              <span className="tag-subject">
                {currentQ.subject?.toUpperCase() || selectedSubject.toUpperCase()}
              </span>
              {currentQ.type && <span className="tag-type">{currentQ.type.toUpperCase()}</span>}
            </div>
            <div className="question-content">
              <h3>{currentQ.question_text}</h3>
            </div>
          </div>

          <div className="test-footer">
            <button 
              className={`nav-btn prev-btn ${currentIndex === 0 ? 'disabled' : ''}`} 
              onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>
            <button 
              className={`nav-btn next-btn ${currentIndex === activeQuestions.length - 1 ? 'disabled' : ''}`} 
              onClick={() => currentIndex < activeQuestions.length - 1 && setCurrentIndex(currentIndex + 1)}
              disabled={currentIndex === activeQuestions.length - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <h1>Mock Tests</h1>
        <p className="subtitle">Test your knowledge with AI-generated questions from past NFSU papers.</p>
      </header>

      <div className="practice-grid">
        {/* Card 1: Bank Test */}
        <div className="practice-card">
          <div className="card-icon-wrapper"><span className="card-icon">🎯</span></div>
          <h2>Subject Mock Test</h2>
          <p>Generate a quiz from our compiled database of previously processed exam papers.</p>
          
          <div className="action-area">
            <label className="input-label">Select Subject</label>
            {isLoadingSubjects ? (
              <div className="loading-text">Loading subjects...</div>
            ) : subjects.length > 0 ? (
              <select className="subject-dropdown" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                <option value="All">Mix of All Subjects</option>
                {subjects.map((sub, idx) => <option key={idx} value={sub}>{sub}</option>)}
              </select>
            ) : (
              <div className="empty-state">No subjects available yet.</div>
            )}
            <button className="primary-btn mt-auto" onClick={handleStartBankTest} disabled={!selectedSubject || subjects.length === 0}>
              Start Mock Test →
            </button>
          </div>
        </div>

        {/* Card 2: Upload Test */}
        <div className="practice-card">
          <div className="card-icon-wrapper"><span className="card-icon">📄</span></div>
          <h2>Instant Custom Test</h2>
          <p>Upload a PDF of a Past Year Question paper. Our engine will instantly extract it into a test.</p>
          
          <div className="action-area">
            <label className="input-label">Upload PDF Paper</label>
            <div className="file-dropzone">
              <input type="file" id="file-upload" accept="application/pdf" onChange={handleFileChange} className="hidden-input"/>
              
              <label 
                htmlFor="file-upload" 
                className={`dropzone-label ${isDragging ? 'is-dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <span className="upload-icon">📁</span>
                <span className="upload-text">
                  {selectedFile ? selectedFile.name : 'Click to browse or drag & drop PDF'}
                </span>
              </label>
            </div>
            {uploadStatus === 'error' && <div className="status-toast error">Upload failed. Please try again.</div>}
            <button className={`primary-btn outline-btn mt-auto ${isUploading ? 'loading' : ''}`} onClick={handleUploadTest} disabled={!selectedFile || isUploading}>
              {isUploading ? 'Extracting Paper...' : 'Upload & Start Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MockTest;