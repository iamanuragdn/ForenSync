import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { ShieldAlert, Folder, Rocket, Loader, Database, UploadCloud, FileText, CheckCircle, HardDrive } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { uploadWithCompression } from '../utils/fileCompression';
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
  const [subjectDictionary, setSubjectDictionary] = useState({});

  // UI State
  const [activeTab, setActiveTab] = useState('drive');

  // Ingestion State
  const [ingestFile, setIngestFile] = useState(null);
  const [ingestDocType, setIngestDocType] = useState('both');
  const [ingestProgram, setIngestProgram] = useState('btech-mtech-cybersecurity');
  const [ingestSemester, setIngestSemester] = useState('year-1');
  const [ingesting, setIngesting] = useState(false);
  const [ingestMessage, setIngestMessage] = useState(null);

  // Edit & Approve Workflow
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewViewMode, setPreviewViewMode] = useState('human'); // 'human' or 'json'
  const [collisionSemesters, setCollisionSemesters] = useState([]);
  const [previewText, setPreviewText] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/db/subjects/dictionary`)
      .then(res => res.json())
      .then(data => setSubjectDictionary(data))
      .catch(err => console.error("Failed to load subject dictionary:", err));
  }, []);

  const sanitizeSubjectCode = (text) => {
    if (typeof text !== 'string') return '';
    const homoglyphs = {
        'А': 'A', 'В': 'B', 'С': 'C', 'Е': 'E', 'Н': 'H',
        'К': 'K', 'М': 'M', 'О': 'O', 'Р': 'P', 'Т': 'T',
        'Х': 'X', 'У': 'Y', 'а': 'a', 'в': 'b', 'с': 'c',
        'е': 'e', 'н': 'h', 'к': 'k', 'м': 'm', 'о': 'o',
        'р': 'p', 'т': 't', 'х': 'x', 'у': 'y'
    };
    // Replace homoglyphs
    let clean = Array.from(text).map(char => homoglyphs[char] || char).join('');
    // Replace special dashes with standard hyphen
    clean = clean.replace(/[–—_]/g, '-');
    // Remove all whitespace and invalid characters, then uppercase
    return clean.replace(/[^A-Za-z0-9\-]/g, '').toUpperCase();
  };
  
  // Advanced RBAC State
  const [uploadDestination, setUploadDestination] = useState('Official Notes');
  const isStreamlinedUser = user?.adminType === 'ActiveContributor' || user?.adminType === 'CR';

  // Force destination for streamlined users
  useEffect(() => {
    if (isStreamlinedUser) {
      setUploadDestination('Community Notes');
    }
  }, [isStreamlinedUser]);

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
    // Only fetch if the user is actually an admin or superadmin!
    if (!user || (user.role !== 'Admin' && user.role !== 'SuperAdmin')) return; 

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

    setStatus("⏳ Compressing and Preparing File...");
    let compressedFile = file;
    try {
      compressedFile = await uploadWithCompression(file);
    } catch (err) {
      if (err.message === 'FILE_TOO_LARGE') {
        setStatus("❌ File exceeds 10MB limit.");
        return;
      }
      console.error("Compression Error:", err);
      setStatus("❌ Compression failed. Please try a different file.");
      return;
    }

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
    formData.append('pathArray', JSON.stringify(pathNames));
    formData.append('uid', user.uid);
    formData.append('userName', user.name || 'Unknown');
    formData.append('uploadDestination', uploadDestination);
    formData.append('file', compressedFile);

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

  const handleIngestFileChange = (e) => {
    if (e.target.files[0]) {
      setIngestFile(e.target.files[0]);
    }
  };

  const handleIngest = async () => {
    if (!ingestFile) return alert('Please select a file first.');
    setIngesting(true);
    setIngestMessage(null);
    
    const formData = new FormData();
    formData.append('document', ingestFile);
    formData.append('documentType', ingestDocType);
    formData.append('programId', ingestProgram);
    formData.append('semesterId', ingestSemester);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/extract-document`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setPreviewText(JSON.stringify(data.data, null, 2));
        setCollisionSemesters(data.existingSemesters || []);
        setPreviewViewMode('human');
        setIsPreviewMode(true);
      } else {
        setIngestMessage({ type: 'error', text: data.error || 'Failed to extract.' });
      }
    } catch (error) {
      console.error(error);
      setIngestMessage({ type: 'error', text: 'Network error during extraction.' });
    } finally {
      setIngesting(false);
    }
  };

  const handleSaveDocument = async () => {
    setIsSaving(true);
    setIngestMessage(null);

    let finalData;
    try {
      finalData = JSON.parse(previewText);
    } catch (err) {
      setIngestMessage({ type: 'error', text: 'Invalid JSON format. Please check your syntax.' });
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/save-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: ingestProgram,
          semesterId: ingestSemester,
          extractedData: finalData
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        setIngestMessage({ type: 'success', text: data.message || 'Data approved and securely bound to Firestore!' });
        setIsPreviewMode(false);
        setIngestFile(null);
        if (document.getElementById('ingest-file-upload')) {
          document.getElementById('ingest-file-upload').value = '';
        }
      } else {
        setIngestMessage({ type: 'error', text: data.error || 'Failed to save.' });
      }
    } catch (error) {
      console.error(error);
      setIngestMessage({ type: 'error', text: 'Network error while saving data.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm("Are you sure you want to discard this extraction?")) {
      setIsPreviewMode(false);
      setPreviewText('');
      setIngestMessage(null);
      setIngestFile(null);
      if (document.getElementById('ingest-file-upload')) {
        document.getElementById('ingest-file-upload').value = '';
      }
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

  const isAuthorized = user && (
    user.role === 'SuperAdmin' || 
    (user.role === 'Admin' && user.isVerifiedAdmin)
  );

  if (!isAuthorized) {
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
        <div className="header-text" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Admin Console</h1>
            <p>Manage standard Drive documents or utilize Gemini AI to automate Syllabus and Exam ingestion.</p>
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button className={`admin-tab ${activeTab === 'drive' ? 'active' : ''}`} onClick={() => setActiveTab('drive')}>
          <HardDrive size={18} /> Notes Drive Sync
        </button>
        <button className={`admin-tab ${activeTab === 'ingestion' ? 'active' : ''}`} onClick={() => setActiveTab('ingestion')}>
          <Database size={18} /> AI Data Ingestion
        </button>
      </div>

      {activeTab === 'drive' ? (
      <div className="admin-content-wrapper">

        {!isStreamlinedUser && (
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
        )}
        
        <div className="admin-card">
          <div className="card-header">
            <h3>1. Choose Drive Destination</h3>
            
            <div className="path-display">
              <span className="path-label">Current Path:</span>
              <span className="path-text">{pathHistory.map(p => subjectDictionary[sanitizeSubjectCode(p.name)] || p.name).join(' / ')}</span>
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
                <span className="folder-name">{subjectDictionary[sanitizeSubjectCode(folder.name)] || folder.name}</span>
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
            
            <div className="input-group full-width" style={{ marginBottom: '20px' }}>
              <label>Upload Destination</label>
              {isStreamlinedUser ? (
                <div style={{ padding: '12px', background: 'var(--bg-hover)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔒 Locked to Community Notes
                </div>
              ) : (
                <select 
                  value={uploadDestination} 
                  onChange={(e) => setUploadDestination(e.target.value)} 
                  className="custom-input"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                >
                  <option value="Official Notes">Official Subject Notes (Teacher/Admin)</option>
                  <option value="Community Notes">Community Notes (Contributors)</option>
                </select>
              )}
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
      ) : (
        <div className="ingestion-container">
          <div className="ingestion-header">
            <h2><FileText size={24} color="#3b82f6" /> Document Ingestion Pipeline</h2>
            <p>Upload official university Syllabus or Exam Date PDFs. The Gemini AI engine will perfectly extract and securely bind them to the relational database in real-time.</p>
          </div>

          {isPreviewMode ? (
            <div className="preview-container admin-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', margin: 0 }}>
                  <CheckCircle size={22} /> Review & Edit Extracted Data
                </h3>
                <button 
                  onClick={() => setPreviewViewMode(previewViewMode === 'human' ? 'json' : 'human')}
                  className="btn-setting-minimal"
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}
                >
                  <FileText size={16} /> {previewViewMode === 'human' ? "Edit Raw JSON" : "Show Human View"}
                </button>
              </div>

              {collisionSemesters && collisionSemesters.length > 0 && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', margin: '0 0 5px 0' }}>
                    <ShieldAlert size={18} /> Overwrite Warning
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Syllabus or Exam data already exists for <strong>{collisionSemesters.join(', ')}</strong>. Saving will merge and update the existing records, keeping any manual edits.
                  </p>
                </div>
              )}
              
              {previewViewMode === 'human' ? (
                <div className="human-readable-preview" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '15px', fontSize: '0.95rem' }}>
                    Gemini AI has parsed the document into the following structured data. Click "Edit Raw JSON" in the top right to make corrections.
                  </p>
                  
                  {(() => {
                    try {
                      const data = JSON.parse(previewText);
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          {data.syllabus && Object.keys(data.syllabus).length > 0 && (
                            <div>
                              <h4 style={{ color: '#3b82f6', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '15px' }}>Syllabus Subjects</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                                {Object.values(data.syllabus).map((subj, idx) => (
                                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <strong style={{ color: '#e2e8f0', display: 'block', fontSize: '1.05rem', marginBottom: '5px' }}>{subj.name || 'Unknown Subject'}</strong>
                                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px' }}>
                                      <span>Semester:</span> <strong style={{ color: '#f59e0b' }}>{subj.semester || 'N/A'}</strong>
                                      <span>Credits:</span> <span style={{ color: '#e2e8f0' }}>{subj.credits || 'N/A'}</span>
                                      <span>Teacher:</span> <span style={{ color: '#e2e8f0' }}>{subj.teacherName || 'TBA'}</span>
                                      <span>Type:</span> <span style={{ color: '#e2e8f0' }}>{subj.type || 'N/A'}</span>
                                      <span>Units:</span> <span style={{ color: '#e2e8f0' }}>{subj.units ? subj.units.length : 0} found</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {data.exams && Object.keys(data.exams).length > 0 && (
                            <div>
                              <h4 style={{ color: '#10b981', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '15px' }}>Exam Schedules</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
                                {Object.values(data.exams).map((exam, idx) => (
                                  <div key={idx} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <strong style={{ color: '#e2e8f0', display: 'block', fontSize: '1.05rem', marginBottom: '5px' }}>{exam.subjectName || 'Unknown Exam'}</strong>
                                    <div style={{ color: '#94a3b8', fontSize: '0.85rem', display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px' }}>
                                      <span>Semester:</span> <strong style={{ color: '#f59e0b' }}>{exam.semester || 'N/A'}</strong>
                                      <span>Date:</span> <span style={{ color: '#e2e8f0' }}>{exam.date || 'TBA'}</span>
                                      <span>Time:</span> <span style={{ color: '#e2e8f0' }}>{exam.time || 'TBA'}</span>
                                      <span>Type:</span> <span style={{ color: '#e2e8f0' }}>{exam.type || 'N/A'}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    } catch (e) {
                      return <div style={{ color: '#ef4444' }}>Invalid JSON preview. Please switch to "Edit Raw JSON" to fix the syntax.</div>;
                    }
                  })()}
                </div>
              ) : (
                <>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '0.95rem' }}>
                    You can freely edit the text, dates, or teacher names in the JSON structure below before granting final approval. Make sure the JSON remains valid.
                  </p>
                  <textarea 
                    className="json-editor" 
                    value={previewText} 
                    onChange={(e) => setPreviewText(e.target.value)}
                    spellCheck="false"
                  ></textarea>
                </>
              )}

              <div className="preview-actions" style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                <button 
                  className="btn-upload-submit" 
                  style={{ flex: 2, background: '#10b981' }} 
                  onClick={handleSaveDocument}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader size={18} className="spin" /> : "Approve & Save to Database"}
                </button>
                <button 
                  className="btn-upload-submit" 
                  style={{ flex: 1, background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }} 
                  onClick={handleDiscard}
                  disabled={isSaving}
                >
                  Discard
                </button>
              </div>

              {ingestMessage && (
                <div className={`ingest-message ${ingestMessage.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: '15px' }}>
                  {ingestMessage.type === 'success' ? <CheckCircle size={20} /> : <ShieldAlert size={20} />}
                  {ingestMessage.text}
                </div>
              )}
            </div>
          ) : (
            <div className="ingestion-grid">
              <div className="ingest-card">
                <h3>1. Target Destination</h3>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>TARGET PROGRAM</label>
                  <select className="custom-select" value={ingestProgram} onChange={(e) => setIngestProgram(e.target.value)} style={{ marginTop: '8px' }}>
                    <option value="btech-mtech-cybersecurity">B.Tech-M.Tech Cybersecurity</option>
                    <option value="bsc-msc-forensic">B.Sc-M.Sc Forensic Science</option>
                  </select>
                </div>
                <div className="form-group" style={{ marginTop: '15px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>TARGET YEAR / SEMESTER</label>
                  <select className="custom-select" value={ingestSemester} onChange={(e) => setIngestSemester(e.target.value)} style={{ marginTop: '8px' }}>
                    <option value="year-1">Year 1 (Semesters 1 & 2)</option>
                    <option value="year-2">Year 2 (Semesters 3 & 4)</option>
                    <option value="year-3">Year 3 (Semesters 5 & 6)</option>
                    <option value="year-4">Year 4 (Semesters 7 & 8)</option>
                    <option value="year-5">Year 5 (Semesters 9 & 10)</option>
                  </select>
                </div>
              </div>

              <div className="ingest-card">
                <h3>2. Document Context</h3>
                <div className="form-group">
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-secondary)' }}>WHAT DATA DOES THIS DOCUMENT CONTAIN?</label>
                  <select className="custom-select" value={ingestDocType} onChange={(e) => setIngestDocType(e.target.value)} style={{ marginTop: '8px' }}>
                    <option value="both">Both (Syllabus & Exams)</option>
                    <option value="syllabus">Syllabus Details Only</option>
                    <option value="exams">Exam Schedule Only</option>
                  </select>
                </div>
              </div>

              <div className="ingest-card full-width">
                <h3>3. Neural Extraction Upload</h3>
                <div className="upload-zone">
                  <input type="file" id="ingest-file-upload" accept=".pdf,image/*" onChange={handleIngestFileChange} />
                  <label htmlFor="ingest-file-upload" className="upload-label">
                    <UploadCloud size={40} color="#94a3b8" />
                    <span>{ingestFile ? ingestFile.name : "Drag & Drop or Click to Browse PDF/Image"}</span>
                  </label>
                </div>
                
                <button 
                  className="ingest-btn" 
                  disabled={ingesting || !ingestFile} 
                  onClick={handleIngest}
                >
                  {ingesting ? <><Loader size={18} className="spin" /> Processing via Gemini AI...</> : "Start AI Extraction"}
                </button>

                {ingestMessage && (
                  <div className={`ingest-message ${ingestMessage.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: '15px' }}>
                    {ingestMessage.type === 'success' ? <CheckCircle size={20} /> : <ShieldAlert size={20} />}
                    {ingestMessage.text}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminConsole;