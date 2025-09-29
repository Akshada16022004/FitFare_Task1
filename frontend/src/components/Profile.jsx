import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import '../styles/Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    membership: 'Basic',
    avatar: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  // Initialize form data when user loads
  useEffect(() => {
    if (user && !isLoaded) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        membership: user.membership || 'Basic',
        avatar: user.avatar || ''
      });
      setIsLoaded(true);
    }
  }, [user, isLoaded]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.put('/api/users/profile', formData);
      setMessage('✅ Profile updated successfully!');
      console.log('Profile update response:', response.data);
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage('❌ Error updating profile: ' + (error.response?.data?.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="profile">
        <div className="profile-placeholder">
          <p>Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="avatar-section">
          <img src={user.avatar} alt="Profile" className="profile-avatar" />
          <div className="avatar-controls">
            <input
              type="url"
              placeholder="Avatar URL"
              name="avatar"
              value={formData.avatar}
              onChange={handleChange}
              className="avatar-input"
            />
          </div>
        </div>
        <div className="profile-info">
          <h2>{user.name}</h2>
          <span className="membership-badge">{user.membership}</span>
          <p className="join-date">User ID: {user.id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <h3>Edit Profile</h3>
        
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="membership">Membership Level</label>
          <select
            id="membership"
            name="membership"
            value={formData.membership}
            onChange={handleChange}
          >
            <option value="Basic">Basic</option>
            <option value="Premium">Premium</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <button type="submit" disabled={loading} className="save-btn">
          {loading ? '🔄 Saving...' : '💾 Save Changes'}
        </button>
      </form>

      {/* Debug Info */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        fontSize: '12px'
      }}>
        <h4>Debug Information:</h4>
        <p><strong>User Data:</strong> {JSON.stringify(user)}</p>
        <p><strong>Form Data:</strong> {JSON.stringify(formData)}</p>
      </div>
    </div>
  );
};

export default Profile;
