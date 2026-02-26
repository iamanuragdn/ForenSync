import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SubjectNotes.css';

function SubjectNotes() {
  const { programId, semesterId, subjectId } = useParams();
  const navigate = useNavigate();
  
  // --- NEW: View Mode State (Defaults to 'list') ---
  const [viewMode, setViewMode] = useState('list');

  // 🌟 NEW: State to hold the human-readable subject name
  const [subjectName, setSubjectName] = useState(subjectId);
  // Ensure these are at the top of your component!
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleSync = async () => {
    const btn = document.querySelector(".btn-primary-gradient");
    const originalText = btn.innerText;
    
    try {
        btn.innerText = "⏳ Syncing...";
        btn.disabled = true;

        const response = await fetch("http://localhost:5001/api/sync-drive", {
            method: "POST",
        });

        if (response.ok) {
            alert("🚀 Drive Sync Complete! Refreshing your notes...");
            window.location.reload(); 
        } else {
            alert("❌ Sync failed. Check server console.");
        }
    } catch (err) {
        alert("❌ Error connecting to server.");
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
  };

  const formatSemester = (id) => id.replace('-', ' ').toUpperCase();

  useEffect(() => {
    // 🌟 1. ADD THIS: Triggers the loading text when auto-refreshing
    setLoading(true); 

    fetch(`http://localhost:5001/api/notes/${programId}/${semesterId}/${subjectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          // --- SORTING LOGIC STAYS EXACTLY THE SAME ---
          const sortedFiles = (data.files || []).sort((a, b) => {
            return a.name.localeCompare(b.name, undefined, {
              numeric: true,
              sensitivity: 'base'
            });
          });
          
          setFiles(sortedFiles); 
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch notes:", err);
        setError("Failed to connect to the backend server.");
        setFiles([]); 
        setLoading(false);
      });
      
  // 🌟 2. ADD THIS: Put `refreshTrigger` inside these bottom brackets!
  }, [programId, semesterId, subjectId, refreshTrigger]);

  // 🌟 NEW: Fetch the real subject name using the syllabus endpoint
  useEffect(() => {
    fetch(`http://localhost:5001/api/syllabus/${programId}/${semesterId}`)
      .then(res => res.json())
      .then(data => {
        if (data.subjects && !data.error) {
          const currentSubject = data.subjects.find(sub => sub.id === subjectId);
          if (currentSubject && currentSubject.name) {
            setSubjectName(currentSubject.name); // Swaps the ID for the real name!
          }
        }
      })
      .catch(err => console.error("Error fetching subject name:", err));
  }, [programId, semesterId, subjectId]);

  return (
    <div className="notes-dashboard">
      
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <span onClick={() => navigate('/')} className="crumb-link">🏠 Home</span> 
        <span className="separator">/</span> 
        <span>{formatSemester(semesterId)}</span> 
        <span className="separator">/</span> 
        <span className="current-page">{subjectName} Notes</span>
      </div>

      {/* Page Header with View Toggle & Sync Button */}
      <div className="notes-header">
        <div className="header-text">
          <h1>{subjectName}</h1>
          <p className="subtitle">Study Materials • Synced Notes</p>
        </div>
        
        <div className="header-actions">
          {/* --- NEW: The Grid/List Toggle --- */}
          <div className="view-toggle">
          {/* 🌟 1. LIST VIEW BUTTON IS NOW FIRST (LEFT) */}
          <button 
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} 
            onClick={() => setViewMode('list')}
            title="List View"
          >
            {/* Your list SVG icon goes here */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>

          {/* 🌟 2. GRID VIEW BUTTON IS NOW SECOND (RIGHT) */}
          <button 
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} 
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            {/* Your grid SVG icon goes here */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
        </div>

          <button className="btn-primary-gradient" onClick={handleSync}>
              ☁️ Sync Drive
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="status-message loading">Loading your notes from Google Drive...</div>
      ) : error ? (
        <div className="status-message error">{error}</div>
      ) : (
        /* --- NEW: Container changes class based on viewMode --- */
        <div className={`files-container ${viewMode}-view`}>
          {files.length === 0 ? (
            <div className="empty-state">No notes found for this subject yet.</div>
          ) : (
            files.map((file, index) => (
              <div className="file-card" key={index}>
                <div className="file-icon">
                  {file.name.includes('.pdf') ? '📕' : '📘'}
                </div>
                
                <div className="file-info">
                  <h3>{file.name}</h3>
                  {/* <p>Synced from Google Drive</p> */}
                </div>
                
                <div className="file-actions">
                  <a href={file.webViewLink || "#"} target="_blank" rel="noreferrer" className="btn-view">
                    View
                  </a>
                  <a href={file.webContentLink || "#"} download className="btn-download">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SubjectNotes;