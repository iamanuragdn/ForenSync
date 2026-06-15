import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; 
import { Search, Zap, Eye, Camera, Lock, Mail, Book, FileText, Clock, PenTool, Shield } from 'lucide-react';
import { uploadWithCompression } from '../utils/fileCompression';
import { db } from '../firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import './nav.css';

function Navbar() {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState(''); 
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState([]); 
  
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const popularSearches = [
    "Cyber Security Syllabus",
    "Semester 1 PYQs",
    "Digital Forensics Notes",
    "Network Security Mock Test"
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("forensync_user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Silently fetch the latest user data to sync any role or batch updates
      if (parsedUser.uid) {
        getDoc(doc(db, "users", parsedUser.uid)).then((docSnap) => {
          if (docSnap.exists()) {
            const latestData = docSnap.data();
            const updatedUser = { ...parsedUser, ...latestData };
            setUser(updatedUser);
            localStorage.setItem("forensync_user", JSON.stringify(updatedUser));
          }
        }).catch(err => console.error("Failed to fetch latest user data", err));
      }
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

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setLiveSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setLiveSuggestions(data); 
      } catch (error) {
        console.error("Live search failed:", error);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleLogout = async () => {
    await auth.signOut(); 
    localStorage.removeItem("forensync_user");
    setDropdownOpen(false);
    navigate('/login'); 
    window.location.reload(); 
  };

  const handleChangePassword = async () => {
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
      const response = await fetch(`${API_URL}/api/auth/send-password-reset-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      if (!response.ok) throw new Error("Failed to send reset email");
      alert("Password reset email sent! Please check your inbox.");
    } catch (error) {
      console.error(error);
      alert("Failed to send password reset email.");
    }
  };

  const handleChangeEmail = async () => {
    const newEmail = window.prompt("Enter your new email address:");
    if (!newEmail || newEmail.trim() === '') return;
    
    try {
      const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
      const response = await fetch(`${API_URL}/api/auth/send-email-change-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, newEmail: newEmail.trim() })
      });
      if (!response.ok) throw new Error("Failed to send email change verification");
      alert("Email change confirmation sent to your new email address! Please check your inbox to confirm.");
    } catch (error) {
      console.error(error);
      alert("Failed to send email change verification.");
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    try {
      console.log("1. File selected:", file);
      const compressedFile = await uploadWithCompression(file);
      console.log("2. Compression finished");

      const url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
      console.log("3. FileReader Base64 conversion finished");

      if (user.uid) {
        await updateDoc(doc(db, "users", user.uid), { profilePictureUrl: url });
        console.log("5. Firestore update successful");
      }

      const updatedUser = { ...user, profilePictureUrl: url };
      setUser(updatedUser);
      localStorage.setItem("forensync_user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("UPLOAD FAILED:", error);
      alert("Failed to upload profile picture. Check console for details.");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault(); 
    if (searchQuery.trim() !== '') {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false); 
    }
  };

  const handleLiveSuggestionClick = (item) => {
    setShowSuggestions(false);
    setSearchQuery(''); 
    navigate(item.link); 
  };

  const toggleMobileSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  };

  return (
    <>
      <div className="top-navbar">
        
        <button 
          className="hamburger-btn" 
          onClick={() => {
            document.body.classList.toggle('tablet-sidebar-open');
            document.body.classList.toggle('mobile-sidebar-open');
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>

        <div className="search-container" style={{ position: 'relative' }}>
          <form onSubmit={handleSearchSubmit} style={{ width: '100%', display: 'flex' }}>
            <input 
              type="text" 
              placeholder="Search notes, pyq, subjects, exams..." 
              className="navbar-search" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSuggestions(true)} 
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} 
            />
          </form>

          {showSuggestions && (
            <div className="search-suggestions-dropdown">
              {searchQuery.trim() === '' ? (
                <>
                  <div className="suggestions-header">Popular Searches</div>
                  {popularSearches.map((item, index) => (
                    <div 
                      key={index} 
                      className="suggestion-item"
                      onMouseDown={() => {
                        setSearchQuery(item);
                        navigate(`/search?q=${encodeURIComponent(item)}`);
                      }} 
                    >
                      <span className="suggestion-icon"><Search size={16} /></span>
                      {item}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {(() => {
                    if (liveSuggestions.length === 0) {
                      return (
                        <>
                          <div className="suggestions-header">Live Suggestions</div>
                          <div className="suggestion-item" style={{ cursor: 'default', color: '#94a3b8' }}>
                            <span className="suggestion-icon"><Eye size={16} /></span>
                            Keep typing or hit Enter to deep search...
                          </div>
                        </>
                      );
                    }

                    const subjects = liveSuggestions.filter(i => ['Subject', 'Topic', 'Program'].includes(i.type));
                    const notes = liveSuggestions.filter(i => i.type === 'Notes');
                    const pyqs = liveSuggestions.filter(i => i.type === 'PYQ');
                    const practice = liveSuggestions.filter(i => i.type === 'Practice');

                    const renderCategory = (title, icon, items, limit = 3) => {
                      if (items.length === 0) return null;
                      return (
                        <div className="suggestion-category">
                          <div className="category-header">
                            {icon} <span>{title}</span>
                          </div>
                          {items.slice(0, limit).map((item, idx) => (
                            <div 
                              key={`${title.replace(/\s+/g, '-')}-${idx}`} 
                              className="suggestion-item"
                              onMouseDown={() => handleLiveSuggestionClick(item)}
                              style={{ alignItems: 'flex-start' }}
                            >
                              <span className="suggestion-icon" style={{ marginTop: '2px' }}><Zap size={16} /></span>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                                  {item.type} • {item.description.substring(0, 40)}...
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    };

                    const activeCategories = [
                      { title: "Subjects & Syllabus", icon: <Book size={14} />, items: subjects },
                      { title: "Notes & Materials", icon: <FileText size={14} />, items: notes },
                      { title: "PYQs (Past Papers)", icon: <Clock size={14} />, items: pyqs },
                      { title: "Mock Tests", icon: <PenTool size={14} />, items: practice }
                    ].filter(cat => cat.items.length > 0);

                    return (
                      <div className="categorized-search-results">
                        {activeCategories.map((cat, index) => (
                          <React.Fragment key={cat.title}>
                            {renderCategory(cat.title, cat.icon, cat.items)}
                            {index < activeCategories.length - 1 && <div className="category-divider"></div>}
                          </React.Fragment>
                        ))}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          )}
        </div>

        <div className="nav-right">
          <div className="profile-wrapper" ref={dropdownRef}>
            
            <div className="user-profile-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
              <div className="user-info">
                <span className="user-name">{user ? user.name : "Guest"}</span>
                <span className="user-id">{user ? user.email : "Login"}</span> 
              </div>
              <div className="user-avatar">
                {user && user.profilePictureUrl ? (
                  <img src={user.profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  user && user.name ? user.name.charAt(0).toUpperCase() : "?"
                )}
              </div>
            </div>

            {dropdownOpen && user && (
              <div className="profile-dropdown">
                <div className="dropdown-header" style={{ position: 'relative' }}>
                  {user && (user.role === 'Admin' || user.role === 'SuperAdmin') && (
                    <div className="admin-badge-pill" title={user.role}>
                      <Shield size={10} fill="currentColor" /> 
                      {user.role === 'SuperAdmin' ? 'Super Admin' : 'Admin'}
                    </div>
                  )}
                  <div className="avatar-edit-wrapper">
                    <div className="dropdown-avatar-large">
                      {user && user.profilePictureUrl ? (
                        <img src={user.profilePictureUrl} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <label className="avatar-edit-label" title="Change Profile Picture">
                      <Camera size={14} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={handleProfilePictureChange}
                        title="Change Profile Picture"
                      />
                    </label>
                  </div>
                  <h3>Hi, {user.name.split(' ')[0]}!</h3>
                  <p className="dropdown-email">{user.email}</p> 
                </div>
                
                <div className="dropdown-body">
                    <div className="dropdown-item">
                      <span className="item-label">{user.role === 'Admin' || user.role === 'SuperAdmin' ? 'Role / Roll No.' : 'Roll No.'}</span>
                      <span className="item-value">
                        {user.enrollmentNumber || user.rollNumber || (user.role === 'Admin' || user.role === 'SuperAdmin' ? user.role : "N/A")}
                      </span> 
                    </div>
                    <div className="dropdown-item">
                      <span className="item-label">Program</span>
                      <span className="item-value">{user.programId || "Faculty"}</span>
                    </div>
                    <div className="dropdown-item">
                      <span className="item-label">Semester</span>
                      <span className="item-value">{user.semesterId || "--"}</span>
                    </div>
                </div>

                <div className="dropdown-footer" style={{ borderTop: 'none', paddingBottom: '20px', paddingTop: '10px' }}>
                  <div className="dropdown-settings-row">
                    <button className="btn-setting-minimal" onClick={handleChangePassword}>
                      <Lock size={16} /> Password
                    </button>
                    <button className="btn-setting-minimal" onClick={handleChangeEmail}>
                      <Mail size={16} /> Email
                    </button>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 0 16px 0' }}></div>
                  <button className="btn-logout" onClick={handleLogout}>
                    Sign out of ForenSync
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;