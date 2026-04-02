import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Home } from 'lucide-react';
import './SemesterSelect.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function SemesterSelect() {
  const navigate = useNavigate();
  const { programId } = useParams();
  const [selectedCourse, setSelectedCourse] = useState(programId || 'btech-mtech-cybersecurity');
  const [semesters, setSemesters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (programId && programId !== selectedCourse) {
      setSelectedCourse(programId);
    }
  }, [programId]);

  // Fetch data when component loads or programId changes
  useEffect(() => {
    const fetchSemesters = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/db/programs/${selectedCourse}/semesters`);
        
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
  }, [selectedCourse]);

  const formatTitle = (id) => {
    if (id === 'btech-mtech-cybersecurity') return 'B.Tech - M.Tech (Cyber Security)';
    if (id === 'bsc-msc-forensic') return 'B.Sc. - M.Sc. Forensic Science';
    if (id === 'msc-fs') return 'M.Sc. Forensic Science';
    return 'University Program';
  };

  return (
    <div className="semester-dashboard">
      
      
      <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }} onClick={() => navigate('/dashboard')}><Home size={16} /> Home</span> 
        <span>/</span> 
        <span>Courses</span> 
        <span>/</span> 
        <span className="current-page">Cyber Security</span>
      </div>

      
      <div className="semester-hero-section">
        <div className="hero-content">
          <h1>{formatTitle(selectedCourse)}</h1>
          <p>Select a semester below to access the complete syllabus, subject details.</p>
          
          <div className="stats-row">
            <span>{semesters.length} Semesters</span>
            <span>42 Subjects</span> 
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
              onClick={() => navigate(`/syllabus/${selectedCourse}/${sem.id}`)} 
            >
              <div className="sem-number">{sem.id.replace('sem-', '')}</div>
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