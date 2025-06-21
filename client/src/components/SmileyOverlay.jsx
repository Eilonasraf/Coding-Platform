// client/src/components/SmileyOverlay.jsx
import React from 'react';

export default function SmileyOverlay({ onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0,
      width: '100%', height: '100%',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffd700',
      zIndex: 9999
    }}>
      <div style={{ fontSize: '6rem', marginBottom: '1rem' }}>😊</div>
      <button
        onClick={onClose}
        style={{
          fontSize: '1.25rem',
          padding: '0.75rem 1.5rem',
          borderRadius: '8px',
          border: 'none',
          background: '#ffd700',
          color: '#333',
          cursor: 'pointer'
        }}
      >
        OK
      </button>
    </div>
  );
}