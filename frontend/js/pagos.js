/**
 * ============================================================================
 * Sistema MLF - Módulo de Pagos
 * Archivo: js/pagos.js
 * Descripción: Gestión de pagos de cuotas
 * ============================================================================
 */

(function () {
  let creditosActivos = [];

  // Inicializar módulo
  function initPagosModule() {
    renderPagosUI();
    loadCreditosActivos();
    loadHistorialGeneral();
  }

  // Renderizar interfaz
  function renderPagosUI() {
    const container = document.getElementById('pagosContent');

    container.innerHTML = `
      <div class="card mb-3">
        <div class="card-header d-flex justify-between align-center">
          <h3 class="card-title" style="margin: 0;">Registrar Pago de Cuota</h3>
        </div>
        <div class="card-body">
          <form id="formPago">
            <!-- Selección de Crédito -->
            <div class="form-group">
              <label class="form-label"><strong>Seleccionar Crédito *</strong></label>
              <select id="pagoCredito" class="form-control" required style="font-size: 1.05rem; padding: 10px;">
                <option value="">Cargando créditos...</option>
              </select>
            </div>

            <!-- Card de Información del Crédito (aparece al seleccionar) -->
            <div id="creditoInfo" class="mb-3" style="display: none;">
              <!-- Información del crédito seleccionado -->
            </div>

            <!-- Formulario de Pago (solo visible cuando hay crédito seleccionado) -->
            <div id="formPagoFields" style="display: none;">
              <hr>
              <h4 style="margin-bottom: 20px;">💰 Registrar Pago</h4>

              <div class="row">
                <div class="col-6">
                  <div class="form-group">
                    <label class="form-label"><strong>Monto a Pagar *</strong></label>
                    <input type="number" step="0.01" min="0.01" id="pagoMonto" class="form-control" required placeholder="0.00" style="font-size: 1.2rem; padding: 12px;">
                    <div id="btnsPagoRapido" style="margin-top: 8px; display: none;">
                      <!-- Botones de pago rápido se insertarán aquí -->
                    </div>
                  </div>
                </div>
                <div class="col-6">
                  <div class="form-group">
                    <label class="form-label"><strong>Método de Pago *</strong></label>
                    <select id="pagoMetodo" class="form-control" required style="padding: 12px;">
                      <option value="EFECTIVO">Efectivo</option>
                      <option value="TRANSFERENCIA" selected>Transferencia</option>
                      <option value="DEPOSITO">Depósito</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-6">
                  <div class="form-group">
                    <label class="form-label">Número de Referencia</label>
                    <input type="text" id="pagoReferencia" class="form-control" placeholder="Opcional">
                  </div>
                </div>
                <div class="col-6">
                  <div class="form-group">
                    <label class="form-label">Fecha de Pago</label>
                    <input type="date" id="pagoFecha" class="form-control" value="${new Date().toISOString().split('T')[0]}">
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Concepto</label>
                <input type="text" id="pagoConcepto" class="form-control" placeholder="Pago cuota mensual">
              </div>

              <div style="margin-top: 20px;">
                <button type="submit" class="btn btn-success btn-lg btn-block" style="padding: 15px; font-size: 1.1rem;">
                  ✓ Registrar Pago
                </button>
              </div>

              <!-- Nota informativa al fondo -->
              <div style="margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-left: 3px solid #17a2b8; border-radius: 4px;">
                <small style="color: #666;">
                  <strong>ℹ️ Distribución Automática:</strong> Los pagos se distribuyen en el orden:
                  Mora → Interés → Capital → Prepago a siguiente cuota.
                </small>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title" id="historialTitulo">Últimos Pagos del Sistema</h3>
        </div>
        <div class="card-body">
          <div id="historialPagos">
            <p class="text-center">Cargando historial general...</p>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    const formPago = document.getElementById('formPago');
    formPago.addEventListener('submit', handleRegistrarPago);

    const pagoCredito = document.getElementById('pagoCredito');
    pagoCredito.addEventListener('change', handleCreditoChange);
  }

  // Cargar créditos activos
  async function loadCreditosActivos() {
    try {
      const response = await api.getCreditos({ page: 1, limit: 1000 });
      creditosActivos = (response.creditos || []).filter(c => c.estado === 'DESEMBOLSADO');

      const select = document.getElementById('pagoCredito');
      if (creditosActivos.length === 0) {
        select.innerHTML = '<option value="">No hay créditos activos</option>';
        return;
      }

      select.innerHTML = `
        <option value="">Selecciona un crédito</option>
        ${creditosActivos.map(c => `
          <option value="${c.id}">
            ${c.codigo} - ${c.socio?.nombreCompleto} - Saldo: ${formatCurrency(c.saldoCapital || 0)}
          </option>
        `).join('')}
      `;
    } catch (error) {
      console.error('Error cargando créditos:', error);
      alert('Error al cargar créditos: ' + getErrorMessage(error));
    }
  }

  // Manejar cambio de crédito
  async function handleCreditoChange(e) {
    const creditoId = e.target.value;
    const creditoInfo = document.getElementById('creditoInfo');

    if (!creditoId) {
      creditoInfo.style.display = 'none';
      document.getElementById('formPagoFields').style.display = 'none';
      loadHistorialGeneral();
      return;
    }

    try {
      showLoading();
      const credito = await api.getCredito(parseInt(creditoId));

      // Mostrar información del crédito
      const cuotasPendientes = credito.cuotas?.filter(c => c.estado !== 'PAGADA') || [];
      const proximaCuota = cuotasPendientes[0];

      creditoInfo.innerHTML = `
        <div class="card" style="background-color: #f8f9fa; border-left: 4px solid #28a745;">
          <div class="card-body">
            <h4 style="margin-bottom: 15px; color: #28a745;">📋 Información del Crédito</h4>
            <div class="row">
              <div class="col-4">
                <p style="margin-bottom: 8px;"><strong>Crédito:</strong></p>
                <p style="font-size: 1.1rem; margin-bottom: 15px;">${credito.codigo}</p>
                <p style="margin-bottom: 8px;"><strong>Socio:</strong></p>
                <p style="font-size: 1.1rem;">${credito.socio?.nombreCompleto}</p>
              </div>
              <div class="col-4">
                <p style="margin-bottom: 8px;"><strong>Monto Total:</strong></p>
                <p style="font-size: 1.1rem; margin-bottom: 15px;">${formatCurrency(credito.montoTotal || 0)}</p>
                <p style="margin-bottom: 8px;"><strong>Saldo Capital:</strong></p>
                <p style="font-size: 1.3rem; color: #dc3545; font-weight: bold;">${formatCurrency(credito.saldoCapital || 0)}</p>
              </div>
              <div class="col-4">
                <p style="margin-bottom: 8px;"><strong>Cuotas Pendientes:</strong></p>
                <p style="font-size: 1.1rem; margin-bottom: 15px;">${cuotasPendientes.length} de ${credito.cuotas?.length || 0}</p>
                ${proximaCuota ? `
                  <p style="margin-bottom: 8px;"><strong>Cuota a Pagar:</strong></p>
                  <p style="font-size: 1.4rem; color: #007bff; font-weight: bold;">
                    ${proximaCuota.numeroCuota}/${credito.cuotas?.length || 0}
                  </p>
                  <p style="font-size: 1.1rem; color: #28a745; font-weight: bold;">
                    ${formatCurrency(proximaCuota.montoTotal)}
                  </p>
                  <p style="font-size: 0.9rem; color: #666;">Vence: ${formatDate(proximaCuota.fechaVencimiento)}</p>
                ` : '<p style="color: #28a745;">✓ No hay cuotas pendientes</p>'}
              </div>
            </div>
          </div>
        </div>
      `;
      creditoInfo.style.display = 'block';

      // Mostrar formulario de pago
      document.getElementById('formPagoFields').style.display = 'block';

      // Prellenar automáticamente el monto de la próxima cuota
      const pagoMontoInput = document.getElementById('pagoMonto');
      const pagoConceptoInput = document.getElementById('pagoConcepto');

      if (proximaCuota) {
        // Convertir a número si es necesario
        const montoTotal = typeof proximaCuota.montoTotal === 'number'
          ? proximaCuota.montoTotal
          : parseFloat(proximaCuota.montoTotal);

        pagoMontoInput.value = montoTotal.toFixed(2);

        // Calcular total de cuotas
        const totalCuotas = credito.cuotas?.length || 0;
        pagoConceptoInput.value = `Pago Cuota ${proximaCuota.numeroCuota}/${totalCuotas}`;

        // Agregar información de la cuota
        const btnsPagoRapido = document.getElementById('btnsPagoRapido');
        btnsPagoRapido.innerHTML = `
          <small class="text-muted">
            📌 Cuota <strong>${proximaCuota.numeroCuota}/${totalCuotas}</strong> -
            Capital: ${formatCurrency(proximaCuota.montoCapital || 0)} +
            Interés: ${formatCurrency(proximaCuota.montoInteres || 0)}
          </small>
        `;
        btnsPagoRapido.style.display = 'block';
      } else {
        pagoMontoInput.value = '';
        pagoConceptoInput.value = 'Pago adicional';
      }

      // Cambiar título y cargar historial del crédito específico
      document.getElementById('historialTitulo').textContent = `Historial de Pagos - ${credito.codigo}`;
      const pagosData = await api.getPagosCredito(parseInt(creditoId));
      renderHistorialPagos(pagosData.pagos || pagosData || []);

    } catch (error) {
      console.error('Error cargando información del crédito:', error);
      alert('Error: ' + getErrorMessage(error));
    } finally {
      hideLoading();
    }
  }

  // Renderizar historial de pagos (general o específico)
  function renderHistorialPagos(pagos, esGeneral = false) {
    const container = document.getElementById('historialPagos');

    if (!pagos || pagos.length === 0) {
      const mensaje = esGeneral
        ? 'No hay pagos registrados en el sistema'
        : 'No hay pagos registrados para este crédito';
      container.innerHTML = `<p class="text-center">${mensaje}</p>`;
      return;
    }

    // Determinar columnas según si es general o específico
    const headers = esGeneral
      ? `<th>Fecha</th>
         <th>Socio</th>
         <th>Crédito</th>
         <th>Monto</th>
         <th>Método</th>
         <th>Concepto</th>
         ${api.isTesorero() ? '<th>Acciones</th>' : ''}`
      : `<th>Fecha</th>
         <th>Monto Pagado</th>
         <th>Método</th>
         <th>Referencia</th>
         <th>Concepto</th>
         ${api.isTesorero() ? '<th>Acciones</th>' : ''}`;

    // Función para verificar si un pago es editable (dentro de 7 días)
    const esEditable = (fechaPago) => {
      const fecha = new Date(fechaPago);
      const hoy = new Date();
      const diferenciaDias = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
      return diferenciaDias <= 7;
    };

    const rows = esGeneral
      ? pagos.map(p => `
          <tr>
            <td>${formatDate(p.fechaPago)}</td>
            <td>${p.credito?.socio?.nombreCompleto || '-'}<br><small class="text-muted">${p.credito?.socio?.codigo || ''}</small></td>
            <td><span class="badge badge-info">${p.credito?.codigo || '-'}</span></td>
            <td><strong>${formatCurrency(p.montoPagado)}</strong></td>
            <td><span class="badge badge-primary">${p.metodoPago}</span></td>
            <td>${p.concepto || '-'}</td>
            ${api.isTesorero() ? `<td>${esEditable(p.fechaPago) ? `<button class="btn btn-sm btn-warning" onclick="window.editarPago(${p.id})" title="Editar pago">Editar</button>` : '<small class="text-muted">No editable</small>'}</td>` : ''}
          </tr>
        `).join('')
      : pagos.map(p => `
          <tr>
            <td>${formatDate(p.fechaPago)}</td>
            <td><strong>${formatCurrency(p.montoPagado)}</strong></td>
            <td><span class="badge badge-primary">${p.metodoPago}</span></td>
            <td>${p.numeroReferencia || '-'}</td>
            <td>${p.concepto || '-'}</td>
            ${api.isTesorero() ? `<td>${esEditable(p.fechaPago) ? `<button class="btn btn-sm btn-warning" onclick="window.editarPago(${p.id})" title="Editar pago">Editar</button>` : '<small class="text-muted">No editable</small>'}</td>` : ''}
          </tr>
        `).join('');

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>${headers}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  // Cargar y renderizar historial general de pagos
  async function loadHistorialGeneral() {
    try {
      document.getElementById('historialTitulo').textContent = 'Últimos Pagos del Sistema';
      const pagos = await api.getPagosRecientes(15);
      renderHistorialPagos(pagos, true);
    } catch (error) {
      console.error('Error cargando historial general:', error);
      const container = document.getElementById('historialPagos');
      container.innerHTML = '<p class="text-center text-danger">Error al cargar historial de pagos</p>';
    }
  }

  // Manejar registro de pago
  async function handleRegistrarPago(e) {
    e.preventDefault();

    const creditoId = parseInt(document.getElementById('pagoCredito').value);
    const montoPagado = parseFloat(document.getElementById('pagoMonto').value);
    const metodoPago = document.getElementById('pagoMetodo').value;
    const numeroReferencia = document.getElementById('pagoReferencia').value;
    const concepto = document.getElementById('pagoConcepto').value;
    const fechaPago = document.getElementById('pagoFecha').value;

    // Validaciones
    if (!creditoId) {
      alert('Selecciona un crédito');
      return;
    }

    if (!montoPagado || montoPagado <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    if (!metodoPago) {
      alert('Selecciona un método de pago');
      return;
    }

    const confirmed = await customConfirm(`¿Confirmas el registro de pago de ${formatCurrency(montoPagado)}?`, '💰 Confirmar Pago');
    if (!confirmed) {
      return;
    }

    try {
      showLoading();

      const data = {
        creditoId,
        montoPagado,
        metodoPago,
        numeroReferencia: numeroReferencia || undefined,
        concepto: concepto || undefined,
        fechaPago: fechaPago || undefined,
      };

      const response = await api.registrarPago(data);

      // Mostrar resultado
      showResultadoPagoModal(response);

      // Limpiar formulario y volver al estado inicial
      document.getElementById('formPago').reset();
      document.getElementById('pagoFecha').value = new Date().toISOString().split('T')[0];
      document.getElementById('creditoInfo').style.display = 'none';
      document.getElementById('formPagoFields').style.display = 'none';
      document.getElementById('pagoCredito').value = '';

      // Recargar créditos y volver a mostrar historial general
      loadCreditosActivos();
      loadHistorialGeneral();

    } catch (error) {
      alert('Error al registrar pago: ' + getErrorMessage(error));
    } finally {
      hideLoading();
    }
  }

  // Modal: Resultado del pago
  function showResultadoPagoModal(resultado) {
    const pago = resultado.pago || {};
    const distribucion = resultado.distribucion || {};
    const creditoActualizado = resultado.creditoActualizado || {};

    const modal = createModal('Pago Registrado Exitosamente', `
      <div class="alert alert-success">
        <strong>¡Pago procesado correctamente!</strong>
      </div>

      <h4>Distribución del Pago</h4>
      <div class="table-responsive">
        <table class="table">
          <tbody>
            <tr>
              <td><strong>Monto Total Pagado:</strong></td>
              <td class="text-right"><strong>${formatCurrency(pago.montoPago || distribucion.totalPagado || 0)}</strong></td>
            </tr>
            ${(pago.montoAMora > 0 || distribucion.totalAplicadoMora > 0) ? `
              <tr>
                <td>Aplicado a Mora:</td>
                <td class="text-right text-danger">${formatCurrency(pago.montoAMora || distribucion.totalAplicadoMora || 0)}</td>
              </tr>
            ` : ''}
            <tr>
              <td>Aplicado a Interés:</td>
              <td class="text-right text-warning">${formatCurrency(pago.montoAInteres || distribucion.totalAplicadoInteres || 0)}</td>
            </tr>
            <tr>
              <td>Aplicado a Capital:</td>
              <td class="text-right text-success">${formatCurrency(pago.montoACapital || distribucion.totalAplicadoCapital || 0)}</td>
            </tr>
            ${(pago.montoACuotaSiguiente > 0 || distribucion.totalSobrante > 0) ? `
              <tr>
                <td>Prepago (Sobrante):</td>
                <td class="text-right text-info">${formatCurrency(pago.montoACuotaSiguiente || distribucion.totalSobrante || 0)}</td>
              </tr>
            ` : ''}
          </tbody>
        </table>
      </div>

      <hr>

      <h4>Estado del Crédito</h4>
      <div class="row">
        <div class="col-6">
          <p><strong>Saldo Capital Actual:</strong></p>
          <p class="text-danger" style="font-size: 1.5rem; margin: 0;">${formatCurrency(creditoActualizado.saldoCapital || 0)}</p>
        </div>
        <div class="col-6">
          <p><strong>Estado:</strong></p>
          <p style="font-size: 1.5rem; margin: 0;">
            ${creditoActualizado.estado === 'COMPLETADO'
        ? '<span class="badge badge-success">COMPLETADO</span>'
        : '<span class="badge badge-primary">ACTIVO</span>'}
          </p>
        </div>
      </div>

      ${creditoActualizado.estado === 'COMPLETADO' ? `
        <div class="alert alert-success mt-3">
          <strong>🎉 ¡CRÉDITO COMPLETADO!</strong><br>
          El crédito ha sido pagado en su totalidad. Las garantías han sido liberadas automáticamente.
        </div>
      ` : ''}
    `, [{
      text: 'Cerrar',
      className: 'btn-primary',
      onClick: () => modal.close()
    }]);
  }

  // Helper: Crear modal
  function createModal(title, body, buttons = []) {
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          ${body}
        </div>
        <div class="modal-footer">
          ${buttons.map((btn, index) => `
            <button class="btn ${btn.className}" data-btn-index="${index}">${btn.text}</button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    buttons.forEach((btn, index) => {
      const btnElement = modal.querySelector(`[data-btn-index="${index}"]`);
      if (btnElement && btn.onClick) {
        btnElement.addEventListener('click', btn.onClick);
      }
    });

    return {
      element: modal,
      close: () => modal.remove()
    };
  }

  // Editar pago (solo dentro de 7 días)
  window.editarPago = async function (pagoId) {
    try {
      showLoading();
      const pago = await api.getPago(pagoId);
      hideLoading();

      // Verificar que sea editable (dentro de 7 días)
      const fechaPago = new Date(pago.fechaPago);
      const hoy = new Date();
      const diferenciaDias = Math.floor((hoy - fechaPago) / (1000 * 60 * 60 * 24));

      if (diferenciaDias > 7) {
        alert('Solo se pueden editar pagos registrados en los últimos 7 días');
        return;
      }

      const modal = createModal('Editar Pago', `
        <form id="formEditarPago">
          <div class="alert alert-warning">
            <strong>⚠️ Advertencia:</strong> Solo se pueden editar pagos registrados en los últimos 7 días. Este pago fue registrado hace ${diferenciaDias} día(s).
          </div>

          <div class="form-group">
            <label class="form-label">Crédito *</label>
            <input type="text" class="form-control" value="${pago.credito?.codigo || 'N/A'}" disabled>
            <small class="form-text text-muted">Campo no editable</small>
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Monto Pagado *</label>
                <input type="text" id="editMonto" class="form-control" value="${formatCurrency(pago.montoPagado)}" disabled>
                <small class="form-text text-muted">Campo no editable por integridad contable</small>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Fecha de Pago *</label>
                <input type="date" id="editFecha" class="form-control" value="${pago.fechaPago ? (typeof pago.fechaPago === 'string' ? pago.fechaPago.split('T')[0] : new Date(pago.fechaPago).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]}" required>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Método de Pago *</label>
                <select id="editMetodo" class="form-control" required>
                  <option value="EFECTIVO" ${pago.metodoPago === 'EFECTIVO' ? 'selected' : ''}>Efectivo</option>
                  <option value="TRANSFERENCIA" ${pago.metodoPago === 'TRANSFERENCIA' ? 'selected' : ''}>Transferencia</option>
                  <option value="DEPOSITO" ${pago.metodoPago === 'DEPOSITO' ? 'selected' : ''}>Depósito</option>
                  <option value="OTRO" ${pago.metodoPago === 'OTRO' ? 'selected' : ''}>Otro</option>
                </select>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Número de Referencia</label>
                <input type="text" id="editReferencia" class="form-control" value="${pago.numeroReferencia || ''}" placeholder="Opcional">
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Concepto</label>
            <input type="text" id="editConcepto" class="form-control" value="${pago.concepto || ''}" placeholder="Concepto del pago">
          </div>

          <div class="alert alert-info" style="margin-top: 15px;">
            <strong>ℹ️ Nota:</strong> Por motivos de integridad contable, el monto no se puede modificar. Solo puedes editar la fecha, método de pago, referencia y concepto.
          </div>
        </form>
      `, [
        {
          text: 'Cancelar',
          className: 'btn-secondary',
          onClick: () => modal.close()
        },
        {
          text: 'Guardar Cambios',
          className: 'btn-primary',
          onClick: async () => {
            const data = {
              fechaPago: document.getElementById('editFecha').value,
              metodoPago: document.getElementById('editMetodo').value,
              numeroReferencia: document.getElementById('editReferencia').value || undefined,
              concepto: document.getElementById('editConcepto').value || undefined,
            };

            // Validaciones
            if (!data.fechaPago) {
              alert('La fecha de pago es obligatoria');
              return;
            }

            const confirmEdit = await customConfirm('¿Estás seguro de guardar los cambios en este pago?', '✏️ Editar Pago');
            if (!confirmEdit) {
              return;
            }

            try {
              showLoading();
              await api.actualizarPago(pagoId, data);
              alert('Pago actualizado exitosamente');
              modal.close();

              // Recargar historial
              if (document.getElementById('pagoCredito').value) {
                const creditoId = parseInt(document.getElementById('pagoCredito').value);
                const pagosData = await api.getPagosCredito(creditoId);
                renderHistorialPagos(pagosData.pagos || pagosData || []);
              } else {
                loadHistorialGeneral();
              }
            } catch (error) {
              alert('Error al actualizar pago: ' + getErrorMessage(error));
            } finally {
              hideLoading();
            }
          }
        }
      ]);
    } catch (error) {
      alert('Error: ' + getErrorMessage(error));
      hideLoading();
    }
  };



  // Exponer función de inicialización globalmente
  window.initPagosModule = initPagosModule;

  // Si se carga dinámicamente y el contenedor ya existe, inicializar
  if (document.getElementById('pagosContent')) {
    initPagosModule();
  }
})();
