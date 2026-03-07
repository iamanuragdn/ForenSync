import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; 
import './Onboarding.css'; 

// Using your dashboard logo!
import logoImage from '../assets/logo_muted_blue.png'; 

function Onboarding() {
  const navigate = useNavigate();
  const [role, setRole] = useState('Student');
  const [adminType, setAdminType] = useState('Teacher'); 
  const [fullName, setFullName] = useState('');
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
        programId: 'btech-mtech-cybersecurity', 
        ...(role === 'Admin' ? { adminType, isVerifiedAdmin: false } : {}), 
        ...(needsStudentFields ? { rollNumber, semesterId: semester } : {}) 
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      localStorage.setItem("forensync_user", JSON.stringify(userProfile));
      
      navigate('/dashboard');

    } catch (err) {
      console.error("Setup failed:", err);
      alert("Failed to save profile. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="onboarding-wrapper">
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

          <button type="submit" className="btn-onboarding-submit" disabled={loading}>
            {loading ? "⏳ Setting up workspace..." : "Launch Dashboard 🚀"}
          </button>
        </form>

      </div>
    </div>
  );
}

export default Onboarding;