import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './sidebar.css';
import side_bar_logo from '../assets/sidebar-logo.png';

function Sidebar() {
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

  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <img src={side_bar_logo} alt="ForenSync Logo" className="brand-logo" />
        <h2>ForenSync.</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" className="nav-item">
          <span className="nav-icon">🏠</span> 
          <span className="nav-text">Home</span>
        </NavLink>

        <NavLink to="/exams" className="nav-item">
          <span className="nav-icon">📝</span>
          <span className="nav-text">Exams</span>
        </NavLink>

        <NavLink to="/syllabus" className="nav-item">
          <span className="nav-icon">📑</span>
          <span className="nav-text">Syllabus</span>
        </NavLink>

        <NavLink to="/practice" className="nav-item">
          <span className="nav-icon">🎯</span>
          <span className="nav-text">Practice</span>
        </NavLink>

        <NavLink to="/pyq" className="nav-item">
          <span className="nav-icon">📝</span>
          <span className="nav-text">PYQ</span>
        </NavLink>
      </nav>
      
      <div className="sidebar-bottom-actions" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
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
          <span className="nav-icon" style={{ marginRight: '1rem' }}>{theme === 'light' ? '🌙' : '☀️'}</span>
          <span className="nav-text" style={{ fontWeight: '500' }}>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
        
        <NavLink to="/admin" className="nav-item admin-link" style={{ marginTop: 0 }}>
          <span className="nav-icon">🔐</span>
          <span className="nav-text">Admin</span>
        </NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;