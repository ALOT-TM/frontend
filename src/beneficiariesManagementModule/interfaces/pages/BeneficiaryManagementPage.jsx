import React, { useState, useEffect } from 'react';
import BeneficiaryCommandService from '../../application/BeneficiaryCommandService';
import BeneficiaryQueryService from '../../application/BeneficiaryQueryService';
import './BeneficiaryManagement.css';

export const BeneficiaryManagementPage = () => {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: 'SCHOOL',
    address: '',
    acceptedProducts: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchBeneficiaries();
  }, [filterStatus]);

  const fetchBeneficiaries = async () => {
    setLoading(true);
    try {
      let data;
      if (filterStatus) {
        data = await BeneficiaryQueryService.listBeneficiariesByStatus(filterStatus);
      } else {
        data = await BeneficiaryQueryService.listAllBeneficiaries();
      }
      setBeneficiaries(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError('Error al cargar beneficiarios');
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const products = formData.acceptedProducts.split(',').map(p => p.trim()).filter(p => p);
      await BeneficiaryCommandService.registerBeneficiary(
        formData.name,
        formData.type,
        formData.address,
        products
      );
      setFormData({
        name: '',
        type: 'SCHOOL',
        address: '',
        acceptedProducts: '',
      });
      setShowForm(false);
      fetchBeneficiaries();
    } catch (err) {
      setError(err.message || 'Error al registrar beneficiario');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivate = async (beneficiaryId) => {
    try {
      await BeneficiaryCommandService.activateBeneficiary(beneficiaryId);
      fetchBeneficiaries();
    } catch (err) {
      setError(err.message || 'Error al activar beneficiario');
    }
  };

  const handleDeactivate = async (beneficiaryId) => {
    try {
      await BeneficiaryCommandService.deactivateBeneficiary(beneficiaryId);
      fetchBeneficiaries();
    } catch (err) {
      setError(err.message || 'Error al desactivar beneficiario');
    }
  };

  return (
    <div className="beneficiary-management">
      <div className="page-header">
        <h2>Gestión de Beneficiarios</h2>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '❌ Cancelar' : '➕ Nuevo Beneficiario'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="beneficiary-form" onSubmit={handleRegister}>
          <h3>Registrar Nuevo Beneficiario</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre de la Institución *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="ej: Colegio San Juan"
                disabled={submitting}
              />
            </div>

            <div className="form-group">
              <label>Tipo de Institución *</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                disabled={submitting}
              >
                <option value="SCHOOL">Colegio</option>
                <option value="SHELTER">Albergue</option>
                <option value="NGO">ONG</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Dirección *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                placeholder="ej: Av. Principal 123"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Productos Aceptados (separados por coma)</label>
              <input
                type="text"
                name="acceptedProducts"
                value={formData.acceptedProducts}
                onChange={handleInputChange}
                placeholder="ej: Lácteos, Conservas, Granos"
                disabled={submitting}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? '⏳ Registrando...' : '✅ Registrar Beneficiario'}
          </button>
        </form>
      )}

      <div className="filter-section">
        <label>Filtrar por Estado:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="">Todos</option>
          <option value="ACTIVE">Activo</option>
          <option value="INACTIVE">Inactivo</option>
        </select>
      </div>

      {loading ? (
        <p>Cargando beneficiarios...</p>
      ) : beneficiaries.length === 0 ? (
        <p className="no-data">No hay beneficiarios registrados</p>
      ) : (
        <div className="beneficiaries-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Dirección</th>
                <th>Productos Aceptados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {beneficiaries.map((beneficiary) => (
                <tr key={beneficiary.id}>
                  <td>#{beneficiary.id}</td>
                  <td>{beneficiary.beneficiaryName}</td>
                  <td>
                    {beneficiary.type === 'SCHOOL' && '🏫 Colegio'}
                    {beneficiary.type === 'SHELTER' && '🏠 Albergue'}
                    {beneficiary.type === 'NGO' && '🤝 ONG'}
                  </td>
                  <td>{beneficiary.address}</td>
                  <td>
                    {Array.isArray(beneficiary.acceptedProducts)
                      ? beneficiary.acceptedProducts.join(', ')
                      : '-'}
                  </td>
                  <td>
                    <span className={`badge ${beneficiary.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>
                      {beneficiary.status === 'ACTIVE' ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    {beneficiary.status === 'ACTIVE' ? (
                      <button
                        className="btn-small btn-danger"
                        onClick={() => handleDeactivate(beneficiary.id)}
                      >
                        Desactivar
                      </button>
                    ) : (
                      <button
                        className="btn-small btn-success"
                        onClick={() => handleActivate(beneficiary.id)}
                      >
                        Activar
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

