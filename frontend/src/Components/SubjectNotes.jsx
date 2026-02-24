import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SubjectNotes.css';

function SubjectNotes() {
  const { programId, semesterId, subjectId } = useParams();
  const navigate = useNavigate();
  
  // --- NEW: View Mode State (Defaults to 'grid') ---
  const [viewMode, setViewMode] = useState('grid'); 

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
    fetch(`http://localhost:5001/api/notes/${programId}/${semesterId}/${subjectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          // --- SORTING LOGIC ADDED HERE ---
          const sortedFiles = (data.files || []).sort((a, b) => {
            // This compares the names alphabetically (Unit 1, Unit 2, etc.)
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
  }, [programId, semesterId, subjectId]);

  return (
    <div className="notes-dashboard">
      
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <span onClick={() => navigate('/')} className="crumb-link">🏠 Home</span> 
        <span className="separator">/</span> 
        <span>{formatSemester(semesterId)}</span> 
        <span className="separator">/</span> 
        <span className="current-page">{subjectId} Notes</span>
      </div>

      {/* Page Header with View Toggle & Sync Button */}
      <div className="notes-header">
        <div className="header-text">
          <h1>Study Materials</h1>
          <p className="subtitle">Access your synced Google Drive notes and past year questions for {subjectId}.</p>
        </div>
        
        <div className="header-actions">
          {/* --- NEW: The Grid/List Toggle --- */}
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z"/></svg>
            </button>
            <button 
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>
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
                  <p>Synced from Google Drive</p>
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