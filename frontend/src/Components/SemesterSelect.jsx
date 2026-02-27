import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './SemesterSelect.css';

function SemesterSelect() {
  const navigate = useNavigate();
  const { programId } = useParams();
  const [semesters, setSemesters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data when component loads or programId changes
  useEffect(() => {
    const fetchSemesters = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:5001/api/programs/${programId}/semesters`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch semester data from the server.");
        }
        
        const data = await response.json();
        setSemesters(data);
      } catch (err) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSemesters();
  }, [programId]);

  const formatTitle = (id) => {
    if (id === 'btech-mtech-cybersecurity') return 'B.Tech - M.Tech (Cyber Security)';
    if (id === 'bsc-msc-applied-sciences') return 'B.Sc - M.Sc (Applied Sciences)';
    return 'B.Tech (Computer Science)';
  };

  return (
    <div className="semester-dashboard">
      
      
      <div className="breadcrumb">
        <span>🏠 Home</span> / <span>Courses</span> / <span className="current-page">Cyber Security</span>
      </div>

      
      <div className="hero-section">
        <div className="hero-content">
          <h1>{formatTitle(programId)}</h1>
          <p>Select a semester below to access the complete syllabus, subject details.</p>
          
          <div className="stats-row">
            <span>{semesters.length} Semesters</span>
            <span>42 Subjects</span> 
          </div>
        </div>
        
        <div className="hero-graphic">
          <div className="graphic-overlay">
            <span className="shield-icon">🛡️</span>
            <h3>Department of Computer Science</h3>
          </div>
        </div>
      </div>

      
      <div className="section-title">
        <div className="blue-line"></div>
        <h2>Select Semester</h2>
      </div>

      
      {isLoading ? (
        <div className="loading-message" style={{ padding: '2rem', color: '#64748b' }}>
          Loading semesters...
        </div>
      ) : error ? (
        <div className="error-message" style={{ padding: '2rem', color: '#b91c1c' }}>
          Error: {error}
        </div>
      ) : (
        <div className="semester-grid">
          {semesters.map((sem) => (
            <div 
              key={sem.id} 
              className="semester-card"
              onClick={() => navigate(`/syllabus/${programId}/sem-${sem.id}`)} 
            >
              <div className="sem-number">{sem.id}</div>
              <h3>{sem.name}</h3>
              <p>{sem.desc}</p>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default SemesterSelect;