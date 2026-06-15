import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, BarChart, TrendingUp, BookOpen, Sparkles } from 'lucide-react';
import { subjectIconMap, FallbackIcon as Book } from '../utils/iconMap';
import LoadingState from './LoadingState.jsx';
import { Skeleton } from 'boneyard-js/react';
import { motion } from 'framer-motion';
import './subjects.css';


function Subjects() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semesterDates, setSemesterDates] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showCgpaDetails, setShowCgpaDetails] = useState(false);
  const [nextExam, setNextExam] = useState(null);
  const cardColors = ['purple', 'blue', 'green', 'pink', 'teal', 'orange'];

  const [selectedCourse, setSelectedCourse] = useState(() => {
    const rawUser = JSON.parse(localStorage.getItem('forensync_user')) || {};
    return rawUser.programId || "btech-mtech-cybersecurity";
  });
  const [viewingSemester, setViewingSemester] = useState(() => {
    const rawUser = JSON.parse(localStorage.getItem('forensync_user')) || {};
    return rawUser.semesterId || "sem-1";
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("forensync_user");
    if (!savedUser) {
      navigate("/login");
      return;
    }

    const parsedUser = JSON.parse(savedUser);
    setUser(parsedUser);

    console.log('FIREBASE QUERY PATH:', selectedCourse, viewingSemester);

    fetch(`${import.meta.env.VITE_API_URL}/syllabus/${selectedCourse}/${viewingSemester}`)
      .then(res => res.json())
      .then(data => {
        if (data.subjects && !data.error) {
          setSubjects(data.subjects);
        } else {
          setSubjects([]);
        }
        setLoading(false);
      })
      .catch(err => {
        setSubjects([]);
        setLoading(false);
      });
  }, [navigate, selectedCourse, viewingSemester]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/exams/${selectedCourse}/${viewingSemester}`)
      .then(res => res.json())
      .then(data => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const futureExams = data.filter(exam => {
          const eDate = new Date(exam.examDate);
          eDate.setHours(0, 0, 0, 0);
          return eDate >= today;
        });

        if (futureExams.length > 0) {
          const closestExam = futureExams[0];
          const eDate = new Date(closestExam.examDate);
          eDate.setHours(0, 0, 0, 0);
          const diffTime = eDate - today;
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setNextExam({ ...closestExam, daysLeft });
        } else {
          setNextExam(null);
        }
      })
      .catch(err => console.error("Error fetching next exam:", err));
  }, [selectedCourse, viewingSemester]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/semester-info/${selectedCourse}/${viewingSemester}`)
      .then(res => res.json())
      .then(data => {
        if (data.startDate && data.endDate) {
          setSemesterDates({ start: data.startDate, end: data.endDate });
        } else {
          setSemesterDates(null);
        }
      })
      .catch(err => console.error("Error fetching dates:", err));
  }, [viewingSemester, selectedCourse]);

  const getSemesterProgress = () => {
    if (!semesterDates) return 0;
    const startDate = new Date(semesterDates.start);
    const endDate = new Date(semesterDates.end);
    const today = new Date();
    if (today < startDate) return 0;
    if (today > endDate) return 100;
    const totalDays = (endDate - startDate) / (1000 * 60 * 60 * 24);
    const passedDays = (today - startDate) / (1000 * 60 * 60 * 24);
    return Math.round((passedDays / totalDays) * 100);
  };

  const progressPercentage = getSemesterProgress();

  if (!user) return <div className="home-dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}><LoadingState text="Loading your dashboard..." /></div>;

  const isPureFaculty = user.role === 'Admin' && (!user.adminType || user.adminType === 'Teacher' || user.adminType === 'Administrator');

  const sgpas = [];
  let totalSgpa = 0;
  if (user) {
    for (const key in user) {
      const match = key.match(/^semester(\d+)SGPA$/);
      if (match) {
        const semNum = parseInt(match[1], 10);
        const val = user[key];
        if (typeof val === 'number') {
          sgpas.push({ sem: semNum, score: val });
        }
      }
    }
    if (user.summer2024SGPA && typeof user.summer2024SGPA === 'number') {
      sgpas.push({ sem: 2, score: user.summer2024SGPA });
    }
  }

  sgpas.sort((a, b) => a.sem - b.sem);

  const uniqueSgpas = [];
  const seenSems = new Set();
  sgpas.forEach(item => {
    if (!seenSems.has(item.sem)) {
      seenSems.add(item.sem);
      uniqueSgpas.push(item);
    }
  });

  const validTotal = uniqueSgpas.reduce((acc, curr) => acc + curr.score, 0);
  const calcCgpa = uniqueSgpas.length > 0 ? (validTotal / uniqueSgpas.length).toFixed(2) : null;
  const displayCgpa = calcCgpa || user?.cgpa || "--";

  return (
    <Skeleton name="subjects-dashboard" loading={loading}>
      <div className="home-dashboard">

        <div className="dashboard-left">
          <div className="welcome-banner">
            <div className="welcome-content">
              <span className="welcome-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><Sparkles size={14} /> Welcome back</span>
              <h1>Hello, {user.name.split(' ')[0]}</h1>
              <p>
                {isPureFaculty
                  ? "You are viewing the dashboard as Faculty. Select a semester below to browse materials."
                  : `You're making great progress in ${user.semesterId?.toUpperCase()}. Let's keep the focus sharp.`}
              </p>
            </div>

            {!isPureFaculty && (
              <div className="progress-circle-container">
                <div
                  className="progress-circle"
                  style={{
                    background: `radial-gradient(closest-side, var(--bg-card) 79%, transparent 80% 100%), conic-gradient(var(--accent-blue) ${progressPercentage}%, var(--border-color) 0)`
                  }}
                >
                  <span className="percentage">{progressPercentage}%</span>
                  <span className="label">SEMESTER</span>
                </div>
              </div>
            )}
          </div>

          <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '30px', flexWrap: 'wrap', gap: '15px' }}>
            <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="icon" style={{ display: 'flex', alignItems: 'center', color: 'var(--accent-blue)' }}><BookOpen size={24} /></span>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--text-primary)' }}>Study Materials</h3>
            </div>

            <div className="header-filters" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <select
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-card)', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
              >
                <option value="btech-mtech-cybersecurity">B.Tech-M.Tech Cybersecurity</option>
                <option value="bsc-msc-forensic">BSc-MSc Forensic Science</option>
              </select>

              <select
                value={viewingSemester}
                onChange={(e) => setViewingSemester(e.target.value)}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '2px solid var(--border-color)', backgroundColor: 'var(--bg-card)', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}
              >
                <option value="sem-1">Semester 1</option>
                <option value="sem-2">Semester 2</option>
                <option value="sem-3">Semester 3</option>
                <option value="sem-4">Semester 4</option>
              </select>
            </div>
          </div>

          <div className="subjects-grid">
            {subjects.length === 0 ? (
              <div style={{ padding: '20px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-card)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                No subjects found for this semester yet.
              </div>
            ) : (
              subjects.map((sub, index) => {
                const IconComponent = subjectIconMap[sub.id] || Book;

                return (
                  <motion.div
                    className="subject-card"
                    key={sub.id || index}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/notes/${selectedCourse}/${viewingSemester}/${encodeURIComponent(sub.id)}`)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
                  >
                    <div className={`card-accent accent-${cardColors[index % cardColors.length]}`}></div>

                    {sub.hasNotes ? (
                      <span className="status-dot available">✓ Available</span>
                    ) : (
                      <span className="status-dot unavailable">Empty</span>
                    )}

                    <div className="subject-icon-box"><IconComponent size={20} /></div>

                    <h3>{sub.name || sub.id || 'Untitled Subject'}</h3>
                    <p>{sub.teacher || 'TBA'}</p>
                    <div className="card-footer">
                      <span className="subject-code-badge">{sub.id}</span>
                      <span className="arrow-icon">→</span>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </div>

        <div className="dashboard-right">

          <div className="widget next-exam-widget">
            <div className="widget-header">
              <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)' }}>
                  <Clock size={20} />
                </span>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', lineHeight: 1 }}>Next Exam</h3>
                {nextExam && nextExam.daysLeft <= 7 && <span className="urgent-badge" style={{ marginLeft: '4px' }}>Urgent</span>}
              </div>
            </div>

            <div className="countdown">
              {nextExam ? (
                <>
                  <h2>
                    {nextExam.daysLeft < 10 ? `0${nextExam.daysLeft}` : nextExam.daysLeft}
                    <span>days</span>
                  </h2>
                  <p>until {nextExam.name}</p>
                </>
              ) : (
                <>
                  <h2>-- <span>days</span></h2>
                  <p>No upcoming exams</p>
                </>
              )}
            </div>

            <button className="widget-btn-outline" onClick={() => navigate('/exams')}>
              View Details
            </button>
          </div>

          {!isPureFaculty && (
            <div className="mini-stats-row">
              <div
                className="mini-stat-card"
                style={{ position: 'relative', cursor: 'pointer' }}
                onMouseEnter={() => setShowAttendance(true)}
                onMouseLeave={() => setShowAttendance(false)}
              >
                <div className="stat-icon green" style={{ background: '#dcfce7', color: '#166534' }}><BarChart size={18} /></div>

                <h2>{user?.attendance?.total || "--"}%</h2>
                <p>Attendance</p>

                {showAttendance && user?.attendance && (
                  <div className="attendance-details">
                    <h4>Attendance Breakdown</h4>
                    <div className="att-row">
                      <span className="subject-name">Mathematics</span>
                      <span className="subject-score">{user.attendance.math}%</span>
                    </div>
                    <div className="att-row">
                      <span className="subject-name">Prof. Ethics</span>
                      <span className="subject-score">{user.attendance.ethics}%</span>
                    </div>
                  </div>
                )}
              </div>

              <div
                className="mini-stat-card"
                style={{ position: 'relative', cursor: uniqueSgpas.length > 0 ? 'pointer' : 'default' }}
                onMouseEnter={() => setShowCgpaDetails(true)}
                onMouseLeave={() => setShowCgpaDetails(false)}
              >
                <div className="stat-icon blue"><TrendingUp size={18} /></div>
                <h2>{displayCgpa}</h2>
                <p>CGPA</p>

                {showCgpaDetails && uniqueSgpas.length > 0 && (
                  <div className="attendance-details" style={{ zIndex: 100 }}>
                    <h4>SGPA Breakdown</h4>
                    {uniqueSgpas.map(item => (
                      <div className="att-row" key={item.sem}>
                        <span className="subject-name">Semester {item.sem}</span>
                        <span className="subject-score">{item.score}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </Skeleton>
  );
}

export default Subjects;