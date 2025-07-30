import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaMoneyBillWave,
  FaLayerGroup,
  FaUserFriends,
} from 'react-icons/fa';
import '../css/HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();

  const cards = [
    {
      label: 'Müşteriler',
      icon: <FaUserFriends size={50} />,
      path: '/CustomerList',
    },
    {
      label: 'Randevular',
      icon: <FaCalendarAlt size={50} />,
      path: '/',
    },
    {
      label: 'Ödemeler',
      icon: <FaMoneyBillWave size={50} />,
      path: '/',
    },
    { label: 'Hizmetler', icon: <FaLayerGroup size={50} />, path: '/' },
  ];

  return (
    <div className='home-container'>
      <header className='home-header'>
        <h1>BeautyCRM</h1>
      </header>

      <main className='card-container'>
        {cards.map((card, i) => (
          <div key={i} className='card' onClick={() => navigate(card.path)}>
            <div className='icon'>{card.icon}</div>
            <div className='label'>{card.label}</div>
          </div>
        ))}
      </main>
    </div>
  );
};

export default HomePage;
