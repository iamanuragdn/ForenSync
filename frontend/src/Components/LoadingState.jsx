import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingState = ({ text = "Loading...", compact = false }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: compact ? 'row' : 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: compact ? '8px' : '24px'
    }}>
      <style>
        {`
          @keyframes customSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .custom-spin-loader {
            animation: customSpin 0.9s infinite linear;
          }
        `}
      </style>
      <Loader2 className="custom-spin-loader" size={compact ? 16 : 24} />
      <span style={{ fontSize: compact ? '0.85rem' : '1rem', color: 'var(--text-secondary)' }}>
        {text}
      </span>
    </div>
  );
};

export default LoadingState;
