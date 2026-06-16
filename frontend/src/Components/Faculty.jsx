import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Users, BookOpen, Search, Loader, Mail, GraduationCap, ArrowRight, X, Edit2, Save, Phone, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from 'boneyard-js/react';
import { uploadWithCompression } from '../utils/fileCompression';
import './Faculty.css';

function Faculty() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherSubjects, setTeacherSubjects] = useState({});
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ phone: '', email: '', profilePictureUrl: null });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTeachers();
    const savedUser = JSON.parse(localStorage.getItem('forensync_user') || '{}');
    if (savedUser.uid) {
      getDoc(doc(db, 'users', savedUser.uid)).then(docSnap => {
        if (docSnap.exists()) {
          setCurrentUser(docSnap.data());
        }
      }).catch(err => console.error("Error fetching user data:", err));
    }
  }, []);

  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  const fetchTeachers = async () => {
    try {
      const teachersRef = collection(db, 'teachers');
      const snapshot = await getDocs(teachersRef);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort alphabetically by name
      data.sort((a, b) => {
        const nameA = a.name.replace(/^(Dr\.|Mr\.|Ms\.|Prof\.)\s*/i, '').trim();
        const nameB = b.name.replace(/^(Dr\.|Mr\.|Ms\.|Prof\.)\s*/i, '').trim();
        return nameA.localeCompare(nameB);
      });
      
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching faculty:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjectsForTeacher = async (teacherCode) => {
    if (teacherSubjects[teacherCode]) return; // Already fetched
    
    setIsSubjectsLoading(true);
    try {
      const subjectsRef = collection(db, 'subjects');
      const q = query(subjectsRef, where('teacherCode', '==', teacherCode));
      const snapshot = await getDocs(q);
      const subjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setTeacherSubjects(prev => ({ ...prev, [teacherCode]: subjects }));
    } catch (error) {
      console.error("Error fetching subjects for teacher:", error);
    } finally {
      setIsSubjectsLoading(false);
    }
  };

  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    fetchSubjectsForTeacher(teacher.teacherCode);
    setIsEditing(false); // Reset edit mode on selection change
  };

  const closeSidebar = () => {
    setSelectedTeacher(null);
    setIsEditing(false);
  };

  const handleEditClick = () => {
    setEditData({
      phone: selectedTeacher.phone || '',
      email: selectedTeacher.email || '',
      profilePictureUrl: selectedTeacher.profilePictureUrl || null
    });
    setIsEditing(true);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const compressedFile = await uploadWithCompression(file);
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onload = () => setEditData(prev => ({ ...prev, profilePictureUrl: reader.result }));
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const teacherRef = doc(db, 'teachers', selectedTeacher.id);
      await updateDoc(teacherRef, {
        phone: editData.phone,
        email: editData.email,
        profilePictureUrl: editData.profilePictureUrl
      });
      
      // Update local state so UI updates instantly
      setTeachers(prev => prev.map(t => 
        t.id === selectedTeacher.id ? { ...t, ...editData } : t
      ));
      setSelectedTeacher(prev => ({ ...prev, ...editData }));
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving faculty profile", error);
      alert("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.teacherCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name) => {
    const cleanName = name.replace(/^(Dr\.|Mr\.|Ms\.|Prof\.)\s*/i, '').trim();
    return cleanName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // Modern deterministic avatar generator based on string hash
  const getAvatarGradient = (code) => {
    const hash = code.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    const hues = [210, 260, 310, 350, 25, 170]; // Beautiful hue palette
    const hue = hues[Math.abs(hash) % hues.length];
    return `linear-gradient(135deg, hsl(${hue}, 80%, 65%), hsl(${hue + 40}, 80%, 45%))`;
  };

  if (loading) {
    return (
      <div className="faculty-loading">
        <Loader size={40} className="spin" color="var(--primary-main)" />
        <p>Loading Faculty Directory...</p>
      </div>
    );
  }

  return (
    <div className="faculty-page-layout">
      
      {/* LEFT COLUMN: THE GRID */}
      <div className={`faculty-main-content ${selectedTeacher ? 'panel-open' : ''}`}>
        <div className="faculty-header-modern">
          <div className="header-left">
            <div className="icon-wrapper">
              <Users size={28} />
            </div>
            <div>
              <h1>Global Faculty Directory</h1>
              <p>Discover our esteemed professors and their specialized subjects.</p>
            </div>
          </div>
          
          <div className="faculty-search-modern">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by name or code..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="faculty-grid-modern">
          {filteredTeachers.map((teacher, index) => {
            const isSelected = selectedTeacher?.teacherCode === teacher.teacherCode;
            
            return (
              <motion.div 
                key={teacher.teacherCode} 
                className={`faculty-card-modern ${isSelected ? 'selected' : ''}`}
                onClick={() => handleTeacherClick(teacher)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                {teacher.profilePictureUrl ? (
                  <img src={teacher.profilePictureUrl} alt={teacher.name} className="card-avatar" style={{ objectFit: 'cover' }} />
                ) : (
                  <div className="card-avatar" style={{ background: getAvatarGradient(teacher.teacherCode) }}>
                    {getInitials(teacher.name)}
                  </div>
                )}
                <div className="card-info">
                  <h3 className="teacher-name">{teacher.name}</h3>
                  <p className="teacher-title">Professor / Instructor</p>
                </div>
                <div className="card-footer-modern">
                  <span className="card-badge">{teacher.teacherCode}</span>
                  <span className="view-profile-text">View Profile <ArrowRight size={14} /></span>
                </div>
              </motion.div>
            );
          })}
          
          {filteredTeachers.length === 0 && (
            <div className="no-results-modern">
              <Users size={48} className="empty-icon" />
              <p>No faculty members found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: DETAILS PANEL */}
      {/* Mobile backdrop - only show if a teacher is selected AND we're on mobile (handled by css) */}
      <AnimatePresence>
        {selectedTeacher && (
          <motion.div 
            className="faculty-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>
            
      <div className="faculty-detail-panel">
        <AnimatePresence mode="wait">
          {selectedTeacher ? (
            <motion.div 
              key="details"
              className="panel-content-wrapper"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="panel-header">
                {isSuperAdmin && !isEditing && (
                  <button className="edit-btn" onClick={handleEditClick} style={{ marginRight: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-main)', border: '1px solid var(--border-light)', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontWeight: 600, color: 'var(--text-main)' }}>
                    <Edit2 size={16} /> Edit Profile
                  </button>
                )}
                <button className="close-btn" onClick={closeSidebar}>
                  <X size={24} />
                </button>
              </div>
              
              <div className="panel-body">
                {isEditing ? (
                  <div className="edit-profile-section">
                    <div className="panel-profile-section" style={{ position: 'relative' }}>
                      <div 
                        className="panel-large-avatar editable"
                        onClick={() => fileInputRef.current?.click()}
                        style={{ 
                          background: editData.profilePictureUrl ? `url(${editData.profilePictureUrl}) center/cover` : getAvatarGradient(selectedTeacher.teacherCode),
                          cursor: 'pointer', position: 'relative', overflow: 'hidden' 
                        }}
                      >
                        {!editData.profilePictureUrl && getInitials(selectedTeacher.name)}
                        <div className="avatar-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                          <Camera size={28} />
                        </div>
                      </div>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Click to upload photo</p>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                      <div className="edit-form-group" style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>Phone Number</label>
                        <input 
                          type="tel" 
                          value={editData.phone} 
                          onChange={e => setEditData({...editData, phone: e.target.value})}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#1e293b', fontSize: '0.95rem', outline: 'none' }}
                          placeholder="+1 234 567"
                        />
                      </div>

                      <div className="edit-form-group" style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px', color: 'var(--text-muted)' }}>Email Address</label>
                        <input 
                          type="email" 
                          value={editData.email} 
                          onChange={e => setEditData({...editData, email: e.target.value})}
                          style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#1e293b', fontSize: '0.95rem', outline: 'none' }}
                          placeholder="prof@uni.edu"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '16px' }}>
                      <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: 600, color: '#475569', fontSize: '1rem', transition: 'all 0.2s' }}>Cancel</button>
                      <button onClick={handleSave} disabled={isSaving} style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', background: '#3b82f6', color: '#ffffff', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s' }}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="panel-profile-section">
                      {selectedTeacher.profilePictureUrl ? (
                        <img src={selectedTeacher.profilePictureUrl} alt={selectedTeacher.name} className="panel-large-avatar" style={{ objectFit: 'cover' }} />
                      ) : (
                        <div 
                          className="panel-large-avatar"
                          style={{ background: getAvatarGradient(selectedTeacher.teacherCode) }}
                        >
                          {getInitials(selectedTeacher.name)}
                        </div>
                      )}
                      <h2>{selectedTeacher.name}</h2>
                      <p className="panel-title">Professor / Instructor</p>
                      <span className="panel-code-badge">{selectedTeacher.teacherCode}</span>
                    </div>

                <div className="panel-courses-section">
                  <h3>
                    <GraduationCap size={20} />
                    Courses Taught
                  </h3>
                  
                  <Skeleton name="faculty-subjects" loading={isSubjectsLoading}>
                    <div className="courses-list">
                      {teacherSubjects[selectedTeacher.teacherCode]?.length > 0 ? (
                        teacherSubjects[selectedTeacher.teacherCode].map(sub => (
                          <div key={sub.id} className="course-item">
                            <div className="course-icon">
                              <BookOpen size={18} />
                            </div>
                            <div className="course-details">
                              <span className="c-name">{sub.name}</span>
                              <span className="c-code">{sub.code} • {sub.type || "Core"}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="no-courses-placeholder">
                          <BookOpen size={24} />
                          <p>No recorded courses found for this semester.</p>
                        </div>
                      )}
                    </div>
                  </Skeleton>
                </div>

                <div className="panel-contact-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--border-light)' }}>
                  {selectedTeacher.phone ? (
                    <a href={`tel:${selectedTeacher.phone}`} className="contact-btn phone">
                      <Phone size={18} /> Call
                    </a>
                  ) : (
                    <button className="contact-btn phone disabled">
                      <Phone size={18} /> N/A
                    </button>
                  )}

                  {selectedTeacher.email ? (
                    <a href={`mailto:${selectedTeacher.email}`} className="contact-btn email">
                      <Mail size={18} /> Email
                    </a>
                  ) : (
                    <button className="contact-btn email disabled">
                      <Mail size={18} /> N/A
                    </button>
                  )}
                </div>
                </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              className="faculty-panel-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="empty-state-content">
                <div className="empty-icon-large">
                  <Users size={48} />
                </div>
                <h2>Select a Faculty Member</h2>
                <p>Click on any professor's card to view their complete profile, courses taught, and contact details.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}

export default Faculty;
