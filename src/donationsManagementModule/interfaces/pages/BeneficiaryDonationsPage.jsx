import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import DonationCommandService from '../../application/DonationCommandService';
import DonationQueryService from '../../application/DonationQueryService';
import './BeneficiaryDonationsPage.css';

export const BeneficiaryDonationsPage = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmData, setConfirmData] = useState({
    receptionDate: new Date().toISOString().split('T')[0],
    comment: '',
  });

  useEffect(() => {
    fetchDonations();
  }, [user?.id]);

  const fetchDonations = async () => {
    setLoading(true);
    try {
      // En un caso real, buscarías por beneficiaryId
      const allDonations = await DonationQueryService.listAllDonations();
      setDonations(Array.isArray(allDonations) ? allDonations : []);
      setError('');
    } catch (err) {
      setError('Error al cargar tus donaciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReception = async (donationId) => {
    try {
      await DonationCommandService.confirmReception(
        donationId,
        confirmData.receptionDate,
        confirmData.comment
      );
      setConfirmingId(null);
      setConfirmData({
        receptionDate: new Date().toISOString().split('T')[0],
        comment: '',
      });
      fetchDonations();
    } catch (err) {
      setError(err.message || 'Error al confirmar recepción');
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      'ASSIGNED': 'status-assigned',
      'DELIVERED': 'status-delivered',
      'CONFIRMED': 'status-confirmed',
    };
    return statusMap[status] || 'status-default';
  };

  return (
    <div className="beneficiary-donations">
      <h2>Mis Donaciones</h2>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <p className="loading">Cargando tus donaciones...</p>
      ) : donations.length === 0 ? (
        <div className="no-data-card">
          <p>No tienes donaciones asignadas en este momento.</p>
          <p className="text-muted">Contacta con el equipo de gestión para más información.</p>
        </div>
      ) : (
        <div className="donations-cards">
          {donations.map((donation) => (
            <div key={donation.id} className={`donation-card ${getStatusColor(donation.status)}`}>
              <div className="card-header">
                <h3>Donación #{donation.id}</h3>
                <span className={`status-badge status-${donation.status.toLowerCase()}`}>
                  {donation.status === 'ASSIGNED' && '📋 Asignada'}
                  {donation.status === 'DELIVERED' && '🚚 Entregada'}
                  {donation.status === 'CONFIRMED' && '✅ Confirmada'}
                </span>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <label>Cantidad:</label>
                  <span>{donation.donationQuantity} unidades</span>
                </div>

                <div className="info-row">
                  <label>Merma ID:</label>
                  <span>#{donation.mermaReferenceId}</span>
                </div>

                <div className="info-row">
                  <label>Fecha Programada:</label>
                  <span>{new Date(donation.scheduledDeliveryDate).toLocaleDateString()}</span>
                </div>

                {donation.deliveryDate && (
                  <div className="info-row">
                    <label>Fecha de Entrega:</label>
                    <span>{new Date(donation.deliveryDate).toLocaleDateString()}</span>
                  </div>
                )}

                {donation.receptionDate && (
                  <div className="info-row">
                    <label>Fecha de Confirmación:</label>
                    <span>{new Date(donation.receptionDate).toLocaleDateString()}</span>
                  </div>
                )}

                {donation.receptionComment && (
                  <div className="info-row">
                    <label>Comentario:</label>
                    <span className="comment">{donation.receptionComment}</span>
                  </div>
                )}
              </div>

              {donation.status === 'DELIVERED' && confirmingId !== donation.id && (
                <div className="card-footer">
                  <button
                    className="btn-confirm"
                    onClick={() => setConfirmingId(donation.id)}
                  >
                    ✅ Confirmar Recepción
                  </button>
                </div>
              )}

              {confirmingId === donation.id && (
                <div className="card-footer confirmation-form">
                  <h4>Confirmar Recepción</h4>

                  <div className="form-group">
                    <label>Fecha de Recepción *</label>
                    <input
                      type="date"
                      value={confirmData.receptionDate}
                      onChange={(e) =>
                        setConfirmData(prev => ({
                          ...prev,
                          receptionDate: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Comentarios (opcional)</label>
                    <textarea
                      value={confirmData.comment}
                      onChange={(e) =>
                        setConfirmData(prev => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                      placeholder="ej: Recepción completa y en buen estado"
                      rows="3"
                    />
                  </div>

                  <div className="button-group">
                    <button
                      className="btn-submit"
                      onClick={() => handleConfirmReception(donation.id)}
                    >
                      ✅ Confirmar
                    </button>
                    <button
                      className="btn-cancel"
                      onClick={() => setConfirmingId(null)}
                    >
                      ❌ Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

