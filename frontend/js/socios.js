/**
 * ============================================================================
 * Sistema MLF - Módulo de Socios
 * Archivo: js/socios.js
 * Descripción: Gestión de socios, depósitos y retiros
 * ============================================================================
 */

(function () {
  let sociosList = [];
  let currentSocio = null;
  let currentDetailModal = null; // Modal de detalle actualmente abierto

  // Inicializar módulo
  function initSociosModule() {
    renderSociosUI();
    loadSocios();
  }

  // Renderizar interfaz
  function renderSociosUI() {
    const container = document.getElementById('sociosContent');

    container.innerHTML = `
      <div class="card mb-3">
        <div class="card-header d-flex justify-between align-center">
          <h3 class="card-title" style="margin: 0;">Lista de Socios</h3>
          ${api.isTesorero() ? '<button class="btn btn-primary" id="btnNuevoSocio">+ Nuevo Socio</button>' : ''}
        </div>
        <div class="card-body">
          <div class="form-group">
            <input
              type="text"
              id="searchSocios"
              class="form-control"
              placeholder="Buscar por código, nombre, email..."
            >
          </div>

          <div class="table-responsive">
            <table class="table" style="table-layout: fixed; width: 100%;">
              <thead>
                <tr>
                  <!--
                    AJUSTE MANUAL DE ANCHOS:
                    Modifica los porcentajes según tus necesidades.
                    La suma debe ser ~100% para aprovechar todo el espacio.
                    Valores actuales optimizados:
                  -->
                  <th style="width: 13%; font-size: 0.85rem;">Código</th>
                  <th style="width: 22%;">Nombre Completo</th>
                  <th style="width: 18%;">Email</th>
                  <th style="width: 8%;">Etapa</th>
                  <th style="width: 12%;">Ahorro Actual</th>
                  <th style="width: 8%;">Estado</th>
                  <th style="width: 19%;">Acciones</th>
                  <!-- Total: 100% - Botones más compactos liberan espacio para Código -->
                </tr>
              </thead>
              <tbody id="sociosTableBody">
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
    const searchInput = document.getElementById('searchSocios');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterSocios(e.target.value);
      });
    }

    const btnNuevoSocio = document.getElementById('btnNuevoSocio');
    if (btnNuevoSocio) {
      btnNuevoSocio.addEventListener('click', showNuevoSocioModal);
    }
  }

  // Cargar socios
  async function loadSocios() {
    try {
      const response = await api.getSocios({ page: 1, limit: 1000 });
      sociosList = response.socios || [];
      renderSociosTable(sociosList);
    } catch (error) {
      console.error('Error cargando socios:', error);
      alert('Error al cargar socios: ' + getErrorMessage(error));
    }
  }

  // Renderizar tabla de socios
  function renderSociosTable(socios) {
    const tbody = document.getElementById('sociosTableBody');

    if (socios.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay socios registrados</td></tr>';
      return;
    }

    tbody.innerHTML = socios.map(socio => `
      <tr>
        <td style="font-size: 0.85rem;">${socio.codigo}</td>
        <td>${socio.nombreCompleto}</td>
        <td>${socio.email || '-'}</td>
        <td><span class="badge badge-primary">Etapa ${socio.etapaActual}</span></td>
        <td>${formatCurrency(socio.ahorroActual || 0)}</td>
        <td>
          <span class="badge ${socio.estado === 'ACTIVO' ? 'badge-success' : 'badge-secondary'}">
            ${socio.estado}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 0.3rem; flex-wrap: wrap;">
            <button class="btn btn-sm btn-primary" onclick="window.viewSocio(${socio.id})">Ver</button>
            ${api.isTesorero() ? `
              <button class="btn btn-sm btn-info" onclick="window.editarSocio(${socio.id})" title="Editar información del socio">Editar</button>
              <button class="btn btn-sm btn-success" onclick="window.showDepositarModal(${socio.id})">Depositar</button>
              <button class="btn btn-sm btn-warning" onclick="window.showRetirarModal(${socio.id})">Retirar</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  }

  // Filtrar socios
  function filterSocios(query) {
    const filtered = sociosList.filter(socio => {
      const searchStr = query.toLowerCase();
      return (
        socio.codigo.toLowerCase().includes(searchStr) ||
        socio.nombreCompleto.toLowerCase().includes(searchStr) ||
        (socio.email && socio.email.toLowerCase().includes(searchStr))
      );
    });
    renderSociosTable(filtered);
  }

  // Ver detalle de socio
  window.viewSocio = async function (socioId) {
    try {
      showLoading();
      const socio = await api.getSocio(socioId);
      const historial = await api.getHistorialTransacciones(socioId);

      currentSocio = socioId; // Guardar ID del socio actual
      showSocioDetailModal(socio, historial.transacciones || historial || []);
    } catch (error) {
      alert('Error al cargar socio: ' + getErrorMessage(error));
    } finally {
      hideLoading();
    }
  };

  // Modal: Detalle de socio
  function showSocioDetailModal(socio, historial) {
    // Cerrar modal anterior si existe
    if (currentDetailModal) {
      currentDetailModal.close();
    }

    // Asegurar que historial sea siempre un array
    const transacciones = Array.isArray(historial) ? historial : [];

    const modal = createModal('Detalle de Socio', `
      <div class="row">
        <div class="col-6">
          <p><strong>Código:</strong> ${socio.codigo}</p>
          <p><strong>Nombre:</strong> ${socio.nombreCompleto}</p>
          <p><strong>Email:</strong> ${socio.email || '-'}</p>
          <p><strong>Teléfono:</strong> ${socio.telefono || '-'}</p>
        </div>
        <div class="col-6">
          <p><strong>Etapa:</strong> ${socio.etapaActual}</p>
          <p><strong>Ahorro Actual:</strong> ${formatCurrency(socio.ahorroActual || 0)}</p>
          <p><strong>Ahorro Congelado:</strong> ${formatCurrency(socio.ahorroCongelado || 0)}</p>
          <p><strong>Estado:</strong> <span class="badge ${socio.estado === 'ACTIVO' ? 'badge-success' : 'badge-secondary'}">${socio.estado}</span></p>
        </div>
      </div>

      <hr>

      <h4>Historial de Transacciones (Últimas 10)</h4>
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Tipo</th>
              <th>Saldo Anterior</th>
              <th>Monto</th>
              <th>Saldo Nuevo</th>
              <th>Concepto</th>
            </tr>
          </thead>
          <tbody>
            ${transacciones.length > 0 ? transacciones.slice(0, 10).map(t => `
              <tr>
                <td>${formatDate(t.fechaRegistro || t.fecha)}</td>
                <td><span class="badge ${t.tipo === 'DEPOSITO' ? 'badge-success' : 'badge-warning'}">${t.tipo}</span></td>
                <td>${formatCurrency(t.saldoAnterior || 0)}</td>
                <td>${formatCurrency(t.monto)}</td>
                <td><strong>${formatCurrency(t.saldoNuevo || 0)}</strong></td>
                <td>${t.concepto || '-'}</td>
              </tr>
            `).join('') : '<tr><td colspan="6" class="text-center">No hay transacciones</td></tr>'}
          </tbody>
        </table>
      </div>
    `, [{
      text: 'Cerrar',
      className: 'btn-secondary',
      onClick: () => {
        currentDetailModal = null;
        currentSocio = null;
        modal.close();
      }
    }]);

    currentDetailModal = modal; // Guardar referencia al modal actual
  }

  // Modal: Depositar
  window.showDepositarModal = async function (socioId) {
    try {
      const socio = await api.getSocio(socioId);

      const modal = createModal('Depositar Ahorro', `
        <p><strong>Socio:</strong> ${socio.nombreCompleto} (${socio.codigo})</p>
        <p><strong>Ahorro Actual:</strong> ${formatCurrency(socio.ahorroActual || 0)}</p>

        <form id="formDepositar">
          <div class="form-group">
            <label class="form-label">Monto a Depositar *</label>
            <input type="number" step="0.01" min="0.01" id="depositMonto" class="form-control" required>
          </div>

          <div class="form-group">
            <label class="form-label">Método de Pago *</label>
            <select id="depositMetodo" class="form-control" required>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="DEPOSITO">Depósito Bancario</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Concepto</label>
            <input type="text" id="depositConcepto" class="form-control" placeholder="Depósito mensual">
          </div>
        </form>
      `, [
        {
          text: 'Cancelar',
          className: 'btn-secondary',
          onClick: () => modal.close()
        },
        {
          text: 'Depositar',
          className: 'btn-success',
          onClick: async () => {
            const monto = document.getElementById('depositMonto').value;
            const metodo = document.getElementById('depositMetodo').value;
            const concepto = document.getElementById('depositConcepto').value;

            if (!monto || parseFloat(monto) <= 0) {
              alert('Ingresa un monto válido');
              return;
            }

            try {
              showLoading();
              await api.depositarAhorro(socioId, {
                monto: parseFloat(monto),
                metodo,
                concepto
              });

              alert('Depósito realizado exitosamente');
              modal.close();
              loadSocios();

              // Si el modal de detalle está abierto, recargarlo
              if (currentSocio === socioId && currentDetailModal) {
                await window.viewSocio(socioId);
              }
            } catch (error) {
              alert('Error al depositar: ' + getErrorMessage(error));
            } finally {
              hideLoading();
            }
          }
        }
      ]);
    } catch (error) {
      alert('Error: ' + getErrorMessage(error));
    }
  };

  // Modal: Retirar
  window.showRetirarModal = async function (socioId) {
    try {
      const socio = await api.getSocio(socioId);
      // Usar el ahorro disponible calculado por el backend (considera comprometido + congelado)
      const disponible = parseFloat(socio.ahorroDisponible || 0);
      const comprometido = parseFloat(socio.ahorroComprometido || 0);

      const modal = createModal('Retirar Ahorro', `
        <p><strong>Socio:</strong> ${socio.nombreCompleto} (${socio.codigo})</p>
        <p><strong>Ahorro Total:</strong> ${formatCurrency(socio.ahorroActual || 0)}</p>
        <p><strong>Ahorro Comprometido:</strong> <span class="text-danger">${formatCurrency(comprometido)}</span></p>
        <p><strong>Ahorro Congelado:</strong> ${formatCurrency(socio.ahorroCongelado || 0)}</p>
        <p><strong>Disponible para Retiro:</strong> <span class="text-success">${formatCurrency(disponible)}</span></p>

        <form id="formRetirar">
          <div class="form-group">
            <label class="form-label">Monto a Retirar *</label>
            <input type="number" step="0.01" min="0.01" max="${disponible}" id="retiroMonto" class="form-control" required>
            <small class="form-text">Máximo: ${formatCurrency(disponible)}</small>
          </div>

          <div class="form-group">
            <label class="form-label">Método de Pago *</label>
            <select id="retiroMetodo" class="form-control" required>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TRANSFERENCIA">Transferencia</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Concepto</label>
            <input type="text" id="retiroConcepto" class="form-control" placeholder="Retiro autorizado">
          </div>
        </form>
      `, [
        {
          text: 'Cancelar',
          className: 'btn-secondary',
          onClick: () => modal.close()
        },
        {
          text: 'Retirar',
          className: 'btn-warning',
          onClick: async () => {
            const monto = document.getElementById('retiroMonto').value;
            const metodo = document.getElementById('retiroMetodo').value;
            const concepto = document.getElementById('retiroConcepto').value;

            if (!monto || parseFloat(monto) <= 0) {
              alert('Ingresa un monto válido');
              return;
            }

            if (parseFloat(monto) > disponible) {
              alert('El monto excede el saldo disponible');
              return;
            }

            try {
              showLoading();
              await api.retirarAhorro(socioId, {
                monto: parseFloat(monto),
                metodo,
                concepto
              });

              alert('Retiro realizado exitosamente');
              modal.close();
              loadSocios();

              // Si el modal de detalle está abierto, recargarlo
              if (currentSocio === socioId && currentDetailModal) {
                await window.viewSocio(socioId);
              }
            } catch (error) {
              alert('Error al retirar: ' + getErrorMessage(error));
            } finally {
              hideLoading();
            }
          }
        }
      ]);
    } catch (error) {
      alert('Error: ' + getErrorMessage(error));
    }
  };

  // Modal: Nuevo socio
  function showNuevoSocioModal() {
    const modal = createModal('Nuevo Socio', `
      <form id="formNuevoSocio">
        <!-- Sección: Datos Personales -->
        <h4 style="margin-bottom: 1rem; color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem;">
          📋 Datos Personales
        </h4>

        <div class="form-group">
          <label class="form-label">Nombre Completo *</label>
          <input type="text" id="nuevoNombre" class="form-control" required placeholder="Juan Pérez">
        </div>

        <div class="row">
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Documento de Identidad *</label>
              <input type="text" id="nuevoDocumento" class="form-control" required placeholder="12345678">
            </div>
          </div>
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Fecha de Nacimiento *</label>
              <input type="date" id="nuevoFechaNacimiento" class="form-control" required>
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Email *</label>
              <input type="email" id="nuevoEmail" class="form-control" required placeholder="juan@example.com">
            </div>
          </div>
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Teléfono *</label>
              <input type="tel" id="nuevoTelefono" class="form-control" required placeholder="1234567890">
            </div>
          </div>
        </div>

        <div class="row">
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Ciudad *</label>
              <input type="text" id="nuevoCiudad" class="form-control" required placeholder="Lima">
            </div>
          </div>
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Dirección *</label>
              <input type="text" id="nuevaDireccion" class="form-control" required placeholder="Calle 123">
            </div>
          </div>
        </div>

        <!-- Sección: Configuración del Sistema -->
        <h4 style="margin-top: 1.5rem; margin-bottom: 1rem; color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem;">
          ⚙️ Configuración del Sistema
        </h4>

        <div class="row">
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Etapa Inicial *</label>
              <select id="nuevoEtapa" class="form-control" required>
                <option value="1">Etapa 1 - Iniciante (Nuevo socio)</option>
                <option value="2">Etapa 2 - Regular (Socio intermedio)</option>
                <option value="3">Etapa 3 - Especial (Socio veterano)</option>
              </select>
              <small class="form-text">Etapa 1: Nuevos socios | Etapa 2: 3+ créditos sin mora | Etapa 3: 5+ créditos sin mora</small>
            </div>
          </div>
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Depósito Inicial *</label>
              <input type="number" step="0.01" min="0" id="nuevoDeposito" class="form-control" required placeholder="0.00">
              <small class="form-text">Monto del primer depósito de ahorro</small>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Recomendadores (IDs separados por coma)</label>
          <input type="text" id="nuevoRecomendadores" class="form-control" placeholder="1,2">
          <small class="form-text">Ejemplo: 1,2 (IDs de socios que recomiendan). Dejar vacío para socios fundadores</small>
        </div>

        <!-- Sección: Credenciales de Acceso -->
        <h4 style="margin-top: 1.5rem; margin-bottom: 1rem; color: var(--primary-color); border-bottom: 2px solid var(--primary-color); padding-bottom: 0.5rem;">
          🔐 Credenciales de Acceso
        </h4>

        <div class="alert alert-info" style="margin-bottom: 1rem;">
          <strong>ℹ️ Nota:</strong> Estas credenciales permitirán al socio acceder al sistema
        </div>

        <div class="row">
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Usuario *</label>
              <input type="text" id="nuevoUsuario" class="form-control" required placeholder="juanperez">
              <small class="form-text">Nombre de usuario para iniciar sesión</small>
            </div>
          </div>
          <div class="col-6">
            <div class="form-group">
              <label class="form-label">Contraseña *</label>
              <input type="password" id="nuevoPassword" class="form-control" required placeholder="Mínimo 6 caracteres">
              <small class="form-text">Contraseña temporal (el socio podrá cambiarla)</small>
            </div>
          </div>
        </div>
      </form>
    `, [
      {
        text: 'Cancelar',
        className: 'btn-secondary',
        onClick: () => modal.close()
      },
      {
        text: 'Crear Socio',
        className: 'btn-primary',
        onClick: async () => {
          const recomendadoresValue = document.getElementById('nuevoRecomendadores').value.trim();
          const recomendadores = recomendadoresValue
            ? recomendadoresValue.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
            : [];

          const data = {
            usuario: document.getElementById('nuevoUsuario').value,
            nombreCompleto: document.getElementById('nuevoNombre').value,
            documentoIdentidad: document.getElementById('nuevoDocumento').value,
            fechaNacimiento: document.getElementById('nuevoFechaNacimiento').value,
            ciudad: document.getElementById('nuevoCiudad').value,
            direccion: document.getElementById('nuevaDireccion').value,
            email: document.getElementById('nuevoEmail').value,
            telefono: document.getElementById('nuevoTelefono').value,
            depositoInicial: parseFloat(document.getElementById('nuevoDeposito').value),
            password: document.getElementById('nuevoPassword').value,
            etapaActual: parseInt(document.getElementById('nuevoEtapa').value),
            recomendadores: recomendadores,
          };

          // Validaciones básicas
          if (!data.usuario || !data.nombreCompleto || !data.email || !data.password ||
            !data.documentoIdentidad || !data.fechaNacimiento || !data.ciudad || !data.direccion ||
            !data.telefono || isNaN(data.depositoInicial)) {
            alert('Por favor completa todos los campos obligatorios');
            return;
          }

          if (data.password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
          }

          if (data.depositoInicial < 0) {
            alert('El depósito inicial debe ser mayor o igual a 0');
            return;
          }

          try {
            showLoading();
            await api.crearSocio(data);
            alert('Socio creado exitosamente');
            modal.close();
            loadSocios();
          } catch (error) {
            alert('Error al crear socio: ' + getErrorMessage(error));
          } finally {
            hideLoading();
          }
        }
      }
    ]);
  }

  // Editar socio
  window.editarSocio = async function (socioId) {
    try {
      showLoading();
      const socio = await api.getSocio(socioId);
      hideLoading();

      const modal = createModal('Editar Socio', `
        <form id="formEditarSocio">
          <div class="alert alert-info">
            <strong>ℹ️ Nota:</strong> Los campos marcados con * no se pueden modificar por motivos de integridad del sistema.
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Código *</label>
                <input type="text" class="form-control" value="${socio.codigo}" disabled>
                <small class="form-text text-muted">Campo no editable</small>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Usuario</label>
                <input type="text" id="editUsuario" class="form-control" value="${socio.usuario || ''}" placeholder="juanperez">
                <small class="form-text text-muted">Usuario para login del socio</small>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Nombre Completo</label>
            <input type="text" id="editNombre" class="form-control" value="${socio.nombreCompleto}" required>
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Documento de Identidad (DUI)</label>
                <input type="text" id="editDocumento" class="form-control" value="${socio.documentoIdentidad || ''}" placeholder="12345678-9">
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Fecha de Nacimiento</label>
                <input type="date" id="editFechaNacimiento" class="form-control" value="${socio.fechaNacimiento ? socio.fechaNacimiento.split('T')[0] : ''}">
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Email</label>
                <input type="email" id="editEmail" class="form-control" value="${socio.email || ''}" placeholder="juan@example.com">
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Teléfono</label>
                <input type="tel" id="editTelefono" class="form-control" value="${socio.telefono || ''}" placeholder="1234-5678">
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Ciudad</label>
                <input type="text" id="editCiudad" class="form-control" value="${socio.ciudad || ''}" placeholder="San Salvador">
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Dirección</label>
                <input type="text" id="editDireccion" class="form-control" value="${socio.direccion || ''}" placeholder="Calle 123">
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Estado</label>
                <select id="editEstado" class="form-control">
                  <option value="ACTIVO" ${socio.estado === 'ACTIVO' ? 'selected' : ''}>ACTIVO</option>
                  <option value="INACTIVO" ${socio.estado === 'INACTIVO' ? 'selected' : ''}>INACTIVO</option>
                  <option value="SUSPENDIDO" ${socio.estado === 'SUSPENDIDO' ? 'selected' : ''}>SUSPENDIDO</option>
                </select>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Etapa del Socio</label>
                <select id="editEtapa" class="form-control">
                  <option value="1" ${socio.etapaActual === 1 ? 'selected' : ''}>Etapa 1 - Iniciante (hasta $2,000)</option>
                  <option value="2" ${socio.etapaActual === 2 ? 'selected' : ''}>Etapa 2 - Regular (hasta $5,000)</option>
                  <option value="3" ${socio.etapaActual === 3 ? 'selected' : ''}>Etapa 3 - Especial (hasta $15,000)</option>
                </select>
                <small class="form-text text-muted">⚠️ Al cambiar de etapa, el contador de créditos se reseteará</small>
              </div>
            </div>
          </div>

          <div class="row">
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Ahorro Actual *</label>
                <input type="text" class="form-control" value="${formatCurrency(socio.ahorroActual || 0)}" disabled>
                <small class="form-text text-muted">Modificar mediante depósitos/retiros</small>
              </div>
            </div>
            <div class="col-6">
              <div class="form-group">
                <label class="form-label">Créditos en Etapa Actual *</label>
                <input type="text" class="form-control" value="${socio.creditosEtapaActual || 0}" disabled>
                <small class="form-text text-muted">Se resetea al cambiar de etapa</small>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Nueva Contraseña</label>
            <input type="password" id="editPassword" class="form-control" placeholder="Dejar en blanco para no cambiar">
            <small class="form-text text-muted">Solo llenar si desea cambiar la contraseña del socio</small>
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
            const nuevaEtapa = parseInt(document.getElementById('editEtapa').value);
            const etapaAnterior = socio.etapaActual;

            const data = {
              usuario: document.getElementById('editUsuario').value || undefined,
              nombreCompleto: document.getElementById('editNombre').value,
              documentoIdentidad: document.getElementById('editDocumento').value || undefined,
              fechaNacimiento: document.getElementById('editFechaNacimiento').value || undefined,
              email: document.getElementById('editEmail').value || undefined,
              telefono: document.getElementById('editTelefono').value || undefined,
              ciudad: document.getElementById('editCiudad').value || undefined,
              direccion: document.getElementById('editDireccion').value || undefined,
              estado: document.getElementById('editEstado').value,
              etapaActual: nuevaEtapa,
              password: document.getElementById('editPassword').value || undefined,
            };

            // Validaciones
            if (!data.nombreCompleto) {
              alert('El nombre completo es obligatorio');
              return;
            }

            // Confirmación especial al cambiar de etapa
            if (nuevaEtapa !== etapaAnterior) {
              const mensajeEtapa = `⚠️ CAMBIO DE ETAPA\n\n` +
                `Etapa anterior: ${etapaAnterior}\n` +
                `Etapa nueva: ${nuevaEtapa}\n\n` +
                `IMPORTANTE:\n` +
                `• El contador de créditos en la etapa se reseteará a 0\n` +
                `• Los créditos activos NO se verán afectados\n` +
                `• Las nuevas restricciones aplicarán para futuros créditos\n\n` +
                `¿Estás seguro de cambiar la etapa?`;

              const confirmEtapa = await customConfirm(mensajeEtapa, '⚠️ Cambio de Etapa');
              if (!confirmEtapa) {
                return;
              }
            }

            const confirmSave = await customConfirm('¿Estás seguro de guardar los cambios?', '💾 Guardar Cambios');
            if (!confirmSave) {
              return;
            }

            try {
              showLoading();
              await api.actualizarSocio(socioId, data);
              alert('Socio actualizado exitosamente');
              modal.close();
              loadSocios();
            } catch (error) {
              alert('Error al actualizar socio: ' + getErrorMessage(error));
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

  // Helper: Crear modal
  function createModal(title, body, buttons = []) {
    // Eliminar modales anteriores
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

    // Event listeners para botones
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

  // Inicializar
  initSociosModule();
})();
