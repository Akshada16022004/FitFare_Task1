// Header.jsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ title }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      height: '60px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 20px',
      background: 'rgba(0,0,0,0.7)',
      color: 'white',
      zIndex: 1000
    }}>
      <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
        {title || 'Dashboard'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        {user && (
          <>
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Avatar"
                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
              />
            ) : (
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#3498db',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {user.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
            <span>{user.name || 'User'}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 12px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
