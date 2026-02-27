import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import campusImage from '../assets/nfsu-campus.jpg';
import logoImage from '../assets/logo_muted_blue.png';

function LandingPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("forensync_user");
    if (savedUser) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) return setError("Please enter a username.");

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(`http://localhost:5001/api/users/${username}`);
      if (!response.ok) {
        throw new Error("User not found in the university database.");
      }
      
      const userData = await response.json();
      localStorage.setItem("forensync_user", JSON.stringify(userData));
      navigate("/dashboard"); 
      
    } catch (err) {
      setError(err.message || "Failed to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-container">
      
      {/* Intro */}
      <div className="landing-intro" style={{ backgroundImage: `url(${campusImage})` }}>
        <div className="intro-content">
            <img src={logoImage} alt="ForenSync Logo" className="brand-logo-img" />
          <div className="landing-logo">ForenSync.</div>
          <h1>The ultimate one stop for studies.</h1>
          <p>
            Access your NFSU coursework, generate instant mock tests from past year papers, and keep your notes perfectly synced in one unified dashboard.
          </p>
        </div>
      </div>

      {/* Login */}
      <div className="landing-auth">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p>Enter your username to continue.</p>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleLogin}>
            <input 
              type="text" 
              className="auth-input"
              placeholder="Username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <button type="submit" className="auth-btn" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Sign In to ForenSync"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}

export default LandingPage;