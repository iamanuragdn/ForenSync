// src/Components/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore'; 
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

import campusImage from '../assets/nfsu-campus.jpeg';
import logoImage from '../assets/logo_muted_blue.png';

// Import our custom DevCards
import DevCard from './DevCard';

//Dps
import anuragImage from '../assets/anurag-dp.jpeg';
import reejitImage from '../assets/reejit-dp.png';
import anindyaImage from '../assets/anindya-dp.jpg';
import priyangshuImage from '../assets/priyangshu-dp.png';
import rounakImage from '../assets/rounak-dp.jpeg';

function Login() {
  const navigate = useNavigate();
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem("forensync_user");
    if (savedUser) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const checkUserAndRedirect = async (user) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        localStorage.setItem("forensync_user", JSON.stringify(userSnap.data()));
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      console.error("Error checking user:", err);
      setError("Failed to verify user profile.");
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await checkUserAndRedirect(result.user); 
    } catch (err) {
      console.error(err);
      setError("Failed to sign in with Google.");
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');

    // 🌟 1. Front-End Validation: Check password length before bothering Firebase
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return; // Stops the function right here!
    }

    setLoading(true);
    try {
      let userCredential;
      if (isLoginMode) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      await checkUserAndRedirect(userCredential.user);
    } catch (err) {
      console.error(err);
      
      // 🌟 2. Friendly Error Translations based on Firebase Error Codes
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. If you don't have an account, please click 'Sign up here' below!");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("An account already exists with this email. Please switch to 'Log in'!");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
        // Fallback for any other weird errors
        setError("Oops! Something went wrong. Please try again.");
      }
    }
    setLoading(false);
  };

  const scrollToAbout = () => {
    document.getElementById('about-section').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-wrapper">
      
      {/* 🌟 Master container for layout positioning */}
      <section className="hero-section">
        
        {/* 🌟 Isolated Background & Mask Layer */}
        <div className="hero-background" style={{ backgroundImage: `url(${campusImage})` }}>
          <div className="hero-overlay"></div>
          
          <div className="hero-branding">
            <div className="branding-row">
              <img src={logoImage} alt="ForenSync Logo" className="hero-logo-img" />
              <h1 className="hero-title">ForenSync.</h1>
            </div>
          </div>
        </div>

        {/* 🌟 Subtitle - Removed quotes, added a <br/> for a perfect split, upgraded to h2 */}
        <h2 className="hero-subtitle">
          “Your entire academic world,<br />perfectly synced in one place.”
        </h2>

        {/* 🌟 Scroll indicator (Text unchanged, styling will do the heavy lifting) */}
        <div className="scroll-indicator" onClick={scrollToAbout}>
          <p>Learn more about ForenSync</p>
          <span>↓</span>
        </div>

        {/* 🌟 Login Card Layer - Sits outside the mask to prevent clipping! */}
        <div className="hero-auth-container">
          <div className="auth-glass-card">
            <h3 className="auth-title">{isLoginMode ? "Welcome Back" : "Create Account"}</h3>
            
            {error && <div className="auth-error">{error}</div>}

            <button className="btn-google" onClick={handleGoogleLogin} disabled={loading}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
              Continue with Google
            </button>

            <div className="divider"><span>or with email</span></div>

            <form onSubmit={handleEmailAuth} className="login-form">
              <input 
                type="email" 
                placeholder="University or Personal Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "⏳ Processing..." : (isLoginMode ? "Sign In" : "Sign Up")}
              </button>
            </form>

            <p className="toggle-mode">
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => setIsLoginMode(!isLoginMode)}>
                {isLoginMode ? "Sign up here" : "Log in here"}
              </span>
            </p>
          </div>
        </div>
      </section>

      <section id="about-section" className="about-section">
        <h2>Why ForenSync?</h2>
        <div className="features-grid">
  {/* Card 1 */}
  <div className="feature-card">
    <div className="feature-icon icon-blue">☁️</div>
    <h3>Drive Synced Notes</h3>
    <p>Faculty uploads sync directly to your personalized dashboard.</p>
    <ul className="feature-list">
      <li>Centralized PDF storage</li>
      <li>Auto-categorized by subject</li>
    </ul>
  </div>

  {/* Card 2 */}
  <div className="feature-card">
    <div className="feature-icon icon-purple">📝</div>
    <h3>PYQ & Mock Tests</h3>
    <p>Master your subjects with intelligent exam prep tools.</p>
    <ul className="feature-list">
      <li>5+ years of past papers</li>
      <li>AI-generated practice exams</li>
    </ul>
  </div>

  {/* Card 3 */}
  <div className="feature-card">
    <div className="feature-icon icon-orange">📅</div>
    <h3>Smart Scheduling</h3>
    <p>Never miss a deadline with real-time academic tracking.</p>
    <ul className="feature-list">
      <li>Live exam countdowns</li>
      <li>Syllabus progress bars</li>
    </ul>
  </div>

  {/* Card 4 */}
  <div className="feature-card">
    <div className="feature-icon icon-green">🔒</div>
    <h3>Role-Based Security</h3>
    <p>Enterprise-grade architecture for verified campus access.</p>
    <ul className="feature-list">
      <li>Faculty-only upload portals</li>
      <li>Admin-verified clearance</li>
    </ul>
  </div>
</div>
      </section>

      <section className="team-section">
        <h2>Meet the Development Team</h2>
        <p className="team-subtitle">The team responsible for designing and building the platform.</p>
        
        <div className="team-grid">
          
          <DevCard
            name="Anurag Debnath"
            role="Backend & UI"
            handle="iamanuragdn"
            status="Online"
            portraitUrl={anuragImage}
            avatarUrl={anuragImage}
            githubUrl="https://github.com/iamanuragdn"
            email="iamanuragdn@gmail.com"
          />

          <DevCard
            name="Reejit Maji"
            role="Test Engine & DB"
            handle="reejit"
            status="Online"
            portraitUrl={reejitImage}
            avatarUrl={reejitImage}
            githubUrl="https://github.com/mag-cloud"
            email="reejit@example.com"
          />

          <DevCard
            name="Anindya Bhar"
            role="Frontend"
            handle="anindya"
            status="Online"
            portraitUrl={anindyaImage}
            avatarUrl={anindyaImage}
            githubUrl="https://github.com/anindya-bhar"
            email="anindya@example.com"
          />

          <DevCard
            name="Priyangsha Paul"
            role="Contributor"
            handle="priyangsha"
            status="Online"
            portraitUrl={priyangshuImage}
            avatarUrl={priyangshuImage}
            githubUrl="https://github.com/priyangsha"
            email="priyangsha@example.com"
          />

          <DevCard
            name="Rounak Kundu"
            role="Contributor"
            handle="rounak"
            status="Online"
            portraitUrl={rounakImage}
            avatarUrl={rounakImage}
            githubUrl="https://github.com/RounanKundu202-web"
            email="rounak@example.com"
          />

        </div>
      </section>

    </div>
  );
}

export default Login;