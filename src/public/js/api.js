/**
 * ============================================================================
 * Sistema MLF - API Client
 * Archivo: js/api.js
 * Descripción: Cliente para interactuar con el backend API
 * ============================================================================
 */

// URL dinámica: localhost para desarrollo, relativa para producción
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:3000/api/v1'
  : '/api/v1';

class MLFApi {
  constructor() {
    this.token = localStorage.getItem('mlf_token');
    this.user = JSON.parse(localStorage.getItem('mlf_user') || 'null');
  }

  // Helper para headers de autenticación
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Helper para manejar respuestas
  async handleResponse(response) {
    const result = await response.json();

    if (!response.ok) {
      // Si es 401 (No autorizado), hacer logout automático
      if (response.status === 401) {
        console.warn('Token inválido o expirado - haciendo logout automático');
        this.token = null;
        this.user = null;
        localStorage.removeItem('mlf_token');
        localStorage.removeItem('mlf_user');
        // Solo redirigir si estamos en el navegador
        if (typeof window !== 'undefined' && !window.location.pathname.includes('login')) {
          window.location.href = '/login.html';
        }
      }

      // Extraer mensaje de error del resultado
      const errorMessage = this.extractErrorMessage(result);
      throw new Error(errorMessage);
    }

    // El backend envuelve respuestas en: { success, data, message, timestamp }
    // Si existe 'data', lo extraemos. Si no, retornamos el result completo
    return result.data !== undefined ? result.data : result;
  }

  // Helper para extraer mensaje de error de cualquier tipo de respuesta
  extractErrorMessage(error) {
    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object') {
      // Intentar extraer mensaje de diferentes estructuras comunes
      if (error.message) return error.message;
      if (error.error) return typeof error.error === 'string' ? error.error : error.error.message || 'Error desconocido';
      if (error.msg) return error.msg;
      if (error.details) return typeof error.details === 'string' ? error.details : JSON.stringify(error.details);

      // Si tiene código de error, incluirlo
      if (error.code) {
        return `Error ${error.code}: ${error.description || 'Error desconocido'}`;
      }

      // Intentar stringify como último recurso
      try {
        const stringified = JSON.stringify(error);
        if (stringified !== '{}' && stringified !== '[]') {
          return stringified;
        }
      } catch (e) {
        // Ignorar errores de stringify
      }
    }

    return 'Error desconocido en la petición';
  }

  // ============================================================================
  // AUTENTICACIÓN
  // ============================================================================

  async login(usuario, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: JSON.stringify({ usuario, password }),
    });

    const data = await this.handleResponse(response);

    // handleResponse ya extrae 'data' de { success, data, message }
    // data ahora contiene: { user, accessToken, refreshToken, expiresIn }

    // Guardar token y usuario
    this.token = data.accessToken;
    this.user = data.user;
    localStorage.setItem('mlf_token', this.token);
    localStorage.setItem('mlf_user', JSON.stringify(this.user));

    return data;
  }

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpiar datos locales
      this.token = null;
      this.user = null;
      localStorage.removeItem('mlf_token');
      localStorage.removeItem('mlf_user');
    }
  }

  async getMe() {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ============================================================================
  // SOCIOS
  // ============================================================================

  async getSocios(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/socios?${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getSocio(id) {
    const response = await fetch(`${API_BASE_URL}/socios/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async crearSocio(data) {
    const response = await fetch(`${API_BASE_URL}/socios`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async actualizarSocio(id, data) {
    const response = await fetch(`${API_BASE_URL}/socios/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async depositarAhorro(id, data) {
    const response = await fetch(`${API_BASE_URL}/socios/${id}/depositar`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async retirarAhorro(id, data) {
    const response = await fetch(`${API_BASE_URL}/socios/${id}/retirar`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async cambiarEtapa(id, nuevaEtapa) {
    const response = await fetch(`${API_BASE_URL}/socios/${id}/cambiar-etapa`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ nuevaEtapa }),
    });

    return this.handleResponse(response);
  }

  async getHistorialTransacciones(id) {
    const response = await fetch(`${API_BASE_URL}/socios/${id}/historial-transacciones`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ============================================================================
  // CRÉDITOS
  // ============================================================================

  async getCreditos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/creditos?${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getCredito(id) {
    const response = await fetch(`${API_BASE_URL}/creditos/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getCreditosSocio(socioId) {
    const response = await fetch(`${API_BASE_URL}/creditos/socio/${socioId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async solicitarCredito(data) {
    const response = await fetch(`${API_BASE_URL}/creditos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async aprobarCredito(id, observaciones) {
    const response = await fetch(`${API_BASE_URL}/creditos/${id}/aprobar`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ observaciones }),
    });

    return this.handleResponse(response);
  }

  async desembolsarCredito(id, data) {
    const response = await fetch(`${API_BASE_URL}/creditos/${id}/desembolsar`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async actualizarCredito(id, data) {
    const response = await fetch(`${API_BASE_URL}/creditos/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  // ============================================================================
  // PAGOS
  // ============================================================================

  async registrarPago(data) {
    const response = await fetch(`${API_BASE_URL}/pagos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async getPagosCredito(creditoId) {
    const response = await fetch(`${API_BASE_URL}/pagos/credito/${creditoId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getPagosRecientes(limite = 15) {
    const response = await fetch(`${API_BASE_URL}/pagos/recientes?limite=${limite}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getPago(id) {
    const response = await fetch(`${API_BASE_URL}/pagos/${id}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async actualizarPago(id, data) {
    const response = await fetch(`${API_BASE_URL}/pagos/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  // ============================================================================
  // MÉTRICAS Y DASHBOARD
  // ============================================================================

  async getMetricasDashboard(periodo = 'mes') {
    const response = await fetch(`${API_BASE_URL}/metricas/dashboard?periodo=${periodo}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ============================================================================
  // NOTIFICACIONES (SOLICITUDES)
  // ============================================================================

  async getNotificacionesAdmin(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/notificaciones/admin?${queryString}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async marcarNotificacionLeida(id) {
    const response = await fetch(`${API_BASE_URL}/notificaciones/${id}/leida`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ============================================================================
  // GASTOS OPERATIVOS
  // ============================================================================

  async getGastos(params = {}) {
    const queryParams = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/gastos?${queryParams}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async registrarGasto(data) {
    const response = await fetch(`${API_BASE_URL}/gastos`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return this.handleResponse(response);
  }

  async eliminarGasto(id) {
    const response = await fetch(`${API_BASE_URL}/gastos/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  async getCategoriasGastos() {
    const response = await fetch(`${API_BASE_URL}/gastos/categorias`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    return this.handleResponse(response);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  isAuthenticated() {
    return !!this.token;
  }

  getUser() {
    return this.user;
  }

  isAdmin() {
    return this.user && this.user.rol === 'ADMIN';
  }

  isTesorero() {
    return this.user && (this.user.rol === 'ADMIN' || this.user.rol === 'TESORERO');
  }
}

// Crear instancia global
const api = new MLFApi();

// ============================================================================
// HELPER GLOBAL: Formatear moneda con separador de miles
// ============================================================================
function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$ 0.00';
  }
  return '$ ' + parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// ============================================================================
// HELPER GLOBAL: Formatear fecha de forma segura
// ============================================================================
function formatDate(date) {
  if (!date) {
    return '-';
  }

  try {
    // CORRECCIÓN: Extraer solo año-mes-día de la fecha ISO
    // Esto evita problemas de zona horaria
    const dateStr = String(date);

    // Si es formato ISO (YYYY-MM-DDTHH:MM:SS.SSSZ), extraer solo la parte de fecha
    if (dateStr.includes('T') || dateStr.includes('Z')) {
      const datePart = dateStr.split('T')[0]; // Obtener YYYY-MM-DD
      const [year, month, day] = datePart.split('-');

      // Crear fecha en hora local (mediodía) para evitar cambios de día
      const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);

      if (isNaN(dateObj.getTime())) {
        return '-';
      }

      return dateObj.toLocaleDateString();
    }

    // Si es otro formato, usar método original
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '-';
    }
    return dateObj.toLocaleDateString();
  } catch (error) {
    return '-';
  }
}

// ============================================================================
// HELPER GLOBAL: Extraer mensaje de error de forma segura
// ============================================================================
function getErrorMessage(error) {
  // Si es una string, retornarla directamente
  if (typeof error === 'string') {
    return error;
  }

  // Si es un objeto Error estándar con message
  if (error instanceof Error && error.message) {
    return error.message;
  }

  // Si es un objeto genérico, intentar extraer el mensaje
  if (error && typeof error === 'object') {
    // Intentar propiedades comunes
    if (error.message) return String(error.message);
    if (error.error) {
      if (typeof error.error === 'string') return error.error;
      if (error.error.message) return String(error.error.message);
    }
    if (error.msg) return String(error.msg);
    if (error.details) {
      if (typeof error.details === 'string') return error.details;
      return JSON.stringify(error.details);
    }

    // Si tiene código de error
    if (error.code) {
      return `Error ${error.code}: ${error.description || 'Error desconocido'}`;
    }

    // Intentar stringify como último recurso
    try {
      const stringified = JSON.stringify(error);
      if (stringified && stringified !== '{}' && stringified !== '[]') {
        return stringified;
      }
    } catch (e) {
      // Si falla stringify, continuar
    }
  }

  // Valor por defecto
  return 'Error desconocido';
}

// ============================================================================
// HELPER GLOBAL: Confirmación personalizada (evita bugs con extensiones)
// ============================================================================
/**
 * Muestra un modal de confirmación personalizado
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} titulo - Título del modal (opcional)
 * @returns {Promise<boolean>} - true si confirma, false si cancela
 */
function customConfirm(mensaje, titulo = '⚠️ Confirmar Acción') {
  return new Promise((resolve) => {
    // Crear modal si no existe
    let modal = document.getElementById('globalConfirmModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'globalConfirmModal';
      modal.className = 'modal-overlay';
      modal.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:99999;align-items:center;justify-content:center;';
      modal.innerHTML = `
        <div style="background:white;border-radius:12px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);">
          <div style="background:#ffc107;color:#212529;padding:1rem;border-radius:12px 12px 0 0;">
            <h5 id="gcmTitulo" style="margin:0;font-size:1.1rem;">${titulo}</h5>
          </div>
          <div style="padding:1.5rem;">
            <p id="gcmMensaje" style="font-size:1rem;text-align:center;margin:0;">${mensaje}</p>
          </div>
          <div style="padding:1rem;display:flex;gap:1rem;justify-content:center;border-top:1px solid #eee;">
            <button id="gcmNo" type="button" style="padding:0.75rem 2rem;border:none;border-radius:8px;background:#6c757d;color:white;cursor:pointer;font-size:1rem;">No, Cancelar</button>
            <button id="gcmSi" type="button" style="padding:0.75rem 2rem;border:none;border-radius:8px;background:#28a745;color:white;cursor:pointer;font-size:1rem;">Sí, Confirmar</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    // Actualizar contenido
    document.getElementById('gcmTitulo').textContent = titulo;
    document.getElementById('gcmMensaje').textContent = mensaje;

    // Mostrar modal
    modal.style.display = 'flex';

    // Event handlers
    const handleYes = () => {
      modal.style.display = 'none';
      cleanup();
      resolve(true);
    };

    const handleNo = () => {
      modal.style.display = 'none';
      cleanup();
      resolve(false);
    };

    const cleanup = () => {
      document.getElementById('gcmSi').removeEventListener('click', handleYes);
      document.getElementById('gcmNo').removeEventListener('click', handleNo);
    };

    document.getElementById('gcmSi').addEventListener('click', handleYes);
    document.getElementById('gcmNo').addEventListener('click', handleNo);
  });
}
