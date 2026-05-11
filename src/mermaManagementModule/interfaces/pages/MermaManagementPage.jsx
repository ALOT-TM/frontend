import React, { useEffect, useMemo, useState } from 'react';
import MermaCommandService from '../../application/MermaCommandService';
import MermaQueryService from '../../application/MermaQueryService';
import DonationRequestService from '../../../donationsManagementModule/application/DonationRequestService';
import { useAuth } from '../../../shared/hooks/useAuth';
import Icon from '../../../shared/components/Icon';
import './MermaManagement.css';

export const MermaManagementPage = () => {
  const categoryOptions = [
    'Frutas',
    'Verduras',
    'Carnes',
    'Lácteos',
    'Panadería',
    'Cereales',
    'Conservas',
    'Abarrotes',
    'Bebidas',
    'Preparados',
  ];
  const { companyId } = useAuth();
  const resolvedCompanyId = useMemo(() => companyId ?? null, [companyId]);

  const [mermaList, setMermaList] = useState([]);
  const [requestsByMerma, setRequestsByMerma] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    productName: '',
    categoryName: categoryOptions[0],
    quantity: '',
    expirationDate: '',
    reason: 'EXPIRATION',
  });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  useEffect(() => {
    fetchMermas();
  }, [filterStatus, filterCategory, resolvedCompanyId]);

  useEffect(() => {
    const loadRequests = async () => {
      const candidateMermas = mermaList.filter((merma) => merma.status === 'DONABLE' || merma.status === 'IN_PROCESS');
      if (candidateMermas.length === 0) {
        setRequestsByMerma({});
        return;
      }

      try {
        const entries = await Promise.all(
          candidateMermas.map(async (merma) => {
            const requests = await DonationRequestService.listRequestsByMerma(merma.id);
            return [merma.id, Array.isArray(requests) ? requests : []];
          })
        );
        setRequestsByMerma(Object.fromEntries(entries));
      } catch (err) {
        console.error(err);
      }
    };

    loadRequests();
  }, [mermaList]);

  const fetchMermas = async () => {
    setLoading(true);
    try {
      let data = [];
      if (filterStatus) {
        const allByStatus = await MermaQueryService.listMermasByStatus(filterStatus);
        data = Array.isArray(allByStatus)
          ? allByStatus.filter((merma) => {
              if (!resolvedCompanyId) {
                return true;
              }
              const mermaCompanyId = merma.companyId?.value ?? merma.companyId ?? null;
              return String(mermaCompanyId) === String(resolvedCompanyId);
            })
          : [];
      } else {
        data = await MermaQueryService.listMermasByCompany(resolvedCompanyId);
      }

      if (filterCategory) {
        data = data.filter((merma) => {
          const mermaCategory = merma.categoryName?.value ?? merma.categoryName ?? '';
          return String(mermaCategory) === String(filterCategory);
        });
      }

      setMermaList(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError('Error al cargar mermas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegisterMerma = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await MermaCommandService.registerMerma(
        formData.productName,
        formData.categoryName,
        parseInt(formData.quantity, 10),
        formData.expirationDate,
        formData.reason
      );
      setFormData({
        productName: '',
        categoryName: categoryOptions[0],
        quantity: '',
        expirationDate: '',
        reason: 'EXPIRATION',
      });
      setShowForm(false);
      fetchMermas();
    } catch (err) {
      setError(err.message || 'Error al registrar merma');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkDonable = async (mermaId) => {
    try {
      await MermaCommandService.markDonable(mermaId);
      fetchMermas();
    } catch (err) {
      setError(err.message || 'Error al marcar como donable');
    }
  };

  const handleMarkNotDonable = async (mermaId) => {
    try {
      await MermaCommandService.markNotDonable(mermaId);
      fetchMermas();
    } catch (err) {
      setError(err.message || 'Error al marcar como no donable');
    }
  };

  const refreshRequestsForMerma = async (mermaId) => {
    const requests = await DonationRequestService.listRequestsByMerma(mermaId);
    setRequestsByMerma((prev) => ({
      ...prev,
      [mermaId]: Array.isArray(requests) ? requests : [],
    }));
  };

  const handleAcceptRequest = async (requestId, mermaId) => {
    try {
      await DonationRequestService.acceptRequest(requestId);
      await fetchMermas();
      await refreshRequestsForMerma(mermaId);
      setSelectedRequest(null);
    } catch (err) {
      setError(err.message || 'Error al aceptar solicitud');
    }
  };

  const handleRejectRequest = async (requestId, mermaId) => {
    try {
      await DonationRequestService.rejectRequest(requestId);
      await fetchMermas();
      await refreshRequestsForMerma(mermaId);
      setSelectedRequest(null);
    } catch (err) {
      setError(err.message || 'Error al rechazar solicitud');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      REGISTERED: 'badge-gray',
      DONABLE: 'badge-green',
      IN_PROCESS: 'badge-purple',
      NOT_DONABLE: 'badge-red',
      DONATED: 'badge-blue',
    };
    return statusMap[status] || 'badge-gray';
  };

  return (
    <div className="merma-management">
      <div className="page-header">
        <h2>Gestión de Merma</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <><Icon name="close" size={16} /> Cancelar</> : <><Icon name="plus" size={16} /> Nueva Merma</>}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="merma-form" onSubmit={handleRegisterMerma}>
          <h3>Registrar Nueva Merma</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre del Producto *</label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                required
                placeholder="ej: Yogurt Natural"
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label>Categoría *</label>
              <select
                name="categoryName"
                value={formData.categoryName}
                onChange={handleInputChange}
                required
                disabled={submitting}
              >
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cantidad *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                min="1"
                placeholder="ej: 12"
                disabled={submitting}
              />
            </div>
            <div className="form-group">
              <label>Fecha de Vencimiento *</label>
              <input
                type="date"
                name="expirationDate"
                value={formData.expirationDate}
                onChange={handleInputChange}
                required
                disabled={submitting}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Motivo de Merma *</label>
              <select
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                disabled={submitting}
              >
                <option value="EXPIRATION">Vencimiento</option>
                <option value="DAMAGED_PACKAGING">Empaque Dañado</option>
                <option value="OVERSTOCK">Sobrestock</option>
              </select>
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? <><Icon name="loading" size={16} /> Registrando...</> : <><Icon name="check" size={16} /> Registrar Merma</>}
          </button>
        </form>
      )}

      <div className="filter-section">
        <label>Filtrar por Estado:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="REGISTERED">Registrado</option>
          <option value="DONABLE">Donable</option>
          <option value="IN_PROCESS">En proceso</option>
          <option value="NOT_DONABLE">No Donable</option>
          <option value="DONATED">Donado</option>
        </select>
        <label>Filtrar por Categoría:</label>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">Todas</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Cargando mermas...</p>
      ) : mermaList.length === 0 ? (
        <p className="no-data">No hay mermas registradas</p>
      ) : (
        <div className="merma-grid">
          {mermaList.map((merma) => {
            const requests = requestsByMerma[merma.id] || [];
            return (
              <article key={merma.id} className={`merma-card status-${String(merma.status).toLowerCase()}`}>
                <div className="merma-card-header">
                  <div>
                    <h3>{merma.productName}</h3>
                    <p>{merma.categoryName}</p>
                  </div>
                  <span className={`badge ${getStatusBadge(merma.status)}`}>{merma.status}</span>
                </div>

                <div className="merma-card-body">
                  <div className="info-row">
                    <label>Cantidad</label>
                    <span>{merma.quantity}</span>
                  </div>
                  <div className="info-row">
                    <label>Vencimiento</label>
                    <span>{new Date(merma.expirationDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {merma.status === 'REGISTERED' && (
                  <div className="actions-cell">
                    <button type="button" className="btn-small btn-success" onClick={() => handleMarkDonable(merma.id)}>
                      <Icon name="check" size={16} /> Donable
                    </button>
                    <button type="button" className="btn-small btn-danger" onClick={() => handleMarkNotDonable(merma.id)}>
                      <Icon name="close" size={16} /> No Donable
                    </button>
                  </div>
                )}

                {(merma.status === 'DONABLE' || merma.status === 'IN_PROCESS') && (
                  <div className="request-pills-wrap">
                    <div className="request-pills-title">Solicitudes</div>
                    <div className="request-pills">
                      {requests.length === 0 ? (
                        <span className="request-pill empty">Sin solicitudes</span>
                      ) : (
                        requests.map((request) => (
                          <button
                            key={request.id}
                            type="button"
                            className={`request-pill status-${String(request.status || 'pending').toLowerCase()}`}
                            onClick={() => setSelectedRequest({ ...request, merma })}
                          >
                            #{request.id} {request.status}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {selectedRequest && (
        <section className="request-detail-panel">
          <div className="request-detail-header">
            <div>
              <h3>Solicitud #{selectedRequest.id}</h3>
              <p>
                Merma #{selectedRequest.merma?.id} - {selectedRequest.merma?.productName}
              </p>
            </div>
            <span className={`badge ${selectedRequest.status === 'PENDING' ? 'badge-gray' : 'badge-blue'}`}>
              {selectedRequest.status}
            </span>
          </div>

          <div className="info-row">
            <label>Beneficiario</label>
            <span>#{selectedRequest.beneficiaryReferenceId}</span>
          </div>
          <div className="info-row">
            <label>Notas</label>
            <span>{selectedRequest.notes || '-'}</span>
          </div>

          <div className="button-group">
            {selectedRequest.status === 'PENDING' && (
              <>
                <button
                  type="button"
                  className="btn-success"
                  onClick={() => handleAcceptRequest(selectedRequest.id, selectedRequest.merma.id)}
                >
                  Aceptar
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => handleRejectRequest(selectedRequest.id, selectedRequest.merma.id)}
                >
                  Rechazar
                </button>
              </>
            )}
            <button type="button" className="btn-cancel" onClick={() => setSelectedRequest(null)}>
              Cerrar
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
