// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Appointments from './pages/Appointments';
import Payments from './pages/Payments';
import Services from './pages/Services';

function App() {
  return (
    <Router>
      <div
        className='App'
        style={{
          backgroundColor: '#f5f5f5',
          minHeight: '100vh',
          padding: '20px',
        }}
      >
        <Routes>
          {/* Ana sayfa - Dashboard */}
          <Route path='/' element={<Dashboard />} />

          {/* Müşteriler sayfası */}
          <Route path='/customers' element={<Customers />} />

          {/* Randevular sayfası */}
          <Route path='/appointments' element={<Appointments />} />

          {/* Ödemeler sayfası */}
          <Route path='/payments' element={<Payments />} />

          {/* Hizmetler sayfası */}
          <Route path='/services' element={<Services />} />

          {/* 404 sayfası - eğer hiçbir route eşleşmezse */}
          <Route path='*' element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

// 404 sayfası bileşeni
const NotFound = () => {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '72px',
            fontWeight: 'bold',
            color: '#333',
            margin: '0 0 16px 0',
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#666',
            margin: '0 0 16px 0',
          }}
        >
          Sayfa Bulunamadı
        </h2>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          Aradığınız sayfa mevcut değil.
        </p>
        <a
          href='/'
          style={{
            padding: '12px 24px',
            backgroundColor: '#4F46E5',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
          }}
        >
          Ana Sayfaya Dön
        </a>
      </div>
    </div>
  );
};

export default App;
