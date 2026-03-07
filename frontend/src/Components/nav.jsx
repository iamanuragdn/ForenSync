import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; // 🌟 Import auth for secure logout
import './nav.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("forensync_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await auth.signOut(); // 🌟 Securely logs them out of Firebase
    localStorage.removeItem("forensync_user");
    setDropdownOpen(false);
    navigate('/login'); 
    window.location.reload(); 
  };

  return (
    <div className="top-navbar">
      <div className="search-container">
        <input type="text" placeholder="Search notes, pyq, subjects, exams..." className="navbar-search" />
      </div>

      <div className="nav-right">
        <div className="profile-wrapper" ref={dropdownRef}>
          
          <div className="user-profile-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
            <div className="user-info">
              <span className="user-name">{user ? user.name : "Guest"}</span>
              {/* 🌟 Swapped username for email */}
              <span className="user-id">{user ? user.email : "Login"}</span> 
            </div>
            <div className="user-avatar">
              {user && user.name ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
          </div>

          {dropdownOpen && user && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar-large">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h3>Hi, {user.name.split(' ')[0]}!</h3>
                {/* 🌟 Swapped username for email */}
                <p className="dropdown-email">{user.email}</p> 
              </div>
              
              <div className="dropdown-body">
                  <div className="dropdown-item">
                    <span className="item-label">Roll No.</span>
                    {/* 🌟 Swapped enrollmentNo for rollNumber */}
                    <span className="item-value">{user.rollNumber || "Admin"}</span> 
                  </div>
                  <div className="dropdown-item">
                    <span className="item-label">Program</span>
                    {/* 🌟 Swapped courseName for programId */}
                    <span className="item-value">{user.programId || "Faculty"}</span>
                  </div>
                  <div className="dropdown-item">
                    <span className="item-label">Semester</span>
                    <span className="item-value">{user.semesterId || "--"}</span>
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