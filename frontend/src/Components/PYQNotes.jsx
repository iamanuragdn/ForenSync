import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Home, Loader, Cloud, Book } from 'lucide-react';
import LoadingState from './LoadingState.jsx';
import { motion } from 'framer-motion';
import './PYQNotes.css';

const EXAM_TABS = [
  { key: 'CA1', label: 'CA 1' },
  { key: 'CA2', label: 'CA 2 (Mid-Sem)' },
  { key: 'CA3', label: 'CA 3' },
  { key: 'CA4', label: 'CA 4 (End-Sem)' }
];

function normalizeExamKey(categoryName) {
  const normalized = (categoryName || '').toUpperCase().replace(/\s+/g, '');

  if (normalized === 'CA1') return 'CA1';
  if (normalized === 'CA2') return 'CA2';
  if (normalized === 'CA3') return 'CA3';
  if (normalized === 'CA4') return 'CA4';

  return null;
}

function deriveCategoryFromPath(displayName) {
  if (typeof displayName !== 'string' || !displayName.includes('/')) return null;

  const pathSegments = displayName
    .split('/')
    .map(segment => segment.trim())
    .filter(Boolean);

  if (pathSegments.length < 2) return null;
  return pathSegments[pathSegments.length - 2];
}

function groupFilesByExam(files) {
  const groups = { CA1: [], CA2: [], CA3: [], CA4: [], OTHER: [] };

  files.forEach(file => {
    const examKey = normalizeExamKey(file.category || deriveCategoryFromPath(file.name));
    groups[examKey || 'OTHER'].push(file);
  });

  return groups;
}

function PYQNotes() {
  const { programId, semesterId, subjectId } = useParams();
  const [searchParams] = useSearchParams();
  const initialTab = normalizeExamKey(searchParams.get('exam')) || 'CA1';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [grouped, setGrouped] = useState({ CA1: [], CA2: [], CA3: [], CA4: [], OTHER: [] });
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [subjectName, setSubjectName] = useState(subjectId);

  useEffect(() => {
    setLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/notes/${programId}/${semesterId}/${subjectId}?type=PYQ`)
      .then(res => res.json())
      .then(data => {
        const sortedFiles = (data.files || []).sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true })
        );
        const newGrouped = groupFilesByExam(sortedFiles);
        setGrouped(newGrouped);
        
        // Auto-select populated tab dynamically if no strict URL target was provided
        const urlExam = normalizeExamKey(searchParams.get('exam'));
        if (urlExam && newGrouped[urlExam] && newGrouped[urlExam].length > 0) {
            setActiveTab(urlExam);
        } else {
            const firstPopulated = EXAM_TABS.find(t => newGrouped[t.key] && newGrouped[t.key].length > 0);
            if (firstPopulated) setActiveTab(firstPopulated.key);
        }

        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch PYQs:", err);
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
          type: "PYQ" // Tells Firebase to look in the PYQ collection
        })
      });

      const result = await response.json();

      if (response.ok) {
        alert(`🚀 ${result.message}`);
        setRefreshTrigger(prev => prev + 1);
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
  const currentFiles = grouped[activeTab] || [];

  return (
    <div className="pyq-notes-container">


      <div className="breadcrumb">
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Home size={16} /></span>
        <Link to="/">Home</Link> <span className="divider">/</span>
        <Link to="/pyq">{formattedSem}</Link> <span className="divider">/</span>
        <span className="current-page">{subjectName} Papers</span>
      </div>


      <div className="page-header">
        <div className="header-text">
          <h1>{subjectName}</h1>
          <p>Study Materials • Past Year Questions</p>
        </div>
        <div className="header-actions">

          <button
            className="sync-btn"
            onClick={handleSync}
            disabled={isSyncing}
            style={{ opacity: isSyncing ? 0.7 : 1, cursor: isSyncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {isSyncing ? <><Loader size={16} /> Syncing...</> : <><Cloud size={16} /> Sync Drive</>}
          </button>
        </div>
      </div>

      <div className="pyq-tabs-bar">
        {EXAM_TABS.map(tab => (
          <button
            key={tab.key}
            className={`pyq-tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {!loading && grouped[tab.key]?.length > 0 && (
              <span className="pyq-tab-count">{grouped[tab.key].length}</span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState text="Loading past year questions..." />
      ) : currentFiles.length > 0 ? (
        <div className="files-list">
          {currentFiles.map((file, index) => (
            <motion.div
              key={file.id || index}
              className="file-item"
              style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
            >

              <div className="file-icon" style={{ fontSize: '1.5rem', background: 'var(--bg-hover)', padding: '10px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                <Book size={24} />
              </div>

              <div className="file-info" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span className="file-name" title={file.name} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '600', color: 'var(--text-primary)' }}>
                  {file.name}
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

            </motion.div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No PYQs uploaded for {EXAM_TABS.find(t => t.key === activeTab)?.label || activeTab} yet.</p>
          <p className="empty-subtext">Papers will appear here once they are synced from the drive.</p>
        </div>
      )}
    </div>
  );
}

export default PYQNotes;
