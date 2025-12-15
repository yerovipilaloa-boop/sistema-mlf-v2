/**
 * ============================================================================
 * Sistema MLF - Controlador de Dashboard del Socio
 * Archivo: src/controllers/dashboard-socio.controller.ts
 * Descripción: Endpoints para el dashboard personalizado del socio
 * ============================================================================
 */
import { Request, Response } from 'express';
interface AuthRequest extends Request {
    user?: {
        id: number;
        usuario: string;
        rol: string;
    };
}
declare class DashboardSocioController {
    /**
     * GET /api/socios/me/dashboard
     * Obtener dashboard completo del socio autenticado
     */
    obtenerMiDashboard(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /api/socios/me/info
     * Obtener solo información personal del socio
     */
    obtenerMiInfo(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /api/socios/me/creditos
     * Obtener créditos del socio con detalles
     */
    obtenerMisCreditos(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /api/socios/me/ahorros
     * Obtener información de ahorros del socio
     */
    obtenerMisAhorros(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /api/socios/me/historial
     * Obtener historial de movimientos del socio
     */
    obtenerMiHistorial(req: AuthRequest, res: Response): Promise<void>;
    /**
     * GET /api/socios/me/limite-credito
     * Obtener información sobre el límite de crédito disponible del socio
     */
    obtenerMiLimiteCredito(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /api/socios/me/solicitar-credito
     * Solicitar un nuevo crédito (el socio solicita para sí mismo)
     */
    solicitarMiCredito(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /api/socios/me/solicitar-deposito
     * Solicitar un depósito de ahorro (genera solicitud pendiente de aprobación)
     */
    solicitarDeposito(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /api/socios/me/solicitar-retiro
     * Solicitar un retiro de ahorro (genera solicitud pendiente de aprobación)
     */
    solicitarRetiro(req: AuthRequest, res: Response): Promise<void>;
    /**
     * POST /api/socios/me/solicitar-pago
     * Reportar un pago de cuota
     */
    solicitarPago(req: AuthRequest, res: Response): Promise<void>;
}
declare const _default: DashboardSocioController;
export default _default;
//# sourceMappingURL=dashboard-socio.controller.d.ts.map