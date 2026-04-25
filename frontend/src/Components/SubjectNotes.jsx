import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Cloud, Loader, FileText, Book, Presentation, File, Users, Download, ExternalLink } from 'lucide-react';
import LoadingState from './LoadingState.jsx';
import { motion } from 'framer-motion';
import './SubjectNotes.css';

function SubjectNotes() {
  const { programId, semesterId, subjectId } = useParams();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('list');
  const [subjectName, setSubjectName] = useState(subjectId);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [officialNotes, setOfficialNotes] = useState([]);
  const [contributorNotes, setContributorNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const handleSync = async () => {
    setIsSyncing(true);
    
    try {

        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/sync`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                programId: programId,
                semesterId: semesterId,
                subjectId: subjectId,
                type: "Notes" // Tells Firebase to look in the Notes collection
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Sync complete! Added: ' + data.addedCount + ', Removed: ' + data.removedCount);
            setRefreshTrigger(prev => prev + 1); 
        } else {
            alert(`❌ Sync failed: ${data.error}`);
        }
    } catch (err) {
        console.error(err);
        alert("❌ Error connecting to server.");
    } finally {
        setIsSyncing(false);
    }
  };

  const formatSemester = (id) => id.replace('-', ' ').toUpperCase();

  useEffect(() => {
    setLoading(true); 

    fetch(`${import.meta.env.VITE_API_URL}/notes/${programId}/${semesterId}/${subjectId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          const allFiles = data.files || [];
          
          const colors = [
            "linear-gradient(135deg, #FF6B6B, #FF8E53)",
            "linear-gradient(135deg, #4facfe, #00f2fe)",
            "linear-gradient(135deg, #43e97b, #38f9d7)",
            "linear-gradient(135deg, #fa709a, #fee140)",
            "linear-gradient(135deg, #a18cd1, #fbc2eb)"
          ];

          // Create a bulletproof check for contributor files
          const isContributor = (file) => 
            file.source === 'contributor' || 
            file.category === 'Contributors' || 
            file.name.includes('Contributors /');

          // Filter Official (If it is NOT a contributor)
          const sortedOfficial = allFiles
            .filter(file => !isContributor(file))
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

          // Filter Contributors (If it IS a contributor)
          const sortedContributors = allFiles
            .filter(file => isContributor(file))
            .map((file, index) => {
               const name = file.contributorName || "Unknown";
               // Clean up the messy filename just for the UI display
               const cleanTitle = file.name.replace(/^Contributors\s*\/\s*/i, '');
               return {
                  ...file,
                  contributor: name,
                  avatar: name.charAt(0).toUpperCase(),
                  color: colors[index % colors.length],
                  title: cleanTitle
               };
            })
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

          setOfficialNotes(sortedOfficial);
          setContributorNotes(sortedContributors);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch notes:", err);
        setError("Failed to connect to the backend server.");
        setOfficialNotes([]);
        setContributorNotes([]);
        setLoading(false);
      });
      
  }, [programId, semesterId, subjectId, refreshTrigger]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/syllabus/${programId}/${semesterId}`)
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

  return (
    <div className="notes-dashboard">
      
      
      <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span onClick={() => navigate('/')} className="crumb-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Home size={16} /> Home
        </span>
        <span className="separator">/</span> 
        <span>{formatSemester(semesterId)}</span> 
        <span className="separator">/</span> 
        <span className="current-page">{subjectName} Notes</span>
      </div>

      <div className="notes-header">
        <div className="header-text">
          <h1>{subjectName}</h1>
          <p className="subtitle">Study Materials • Synced Notes</p>
        </div>
        
        <div className="header-actions">

            <div className="community-notes-wrapper">
              <div className="community-notes-trigger">
                <div className="trigger-icon-container pulse-icon">
                  <FileText size={18} />
                  <div className="community-badge-icon">
                    <Users size={9} strokeWidth={3} />
                  </div>
                </div>
                <span className="trigger-text">Community Notes</span>
              </div>
              
              <div className="community-notes-dropdown">
                <div className="dropdown-header">
                  <h4>Contributor Notes</h4>
                  <span className="cn-badge">{contributorNotes.length} New</span>
                </div>
                <div className="dropdown-list">
                  {contributorNotes.length === 0 ? (
                    <div className="empty-dropdown" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      No community notes uploaded yet.
                    </div>
                  ) : (
                    contributorNotes.map((note) => (
                      <div key={note.id} className="dropdown-row">
                        <div className="contributor-avatar" style={{ background: note.color }}>
                           {note.avatar}
                        </div>
                        <div className="note-details">
                          <span className="contributor-name">{note.contributor}</span>
                          <span className="note-title">{note.title}</span>
                        </div>
                        <div className="note-row-actions">
                          <a href={note.webViewLink} target="_blank" rel="noreferrer" title="View"><ExternalLink size={14}/></a>
                          <a href={note.webContentLink} download title="Download"><Download size={14}/></a>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          <div className="view-toggle">

          <button 
            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`} 
            onClick={() => setViewMode('list')}
            title="List View"
          >

            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>


          <button 
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} 
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
        </div>

          <button 
            className="btn-primary-gradient" 
            onClick={handleSync}
            disabled={isSyncing}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isSyncing ? 0.7 : 1, cursor: isSyncing ? 'not-allowed' : 'pointer' }}
          >
              {isSyncing ? <><Loader size={16} /> Syncing...</> : <><Cloud size={16} /> Sync Drive</>}
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState text="Loading your notes from Google Drive..." />
      ) : error ? (
        <div className="status-message error">{error}</div>
      ) : (
        <div className={`files-container ${viewMode}-view`}>
          {officialNotes.length === 0 ? (
            <div className="empty-state">No official notes found for this subject yet.</div>
          ) : (
            officialNotes.map((file, index) => (
              <motion.div 
                  className="file-card" 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
              >
                <div className="file-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {file.name.toLowerCase().includes('.pdf') ? (
                    <FileText size={24} color="var(--accent-blue)" />
                  ) : file.name.toLowerCase().includes('.ppt') || file.name.toLowerCase().includes('.pptx') ? (
                    <Presentation size={24} color="var(--accent-blue)" />
                  ) : (
                    <File size={24} color="var(--accent-blue)" />
                  )}
                </div>
                
                <div className="file-info">
                  <h3>{file.name}</h3>
                </div>
                
                <div className="file-actions">
                  <a href={file.webViewLink || "#"} target="_blank" rel="noreferrer" className="btn-view">
                    View
                  </a>
                  <a href={file.webContentLink || "#"} download className="btn-download">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>
                  </a>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default SubjectNotes;