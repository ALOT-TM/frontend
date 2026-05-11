# 🎁 Frontend DDD - Fluxus Backend

Frontend React moderno para el sistema de gestión de merma y donaciones con arquitectura DDD.

## 🚀 Características

- **Autenticación de Roles**
  - Gerente de Retail (MANAGER): Gestión completa de merma, beneficiarios y donaciones
  - Beneficiario (BENEFICIARY): Ver y confirmar donaciones asignadas

- **Módulos Implementados**
  - 📦 **Merma Management**: Registrar, clasificar y marcar merma como donable/no donable/donada
  - 🏫 **Beneficiaries Management**: Registrar instituciones beneficiarias, activar/desactivar
  - 🎁 **Donations Management**: Crear donaciones, marcar entrega, confirmar recepción
  - 🔐 **IAM**: Registro y login de usuarios

- **Arquitectura DDD**
  - Separación por bounded contexts
  - Application Services para casos de uso
  - Query y Command Services separados (CQRS ligero)
  - Modelo de dominio con Value Objects (conceptual)

## 📋 Requisitos Previos

- Node.js 18+
- npm o yarn
- Backend FluxusBackend ejecutándose en `http://localhost:8080`

## 🔧 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

## 🌐 Acceso de Prueba

### Credenciales Demo

**Gerente de Retail:**
- Email: `manager@retail.com`
- Password: `admin123`

**Beneficiario:**
- Email: `beneficiary@school.com`
- Password: `admin123`

## 📚 Estructura del Proyecto

```
src/
  shared/
    infrastructure/
      - apiClient.js                 # Cliente HTTP con Axios
      - context/AuthContext.jsx      # Contexto de autenticación
    hooks/
      - useAuth.js                   # Hook para acceso al auth
    components/
      - ProtectedRoute.jsx           # Rutas protegidas por rol
    pages/
      - UnauthorizedPage.jsx         # Página de acceso denegado
  
  iamModule/
    domain/services/
      - UserAuthenticationService.js # Servicio de autenticación
    interfaces/pages/
      - LoginPage.jsx
      - RegisterPage.jsx
      - AuthPage.css
  
  mermaManagementModule/
    application/
      - MermaCommandService.js       # Comandos: registrar, marcar donable, etc.
      - MermaQueryService.js         # Consultas: obtener mermas por estado
    interfaces/
      - layout/ManagerLayout.jsx     # Layout para gerente
      - pages/
        - ManagerDashboard.jsx       # Dashboard con estadísticas
        - MermaManagementPage.jsx    # CRUD de merma
  
  beneficiariesManagementModule/
    application/
      - BeneficiaryCommandService.js # Comandos: registrar, activar/desactivar
      - BeneficiaryQueryService.js   # Consultas: obtener beneficiarios
    interfaces/pages/
      - BeneficiaryManagementPage.jsx
  
  donationsManagementModule/
    application/
      - DonationCommandService.js    # Comandos: crear, entregar, confirmar
      - DonationQueryService.js      # Consultas: obtener donaciones
    interfaces/
      - layout/BeneficiaryLayout.jsx # Layout para beneficiario
      - pages/
        - DonationManagementPage.jsx # Gestión de donaciones (manager)
        - BeneficiaryDonationsPage.jsx # Ver mis donaciones (beneficiario)

App.jsx                              # Ruteo principal
main.jsx                             # Punto de entrada
index.css                            # Estilos globales
```

## 🔄 Flujo de Autenticación

1. **Login/Register** → `/login` o `/register`
2. **Auth Context** guarda el usuario en localStorage
3. **ProtectedRoute** valida rol y redirige según permiso
4. **Manager** → `/manager/dashboard`
5. **Beneficiary** → `/beneficiary/donations`

## 🎯 Rutas Disponibles

### Públicas
- `/login` - Página de inicio de sesión
- `/register` - Página de registro

### Manager (MANAGER)
- `/manager/dashboard` - Dashboard con estadísticas
- `/manager/merma` - Gestión de merma
- `/manager/beneficiaries` - Gestión de beneficiarios
- `/manager/donations` - Gestión de donaciones

### Beneficiario (BENEFICIARY)
- `/beneficiary/donations` - Mis donaciones asignadas

### Error
- `/unauthorized` - Acceso denegado

## 🛠️ Desarrollo

### Agregar un Nuevo Servicio

```javascript
// src/newModule/application/NewCommandService.js
import apiClient from '../../shared/infrastructure/apiClient';

class NewCommandService {
  async doSomething(data) {
    const response = await apiClient.post('/api-endpoint', data);
    return response.data;
  }
}

export default new NewCommandService();
```

### Usar AuthContext

```javascript
import { useAuth } from '../shared/hooks/useAuth';

function MyComponent() {
  const { user, login, logout, userRole } = useAuth();
  
  // Acceder a rol del usuario para condicionales
  if (userRole === 'MANAGER') {
    // mostrar opciones de manager
  }
}
```

### Crear una Página Protegida

1. Crear el componente en `interfaces/pages/`
2. Importar en `App.jsx`
3. Envolver en `<ProtectedRoute allowedRoles={['ROLE']}>`

```jsx
<Route
  path="/manager/new-feature"
  element={
      <ProtectedRoute allowedRoles={['MANAGER']}>
                <NewFeaturePage />
              </ProtectedRoute>
  }
/>
```

## 📡 Comunicación con Backend

El cliente usa **Axios** para las peticiones HTTP:

```javascript
// En cualquier servicio
const response = await apiClient.get('/mermas/1');
const newMerma = await apiClient.post('/mermas/register', { ... });
```

**Headers automáticos:**
- `Content-Type: application/json`
- `Authorization: Bearer {token}` (si existe en localStorage)

**Interceptores:**
- Si recibe 401, limpia auth y redirige a login
- Errores se lanzan para captura en componentes

## 🎨 Estilos y Temas

- **Color Primario:** `#667eea` / `#764ba2`
- **Color Secundario:** `#f5576c`
- **Paleta de Éxito/Alerta/Peligro:** Integrada en componentes

Todos los estilos están en archivos `.css` modulares por página.

## 🚨 Manejo de Errores

Los servicios lanzan excepciones que deben capturarse en componentes:

```javascript
try {
  await MermaCommandService.registerMerma(...);
  // actualizar UI
} catch (err) {
  setError(err.message || 'Error desconocido');
}
```

## 📝 Apuntes de Implementación

- No se usan DTOs explícitos; se pasan objetos JavaScript simples
- El backend espera comandos/queries como JSON plano
- Las respuestas del backend son agregados (Merma, Donation, etc.)
- Estado global solo para auth; estado local en componentes
- CSS responsive para mobile, tablet, desktop

## 🔐 Seguridad

⚠️ **LIMITACIONES ACTUALES:**

- El token se guarda en localStorage (vulnerable)
- No hay validación de JWT en el frontend
- Para env. de producción, implementar:
  - Cookies HttpOnly con token
  - Refresh token mechanism
  - CSRF protection
  - Rate limiting

## 🐛 Troubleshooting

**Error: "Module not found"**
- Verificar las rutas de importación
- Confirmar que los archivos existen

**Error: "Cannot resolve apiClient"**
- Verificar que `src/shared/infrastructure/apiClient.js` existe
- Ajustar la ruta relativa según la profundidad de carpetas

**Backend no responde:**
- Asegurarse que FluxusBackend está en `http://localhost:8080`
- Verificar CORS habilitado en backend

**Auth no persiste:**
- Revisar localStorage en DevTools
- Confirmar que `UserAuthenticationService` guarda los datos

## 📞 Soporte del Backend

Para más información sobre los endpoints, consultar el README del backend FluxusBackend.

Base URL: `http://localhost:8080`

## 📄 Licencia

Proyecto educativo UPC - Ciclo 7

