import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
        const response = await fetch(`http://localhost:5001/api/syllabus/${programId}/${semesterId}/${subjectId}`);
        
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
      
      {/* Breadcrumb Navigation */}
      <div className="breadcrumb">
        <span onClick={() => navigate('/dashboard')} className="crumb-link">🏠 Home</span> 
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
        <div className="status-message loading">Loading syllabus details...</div>
      ) : error ? (
        <div className="status-message error">Error: {error}</div>
      ) : !subject ? (
        <div className="status-message empty">Subject details not found.</div>
      ) : (
        <div className="syllabus-detail-card">
          
          {/* Card Header (Matches your screenshot layout) */}
          {/* 🌟 UPGRADED HEADER: Fixes the blank space and aligns perfectly */}
          {/* 🌟 PERFECTED HEADER: Everything vertically centered on one row */}
          <div 
            className="detail-header-row"
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', /* 🌟 Forces everything to center vertically */
              flexWrap: 'wrap',     /* 🌟 Keeps it safe on smaller screens */
              gap: '20px',
              paddingBottom: '24px', 
              borderBottom: '1px solid #e2e8f0', 
              marginBottom: '24px' 
            }}
          >
            {/* Left Side: Name, Badge, Credits, Teacher */}
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', flex: 1 }}>
              
              <h1 style={{ fontSize: '1.75rem', color: '#1e293b', margin: '0', fontWeight: '700' }}>
                {subject?.name || "Loading Subject..."}
              </h1>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#64748b', fontSize: '0.9rem' }}>
                {/* ID Badge */}
                <span style={{ fontWeight: '600', color: '#4a6583', background: '#f0f4f8', padding: '5px 12px', borderRadius: '8px', letterSpacing: '0.5px' }}>
                  {subjectId}
                </span>
                
                {/* Meta Info with a clean divider */}
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>Credits: <strong style={{ color: '#475569' }}>{subject?.credits || '--'}</strong></span>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <span>Teacher: <strong style={{ color: '#475569' }}>{subject?.teacher || 'TBA'}</strong></span>
                </span>
              </div>

            </div>
            
            {/* Right Side: Back Button */}
            <div className="header-right">
              <button 
                className="back-btn" 
                onClick={() => navigate(`/syllabus/${programId}/${semesterId}`)}
                style={{ 
                  padding: '8px 16px', 
                  background: 'white', 
                  border: '1px solid #cbd5e1', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  fontWeight: '600', 
                  color: '#475569',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseOver={(e) => { e.target.style.background = '#f8fafc'; e.target.style.borderColor = '#94a3b8'; }}
                onMouseOut={(e) => { e.target.style.background = 'white'; e.target.style.borderColor = '#cbd5e1'; }}
              >
                ← Back to Semester
              </button>
            </div>
          </div>

          {/* Table Content */}
          <table className="units-table">
            <thead>
              <tr>
                <th className="unit-col">Unit</th>
                <th className="content-col">Content</th>
                <th className="hours-col">Hours</th>
              </tr>
            </thead>
            <tbody>
              {subject.units && subject.units.length > 0 ? (
                subject.units.map((unit, index) => (
                  <tr key={index}>
                    <td className="unit-col-data">
                      <strong>{unit.unitNumber}</strong>
                    </td>
                    <td className="content-col-data">
                      <div className="content-wrapper">
                        {/* Title goes on the left, topics on the right */}
                        <div className="content-title">{unit.title}</div>
                        <div className="content-desc">{unit.topics.join(', ')}</div>
                      </div>
                    </td>
                    <td className="hours-col-data">-</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="status-message empty">
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