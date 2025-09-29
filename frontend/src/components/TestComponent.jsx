import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestComponent = () => {
  const { user } = useAuth();
  
  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '10px' }}>
      <h2>Test Component - Debug Info</h2>
      <p><strong>User exists:</strong> {user ? 'YES' : 'NO'}</p>
      {user && (
        <div>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Membership:</strong> {user.membership}</p>
          <p><strong>Avatar:</strong> {user.avatar}</p>
        </div>
      )}
    </div>
  );
};

export default TestComponent;