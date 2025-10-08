// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './styles/globals.css';
import './styles/variables.css';
import './styles/utilities.css';
import './styles/common.css';

// Auth Context
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Dashboard from './pages/dashboard/Dashboard';
import Customers from './pages/customers/Customers';
import Appointments from './pages/appointments/Appointments';
import Payments from './pages/payments/Payments';
import Reports from './pages/reports/Reports';
import Expenses from './pages/expenses/Expenses';
import Services from './pages/services/Services';
import SessionPackages from './pages/session-packages/SessionPackages';
import Users from './pages/users/Users';
import Roles from './pages/roles/Roles';
import Login from './pages/login/Login';
import LaserTracking from './pages/laser-tracking/LaserTracking';
import RegionalThinning from './pages/regional-thinning/RegionalThinning';

// Components
import ProtectedRoute from './components/ProtectedRoute';


function App() {
  return (
    <AuthProvider>
      <Router>
        <div className='App'>
          <Routes>
            {/* Authentication Routes */}
            <Route path='/login' element={<Login />} />

            {/* Protected Routes */}
            <Route path='/' element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path='/dashboard' element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path='/customers' element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            } />

            <Route path='/appointments' element={
              <ProtectedRoute>
                <Appointments />
              </ProtectedRoute>
            } />

            <Route path='/payments' element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            } />
            
            <Route path='/reports' element={
              <ProtectedRoute>
                <Reports />
              </ProtectedRoute>
            } />

            <Route path='/expenses' element={
              <ProtectedRoute>
                <Expenses />
              </ProtectedRoute>
            } />

            <Route path='/services' element={
              <ProtectedRoute>
                <Services />
              </ProtectedRoute>
            } />

            <Route path='/session-packages' element={
              <ProtectedRoute>
                <SessionPackages />
              </ProtectedRoute>
            } />

            <Route path='/users' element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            } />

            <Route path='/roles' element={
              <ProtectedRoute>
                <Roles />
              </ProtectedRoute>
            } />

            <Route path='/laser-tracking' element={
              <ProtectedRoute>
                <LaserTracking />
              </ProtectedRoute>
            } />

            <Route path='/regional-thinning' element={
              <ProtectedRoute>
                <RegionalThinning />
              </ProtectedRoute>
            } />

            {/* Default redirect to login */}
            <Route path='*' element={<Navigate to='/login' replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}


export default App;
