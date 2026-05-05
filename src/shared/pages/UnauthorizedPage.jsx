import React from 'react';
import { Link } from 'react-router-dom';
import './UnauthorizedPage.css';

export const UnauthorizedPage = () => {
  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <div className="error-icon">🚫</div>
        <h1>Acceso Denegado</h1>
        <p>No tienes permisos para acceder a esta página.</p>
        <Link to="/login" className="home-link">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
};

