/**
 * ============================================================================
 * Sistema MLF - Dashboard del Socio (Frontend)
 * Archivo: js/dashboard-socio.js
 * Descripción: Lógica del dashboard personalizado para socios
 * ============================================================================
 */

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

// URL dinámica: localhost para desarrollo, relativa para producción
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://127.0.0.1:3000/api/v1'
  : '/api/v1';

// ============================================================================
// INICIALIZACIÓN
// ============================================================================

window.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticación
  if (!verificarAutenticacion()) {
    window.location.href = '/login.html';
    return;
  }

  // Verificar que el rol sea SOCIO
  const rol = localStorage.getItem('rol');
  if (rol !== 'SOCIO') {
    alert('Esta página es solo para socios. Redirigiendo...');
    localStorage.clear();
    window.location.href = '/login.html';
    return;
  }

  // Mostrar nombre del usuario en navbar
  const nombreCompleto = localStorage.getItem('nombreCompleto');
  if (nombreCompleto) {
    const userNameElement = document.getElementById('userName');
    const navUsuarioElement = document.getElementById('navUsuario');

    if (userNameElement) {
      userNameElement.textContent = nombreCompleto;
    }
    if (navUsuarioElement) {
      navUsuarioElement.textContent = nombreCompleto;
    }
  }

  // Cargar datos del dashboard
  await cargarDashboard();

  // Iniciar polling de notificaciones (cada 60s)
  setInterval(() => {
    if (localStorage.getItem('token')) {
      cargarNotificaciones();
    }
  }, 60000);
});

// ============================================================================
// AUTENTICACIÓN
// ============================================================================

/**
 * Verificar si el usuario está autenticado
 */
function verificarAutenticacion() {
  const token = localStorage.getItem('token');
  const socioId = localStorage.getItem('socioId');
  return token && socioId;
}

/**
 * Cerrar sesión
 */
async function cerrarSesion() {
  const confirmed = await customConfirm('¿Estás seguro de que deseas cerrar sesión?', '🚪 Cerrar Sesión');
  if (confirmed) {
    localStorage.clear();
    window.location.href = '/login.html';
  }
}

// ============================================================================
// SISTEMA DE NOTIFICACIONES
// ============================================================================

let notificacionesCargadas = [];

/**
 * Cargar notificaciones del socio
 */
async function cargarNotificaciones() {
  try {
    const token = localStorage.getItem('token');
    const socioId = localStorage.getItem('socioId');

    if (!token || !socioId) return;

    const response = await fetch(`${API_URL}/notificaciones/socio/${socioId}?limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('Notificaciones no disponibles');
      renderizarNotificacionesVacias();
      return;
    }

    const result = await response.json();

    if (result.success && result.data) {
      notificacionesCargadas = result.data.notificaciones || result.data || [];
      renderizarNotificaciones(notificacionesCargadas);
    } else {
      renderizarNotificacionesVacias();
    }
  } catch (error) {
    console.log('Error cargando notificaciones:', error.message);
    renderizarNotificacionesVacias();
  }
}

/**
 * Toggle dropdown de notificaciones
 */
function toggleNotifications() {
  const dropdown = document.getElementById('notificationDropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

// Cerrar dropdown al hacer click fuera
document.addEventListener('click', function (event) {
  const wrapper = document.querySelector('.notification-wrapper');
  const dropdown = document.getElementById('notificationDropdown');

  if (wrapper && dropdown && !wrapper.contains(event.target)) {
    dropdown.classList.remove('show');
  }
});

/**
 * Renderizar lista de notificaciones
 */
function renderizarNotificaciones(notificaciones) {
  const list = document.getElementById('notificationList');
  const badge = document.getElementById('notificationBadge');

  if (!list) return;

  // Contar no leídas (usando fechaLeida del backend)
  const noLeidas = notificaciones.filter(n => !n.fechaLeida).length;

  // Actualizar badge
  if (badge) {
    if (noLeidas > 0) {
      badge.textContent = noLeidas > 9 ? '9+' : noLeidas;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  // Si no hay notificaciones
  if (!notificaciones || notificaciones.length === 0) {
    renderizarNotificacionesVacias();
    return;
  }

  // Generar HTML de notificaciones
  const html = notificaciones.map(notif => {
    const icon = getNotificationIcon(notif.tipo);
    const timeAgo = calcularTiempoTranscurrido(notif.createdAt || notif.fechaCreacion);

    return `
      <div class="notification-item ${notif.fechaLeida ? '' : 'unread'}" onclick="marcarNotificacionLeida(${notif.id})">
        <div class="d-flex">
          <span class="icon">${icon}</span>
          <div class="flex-grow-1">
            <div class="title">${notif.asunto || notif.tipo}</div>
            <div class="message">${notif.mensaje || ''}</div>
            <div class="time">${timeAgo}</div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  list.innerHTML = html;
}

/**
 * Renderizar estado vacío de notificaciones
 */
function renderizarNotificacionesVacias() {
  const list = document.getElementById('notificationList');
  const badge = document.getElementById('notificationBadge');

  if (badge) badge.style.display = 'none';

  if (list) {
    list.innerHTML = `
      <div class="notification-empty">
        <div class="icon">🔔</div>
        <p>No tienes notificaciones</p>
      </div>
    `;
  }
}

/**
 * Obtener icono según tipo de notificación
 */
function getNotificationIcon(tipo) {
  const icons = {
    'CREDITO_APROBADO': '✅',
    'CREDITO_RECHAZADO': '❌',
    'CREDITO_DESEMBOLSADO': '💰',
    'PAGO_RECIBIDO': '💵',
    'CUOTA_PROXIMA': '📅',
    'CUOTA_VENCIDA': '⚠️',
    'RECORDATORIO': '🔔',
    'BIENVENIDA': '👋',
    'ALERTA_MORA': '🚨'
  };
  return icons[tipo] || '📌';
}

/**
 * Calcular tiempo transcurrido
 */
function calcularTiempoTranscurrido(fecha) {
  if (!fecha) return '';

  const ahora = new Date();
  const fechaNotif = new Date(fecha);
  const diffMs = ahora - fechaNotif;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMs / 3600000);
  const diffDias = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Ahora';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHoras < 24) return `Hace ${diffHoras}h`;
  if (diffDias < 7) return `Hace ${diffDias} días`;

  return fechaNotif.toLocaleDateString('es-ES');
}

/**
 * Marcar una notificación como leída
 */
async function marcarNotificacionLeida(notifId) {
  try {
    const token = localStorage.getItem('token');

    await fetch(`${API_URL}/notificaciones/${notifId}/leida`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Recargar notificaciones
    await cargarNotificaciones();
  } catch (error) {
    console.log('Error marcando notificación:', error.message);
  }
}

/**
 * Marcar todas las notificaciones como leídas
 */
async function marcarTodasLeidas() {
  try {
    const token = localStorage.getItem('token');
    const socioId = localStorage.getItem('socioId');

    // Marcar cada notificación no leída
    const noLeidas = notificacionesCargadas.filter(n => !n.fechaLeida);

    for (const notif of noLeidas) {
      await fetch(`${API_URL}/notificaciones/${notif.id}/leida`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    }

    // Recargar
    await cargarNotificaciones();
    alert('Todas las notificaciones marcadas como leídas');
  } catch (error) {
    console.log('Error:', error.message);
  }
}

/**
 * Ver todas las notificaciones (futuro: modal o página)
 */
function verTodasNotificaciones() {
  alert('Próximamente: Historial completo de notificaciones');
  toggleNotifications();
}

// ============================================================================
// CARGA DE DATOS
// ============================================================================

/**
 * Cargar dashboard completo del socio
 */
async function cargarDashboard() {
  const overlay = document.getElementById('loadingOverlay');

  try {
    // Mostrar loading
    if (overlay) overlay.style.display = 'flex';

    // Obtener token
    const token = localStorage.getItem('token');

    // Llamar API
    const response = await fetch(`${API_URL}/socios/me/dashboard`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('Sesión expirada. Por favor inicia sesión nuevamente.');
        localStorage.clear();
        window.location.href = '/login.html';
        return;
      }
      throw new Error(`Error al cargar dashboard: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Error al cargar datos');
    }

    // Renderizar datos
    renderizarDashboard(result.data);

  } catch (error) {
    console.error('Error cargando dashboard:', error);
    alert('Error al cargar el dashboard. Por favor intenta nuevamente.');
  } finally {
    // Ocultar loading
    if (overlay) overlay.style.display = 'none';
  }
}

// ============================================================================
// RENDERIZADO DE DATOS
// ============================================================================

/**
 * Renderizar todos los datos del dashboard
 */
function renderizarDashboard(data) {
  // Sección de bienvenida
  renderizarBienvenida(data.socio, data.estadisticas);

  // Tarjetas de estadísticas
  renderizarTarjetasEstadisticas(data.ahorros, data.creditos, data.proximasCuotas, data.estadisticas);

  // Panel de estado de créditos (NUEVO - timeline visual)
  renderizarCreditosStatus(data.creditosDetalle || []);

  // Próximas cuotas
  renderizarProximasCuotas(data.proximasCuotas);

  // Historial reciente
  renderizarHistorial(data.historialReciente);

  // Tarjeta de ahorros
  renderizarAhorros(data.ahorros);

  // Tarjeta de utilidades
  renderizarUtilidades(data.utilidades);

  // Tarjeta de garantías (nueva)
  renderizarGarantias(data.garantias);

  // Tarjeta de créditos
  renderizarCreditosCard(data.creditos);

  // Cargar notificaciones (separado para no bloquear el dashboard)
  cargarNotificaciones();
}

/**
 * Renderizar sección de bienvenida
 */
function renderizarBienvenida(socio, estadisticas) {
  // Nombre
  const nombreElement = document.getElementById('nombreSocio');
  if (nombreElement) {
    nombreElement.textContent = socio.nombreCompleto || 'Socio';
  }

  // Código
  const codigoElement = document.getElementById('codigoSocio');
  if (codigoElement) {
    codigoElement.textContent = socio.codigo || '-';
  }

  // Fecha de registro
  const fechaElement = document.getElementById('fechaRegistro');
  if (fechaElement && socio.fechaRegistro) {
    fechaElement.textContent = formatDate(socio.fechaRegistro);
  }

  // Días como socio
  const diasElement = document.getElementById('diasComoSocio');
  if (diasElement && estadisticas.diasComoSocio !== undefined) {
    diasElement.textContent = estadisticas.diasComoSocio;
  }

  // Etapa actual
  const etapaBadge = document.getElementById('etapaBadge');
  const progressoEtapa = document.getElementById('progressoEtapa');

  if (etapaBadge && socio.etapaActual) {
    etapaBadge.innerHTML = `📊 Etapa ${socio.etapaActual} - <span id="progressoEtapa">${socio.creditosEtapaActual || 0} de ${socio.etapaActual * 2} créditos</span>`;
  }
}

/**
 * Renderizar tarjetas de estadísticas principales
 */
/**
 * Renderizar tarjetas de estadísticas principales
 */
function renderizarTarjetasEstadisticas(ahorros, creditos, proximasCuotas, estadisticas) {
  // Ahorro Total (Tarjeta principal)
  const ahorroTotalElement = document.getElementById('ahorroTotal');
  if (ahorroTotalElement) {
    ahorroTotalElement.textContent = formatCurrency(ahorros.totalAhorrado || 0);
  }

  // Comprometido en Créditos (saldo capital pendiente)
  const comprometidoCreditosElement = document.getElementById('comprometidoCreditos');
  if (comprometidoCreditosElement) {
    const comprometido = ahorros.comprometidoEnCreditos || 0;
    comprometidoCreditosElement.textContent = formatCurrency(comprometido);
    comprometidoCreditosElement.style.color = comprometido > 0 ? '#ffc107' : '#28a745';
  }

  // Ahorro Congelado (por garantías)
  const ahorroCongeladoElement = document.getElementById('ahorroCongelado');
  if (ahorroCongeladoElement) {
    ahorroCongeladoElement.textContent = formatCurrency(ahorros.ahorroCongelado || 0);
  }

  // Balance Neto
  const balanceNetoElement = document.getElementById('balanceNeto');
  const estadoBalanceContainer = document.getElementById('estadoBalanceContainer');
  const estadoBalanceMensaje = document.getElementById('estadoBalanceMensaje');
  const btnRetirar = document.getElementById('btnRetirar');

  if (balanceNetoElement) {
    const balanceNeto = ahorros.balanceNeto || 0;
    const debeAlProyecto = ahorros.debeAlProyecto || false;
    const montoDeuda = ahorros.montoDeudaProyecto || 0;

    // Formatear balance con signo
    if (balanceNeto < 0) {
      balanceNetoElement.textContent = `- ${formatCurrency(Math.abs(balanceNeto))}`;
      balanceNetoElement.style.color = '#dc3545'; // Rojo para negativo
    } else {
      balanceNetoElement.textContent = formatCurrency(balanceNeto);
      balanceNetoElement.style.color = '#28a745'; // Verde para positivo
    }

    // Mostrar mensaje de estado con progreso motivacional
    if (estadoBalanceContainer && estadoBalanceMensaje) {
      estadoBalanceContainer.style.display = 'block';

      // Obtener datos de progreso
      const progreso = ahorros.progresoCredito || {};
      const tieneCreditos = progreso.tieneCreditos || false;
      const porcentajePagado = progreso.porcentajePagado || 0;
      const etapa = progreso.etapaProgreso || (tieneCreditos ? 1 : 8);
      const capitalPagado = progreso.capitalPagado || 0;
      const capitalOriginal = progreso.capitalOriginal || 0;

      // Definir mensajes por etapa
      const mensajesEtapa = {
        1: { // 0-10% pagado
          icon: '🚀',
          titulo: '¡Comenzaste tu aventura financiera!',
          mensaje: 'Cada pago te acerca más a recuperar tus ahorros. ¡Tú puedes!',
          color: 'rgba(108, 117, 125, 0.3)',
          border: 'rgba(108, 117, 125, 0.5)'
        },
        2: { // 10-25% pagado
          icon: '💪',
          titulo: '¡Buen inicio!',
          mensaje: `Ya devolviste el ${porcentajePagado}% del capital. ¡Vas muy bien!`,
          color: 'rgba(23, 162, 184, 0.3)',
          border: 'rgba(23, 162, 184, 0.5)'
        },
        3: { // 25-50% pagado
          icon: '🌟',
          titulo: '¡Excelente progreso!',
          mensaje: `${porcentajePagado}% pagado. ¡Estás a punto de llegar a la mitad!`,
          color: 'rgba(0, 123, 255, 0.3)',
          border: 'rgba(0, 123, 255, 0.5)'
        },
        4: { // ~50% pagado
          icon: '🎯',
          titulo: '¡LLEGASTE A LA MITAD!',
          mensaje: '¡Gran logro! Has pagado la mitad de tu crédito. ¡Sigue adelante!',
          color: 'rgba(255, 193, 7, 0.3)',
          border: 'rgba(255, 193, 7, 0.5)'
        },
        5: { // 50-75% pagado
          icon: '🏆',
          titulo: '¡Eres el orgullo del proyecto!',
          mensaje: `${porcentajePagado}% completado. ¡Sigue así, pronto habrás devuelto todo!`,
          color: 'rgba(255, 128, 0, 0.3)',
          border: 'rgba(255, 128, 0, 0.5)'
        },
        6: { // 75-99% pagado
          icon: '🌈',
          titulo: '¡Ya casi lo logras!',
          mensaje: `Solo te falta ${100 - porcentajePagado}%. ¡Estás por recuperar tus ahorros!`,
          color: 'rgba(102, 16, 242, 0.3)',
          border: 'rgba(102, 16, 242, 0.5)'
        },
        7: { // Balance positivo, recuperando ahorros
          icon: '🎉',
          titulo: '¡FELICITACIONES!',
          mensaje: `Ya devolviste el capital del proyecto. ¡Ahora recuperas TUS ahorros!`,
          color: 'rgba(40, 167, 69, 0.3)',
          border: 'rgba(40, 167, 69, 0.5)'
        },
        8: { // Sin créditos
          icon: '✅',
          titulo: '¡Libre de compromisos!',
          mensaje: 'Todos tus ahorros están disponibles para retiro.',
          color: 'rgba(40, 167, 69, 0.3)',
          border: 'rgba(40, 167, 69, 0.5)'
        }
      };

      const config = mensajesEtapa[etapa] || mensajesEtapa[1];

      // Aplicar estilos
      estadoBalanceContainer.style.backgroundColor = config.color;
      estadoBalanceContainer.style.border = `1px solid ${config.border}`;

      // Construir mensaje con barra de progreso si tiene créditos
      let htmlMensaje = '';

      if (tieneCreditos && etapa !== 8) {
        // Barra de progreso
        const colorBarra = porcentajePagado >= 50 ? '#28a745' :
          porcentajePagado >= 25 ? '#ffc107' : '#17a2b8';

        htmlMensaje = `
          <div style="margin-bottom: 8px;">
            <span style="font-size: 1.5rem;">${config.icon}</span>
            <strong style="font-size: 1rem; margin-left: 6px;">${config.titulo}</strong>
          </div>
          <div style="background: rgba(255,255,255,0.2); border-radius: 10px; height: 14px; margin: 8px 0; overflow: hidden;">
            <div style="background: ${colorBarra}; width: ${Math.min(porcentajePagado, 100)}%; height: 100%; border-radius: 10px; transition: width 0.5s;"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; opacity: 0.9;">
            <span>Pagado: ${formatCurrency(capitalPagado)}</span>
            <span><strong>${porcentajePagado}%</strong></span>
            <span>Total: ${formatCurrency(capitalOriginal)}</span>
          </div>
          <div style="margin-top: 6px; font-size: 0.9rem;">${config.mensaje}</div>
        `;
      } else {
        // Sin barra (etapa 7 u 8)
        htmlMensaje = `
          <div>
            <span style="font-size: 1.5rem;">${config.icon}</span>
            <strong style="font-size: 1rem; margin-left: 6px;">${config.titulo}</strong>
          </div>
          <div style="margin-top: 6px; font-size: 0.9rem;">${config.mensaje}</div>
        `;
      }

      // Si tiene balance positivo, añadir monto disponible
      if (balanceNeto > 0) {
        htmlMensaje += `<div style="margin-top: 8px; padding: 6px; background: rgba(40,167,69,0.3); border-radius: 6px;">
          💰 <strong>${formatCurrency(balanceNeto)}</strong> disponibles para retiro
        </div>`;
      } else if (debeAlProyecto) {
        htmlMensaje += `<div style="margin-top: 8px; padding: 6px; background: rgba(220,53,69,0.3); border-radius: 6px;">
          ⏳ Te faltan <strong>${formatCurrency(montoDeuda)}</strong> para comenzar a liberar tus ahorros
        </div>`;
      }

      estadoBalanceMensaje.innerHTML = htmlMensaje;
      estadoBalanceMensaje.style.color = '#fff';

      // Control del botón de retiro
      if (btnRetirar) {
        if (balanceNeto > 0) {
          btnRetirar.disabled = false;
          btnRetirar.style.opacity = '1';
          btnRetirar.title = 'Solicitar retiro de ahorros';
        } else {
          btnRetirar.disabled = true;
          btnRetirar.style.opacity = '0.5';
          btnRetirar.title = 'No tienes ahorros disponibles para retirar';
        }
      }
    }
  }

  // Total para Liquidar (si liquida hoy)
  const saldoPendienteElement = document.getElementById('saldoPendiente');
  if (saldoPendienteElement) {
    // Saldo = Capital pendiente + intereses del mes actual + intereses vencidos
    const saldo = creditos.saldoPendiente || 0;
    saldoPendienteElement.textContent = formatCurrency(saldo);

    // Cambiar color si no hay deuda
    const statCard = saldoPendienteElement.closest('.stat-card');
    if (statCard && saldo === 0) {
      statCard.classList.remove('warning');
      statCard.classList.add('success');
    }
  }

  // Próximo Pago - Lógica mejorada: Agrupar por fecha más próxima
  const proximoPagoElement = document.getElementById('proximoPago');
  const diasElement = document.getElementById('diasProximoPago'); // Subtítulo

  if (proximoPagoElement) {
    if (proximasCuotas && proximasCuotas.length > 0) {
      // 1. Encontrar la fecha de vencimiento más próxima
      // Ordenamos por diasParaVencimiento ascendente (menor es más próximo)
      const ordenadas = [...proximasCuotas].sort((a, b) => a.diasParaVencimiento - b.diasParaVencimiento);
      const primeraFecha = ordenadas[0].fechaVencimiento;
      const diasParaVencer = ordenadas[0].diasParaVencimiento;

      // 2. Filtrar todas las cuotas que vencen en esa misma fecha (o antes, si hay vencidas)
      // Usamos una tolerancia de string fecha para agrupar
      const fechaBaseStr = formatDate(primeraFecha);

      const cuotasProximas = ordenadas.filter(c => formatDate(c.fechaVencimiento) === fechaBaseStr);

      // 3. Sumar el saldo pendiente de esas cuotas
      const totalPagar = cuotasProximas.reduce((sum, c) => sum + c.saldoPendiente + (c.montoMora || 0), 0);

      proximoPagoElement.textContent = formatCurrency(totalPagar);

      if (diasElement) {
        if (diasParaVencer < 0) {
          diasElement.textContent = `Venció el ${fechaBaseStr} (${Math.abs(diasParaVencer)} días atraso)`;
          diasElement.classList.add('text-danger');
        } else if (diasParaVencer === 0) {
          diasElement.textContent = `¡Vence HOY!`;
          diasElement.classList.add('text-warning');
        } else {
          diasElement.textContent = `Vence el ${formatDateShort(primeraFecha)} (${diasParaVencer} días)`;
          diasElement.classList.remove('text-danger', 'text-warning');
        }
      }
    } else {
      proximoPagoElement.textContent = '$ 0.00';
      if (diasElement) diasElement.textContent = 'Sin pagos próximos';
    }
  }

  // Tasa de Cumplimiento
  const cumplimientoElement = document.getElementById('tasaCumplimiento');
  if (cumplimientoElement) {
    const tasa = estadisticas?.tasaCumplimiento || 100;
    cumplimientoElement.textContent = `${tasa.toFixed(1)}%`;

    // Cambiar color según tasa
    const statCard = cumplimientoElement.closest('.stat-card');
    if (statCard) {
      if (tasa >= 90) {
        statCard.classList.add('success');
        statCard.classList.remove('warning');
      } else if (tasa >= 70) {
        statCard.classList.add('warning');
        statCard.classList.remove('success');
      } else {
        statCard.classList.remove('success', 'warning');
      }
    }
  }
}

/**
 * Renderizar tabla de próximas cuotas
 */
function renderizarProximasCuotas(cuotas) {
  const tbody = document.getElementById('tablaCuotas');
  const emptyState = document.getElementById('emptyCuotas');

  if (!tbody) return;

  // Limpiar tabla
  tbody.innerHTML = '';

  // Verificar si hay cuotas
  if (!cuotas || cuotas.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No tienes cuotas pendientes</td></tr>';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // Ordenar por fecha de vencimiento (más próxima primero)
  const cuotasOrdenadas = [...cuotas].sort((a, b) => new Date(a.fechaVencimiento) - new Date(b.fechaVencimiento));

  // Limitar a las próximas 5 cuotas
  const cuotasMostrar = cuotasOrdenadas.slice(0, 5);

  cuotasMostrar.forEach((cuota) => {
    const tr = document.createElement('tr');

    // Determinar clase de estado
    let estadoClase = 'secondary';
    let estadoTexto = cuota.estado;
    let iconoSituacion = '';

    if (cuota.tieneMora) {
      estadoClase = 'danger';
      estadoTexto = 'En Mora';
      iconoSituacion = '⚠️ ';
    } else if (cuota.diasParaVencimiento <= 3) {
      estadoClase = 'warning';
      estadoTexto = 'Por Vencer';
      iconoSituacion = '⏳ ';
    } else if (cuota.estado === 'PENDIENTE') {
      estadoClase = 'info';
      estadoTexto = 'Pendiente';
    } else if (cuota.estado === 'PAGADA') {
      estadoClase = 'success';
      estadoTexto = 'Pagada';
      iconoSituacion = '✅ ';
    }

    tr.innerHTML = `
      <td>
        <strong>${cuota.creditoCodigo}</strong>
      </td>
      <td>
        Cuota #${cuota.numeroCuota}
      </td>
      <td>
        ${formatDate(cuota.fechaVencimiento)}
        ${cuota.diasParaVencimiento >= 0
        ? `<small class="text-muted d-block" style="font-size: 0.75rem;">${iconoSituacion}En ${cuota.diasParaVencimiento} días</small>`
        : `<small class="text-danger d-block" style="font-size: 0.75rem;">${iconoSituacion}Vencida hace ${Math.abs(cuota.diasParaVencimiento)} días</small>`
      }
      </td>
      <td class="text-end">
        <strong>${formatCurrency(cuota.saldoPendiente)}</strong>
        ${cuota.tieneMora && cuota.montoMora > 0
        ? `<small class="text-danger d-block" style="font-size: 0.75rem;">+ ${formatCurrency(cuota.montoMora)} mora</small>`
        : ''
      }
      </td>
      <td class="text-center">
        <span class="badge bg-${estadoClase}" style="font-size: 0.75rem;">${estadoTexto}</span>
      </td>
    `;

    tbody.appendChild(tr);
  });

}

/**
 * Renderizar historial de movimientos
 */
function renderizarHistorial(movimientos) {
  const lista = document.getElementById('historialLista');
  const emptyState = document.getElementById('emptyHistorial');

  if (!lista) return;

  // Limpiar lista
  lista.innerHTML = '';

  // Verificar si hay movimientos
  if (!movimientos || movimientos.length === 0) {
    lista.innerHTML = '<p class="text-center text-muted py-4">No hay movimientos recientes</p>';
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // 1. Limitar a los últimos 10 movimientos
  const historialMostrar = movimientos.slice(0, 10);

  // 2. Renderizar con diseño tipo extracto financiero
  historialMostrar.forEach((mov) => {
    const item = document.createElement('div');
    item.className = 'history-item d-flex align-items-center p-3 border-bottom';
    item.style.transition = 'background-color 0.2s';

    // Hover effect via JS or assume CSS handles it (or add inline style for simplicity)
    item.onmouseover = function () { this.style.backgroundColor = '#f8f9fa'; };
    item.onmouseout = function () { this.style.backgroundColor = 'transparent'; };

    // Determinar icono y estilos según tipo
    let iconoStr = '📄';
    let bgIcono = '#e9ecef';
    let colorMonto = '#333';
    let signo = '';

    // Configuración visual por tipo de transacción
    switch (mov.tipo) {
      case 'AHORRO':
      case 'DEPOSITO':
        iconoStr = '📥';
        bgIcono = '#d4edda'; // Verde claro
        colorMonto = '#28a745'; // Verde fuerte
        signo = '+';
        break;
      case 'RETIRO':
        iconoStr = '💸';
        bgIcono = '#fff3cd'; // Amarillo claro
        colorMonto = '#856404'; // Amarillo oscuro
        signo = '-';
        break;
      case 'PAGO': // Pago de cuota
        iconoStr = '🧾';
        bgIcono = '#cce5ff'; // Azul claro
        colorMonto = '#004085'; // Azul oscuro
        signo = '-';
        break;
      case 'DESEMBOLSO': // Recibe crédito
        iconoStr = '💰';
        bgIcono = '#d1ecf1'; // Cian claro
        colorMonto = '#0c5460'; // Cian oscuro
        signo = '+';
        break;
      case 'CREDITO': // Solicitud (informativo)
        iconoStr = '📝';
        bgIcono = '#e2e3e5';
        colorMonto = '#6c757d';
        break;
      default:
        iconoStr = '📌';
        break;
    }

    // Formatear fecha detallada
    const fechaObj = new Date(mov.fecha);
    const dia = fechaObj.getDate();
    const mes = fechaObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
    const hora = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    item.innerHTML = `
      <!-- Columna Fecha (Estilo calendario compacto) -->
      <div class="me-3 text-center" style="min-width: 50px; line-height: 1.2;">
        <div style="font-size: 0.75rem; color: #666; text-transform: uppercase;">${mes}</div>
        <div style="font-size: 1.25rem; font-weight: bold; color: #333;">${dia}</div>
      </div>

      <!-- Icono Circular -->
      <div class="me-3 d-flex align-items-center justify-content-center rounded-circle" 
           style="width: 40px; height: 40px; background-color: ${bgIcono}; font-size: 1.2rem;">
        ${iconoStr}
      </div>

      <!-- Detalles de la Transacción -->
      <div class="flex-grow-1">
        <div style="font-weight: 600; font-size: 0.95rem; color: #2c3e50;">
            ${getMovimientoTitulo(mov)}
        </div>
        <div class="d-flex text-muted" style="font-size: 0.75rem;">
            <span class="me-2">🕐 ${hora}</span>
            <span>${mov.referencia ? `#${mov.referencia}` : ''}</span>
        </div>
      </div>

      <!-- Monto -->
      <div class="text-end">
        <div style="font-weight: 700; font-size: 1rem; color: ${colorMonto};">
            ${signo} ${formatCurrency(mov.monto)}
        </div>
        <div style="font-size: 0.7rem; color: #adb5bd;">
            ${mov.estado || 'CONFIRMADO'}
        </div>
      </div>
    `;

    lista.appendChild(item);
  });
}

/**
 * Renderizar tarjeta de ahorros
 */
/**
 * Renderizar tarjeta de ahorros
 */
function renderizarAhorros(ahorros) {
  // Guardar ahorro disponible en variable global para el modal de retiro
  ahorroDisponibleGlobal = ahorros.ahorroDisponible || 0;

  // Ahorro disponible
  const disponibleElement = document.getElementById('ahorroDisponible');
  if (disponibleElement) {
    disponibleElement.textContent = formatCurrency(ahorros.ahorroDisponible || 0);
  }

  // Ahorro congelado
  const congeladoElement = document.getElementById('ahorroCongelado');
  if (congeladoElement) {
    congeladoElement.textContent = formatCurrency(ahorros.ahorroCongelado || 0);
  }

  // Total (Disponible + Congelado)
  const totalElement = document.getElementById('ahorroTotalDetalle');
  if (totalElement) {
    const total = (ahorros.ahorroDisponible || 0) + (ahorros.ahorroCongelado || 0);
    totalElement.textContent = formatCurrency(total);
  }

  // Último movimiento
  const ultimoMovElement = document.getElementById('ultimoMovimientoAhorro');
  if (ultimoMovElement && ahorros.ultimoMovimiento) {
    if (ahorros.ultimoMovimiento.fecha) {
      const tipo = ahorros.ultimoMovimiento.tipo || 'Movimiento';
      const monto = formatCurrency(ahorros.ultimoMovimiento.monto || 0);
      const fecha = formatDate(ahorros.ultimoMovimiento.fecha);
      ultimoMovElement.textContent = `${tipo} de ${monto} el ${fecha}`;
    } else {
      ultimoMovElement.textContent = 'Sin movimientos';
    }
  }
}

/**
 * Renderizar tarjeta de utilidades
 */
function renderizarUtilidades(utilidades) {
  // Total recibido
  const totalElement = document.getElementById('utilidadesTotales');
  if (totalElement) {
    totalElement.textContent = formatCurrency(utilidades.totalRecibido || 0);
  }

  // Último pago
  const ultimoPagoElement = document.getElementById('ultimoPagoUtilidad');
  if (ultimoPagoElement) {
    if (utilidades.ultimoPago && utilidades.ultimoPago.monto > 0) {
      const monto = formatCurrency(utilidades.ultimoPago.monto);
      const fecha = formatDate(utilidades.ultimoPago.fecha);
      ultimoPagoElement.textContent = `${monto} el ${fecha}`;
    } else {
      ultimoPagoElement.textContent = 'Sin pagos recibidos';
    }
  }

  // Porcentaje
  const porcentajeElement = document.getElementById('porcentajeUtilidades');
  if (porcentajeElement) {
    porcentajeElement.textContent = `${(utilidades.porcentajeAnual || 1).toFixed(1)}% anual`;
  }
}

/**
 * Renderizar tarjeta de garantías
 */
function renderizarGarantias(garantias) {
  const emptyState = document.getElementById('emptyGarantias');
  const lista = document.getElementById('garantiasLista');

  // Si no hay datos de garantías, mostrar estado vacío
  if (!garantias || (!garantias.otorgadas?.length && !garantias.recibidas?.length)) {
    if (emptyState) emptyState.style.display = 'block';
    if (lista) lista.innerHTML = '';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';

  // Contadores y montos
  const otorgadasCount = garantias.otorgadas?.length || 0;
  const recibidasCount = garantias.recibidas?.length || 0;
  let montoOtorgado = 0;
  let montoRecibido = 0;

  garantias.otorgadas?.forEach(g => { montoOtorgado += g.montoCongelado || 0; });
  garantias.recibidas?.forEach(g => { montoRecibido += g.montoCongelado || 0; });

  // Actualizar elementos
  const otorgadasCountEl = document.getElementById('garantiasOtorgadasCount');
  const recibidasCountEl = document.getElementById('garantiasRecibidasCount');
  const otorgadasMontoEl = document.getElementById('garantiasOtorgadasMonto');
  const recibidasMontoEl = document.getElementById('garantiasRecibidasMonto');

  if (otorgadasCountEl) otorgadasCountEl.textContent = otorgadasCount;
  if (recibidasCountEl) recibidasCountEl.textContent = recibidasCount;
  if (otorgadasMontoEl) otorgadasMontoEl.textContent = formatCurrency(montoOtorgado);
  if (recibidasMontoEl) recibidasMontoEl.textContent = formatCurrency(montoRecibido);

  // Renderizar lista de garantías activas
  if (lista && (otorgadasCount > 0 || recibidasCount > 0)) {
    let html = '';
    garantias.otorgadas?.forEach(g => {
      html += `<div class="d-flex justify-content-between mb-1">
        <span>🔸 A: ${g.nombreGarantizado || 'Socio'}</span>
        <span>${formatCurrency(g.montoCongelado)}</span>
      </div>`;
    });
    garantias.recibidas?.forEach(g => {
      html += `<div class="d-flex justify-content-between mb-1">
        <span>🔹 De: ${g.nombreGarante || 'Socio'}</span>
        <span>${formatCurrency(g.montoCongelado)}</span>
      </div>`;
    });
    lista.innerHTML = html;
  }
}

/**
 * Renderizar tarjeta de créditos
 */
function renderizarCreditosCard(creditos) {
  // Total Prestado
  const totalPrestadoElement = document.getElementById('totalPrestado');
  if (totalPrestadoElement) {
    totalPrestadoElement.textContent = formatCurrency(creditos.totalPrestado || 0);
  }

  // Total Pagado
  const totalPagadoElement = document.getElementById('totalPagado');
  if (totalPagadoElement) {
    totalPagadoElement.textContent = formatCurrency(creditos.totalPagado || 0);
  }

  // Saldo Capital (nuevo - valor contable)
  const saldoCapitalElement = document.getElementById('saldoCapital');
  if (saldoCapitalElement) {
    saldoCapitalElement.textContent = formatCurrency(creditos.saldoCapital || 0);
  }

  // Saldo Pendiente Detalle (para liquidar hoy)
  const saldoPendienteDetalleElement = document.getElementById('saldoPendienteDetalle');
  if (saldoPendienteDetalleElement) {
    saldoPendienteDetalleElement.textContent = formatCurrency(creditos.saldoPendiente || 0);
  }

  // Progreso de pago (barra) - basado en saldoCapital para precisión contable
  const progressBar = document.getElementById('progressPagos');
  const saldoCapital = creditos.saldoCapital || creditos.saldoPendiente || 0;

  if (progressBar && creditos.totalPrestado > 0) {
    const progreso = ((creditos.totalPrestado - saldoCapital) / creditos.totalPrestado) * 100;
    progressBar.style.width = `${Math.min(100, Math.max(0, progreso))}%`;
  } else if (progressBar) {
    progressBar.style.width = '0%';
  }

  // Porcentaje de progreso
  const porcentajePagadoElement = document.getElementById('porcentajePagado');
  if (porcentajePagadoElement && creditos.totalPrestado > 0) {
    const progreso = ((creditos.totalPrestado - saldoCapital) / creditos.totalPrestado) * 100;
    porcentajePagadoElement.textContent = `${Math.min(100, Math.max(0, progreso)).toFixed(1)}%`;
  } else if (porcentajePagadoElement) {
    porcentajePagadoElement.textContent = '0%';
  }
}

/**
 * Renderizar panel de estado de créditos con timeline visual
 * Muestra los créditos activos con su progreso: SOLICITADO → APROBADO → DESEMBOLSADO
 */
function renderizarCreditosStatus(creditosDetalle) {
  const container = document.getElementById('creditStatusContainer');
  const badge = document.getElementById('creditCountBadge');

  if (!container) return;

  // Si no hay créditos o es array vacío, mostrar mensaje
  if (!creditosDetalle || creditosDetalle.length === 0) {
    container.innerHTML = `
      <div class="no-credits-message">
        <div class="icon">💳</div>
        <p>No tienes solicitudes de crédito activas</p>
        <button class="btn btn-primary" onclick="solicitarNuevoCredito()">
          Solicitar mi primer crédito
        </button>
      </div>
    `;
    if (badge) badge.style.display = 'none';
    return;
  }

  // Filtrar créditos relevantes (no COMPLETADO ni CASTIGADO)
  const creditosActivos = creditosDetalle.filter(c =>
    ['SOLICITADO', 'APROBADO', 'DESEMBOLSADO'].includes(c.estado)
  );

  if (creditosActivos.length === 0) {
    container.innerHTML = `
      <div class="no-credits-message">
        <div class="icon">✅</div>
        <p>Todos tus créditos están al día</p>
        <button class="btn btn-outline-primary" onclick="solicitarNuevoCredito()">
          Solicitar nuevo crédito
        </button>
      </div>
    `;
    if (badge) badge.style.display = 'none';
    return;
  }

  // Actualizar badge
  if (badge) {
    badge.textContent = creditosActivos.length;
    badge.style.display = 'inline';
  }

  // Generar HTML de cada crédito
  const html = creditosActivos.map(credito => {
    const estado = credito.estado;
    const statusClass = `status-${estado.toLowerCase()}`;
    const badgeClass = `badge-${estado.toLowerCase()}`;

    // Determinar pasos completados para timeline
    const pasos = {
      solicitado: ['SOLICITADO', 'APROBADO', 'DESEMBOLSADO'].includes(estado),
      aprobado: ['APROBADO', 'DESEMBOLSADO'].includes(estado),
      desembolsado: estado === 'DESEMBOLSADO'
    };

    // Timeline HTML
    const timelineHTML = `
      <div class="credit-timeline">
        <div class="timeline-step ${pasos.solicitado ? (estado === 'SOLICITADO' ? 'current' : 'completed') : ''}">
          <div class="timeline-icon">📝</div>
          <div class="timeline-label">Solicitado</div>
        </div>
        <div class="timeline-step ${pasos.aprobado ? (estado === 'APROBADO' ? 'current' : 'completed') : ''}">
          <div class="timeline-icon">✅</div>
          <div class="timeline-label">Aprobado</div>
        </div>
        <div class="timeline-step ${pasos.desembolsado ? 'current' : ''}">
          <div class="timeline-icon">💰</div>
          <div class="timeline-label">Desembolsado</div>
        </div>
      </div>
    `;

    // Mensaje según estado
    let mensajeEstado = '';
    if (estado === 'SOLICITADO') {
      mensajeEstado = '<div class="alert alert-warning mb-2" style="font-size: 0.85rem;">⏳ Tu solicitud está siendo revisada por el administrador</div>';
    } else if (estado === 'APROBADO') {
      mensajeEstado = '<div class="alert alert-info mb-2" style="font-size: 0.85rem;">✅ ¡Aprobado! Pendiente de desembolso</div>';
    } else if (estado === 'DESEMBOLSADO') {
      mensajeEstado = '<div class="alert alert-success mb-2" style="font-size: 0.85rem;">💰 Crédito activo - Revisa tus cuotas abajo</div>';
    }

    // Botón de cancelar solo para SOLICITADO
    const cancelBtn = estado === 'SOLICITADO' ? `
      <button class="btn btn-outline-danger btn-sm credit-action-btn" onclick="cancelarSolicitudCredito(${credito.id})">
        ❌ Cancelar Solicitud
      </button>
    ` : '';

    return `
      <div class="credit-status-card ${statusClass}">
        <div class="credit-status-header">
          <span class="credit-status-code">${credito.codigo}</span>
          <span class="credit-status-badge ${badgeClass}">${getEstadoLabel(estado)}</span>
        </div>
        
        ${timelineHTML}
        ${mensajeEstado}
        
        <div class="credit-details-row">
          <span>Monto:</span>
          <strong>${formatCurrency(credito.montoSolicitado || credito.montoTotal)}</strong>
        </div>
        <div class="credit-details-row">
          <span>Plazo:</span>
          <strong>${credito.plazoMeses} meses</strong>
        </div>
        <div class="credit-details-row">
          <span>Fecha solicitud:</span>
          <strong>${formatDate(credito.fechaSolicitud)}</strong>
        </div>
        ${credito.saldoCapital !== undefined && estado === 'DESEMBOLSADO' ? `
          <div class="credit-details-row">
            <span>Saldo pendiente:</span>
            <strong style="color: var(--danger-color);">${formatCurrency(credito.saldoCapital)}</strong>
          </div>
        ` : ''}
        
        ${cancelBtn}
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

/**
 * Obtener etiqueta legible del estado
 */
function getEstadoLabel(estado) {
  const labels = {
    'SOLICITADO': '⏳ Pendiente',
    'APROBADO': '✅ Aprobado',
    'DESEMBOLSADO': '💰 Activo',
    'COMPLETADO': '🎉 Completado',
    'RECHAZADO': '❌ Rechazado',
    'CASTIGADO': '⚠️ Castigado'
  };
  return labels[estado] || estado;
}

/**
 * Cancelar solicitud de crédito (solo estado SOLICITADO)
 */
async function cancelarSolicitudCredito(creditoId) {
  const confirmed = await customConfirm('¿Estás seguro de cancelar esta solicitud de crédito?', '❌ Cancelar Solicitud');
  if (!confirmed) {
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/creditos/${creditoId}/cancelar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ motivo: 'Cancelado por el socio' })
    });

    const result = await response.json();

    if (result.success) {
      alert('Solicitud cancelada exitosamente');
      await cargarDashboard();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    alert('Error al cancelar: ' + error.message);
  }
}

/**
 * Obtener título descriptivo del movimiento
 */
function getMovimientoTitulo(mov) {
  // Si ya tiene concepto personalizado, usarlo (opcional, pero preferimos el título estándar)
  // return mov.concepto || mov.tipo; 

  // Mapeo de tipos a títulos amigables
  const titulos = {
    'AHORRO': 'Depósito de Ahorro',
    'DEPOSITO': 'Depósito de Ahorro',
    'RETIRO': 'Retiro de Ahorro',
    'PAGO': 'Pago de Crédito',
    'DESEMBOLSO': 'Crédito Recibido',
    'CREDITO': 'Solicitud de Crédito',
    'GARANTIA': 'Movimiento de Garantía',
    'UTILIDAD': 'Pago de Utilidades'
  };

  return titulos[mov.tipo] || mov.concepto || mov.tipo;
}

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/**
 * Formatear número como moneda
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) {
    return '$ 0.00';
  }

  const num = typeof amount === 'number' ? amount : parseFloat(amount);

  if (isNaN(num)) {
    return '$ 0.00';
  }

  // Usar 'en-US' para asegurar que siempre muestre $ en lugar de USD
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);

  // Agregar espacio entre el símbolo $ y el número
  return formatted.replace('$', '$ ');
}

/**
 * Formatear fecha
 */
function formatDate(dateString) {
  if (!dateString) {
    return '-';
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Formatear fecha corta
 */
function formatDateShort(dateString) {
  if (!dateString) {
    return '-';
  }

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('es-NI', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * ============================================================================
 * FUNCIONES DE ACCIONES RÁPIDAS
 * ============================================================================
 */

// Variable global para almacenar info del ahorro
let ahorroDisponibleGlobal = 0;

/**
 * Solicitar nuevo crédito - Abre el modal
 */
async function solicitarNuevoCredito() {
  const modal = new bootstrap.Modal(document.getElementById('modalSolicitarCredito'));
  modal.show();

  // Cargar información del límite de crédito
  await cargarLimiteCredito();

  // Agregar listeners para calcular cuota en tiempo real
  document.getElementById('creditoMonto').addEventListener('input', calcularCuotaPrevia);
  document.getElementById('creditoPlazo').addEventListener('change', calcularCuotaPrevia);
  document.getElementById('creditoMetodo').addEventListener('change', calcularCuotaPrevia);
}

/**
 * Cargar información del límite de crédito del socio
 */
async function cargarLimiteCredito() {
  const infoContainer = document.getElementById('infoLimiteCredito');

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/socios/me/limite-credito`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (result.success) {
      const data = result.data;
      const btnEnviar = document.getElementById('btnEnviarCredito');

      if (data.puedesSolicitar) {
        infoContainer.className = 'alert alert-success mb-3';
        infoContainer.innerHTML = `
          <div class="d-flex justify-content-between mb-1">
            <span>Etapa Actual:</span>
            <strong>Etapa ${data.etapaActual}</strong>
          </div>
          <div class="d-flex justify-content-between mb-1">
            <span>Límite de tu Etapa:</span>
            <strong>${formatCurrency(data.limiteMaximoEtapa)}</strong>
          </div>
          <div class="d-flex justify-content-between mb-1">
            <span>En Uso (créditos activos):</span>
            <strong>${formatCurrency(data.montoEnUso)}</strong>
          </div>
          <div class="d-flex justify-content-between">
            <span><strong>Disponible para Solicitar:</strong></span>
            <strong style="color: #2e7d32;">${formatCurrency(data.disponible)}</strong>
          </div>
        `;
        document.getElementById('creditoMonto').max = data.disponible;
        btnEnviar.disabled = false;
      } else {
        infoContainer.className = 'alert alert-warning mb-3';
        infoContainer.innerHTML = `
          <strong>No puedes solicitar crédito en este momento</strong>
          <br><span>${data.razon}</span>
        `;
        btnEnviar.disabled = true;
      }
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Error cargando límite:', error);
    infoContainer.className = 'alert alert-danger mb-3';
    infoContainer.innerHTML = `<span>Error al cargar información: ${error.message}</span>`;
  }
}

/**
 * Calcular cuota previa mientras el usuario llena el formulario
 */
function calcularCuotaPrevia() {
  const monto = parseFloat(document.getElementById('creditoMonto').value) || 0;
  const plazo = parseInt(document.getElementById('creditoPlazo').value) || 12;
  const metodo = document.getElementById('creditoMetodo').value;
  const previaCuota = document.getElementById('previaCuotaCredito');

  if (monto < 100) {
    previaCuota.style.display = 'none';
    return;
  }

  const tasaMensual = 0.015; // 1.5% mensual (18% anual)
  const fechaInicio = new Date();

  // Calcular tabla completa para tener datos precisos
  let tabla = [];
  // Calculamos incluyendo seguro para consistencia con calculadora principal (simulada)
  // Nota: En la solicitud real el backend recalcula, pero esto es una estimación para el usuario
  const primaSeguro = monto * 0.01;
  const montoConSeguro = monto + primaSeguro;

  if (metodo === 'FRANCES') {
    tabla = calcularMetodoFrances(montoConSeguro, plazo, tasaMensual, fechaInicio);
  } else {
    tabla = calcularMetodoAleman(montoConSeguro, plazo, tasaMensual, fechaInicio);
  }

  // Obtener primera cuota y total
  let cuotaMostrar = 0;
  let totalPagar = 0;

  if (tabla.length > 0) {
    cuotaMostrar = tabla[0].cuota;
    totalPagar = tabla.reduce((sum, item) => sum + item.cuota, 0);
  }

  document.getElementById('cuotaEstimada').textContent = formatCurrency(cuotaMostrar);
  document.getElementById('totalEstimado').textContent = formatCurrency(totalPagar);
  previaCuota.style.display = 'block';

  // Renderizar tabla en el modal
  renderizarTablaAmortizacionModal(tabla);
}

/**
 * Renderizar tabla de amortización en el modal
 */
function renderizarTablaAmortizacionModal(tabla) {
  const tbody = document.getElementById('modalTablaAmortizacionBody');
  if (!tbody) return;

  let html = '';
  tabla.forEach(cuota => {
    html += `
      <tr>
        <td>${cuota.numero}</td>
        <td>${formatDateShort(cuota.fechaVencimiento)}</td>
        <td class="text-end"><strong>${formatCurrency(cuota.cuota)}</strong></td>
        <td class="text-end text-muted">${formatCurrency(cuota.saldo)}</td>
      </tr>
    `;
  });
  tbody.innerHTML = html;
}

/**
 * Mostrar/Ocultar tabla en el modal
 */
function toggleTablaAmortizacionModal() {
  const container = document.getElementById('modalTablaAmortizacionContainer');
  const btn = event.target;

  if (container.style.display === 'none') {
    container.style.display = 'block';
    btn.textContent = '📄 Ocultar Tabla';
  } else {
    container.style.display = 'none';
    btn.textContent = '📄 Ver Tabla de Amortización';
  }
}

/**
 * Enviar solicitud de crédito
 */
async function enviarSolicitudCredito() {
  const monto = document.getElementById('creditoMonto').value;
  const plazo = document.getElementById('creditoPlazo').value;
  const metodo = document.getElementById('creditoMetodo').value;
  const proposito = document.getElementById('creditoProposito').value;

  if (!monto || !plazo || !proposito) {
    showToast('Por favor completa todos los campos requeridos', 'warning');
    return;
  }

  const btn = document.getElementById('btnEnviarCredito');
  btn.disabled = true;
  btn.innerHTML = 'Enviando...';

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/socios/me/solicitar-credito`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        montoSolicitado: parseFloat(monto),
        plazoMeses: parseInt(plazo),
        metodoAmortizacion: metodo,
        proposito,
      }),
    });

    const result = await response.json();

    if (result.success) {
      showToast('Solicitud enviada exitosamente. Tu solicitud será revisada por el administrador.', 'success');
      bootstrap.Modal.getInstance(document.getElementById('modalSolicitarCredito')).hide();
      // Recargar dashboard
      await cargarDashboard();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    showToast('Error: ' + error.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Enviar Solicitud';
  }
}

/**
 * Hacer depósito de ahorro - Abre el modal
 */


/**
 * Mostrar modal de pago con cuotas pendientes
 * @param {string|null} filtroCreditoCodigo - Código de crédito para filtrar (opcional)
 */
async function mostrarModalPago(filtroCreditoCodigo = null) {
  const modal = new bootstrap.Modal(document.getElementById('modalPago'));
  modal.show();

  // Resetear estado
  document.getElementById('cuotaIdSeleccionada').value = '';
  document.getElementById('creditoIdSeleccionado').value = '';
  document.getElementById('montoPago').value = '';
  document.getElementById('btnReportarPago').disabled = true;
  document.getElementById('cuotaSeleccionadaInfo').style.display = 'none';

  // Cargar cuotas pendientes
  await cargarCuotasPendientes(filtroCreditoCodigo);
}

/**
 * Cargar cuotas pendientes de todos los créditos activos
 * @param {string|null} filtroCreditoCodigo - Código de crédito para filtrar (opcional)
 */
async function cargarCuotasPendientes(filtroCreditoCodigo = null) {
  const container = document.getElementById('listaCuotasPendientes');

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/socios/me/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();

    if (!data.success || !data.data.proximasCuotas || data.data.proximasCuotas.length === 0) {
      container.innerHTML = `
        <div class="alert alert-warning py-3 text-center">
          <div class="fs-4 mb-2">✅</div>
          <strong>¡No tienes cuotas pendientes!</strong>
          <p class="mb-0 small">Todos tus créditos están al día.</p>
        </div>
      `;
      return;
    }

    let cuotas = data.data.proximasCuotas;

    // Filtrar si se especifica un crédito
    if (filtroCreditoCodigo) {
      cuotas = cuotas.filter(c => c.creditoCodigo === filtroCreditoCodigo);

      // Si después de filtrar no hay cuotas, mostrar mensaje específico
      if (cuotas.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info py-3 text-center">
            <div class="fs-4 mb-2">ℹ️</div>
            <strong>No hay cuotas pendientes para este crédito</strong>
            <p class="mb-0 small">Este crédito está al día.</p>
          </div>
        `;
        return;
      }
    }

    // Agrupar cuotas por crédito
    const cuotasPorCredito = {};
    cuotas.forEach(c => {
      if (!cuotasPorCredito[c.creditoCodigo]) {
        cuotasPorCredito[c.creditoCodigo] = [];
      }
      cuotasPorCredito[c.creditoCodigo].push(c);
    });

    let html = '';

    for (const [creditoCodigo, cuotasCredito] of Object.entries(cuotasPorCredito)) {
      html += `<div class="mb-2"><small class="text-muted fw-bold">${creditoCodigo}</small></div>`;

      cuotasCredito.forEach(cuota => {
        const esVencida = cuota.diasParaVencimiento < 0;
        const esHoy = cuota.diasParaVencimiento === 0;
        const estaProxima = cuota.diasParaVencimiento > 0 && cuota.diasParaVencimiento <= 7;

        let estadoClass = 'border-secondary';
        let estadoBadge = '';
        let bgClass = '';

        if (esVencida) {
          estadoClass = 'border-danger';
          bgClass = 'bg-danger bg-opacity-10';
          estadoBadge = `<span class="badge bg-danger">¡Vencida hace ${Math.abs(cuota.diasParaVencimiento)} días!</span>`;
        } else if (esHoy) {
          estadoClass = 'border-warning';
          bgClass = 'bg-warning bg-opacity-10';
          estadoBadge = `<span class="badge bg-warning text-dark">¡Vence HOY!</span>`;
        } else if (estaProxima) {
          estadoClass = 'border-info';
          estadoBadge = `<span class="badge bg-info">En ${cuota.diasParaVencimiento} días</span>`;
        } else {
          estadoBadge = `<span class="badge bg-secondary">En ${cuota.diasParaVencimiento} días</span>`;
        }

        const saldoCuota = cuota.saldoPendiente + (cuota.montoMora || 0);

        html += `
          <div class="card mb-2 cursor-pointer cuota-seleccionable ${bgClass}" 
               style="border-left: 4px solid; cursor: pointer;" 
               onclick="seleccionarCuota(${cuota.cuotaId}, '${creditoCodigo}', ${cuota.numeroCuota}, ${saldoCuota})"
               data-cuota-id="${cuota.cuotaId}">
            <div class="card-body py-2 px-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Cuota #${cuota.numeroCuota}</strong>
                  <span class="text-muted small ms-2">${formatDateShort(cuota.fechaVencimiento)}</span>
                  ${estadoBadge}
                </div>
                <div class="text-end">
                  <div class="fw-bold fs-5">${formatCurrency(saldoCuota)}</div>
                  ${cuota.montoMora > 0 ? `<small class="text-danger">(incluye mora: ${formatCurrency(cuota.montoMora)})</small>` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      });
    }

    container.innerHTML = html;

  } catch (error) {
    console.error('Error cargando cuotas:', error);
    container.innerHTML = `
      <div class="alert alert-danger py-2">
        Error al cargar cuotas. <a href="#" onclick="cargarCuotasPendientes()">Reintentar</a>
      </div>
    `;
  }
}

/**
 * Seleccionar una cuota para pagar
 */
function seleccionarCuota(cuotaId, creditoCodigo, numeroCuota, monto) {
  // Guardar selección
  document.getElementById('cuotaIdSeleccionada').value = cuotaId;
  document.getElementById('creditoIdSeleccionado').value = creditoCodigo;

  // Actualizar UI de cuota seleccionada
  document.querySelectorAll('.cuota-seleccionable').forEach(el => {
    el.classList.remove('border-primary', 'bg-primary', 'bg-opacity-10');
  });
  document.querySelector(`[data-cuota-id="${cuotaId}"]`).classList.add('border-primary', 'bg-primary', 'bg-opacity-10');

  // Mostrar info de cuota seleccionada
  document.getElementById('cuotaSeleccionadaInfo').style.display = 'block';
  document.getElementById('cuotaSeleccionadaTexto').textContent = `${creditoCodigo} - Cuota #${numeroCuota}`;
  document.getElementById('cuotaSeleccionadaMonto').textContent = formatCurrency(monto);

  // Auto-llenar monto
  document.getElementById('montoPago').value = monto.toFixed(2);

  // Habilitar botón
  document.getElementById('btnReportarPago').disabled = false;
}

// Hacer funciones globales
window.seleccionarCuota = seleccionarCuota;
window.cargarCuotasPendientes = cargarCuotasPendientes;

async function enviarSolicitudPago() {
  const monto = document.getElementById('montoPago').value;
  const comprobante = document.getElementById('comprobantePago').value;
  const observaciones = document.getElementById('observacionesPago').value;
  const cuotaId = document.getElementById('cuotaIdSeleccionada').value;
  const creditoCodigo = document.getElementById('creditoIdSeleccionado').value;

  if (!monto || monto <= 0) {
    alert('Por favor ingresa un monto válido');
    return;
  }

  if (!cuotaId) {
    alert('Por favor selecciona una cuota a pagar');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/socios/me/solicitar-pago`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        monto: parseFloat(monto),
        cuotaId: parseInt(cuotaId),
        creditoCodigo,
        comprobante,
        observaciones
      })
    });

    const data = await response.json();

    if (data.success) {
      alert(`✅ Pago de ${formatCurrency(parseFloat(monto))} reportado exitosamente.\n\n${creditoCodigo}\n\nPendiente de aprobación por el administrador.`);
      bootstrap.Modal.getInstance(document.getElementById('modalPago')).hide();
      // Limpiar formulario
      document.getElementById('formPago').reset();
      document.getElementById('cuotaSeleccionadaInfo').style.display = 'none';
      // Recargar datos del dashboard
      cargarTodosLosDatos();
    } else {
      alert('Error: ' + (data.message || 'No se pudo registrar el pago'));
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error al registrar pago');
  }
}
function hacerRetiro() {
  const modal = new bootstrap.Modal(document.getElementById('modalRetiro'));
  modal.show();

  // Mostrar ahorro disponible
  document.getElementById('ahorroDisponibleRetiro').textContent = formatCurrency(ahorroDisponibleGlobal);
  document.getElementById('retiroMonto').max = ahorroDisponibleGlobal;
}

/**
 * Enviar solicitud de retiro
 */
async function enviarSolicitudRetiro() {
  const monto = document.getElementById('retiroMonto').value;
  const observaciones = document.getElementById('retiroObservaciones').value;

  if (!monto || parseFloat(monto) <= 0) {
    alert('Por favor ingresa un monto válido');
    return;
  }

  if (parseFloat(monto) > ahorroDisponibleGlobal) {
    alert('El monto excede tu ahorro disponible');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/socios/me/solicitar-retiro`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        monto: parseFloat(monto),
        observaciones,
      }),
    });

    const result = await response.json();

    if (result.success) {
      alert('Solicitud de retiro enviada.\n\n' + result.message);
      bootstrap.Modal.getInstance(document.getElementById('modalRetiro')).hide();
      // Limpiar formulario
      document.getElementById('formRetiro').reset();
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

/**
 * ============================================================================
 * CALCULADORA DE CRÉDITOS
 * ============================================================================
 */

// Variable global para almacenar la tabla de amortización
let tablaAmortizacionActual = [];

/**
 * Calcular crédito según los parámetros ingresados
 */
function calcularCredito() {
  // Obtener valores del formulario
  const monto = parseFloat(document.getElementById('calcMonto').value) || 0;
  const plazo = parseInt(document.getElementById('calcPlazo').value) || 12;
  const tasaMensual = parseFloat(document.getElementById('calcTasa').value) || 3;
  const metodo = document.getElementById('calcMetodo').value;

  // Validar monto
  if (monto < 100) {
    alert('El monto mínimo es $ 100.00');
    return;
  }

  if (monto > 50000) {
    alert('El monto máximo es $ 50,000.00');
    return;
  }

  // Validar plazo
  if (plazo < 1 || plazo > 36) {
    alert('El plazo debe estar entre 1 y 36 meses');
    return;
  }

  // Calcular amortización según el método
  const tasaDecimal = tasaMensual / 100;

  // ============================================================================
  // CÁLCULO DEL SEGURO DE DESGRAVAMEN (igual que el backend)
  // El seguro es 1% sobre el MONTO SOLICITADO (una sola vez, no por cuota)
  // Este monto se SUMA al capital y se financia junto con el préstamo
  // ============================================================================
  const TASA_SEGURO = 0.01; // 1% de seguro de desgravamen
  const primaSeguro = monto * TASA_SEGURO; // Seguro total = 1% del monto solicitado
  const montoTotalConSeguro = monto + primaSeguro; // Monto total a financiar

  // Fecha de inicio (hoy) y calcular fechas de vencimiento
  const fechaInicio = new Date();

  // Las cuotas se calculan sobre el MONTO TOTAL (capital + seguro)
  if (metodo === 'FRANCES') {
    tablaAmortizacionActual = calcularMetodoFrances(montoTotalConSeguro, plazo, tasaDecimal, fechaInicio);
  } else {
    tablaAmortizacionActual = calcularMetodoAleman(montoTotalConSeguro, plazo, tasaDecimal, fechaInicio);
  }

  // Calcular totales
  let totalIntereses = 0;
  let totalCapital = 0;
  tablaAmortizacionActual.forEach(cuota => {
    totalIntereses += cuota.interes;
    totalCapital += cuota.capital;
  });
  const totalPagar = totalCapital + totalIntereses;

  // Calcular fecha de finalización (última cuota)
  const fechaFin = tablaAmortizacionActual[tablaAmortizacionActual.length - 1].fechaVencimiento;

  // Actualizar resumen
  document.getElementById('resumenMonto').textContent = formatCurrency(monto);
  document.getElementById('resumenPlazo').textContent = `${plazo} meses`;
  document.getElementById('resumenTasa').textContent = `${tasaMensual}% mensual`;
  document.getElementById('resumenMetodo').textContent = metodo === 'FRANCES' ? 'Francés' : 'Alemán';
  document.getElementById('resumenFechaInicio').textContent = formatDateShort(fechaInicio);
  document.getElementById('resumenFechaFin').textContent = formatDateShort(fechaFin);
  document.getElementById('resumenIntereses').textContent = formatCurrency(totalIntereses);
  // El seguro se muestra como valor fijo (1% del monto solicitado)
  document.getElementById('resumenSeguro').textContent = formatCurrency(primaSeguro);
  document.getElementById('resumenTotal').textContent = formatCurrency(totalPagar);

  // Mostrar cuota mensual
  if (metodo === 'FRANCES') {
    const cuotaMensual = tablaAmortizacionActual[0].cuota;
    document.getElementById('resumenCuota').textContent = formatCurrency(cuotaMensual);
    document.getElementById('notaCuota').textContent = 'Cuota fija (capital+seguro financiado + intereses)';
  } else {
    const cuotaInicial = tablaAmortizacionActual[0].cuota;
    const cuotaFinal = tablaAmortizacionActual[tablaAmortizacionActual.length - 1].cuota;
    document.getElementById('resumenCuota').textContent = `${formatCurrency(cuotaInicial)} - ${formatCurrency(cuotaFinal)}`;
    document.getElementById('notaCuota').textContent = 'Cuota decreciente (capital+seguro financiado + intereses)';
  }

  // Renderizar tabla de amortización
  renderizarTablaAmortizacion(monto, primaSeguro, totalIntereses, totalPagar);

  // Mostrar resultados y ocultar estado inicial
  document.getElementById('calculadoraInicial').style.display = 'none';
  document.getElementById('resultadoCalculadora').style.display = 'block';
  document.getElementById('tablaAmortizacionContainer').style.display = 'none';
}

/**
 * Calcular fecha de vencimiento de cuota (mes + n meses)
 */
function calcularFechaVencimiento(fechaBase, numeroCuota) {
  const fecha = new Date(fechaBase);
  fecha.setMonth(fecha.getMonth() + numeroCuota);
  return fecha;
}

/**
 * Calcular amortización método Francés (cuotas iguales)
 * El capital YA incluye el seguro de desgravamen (1% del monto solicitado)
 */
function calcularMetodoFrances(capital, plazo, tasaMensual, fechaInicio) {
  const cuotas = [];

  // Fórmula del sistema francés: C = P * [i * (1+i)^n] / [(1+i)^n - 1]
  const factor = Math.pow(1 + tasaMensual, plazo);
  const cuotaFija = capital * (tasaMensual * factor) / (factor - 1);

  let saldoRestante = capital;

  for (let i = 1; i <= plazo; i++) {
    const interes = saldoRestante * tasaMensual;
    const capitalCuota = cuotaFija - interes;
    const fechaVencimiento = calcularFechaVencimiento(fechaInicio, i);

    saldoRestante -= capitalCuota;

    // Evitar valores negativos por redondeo
    if (saldoRestante < 0.01) saldoRestante = 0;

    cuotas.push({
      numero: i,
      fechaVencimiento: fechaVencimiento,
      cuota: redondear(cuotaFija),
      capital: redondear(capitalCuota),
      interes: redondear(interes),
      saldo: redondear(saldoRestante)
    });
  }

  return cuotas;
}

/**
 * Calcular amortización método Alemán (capital fijo)
 * El capital YA incluye el seguro de desgravamen (1% del monto solicitado)
 */
function calcularMetodoAleman(capital, plazo, tasaMensual, fechaInicio) {
  const cuotas = [];

  // En el método alemán, el capital es fijo en cada cuota
  const capitalFijo = capital / plazo;
  let saldoRestante = capital;

  for (let i = 1; i <= plazo; i++) {
    const interes = saldoRestante * tasaMensual;
    const cuotaTotal = capitalFijo + interes;
    const fechaVencimiento = calcularFechaVencimiento(fechaInicio, i);

    saldoRestante -= capitalFijo;

    // Evitar valores negativos por redondeo
    if (saldoRestante < 0.01) saldoRestante = 0;

    cuotas.push({
      numero: i,
      fechaVencimiento: fechaVencimiento,
      cuota: redondear(cuotaTotal),
      capital: redondear(capitalFijo),
      interes: redondear(interes),
      saldo: redondear(saldoRestante)
    });
  }

  return cuotas;
}

/**
 * Redondear a 2 decimales
 */
function redondear(valor) {
  return Math.round(valor * 100) / 100;
}

/**
 * Renderizar tabla de amortización
 * Muestra: #, Vencimiento, Capital, Interés, Cuota Total, Saldo
 * El seguro ya está incluido en el capital (montoTotal = monto + 1% seguro)
 */
function renderizarTablaAmortizacion(montoSolicitado, primaSeguro, totalIntereses, totalPagar) {
  const tbody = document.getElementById('tablaAmortizacionBody');
  const tfoot = document.getElementById('tablaAmortizacionTotales');

  if (!tbody || tablaAmortizacionActual.length === 0) return;

  let html = '';
  tablaAmortizacionActual.forEach(cuota => {
    html += `
      <tr>
        <td>${cuota.numero}</td>
        <td>${formatDateShort(cuota.fechaVencimiento)}</td>
        <td class="text-end">${formatCurrency(cuota.capital)}</td>
        <td class="text-end">${formatCurrency(cuota.interes)}</td>
        <td class="text-end"><strong>${formatCurrency(cuota.cuota)}</strong></td>
        <td class="text-end">${formatCurrency(cuota.saldo)}</td>
      </tr>
    `;
  });

  tbody.innerHTML = html;

  // Calcular capital total (monto + seguro)
  const capitalTotal = montoSolicitado + primaSeguro;

  // Renderizar totales en el footer
  if (tfoot) {
    tfoot.innerHTML = `
      <td colspan="2" class="text-end">TOTALES:</td>
      <td class="text-end">${formatCurrency(capitalTotal)}</td>
      <td class="text-end">${formatCurrency(totalIntereses)}</td>
      <td class="text-end">${formatCurrency(totalPagar)}</td>
      <td></td>
    `;
  }
}

/**
 * Toggle mostrar/ocultar tabla de amortización
 */
function toggleTablaAmortizacion() {
  const container = document.getElementById('tablaAmortizacionContainer');
  const btn = event.target;

  if (container.style.display === 'none') {
    container.style.display = 'block';
    btn.innerHTML = '📄 Ocultar Tabla de Amortización';
  } else {
    container.style.display = 'none';
    btn.innerHTML = '📄 Ver Tabla de Amortización';
  }
}

/**
 * Solicitar crédito desde la calculadora
 * Cierra el modal de calculadora, abre el de solicitud y pre-carga los datos.
 */
async function solicitarDesdeCalculadora() {
  const monto = document.getElementById('calcMonto').value;
  const plazo = document.getElementById('calcPlazo').value;
  const metodo = document.getElementById('calcMetodo').value;

  // 1. Cerrar modal calculadora
  const modalCalc = bootstrap.Modal.getInstance(document.getElementById('modalCalculadora'));
  if (modalCalc) modalCalc.hide();

  // 2. Abrir modal solicitud
  const modalReqEl = document.getElementById('modalSolicitarCredito');
  const modalReq = new bootstrap.Modal(modalReqEl);
  modalReq.show();

  // 3. Cargar limites
  await cargarLimiteCredito();

  // 4. Pre-llenar datos
  setTimeout(() => {
    const inputMonto = document.getElementById('creditoMonto');
    const inputPlazo = document.getElementById('creditoPlazo');
    const inputMetodo = document.getElementById('creditoMetodo');

    if (inputMonto) {
      inputMonto.value = monto;
      inputMonto.dispatchEvent(new Event('input'));
    }
    if (inputPlazo) {
      inputPlazo.value = plazo;
      inputPlazo.dispatchEvent(new Event('change'));
    }
    if (inputMetodo) {
      inputMetodo.value = metodo;
    }

    // Enfocar en el campo Proposito
    const propositoEl = document.getElementById('creditoProposito');
    if (propositoEl) propositoEl.focus();

    showToast('Datos de calculadora cargados. Por favor selecciona el propósito.', 'info');
  }, 500);
}

/**
 * Solicitar crédito desde la calculadora (Simulación)
 * Cierra el modal de simulación, abre el de solicitud y pre-carga los datos.
 */
async function solicitarDesdeSim() {
  const monto = document.getElementById('simMonto').value;
  const plazo = document.getElementById('simPlazo').value;
  // El simulador usa tasa fija, no selecciona metodo, pero asumiremos Frances por defecto o lo que sea
  // En el HTML del simulador no veo selector de metodo, verificar...
  // Ah, en el HTML del simulador (lines 337-347) solo hay Monto y Plazo. 
  // No hay selector de metodo en el simulador visible en el snippet anterior?
  // Espera, function calcularCredito (line 1886) lee 'calcMetodo'.
  // Pero el modal 'modalSimulador' (HTML line 323) tiene inputs 'simMonto' y 'simPlazo'.
  // NO veo input de metodo en el modalSimulador en el snippet que vi.
  // Pero voy a asumir Frances por defecto.

  // 1. Cerrar modal simulador
  const modalSim = bootstrap.Modal.getInstance(document.getElementById('modalSimulador'));
  if (modalSim) modalSim.hide();

  // 2. Abrir modal solicitud
  const modalReqEl = document.getElementById('modalSolicitarCredito');
  const modalReq = new bootstrap.Modal(modalReqEl);
  modalReq.show();

  // 3. Cargar limites (esto se llama en solicitarNuevoCredito tambien, pero aqui lo hacemos manual)
  await cargarLimiteCredito();

  // 4. Pre-llenar datos (esperar un poco a que el DOM del modal esté listo/visible)
  setTimeout(() => {
    const inputMonto = document.getElementById('creditoMonto');
    const inputPlazo = document.getElementById('creditoPlazo');

    if (inputMonto) {
      inputMonto.value = monto;
      inputMonto.dispatchEvent(new Event('input')); // Trigger calculo
    }
    if (inputPlazo) {
      inputPlazo.value = plazo;
      inputPlazo.dispatchEvent(new Event('change')); // Trigger calculo
    }

    // Enfocar en el campo Proposito que es el que falta
    document.getElementById('creditoProposito').focus();

    showToast('Datos de simulación cargados. Por favor selecciona el propósito.', 'info');
  }, 500);
}

/**
 * Ver detalles del crédito en modal
 */
async function verDetallesCredito(id) {
  const modal = new bootstrap.Modal(document.getElementById('modalDetalleCredito'));
  modal.show();

  const loading = document.getElementById('loadingDetalle');
  const content = document.getElementById('contentDetalle');

  loading.style.display = 'block';
  content.style.display = 'none';

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/creditos/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('Error al obtener crédito');

    const res = await response.json();
    const credito = res.data;

    // Llenar datos básicos
    document.getElementById('detCodigo').textContent = credito.codigo;
    document.getElementById('detMonto').textContent = formatCurrency(credito.montoTotal);
    document.getElementById('detPlazo').textContent = `${credito.plazoMeses} meses`;
    // Tasa viene mensual desde backend (ej: 1.5) promedio
    document.getElementById('detTasa').textContent = `${credito.tasaInteresMensual}% Mensual`;

    // Calcular Liquidación (Aprox: Saldo Capital + Interés Mora si hubiera)
    // El saldo capital ya incluye amortizaciones. Si se paga hoy, se paga el capital restante.
    // Nota: En sistema real se calcularía interés exacto al día. Aquí usamos saldo capital directo.
    const montoLiquidar = parseFloat(credito.saldoCapital) + (credito.montoMora || 0);
    document.getElementById('detMontoLiquidar').textContent = formatCurrency(montoLiquidar);

    // Renderizar Tabla
    const tbody = document.getElementById('tablaDetalleBody');
    tbody.innerHTML = '';

    if (credito.cuotas && credito.cuotas.length > 0) {
      credito.cuotas.forEach(cuota => {
        let badgeClass = 'bg-secondary';
        if (cuota.estado === 'PAGADA') badgeClass = 'bg-success';
        if (cuota.estado === 'PENDIENTE') badgeClass = 'bg-info';
        if (cuota.estado === 'VENCIDA') badgeClass = 'bg-danger';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${cuota.numeroCuota}</td>
          <td>${formatDateShort(cuota.fechaVencimiento)}</td>
          <td class="text-end fw-bold">${formatCurrency(cuota.montoTotal)}</td>
          <td class="text-end text-muted small">${formatCurrency(cuota.montoCapital)}</td>
          <td class="text-end text-muted small">${formatCurrency(cuota.montoInteres)}</td>
          <td class="text-center"><span class="badge ${badgeClass}">${cuota.estado}</span></td>
        `;
        tbody.appendChild(tr);
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tabla no disponible (Crédito no desembolsado)</td></tr>';
    }

    loading.style.display = 'none';
    content.style.display = 'block';

  } catch (error) {
    console.error('Error:', error);
    loading.innerHTML = `<p class="text-danger">Error al cargar detalles: ${error.message}</p>`;
  }
}

// ============================================================================
// FUNCIONES DE SOLICITUDES (DEPÓSITO, RETIRO, PAGO)
// ============================================================================

// Nota: ahorroDisponibleGlobal ya está declarada arriba en línea 1107

/**
 * Abrir modal de depósito
 */
function hacerDeposito() {
  // Buscar modal (puede ser depositoModal o modalDeposito)
  const modalEl = document.getElementById('depositoModal') || document.getElementById('modalDeposito');
  if (!modalEl) {
    alert('Modal de depósito no encontrado');
    return;
  }
  const modal = new bootstrap.Modal(modalEl);
  // Limpiar formulario
  (document.getElementById('formDeposito'))?.reset();
  modal.show();
}

/**
 * Abrir modal de retiro
 */
function hacerRetiro() {
  // Buscar modal (puede ser retiroModal o modalRetiro)
  const modalEl = document.getElementById('retiroModal') || document.getElementById('modalRetiro');
  if (!modalEl) {
    alert('Modal de retiro no encontrado');
    return;
  }
  const modal = new bootstrap.Modal(modalEl);
  // Limpiar formulario
  (document.getElementById('formRetiro'))?.reset();
  // Mostrar ahorro disponible (intentar ambos IDs posibles)
  const disponibleEl = document.getElementById('disponibleRetiro') || document.getElementById('ahorroDisponibleRetiro');
  if (disponibleEl) {
    disponibleEl.textContent = formatCurrency(ahorroDisponibleGlobal).replace('$', '');
  }
  modal.show();
}

/**
 * Enviar solicitud de depósito al backend
 */
async function enviarSolicitudDeposito() {
  const monto = parseFloat(document.getElementById('depositoMonto')?.value || document.getElementById('montoDeposito')?.value);
  const comprobante = (document.getElementById('depositoComprobante')?.value || document.getElementById('comprobanteDeposito')?.value || '').trim();
  const observaciones = (document.getElementById('depositoObservaciones')?.value || document.getElementById('observacionesDeposito')?.value || '').trim();

  if (!monto || monto <= 0) {
    alert('Por favor ingresa un monto válido');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const socioId = localStorage.getItem('socioId');
    const nombreCompleto = localStorage.getItem('nombreCompleto');

    console.log('=== DEBUG enviarSolicitudDeposito ===');
    console.log('socioId en localStorage:', socioId);
    console.log('nombreCompleto en localStorage:', nombreCompleto);
    console.log('Token existente:', token ? 'SÍ' : 'NO');
    console.log('=====================================');

    const response = await fetch(`${API_URL}/socios/me/solicitar-deposito`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        monto,
        comprobante: comprobante || undefined,
        observaciones: observaciones || undefined
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('✅ Solicitud de depósito enviada correctamente. El administrador la revisará pronto.', 'success');
      // Cerrar el modal (puede ser depositoModal o modalDeposito)
      const modal = bootstrap.Modal.getInstance(document.getElementById('depositoModal')) || bootstrap.Modal.getInstance(document.getElementById('modalDeposito'));
      if (modal) modal.hide();
      // Resetear form
      (document.getElementById('formDeposito') || document.getElementById('formDepositoAlt'))?.reset();
    } else {
      showToast('Error: ' + (data.message || 'No se pudo enviar la solicitud'), 'danger');
    }
  } catch (error) {
    console.error('Error enviando solicitud de depósito:', error);
    showToast('Error de conexión. Intenta de nuevo.', 'danger');
  }
}

/**
 * Enviar solicitud de retiro al backend
 */
async function enviarSolicitudRetiro() {
  const monto = parseFloat(document.getElementById('retiroMonto')?.value || document.getElementById('montoRetiro')?.value);
  const observaciones = (document.getElementById('retiroObservaciones')?.value || document.getElementById('observacionesRetiro')?.value || '').trim();

  if (!monto || monto <= 0) {
    alert('Por favor ingresa un monto válido');
    return;
  }

  if (monto > ahorroDisponibleGlobal) {
    alert(`El monto excede tu ahorro disponible ($${ahorroDisponibleGlobal.toFixed(2)})`);
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/socios/me/solicitar-retiro`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        monto,
        observaciones: observaciones || undefined
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('✅ Solicitud de retiro enviada correctamente. El administrador la revisará pronto.', 'success');
      // Cerrar modal (puede ser retiroModal o modalRetiro)
      const modal = bootstrap.Modal.getInstance(document.getElementById('retiroModal')) || bootstrap.Modal.getInstance(document.getElementById('modalRetiro'));
      if (modal) modal.hide();
      (document.getElementById('formRetiro'))?.reset();
    } else {
      showToast('Error: ' + (data.message || 'No se pudo enviar la solicitud'), 'danger');
    }
  } catch (error) {
    console.error('Error enviando solicitud de retiro:', error);
    showToast('Error de conexión. Intenta de nuevo.', 'danger');
  }
}

/**
 * Enviar solicitud de pago al backend
 */
async function enviarSolicitudPago() {
  const monto = parseFloat(document.getElementById('montoPago').value);
  const comprobante = document.getElementById('comprobantePago').value.trim();
  const observaciones = document.getElementById('observacionesPago').value.trim();

  if (!monto || monto <= 0) {
    alert('Por favor ingresa un monto válido');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/socios/me/solicitar-pago`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        monto,
        comprobante: comprobante || undefined,
        observaciones: observaciones || undefined
      })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      showToast('✅ Pago reportado correctamente. El administrador lo verificará y aplicará a tu crédito.', 'success');
      const modalElement = document.getElementById('modalPago');
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide();
      } else {
        // Fallback si no se encuentra la instancia
        const newModal = new bootstrap.Modal(modalElement);
        newModal.hide();
      }
      document.getElementById('formPago').reset();
    } else {
      showToast('Error: ' + (data.message || 'No se pudo reportar el pago'), 'danger');
    }
  } catch (error) {
    console.error('Error reportando pago:', error);
    showToast('Error de conexión. Intenta de nuevo.', 'danger');
  }
}

/**
 * Abrir modal de pago (con carga de cuotas pendientes)
 */
function reportarPago() {
  mostrarModalPago();
}

// Exponer funciones globalmente
window.hacerDeposito = hacerDeposito;
window.hacerRetiro = hacerRetiro;
window.enviarSolicitudDeposito = enviarSolicitudDeposito;
window.enviarSolicitudRetiro = enviarSolicitudRetiro;
window.enviarSolicitudPago = enviarSolicitudPago;
window.mostrarModalPago = mostrarModalPago;
window.reportarPago = reportarPago;

// Funciones de crédito
window.solicitarNuevoCredito = solicitarNuevoCredito;
window.enviarSolicitudCredito = enviarSolicitudCredito;
window.calcularCuotaPrevia = calcularCuotaPrevia;
window.toggleTablaAmortizacionModal = toggleTablaAmortizacionModal;
window.cargarLimiteCredito = cargarLimiteCredito;
window.calcularCredito = calcularCredito;
window.toggleTablaAmortizacion = toggleTablaAmortizacion;
window.solicitarDesdeCalculadora = solicitarDesdeCalculadora;
window.verDetallesCredito = verDetallesCredito;
window.cancelarSolicitudCredito = cancelarSolicitudCredito;

// Funciones de notificaciones
window.toggleNotifications = toggleNotifications;
window.marcarNotificacionLeida = marcarNotificacionLeida;
window.marcarTodasLeidas = marcarTodasLeidas;
window.verTodasNotificaciones = verTodasNotificaciones;
window.actualizarDashboard = actualizarDashboard;
window.showToast = showToast;

/**
 * Mostrar notificación Toast
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const id = 'toast-' + Date.now();
  const icon = type === 'success' ? '✅' : type === 'danger' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  const bgClass = type === 'success' ? 'text-bg-success' : type === 'danger' ? 'text-bg-danger' : type === 'warning' ? 'text-bg-warning' : 'text-bg-primary';
  const textColor = type === 'warning' ? 'text-dark' : 'text-white';

  const html = `
    <div id="${id}" class="toast align-items-center ${bgClass} ${textColor} border-0 mb-2" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center">
          <span class="me-2 fs-5">${icon}</span>
          <div>${message}</div>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', html);

  const toastEl = document.getElementById(id);
  const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
  toast.show();

  // Clean up DOM after hidden
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

/**
 * Actualizar dashboard manualmente
 */
async function actualizarDashboard() {
  showToast('Actualizando datos...', 'info');
  await cargarDashboard();
  showToast('Datos actualizados', 'success');
}

// ============================================================================
// FUNCIÓN DE CIERRE DE SESIÓN
// ============================================================================

/**
 * Cerrar sesión del usuario
 * Limpia localStorage y redirige al login
 */
function cerrarSesion() {
  // Limpiar datos de autenticación
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('usuario');
  localStorage.removeItem('nombreCompleto');
  localStorage.removeItem('rol');
  localStorage.removeItem('codigo');

  // Opcional: notificar al servidor (no crítico si falla)
  try {
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }).catch(() => { }); // Ignorar errores de logout en servidor
    }
  } catch (e) {
    console.log('Error en logout (ignorado):', e);
  }

  // Redirigir al login (limpiar localStorage antes de redireccionar)
  localStorage.clear();
  window.location.href = '/login.html';
}

// Exponer la función globalmente para que el onclick del HTML la encuentre
window.cerrarSesion = cerrarSesion;

// ============================================================================
// VISUALIZACIÓN DE AMORTIZACIÓN (MEJORADO)
// ============================================================================

/**
 * Muestra la tabla de amortización con estados detallados
 * @param {string|number} creditoId - ID o Código del crédito
 */
window.verAmortizacion = async function (creditoId) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login.html';
      return;
    }

    // Mostrar loading o toast
    showToast('Cargando tabla de amortización...', 'info');

    // Si recibimos un objeto evento en lugar de ID (por error onclick), ignorarlo
    if (typeof creditoId === 'object') return;

    const response = await fetch(`${API_URL}/creditos/${creditoId}/amortizacion`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Error al obtener amortización');

    const result = await response.json();
    const data = result.data;

    // 1. Llenar cabecera del modal
    // 1. Llenar cabecera del modal
    const resumen = data.resumen || {};
    const codigo = resumen.codigo || 'N/D';
    document.getElementById('amortCreditoCodigo').textContent = codigo;
    document.getElementById('amortMonto').textContent = '$' + (parseFloat(resumen.montoTotal) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });
    document.getElementById('amortTasa').textContent = '1.5';
    document.getElementById('amortPlazo').textContent = resumen.plazoMeses || (data.cuotas ? data.cuotas.length : 0);

    // 2. Construir la tabla con la lógica de estados solicitada: pagado, parcial, proxima, pendiente, atrasada
    const tbody = document.getElementById('amortTableBody');
    tbody.innerHTML = '';

    let html = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Ordenar cuotas por numero
    const cuotas = (data.cuotas || []).sort((a, b) => a.numeroCuota - b.numeroCuota);

    let foundProxima = false;

    cuotas.forEach(cuota => {
      // Ajustar fecha para evitar problemas de zona horaria si viene en UTC
      // Asumimos que la fecha viene YYYY-MM-DD o ISO
      const fechaVenc = new Date(cuota.fechaVencimiento);
      // Ajustar a medianoche local
      const fechaVencLocal = new Date(fechaVenc.getFullYear(), fechaVenc.getMonth(), fechaVenc.getDate());

      let estadoBadge = '';
      let rowClass = '';

      // Lógica de Estado
      if (cuota.estado === 'PAGADA') {
        estadoBadge = '<span class="badge bg-success">Pagado</span>';
        // rowClass = 'table-light'; 
      } else if (cuota.estado === 'VENCIDA') {
        estadoBadge = '<span class="badge bg-danger">Atrasada</span>';
        rowClass = 'table-danger';
      } else {
        // Pendiente o Parcial
        const pagado = parseFloat(cuota.montoPagado || 0);
        const esParcial = pagado > 0;

        // Verificar si está atrasada por fecha aunque no esté marcada VENCIDA en BD
        if (fechaVencLocal < today && !esParcial) {
          // Si es menor a hoy y no pagada, es Atrasada (aunque BD diga PENDIENTE)
          // A menos que el backend maneje mora diaria
          estadoBadge = '<span class="badge bg-danger">Atrasada</span>';
          rowClass = 'table-danger';
        } else if (esParcial) {
          estadoBadge = '<span class="badge bg-info text-dark">Parcial</span>';
          rowClass = 'table-info';
        } else if (!foundProxima && fechaVencLocal >= today) {
          // La primera pendiente futura es la "Próxima"
          estadoBadge = '<span class="badge bg-warning text-dark">Próxima</span>';
          rowClass = 'table-warning';
          foundProxima = true;
        } else {
          estadoBadge = '<span class="badge bg-secondary">Pendiente</span>';
        }
      }

      const capital = parseFloat(cuota.monto_capital || cuota.montoCapital || 0);
      const interes = parseFloat(cuota.monto_interes || cuota.montoInteres || 0);
      const total = parseFloat(cuota.monto_cuota || cuota.montoCuota || 0);
      const saldo = parseFloat(cuota.saldo_capital_despues || cuota.saldoCapitalDespues || 0);

      html += `
                <tr class="${rowClass}">
                    <td class="text-center">${cuota.numeroCuota}</td>
                    <td>${fechaVencLocal.toLocaleDateString()}</td>
                    <td class="text-end">$${capital.toFixed(2)}</td>
                    <td class="text-end">$${interes.toFixed(2)}</td>
                    <td class="text-end fw-bold">$${total.toFixed(2)}</td>
                    <td class="text-end text-muted">$${saldo.toFixed(2)}</td>
                    <td class="text-center">${estadoBadge}</td>
                </tr>
            `;
    });

    tbody.innerHTML = html;

    // 3. Abrir Modal
    const modalElement = document.getElementById('modalAmortizacion');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

  } catch (error) {
    console.error('Error verAmortizacion:', error);
    showToast('No se pudo cargar la tabla de amortización', 'error');
  }
};
