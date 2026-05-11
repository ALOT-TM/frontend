import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../shared/hooks/useAuth';
import MermaQueryService from '../../../mermaManagementModule/application/MermaQueryService';
import DonationRequestService from '../../application/DonationRequestService';
import './BeneficiaryDonationsPage.css';
import CompanyQueryService from '../../../shared/infrastructure/companyQueryService';

export const BeneficiaryDonationsPage = () => {
  const { user, companyId } = useAuth();
  const beneficiaryId = useMemo(() => user?.id ?? user?.userId ?? null, [user]);

  const [donableMermas, setDonableMermas] = useState([]);
  const [requests, setRequests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMerma, setSelectedMerma] = useState(null);
  const [requestNotes, setRequestNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [beneficiaryId, companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [mermasData, requestsData, companiesData] = await Promise.all([
        MermaQueryService.listDonableMermas(companyId),
        beneficiaryId
          ? DonationRequestService.listRequestsByBeneficiary(beneficiaryId)
          : Promise.resolve([]),
        // fetch companies to resolve names
        CompanyQueryService.listCompanies(),
      ]);

      setDonableMermas(Array.isArray(mermasData) ? mermasData : []);
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setCompanies(Array.isArray(companiesData) ? companiesData : []);
      setError('');
    } catch (err) {
      setError(err.message || 'Error al cargar la vista de beneficiario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRequest = (merma) => {
    setSelectedMerma(merma);
    setRequestNotes('');
  };

  const handleCancelRequestForm = () => {
    setSelectedMerma(null);
    setRequestNotes('');
  };

  const handleSubmitRequest = async (event) => {
    event.preventDefault();
    if (!selectedMerma || !beneficiaryId) {
      setError('No se pudo preparar la solicitud');
      return;
    }

    setSubmitting(true);
    try {
      await DonationRequestService.createRequest(selectedMerma.id, beneficiaryId, requestNotes);
      setSelectedMerma(null);
      setRequestNotes('');
      await fetchData();
    } catch (err) {
      setError(err.message || 'Error al solicitar la merma');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await DonationRequestService.cancelRequest(requestId);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Error al cancelar la solicitud');
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return '-';
    }
    return new Date(value).toLocaleDateString();
  };

  const resolveCompanyName = (companyIdValue) => {
    const cid = companyIdValue?.value ?? companyIdValue ?? null;
    if (!cid) {
      return '-';
    }
    const found = companies.find((company) => String(company.id) === String(cid));
    return found ? found.name : `#${cid}`;
  };

  return (
    <div className="beneficiary-donations">
      <h2>Merma donable y solicitudes</h2>

      <section className="join-company">
        <div className="join-header">
          <div>
            <h3>Vista general de merma donable</h3>
            <p className="text-muted">
              {companyId
                ? `Filtrando por compañía ${companyId} según el token del usuario.`
                : 'Mostrando merma donable general.'}
            </p>
          </div>
          <span className="join-user">{user?.email}</span>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading">Cargando mermas donables...</div>
        ) : donableMermas.length === 0 ? (
          <div className="no-data-card">
            <p>No hay mermas donables disponibles.</p>
            <p className="text-muted">Cuando existan, aparecerán aquí con el botón Solicitar.</p>
          </div>
        ) : (
          <div className="donations-cards">
            {donableMermas.map((merma) => (
              <article key={merma.id} className="donation-card status-assigned">
                <div className="card-header">
                  <h3>{merma.productName}</h3>
                  <span className="status-badge status-assigned">DONABLE</span>
                </div>
                <div className="card-body">
                  <div className="info-row">
                    <label>Categoría</label>
                    <span>{merma.categoryName}</span>
                  </div>
                  <div className="info-row">
                    <label>Compañía</label>
                    <span>{resolveCompanyName(merma.companyId)}</span>
                  </div>
                  <div className="info-row">
                    <label>Cantidad</label>
                    <span>{merma.quantity}</span>
                  </div>
                  <div className="info-row">
                    <label>Vencimiento</label>
                    <span>{formatDate(merma.expirationDate)}</span>
                  </div>
                  <div className="info-row">
                    <label>ID Merma</label>
                    <span>#{merma.id}</span>
                  </div>
                </div>
                <div className="card-footer">
                  <button className="btn-submit" onClick={() => handleOpenRequest(merma)}>
                    Solicitar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedMerma && (
        <section className="join-company">
          <div className="join-header">
            <div>
              <h3>Solicitar merma</h3>
              <p className="text-muted">
                Completa los campos manuales para registrar la solicitud.
              </p>
            </div>
            <span className="join-user">Merma #{selectedMerma.id}</span>
          </div>

          <form className="join-form" onSubmit={handleSubmitRequest}>
            <div className="form-group">
              <label>Beneficiario</label>
              <input type="text" value={user?.email || beneficiaryId || ''} readOnly />
            </div>
            <div className="form-group">
              <label>Merma</label>
              <input
                type="text"
                value={`${selectedMerma.productName} (x${selectedMerma.quantity})`}
                readOnly
              />
            </div>
            <div className="form-group">
              <label>Notas *</label>
              <textarea
                rows="4"
                value={requestNotes}
                onChange={(event) => setRequestNotes(event.target.value)}
                placeholder="Describe tu necesidad o detalles de retiro"
                required
              />
            </div>

            <div className="button-group">
              <button type="button" className="btn-cancel" onClick={handleCancelRequestForm}>
                Cancelar
              </button>
              <button type="submit" className="btn-submit" disabled={submitting}>
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="join-company">
        <div className="join-header">
          <div>
            <h3>Mis solicitudes</h3>
            <p className="text-muted">Solicitudes creadas desde esta cuenta de beneficiario.</p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="no-data-card">
            <p>No tienes solicitudes registradas.</p>
          </div>
        ) : (
          <div className="donations-cards">
            {requests.map((request) => (
              <article key={request.id} className="donation-card">
                <div className="card-header">
                  <h3>Solicitud #{request.id}</h3>
                  <span className={`status-badge status-${String(request.status || 'pending').toLowerCase()}`}>
                    {request.status}
                  </span>
                </div>
                <div className="card-body">
                  <div className="info-row">
                    <label>Merma</label>
                    <span>#{request.mermaReferenceId}</span>
                  </div>
                  <div className="info-row">
                    <label>Beneficiario</label>
                    <span>#{request.beneficiaryReferenceId}</span>
                  </div>
                  <div className="info-row">
                    <label>Compañía</label>
                    <span>{resolveCompanyName(request.companyId)}</span>
                  </div>
                  <div className="info-row">
                    <label>Notas</label>
                    <span>{request.notes || '-'}</span>
                  </div>
                </div>
                {request.status === 'PENDING' && (
                  <div className="card-footer">
                    <button className="btn-cancel" onClick={() => handleCancelRequest(request.id)}>
                      Cancelar solicitud
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
