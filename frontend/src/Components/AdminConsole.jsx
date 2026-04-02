import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { ShieldAlert, Folder, Rocket, Loader } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminConsole.css';

function AdminConsole() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [isAdminVerifying, setIsAdminVerifying] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      const saved = localStorage.getItem("forensync_user");
      if (!saved) {
        navigate('/login');
        return;
      }
      
      try {
        const cachedUser = JSON.parse(saved);
        if (!cachedUser.uid) throw new Error("Invalid cache");
        
        const docRef = doc(db, 'users', cachedUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setUser(docSnap.data());
        }
      } catch (err) {
        console.error("Firebase admin check failed:", err);
      } finally {
        setIsAdminVerifying(false);
      }
    };
    verifyAdmin();
  }, [navigate]);

  const [folders, setFolders] = useState([]);
  const [pathHistory, setPathHistory] = useState([{ id: '1bmI8_Bkn1airL4qznDJLWGc96wj76smp', name: 'NFSU' }]);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [status, setStatus] = useState('');
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [syncReport, setSyncReport] = useState(null);
  const currentFolderId = pathHistory[pathHistory.length - 1].id;

  const handleGlobalSync = async () => {
    if (!window.confirm("Are you sure you want to run a global deep sync? This may take several minutes.")) return;
    setIsGlobalSyncing(true);
    setSyncReport(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/sync-global`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setSyncReport({
          added: data.addedFiles || [],
          removed: data.removedFiles || []
        });
      } else {
        alert(`Global Sync Failed: ${data.error || 'Server Error'}`);
      }
    } catch (err) {
      alert("Error connecting to server for Global Sync.");
    } finally {
      setIsGlobalSyncing(false);
    }
  };

  useEffect(() => {
    // Only fetch if the user is actually an admin!
    if (!user || user.role !== 'Admin') return; 

    fetch(`${import.meta.env.VITE_API_URL}/drive/folders?parentId=${currentFolderId}`)
      .then(res => res.json())
      .then(data => setFolders(data))
      .catch(err => console.error(err));
  }, [currentFolderId, user]);

  const handleFolderClick = (folderId, folderName) => {
    setPathHistory([...pathHistory, { id: folderId, name: folderName }]);
  };

  const handleBackClick = () => {
    if (pathHistory.length > 1) {
      setPathHistory(pathHistory.slice(0, -1));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setStatus("❌ Please select a file.");

    setStatus("⏳ Uploading to Drive and syncing to Firebase...");

    // Auto-extract metadata from current folder path
    const pathNames = pathHistory.map(p => p.name);
    const inferredProgramId = pathNames[1] || 'btech-mtech-cybersecurity';
    const inferredSemester = pathNames.find(n => n.toLowerCase().includes('sem')) || 'sem-1';
    const inferredType = pathNames.find(n => n.toLowerCase() === 'notes' || n.toLowerCase() === 'pyq') || 'Notes';
    const inferredSubject = pathNames.find(n => n.includes('-') && !n.toLowerCase().includes('sem') && n !== inferredProgramId) || 'Global';

    const formData = new FormData();
    formData.append('targetDriveFolderId', currentFolderId);
    formData.append('programId', inferredProgramId);
    formData.append('semesterId', inferredSemester);
    formData.append('subjectId', inferredSubject);
    formData.append('type', inferredType);
    formData.append('fileName', fileName || file.name);
    formData.append('file', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus("✅ Success! File uploaded and synced.");
        setFile(null);
        setFileName('');
        document.getElementById('file-upload').value = '';
      } else {
        setStatus("❌ Upload failed. Check server logs.");
      }
    } catch (error) {
      setStatus("❌ Server connection error.");
    }
  };

  if (isAdminVerifying) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center' }}>
        <Loader size={40} color="var(--accent-blue)" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '15px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>Verifying Admin Security Clearance...</p>
      </div>
    );
  }

  if (!user || user.role !== 'Admin' || !user.isVerifiedAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', color: '#b91c1c', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <ShieldAlert size={40} /> Access Denied
        </h2>
        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '400px', marginBottom: '25px', lineHeight: '1.5' }}>
          You do not have the required clearance to access the ForenSync Admin Console. This area is strictly for faculty and verified administrators.
        </p>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ padding: '12px 24px', background: '#4a6583', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 'bold' }}
        >
          ← Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      
      <div className="page-header">
        <div className="header-text">
          <h1>Admin Console</h1>
          <p>Navigate to the correct Google Drive folder, then upload your file metadata to Firestore.</p>
        </div>
      </div>

      <div className="admin-content-wrapper">

        <div className="admin-card global-sync-card">
          <div className="card-header">
            <h3>🚀 Run Global Sync</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '5px' }}>
              Deep scan the entire Google Drive structure to add new files and remove dead links across all programs.
            </p>
          </div>
          <button 
            className="btn-upload-submit" 
            style={{ 
              background: isGlobalSyncing ? '#64748b' : '#3b82f6', 
              marginTop: '15px',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px',
              opacity: isGlobalSyncing ? 0.7 : 1
            }}
            onClick={handleGlobalSync}
            disabled={isGlobalSyncing}
          >
            {isGlobalSyncing ? (
              <>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> 
                Scanning entire Google Drive... This may take a minute.
              </>
            ) : (
              <>
                <Rocket size={18} /> 
                Run Global Sync
              </>
            )}
          </button>
          
          {syncReport && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>📊 Sync Report</h4>
              {syncReport.added.length === 0 && syncReport.removed.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>✅ No changes needed. Everything is up to date.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontSize: '0.9rem' }}>
                  {syncReport.added.length > 0 && (
                    <div>
                      <h5 style={{ color: '#10b981', margin: '0 0 5px 0' }}>➕ Added Files ({syncReport.added.length})</h5>
                      <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', margin: 0, maxHeight: '150px', overflowY: 'auto' }}>
                        {syncReport.added.map((name, i) => <li key={i} style={{ padding: '2px 0' }}>{name}</li>)}
                      </ul>
                    </div>
                  )}
                  {syncReport.removed.length > 0 && (
                    <div>
                      <h5 style={{ color: '#ef4444', margin: '0 0 5px 0' }}>➖ Removed Dead Links ({syncReport.removed.length})</h5>
                      <ul style={{ color: 'var(--text-secondary)', paddingLeft: '20px', margin: 0, maxHeight: '150px', overflowY: 'auto' }}>
                        {syncReport.removed.map((name, i) => <li key={i} style={{ padding: '2px 0' }}>{name}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="admin-card">
          <div className="card-header">
            <h3>1. Choose Drive Destination</h3>
            
            <div className="path-display">
              <span className="path-label">Current Path:</span>
              <span className="path-text">{pathHistory.map(p => p.name).join(' / ')}</span>
            </div>
          </div>

          {pathHistory.length > 1 && (
            <button onClick={handleBackClick} className="btn-back-up">
              ← Go Back Up
            </button>
          )}

          <div className="folder-grid">
            {folders.map(folder => (
              <div 
                key={folder.id} 
                onClick={() => handleFolderClick(folder.id, folder.name)}
                className="folder-item"
              >
                <span className="folder-icon"><Folder size={20} /></span> 
                <span className="folder-name">{folder.name}</span>
              </div>
            ))}
            {folders.length === 0 && (
              <div className="empty-folder-msg">No subfolders here. You can upload files to this directory.</div>
            )}
          </div>
        </div>

        <div className="admin-card">
          <h3>2. Upload File Metadata</h3>
          
          <form onSubmit={handleUpload} className="admin-upload-form">
            
            <div className="input-group full-width">
              <label>Custom Display Name (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. Unit 1 Complete Notes (Leave blank to use original file name)" 
                value={fileName} 
                onChange={(e) => setFileName(e.target.value)}
                className="custom-input"
              />
            </div>

            <div className="file-drop-zone">
              <input 
                id="file-upload"
                type="file" 
                accept=".pdf" 
                onChange={(e) => setFile(e.target.files[0])} 
                required 
                className="file-input"
              />
            </div>

            <button type="submit" className="btn-upload-submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Rocket size={18} /> Upload to ForenSync
            </button>

            {status && (
              <div className={`status-banner ${status.includes('❌') ? 'error' : status.includes('✅') ? 'success' : 'loading'}`}>
                {status}
              </div>
            )}
            
          </form>
        </div>

      </div>
    </div>
  );
}

export default AdminConsole;