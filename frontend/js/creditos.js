/**
 * ============================================================================
 * Sistema MLF - Módulo de Créditos
 * Archivo: js/creditos.js
 * Descripción: Gestión de créditos (solicitar, aprobar, desembolsar)
 * ============================================================================
 */

(function () {
  let creditosList = [];
  let sociosList = [];
  let currentCredito = null;
  let currentDetailModal = null;

  // ============================================================================
  // HELPER FUNCTIONS (necesarias para el módulo)
  // ============================================================================

  function showLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
  }

  function getErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error?.message) return error.message;
    if (error?.error?.message) return error.error.message;
    return 'Error desconocido';
  }

  // Inicializar módulo
  function initCreditosModule() {
    renderCreditosUI();
    loadCreditos();
    loadSociosForSelect();
  }

  // Renderizar interfaz
  function renderCreditosUI() {
    const container = document.getElementById('creditosContent');

    container.innerHTML = `
      <div class="card mb-3">
        <div class="card-header d-flex justify-between align-center">
          <h3 class="card-title" style="margin: 0;">Lista de Créditos</h3>
          ${api.isTesorero() ? '<button class="btn btn-primary" id="btnNuevoCredito">+ Solicitar Crédito</button>' : ''}
        </div>
        <div class="card-body">
          <div class="row mb-2">
            <div class="col-6">
              <input
                type="text"
                id="searchCreditos"
                class="form-control"
                placeholder="Buscar por código, socio..."
              >
            </div>
            <div class="col-6">
              <select id="filterEstado" class="form-control">
                <option value="">Todos los estados</option>
                <option value="SOLICITADO">Solicitado</option>
                <option value="APROBADO">Aprobado</option>
                <option value="DESEMBOLSADO">Desembolsado</option>
                <option value="COMPLETADO">Completado</option>
                <option value="RECHAZADO">Rechazado</option>
                <option value="CASTIGADO">Castigado</option>
              </select>
            </div>
          </div>

          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Socio</th>
                  <th>Monto</th>
                  <th>Saldo Capital</th>
                  <th>Plazo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody id="creditosTableBody">
                <tr>
                  <td colspan="7" class="text-center">
                    <div class="spinner spinner-lg" style="border-top-color: var(--primary-color); border-color: rgba(0,0,0,0.1);"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    const searchInput = document.getElementById('searchCreditos');
    if (searchInput) {
      searchInput.addEventListener('input', filterCreditos);
    }

    const filterEstado = document.getElementById('filterEstado');
    if (filterEstado) {
      filterEstado.addEventListener('change', filterCreditos);
    }

    const btnNuevoCredito = document.getElementById('btnNuevoCredito');
    if (btnNuevoCredito) {
      btnNuevoCredito.addEventListener('click', showNuevoCreditoModal);
    }
  }

  // Cargar créditos
  async function loadCreditos() {
    try {
      const response = await api.getCreditos({ page: 1, limit: 1000 });
      creditosList = response.creditos || [];
      renderCreditosTable(creditosList);
    } catch (error) {
      console.error('Error cargando créditos:', error);
      alert('Error al cargar créditos: ' + getErrorMessage(error));
    }
  }

  // Cargar socios para select
  async function loadSociosForSelect() {
    try {
      const response = await api.getSocios({ page: 1, limit: 1000 });
      sociosList = (response.socios || []).filter(s => s.estado === 'ACTIVO');
    } catch (error) {
      console.error('Error cargando socios:', error);
    }
  }

  // Renderizar tabla de créditos
  function renderCreditosTable(creditos) {
    const tbody = document.getElementById('creditosTableBody');

    if (creditos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay créditos registrados</td></tr>';
      return;
    }

    tbody.innerHTML = creditos.map(credito => `
      <tr>
        <td>${credito.codigo}</td>
        <td>${credito.socio?.nombreCompleto || 'N/A'}</td>
        <td>${formatCurrency(credito.montoTotal || 0)}</td>
        <td>${formatCurrency(credito.saldoCapital || 0)}</td>
        <td>${credito.plazoMeses} meses</td>
        <td>${getEstadoBadge(credito.estado)}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="window.viewCredito(${credito.id})">Ver</button>
          ${getAccionesCredito(credito)}
        </td>
      </tr>
    `).join('');
  }

  // Helper: Badge de estado
  function getEstadoBadge(estado) {
    const badges = {
      'SOLICITADO': '<span class="badge badge-warning">Solicitado</span>',
      'APROBADO': '<span class="badge badge-info">Aprobado</span>',
      'DESEMBOLSADO': '<span class="badge badge-success">Desembolsado</span>',
      'COMPLETADO': '<span class="badge badge-primary">Completado</span>',
      'RECHAZADO': '<span class="badge badge-danger">Rechazado</span>',
      'CASTIGADO': '<span class="badge badge-danger">Castigado</span>',
    };
    return badges[estado] || '<span class="badge badge-secondary">' + estado + '</span>';
  }

  // Helper: Acciones según estado
  function getAccionesCredito(credito) {
    if (!api.isTesorero()) return '';

    let html = '';
    if (credito.estado === 'SOLICITADO') {
      html += `<button class="btn btn-sm btn-info" onclick="window.editarCredito(${credito.id})" style="margin-right: 5px;">Editar</button>`;
      html += `<button class="btn btn-sm btn-success" onclick="window.aprobarCredito(${credito.id})">Aprobar</button>`;
    } else if (credito.estado === 'APROBADO') {
      html += `<button class="btn btn-sm btn-success" onclick="window.desembolsarCredito(${credito.id})">Desembolsar</button>`;
    }
    return html;
  }

  // Filtrar créditos
  function filterCreditos() {
    const query = document.getElementById('searchCreditos').value.toLowerCase();
    const estado = document.getElementById('filterEstado').value;

    const filtered = creditosList.filter(credito => {
      const matchQuery = !query ||
        credito.codigo.toLowerCase().includes(query) ||
        (credito.socio?.nombreCompleto || '').toLowerCase().includes(query);

      const matchEstado = !estado || credito.estado === estado;

      return matchQuery && matchEstado;
    });

    renderCreditosTable(filtered);
  }

  // Ver detalle de crédito
  window.viewCredito = async function (creditoId) {
    try {
      showLoading();
      const credito = await api.getCredito(creditoId);

      currentCredito = creditoId; // Guardar ID del crédito actual
      showCreditoDetailModal(credito);
    } catch (error) {
      alert('Error al cargar crédito: ' + getErrorMessage(error));
    } finally {
      hideLoading();
    }
  };

  // Modal: Detalle de crédito
  function showCreditoDetailModal(credito) {
    const cuotasHtml = credito.cuotas && credito.cuotas.length > 0 ? `
      <h4>Cuotas</h4>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Vencimiento</th>
              <th>Monto</th>
              <th>Capital</th>
              <th>Interés</th>
              <th>Pagado</th>
              <th>Saldo Restante</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${credito.cuotas.map(c => `
              <tr>
                <td>${c.numeroCuota}</td>
                <td>${formatDate(c.fechaVencimiento)}</td>
                <td>${formatCurrency(c.montoTotal)}</td>
                <td>${formatCurrency(c.montoCapital)}</td>
                <td>${formatCurrency(c.montoInteres)}</td>
                <td><strong style="color: ${(c.montoPagado || 0) > 0 ? '#28a745' : '#6c757d'}">${formatCurrency(c.montoPagado || 0)}</strong></td>
                <td><strong>${formatCurrency(c.saldoRestante || 0)}</strong></td>
                <td>${getEstadoCuotaBadge(c.estado)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : '<p>No hay cuotas generadas aún.</p>';

    const modal = createModal('Detalle de Crédito', `
      <div class="row">
        <div class="col-6">
          <p><strong>Código:</strong> ${credito.codigo}</p>
          <p><strong>Socio:</strong> ${credito.socio?.nombreCompleto || 'N/A'}</p>
          <p><strong>Monto Total:</strong> ${formatCurrency(credito.montoTotal || 0)}</p>
          <p><strong>Saldo Capital:</strong> ${formatCurrency(credito.saldoCapital || 0)}</p>
        </div>
        <div class="col-6">
          <p><strong>Plazo:</strong> ${credito.plazoMeses} meses</p>
          <p><strong>Tasa Interés Mensual:</strong> ${parseFloat(credito.tasaInteresMensual || credito.tasaInteresAnual).toFixed(2)}%</p>
          <p><strong>Estado:</strong> ${getEstadoBadge(credito.estado)}</p>
          <p><strong>Fecha Solicitud:</strong> ${formatDate(credito.fechaSolicitud)}</p>
        </div>
      </div>

      <hr>

      ${cuotasHtml}
    `, [{
      text: 'Cerrar',
      className: 'btn-secondary',
      onClick: () => modal.close()
    }]);
  }

  // Helper: Badge estado de cuota
  function getEstadoCuotaBadge(estado) {
    const badges = {
      'PENDIENTE': '<span class="badge badge-warning">Pendiente</span>',
      'PAGADA': '<span class="badge badge-success">Pagada</span>',
      'VENCIDA': '<span class="badge badge-danger">Vencida</span>',
      'PARCIALMENTE_PAGADA': '<span class="badge badge-info">Parcial</span>',
    };
    return badges[estado] || '<span class="badge badge-secondary">' + estado + '</span>';
  }

  // Aprobar crédito
  window.aprobarCredito = async function (creditoId) {
    const observaciones = prompt('Observaciones de aprobación (opcional):');
    if (observaciones === null) return; // Cancelado

    try {
      showLoading();
      await api.aprobarCredito(creditoId, observaciones);
      alert('Crédito aprobado exitosamente');
      loadCreditos();
    } catch (error) {
      alert('Error al aprobar crédito: ' + getErrorMessage(error));
    } finally {
      hideLoading();
    }
  };

  // Desembolsar crédito
  window.desembolsarCredito = async function (creditoId) {
    try {
      showLoading();
      const credito = await api.getCredito(creditoId);
      hideLoading();

      const modal = createModal('Desembolsar Crédito', `
        <p><strong>Crédito:</strong> ${credito.codigo}</p>
        <p><strong>Socio:</strong> ${credito.socio?.nombreCompleto}</p>
        <p><strong>Monto:</strong> ${formatCurrency(credito.montoTotal)}</p>

        <form id="formDesembolsar">
          <div class="form-group">
            <label class="form-label">Fecha de Desembolso *</label>
            <input type="date" id="fechaDesembolso" class="form-control" value="${new Date().toISOString().split('T')[0]}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Tasa de Interés Anual (%) *</label>
            <input type="number" step="0.01" id="tasaInteres" class="form-control" value="${parseFloat(credito.tasaInteresAnual || (credito.tasaInteresMensual ? credito.tasaInteresMensual * 12 : 18.0)).toFixed(2)}" required>
            <small class="form-text">Tasa anual estándar: 18% (equivalente a 1.5% mensual)</small>
          </div>

          <div class="form-group">
            <label class="form-label">Observaciones</label>
            <textarea id="observaciones" class="form-control" rows="3"></textarea>
          </div>
        </form>
      `, [
        {
          text: 'Cancelar',
          className: 'btn-secondary',
          onClick: () => modal.close()
        },
        {
          text: 'Desembolsar',
          className: 'btn-success',
          onClick: async () => {
            const fechaDesembolso = document.getElementById('fechaDesembolso').value;
            const tasaInteresAnual = document.getElementById('tasaInteres').value;
            const observaciones = document.getElementById('observaciones').value;

            if (!fechaDesembolso || !tasaInteresAnual) {
              alert('Completa todos los campos obligatorios');
              return;
            }

            try {
              showLoading();
              await api.desembolsarCredito(creditoId, {
                fechaDesembolso,
                tasaInteresAnual: parseFloat(tasaInteresAnual),
                observaciones
              });

              alert('Crédito desembolsado exitosamente. Las cuotas han sido generadas.');
              modal.close();
              loadCreditos();
            } catch (error) {
              alert('Error al desembolsar: ' + getErrorMessage(error));
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

  // Modal: Nuevo crédito
  async function showNuevoCreditoModal() {
    // Recargar socios para asegurar que la lista esté actualizada
    await loadSociosForSelect();

    const modal = createModal('Solicitar Crédito', `
      <form id="formNuevoCredito">
        <div class="form-group">
          <label class="form-label">Socio *
            <button type="button" id="btnRecargarSocios" class="btn btn-sm btn-secondary" style="margin-left: 10px;">🔄 Actualizar lista</button>
          </label>
          <select id="creditoSocio" class="form-control" required>
            <option value="">Selecciona un socio</option>
            ${sociosList.map(s => `
              <option value="${s.id}">${s.codigo} - ${s.nombreCompleto} (Etapa ${s.etapaActual}, Ahorro: ${formatCurrency(s.ahorroActual || 0)})</option>
            `).join('')}
          </select>
          ${sociosList.length === 0 ? '<small class="form-text text-warning">⚠️ No hay socios activos. Crea un socio primero o recarga la lista.</small>' : ''}
        </div>

        <div class="row">
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Monto Solicitado *</label>
              <input type="number" step="0.01" min="50" id="creditoMonto" class="form-control" required placeholder="100.00">
              <small class="form-text">Mínimo: $50</small>
            </div>
          </div>
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Plazo (meses) *</label>
              <input type="number" min="6" max="60" id="creditoPlazo" class="form-control" required placeholder="12">
              <small class="form-text">Entre 6 y 60 meses</small>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Tasa Interés Anual (%)</label>
              <input type="number" step="0.01" id="creditoTasa" class="form-control" value="18.00" placeholder="18.00">
              <small class="form-text text-muted">Tasa anual estándar: 18% (1.5% mensual)</small>
            </div>
          </div>
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Tipo de Crédito</label>
              <select id="creditoTipo" class="form-control">
                <option value="PERSONAL">Personal</option>
                <option value="PRODUCTIVO">Productivo</option>
                <option value="VIVIENDA">Vivienda</option>
                <option value="EDUCATIVO">Educativo</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Método de Amortización</label>
          <select id="creditoMetodo" class="form-control">
            <option value="FRANCES">Francés (Cuota fija)</option>
            <option value="ALEMAN">Alemán (Capital fijo)</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Propósito del Crédito</label>
          <textarea id="creditoProposito" class="form-control" rows="2" placeholder="Describe el propósito..."></textarea>
        </div>
      </form>
    `, [
      {
        text: 'Cancelar',
        className: 'btn-secondary',
        onClick: () => modal.close()
      },
      {
        text: 'Solicitar Crédito',
        className: 'btn-primary',
        onClick: async () => {
          const data = {
            socioId: parseInt(document.getElementById('creditoSocio').value),
            montoSolicitado: parseFloat(document.getElementById('creditoMonto').value),
            plazoMeses: parseInt(document.getElementById('creditoPlazo').value),
            tasaInteresAnual: parseFloat(document.getElementById('creditoTasa').value) || 12.0,
            tipoCredito: document.getElementById('creditoTipo').value,
            metodoAmortizacion: document.getElementById('creditoMetodo').value,
            proposito: document.getElementById('creditoProposito').value,
          };

          // Validaciones
          if (!data.socioId || !data.montoSolicitado || !data.plazoMeses) {
            alert('Completa todos los campos obligatorios');
            return;
          }

          if (data.montoSolicitado < 50) {
            alert('El monto mínimo es $50');
            return;
          }

          if (data.plazoMeses < 6 || data.plazoMeses > 60) {
            alert('El plazo debe estar entre 6 y 60 meses');
            return;
          }

          try {
            showLoading();
            await api.solicitarCredito(data);
            alert('Crédito solicitado exitosamente');
            modal.close();
            loadCreditos();
          } catch (error) {
            alert('Error al solicitar crédito: ' + getErrorMessage(error));
          } finally {
            hideLoading();
          }
        }
      }
    ]);

    // Agregar event listener para botón de recargar socios
    const btnRecargarSocios = document.getElementById('btnRecargarSocios');
    if (btnRecargarSocios) {
      btnRecargarSocios.addEventListener('click', async () => {
        btnRecargarSocios.disabled = true;
        btnRecargarSocios.textContent = '🔄 Cargando...';

        await loadSociosForSelect();

        // Actualizar el select con la nueva lista
        const selectSocio = document.getElementById('creditoSocio');
        selectSocio.innerHTML = `
          <option value="">Selecciona un socio</option>
          ${sociosList.map(s => `
            <option value="${s.id}">${s.codigo} - ${s.nombreCompleto} (Etapa ${s.etapaActual}, Ahorro: ${formatCurrency(s.ahorroActual || 0)})</option>
          `).join('')}
        `;

        btnRecargarSocios.disabled = false;
        btnRecargarSocios.textContent = '🔄 Actualizar lista';

        alert(`Lista actualizada. ${sociosList.length} socios activos encontrados.`);
      });
    }
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

  // Editar crédito (solo SOLICITADO)
  window.editarCredito = async function (creditoId) {
    try {
      showLoading();
      const credito = await api.getCredito(creditoId);
      hideLoading();

      // Verificar que sea SOLICITADO
      if (credito.estado !== 'SOLICITADO') {
        alert('Solo se pueden editar créditos en estado SOLICITADO');
        return;
      }

      const modal = createModal('Editar Crédito Solicitado', `
        <form id="formEditarCredito">
          <div class="alert alert-info">
            <strong>ℹ️ Nota:</strong> Solo se pueden editar créditos en estado SOLICITADO. Los campos marcados con * no se pueden modificar.
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Código *</label>
                <input type="text" class="form-control" value="${credito.codigo}" disabled>
                <small class="form-text text-muted">Campo no editable</small>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Socio *</label>
                <input type="text" class="form-control" value="${credito.socio?.nombreCompleto || 'N/A'}" disabled>
                <small class="form-text text-muted">Campo no editable</small>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Monto Solicitado *</label>
                <input type="number" step="0.01" min="1" id="editMonto" class="form-control" value="${credito.montoSolicitado}" required>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Plazo (meses) *</label>
                <input type="number" min="1" max="60" id="editPlazo" class="form-control" value="${credito.plazoMeses}" required>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Tasa de Interés Anual (%) *</label>
                <input type="number" step="0.01" min="0" max="100" id="editTasa" class="form-control" value="${credito.tasaInteresAnual}" required>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Tipo de Crédito *</label>
                <select id="editTipo" class="form-control" required>
                  <option value="ORDINARIO" ${credito.tipoCredito === 'ORDINARIO' ? 'selected' : ''}>Ordinario</option>
                  <option value="EXTRAORDINARIO" ${credito.tipoCredito === 'EXTRAORDINARIO' ? 'selected' : ''}>Extraordinario</option>
                  <option value="EMERGENCIA" ${credito.tipoCredito === 'EMERGENCIA' ? 'selected' : ''}>Emergencia</option>
                </select>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Método de Amortización *</label>
                <select id="editMetodo" class="form-control" required>
                  <option value="FRANCES" ${credito.metodoAmortizacion === 'FRANCES' ? 'selected' : ''}>Francés (Cuota Fija)</option>
                  <option value="ALEMAN" ${credito.metodoAmortizacion === 'ALEMAN' ? 'selected' : ''}>Alemán (Capital Fijo)</option>
                </select>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Fecha Solicitud *</label>
                <input type="text" class="form-control" value="${formatDate(credito.fechaSolicitud)}" disabled>
                <small class="form-text text-muted">Campo no editable</small>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Propósito del Crédito</label>
            <textarea id="editProposito" class="form-control" rows="3" placeholder="Describe el propósito del crédito">${credito.proposito || ''}</textarea>
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
              montoSolicitado: parseFloat(document.getElementById('editMonto').value),
              plazoMeses: parseInt(document.getElementById('editPlazo').value),
              tasaInteresAnual: parseFloat(document.getElementById('editTasa').value),
              tipoCredito: document.getElementById('editTipo').value,
              metodoAmortizacion: document.getElementById('editMetodo').value,
              proposito: document.getElementById('editProposito').value || undefined,
            };

            // Validaciones
            if (!data.montoSolicitado || data.montoSolicitado <= 0) {
              alert('El monto debe ser mayor a 0');
              return;
            }

            if (!data.plazoMeses || data.plazoMeses <= 0) {
              alert('El plazo debe ser mayor a 0');
              return;
            }

            if (data.tasaInteresAnual < 0 || data.tasaInteresAnual > 100) {
              alert('La tasa de interés debe estar entre 0 y 100');
              return;
            }

            const confirmSave = await customConfirm('¿Estás seguro de guardar los cambios en este crédito?', '💾 Guardar Cambios');
            if (!confirmSave) {
              return;
            }

            try {
              showLoading();
              await api.actualizarCredito(creditoId, data);
              alert('Crédito actualizado exitosamente');
              modal.close();
              loadCreditos();
            } catch (error) {
              alert('Error al actualizar crédito: ' + getErrorMessage(error));
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
  window.initCreditosModule = initCreditosModule;

  // Si se carga dinámicamente y el contenedor ya existe, inicializar
  if (document.getElementById('creditosContent')) {
    initCreditosModule();
  }
})();
