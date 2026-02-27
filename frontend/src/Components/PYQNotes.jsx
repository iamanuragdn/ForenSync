import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import './PYQNotes.css'; 

function PYQNotes() {
  const { programId, semesterId, subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const selectedExam = searchParams.get('exam') || 'CA1'; 
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const [subjectName, setSubjectName] = useState(subjectId);

  useEffect(() => {
    setLoading(true);
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

  // real subject name using the syllabus endpoint
  useEffect(() => {
    fetch(`http://localhost:5001/api/syllabus/${programId}/${semesterId}`)
      .then(res => res.json())
      .then(data => {
        if (data.subjects && !data.error) {
          const currentSubject = data.subjects.find(sub => sub.id === subjectId);
          if (currentSubject && currentSubject.name) {
            setSubjectName(currentSubject.name);
          }
        }
      })
      .catch(err => console.error("Error fetching subject name:", err));
  }, [programId, semesterId, subjectId]);


  const handleSync = async () => {
    setIsSyncing(true); 
    try {
      const response = await fetch("http://localhost:5001/api/sync-drive", {
        method: "POST",
      });
      const result = await response.json();
      
      if (response.ok) {
        setRefreshTrigger(prev => prev + 1); 
        
        alert("🚀 Drive Sync Complete! Refreshing your notes..."); 
        
      } else {
        alert("Sync failed: " + result.error);
      }
    } catch (error) {
      console.error("Error syncing:", error);
      alert("An error occurred while communicating with the server.");
    } finally {
      setIsSyncing(false);
    }
  };

  const formattedSem = semesterId ? semesterId.replace('-', ' ').toUpperCase() : '';

  return (
    <div className="pyq-notes-container">
      
      
      <div className="breadcrumb">
        <span>🏠</span> 
        <Link to="/">Home</Link> <span className="divider">/</span>
        <Link to="/pyq">{formattedSem}</Link> <span className="divider">/</span>
        <span className="current-page">{subjectName} {selectedExam} Papers</span>
      </div>

      
      <div className="page-header">
        <div className="header-text">
          <h1>{subjectName}</h1>
          <p>Study Materials • Past Year Questions ({selectedExam})</p>
        </div>
        <div className="header-actions">
          
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


      {loading ? (
        <p className="loading-text">Loading {selectedExam} papers...</p>
      ) : files.length > 0 ? (
        <div className="files-list">
          {files.map(file => (
            <div key={file.id} className="file-item" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              
              <div className="file-icon" style={{ fontSize: '1.5rem', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                📕
              </div>

              <div className="file-info" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span className="file-name" title={file.name} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '600', color: '#1e293b' }}>
                  {file.name.replace(`${selectedExam} / `, '')}
                </span>
              </div>

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