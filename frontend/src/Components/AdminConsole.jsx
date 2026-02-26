import React, { useState, useEffect } from 'react';
import './subjects.css'; // Reusing your existing styles

function AdminConsole() {
  const [folders, setFolders] = useState([]);
  const [pathHistory, setPathHistory] = useState([{ id: '1bmI8_Bkn1airL4qznDJLWGc96wj76smp', name: 'NFSU Root' }]);
  
  // Upload Form State
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [programId, setProgramId] = useState('btech-mtech-cybersecurity');
  const [semesterId, setSemesterId] = useState('sem-1');
  const [subjectId, setSubjectId] = useState('CTBT-BSC-101');
  const [type, setType] = useState('Notes');
  const [status, setStatus] = useState('');

  const currentFolderId = pathHistory[pathHistory.length - 1].id;

  // Fetch folders whenever we navigate
  useEffect(() => {
    fetch(`http://localhost:5001/api/drive/folders?parentId=${currentFolderId}`)
      .then(res => res.json())
      .then(data => setFolders(data))
      .catch(err => console.error(err));
  }, [currentFolderId]);

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

    setStatus("Uploading to Drive and syncing to Firebase... ⏳");

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
      } else {
        setStatus("❌ Upload failed.");
      }
    } catch (error) {
      setStatus("❌ Server connection error.");
    }
  };

  return (
    <div className="home-dashboard">
      <div className="dashboard-left" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        <div className="welcome-banner" style={{ background: '#1e293b', color: 'white' }}>
          <h1>Admin Upload Console</h1>
          <p>Navigate to the correct Google Drive folder below, then upload your file.</p>
        </div>

        {/* 🌟 1. THE MINI DRIVE BROWSER */}
        <div className="subject-card" style={{ marginTop: '20px', padding: '20px', cursor: 'default' }}>
          <h3>1. Choose Drive Destination</h3>
          
          <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', marginBottom: '15px', fontWeight: 'bold' }}>
            Current Path: {pathHistory.map(p => p.name).join(' / ')}
          </div>

          {pathHistory.length > 1 && (
            <button onClick={handleBackClick} className="btn-primary-gradient" style={{ marginBottom: '15px', background: '#64748b' }}>
              ⬅ Go Back Up
            </button>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {folders.map(folder => (
              <div 
                key={folder.id} 
                onClick={() => handleFolderClick(folder.id, folder.name)}
                style={{ padding: '15px', background: '#e2e8f0', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
              >
                <span>📁</span> {folder.name}
              </div>
            ))}
            {folders.length === 0 && <p>No subfolders here.</p>}
          </div>
        </div>

        {/* 🌟 2. THE FIREBASE METADATA FORM */}
        <div className="subject-card" style={{ marginTop: '20px', padding: '20px', cursor: 'default' }}>
          <h3>2. Upload File</h3>
          
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <select value={semesterId} onChange={(e) => setSemesterId(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px' }}>
                <option value="sem-1">Semester 1</option>
                <option value="sem-2">Semester 2</option>
              </select>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px' }}>
                <option value="CTBT-BSC-101">CTBT-BSC-101 (Maths)</option>
                <option value="CTBT-PCC-201">CTBT-PCC-201 (C++)</option>
                <option value="CTBT-ESC-201">CTBT-ESC-201 (DLD)</option>
              </select>
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px' }}>
                <option value="Notes">Notes</option>
                <option value="PYQ">PYQ</option>
              </select>
            </div>

            <input 
              type="text" 
              placeholder="Display Name (e.g. Unit 1 Notes) - Leave blank to use original file name" 
              value={fileName} 
              onChange={(e) => setFileName(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}
            />

            <input 
              type="file" 
              accept=".pdf" 
              onChange={(e) => setFile(e.target.files[0])} 
              required 
              style={{ padding: '10px', border: '2px dashed #ccc', borderRadius: '6px' }}
            />

            <button type="submit" className="btn-primary-gradient" style={{ padding: '15px', fontSize: '1.1rem' }}>
              Upload to Selected Folder
            </button>

            {status && <div style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '10px' }}>{status}</div>}
          </form>
        </div>

      </div>
    </div>
  );
}

export default AdminConsole;