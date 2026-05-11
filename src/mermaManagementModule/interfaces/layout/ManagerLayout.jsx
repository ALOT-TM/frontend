import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import Icon from '../../../shared/components/Icon';
import './ManagerLayout.css';

export const ManagerLayout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="manager-layout">
      <header className="manager-header">
        <div className="header-left">
          <h1><Icon name="store" size={28} /> Fluxus - Gestión de Merma</h1>
        </div>
        <div className="header-right">
          <span className="user-info"><Icon name="user" size={16} /> {user?.email}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <nav className="manager-nav">
        <ul>
          <li>
            <a href="/manager/dashboard" className={location.pathname === '/manager/dashboard' ? 'active' : ''}>
              <Icon name="chart" size={16} /> Dashboard
            </a>
          </li>
          <li>
            <a href="/manager/merma" className={location.pathname === '/manager/merma' ? 'active' : ''}>
              <Icon name="package" size={16} /> Gestión de Merma
            </a>
          </li>
          <li>
            <a href="/manager/beneficiaries" className={location.pathname === '/manager/beneficiaries' ? 'active' : ''}>
              <Icon name="school" size={16} /> Beneficiarios
            </a>
          </li>
          <li>
            <a href="/manager/donations" className={location.pathname === '/manager/donations' ? 'active' : ''}>
              <Icon name="gift" size={16} /> Donaciones
            </a>
          </li>
        </ul>
      </nav>

      <main className="manager-main">
        {children}
      </main>
    </div>
  );
};

