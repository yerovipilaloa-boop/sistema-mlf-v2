@echo off
:: ============================================================================
:: Script de Inicio Automatico - Sistema MLF
:: ============================================================================

echo.
echo ========================================================================
echo          Sistema MLF - My Libertad Financiera
echo ========================================================================
echo.
echo Iniciando sistema...
echo.

:: Iniciar Backend en nueva ventana
echo [1/3] Iniciando Backend API (Puerto 3000)...
start "MLF Backend" cmd /k "cd /d C:\CLAUDEMLF\backend && npm run dev"

:: Esperar 5 segundos para que el backend inicie
timeout /t 5 /nobreak > nul

:: Iniciar Frontend en nueva ventana
echo [2/3] Iniciando Frontend Web (Puerto 8081)...
start "MLF Frontend" cmd /k "cd /d C:\CLAUDEMLF\frontend && node server.js"

:: Esperar 2 segundos
timeout /t 2 /nobreak > nul

:: Abrir navegador
echo [3/3] Abriendo navegador...
start http://localhost:8081

echo.
echo ========================================================================
echo  Sistema MLF iniciado correctamente
echo ========================================================================
echo.
echo  Backend:  http://localhost:3000
echo  Frontend: http://localhost:8081
echo.
echo  Usuario:  admin
echo  Password: admin123
echo.
echo  IMPORTANTE: NO cierres las ventanas de Backend y Frontend
echo             Usa Ctrl+C en cada ventana para detener los servidores
echo.
echo ========================================================================
echo.

pause
