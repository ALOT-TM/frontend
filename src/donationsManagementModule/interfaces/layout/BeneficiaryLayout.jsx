import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import './BeneficiaryLayout.css';

export const BeneficiaryLayout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="beneficiary-layout">
      <header className="beneficiary-header">
        <div className="header-left">
          <h1>🎁 Portal de Donaciones</h1>
        </div>
        <div className="header-right">
          <span className="user-info">👤 {user?.email}</span>
          <button className="logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </header>

      <nav className="beneficiary-nav">
        <ul>
          <li>
            <a href="/beneficiary/donations">
              🎁 Mis Donaciones
            </a>
          </li>
        </ul>
      </nav>

      <main className="beneficiary-main">
        {children}
      </main>
    </div>
  );
};

