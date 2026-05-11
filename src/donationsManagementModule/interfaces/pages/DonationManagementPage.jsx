import React, { useState, useEffect } from 'react';
import DonationCommandService from '../../application/DonationCommandService';
import DonationQueryService from '../../application/DonationQueryService';
import MermaQueryService from '../../../mermaManagementModule/application/MermaQueryService';
import BeneficiaryQueryService from '../../../beneficiariesManagementModule/application/BeneficiaryQueryService';
import './DonationManagement.css';

export const DonationManagementPage = () => {
  const [donations, setDonations] = useState([]);
  const [mermas, setMermas] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    mermaReferenceId: '',
    beneficiaryReferenceId: '',
    quantity: '',
    scheduledDeliveryDate: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [donationsData, mermasData, beneficiariesData] = await Promise.all([
        filterStatus
          ? DonationQueryService.listDonationsByStatus(filterStatus)
          : DonationQueryService.listAllDonations(),
        // CORRECCIÓN 1: Usamos la ruta dedicada para mermas donables
        MermaQueryService.listDonableMermas(),
        BeneficiaryQueryService.listBeneficiariesByStatus('ACTIVE'),
      ]);

      setDonations(Array.isArray(donationsData) ? donationsData : []);
      setMermas(Array.isArray(mermasData) ? mermasData : []);
      setBeneficiaries(Array.isArray(beneficiariesData) ? beneficiariesData : []);
      setError('');
    } catch (err) {
      setError('Error al cargar donaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateDonation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await DonationCommandService.createDonation(
        parseInt(formData.mermaReferenceId),
        parseInt(formData.beneficiaryReferenceId),
        parseInt(formData.quantity),
        formData.scheduledDeliveryDate
      );
      setFormData({
        mermaReferenceId: '',
        beneficiaryReferenceId: '',
        quantity: '',
        scheduledDeliveryDate: '',
      });
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.message || 'Error al crear donación');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkDelivered = async (donationId) => {
    const deliveryDate = prompt('Fecha de entrega (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);
    if (deliveryDate) {
      try {
        await DonationCommandService.markDelivered(donationId, deliveryDate);
        fetchData();
      } catch (err) {
        setError(err.message || 'Error al marcar como entregado');
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'ASSIGNED': 'badge-yellow',
      'DELIVERED': 'badge-blue',
      'CONFIRMED': 'badge-green',
    };
    return statusMap[status] || 'badge-gray';
  };

  return (
    <div className="donation-management">
      <div className="page-header">
        <h2>Gestión de Donaciones</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '❌ Cancelar' : '➕ Nueva Donación'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="donation-form" onSubmit={handleCreateDonation}>
          <h3>Crear Nueva Donación</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Seleccionar Merma Donable *</label>
              <select
                name="mermaReferenceId"
                value={formData.mermaReferenceId}
                onChange={handleInputChange}
                required
                disabled={submitting}
              >
                <option value="">-- Elige una merma --</option>
                {mermas.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.productName} - {m.categoryName} (Qty: {m.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Seleccionar Beneficiario *</label>
              <select
                name="beneficiaryReferenceId"
                value={formData.beneficiaryReferenceId}
                onChange={handleInputChange}
                required
                disabled={submitting}
              >
                <option value="">-- Elige un beneficiario --</option>
                {beneficiaries.map(b => (
                  <option key={b.id} value={b.id}>
                    {/* CORRECCIÓN 2: Aseguramos que el nombre se muestre correctamente */}
                    {b.beneficiaryName || b.name} ({b.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cantidad a Donar *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                min="1"
                placeholder="ej: 5"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label>Fecha Programada de Entrega *</label>
              <input
                type="date"
                name="scheduledDeliveryDate"
                value={formData.scheduledDeliveryDate}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? '⏳ Creando...' : '✅ Crear Donación'}
          </button>
        </form>
      )}

      <div className="filter-section">
        <label>Filtrar por Estado:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="ASSIGNED">Asignada</option>
          <option value="DELIVERED">Entregada</option>
          <option value="CONFIRMED">Confirmada</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando donaciones...</p>
      ) : donations.length === 0 ? (
        <p className="no-data">No hay donaciones registradas</p>
      ) : (
        <div className="donations-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Merma</th>
                <th>Beneficiario</th>
                <th>Cantidad</th>
                <th>Entreg. Prog.</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id}>
                  <td>#{donation.id}</td>
                  <td>Merma #{donation.mermaReferenceId}</td>
                  <td>Benef. #{donation.beneficiaryReferenceId}</td>
                  <td>{donation.donationQuantity}</td>
                  <td>{new Date(donation.scheduledDeliveryDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(donation.status)}`}>
                      {donation.status === 'ASSIGNED' && '📋 Asignada'}
                      {donation.status === 'DELIVERED' && '🚚 Entregada'}
                      {donation.status === 'CONFIRMED' && '✅ Confirmada'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {donation.status === 'ASSIGNED' && (
                      <button
                        className="btn-small btn-success"
                        onClick={() => handleMarkDelivered(donation.id)}
                      >
                        Marcar Entregada
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};