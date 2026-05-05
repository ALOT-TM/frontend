import React, { useState, useEffect } from 'react';
import MermaCommandService from '../../application/MermaCommandService';
import MermaQueryService from '../../application/MermaQueryService';
import './MermaManagement.css';

export const MermaManagementPage = () => {
  const [mermaList, setMermaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    productName: '',
    categoryName: '',
    quantity: '',
    expirationDate: '',
    reason: 'EXPIRATION',
  });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchMermas();
  }, [filterStatus]);

  const fetchMermas = async () => {
    setLoading(true);
    try {
      let data;
      if (filterStatus) {
        data = await MermaQueryService.listMermasByStatus(filterStatus);
      } else {
        data = await MermaQueryService.listAllMermas();
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
    setFormData(prev => ({
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
        parseInt(formData.quantity),
        formData.expirationDate,
        formData.reason
      );
      setFormData({
        productName: '',
        categoryName: '',
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

  const getStatusBadge = (status) => {
    const statusMap = {
      'REGISTERED': 'badge-gray',
      'DONABLE': 'badge-green',
      'NOT_DONABLE': 'badge-red',
      'DONATED': 'badge-blue',
    };
    return statusMap[status] || 'badge-gray';
  };

  return (
    <div className="merma-management">
      <div className="page-header">
        <h2>Gestión de Merma</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '❌ Cancelar' : '➕ Nueva Merma'}
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
              <input
                type="text"
                name="categoryName"
                value={formData.categoryName}
                onChange={handleInputChange}
                required
                placeholder="ej: Lácteos"
                disabled={submitting}
              />
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
            {submitting ? '⏳ Registrando...' : '✅ Registrar Merma'}
          </button>
        </form>
      )}

      <div className="filter-section">
        <label>Filtrar por Estado:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="REGISTERED">Registrado</option>
          <option value="DONABLE">Donable</option>
          <option value="NOT_DONABLE">No Donable</option>
          <option value="DONATED">Donado</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando mermas...</p>
      ) : mermaList.length === 0 ? (
        <p className="no-data">No hay mermas registradas</p>
      ) : (
        <div className="mermas-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Producto</th>
                <th>Categoría</th>
                <th>Cantidad</th>
                <th>Vencimiento</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mermaList.map((merma) => (
                <tr key={merma.id}>
                  <td>#{merma.id}</td>
                  <td>{merma.productName}</td>
                  <td>{merma.categoryName}</td>
                  <td>{merma.quantity}</td>
                  <td>{new Date(merma.expirationDate).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(merma.status)}`}>
                      {merma.status}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {merma.status === 'REGISTERED' && (
                      <>
                        <button
                          className="btn-small btn-success"
                          onClick={() => handleMarkDonable(merma.id)}
                        >
                          ✅ Donable
                        </button>
                        <button
                          className="btn-small btn-danger"
                          onClick={() => handleMarkNotDonable(merma.id)}
                        >
                          ❌ No Donable
                        </button>
                      </>
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

