import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import '../styles/QRCode.css';

const QRCode = () => {
  const { user } = useAuth();
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate simple QR code without backend
  const generateSimpleQRCode = () => {
    const simpleData = {
      name: user.name,
      email: user.email,
      membership: user.membership,
      timestamp: new Date().toISOString(),
      message: "Connect with me!"
    };
    
    setQrData({
      qrCode: 'data:image/svg+xml;base64,', // dummy data
      userData: simpleData
    });
  };

  const generateQRCode = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('Generating QR code for user:', user);
      const response = await axios.post('/api/qrcode/generate');
      console.log('QR code response:', response.data);
      setQrData(response.data);
    } catch (error) {
      console.error('QR code generation failed:', error);
      setError('Backend QR generation failed. Using simple version.');
      // Fallback to simple QR code
      generateSimpleQRCode();
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    try {
      const svgElement = document.querySelector('svg');
      if (svgElement) {
        const svgData = new XMLSerializer().serializeToString(svgElement);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `${user.name}_qrcode.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        };
        
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
  };

  if (!user) {
    return (
      <div className="qr-code">
        <div className="qr-container">
          <div className="qr-placeholder">
            <p>Loading user data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="qr-code">
      <div className="qr-container">
        {error && <div className="error-message">{error}</div>}
        
        {!qrData ? (
          <div className="qr-placeholder">
            <h3>Generate Your QR Code</h3>
            <p>Click below to create your personal QR code</p>
            <p><strong>Current User:</strong> {user.name} ({user.email})</p>
            
            <button onClick={generateQRCode} disabled={loading} className="generate-btn">
              {loading ? '⏳ Generating...' : '✨ Generate QR Code'}
            </button>
            
            <div style={{ marginTop: '30px', padding: '20px', background: '#f0f8ff', borderRadius: '10px' }}>
              <h4>Quick Test QR:</h4>
              <QRCodeSVG 
                value={`Name: ${user.name}\nEmail: ${user.email}\nMembership: ${user.membership}`}
                size={120}
                level="M"
              />
              <p style={{ fontSize: '12px', marginTop: '10px' }}>This simple QR should always display</p>
            </div>
          </div>
        ) : (
          <>
            <div className="qr-card">
              <h3>Your QR Code</h3>
              <div className="qr-code-display">
                <QRCodeSVG 
                  value={JSON.stringify(qrData.userData)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="qr-user-info">
                <h3>{user.name}'s QR Code</h3>
                <p className="qr-description">Scan to connect with {user.name}</p>
                <div className="qr-meta">
                  <span className="membership-badge">{user.membership}</span>
                </div>
              </div>
            </div>
            
            <div className="qr-actions">
              <button onClick={downloadQRCode} className="download-btn">
                📥 Download
              </button>
              <button onClick={() => setQrData(null)} className="generate-new-btn">
                🔄 New QR
              </button>
            </div>

            <div className="qr-info">
              <h4>QR Contains:</h4>
              <pre>{JSON.stringify(qrData.userData, null, 2)}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QRCode;