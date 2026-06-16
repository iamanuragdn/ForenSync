import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, FileText, BookOpen, Target, Files, Shield, Crown, Users, ChevronDown, ChevronUp, GraduationCap } from 'lucide-react';
import './sidebarStyle.css';
import side_bar_logo from '../assets/sidebar-logo.png';

function Sidebar({ user }) {
  const [isPrepOpen, setIsPrepOpen] = useState(false);

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

        <NavLink to="/faculty" className="nav-item">
          <span className="nav-icon"><Users size={20} /></span>
          <span className="nav-text">Faculty</span>
        </NavLink>

        <div className={`collapsible-menu ${isPrepOpen ? 'open' : ''}`}>
          <button 
            className="nav-item collapsible-header" 
            onClick={() => setIsPrepOpen(!isPrepOpen)}
          >
            <span className="nav-icon"><GraduationCap size={20} /></span>
            <span className="nav-text">Preparation</span>
            <span className="collapse-icon">
              <ChevronDown size={16} />
            </span>
          </button>
          
          <div className="collapsible-content">
            <NavLink to="/practice" className="nav-item nested-nav-item">
              <span className="nav-icon"><Target size={18} /></span>
              <span className="nav-text">Practice</span>
            </NavLink>

            <NavLink to="/pyq" className="nav-item nested-nav-item">
              <span className="nav-icon"><Files size={18} /></span>
              <span className="nav-text">PYQ</span>
            </NavLink>
          </div>
        </div>
      </nav>
      
      <div className="sidebar-bottom-actions" style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>


        
        {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && (
          <NavLink to="/admin" className="nav-item admin-link" style={{ marginTop: 0 }}>
            <span className="nav-icon"><Shield size={20} /></span>
            <span className="nav-text">Admin</span>
          </NavLink>
        )}

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