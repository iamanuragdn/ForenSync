import { NavLink } from 'react-router-dom';
import './Sidebar.css';
import side_bar_logo from '../assets/sidebar-logo.png';

function Sidebar() {
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
      <NavLink to="/admin" className="nav-item admin-link">
          <span className="nav-icon">🔐</span>
          <span className="nav-text">Admin</span>
        </NavLink>
    </aside>
  );
}

export default Sidebar;