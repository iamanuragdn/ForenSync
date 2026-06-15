import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, getDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Crown, Search, Trash2, ShieldCheck, ShieldAlert, Users, X, Loader } from 'lucide-react';
import './SuperAdminPortal.css';

function SuperAdminPortal() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const verifySuperAdmin = async () => {
      const saved = localStorage.getItem("forensync_user");
      if (!saved) {
        navigate('/login');
        return;
      }
      
      try {
        const cachedUser = JSON.parse(saved);
        if (!cachedUser.uid) throw new Error("Invalid cache");
        
        const docRef = doc(db, 'users', cachedUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const freshUser = docSnap.data();
          setCurrentUser(freshUser);
          
          if (freshUser.role === 'SuperAdmin') {
            fetchUsers();
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Super Admin check failed:", err);
        setLoading(false);
      }
    };
    
    verifySuperAdmin();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsersList(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = async (userId, field, value) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        [field]: value
      });
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, [field]: value } : u));
    } catch (error) {
      console.error(`Failed to update ${field}:`, error);
      alert(`Error updating ${field}`);
    }
  };

  const handleDeleteUser = async (userId, userName, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you absolutely sure you want to permanently delete user "${userName}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsersList(prev => prev.filter(u => u.id !== userId));
      if (expandedId === userId) setExpandedId(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      alert("Error deleting user.");
    }
  };

  const toggleRow = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', gap: '20px', color: 'var(--text-secondary)' }}>
        <Loader size={40} color="#f59e0b" style={{ animation: 'spin 1s linear infinite' }} />
        <p style={{ fontFamily: '"Space Grotesk", sans-serif' }}>Decrypting Secure Channels...</p>
      </div>
    );
  }

  if (!currentUser || currentUser.role !== 'SuperAdmin') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh', textAlign: 'center', color: '#ef4444', fontFamily: '"Space Grotesk", sans-serif' }}>
        <ShieldAlert size={60} />
        <h2 style={{ fontSize: '2.5rem', marginTop: '20px', fontWeight: 700 }}>Super Admin Access Required</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '15px auto', lineHeight: '1.6' }}>
          This sector is highly restricted. Only authorized Super Administrators possess the cryptographic clearance to access this portal.
        </p>
        <button 
          onClick={() => navigate('/dashboard')} 
          style={{ padding: '12px 24px', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold', fontFamily: '"Space Grotesk", sans-serif' }}
        >
          Return to Safety
        </button>
      </div>
    );
  }

  // Derived Stats
  const adminsCount = usersList.filter(u => u.role === 'Admin' || u.role === 'SuperAdmin').length;
  const pendingAdmins = usersList.filter(u => u.role === 'Admin' && (!u.isVerifiedAdmin || !u.isVerifiedID)).length;

  // Filter & Search Logic
  const filteredUsers = usersList.filter(user => {
    const matchesSearch = (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeFilter === 'Students') return user.role === 'Student';
    if (activeFilter === 'Admins') return user.role === 'Admin' || user.role === 'SuperAdmin';
    if (activeFilter === 'Pending') return user.role === 'Admin' && (!user.isVerifiedAdmin || !user.isVerifiedID);
    return true; // 'All'
  });

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getRoleColor = (role) => {
    if (role === 'SuperAdmin') return { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '#f59e0b' };
    if (role === 'Admin') return { bg: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6', border: '#3b82f6' };
    return { bg: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '#10b981' };
  };

  return (
    <div className="super-admin-container">
      
      {/* Header */}
      <div className="super-admin-header-row">
        <div className="super-admin-header-title">
          <Crown size={40} color="#f59e0b" />
          <h1>Super Admin Control</h1>
        </div>
        <div className="header-stats">
          <div className="stat-chip">
            <Users size={16} color="#94a3b8" />
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{usersList.length}</span>
          </div>
        </div>
      </div>

      {/* Controls: Search & Filters */}
      <div className="controls-row">
        <div className="search-wrapper">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name or email ID..." 
            className="admin-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filters-group">
          {['All', 'Students', 'Admins', 'Pending'].map(filter => {
            let countLabel = null;
            if (filter === 'Admins') {
              countLabel = <span className="filter-badge blue">{adminsCount}</span>;
            } else if (filter === 'Pending' && pendingAdmins > 0) {
              countLabel = <span className="filter-badge yellow">{pendingAdmins}</span>;
            }
            
            return (
              <button 
                key={filter}
                className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter} {countLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <div className="table-header">
          <div>User Identity</div>
          <div>Secure Comm (Email)</div>
          <div>Clearance Level</div>
          <div>Verification Status</div>
          <div style={{ textAlign: 'right' }}>Action</div>
        </div>

        {filteredUsers.map(user => {
          const isExpanded = expandedId === user.id;
          const roleColors = getRoleColor(user.role || 'Student');
          const isPending = user.role === 'Admin' && (!user.isVerifiedAdmin || !user.isVerifiedID);
          const isFullyVerified = user.role === 'Admin' && user.isVerifiedAdmin && user.isVerifiedID;
          const isStudent = user.role !== 'Admin' && user.role !== 'SuperAdmin';

          return (
            <div 
              key={user.id} 
              className={`user-row-wrapper role-${user.role || 'Student'} ${isExpanded ? 'expanded' : ''}`}
            >
              <div className="user-row" onClick={() => toggleRow(user.id)}>
                <div className="cell-user">
                  <div className="avatar" style={{ background: roleColors.bg, color: roleColors.color, border: `1px solid ${roleColors.border}` }}>
                    {getInitials(user.name)}
                  </div>
                  <span className="user-name">{user.name || 'Anonymous Protocol'}</span>
                </div>
                
                <div className="cell-email">{user.email}</div>
                
                <div className="cell-role">
                  <span className="role-badge" style={{ background: roleColors.bg, color: roleColors.color, border: `1px solid ${roleColors.border}` }}>
                    {user.role || 'Student'}
                  </span>
                </div>
                
                <div className="cell-verified">
                  {isStudent ? (
                    <><div className="sa-status-dot active"></div> Auto (Student)</>
                  ) : isFullyVerified || user.role === 'SuperAdmin' ? (
                    <><div className="sa-status-dot active"></div> Verified</>
                  ) : (
                    <><div className="sa-status-dot pending"></div> Action Required</>
                  )}
                </div>

                <div className="cell-actions">
                  <button className="btn-icon" title="Permanently Delete User" onClick={(e) => handleDeleteUser(user.id, user.name, e)}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Expanded Glass Panel */}
              <div className={`expanded-panel-wrapper ${isExpanded ? 'open' : ''}`}>
                <div className="expanded-panel-inner">
                  <div className="expanded-panel">
                    
                    {/* Left Column: Access Settings */}
                    <div className="panel-column">
                      <h4 className="panel-title">System Access Parameters</h4>
                      
                      <div className="form-group">
                        <label>Security Clearance Role</label>
                        <select 
                          className="mission-select"
                          value={user.role || 'Student'}
                          onChange={(e) => handleUpdateUser(user.id, 'role', e.target.value)}
                        >
                          <option value="Student">Student (Standard Access)</option>
                          <option value="Admin">Admin (Upload Capabilities)</option>
                          <option value="SuperAdmin">SuperAdmin (Master Control)</option>
                        </select>
                      </div>

                      {user.role === 'Admin' && (
                        <div className="form-group">
                          <label>Administrative Designation</label>
                          <select 
                            className="mission-select"
                            value={user.adminType || 'Teacher'}
                            onChange={(e) => handleUpdateUser(user.id, 'adminType', e.target.value)}
                          >
                            <option value="Teacher">Teacher / Faculty</option>
                            <option value="CR">Class Representative</option>
                            <option value="ActiveContributor">Active Contributor</option>
                          </select>
                        </div>
                      )}

                      {(user.role === 'Admin' || user.role === 'SuperAdmin') && (
                        <>
                          <div className="toggle-wrapper">
                            <span className="toggle-label">Console Access Authorized</span>
                            <label className="mission-switch">
                              <input 
                                type="checkbox" 
                                checked={user.isVerifiedAdmin || false}
                                onChange={(e) => handleUpdateUser(user.id, 'isVerifiedAdmin', e.target.checked)}
                              />
                              <span className="mission-slider"></span>
                            </label>
                          </div>
                          
                          <div className="toggle-wrapper">
                            <span className="toggle-label">Identity Cryptographically Verified</span>
                            <label className="mission-switch">
                              <input 
                                type="checkbox" 
                                checked={user.isVerifiedID || false}
                                onChange={(e) => handleUpdateUser(user.id, 'isVerifiedID', e.target.checked)}
                              />
                              <span className="mission-slider"></span>
                            </label>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right Column: Account Info & Danger Zone */}
                    <div className="panel-column">
                      <h4 className="panel-title">Node Diagnostics & Editing</h4>
                      
                      <div className="form-group">
                        <label>User Identity (Name)</label>
                        <input 
                          type="text" 
                          className="mission-input"
                          defaultValue={user.name || ''}
                          onBlur={(e) => {
                            if (e.target.value !== user.name) handleUpdateUser(user.id, 'name', e.target.value);
                          }}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Secure Comm (Email)</label>
                        <input 
                          type="email" 
                          className="mission-input"
                          defaultValue={user.email || ''}
                          onBlur={(e) => {
                            if (e.target.value !== user.email) handleUpdateUser(user.id, 'email', e.target.value);
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label>Enrollment / Roll Number</label>
                        <input 
                          type="text" 
                          className="mission-input"
                          placeholder="e.g. 250348004012"
                          defaultValue={user.enrollmentNumber || user.rollNumber || ''}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== user.enrollmentNumber || val !== user.rollNumber) {
                              handleUpdateUser(user.id, 'enrollmentNumber', val);
                              handleUpdateUser(user.id, 'rollNumber', val);
                            }
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label>Program ID</label>
                        <input 
                          type="text" 
                          className="mission-input"
                          placeholder="e.g. btech-mtech-cybersecurity"
                          defaultValue={user.programId || ''}
                          onBlur={(e) => {
                            if (e.target.value !== user.programId) handleUpdateUser(user.id, 'programId', e.target.value);
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label>Semester ID</label>
                        <input 
                          type="text" 
                          className="mission-input"
                          placeholder="e.g. sem-3"
                          defaultValue={user.semesterId || ''}
                          onBlur={(e) => {
                            if (e.target.value !== user.semesterId) handleUpdateUser(user.id, 'semesterId', e.target.value);
                          }}
                        />
                      </div>

                      <div className="form-group">
                        <label>Academic Batch</label>
                        <input 
                          type="text" 
                          className="mission-input"
                          placeholder="e.g. 2025-2030"
                          defaultValue={user.batch || ''}
                          onBlur={(e) => {
                            if (e.target.value !== user.batch) handleUpdateUser(user.id, 'batch', e.target.value);
                          }}
                        />
                      </div>

                      <div className="info-row" style={{ marginTop: '20px' }}>
                        <span className="info-label">Unique UID</span>
                        <span className="info-value">{user.id}</span>
                      </div>

                      <button 
                        className="btn-danger-glow" 
                        onClick={(e) => handleDeleteUser(user.id, user.name, e)}
                      >
                        <Trash2 size={18} /> Terminate Node (Remove Account)
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            No entities found matching current parameters.
          </div>
        )}
      </div>

    </div>
  );
}

export default SuperAdminPortal;
