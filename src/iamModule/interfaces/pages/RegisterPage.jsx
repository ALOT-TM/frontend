import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../shared/hooks/useAuth';
import CompanyQueryService from '../../../shared/infrastructure/companyQueryService';
import './AuthPage.css';

export const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('BENEFICIARY');
  const [companyId, setCompanyId] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== 'MANAGER') {
      setCompanyId('');
      return;
    }

    const loadCompanies = async () => {
      setLoadingCompanies(true);
      try {
        const data = await CompanyQueryService.listCompanies();
        setCompanies(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Error al cargar compañías');
      } finally {
        setLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, [role]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener mínimo 6 caracteres');
      return;
    }

    if (role === 'MANAGER' && !companyId) {
      setError('Selecciona una compañía para el usuario retail');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, role, role === 'MANAGER' ? Number(companyId) : null);
      const session = await login(email, password);
      const nextRole = session?.user?.role ?? role;

      if (nextRole === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/beneficiary/donations');
      }
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Crear Cuenta</h1>
        <p className="auth-subtitle">Sistema de Gestión de Merma y Donaciones</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">Tipo de Usuario</label>
            <select
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={loading}
            >
              <option value="BENEFICIARY">Beneficiario</option>
              <option value="MANAGER">Gerente de Retail</option>
            </select>
          </div>

          {role === 'MANAGER' && (
            <div className="form-group">
              <label htmlFor="companyId">Compañía *</label>
              <select
                id="companyId"
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                disabled={loading || loadingCompanies}
                required
              >
                <option value="">Selecciona una compañía</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} {company.headquarters ? `- ${company.headquarters}` : ''}
                  </option>
                ))}
              </select>
              <small className="field-help">
                Este valor se enviará como `companyId` en el registro.
              </small>
            </div>
          )}

          {role === 'BENEFICIARY' && (
            <div className="info-banner" style={{ marginBottom: 20 }}>
              Los beneficiarios no se asocian a una compañía.
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Contraseña</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Confirma tu contraseña"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? 'Cargando...' : 'Registrarse'}
          </button>
        </form>

        <p className="auth-footer">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
};

