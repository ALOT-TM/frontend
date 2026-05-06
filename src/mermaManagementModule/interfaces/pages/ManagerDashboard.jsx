import React, { useEffect, useState } from 'react';
import MermaQueryService from '../../application/MermaQueryService';
import DonationQueryService from '../../../donationsManagementModule/application/DonationQueryService';
import BeneficiaryQueryService from '../../../beneficiariesManagementModule/application/BeneficiaryQueryService';
import './Dashboard.css';

export const ManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalMerma: 0,
    donableMerma: 0,
    activeDonations: 0,
    activeBeneficiaries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [mermas, donations, beneficiaries] = await Promise.all([
          MermaQueryService.listAllMermas(),
          DonationQueryService.listAllDonations(),
          BeneficiaryQueryService.listAllBeneficiaries(),
        ]);

        setStats({
          totalMerma: Array.isArray(mermas) ? mermas.length : 0,
          donableMerma: Array.isArray(mermas) ? mermas.filter(m => m.status === 'DONABLE').length : 0,
          activeDonations: Array.isArray(donations) ? donations.filter(d => d.status === 'ASSIGNED').length : 0,
          activeBeneficiaries: Array.isArray(beneficiaries) ? beneficiaries.filter(b => b.status === 'ACTIVE').length : 0,
        });
      } catch (err) {
        setError('Error al cargar la información');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="dashboard"><p>Cargando estadísticas...</p></div>;
  }

  return (
    <div className="dashboard">
      <h2>Dashboard del Gerente</h2>

      {error && <div className="error-banner">{error}</div>}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total de Merma</h3>
            <p className="stat-number">{stats.totalMerma}</p>
            <p className="stat-label">Productos registrados</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>Merma Donable</h3>
            <p className="stat-number">{stats.donableMerma}</p>
            <p className="stat-label">Disponible para donar</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎁</div>
          <div className="stat-content">
            <h3>Donaciones Activas</h3>
            <p className="stat-number">{stats.activeDonations}</p>
            <p className="stat-label">En proceso de entrega</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏫</div>
          <div className="stat-content">
            <h3>Beneficiarios Activos</h3>
            <p className="stat-number">{stats.activeBeneficiaries}</p>
            <p className="stat-label">Instituciones disponibles</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Acciones Rápidas</h3>
        <div className="actions-grid">
          <a href="/manager/merma" className="action-btn action-btn-primary">
            📝 Registrar Merma
          </a>
          <a href="/manager/beneficiaries" className="action-btn action-btn-secondary">
            🏫 Ver Beneficiarios
          </a>
          <a href="/manager/donations" className="action-btn action-btn-tertiary">
            🎁 Crear Donación
          </a>
        </div>
      </div>
    </div>
  );
};

