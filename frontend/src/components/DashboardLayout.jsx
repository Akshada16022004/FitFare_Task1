import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import '../styles/DashboardLayout.css';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard/profile':
        return 'Profile Settings';
      case '/dashboard/qr-code':
        return 'My QR Code';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar currentPath={location.pathname} />
      <div className="main-content">
        <Header 
          title={getPageTitle()} 
          onBack={() => navigate(-1)}
        />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;