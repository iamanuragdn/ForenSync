import React from 'react';
import './DevCard.css';

function DevCard({ name, role, handle, status, portraitUrl, avatarUrl, githubUrl, email }) {
  return (
    <div className="dev-card">

      <div className="card-glow"></div>

      <div className="card-content">
        

        <div className="dev-title-area">
          <h3 className="dev-name">{name}</h3>
          <p className="dev-role">{role}</p>
        </div>


        <div className="dev-photo-wrap">
          <img src={portraitUrl || avatarUrl} alt={name} className="dev-photo" />
        </div>


        <div className="dev-socials">
          <a href={`mailto:${email}`} className="social-link primary">Email</a>
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="social-link secondary">GitHub</a>
        </div>
        
      </div>
    </div>
  );
}

export default DevCard;