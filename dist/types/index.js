"use strict";
/**
 * ============================================================================
 * Sistema MLF - Tipos TypeScript Globales
 * Archivo: src/types/index.ts
 * Descripción: Definiciones de tipos reutilizables en toda la aplicación
 * ============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DIAS_MORA = exports.REGLAS_ETAPAS = exports.EstadoNotificacion = exports.CanalNotificacion = exports.TipoNotificacion = exports.MetodoPago = exports.TipoTransaccion = exports.EstadoLiberacionGarantia = exports.EstadoGarantia = exports.ClasificacionMora = exports.EstadoCuota = exports.MetodoAmortizacion = exports.EstadoCredito = exports.EtapaSocio = exports.RolSocio = exports.EstadoSocio = void 0;
// ============================================================================
// ENUMS
// ============================================================================
var EstadoSocio;
(function (EstadoSocio) {
    EstadoSocio["ACTIVO"] = "ACTIVO";
    EstadoSocio["INACTIVO"] = "INACTIVO";
    EstadoSocio["EXPULSADO"] = "EXPULSADO";
})(EstadoSocio || (exports.EstadoSocio = EstadoSocio = {}));
var RolSocio;
(function (RolSocio) {
    RolSocio["SOCIO"] = "SOCIO";
    RolSocio["TESORERO"] = "TESORERO";
    RolSocio["ADMIN"] = "ADMIN";
})(RolSocio || (exports.RolSocio = RolSocio = {}));
var EtapaSocio;
(function (EtapaSocio) {
    EtapaSocio[EtapaSocio["INICIANTE"] = 1] = "INICIANTE";
    EtapaSocio[EtapaSocio["REGULAR"] = 2] = "REGULAR";
    EtapaSocio[EtapaSocio["ESPECIAL"] = 3] = "ESPECIAL";
})(EtapaSocio || (exports.EtapaSocio = EtapaSocio = {}));
var EstadoCredito;
(function (EstadoCredito) {
    EstadoCredito["SOLICITADO"] = "SOLICITADO";
    EstadoCredito["EN_REVISION"] = "EN_REVISION";
    EstadoCredito["APROBADO"] = "APROBADO";
    EstadoCredito["RECHAZADO"] = "RECHAZADO";
    EstadoCredito["DESEMBOLSADO"] = "DESEMBOLSADO";
    EstadoCredito["ACTIVO"] = "ACTIVO";
    EstadoCredito["COMPLETADO"] = "COMPLETADO";
    EstadoCredito["CASTIGADO"] = "CASTIGADO";
})(EstadoCredito || (exports.EstadoCredito = EstadoCredito = {}));
var MetodoAmortizacion;
(function (MetodoAmortizacion) {
    MetodoAmortizacion["FRANCES"] = "FRANCES";
    MetodoAmortizacion["ALEMAN"] = "ALEMAN";
})(MetodoAmortizacion || (exports.MetodoAmortizacion = MetodoAmortizacion = {}));
var EstadoCuota;
(function (EstadoCuota) {
    EstadoCuota["PENDIENTE"] = "PENDIENTE";
    EstadoCuota["PAGADA"] = "PAGADA";
    EstadoCuota["VENCIDA"] = "VENCIDA";
    EstadoCuota["PARCIALMENTE_PAGADA"] = "PARCIALMENTE_PAGADA";
})(EstadoCuota || (exports.EstadoCuota = EstadoCuota = {}));
var ClasificacionMora;
(function (ClasificacionMora) {
    ClasificacionMora["MORA_LEVE"] = "MORA_LEVE";
    ClasificacionMora["MORA_MODERADA"] = "MORA_MODERADA";
    ClasificacionMora["MORA_GRAVE"] = "MORA_GRAVE";
    ClasificacionMora["MORA_PERSISTENTE"] = "MORA_PERSISTENTE";
    ClasificacionMora["CASTIGADO"] = "CASTIGADO";
})(ClasificacionMora || (exports.ClasificacionMora = ClasificacionMora = {}));
var EstadoGarantia;
(function (EstadoGarantia) {
    EstadoGarantia["PENDIENTE"] = "PENDIENTE";
    EstadoGarantia["ACTIVA"] = "ACTIVA";
    EstadoGarantia["EJECUTADA"] = "EJECUTADA";
    EstadoGarantia["LIBERADA"] = "LIBERADA";
})(EstadoGarantia || (exports.EstadoGarantia = EstadoGarantia = {}));
var EstadoLiberacionGarantia;
(function (EstadoLiberacionGarantia) {
    EstadoLiberacionGarantia["SOLICITADA"] = "SOLICITADA";
    EstadoLiberacionGarantia["APROBADA"] = "APROBADA";
    EstadoLiberacionGarantia["RECHAZADA"] = "RECHAZADA";
    EstadoLiberacionGarantia["PROCESADA"] = "PROCESADA";
})(EstadoLiberacionGarantia || (exports.EstadoLiberacionGarantia = EstadoLiberacionGarantia = {}));
var TipoTransaccion;
(function (TipoTransaccion) {
    TipoTransaccion["DEPOSITO"] = "DEPOSITO";
    TipoTransaccion["RETIRO"] = "RETIRO";
    TipoTransaccion["TRANSFERENCIA"] = "TRANSFERENCIA";
    TipoTransaccion["UTILIDAD"] = "UTILIDAD";
    TipoTransaccion["DESEMBOLSO"] = "DESEMBOLSO";
    TipoTransaccion["CONGELAMIENTO"] = "CONGELAMIENTO";
    TipoTransaccion["DESCONGELAMIENTO"] = "DESCONGELAMIENTO";
    // Nuevos tipos detectados en uso
    TipoTransaccion["DEPOSITO_AHORRO"] = "DEPOSITO_AHORRO";
    TipoTransaccion["RETIRO_AHORRO"] = "RETIRO_AHORRO";
    TipoTransaccion["DEPOSITO_INICIAL"] = "DEPOSITO_INICIAL";
})(TipoTransaccion || (exports.TipoTransaccion = TipoTransaccion = {}));
var MetodoPago;
(function (MetodoPago) {
    MetodoPago["EFECTIVO"] = "EFECTIVO";
    MetodoPago["TRANSFERENCIA"] = "TRANSFERENCIA";
    MetodoPago["DEPOSITO"] = "DEPOSITO";
    MetodoPago["OTRO"] = "OTRO";
})(MetodoPago || (exports.MetodoPago = MetodoPago = {}));
var TipoNotificacion;
(function (TipoNotificacion) {
    TipoNotificacion["BIENVENIDA"] = "BIENVENIDA";
    TipoNotificacion["CREDITO_APROBADO"] = "CREDITO_APROBADO";
    TipoNotificacion["CREDITO_RECHAZADO"] = "CREDITO_RECHAZADO";
    TipoNotificacion["CUOTA_PROXIMA"] = "CUOTA_PROXIMA";
    TipoNotificacion["CUOTA_VENCIDA"] = "CUOTA_VENCIDA";
    TipoNotificacion["MORA_LEVE"] = "MORA_LEVE";
    TipoNotificacion["MORA_GRAVE"] = "MORA_GRAVE";
    TipoNotificacion["GARANTIA_CONGELADA"] = "GARANTIA_CONGELADA";
    TipoNotificacion["GARANTIA_LIBERADA"] = "GARANTIA_LIBERADA";
    TipoNotificacion["GARANTIA_EJECUTADA"] = "GARANTIA_EJECUTADA";
    TipoNotificacion["UTILIDAD_ACREDITADA"] = "UTILIDAD_ACREDITADA";
    TipoNotificacion["CAMBIO_ETAPA"] = "CAMBIO_ETAPA";
    TipoNotificacion["ALERTA_SISTEMA"] = "ALERTA_SISTEMA";
})(TipoNotificacion || (exports.TipoNotificacion = TipoNotificacion = {}));
var CanalNotificacion;
(function (CanalNotificacion) {
    CanalNotificacion["EMAIL"] = "EMAIL";
    CanalNotificacion["SMS"] = "SMS";
    CanalNotificacion["WHATSAPP"] = "WHATSAPP";
    CanalNotificacion["SISTEMA"] = "SISTEMA";
    CanalNotificacion["PUSH"] = "PUSH";
})(CanalNotificacion || (exports.CanalNotificacion = CanalNotificacion = {}));
var EstadoNotificacion;
(function (EstadoNotificacion) {
    EstadoNotificacion["PENDIENTE"] = "PENDIENTE";
    EstadoNotificacion["ENVIADA"] = "ENVIADA";
    EstadoNotificacion["ENTREGADA"] = "ENTREGADA";
    EstadoNotificacion["FALLIDA"] = "FALLIDA";
    EstadoNotificacion["CANCELADA"] = "CANCELADA";
})(EstadoNotificacion || (exports.EstadoNotificacion = EstadoNotificacion = {}));
// ============================================================================
// CONSTANTES DE REGLAS DE NEGOCIO
// ============================================================================
exports.REGLAS_ETAPAS = [
    {
        etapa: EtapaSocio.INICIANTE,
        multiplicadorMinimo: 1.25,
        multiplicadorMaximo: 2.00,
        creditosParaProgresion: 3,
    },
    {
        etapa: EtapaSocio.REGULAR,
        multiplicadorMinimo: 2.00,
        multiplicadorMaximo: 2.00,
        creditosParaProgresion: 5,
    },
    {
        etapa: EtapaSocio.ESPECIAL,
        multiplicadorMinimo: 3.00,
        multiplicadorMaximo: 3.00,
    },
];
exports.DIAS_MORA = {
    [ClasificacionMora.MORA_LEVE]: { min: 1, max: 15 },
    [ClasificacionMora.MORA_MODERADA]: { min: 16, max: 30 },
    [ClasificacionMora.MORA_GRAVE]: { min: 31, max: 60 },
    [ClasificacionMora.MORA_PERSISTENTE]: { min: 61, max: 89 },
    [ClasificacionMora.CASTIGADO]: { min: 90, max: Infinity },
};
//# sourceMappingURL=index.js.map