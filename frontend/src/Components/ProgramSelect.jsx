import { useNavigate } from 'react-router-dom';
import './ProgramSelect.css';

function ProgramSelect() {
  const navigate = useNavigate();

  // Your list of programs (you can eventually fetch this from Firebase!)
  const programs = [
    {
      id: 'btech-mtech-cse',
      name: 'B.Tech - M.Tech. CSE (Cyber Security)',
      department: 'Department of Cyber Security and Digital Forensics',
      icon: '🛡️' // Swap these emojis with your actual <img> tags if you prefer
    },
    {
      id: 'bsc-msc-fs',
      name: 'B.Sc. - M.Sc. Forensic Science',
      department: 'Department of Forensic Sciences',
      icon: '🔬'
    },
    {
      id: 'msc-fs',
      name: 'M.Sc. Forensic Science',
      department: 'Department of Forensic Sciences',
      icon: '💻'
    },
    {
      id: 'pd-csm',
      name: 'Professional Diploma In Crime Scene Management',
      department: 'Department of Forensic Sciences',
      icon: '📁'
    }
  ];

  return (
    <div className="page-container">
      
      {/* Clean Page Header matching the Home page */}
      <header className="page-header">
        <h1>Programs</h1>
        <p className="subtitle">Select a course to choose Semesters</p>
      </header>

      {/* Grid of Program Cards */}
      <div className="program-grid">
        {programs.map((prog) => (
          <div 
            key={prog.id} 
            className="program-card"
            onClick={() => navigate(`/syllabus/${prog.id}`)}
          >
            <div className="program-icon">{prog.icon}</div>
            <div className="program-details">
              <h3>{prog.name}</h3>
              <p>{prog.department}</p>
            </div>
            <div className="program-arrow">→</div>
          </div>
        ))}
      </div>

    </div>
  );
}

export default ProgramSelect;