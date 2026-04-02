import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; 
import { Sun, Moon, Rocket, Loader } from 'lucide-react';
import './Onboarding.css';

import logoImage from '../assets/logo_muted_blue.png'; 

function Onboarding() {
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState(() => localStorage.getItem('forensync_theme') || 'light');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('forensync_theme', theme);
  }, [theme]);

  const [role, setRole] = useState('Student');
  const [adminType, setAdminType] = useState('Teacher'); 
  const [fullName, setFullName] = useState('');
  const [programId, setProgramId] = useState('btech-mtech-cybersecurity');
  const [rollNumber, setRollNumber] = useState('');
  const [semester, setSemester] = useState('sem-1');
  const [loading, setLoading] = useState(false);

  const needsStudentFields = role === 'Student' || (role === 'Admin' && (adminType === 'CR' || adminType === 'ActiveStudent'));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleCompleteSetup = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = auth.currentUser;
      
      const userProfile = {
        uid: user.uid,
        email: user.email,
        name: fullName,
        role: role,
        programId: programId, 
        ...(role === 'Admin' ? { adminType, isVerifiedAdmin: false } : {}), 
        ...(needsStudentFields ? { rollNumber, semesterId: semester } : {}) 
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      
      const safeProfile = { ...userProfile };
      delete safeProfile.role;
      delete safeProfile.adminType;
      delete safeProfile.isVerifiedAdmin;
      localStorage.setItem("forensync_user", JSON.stringify(safeProfile));
      
      navigate('/dashboard');

    } catch (err) {
      console.error("Setup failed:", err);
      alert("Failed to save profile. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="onboarding-wrapper">
      
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.2s ease', color: 'var(--text-primary)' }}
        title="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="onboarding-card">
        
        <div className="onboarding-header">
          <img src={logoImage} alt="ForenSync Logo" className="onboarding-logo" />
          <h2>Complete Your Profile</h2>
          <p>Let's personalize your ForenSync experience.</p>
        </div>

        <form onSubmit={handleCompleteSetup} className="onboarding-form">
          
          <div className="input-group">
            <label>Account Type</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="onboarding-select">
              <option value="Student">I am a Student</option>
              <option value="Admin">I need Upload Access (Admin)</option>
            </select>
          </div>

          {role === 'Admin' && (
            <div className="input-group">
              <label>My Role is...</label>
              <select value={adminType} onChange={(e) => setAdminType(e.target.value)} className="onboarding-select">
                <option value="Teacher">Teacher / Faculty</option>
                <option value="Administrator">Administrative Staff</option>
                <option value="CR">Class Representative (CR)</option>
                <option value="ActiveStudent">Active Contributor (Student)</option>
              </select>
            </div>
          )}

          <div className="input-group">
            <label>Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Anurag Debnath" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              required 
              className="onboarding-input"
            />
          </div>

          <div className="input-group">
            <label>Select Course</label>
            <select value={programId} onChange={(e) => setProgramId(e.target.value)} className="onboarding-select">
              <option value="btech-mtech-cybersecurity">B.Tech-M.Tech Cybersecurity</option>
              <option value="bsc-msc-forensic">BSc-MSc Forensic Science</option>
            </select>
          </div>

          {needsStudentFields && (
            <div className="student-fields-row">
              <div className="input-group">
                <label>Roll Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 2024CS001" 
                  value={rollNumber} 
                  onChange={(e) => setRollNumber(e.target.value)} 
                  required 
                  className="onboarding-input"
                />
              </div>
              
              <div className="input-group">
                <label>Semester</label>
                <select value={semester} onChange={(e) => setSemester(e.target.value)} className="onboarding-select">
                  <option value="sem-1">Semester 1</option>
                  <option value="sem-2">Semester 2</option>
                  <option value="sem-3">Semester 3</option>
                  <option value="sem-4">Semester 4</option>
                </select>
              </div>
            </div>
          )}

          {role === 'Admin' && (
            <div className="admin-warning-banner">
              <strong>Security Note:</strong> Upload accounts require manual verification by a Superadmin before console access is granted.
            </div>
          )}

          <button type="submit" className="btn-onboarding-submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? <><Loader size={18} /> Setting up workspace...</> : <>Launch Dashboard <Rocket size={18} /></>}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Onboarding;