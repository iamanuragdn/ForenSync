import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion';
import { Sparkles, ArrowRight, Award, CheckCircle2, ChevronRight, Check } from 'lucide-react';
import { doc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../firebase';
import confetti from 'canvas-confetti';
import './SemesterUpgradeModal.css';

function SemesterUpgradeModal({ user }) {
  const [isVisible, setIsVisible] = useState(false);
  const [sgpa, setSgpa] = useState('');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [currentSemesterNum, setCurrentSemesterNum] = useState(null);
  const [nextSemesterNum, setNextSemesterNum] = useState(null);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  
  const sliderRef = useRef(null);
  const x = useMotionValue(0);

  // Dynamic slider transforms based on drag 'x' position
  // Assuming slider width is around ~400px and thumb is ~52px, max travel is ~348px
  // Using opacity for a perfectly smooth color transition that works in light/dark mode
  const fillOpacity = useTransform(x, [0, 250], [0, 1]);
  const textColor = useTransform(
    x,
    [0, 200],
    ['#64748b', '#ffffff']
  );

  const calculateMaxAllowedSemester = (enrollmentNumber) => {
    if (!enrollmentNumber || typeof enrollmentNumber !== 'string') return 10;
    
    // Assuming enrollmentNumber starts with the 2-digit year (e.g. "2503...")
    const yearStr = enrollmentNumber.substring(0, 2);
    let batchYear = parseInt(yearStr, 10);
    if (isNaN(batchYear)) return 10;
    
    batchYear += 2000; // Convert 25 to 2025
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed: 5 is June, 11 is Dec
    
    // Every passing year adds 2 semesters
    let maxSem = (currentYear - batchYear) * 2;
    
    // In June (5) or later, exams are over, they can upgrade to the next odd semester
    if (currentMonth >= 5) maxSem += 1;
    
    // In December (11) or later, exams are over, they can upgrade to the next even semester
    if (currentMonth >= 11) maxSem += 1;
    
    return Math.max(1, Math.min(maxSem, 10)); // Cap between 1 and 10
  };

  useEffect(() => {
    async function checkSemester() {
      if (!user || !user.semesterId || !user.programId) return;

      const match = user.semesterId.match(/sem-(\d+)/);
      if (!match) return;

      const currentSemNum = parseInt(match[1], 10);
      const nextSemNum = currentSemNum + 1;
      if (currentSemNum >= 10) return;

      // Restrict upgrades based on their batch timeline
      const maxAllowed = calculateMaxAllowedSemester(user.enrollmentNumber);
      if (nextSemNum > maxAllowed) return;

      if (user[`semester${currentSemNum}Done`]) return;

      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_URL.replace(/\/$/, '')}/semester-info/${user.programId}/${user.semesterId}`);
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        // Ignore fallback dummy dates—we only auto-upgrade if the admin explicitly set a real past end date
        if (data.endDate && !data.isDefaultFallback) {
          const end = new Date(data.endDate).getTime();
          const now = Date.now();
          
          if (now > end) {
            setCurrentSemesterNum(currentSemNum);
            setNextSemesterNum(nextSemNum);
            setIsVisible(true);
          }
        }
      } catch (err) {
        console.error("Failed to check semester end date", err);
      }
    }

    checkSemester();
  }, [user]);

  const handleUpgrade = async () => {
    setIsUpgrading(true);

    try {
      const userRef = doc(db, 'users', user.uid);
      const newSemesterId = `sem-${nextSemesterNum}`;
      
      const updateData = {
        semesterId: newSemesterId,
        [`semester${currentSemesterNum}Done`]: true
      };

      if (sgpa.trim() !== '') {
        updateData[`semester${currentSemesterNum}SGPA`] = parseFloat(sgpa);
      }

      if (user.hasUpgradedSummer2024 !== undefined) {
        updateData.hasUpgradedSummer2024 = deleteField();
      }
      if (user.summer2024SGPA !== undefined) {
        updateData.summer2024SGPA = deleteField();
      }

      await updateDoc(userRef, updateData);
      
      // Instantly update localStorage so a page refresh doesn't temporarily revert state
      const savedUser = localStorage.getItem("forensync_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        const updatedLocalUser = { ...parsed, semesterId: newSemesterId, [`semester${currentSemesterNum}Done`]: true };
        if (sgpa.trim() !== '') {
          updatedLocalUser[`semester${currentSemesterNum}SGPA`] = parseFloat(sgpa);
        }
        localStorage.setItem("forensync_user", JSON.stringify(updatedLocalUser));
      }
      
      // Trigger Success View & Confetti
      setShowSuccessAnim(true);
      
      // Gorgeous Fireworks Confetti Effect
      const duration = 2500;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999999 };

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: Math.random(), y: Math.random() - 0.2 } 
        }));
      }, 250);
      
      // Close modal gracefully after 3.5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 3500);

    } catch (error) {
      console.error('Failed to upgrade semester:', error);
      alert('Failed to upgrade semester. Please try again.');
      setIsUpgrading(false);
      animate(x, 0, { type: "spring", stiffness: 300, damping: 25 });
    }
  };

  const handleDragEnd = (event, info) => {
    if (!sliderRef.current) return;
    const sliderWidth = sliderRef.current.offsetWidth;
    const thumbWidth = 52;
    const maxTravel = sliderWidth - thumbWidth - 12; // 6px padding on each side

    // If swiped more than 65% of the way, snap to end and upgrade
    if (info.offset.x >= maxTravel * 0.65) {
      animate(x, maxTravel, { type: "spring", stiffness: 400, damping: 30 });
      handleUpgrade();
    } else {
      // Snap back
      animate(x, 0, { type: "spring", stiffness: 400, damping: 30 });
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="semester-upgrade-overlay">
          <motion.div 
            className="semester-upgrade-modal single-slide-modal"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <AnimatePresence mode="wait">
              {!showSuccessAnim ? (
                <motion.div 
                  key="form-content"
                  className="modal-content-wrapper single-slide-content"
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                  transition={{ duration: 0.4 }}
                >
                  {/* TOP PART: Completion Celebration */}
                  <div className="modal-header-section">
                    <div className="header-icon-container">
                      <CheckCircle2 size={32} className="text-green-500" />
                    </div>
                    <div className="header-text">
                      <h2>Semester {currentSemesterNum} Completed!</h2>
                      <p>Your exams are officially over.</p>
                    </div>
                  </div>

                  <div className="divider" />

                  {/* BOTTOM PART: Upgrade and SGPA */}
                  <div className="modal-body-section">
                    <div className="welcome-section">
                      <motion.div 
                        className="celebration-icon inline-icon"
                        initial={{ rotate: -180, scale: 0 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', delay: 0.4, damping: 15 }}
                      >
                        <Sparkles size={24} />
                      </motion.div>
                      <h3>Welcome to Semester {nextSemesterNum}</h3>
                    </div>
                    
                    <p className="subtitle">
                      We're upgrading your dashboard so you can access all the new materials.
                    </p>

                    <div className="sgpa-input-group">
                      <label>
                        How was your exam? <span className="optional-badge">Strictly Optional</span>
                      </label>
                      <div className="sgpa-input-wrapper">
                        <Award size={20} className="sgpa-input-icon" />
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="10"
                          placeholder="Enter your SGPA (e.g. 8.5)"
                          className="sgpa-input"
                          value={sgpa}
                          onChange={(e) => setSgpa(e.target.value)}
                          disabled={isUpgrading}
                        />
                      </div>
                    </div>

                    {/* SWIPE TO UPGRADE BUTTON */}
                    <div 
                      className={`swipe-button-container ${isUpgrading ? 'upgrading' : ''}`} 
                      ref={sliderRef}
                    >
                      <motion.div 
                        className="swipe-fill" 
                        style={{ opacity: fillOpacity, width: '100%' }} 
                      />
                      <div className="swipe-track">
                        <motion.span 
                          className="swipe-text" 
                          style={{ color: isUpgrading ? '#ffffff' : textColor }}
                        >
                          {isUpgrading ? "Upgrading..." : `Swipe to Upgrade to SEM-${nextSemesterNum}`}
                        </motion.span>
                      </div>
                      <motion.div
                        className="swipe-thumb"
                        style={{ x }}
                        drag={!isUpgrading ? "x" : false}
                        dragConstraints={sliderRef}
                        dragElastic={0}
                        dragMomentum={false}
                        onDragEnd={handleDragEnd}
                        whileTap={!isUpgrading ? { cursor: "grabbing", scale: 0.95 } : {}}
                      >
                        {isUpgrading ? <CheckCircle2 size={24} /> : <ChevronRight size={28} />}
                      </motion.div>
                    </div>

                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="success-anim"
                  className="success-animation-container"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="success-glow"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0, 1.5, 1], opacity: [0, 0.5, 0] }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                  <motion.div 
                    className="success-check-circle"
                    initial={{ scale: 0, rotate: -90 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 100, delay: 0.2 }}
                  >
                    <motion.div
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.8, delay: 0.5, ease: "easeInOut" }}
                    >
                      <Check size={64} strokeWidth={3} className="text-white" />
                    </motion.div>
                  </motion.div>
                  
                  <motion.div
                    className="success-text-container"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    <h2>You're All Set!</h2>
                    <p>Welcome to your new semester.</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default SemesterUpgradeModal;
