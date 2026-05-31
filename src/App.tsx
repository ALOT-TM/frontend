import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/auth/Login";
import { RegisterSelection } from "./pages/auth/RegisterSelection";
import { RetailPricing } from "./pages/auth/RetailPricing";
import { RetailRegistration } from "./pages/auth/RetailRegistration";
import { BeneficiaryForm } from "./pages/auth/BeneficiaryForm";
import { RetailLayout } from "./components/layouts/RetailLayout";
import { AuthLayout } from "./components/layouts/AuthLayout";
import { Dashboard } from "./pages/retail/Dashboard";
import { Locales } from "./pages/retail/Locales";
import { GestionMerma } from "./pages/retail/GestionMerma";
import { Donaciones } from "./pages/retail/Donaciones";
import { Accesos } from "./pages/retail/Accesos";
import { Historial } from "./pages/retail/Historial";
import { Configuracion } from "./pages/retail/Configuracion";
import { BeneficiaryLayout } from "./components/layouts/BeneficiaryLayout";
import { BuscarDonaciones } from "./pages/beneficiary/BuscarDonaciones";
import { MisSeguimientos } from "./pages/beneficiary/MisSeguimientos";
import { ConfiguracionBeneficiario } from "./pages/beneficiary/ConfiguracionBeneficiario";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <Router>
      <Routes>
        {/* Rutas Públicas (Auth) */}
        <Route element={<AuthLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register-selection" element={<RegisterSelection />} />
          <Route path="/register/retail" element={<RetailPricing />} />
          <Route path="/register/retail/checkout" element={<RetailRegistration />} />
          <Route path="/register/beneficiary" element={<BeneficiaryForm />} />
        </Route>
        
        {/* Rutas Privadas Retail */}
        <Route path="/retail" element={<RetailLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          {/* Rutas placeholder */}
          <Route path="gestion-merma" element={<GestionMerma />} />
          <Route path="donaciones" element={<Donaciones />} />
          <Route path="locales" element={<Locales />} />
          <Route path="accesos" element={<Accesos />} />
          <Route path="historial" element={<Historial />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>

        {/* Rutas Privadas Beneficiario */}
        <Route path="/beneficiary" element={<BeneficiaryLayout />}>
          <Route index element={<Navigate to="buscar" replace />} />
          <Route path="buscar" element={<BuscarDonaciones />} />
          <Route path="seguimientos" element={<MisSeguimientos />} />
          <Route path="configuracion" element={<ConfiguracionBeneficiario />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
    </>
  );
}

export default App;
