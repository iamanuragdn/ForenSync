import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';
import LoadingState from './LoadingState.jsx';
import { motion } from 'framer-motion';
import './SyllabusDetail.css';

function SyllabusDetail() {
  const { programId, semesterId, subjectId } = useParams();
  const navigate = useNavigate();
  
  const [subject, setSubject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/syllabus/${programId}/${semesterId}/${subjectId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch subject details from the server.");
        }
        
        const data = await response.json();
        setSubject(data);
      } catch (err) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjectDetails();
  }, [programId, semesterId, subjectId]);

  const formatSemester = (str) => {
    if (!str) return '';
    return str.replace('sem-', 'Semester ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="page-container">
      <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span onClick={() => navigate('/dashboard')} className="crumb-link" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Home size={16} /> Home
        </span> 
        <span className="separator">/</span>
        <span onClick={() => navigate('/syllabus')} className="crumb-link">Programs</span>
        <span className="separator">/</span>
        <span onClick={() => navigate(`/syllabus/${programId}`)} className="crumb-link">Semesters</span>
        <span className="separator">/</span>
        <span onClick={() => navigate(`/syllabus/${programId}/${semesterId}`)} className="crumb-link">
          {formatSemester(semesterId)}
        </span>
        <span className="separator">/</span>
        <span className="current-page">{subject?.name || subjectId}</span>
      </div>

      {isLoading ? (
        <LoadingState text="Loading syllabus details..." />
      ) : error ? (
        <div className="status-message error">Error: {error}</div>
      ) : !subject ? (
        <div className="status-message empty">Subject details not found.</div>
      ) : (
        <div className="syllabus-detail-card">
          
          <div className="detail-header-row">

            <div className="header-left">
              
              <h1 className="subject-title">
                {subject?.name || "Loading Subject..."}
              </h1>
              
              <div className="subject-meta">
                <span className="meta-code">{subjectId}</span>
                
                <span className="meta-details">
                  <span>Credits: <strong>{subject?.credits || '--'}</strong></span>
                  <span className="meta-divider">|</span>
                  <span>Teacher: <strong>{subject?.teacher || 'TBA'}</strong></span>
                </span>
              </div>

            </div>

            <div className="header-right">
              <button className="back-btn" onClick={() => navigate(`/syllabus/${programId}/${semesterId}`)}>
                ←
              </button>
            </div>
            
          </div>

          <table className="units-table">
            <thead>
              <tr>
                <th className="unit-col">Unit</th>
                <th className="content-col">Content</th>
              </tr>
            </thead>
            <tbody>
              {subject.units && subject.units.length > 0 ? (
                subject.units.map((unit, index) => (
                  <motion.tr 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
                  >
                    <td className="unit-col-data">
                      <strong>{unit.unitNumber}</strong>
                    </td>
                    <td className="content-col-data">
                      <div className="content-wrapper">
                        <div className="content-title">{unit.title}</div>
                        <div className="content-desc">{unit.topics.join(', ')}</div>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="status-message empty">
                    No units uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

        </div>
      )}
    </div>
  );
}

export default SyllabusDetail;