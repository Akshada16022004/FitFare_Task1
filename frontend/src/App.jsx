// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
// import React from "react";
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// import { AuthProvider, useAuth } from "./contexts/AuthContext";
// import Login from "./pages/Login";
// import Register from "./pages/Register";
// import Dashboard from "./pages/Dashboard";

// function ProtectedRoute({ children }) {
//   const { user } = useAuth();
//   return user ? children : <Navigate to="/login" />;
// }

// function PublicRoute({ children }) {
//   const { user } = useAuth();
//   return !user ? children : <Navigate to="/dashboard" />;
// }

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <Routes>
//           {/* Default redirect */}
//           <Route path="/" element={<Navigate to="/dashboard" />} />

//           {/* Public Routes */}
//           <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
//           <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

//           {/* Protected Dashboard with nested routes */}
//           <Route path="/dashboard/*" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
//         </Routes>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;

// import React from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './contexts/AuthContext';
// import Login from './pages/Login';
// import Register from './pages/Register';
// //import GymDashboard from './pages/GymDashboard';
// import SimpleDashboard from './pages/SimpleDashboard';
// //import InnovativeGymDashboard from './pages/InnovativeGymDashboard';
// import './styles/App.css';


// function ProtectedRoute({ children }) {
//   const { user } = useAuth();
//   return user ? children : <Navigate to="/login" />;
// }

// function PublicRoute({ children }) {
//   const { user } = useAuth();
//   return !user ? children : <Navigate to="/dashboard" />;
// }

// function App() {
//   return (
//     <AuthProvider>
//       <Router>
//         <div className="App">
//           <Routes>
//             <Route path="/" element={<Navigate to="/dashboard" />} />
//             <Route path="/login" element={
//               <PublicRoute>
//                 <Login />
//               </PublicRoute>
//             } />
//             <Route path="/register" element={
//               <PublicRoute>
//                 <Register />
//               </PublicRoute>
//             } />
//             <Route path="/dashboard" element={
//               <ProtectedRoute>
//                 <SimpleDashboard />
//               </ProtectedRoute>
//             } />
//           </Routes>
//         </div>
//       </Router>
//     </AuthProvider>
//   );
// }

// export default App;
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import SimpleDashboard from './pages/SimpleDashboard';
import './styles/App.css';

function BackgroundWrapper({ children }) {
  const location = useLocation();
  
  // Apply background for login and register pages
  const backgroundStyle = {
    minHeight: '100vh',
    width: '100%',
    ...(location.pathname === '/login' || location.pathname === '/register' ? {
      backgroundImage: 'url(/public/back5.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed'
    } : {
      backgroundColor: '#f8f9fa' // Light gray background for other pages
    })
  };

  return (
    <div style={backgroundStyle}>
      {children}
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <BackgroundWrapper>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
            <Route path="/register" element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <SimpleDashboard />
              </ProtectedRoute>
            } />
          </Routes>
        </BackgroundWrapper>
      </Router>
    </AuthProvider>
  );
}

export default App;