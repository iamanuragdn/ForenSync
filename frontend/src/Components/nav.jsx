import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './nav.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // 1. Fetch the logged-in user
  useEffect(() => {
    const savedUser = localStorage.getItem("forensync_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // 2. Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Handle Logout
  const handleLogout = () => {
    localStorage.removeItem("forensync_user");
    setDropdownOpen(false);
    
    // 👇 Change this line to point to the root Landing Page!
    navigate('/'); 
    
    window.location.reload(); 
    };

  return (
    <div className="top-navbar">
      
      {/* Search Bar */}
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search notes, subjects, exams..." 
          className="navbar-search"
        />
      </div>

      {/* Right Side: Notifications & Profile */}
      <div className="nav-right">
        <div className="notifications">🔔</div>
        
        {/* Profile Wrapper (Position Relative for Dropdown) */}
        <div className="profile-wrapper" ref={dropdownRef}>
          
          {/* The Clickable Button */}
          <div className="user-profile-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="user-info">
              <span className="user-name">{user ? user.name : "Guest"}</span>
              <span className="user-id">{user ? user.username : "Login"}</span>
            </div>
            <div className="user-avatar">
              {user && user.name ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
          </div>

          {/* The Google-Style Floating Dropdown */}
          {dropdownOpen && user && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar-large">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h3>Hi, {user.name.split(' ')[0]}!</h3>
                <p className="dropdown-email">@{user.username}</p>
              </div>
              
              <div className="dropdown-body">
                  <div className="dropdown-item">
                    <span className="item-label">Enrollment No.</span>
                    {/* Now uses the real enrollment number! */}
                    <span className="item-value">{user.enrollmentNo}</span> 
                  </div>
                  <div className="dropdown-item">
                    <span className="item-label">Course</span>
                    {/* Now dynamically pulls the course name! */}
                    <span className="item-value">{user.courseName}</span>
                  </div>
                  <div className="dropdown-item">
                    <span className="item-label">Semester</span>
                    {/* Now pulls the semester directly! */}
                    <span className="item-value">{user.semesterId}</span>
                  </div>
              </div>

              <div className="dropdown-footer">
                <button className="btn-logout" onClick={handleLogout}>
                  Sign out of ForenSync
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Navbar;