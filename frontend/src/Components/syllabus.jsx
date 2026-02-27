import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Syllabus.css';

function Syllabus() {
  const { programId, semesterId, subjectId } = useParams();
  const navigate = useNavigate();
  
  const [openUnitIndex, setOpenUnitIndex] = useState(null);
  const [subjectData, setSubjectData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5001/api/syllabus/${programId}/${semesterId}`)
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
        <h1>{subjectData.name} ({subjectData.id || subjectId})</h1>
        <span className="credits-badge">{subjectData.credits} Credits • {subjectData.type}</span>
      </div>

      <div className="units-container">
        {subjectData.units && subjectData.units.length > 0 ? (
          subjectData.units.map((unit, index) => (
            <div key={index} className="unit-card">
              
              <div className="unit-header" onClick={() => toggleUnit(index)}>
                <div className="unit-title-group">
                  <span className="unit-number">Unit {unit.unitNumber}</span>
                  <span className="unit-name">{unit.title}</span>
                </div>
                
                <div className="unit-meta">
                  <span className="hours-badge">{unit.topics ? unit.topics.length : 0} Topics</span>
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
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
            No units uploaded for this subject yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default Syllabus;