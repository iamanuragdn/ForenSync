import React from 'react';
import './devcard.css';

function DevCard({ name, role, handle, status, portraitUrl, avatarUrl, githubUrl, email }) {
  return (
    <div className="dev-card">
      {/* 🌟 The soft hover glow effect stays! */}
      <div className="card-glow"></div>

      <div className="card-content">
        
        {/* 1. TOP: Name and Role (Just like your sketch!) */}
        <div className="dev-title-area">
          <h3 className="dev-name">{name}</h3>
          <p className="dev-role">{role}</p>
        </div>

        {/* 2. MIDDLE: Big Circular Avatar */}
        <div className="dev-photo-wrap">
          <img src={portraitUrl || avatarUrl} alt={name} className="dev-photo" />
        </div>

        {/* 3. BOTTOM: Functional Buttons side-by-side */}
        <div className="dev-socials">
          <a href={`mailto:${email}`} className="social-link primary">Email</a>
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="social-link secondary">GitHub</a>
        </div>
        
      </div>
    </div>
  );
}

export default DevCard;