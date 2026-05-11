import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/infrastructure/context/AuthContext';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { LoginPage } from './iamModule/interfaces/pages/LoginPage';
import { RegisterPage } from './iamModule/interfaces/pages/RegisterPage';
import { UnauthorizedPage } from './shared/pages/UnauthorizedPage';
import { ManagerLayout } from './mermaManagementModule/interfaces/layout/ManagerLayout';
import { ManagerDashboard } from './mermaManagementModule/interfaces/pages/ManagerDashboard';
import { MermaManagementPage } from './mermaManagementModule/interfaces/pages/MermaManagementPage';
import { BeneficiaryManagementPage } from './beneficiariesManagementModule/interfaces/pages/BeneficiaryManagementPage';
import { DonationManagementPage } from './donationsManagementModule/interfaces/pages/DonationManagementPage';
import { BeneficiaryLayout } from './donationsManagementModule/interfaces/layout/BeneficiaryLayout';
import { BeneficiaryDonationsPage } from './donationsManagementModule/interfaces/pages/BeneficiaryDonationsPage';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Manager Routes */}
          <Route
            path="/manager/*"
            element={
              <ProtectedRoute allowedRoles={['MANAGER']}>
                <ManagerLayout>
                  <Routes>
                    <Route path="dashboard" element={<ManagerDashboard />} />
                    <Route path="merma" element={<MermaManagementPage />} />
                    <Route path="beneficiaries" element={<BeneficiaryManagementPage />} />
                    <Route path="donations" element={<DonationManagementPage />} />
                    <Route path="*" element={<Navigate to="/manager/dashboard" replace />} />
                  </Routes>
                </ManagerLayout>
              </ProtectedRoute>
            }
          />

          {/* Beneficiary Routes */}
          <Route
            path="/beneficiary/*"
            element={
              <ProtectedRoute allowedRoles={['BENEFICIARY']}>
                <BeneficiaryLayout>
                  <Routes>
                    <Route path="donations" element={<BeneficiaryDonationsPage />} />
                    <Route path="*" element={<Navigate to="/beneficiary/donations" replace />} />
                  </Routes>
                </BeneficiaryLayout>
              </ProtectedRoute>
            }
          />

          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
