import React from 'react';
import { motion } from 'framer-motion';
import './DevCard.css';

function DevCard({ name, role, handle, status, portraitUrl, avatarUrl, githubUrl, email, delay = 0.1 }) {
  return (
    <motion.div 
      className="dev-card"
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, margin: "-30px" }} 
      transition={{ delay }} 
    >

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
    </motion.div>
  );
}

export default DevCard;