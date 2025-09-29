 import React from 'react';
 import { Link, useLocation } from 'react-router-dom';
 import { useAuth } from '../contexts/AuthContext';
 import '../styles/Sidebar.css';

 const Sidebar = ({ currentPath }) => {
   const { user, logout } = useAuth();

   const menuItems = [
    //  {
    //    path: '/dashboard/profile',
    //    icon: '👤',
    //    label: 'Profile',
    //    active: currentPath === '/dashboard/profile'
    //  },
    //  {
    //    path: '/dashboard/qr-code',
    //    icon: '📱',
    //    label: 'QR Code',
    //    active: currentPath === '/dashboard/qr-code'
    //  }
    // In the menuItems array, add:
{
  path: '/dashboard/test',
  icon: '🐛',
  label: 'Test',
  active: currentPath === '/dashboard/test'
}
   ];

   return (
     <div className="sidebar">
       <div className="sidebar-header">
         <h2>Dashboard</h2>
         <div className="user-welcome">
           <span>Welcome, {user?.name}</span>
         </div>
       </div>
       <nav className="sidebar-nav">
         {menuItems.map((item) => (
<Link
             key={item.path}
             to={item.path}
             className={`nav-item ${item.active ? 'active' : ''}`}
           >
             <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>/           </Link>
         ))}
       </nav>
       <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn">
           🚪 Logout
        </button>
      </div>
     </div>
  );
 };

 export default Sidebar;


