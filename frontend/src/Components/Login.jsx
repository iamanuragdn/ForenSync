import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from '../firebase'; 
import { doc, getDoc } from 'firebase/firestore'; 
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut } from 'firebase/auth';
import './Login.css';

import campusImage from '../assets/nfsu-campus.jpeg';
import logoImage from '../assets/logo_muted_blue.png';

import DevCard from './DevCard';

import anuragImage from '../assets/anurag-dp.jpeg';
import reejitImage from '../assets/reejit-dp.png';
import anindyaImage from '../assets/anindya-dp.jpg';
import priyangshuImage from '../assets/priyangshu-dp.png';
import rounakImage from '../assets/rounak-dp.jpeg';

function Login() {
  const navigate = useNavigate();
  
  const [theme, setTheme] = useState(() => localStorage.getItem('forensync_theme') || 'light');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('forensync_theme', theme);
  }, [theme]);
  
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

  const handleForgotPassword = async () => {
    setError('');
    if (!email) {
      setError("Please type your email into the box first, then click 'Forgot Password'.");
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setError("Success! 📩 We've sent a password reset link to your email.");
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        // Firebase recently changed security rules to not reveal if an email exists or not, 
        // so a generic error is safest here.
        setError("If an account exists with this email, a reset link has been sent.");
      }
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return; 
    }

    setLoading(true);
    try {
      let userCredential;
      
      if (isLoginMode) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          setError("Please verify your email address before logging in. Check your inbox for the link!");
          setLoading(false);
          return;
        }

      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        await sendEmailVerification(userCredential.user);
        
        await signOut(auth);
        
        setIsLoginMode(true);
        setError("Account created! 📩 We've sent a verification link to your email. Please click it before logging in.");
        setLoading(false);
        return; 

      }

      await checkUserAndRedirect(userCredential.user);

    } catch (err) {
      console.error(err);
      
      if (err.code === 'auth/invalid-credential') {
        setError("Invalid email or password. If you don't have an account, please click 'Sign up here' below!");
      } else if (err.code === 'auth/email-already-in-use') {
        setError("An account already exists with this email. Please switch to 'Log in'!");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else if (err.code === 'auth/network-request-failed') {
        setError("Network error. Please check your internet connection.");
      } else {
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
      
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 100, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', transition: 'all 0.2s ease' }}
        title="Toggle Theme"
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <section className="hero-section">
        
        <div className="hero-background" style={{ backgroundImage: `url(${campusImage})` }}>
          <div className="hero-overlay"></div>
          
          <div className="hero-branding">
            <div className="branding-row">
              <img src={logoImage} alt="ForenSync Logo" className="hero-logo-img" />
              <h1 className="hero-title">ForenSync.</h1>
            </div>
          </div>
        </div>

        <h2 className="hero-subtitle">
          “Your entire academic world,<br />perfectly synced in one place.”
        </h2>

        <div className="scroll-indicator" onClick={scrollToAbout}>
          <p>Learn more about ForenSync</p>
          <span>↓</span>
        </div>

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

              {isLoginMode && (
                <p className="forgot-password" onClick={handleForgotPassword}>
                  Forgot Password?
                </p>
              )}
              
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
  <div className="feature-card">
    <div className="feature-icon icon-blue">☁️</div>
    <h3>Drive Synced Notes</h3>
    <p>Faculty uploads sync directly to your personalized dashboard.</p>
    <ul className="feature-list">
      <li>Centralized PDF storage</li>
      <li>Auto-categorized by subject</li>
    </ul>
  </div>

  <div className="feature-card">
    <div className="feature-icon icon-purple">📝</div>
    <h3>PYQ & Mock Tests</h3>
    <p>Master your subjects with intelligent exam prep tools.</p>
    <ul className="feature-list">
      <li>5+ years of past papers</li>
      <li>AI-generated practice exams</li>
    </ul>
  </div>

  <div className="feature-card">
    <div className="feature-icon icon-orange">📅</div>
    <h3>Smart Scheduling</h3>
    <p>Never miss a deadline with real-time academic tracking.</p>
    <ul className="feature-list">
      <li>Live exam countdowns</li>
      <li>Syllabus progress bars</li>
    </ul>
  </div>

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