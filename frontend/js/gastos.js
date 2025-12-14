/**
 * ============================================================================
 * Sistema MLF - Módulo de Gastos Operativos
 * Archivo: js/gastos.js
 * ============================================================================
 */

(function () {
  // Inicializar módulo
  function initGastosModule() {
    renderGastosUI();
    loadHistorialGastos();
  }

  // Renderizar interfaz
  function renderGastosUI() {
    const container = document.getElementById('gastosContent');

    container.innerHTML = `
      <div class="card mb-3">
        <div class="card-header d-flex justify-between align-center">
          <h3 class="card-title" style="margin: 0;">Registrar Gasto Operativo</h3>
        </div>
        <div class="card-body">
          <form id="formRegistrarGasto">
            <div class="row">
              <div class="col-6">
                <div class="form-group">
                  <label class="form-label">Categoría *</label>
                  <select id="gastoCategoria" class="form-control" required>
                    <option value="">Seleccionar...</option>
                    <option value="TECNOLOGIA">Tecnología</option>
                    <option value="OPERATIVO">Operativo</option>
                    <option value="NOMINA">Nómina</option>
                    <option value="MARKETING">Marketing</option>
                    <option value="LEGAL">Legal</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>
              <div class="col-6">
                <div class="form-group">
                  <label class="form-label">Monto *</label>
                  <input type="number" step="0.01" id="gastoMonto" class="form-control" required placeholder="0.00">
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Descripción *</label>
              <input type="text" id="gastoDescripcion" class="form-control" required placeholder="Ej: Hosting AWS mes de noviembre">
            </div>

            <div class="row">
              <div class="col-4">
                <div class="form-group">
                  <label class="form-label">Fecha del Gasto</label>
                  <input type="date" id="gastoFecha" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                </div>
              </div>
              <div class="col-4">
                <div class="form-group">
                  <label class="form-label">Tipo de Pago</label>
                  <select id="gastoTipoPago" class="form-control">
                    <option value="">Sin especificar</option>
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA" selected>Transferencia</option>
                    <option value="TARJETA">Tarjeta</option>
                  </select>
                </div>
              </div>
              <div class="col-4">
                <div class="form-group">
                  <label class="form-label">N° Comprobante</label>
                  <input type="text" id="gastoComprobante" class="form-control" placeholder="Opcional">
                </div>
              </div>
            </div>

            <div class="row">
              <div class="col-6">
                <div class="form-group">
                  <label class="form-label">Proveedor</label>
                  <input type="text" id="gastoProveedor" class="form-control" placeholder="Opcional">
                </div>
              </div>
              <div class="col-6">
                <div class="form-group">
                  <label class="form-label">Observaciones</label>
                  <input type="text" id="gastoObservaciones" class="form-control" placeholder="Opcional">
                </div>
              </div>
            </div>

            <button type="submit" class="btn btn-success btn-lg btn-block">
              ✓ Registrar Gasto
            </button>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Historial de Gastos Operativos</h3>
        </div>
        <div class="card-body">
          <div id="historialGastos">
            <p class="text-center text-muted">Cargando...</p>
          </div>
        </div>
      </div>
    `;

    // Event listener para el formulario
    document.getElementById('formRegistrarGasto').addEventListener('submit', handleRegistrarGasto);
  }

  // Cargar historial de gastos
  async function loadHistorialGastos() {
    try {
      const gastos = await api.getGastos({ page: 1, limit: 50 });
      renderHistorial(gastos.gastos || []);
    } catch (error) {
      console.error('Error cargando historial:', error);
      document.getElementById('historialGastos').innerHTML =
        '<p class="text-center text-danger">Error al cargar historial de gastos</p>';
    }
  }

  // Renderizar historial
  function renderHistorial(gastos) {
    const container = document.getElementById('historialGastos');

    if (gastos.length === 0) {
      container.innerHTML = '<p class="text-center text-muted">No hay gastos registrados</p>';
      return;
    }

    const labels = {
      'TECNOLOGIA': 'Tecnología',
      'OPERATIVO': 'Operativo',
      'NOMINA': 'Nómina',
      'MARKETING': 'Marketing',
      'LEGAL': 'Legal',
      'OTRO': 'Otro'
    };

    const html = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Código</th>
              <th>Categoría</th>
              <th>Descripción</th>
              <th>Monto</th>
              <th>Proveedor</th>
              ${api.isTesorero() ? '<th>Acciones</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${gastos.map(g => `
              <tr>
                <td>${formatDate(g.fechaGasto)}</td>
                <td><strong>${g.codigo}</strong></td>
                <td><span class="badge badge-info">${labels[g.categoria] || g.categoria}</span></td>
                <td>${g.descripcion}</td>
                <td><strong>${formatCurrency(g.monto)}</strong></td>
                <td>${g.proveedor || '-'}</td>
                ${api.isTesorero() ? `
                  <td>
                    <button class="btn btn-sm btn-danger" onclick="window.eliminarGasto(${g.id}, '${g.codigo}')">
                      Eliminar
                    </button>
                  </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  // Registrar gasto
  async function handleRegistrarGasto(e) {
    e.preventDefault();

    const data = {
      categoria: document.getElementById('gastoCategoria').value,
      descripcion: document.getElementById('gastoDescripcion').value,
      monto: parseFloat(document.getElementById('gastoMonto').value),
      fechaGasto: document.getElementById('gastoFecha').value,
      tipoPago: document.getElementById('gastoTipoPago').value || undefined,
      numeroComprobante: document.getElementById('gastoComprobante').value || undefined,
      proveedor: document.getElementById('gastoProveedor').value || undefined,
      observaciones: document.getElementById('gastoObservaciones').value || undefined,
    };

    if (!data.categoria || !data.descripcion || !data.monto) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (data.monto <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    const confirmed = await customConfirm(`¿Confirmas el registro del gasto de ${formatCurrency(data.monto)}?`, '📝 Registrar Gasto');
    if (!confirmed) {
      return;
    }

    try {
      showLoading();
      await api.registrarGasto(data);
      alert('Gasto registrado exitosamente');

      // Limpiar formulario
      document.getElementById('formRegistrarGasto').reset();
      document.getElementById('gastoFecha').value = new Date().toISOString().split('T')[0];

      // Recargar historial
      loadHistorialGastos();
    } catch (error) {
      alert('Error al registrar gasto: ' + getErrorMessage(error));
    } finally {
      hideLoading();
    }
  }

  // Eliminar gasto (función global)
  window.eliminarGasto = async function (id, codigo) {
    const confirmed = await customConfirm(`¿Estás seguro de eliminar el gasto ${codigo}?`, '🗑️ Eliminar Gasto');
    if (!confirmed) {
      return;
    }

    try {
      showLoading();
      await api.eliminarGasto(id);
      alert('Gasto eliminado exitosamente');
      loadHistorialGastos();
    } catch (error) {
      alert('Error al eliminar gasto: ' + getErrorMessage(error));
    } finally {
      hideLoading();
    }
  };

  // Función global para abrir modal (llamada desde dashboard)
  window.mostrarModalRegistroGasto = function () {
    // El formulario ya está visible en la página
    document.getElementById('gastoCategoria').focus();
  };

  // Exponer función de inicialización globalmente
  window.initGastosModule = initGastosModule;

  // Inicializar cuando se cargue el script
  if (document.getElementById('gastosContent')) {
    initGastosModule();
  }
})();
