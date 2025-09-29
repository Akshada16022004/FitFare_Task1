// import React from "react";
// import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
// import DashboardLayout from "../components/DashboardLayout";
// import Profile from "../components/Profile";
// import QRCode from "../components/QRCode";

// const Dashboard = () => {
//   const navigate = useNavigate();

//   return (
//     <DashboardLayout>
//       {/* Navigation buttons go OUTSIDE <Routes> */}
//       <div style={{ marginBottom: "1rem" }}>
//         <button onClick={() => navigate("profile")}>Go to Profile</button>
//         <button onClick={() => navigate("qr-code")}>Go to QR Code</button>
//       </div>

//       {/* Routes only contain Route components */}
//       <Routes>
//         {/* Default redirect to profile */}
//         <Route index element={<Navigate to="profile" replace />} />
//         <Route path="profile" element={<Profile />} />
//         <Route path="qr-code" element={<QRCode />} />
//       </Routes>
//     </DashboardLayout>
//   );
// };

// export default Dashboard;
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Profile from '../components/Profile';
import QRCode from '../components/QRCode';
import TestComponent from '../components/TestComponent'; // Add this

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="qr-code" element={<QRCode />} />
        <Route path="test" element={<TestComponent />} /> {/* Add test route */}
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;