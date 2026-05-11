import React, { useState, useEffect } from 'react';
import BeneficiaryCommandService from '../../application/BeneficiaryCommandService';
import BeneficiaryQueryService from '../../application/BeneficiaryQueryService';
import Icon from '../../../shared/components/Icon';
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
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

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

  // ESTA ES LA FUNCIÓN QUE TE FALTABA PARA CREAR UNO NUEVO
  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      name: '',
      type: 'SCHOOL',
      address: '',
      acceptedProducts: '',
    });
    setShowForm(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const products = formData.acceptedProducts.split(',').map(p => p.trim()).filter(p => p);
      
      if (editingId) {
        await BeneficiaryCommandService.updateBeneficiary(
          editingId,
          formData.name,
          formData.type,
          formData.address,
          products
        );
      } else {
        await BeneficiaryCommandService.registerBeneficiary(
          formData.name,
          formData.type,
          formData.address,
          products
        );
      }

      setFormData({
        name: '',
        type: 'SCHOOL',
        address: '',
        acceptedProducts: '',
      });
      setEditingId(null);
      setShowForm(false);
      fetchBeneficiaries();
    } catch (err) {
      setError(err.message || 'Error al guardar beneficiario');
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

  const handleEdit = (beneficiary) => {
    setEditingId(beneficiary.id);
    setFormData({
      name: beneficiary.beneficiaryName || beneficiary.name || '',
      type: beneficiary.type || 'SCHOOL',
      address: beneficiary.address || '',
      acceptedProducts: Array.isArray(beneficiary.acceptedProducts)
        ? beneficiary.acceptedProducts.join(', ')
        : '',
    });
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      name: '',
      type: 'SCHOOL',
      address: '',
      acceptedProducts: '',
    });
  };

  const counts = beneficiaries.reduce(
    (acc, beneficiary) => {
      acc.total += 1;
      if (beneficiary.status === 'ACTIVE') {
        acc.active += 1;
      }
      if (beneficiary.status === 'INACTIVE') {
        acc.inactive += 1;
      }
      return acc;
    },
    { total: 0, active: 0, inactive: 0 }
  );

  const filteredBeneficiaries = beneficiaries
    .filter((beneficiary) => {
      if (filterStatus && beneficiary.status !== filterStatus) {
        return false;
      }
      if (filterType && beneficiary.type !== filterType) {
        return false;
      }
      if (searchTerm.trim()) {
        const haystack = [
          beneficiary.beneficiaryName,
          beneficiary.name,
          beneficiary.address,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(searchTerm.trim().toLowerCase());
      }
      return true;
    })
    .sort((a, b) => {
      const nameA = (a.beneficiaryName || a.name || '').toLowerCase();
      const nameB = (b.beneficiaryName || b.name || '').toLowerCase();
      if (sortBy === 'name-desc') {
        return nameB.localeCompare(nameA);
      }
      if (sortBy === 'status') {
        return (a.status || '').localeCompare(b.status || '');
      }
      if (sortBy === 'type') {
        return (a.type || '').localeCompare(b.type || '');
      }
      return nameA.localeCompare(nameB);
    });

  return (
    <div className="beneficiary-management">
      <div className="page-header">
        <h2>Gestión de Beneficiarios</h2>
        <div className="header-actions">
          {/* AQUÍ ESTÁ EL BOTÓN QUE TE FALTABA */}
          <button 
            className="btn-primary" 
            onClick={handleCreateNew}
            style={{ marginRight: '10px' }}
          >
            <Icon name="plus" size={16} /> Nuevo Beneficiario
          </button>
          <button
            className="btn-secondary"
            onClick={fetchBeneficiaries}
            disabled={loading}
          >
            Actualizar
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total</span>
          <strong className="stat-value">{counts.total}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Activos</span>
          <strong className="stat-value">{counts.active}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-label">Inactivos</span>
          <strong className="stat-value">{counts.inactive}</strong>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <form className="beneficiary-form" onSubmit={handleRegister}>
          <h3>{editingId ? 'Editar Beneficiario' : 'Crear Nuevo Beneficiario'}</h3>

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

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancelForm}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}

      <div className="filter-section">
        <div className="filter-group">
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Nombre o dirección"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Estado</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Tipo</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">Todos</option>
            <option value="SCHOOL">Colegio</option>
            <option value="SHELTER">Albergue</option>
            <option value="NGO">ONG</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Ordenar</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="name-asc">Nombre (A-Z)</option>
            <option value="name-desc">Nombre (Z-A)</option>
            <option value="status">Estado</option>
            <option value="type">Tipo</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Cargando beneficiarios...</p>
      ) : filteredBeneficiaries.length === 0 ? (
        <p className="no-data">No hay beneficiarios con los filtros actuales</p>
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
              {filteredBeneficiaries.map((beneficiary) => (
                <tr key={beneficiary.id}>
                    <td>#{beneficiary.id}</td>
                    <td>{beneficiary.beneficiaryName || beneficiary.name}</td>
                    <td>
                      {beneficiary.type === 'SCHOOL' && <><Icon name="school" size={16} /> Colegio</>}
                      {beneficiary.type === 'SHELTER' && <><Icon name="home" size={16} /> Albergue</>}
                      {beneficiary.type === 'NGO' && <><Icon name="handshake" size={16} /> ONG</>}
                    </td>
                    <td>{beneficiary.address}</td>
                    <td>
                      {Array.isArray(beneficiary.acceptedProducts) && beneficiary.acceptedProducts.length > 0 ? (
                        <div className="product-chips">
                          {beneficiary.acceptedProducts.map((product) => (
                            <span key={`${beneficiary.id}-${product}`} className="product-chip">
                              {product}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <span className={`badge ${beneficiary.status === 'ACTIVE' ? 'badge-green' : 'badge-gray'}`}>
                        {beneficiary.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-small btn-outline"
                        onClick={() => handleEdit(beneficiary)}
                      >
                        Editar
                      </button>
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