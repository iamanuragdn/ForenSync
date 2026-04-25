import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, BookOpen, Target, Files, Sun, Moon, Shield, ExternalLink, Crown } from 'lucide-react';
import './sidebarStyle.css';
import side_bar_logo from '../assets/sidebar-logo.png';
import { getAuth } from "firebase/auth";

function Sidebar({ user }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleGoToGrievance = async () => {
    try {
        // Grab the current logged-in user directly from Firebase
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            console.error("No user is logged in!");
            return;
        }

        // Show a loading state if you want, or just redirect instantly
        const response = await fetch('https://forensync-backend.onrender.com/api/sso/generate-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: user.email, 
                name: user.displayName || "ForenSync User" // Fallback just in case
            })
        });
        
        const data = await response.json();

        // Redirect to their portal with the secure ticket!
        if (data.code) {
            window.location.href = `https://nfsu-student-grievance-portal.vercel.app/sso-login?code=${data.code}`;
        }
    } catch (error) {
        console.error("SSO failed", error);
    }
};

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <img src={side_bar_logo} alt="ForenSync Logo" className="brand-logo" />
        <h2>ForenSync.</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className="nav-item">
          <span className="nav-icon"><Home size={20} /></span> 
          <span className="nav-text">Home</span>
        </NavLink>

        <NavLink to="/exams" className="nav-item">
          <span className="nav-icon"><FileText size={20} /></span>
          <span className="nav-text">Exams</span>
        </NavLink>

        <NavLink to="/syllabus" className="nav-item">
          <span className="nav-icon"><BookOpen size={20} /></span>
          <span className="nav-text">Syllabus</span>
        </NavLink>

        <NavLink to="/practice" className="nav-item">
          <span className="nav-icon"><Target size={20} /></span>
          <span className="nav-text">Practice</span>
        </NavLink>

        <NavLink to="/pyq" className="nav-item">
          <span className="nav-icon"><Files size={20} /></span>
          <span className="nav-text">PYQ</span>
        </NavLink>
      </nav>
      
      <div className="sidebar-bottom-actions" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>

        <button 
          onClick={handleGoToGrievance} 
          className="nav-item" 
          style={{ 
            background: 'transparent', 
            border: 'none', 
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            width: '100%',
            textAlign: 'left',
            padding: '0.85rem 1rem'
          }}
        >
          <span className="nav-icon"><ExternalLink size={20} /></span>
          <span className="nav-text" style={{ fontWeight: '500' }}>Grievance Portal</span>
        </button>

        <button onClick={toggleTheme} className="nav-item theme-toggle-btn" style={{ 
          background: 'transparent', 
          border: 'none', 
          cursor: 'pointer',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          width: '100%',
          textAlign: 'left',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          padding: '0.85rem 1rem'
        }}>
          <span className="nav-icon" style={{ marginRight: '1rem', display: 'flex', alignItems: 'center' }}>
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </span>
          <span className="nav-text" style={{ fontWeight: '500' }}>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
        
        <NavLink to="/admin" className="nav-item admin-link" style={{ marginTop: 0 }}>
          <span className="nav-icon"><Shield size={20} /></span>
          <span className="nav-text">Admin</span>
        </NavLink>

        {user?.role === 'SuperAdmin' && (
          <NavLink to="/superadmin" className="nav-item superadmin-link" style={{ marginTop: 0, color: '#f59e0b' }}>
            <span className="nav-icon"><Crown size={20} /></span>
            <span className="nav-text" style={{ fontWeight: 'bold' }}>Super Admin</span>
          </NavLink>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;