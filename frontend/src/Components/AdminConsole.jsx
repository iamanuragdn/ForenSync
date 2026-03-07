import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 🌟 Added for routing
import './AdminConsole.css';

function AdminConsole() {
  const navigate = useNavigate();

  // 🌟 Grab the user to check their clearance level
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("forensync_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [folders, setFolders] = useState([]);
  const [pathHistory, setPathHistory] = useState([{ id: '1bmI8_Bkn1airL4qznDJLWGc96wj76smp', name: 'NFSU' }]);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [programId, setProgramId] = useState('btech-mtech-cybersecurity');
  const [semesterId, setSemesterId] = useState('sem-1');
  const [subjectId, setSubjectId] = useState('CTBT-BSC-101');
  const [type, setType] = useState('Notes');
  const [status, setStatus] = useState('');
  const currentFolderId = pathHistory[pathHistory.length - 1].id;

  useEffect(() => {
    // Only fetch if the user is actually an admin!
    if (!user || user.role !== 'Admin') return; 

    fetch(`http://localhost:5001/api/drive/folders?parentId=${currentFolderId}`)
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

    const formData = new FormData();
    formData.append('targetDriveFolderId', currentFolderId);
    formData.append('programId', programId);
    formData.append('semesterId', semesterId);
    formData.append('subjectId', subjectId);
    formData.append('type', type);
    formData.append('fileName', fileName || file.name);
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5001/api/admin/upload', {
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

  // 🌟 SECURITY GUARD: Lock out regular students!
  if (!user || user.role !== 'Admin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.5rem', color: '#b91c1c', marginBottom: '10px' }}>🛑 Access Denied</h2>
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
                <span className="folder-icon">📁</span> 
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
            
            <div className="form-row">
              <div className="input-group">
                <label>Semester</label>
                <select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} className="custom-select">
                  <option value="sem-1">Semester 1</option>
                  <option value="sem-2">Semester 2</option>
                  <option value="sem-3">Semester 3</option>
                </select>
              </div>

              <div className="input-group">
                <label>Subject ID</label>
                <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="custom-select">
                  <option value="CTBT-BSC-101">CTBT-BSC-101 (Maths)</option>
                  <option value="CTBT-PCC-201">CTBT-PCC-201 (C++)</option>
                  <option value="CTBT-ESC-201">CTBT-ESC-201 (DLD)</option>
                  <option value="CTBT-EMC-201">CTBT-EMC-201 (Forensics)</option>
                </select>
              </div>

              <div className="input-group">
                <label>Material Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="custom-select">
                  <option value="Notes">Notes</option>
                  <option value="PYQ">PYQ</option>
                </select>
              </div>
            </div>

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

            <button type="submit" className="btn-upload-submit">
              🚀 Upload to ForenSync
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