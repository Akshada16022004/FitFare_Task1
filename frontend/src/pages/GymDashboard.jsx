import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const SimpleDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    membership: 'Basic',
    avatar: ''
  });
  const [qrData, setQrData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const qrRef = useRef(null);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        membership: user.membership || 'Basic',
        avatar: user.avatar || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      const response = await axios.put('/api/users/profile', profileData);
      setMessage('✅ Profile updated successfully!');
    } catch (error) {
      setMessage('❌ Error updating profile: ' + (error.response?.data?.message || 'Please try again'));
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    setLoading(true);
    setShareStatus('');
    try {
      const response = await axios.post('/api/qrcode/generate');
      setQrData(response.data);
    } catch (error) {
      // Enhanced fallback with more user data
      const simpleData = {
        name: user.name,
        email: user.email,
        membership: user.membership,
        userId: user.id,
        timestamp: new Date().toISOString(),
        profileUrl: `${window.location.origin}/user/${user.id}`,
        message: "Scan to connect with me!",
        type: "user_profile",
        version: "1.0"
      };
      setQrData({
        qrCode: 'simple',
        userData: simpleData
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced download with better quality and styling
  const downloadQRCode = () => {
    try {
      const svgElement = qrRef.current;
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Create a larger canvas for better quality
          canvas.width = 400;
          canvas.height = 450;
          
          // Add background styling
          ctx.fillStyle = '#2c3e50';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add header
          ctx.fillStyle = '#3498db';
          ctx.fillRect(0, 0, canvas.width, 60);
          
          // Add text
          ctx.fillStyle = 'white';
          ctx.font = 'bold 18px Arial';
          ctx.fillText(`${user.name}'s Profile`, 20, 35);
          ctx.font = '12px Arial';
          ctx.fillText('Scan QR Code to Connect', 20, 50);
          
          // Draw QR code
          const qrSize = 200;
          const qrX = (canvas.width - qrSize) / 2;
          const qrY = 100;
          ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
          
          // Add footer info
          ctx.fillStyle = '#bdc3c7';
          ctx.font = '10px Arial';
          ctx.fillText(`Generated: ${new Date().toLocaleDateString()}`, 20, canvas.height - 20);
          ctx.fillText(`ID: ${user.id}`, canvas.width - 100, canvas.height - 20);
          
          const pngFile = canvas.toDataURL('image/png', 1.0);
          const downloadLink = document.createElement('a');
          downloadLink.download = `${user.name.replace(/\s+/g, '_')}_profile_qr.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
          setShareStatus('✅ QR code downloaded successfully!');
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      }
    } catch (error) {
      setShareStatus('❌ Download failed. Please try again.');
    }
  };

  // Enhanced native sharing with fallbacks
  const shareViaNative = async () => {
    try {
      if (navigator.share) {
        const profileText = `Connect with ${user.name}! 📱\nEmail: ${user.email}\nMembership: ${user.membership}\nProfile: ${window.location.origin}/user/${user.id}`;
        
        await navigator.share({
          title: `Connect with ${user.name}`,
          text: profileText,
          url: `${window.location.origin}/user/${user.id}`
        });
        setShareStatus('✅ Profile shared successfully!');
      } else {
        // Enhanced fallback - copy to clipboard
        copyProfileLink();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        setShareStatus('❌ Sharing failed. Try download instead.');
      }
    }
  };

  // Enhanced copy functionality
  const copyProfileLink = async () => {
    const profileLink = `${window.location.origin}/user/${user.id}`;
    const profileText = `Connect with ${user.name}!\nEmail: ${user.email}\nMembership: ${user.membership}\nProfile: ${profileLink}`;
    
    try {
      await navigator.clipboard.writeText(profileText);
      setShareStatus('✅ Profile details copied to clipboard!');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = profileText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShareStatus('✅ Profile details copied to clipboard!');
    }
  };

  // Enhanced platform sharing with better messages
  const shareOnPlatform = (platform) => {
    const profileText = `Connect with ${user.name}! 📱\nEmail: ${user.email}\nMembership: ${user.membership}`;
    const profileLink = `${window.location.origin}/user/${user.id}`;
    
    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(profileText + '\n\n' + profileLink)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(profileLink)}&text=${encodeURIComponent(profileText)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent('Check out ' + user.name + "'s profile! " + profileLink)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileLink)}`,
      email: `mailto:?subject=Connect with ${encodeURIComponent(user.name)}&body=${encodeURIComponent(profileText + '\n\nProfile: ' + profileLink)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileLink)}&quote=${encodeURIComponent(profileText)}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
      setShareStatus(`✅ Opening ${platform}...`);
    }
  };

  // Enhanced image sharing
  const shareAsImage = () => {
    try {
      const svgElement = qrRef.current;
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const dataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        window.open(dataUrl, '_blank');
        setShareStatus('✅ QR code opened in new tab. Right-click to save.');
      }
    } catch (error) {
      setShareStatus('❌ Failed to open image. Please try download instead.');
    }
  };

  // New: Copy QR code as image
  const copyQRAsImage = async () => {
    try {
      const svgElement = qrRef.current;
      if (svgElement && navigator.clipboard) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = async () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob(async (blob) => {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
              ]);
              setShareStatus('✅ QR code copied as image!');
            } catch (error) {
              setShareStatus('❌ Image copy not supported. Try download.');
            }
          });
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      } else {
        setShareStatus('❌ Image copy not supported in this browser.');
      }
    } catch (error) {
      setShareStatus('❌ Failed to copy image.');
    }
  };

  if (!user) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        fontSize: '18px'
      }}>
        Loading user data...
      </div>
    );
  }

  // Enhanced navigation button styles
  const navButtonStyle = (isActive) => ({
    flex: 1,
    padding: '20px',
    background: isActive ? '#3498db' : 'transparent',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    position: 'relative',
    overflow: 'hidden'
  });

  // Enhanced generate button style
  const generateButtonStyle = {
    background: loading ? '#95a5a6' : 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
    color: 'white',
    padding: '20px 40px',
    border: 'none',
    borderRadius: '50px',
    cursor: loading ? 'not-allowed' : 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    transform: loading ? 'none' : 'translateY(0)',
    boxShadow: loading ? 'none' : '0 4px 15px rgba(253, 121, 168, 0.3)'
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
          color: 'white',
          padding: '30px',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(52, 152, 219, 0.3)',
            padding: '5px 15px',
            borderRadius: '15px',
            fontSize: '14px'
          }}>
            {user.membership} Member
          </div>
          
          <h1 style={{ margin: '0 0 10px 0', fontSize: '2.5em' }}>🌟 User Dashboard</h1>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <img 
              src={user.avatar} 
              alt="Profile" 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%',
                border: '4px solid #3498db',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }} 
            />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.8em' }}>Welcome, {user.name}!</h2>
              <p style={{ margin: '5px 0', opacity: 0.9 }}>{user.email}</p>
            </div>
            <button 
              onClick={logout}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
                padding: '12px 24px',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              🚪 Logout
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          background: '#34495e',
          borderBottom: '3px solid #3498db'
        }}>
          <button
            onClick={() => setActiveTab('profile')}
            style={navButtonStyle(activeTab === 'profile')}
            onMouseOver={(e) => {
              if (activeTab !== 'profile') {
                e.target.style.background = 'rgba(52, 152, 219, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'profile') {
                e.target.style.background = 'transparent';
              }
            }}
          >
            👤 Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            style={navButtonStyle(activeTab === 'qrcode')}
            onMouseOver={(e) => {
              if (activeTab !== 'qrcode') {
                e.target.style.background = 'rgba(52, 152, 219, 0.3)';
              }
            }}
            onMouseOut={(e) => {
              if (activeTab !== 'qrcode') {
                e.target.style.background = 'transparent';
              }
            }}
          >
            📱 QR Code Generator
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '40px', minHeight: '400px' }}>
          {activeTab === 'profile' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 2fr',
                gap: '30px',
                marginBottom: '30px'
              }}>
                {/* Current Info Card */}
                <div style={{
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  padding: '25px',
                  borderRadius: '15px',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ marginTop: 0 }}>🎯 Current Profile</h3>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '15px', borderRadius: '10px' }}>
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Membership:</strong> 
                      <span style={{
                        background: 'rgba(255,255,255,0.3)',
                        padding: '2px 10px',
                        borderRadius: '10px',
                        marginLeft: '10px',
                        fontSize: '12px'
                      }}>
                        {user.membership}
                      </span>
                    </p>
                    <p><strong>User ID:</strong> {user.id}</p>
                  </div>
                </div>

                {/* Update Form */}
                <form onSubmit={handleProfileUpdate} style={{
                  background: '#f8f9fa',
                  padding: '25px',
                  borderRadius: '15px',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ marginTop: 0, color: '#2c3e50' }}>✏ Edit Profile</h3>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                      Full Name:
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                      Email Address:
                    </label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        transition: 'border-color 0.3s'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#3498db'}
                      onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
                    />
                  </div>

                  <div style={{ marginBottom: '25px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#2c3e50' }}>
                      Membership Level:
                    </label>
                    <select
                      value={profileData.membership}
                      onChange={(e) => setProfileData({...profileData, membership: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e0e0e0',
                        borderRadius: '8px',
                        fontSize: '16px',
                        background: 'white'
                      }}
                    >
                      <option value="Basic">Basic</option>
                      <option value="Premium">Premium</option>
                      <option value="Enterprise">Enterprise</option>
                    </select>
                  </div>

                  {message && (
                    <div style={{
                      padding: '15px',
                      background: message.includes('✅') ? '#d4edda' : '#f8d7da',
                      color: message.includes('✅') ? '#155724' : '#721c24',
                      borderRadius: '8px',
                      marginBottom: '20px',
                      border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
                    }}>
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: loading ? '#95a5a6' : 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
                      color: 'white',
                      padding: '15px 30px',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      width: '100%',
                      transition: 'all 0.3s'
                    }}
                  >
                    {loading ? '⏳ Saving...' : '💾 Save Changes'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'qrcode' && (
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>📱 Your Personal QR Code</h2>
              <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>Generate and share your profile QR code</p>
              
              {shareStatus && (
                <div style={{
                  padding: '15px',
                  background: shareStatus.includes('✅') ? '#d4edda' : '#f8d7da',
                  color: shareStatus.includes('✅') ? '#155724' : '#721c24',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  border: `2px solid ${shareStatus.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                  {shareStatus}
                </div>
              )}
              
              {!qrData ? (
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)',
                    color: 'white',
                    padding: '40px',
                    borderRadius: '15px',
                    marginBottom: '30px'
                  }}>
                    <h3>Generate Your QR Code</h3>
                    <p>Create a shareable QR code with your profile information</p>
                  </div>
                  
                  <button
                    onClick={generateQRCode}
                    disabled={loading}
                    style={generateButtonStyle}
                    onMouseOver={(e) => {
                      if (!loading) {
                        e.target.style.transform = 'translateY(-3px)';
                        e.target.style.boxShadow = '0 15px 30px rgba(253, 121, 168, 0.4)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!loading) {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = '0 4px 15px rgba(253, 121, 168, 0.3)';
                      }
                    }}
                  >
                    {loading ? '⏳ Generating...' : '✨ Generate QR Code'}
                  </button>
                </div>
              ) : (
                <div>
                  {/* QR Code Display */}
                  <div style={{
                    background: 'linear-gradient(135deg, #fd79a8 0%, #fdcb6e 100%)',
                    padding: '30px',
                    borderRadius: '20px',
                    display: 'inline-block',
                    margin: '20px 0',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.1)'
                  }}>
                    <div style={{
                      background: 'white',
                      padding: '20px',
                      borderRadius: '15px',
                      display: 'inline-block'
                    }}>
                      <QRCodeSVG 
                        ref={qrRef}
                        value={JSON.stringify(qrData.userData)}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                  </div>

                  {/* Primary Action Buttons */}
                  <div style={{ margin: '25px 0' }}>
                    <button
                      onClick={downloadQRCode}
                      style={{
                        background: 'linear-gradient(135deg, #00b894 0%, #00a085 100%)',
                        color: 'white',
                        padding: '15px 25px',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        margin: '5px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      📥 Download
                    </button>
                    
                    <button
                      onClick={shareViaNative}
                      style={{
                        background: 'linear-gradient(135deg, #0984e3 0%, #74b9ff 100%)',
                        color: 'white',
                        padding: '15px 25px',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        margin: '5px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      📤 Share
                    </button>

                    <button
                      onClick={copyQRAsImage}
                      style={{
                        background: 'linear-gradient(135deg, #a29bfe 0%, #6c5ce7 100%)',
                        color: 'white',
                        padding: '15px 25px',
                        border: 'none',
                        borderRadius: '25px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        margin: '5px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      📋 Copy Image
                    </button>
                  </div>

                  {/* Social Media Sharing */}
                  <div style={{ margin: '30px 0' }}>
                    <h4 style={{ color: '#2d3436', marginBottom: '15px' }}>Share on Social Media</h4>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      {['whatsapp', 'telegram', 'twitter', 'linkedin'].map(platform => (
                        <button
                          key={platform}
                          onClick={() => shareOnPlatform(platform)}
                          style={{
                            background: platform === 'whatsapp' ? '#25D366' :
                                      platform === 'telegram' ? '#0088cc' :
                                      platform === 'twitter' ? '#1DA1F2' : '#0077b5',
                            color: 'white',
                            padding: '12px 20px',
                            border: 'none',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                          onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                        >
                          {platform === 'whatsapp' ? '💬 WhatsApp' :
                           platform === 'telegram' ? '📢 Telegram' :
                           platform === 'twitter' ? '🐦 Twitter' : '💼 LinkedIn'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div style={{ margin: '20px 0' }}>
                    <button
                      onClick={copyProfileLink}
                      style={{
                        background: 'linear-gradient(135deg, #e17055 0%, #d63031 100%)',
                        color: 'white',
                        padding: '12px 20px',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        margin: '5px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      🔗 Copy Profile Link
                    </button>
                    
                    <button
                      onClick={() => shareOnPlatform('email')}
                      style={{
                        background: 'linear-gradient(135deg, #ea4335 0%, #d93025 100%)',
                        color: 'white',
                        padding: '12px 20px',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        margin: '5px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      📧 Share via Email
                    </button>

                    <button
                      onClick={() => setQrData(null)}
                      style={{
                        background: 'linear-gradient(135deg, #636e72 0%, #2d3436 100%)',
                        color: 'white',
                        padding: '12px 20px',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        margin: '5px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      🔄 New QR Code
                    </button>
                  </div>

                  {/* QR Code Information */}
                  <div style={{
                    background: '#2d3436',
                    color: 'white',
                    padding: '25px',
                    borderRadius: '15px',
                    textAlign: 'left',
                    marginTop: '30px'
                  }}>
                    <h4 style={{ color: '#74b9ff', marginTop: 0 }}>🔍 QR Code Contains</h4>
                    <pre style={{ 
                      background: 'rgba(255,255,255,0.1)', 
                      padding: '20px', 
                      borderRadius: '10px',
                      overflow: 'auto',
                      fontSize: '14px',
                      color: '#dfe6e9'
                    }}>
                      {JSON.stringify(qrData.userData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          background: '#ecf0f1',
          padding: '20px',
          textAlign: 'center',
          color: '#7f8c8d',
          borderTop: '1px solid #bdc3c7'
        }}>
          <p>User Dashboard • Built with React & Node.js</p>
        </div>
      </div>
    </div>
  );
};



export default GymDashboard;