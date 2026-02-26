import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import './PYQNotes.css'; 

function PYQNotes() {
  const { programId, semesterId, subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const selectedExam = searchParams.get('exam') || 'CA1'; 

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // NEW: Added states to handle the Sync button loading animation and auto-refreshing
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 

  // Notice I added 'refreshTrigger' to the dependency array at the bottom!
  useEffect(() => {
    setLoading(true); // Show loading text when fetching
    fetch(`http://localhost:5001/api/notes/${programId}/${semesterId}/${subjectId}?type=PYQ`)
      .then(res => res.json())
      .then(data => {
        const sortedFiles = (data.files || []).sort((a, b) => 
            a.name.localeCompare(b.name, undefined, { numeric: true })
        );
        
        const filteredByExam = sortedFiles.filter(file => 
            file.name.toUpperCase().includes(selectedExam.toUpperCase())
        );

        setFiles(filteredByExam);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch PYQs:", err);
        setLoading(false);
      });
  }, [programId, semesterId, subjectId, selectedExam, refreshTrigger]);

  // NEW: The actual function to hit your backend crawler
  // NEW: The actual function to hit your backend crawler
  const handleSync = async () => {
    setIsSyncing(true); // Changes button to "Syncing..."
    try {
      const response = await fetch("http://localhost:5001/api/sync-drive", {
        method: "POST",
      });
      const result = await response.json();
      
      if (response.ok) {
        // Automatically triggers the useEffect above to fetch the new files!
        setRefreshTrigger(prev => prev + 1); 
        
        // 🔥 ADD THIS LINE: The success popup!
        alert("🚀 Drive Sync Complete! Refreshing your notes..."); 
        
      } else {
        alert("Sync failed: " + result.error);
      }
    } catch (error) {
      console.error("Error syncing:", error);
      alert("An error occurred while communicating with the server.");
    } finally {
      setIsSyncing(false); // Resets the button
    }
  };

  const formattedSem = semesterId ? semesterId.replace('-', ' ').toUpperCase() : '';

  return (
    <div className="pyq-notes-container">
      
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <span>🏠</span> 
        <Link to="/">Home</Link> <span className="divider">/</span>
        <Link to="/pyq">{formattedSem}</Link> <span className="divider">/</span>
        <span className="current-page">{subjectId} {selectedExam} Papers</span>
      </div>

      {/* Page Header */}
      <div className="page-header">
        <div className="header-text">
          <h1>Study Materials</h1>
          <p>Access your synced Google Drive past year questions for {subjectId} ({selectedExam}).</p>
        </div>
        <div className="header-actions">
          {/* NEW: The functional Sync Button */}
          <button 
            className="sync-btn" 
            onClick={handleSync} 
            disabled={isSyncing}
            style={{ opacity: isSyncing ? 0.7 : 1, cursor: isSyncing ? 'not-allowed' : 'pointer' }}
          >
            {isSyncing ? '⏳ Syncing...' : '☁️ Sync Drive'}
          </button>
        </div>
      </div>

      {/* File List */}
      {/* File List */}
      {loading ? (
        <p className="loading-text">Loading {selectedExam} papers...</p>
      ) : files.length > 0 ? (
        <div className="files-list">
          {files.map(file => (
            <div key={file.id} className="file-item" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              
              {/* 🌟 1. ICON MOVED HERE (Outside of file-info) */}
              <div className="file-icon" style={{ fontSize: '1.5rem', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                📕
              </div>

              {/* 🌟 2. TEXT REMAINS IN ITS OWN COLUMN */}
              <div className="file-info" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span className="file-name" title={file.name} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '600', color: '#1e293b' }}>
                  {file.name.replace(`${selectedExam} / `, '')}
                </span>
              </div>

              {/* 🌟 3. BUTTONS STAY ON THE RIGHT */}
              <div className="file-actions" style={{ display: 'flex', gap: '10px' }}>
                <a href={file.webViewLink} target="_blank" rel="noopener noreferrer" className="btn-view">
                  View
                </a>
                <a href={file.webContentLink || file.webViewLink} target="_blank" rel="noopener noreferrer" className="btn-download">
                  ↓
                </a>
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No {selectedExam} papers found for this subject yet.</p>
          <p className="empty-subtext">Make sure your Google Drive has a folder named "{selectedExam}" inside this subject's PYQ folder!</p>
        </div>
      )}
      </div>
  );
}

export default PYQNotes;