// SimpleDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';

const SimpleDashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({ name: '', email: '', membership: 'Basic', avatar: '' });
  const [qrData, setQrData] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareStatus, setShareStatus] = useState('');
  const qrContainerRef = useRef(null);

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
      await axios.put('/api/users/profile', profileData);
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
    } catch {
      setQrData({
        qrCode: 'simple',
        userData: {
          name: user?.name,
          email: user?.email,
          membership: user?.membership,
          userId: user?.id,
          timestamp: new Date().toISOString(),
          profileUrl: `${window.location.origin}/user/${user?.id}`,
          message: 'Scan to connect with me!'
        }
      });
    } finally { setLoading(false); }
  };

  const svgToPngBlob = (svg, scale = 2) => new Promise((resolve, reject) => {
    try {
      const svgData = new XMLSerializer().serializeToString(svg);
      const blob = new Blob([svgData], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((pngBlob) => { URL.revokeObjectURL(url); pngBlob ? resolve(pngBlob) : reject(); }, 'image/png');
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(); };
      img.src = url;
    } catch { reject(); }
  });

  const downloadQRCode = async () => {
    if (!qrContainerRef.current) return setShareStatus('❌ No QR code found.');
    const svg = qrContainerRef.current.querySelector('svg');
    if (!svg) return setShareStatus('❌ No QR code SVG found.');
    try {
      const blob = await svgToPngBlob(svg, 2);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${user?.name || 'profile'}_qrcode.png`;
      a.click();
      URL.revokeObjectURL(url);
      setShareStatus('✅ QR code downloaded!');
    } catch { setShareStatus('❌ Download failed.'); }
  };

  const shareViaNative = async () => {
    if (!qrContainerRef.current) return setShareStatus('❌ No QR code found.');
    const svg = qrContainerRef.current.querySelector('svg');
    if (!svg) return setShareStatus('❌ No QR code SVG found.');
    try {
      setShareStatus('⏳ Preparing QR image...');
      const blob = await svgToPngBlob(svg, 2);
      const file = new File([blob], `${user?.name || 'profile'}_qrcode.png`, { type: 'image/png' });
      const profileLink = `${window.location.origin}/user/${user?.id}`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `Connect with ${user?.name || 'me'}`, text: `Scan this QR to connect!` });
        setShareStatus('✅ QR code shared successfully!');
        return;
      }

      if (navigator.share) {
        await navigator.share({ title: `Connect with ${user?.name || 'me'}`, text: `Connect with ${user?.name || ''}!`, url: profileLink });
        setShareStatus('✅ Profile link shared (image not supported).');
      } else {
        const imgUrl = URL.createObjectURL(blob);
        window.open(imgUrl, '_blank');
        setShareStatus('🔀 Opened QR image in new tab.');
        setTimeout(() => URL.revokeObjectURL(imgUrl), 2000);
      }
    } catch (err) {
      console.error(err);
      setShareStatus('❌ Sharing failed.');
    }
  };

  const copyProfileLink = async () => {
    try {
      const profileLink = `${window.location.origin}/user/${user?.id}`;
      await navigator.clipboard.writeText(profileLink);
      setShareStatus('✅ Profile link copied!');
    } catch { setShareStatus('❌ Could not copy link.'); }
  };

  const isNativeShare = typeof navigator !== 'undefined' && !!navigator.canShare;

  if (!user) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#3498db', color:'#fff' }}>Loading user data...</div>;

  return (
    <div style={{ height:'100vh', width:'100vw', overflow:'hidden' }}>
      {/* Header */}
       <div style={{ position:'fixed', top:0, left:0, right:0, height:'60px', display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0 20px', background:'rgba(0,0,0,0.85)', color:'#fff', zIndex:1000 }}>
        <div style={{ fontWeight:'bold', fontSize:'20px' }}>FitFare User Dashboard</div>
        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
          {user.avatar && <img src={user.avatar} style={{ width:'35px', height:'35px', borderRadius:'50%' }} />}
          {/* <span>{user.name}</span> */}
          <span
  style={{
    whiteSpace: 'nowrap',      // keeps it in one line
    //overflow: 'hidden',        // hides overflow
    //textOverflow: 'ellipsis',  // shows "..." if too long
    fontWeight: 500,
    maxWidth: '450px',         // adjust width as needed
    //display: 'inline-block',
  }}
  title={user.name}            // tooltip on hover
>
  {user.name}
</span>

          <button onClick={logout} style={{ padding:'8px 15px', background:'#e74c3c', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' }}>Logout</button>
        </div>
      </div> 
      {/* Header */}




      {/* Tabs */}
      <div style={{ position:'fixed', top:'60px', left:0, right:0, display:'flex', background:'rgba(0,0,0,0.6)', zIndex:999 }}>
        <button onClick={()=>setActiveTab('profile')} style={{ flex:1, padding:'15px', background: activeTab==='profile'?'#3498db':'transparent', color:'#fff', border:'none', cursor:'pointer' }}>👤 Profile</button>
        <button onClick={()=>setActiveTab('qrcode')} style={{ flex:1, padding:'15px', background: activeTab==='qrcode'?'#3498db':'transparent', color:'#fff', border:'none', cursor:'pointer' }}>📱 QR Code</button>
      </div>

      {/* Content */}
      <div style={{ paddingTop:'120px', minHeight:'calc(100vh - 120px)', overflowY:'auto' }}>
       {/* Profile Tab */}
{/* {activeTab==='profile' && (
  <div style={{
    minHeight:'calc(100vh - 120px)',
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    backgroundImage:"url('/background1.jpg')",
    backgroundSize:'cover',
    backgroundPosition:'center'
  }}>
    <div style={{ 
      background:'rgba(255,255,255,0.85)', 
      padding:'30px', 
      borderRadius:'12px', 
      width:'400px',
      textAlign: 'center'
    }}>
      <h2>Profile Settings</h2>
      <div style={{ margin:'15px 0' }}>
        {profileData.avatar 
          ? <img src={profileData.avatar} style={{ width:'100px', height:'100px', borderRadius:'50%' }} /> 
          : <div style={{ width:'100px', height:'100px', borderRadius:'50%', background:'#ccc', margin:'0 auto' }} />
        }
        <div style={{ display:'flex', justifyContent:'center', gap:'10px', marginTop:'10px' }}>
          <input type="file" id="avatarInput" accept="image/*" style={{ display:'none' }} 
            onChange={e=>{ const f=e.target.files[0]; if(f){ setProfileData({...profileData,avatar:URL.createObjectURL(f)}); e.target.value=null; }}} 
          />
          <label htmlFor="avatarInput" style={{ height:'50px',width:'80px', padding:'8px', background:'#0984e3', color:'#fff', borderRadius:'8px', cursor:'pointer' }}>
            {profileData.avatar ? 'Change' : 'Upload'}
          </label>
          {profileData.avatar && 
            <button onClick={()=>setProfileData({...profileData,avatar:''})} 
              style={{ height:'50px',width:'800px', padding:'8px', background:'#e74c3c', color:'#fff', borderRadius:'8px', cursor:'pointer' }}>
              Remove
            </button>
          }
        </div> 
      </div>
      <form onSubmit={handleProfileUpdate}>
        <input type="text" value={profileData.name} onChange={e=>setProfileData({...profileData,name:e.target.value})} placeholder="Full Name" style={{ width:'100%', padding:'10px', margin:'8px 0' }} />
        <input type="email" value={profileData.email} onChange={e=>setProfileData({...profileData,email:e.target.value})} placeholder="Email" style={{ width:'100%', padding:'10px', margin:'8px 0' }} />
        <select value={profileData.membership} onChange={e=>setProfileData({...profileData,membership:e.target.value})} style={{ width:'100%', padding:'10px', margin:'8px 0' }}>
          <option>Basic</option>
          <option>Premium</option>
          <option>Enterprise</option>
        </select>
        <button type="submit" style={{ width:'100%', padding:'12px', background:'#3498db', color:'#fff', border:'none', borderRadius:'8px', marginTop:'10px' }}>
          Save Changes
        </button>
      </form>
      {message && <p style={{ marginTop:'10px' }}>{message}</p>}
    </div>
  </div>
)} */}
{/* Profile Tab */}
{/* Profile Tab */}
{activeTab === 'profile' && (
  <div style={{
    minHeight: 'calc(100vh - 120px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundImage: "url('/background1.jpg')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    padding: '10px'
  }}>
    <div style={{ 
      background: 'rgba(255,255,255,0.95)', 
      padding: '20px', 
      borderRadius: '10px', 
      width: '100%',
      maxWidth: '450px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    }}>
      {/* Compact Header */}
      <div style={{ textAlign: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#2d3748', fontSize: '24px', marginBottom: '3px' }}>Profile Settings</h2>
        <p style={{ color: '#718096', fontSize: '13px' }}>Manage your account information</p>
      </div>

      {/* Larger Avatar Section */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div 
          style={{ 
            position: 'relative',
            display: 'inline-block',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
          onClick={() => document.getElementById('avatarInput').click()}
        >
          {profileData.avatar ? (
            <div style={{ position: 'relative' }}>
              <img 
                src={profileData.avatar} 
                alt="Profile Avatar" 
                style={{ 
                  width: '100px', // Increased size
                  height: '100px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '4px solid #25D366',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.borderColor = '#128C7E';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.borderColor = '#25D366';
                }}
              />
              <div style={{
                position: 'absolute',
                bottom: '5px',
                right: '5px',
                background: '#25D366',
                color: 'white',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}>
                ✏️
              </div>
            </div>
          ) : (
            <div 
              style={{ 
                width: '100px', // Increased size
                height: '100px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #25D366, #128C7E)', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '36px',
                border: '4px solid #25D366',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.background = 'linear-gradient(135deg, #128C7E, #25D366)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.background = 'linear-gradient(135deg, #25D366, #128C7E)';
              }}
            >
              👤
            </div>
          )}
        </div>

        <p style={{ color: '#718096', fontSize: '12px', margin: '8px 0 10px 0' }}>
          Click on the avatar to change profile photo
        </p>

        <input 
          type="file" 
          id="avatarInput" 
          accept="image/*"
          style={{ display: 'none' }} 
          onChange={(e) => { 
            const file = e.target.files[0]; 
            if (file) { 
              setProfileData({...profileData, avatar: URL.createObjectURL(file)}); 
              e.target.value = null; 
            }
          }} 
        />

        {profileData.avatar && (
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={() => document.getElementById('avatarInput').click()} 
              style={{
                padding: '8px 16px',
                background: '#25D366',
                color: 'white',
                borderRadius: '18px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.target.style.background = '#128C7E'}
              onMouseLeave={(e) => e.target.style.background = '#25D366'}
            >
              🔄 Change
            </button>
            <button 
              onClick={() => setProfileData({...profileData, avatar: ''})} 
              style={{
                padding: '8px 16px',
                background: 'transparent',
                color: '#ef4444',
                borderRadius: '18px',
                border: '1px solid #ef4444',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#ef4444';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#ef4444';
              }}
            >
              🗑️ Remove
            </button>
          </div>
        )}
      </div>

      {/* Compact Form to Balance Space */}
      <form onSubmit={handleProfileUpdate}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '600', 
            color: '#4a5568',
            fontSize: '13px'
          }}>
            Full Name
          </label>
          <input 
            type="text" 
            value={profileData.name} 
            onChange={e => setProfileData({...profileData, name: e.target.value})} 
            placeholder="Enter your full name" 
            style={{ 
              width: '100%', 
              padding: '10px 10px', 
              border: '1px solid #e2e8f0', 
              borderRadius: '6px',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#25D366'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '600', 
            color: '#4a5568',
            fontSize: '13px'
          }}>
            Email Address
          </label>
          <input 
            type="email" 
            value={profileData.email} 
            onChange={e => setProfileData({...profileData, email: e.target.value})} 
            placeholder="Enter your email" 
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              border: '1px solid #e2e8f0', 
              borderRadius: '6px',
              fontSize: '14px',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#25D366'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '6px', 
            fontWeight: '600', 
            color: '#4a5568',
            fontSize: '13px'
          }}>
            Membership Plan
          </label>
          <select 
            value={profileData.membership} 
            onChange={e => setProfileData({...profileData, membership: e.target.value})} 
            style={{ 
              width: '100%', 
              padding: '10px 12px', 
              border: '1px solid #e2e8f0', 
              borderRadius: '6px',
              fontSize: '14px',
              background: 'white',
              transition: 'all 0.3s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#25D366'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="Basic">🎯 Basic Plan</option>
            <option value="Premium">🚀 Premium Plan</option>
            <option value="Enterprise">🏢 Enterprise Plan</option>
          </select>
        </div>

        {/* Save Button - Always Visible */}
        <button 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: '12px', 
            background: 'linear-gradient(135deg, #25D366, #128C7E)', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = 'linear-gradient(135deg, #128C7E, #25D366)'}
          onMouseLeave={(e) => e.target.style.background = 'linear-gradient(135deg, #25D366, #128C7E)'}
        >
          💾 Save Changes
        </button>
      </form>

      {message && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          background: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          borderRadius: '6px',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          {message.includes('✅') ? '✅' : '⚠️'} {message}
        </div>
      )}
    </div>
  </div>
)}


       {/* QR Code Tab */}
{activeTab==='qrcode' && (
  <div style={{
    minHeight:'calc(100vh - 120px)',
    display:'flex',
    justifyContent:'center',
    alignItems:'center',
    backgroundImage:"url('/back2.jpg')", // your QR tab background
    backgroundSize:'cover',
    backgroundPosition:'center',
    padding:'20px'
  }}>
    <div style={{
      background:'rgba(255,255,255,0.9)',
      padding:'30px',
      borderRadius:'15px',
      width:'90%',
      maxWidth:'450px',
      textAlign:'center'
    }}>
      <h2>📱 Your QR Code</h2>

      {shareStatus && (
        <div style={{
          margin:'10px 0',
          padding:'10px',
          borderRadius:'8px',
          background: shareStatus.includes('✅') ? '#d4edda' : '#f8d7da',
          color: shareStatus.includes('✅') ? '#155724' : '#721c24',
          fontSize:'14px'
        }}>
          {shareStatus}
        </div>
      )}

      {!qrData ? (
        <button onClick={generateQRCode} disabled={loading} style={{ width:'100%', padding:'12px', background:'#3498db', color:'#fff', border:'none', borderRadius:'8px', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '⏳ Generating...' : 'Generate QR Code'}
        </button>
      ) : (
        <>
          <div ref={qrContainerRef} style={{ margin:'20px auto', padding:'15px', background:'#fff', borderRadius:'12px', display:'inline-block' }}>
            <QRCodeSVG value={JSON.stringify(qrData.userData)} size={200} level="H" includeMargin />
          </div>

          <div style={{ display:'flex', flexWrap:'wrap', justifyContent:'center', gap:'10px', marginTop:'15px' }}>
            <button onClick={downloadQRCode} style={{ flex:'1 1 130px', padding:'10px', background:'#00b894', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' }}>📥 Download</button>
            {navigator.canShare && (
              <button onClick={shareViaNative} style={{ flex:'1 1 130px', padding:'10px', background:'#0984e3', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' }}>📤 Share</button>
            )}
            <button onClick={()=>setQrData(null)} style={{ flex:'1 1 130px', padding:'10px', background:'#636e72', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' }}>🔄 New QR</button>
            <button onClick={copyProfileLink} style={{ flex:'1 1 130px', padding:'10px', background:'#e17055', color:'#fff', border:'none', borderRadius:'8px', cursor:'pointer' }}>🔗 Copy Link</button>
          </div>
        </>
      )}
    </div>
  </div>
)}

      </div>
    </div>
  );
};

export default SimpleDashboard;

