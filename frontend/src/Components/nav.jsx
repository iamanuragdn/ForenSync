import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; 
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

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setLiveSuggestions([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setLiveSuggestions(data.slice(0, 4)); 
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
                      <span className="suggestion-icon">🔍</span>
                      {item}
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="suggestions-header">Live Suggestions</div>
                  {liveSuggestions.length > 0 ? (
                    liveSuggestions.map((item, index) => (
                      <div 
                        key={index} 
                        className="suggestion-item"
                        onMouseDown={() => handleLiveSuggestionClick(item)}
                        style={{ alignItems: 'flex-start' }}
                      >
                        <span className="suggestion-icon" style={{ marginTop: '2px' }}>⚡</span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{item.title}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                            {item.type} • {item.description.substring(0, 40)}...
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="suggestion-item" style={{ cursor: 'default', color: '#94a3b8' }}>
                      <span className="suggestion-icon">👀</span>
                      Keep typing or hit Enter to deep search...
                    </div>
                  )}
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
                  <p className="dropdown-email">{user.email}</p> 
                </div>
                
                <div className="dropdown-body">
                    <div className="dropdown-item">
                      <span className="item-label">Roll No.</span>
                      <span className="item-value">{user.rollNumber || "Admin"}</span> 
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
    </>
  );
}

export default Navbar;