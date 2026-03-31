import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './syllabus.css';

function Syllabus() {
  const { programId, semesterId, subjectId } = useParams();
  const navigate = useNavigate();
  
  const [openUnitIndex, setOpenUnitIndex] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/syllabus/${programId}/${semesterId}`)
      .then(res => res.json())
      .then(data => {
        if (data.subjects && !data.error) {
          const currentSubject = data.subjects.find(sub => sub.id === subjectId);
          setSubjectData(currentSubject);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching syllabus:", err);
        setLoading(false);
      });
  }, [programId, semesterId, subjectId]);

  const toggleUnit = (index) => {
    setOpenUnitIndex(openUnitIndex === index ? null : index);
  };

  if (loading) return <div className="syllabus-page">Loading Syllabus...</div>;

  if (!subjectData) return (
    <div className="syllabus-page" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>Syllabus not found for {subjectId}</h2>
      <button className="btn-primary-gradient" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <div className="syllabus-page">
      

      <div className="syllabus-header">
        <h1>{subjectData.name}</h1>
        
        <div className="header-meta-row">
          <div className="meta-info">
            <span className="meta-box">{subjectData.id || subjectId}</span>
            <span className="meta-text">Credits: <strong>{subjectData.credits}</strong></span>
            <span className="meta-text">Teacher: <strong>{subjectData.teacher || "TBA"}</strong></span>
          </div>
          
          <button className="btn-back-semester" onClick={() => navigate(-1)}>
            ← Back to Semester
          </button>
        </div>
      </div>


      <div className="units-container">
        {subjectData.units && subjectData.units.length > 0 ? (
          subjectData.units.map((unit, index) => (
            <div key={index} className="unit-card">
              
              <div className="unit-header" onClick={() => toggleUnit(index)}>
                <div className="unit-title-group">
                  <span className="unit-number">Unit {unit.unitNumber || index + 1}</span>
                  <span className="unit-name">{unit.title}</span>
                </div>
                
                <div className="unit-meta">

                  <span className={`dropdown-icon ${openUnitIndex === index ? 'open' : ''}`}>
                    ▼
                  </span>
                </div>
              </div>

              {openUnitIndex === index && (
                <div className="unit-content">
                  <ul>
                    {unit.topics && unit.topics.map((topic, tIndex) => (
                      <li key={tIndex}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}
              
            </div>
          ))
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            No units uploaded for this subject yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default Syllabus;