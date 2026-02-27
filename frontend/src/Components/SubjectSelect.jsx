import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './SubjectSelect.css';

function SubjectSelect() {
  const { programId, semesterId } = useParams();
  const navigate = useNavigate();
  
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`http://localhost:5001/api/syllabus/${programId}/${semesterId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch subjects from the server.");
        }
        
        const data = await response.json();
        setSubjects(data.subjects || []);
      } catch (err) {
        setError(err.message || "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubjects();
  }, [programId, semesterId]);

  const formatSemester = (str) => {
    if (!str) return '';
    return str.replace('sem-', 'Semester ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatProgram = (id) => {
    if (id === 'btech-mtech-cse') return 'Cyber Security';
    if (id === 'bsc-msc-fs') return 'Forensic Science (B.Sc-M.Sc)';
    if (id === 'msc-fs') return 'Forensic Science (M.Sc)';
    if (id === 'pd-csm') return 'Crime Scene Management';
    return 'Program';
  };

  const totalSubjects = subjects.length;
  const totalCredits = subjects.reduce((sum, sub) => sum + (Number(sub.credits) || 0), 0);
  const totalLabs = subjects.filter(sub => sub.type === 'Lab').length;
  const totalTheory = totalSubjects - totalLabs;

  return (
    <div className="page-container">
      <div className="breadcrumb">
        <span onClick={() => navigate('/dashboard')} className="crumb-link">🏠 Home</span> 
        <span className="separator">/</span>
        <span onClick={() => navigate('/syllabus')} className="crumb-link">Courses</span>
        <span className="separator">/</span>
        <span onClick={() => navigate(`/syllabus/${programId}`)} className="crumb-link">
          {formatProgram(programId)}
        </span>
        <span className="separator">/</span>
        <span className="current-page">{formatSemester(semesterId)}</span>
      </div>


      <header className="page-header">
        <h1>{formatSemester(semesterId)} Subjects</h1>
        <p className="subtitle">Select a subject to view its complete syllabus and units.</p>
      </header>


      {isLoading ? (
        <div className="status-message loading">Loading subjects...</div>
      ) : error ? (
        <div className="status-message error">Error: {error}</div>
      ) : subjects.length === 0 ? (
        <div className="status-message empty">No subjects found for this semester yet.</div>
      ) : (
        <>

          <div className="semester-summary">

            <div className="summary-item">
              <span className="summary-value">{totalCredits}</span>
              <span className="summary-label">Total Credits</span>
            </div>
            <div className="summary-divider"></div>


            <div className="summary-item">
              <span className="summary-value">{totalSubjects}</span>
              <span className="summary-label">Total Subjects</span>
            </div>
            <div className="summary-divider"></div>


            <div className="summary-item">
              <span className="summary-value">{totalTheory}</span>
              <span className="summary-label">Theory Classes</span>
            </div>
            <div className="summary-divider"></div>


            <div className="summary-item">
              <span className="summary-value">{totalLabs}</span>
              <span className="summary-label">Lab Sessions</span>
            </div>
          </div>

          <div className="table-container">
            <table className="subject-table">
              <thead>
                <tr>
                  <th>S.No.</th>
                  <th>Code</th>
                  <th>Subject</th>
                  <th>Credit</th>
                  <th>Teacher</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject, index) => (
                  <tr 
                    key={subject.id} 
                    className="subject-row"
                    onClick={() => navigate(`/syllabus/${programId}/${semesterId}/${subject.id}`)}
                  >
                    <td className="serial-col">{index + 1}</td>
                    <td className="code-col">{subject.id}</td>
                    <td className="name-col">{subject.name}</td>
                    <td className="credit-col">{subject.credits}</td>
                    <td className="teacher-col">
                      <div className="teacher-info">
                        <div className="teacher-avatar"></div>
                        <span>{subject.teacher || 'TBA'}</span>
                      </div>
                    </td>
                    <td className="type-col">
                      <span className={`type-badge ${subject.type === 'Lab' ? 'lab' : 'core'}`}>
                        {subject.type || 'Core'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}

export default SubjectSelect;