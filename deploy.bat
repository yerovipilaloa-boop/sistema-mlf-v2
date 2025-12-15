@echo off
echo ==============================================
echo  MLF SYSTEM - DEPLOY SCRIPT (WINDOWS)
echo ==============================================

echo 1. Instalando dependencias...
call npm install
cd backend
call npm install
cd ..

echo 2. Generando Cliente Prisma...
cd backend
call npx prisma generate
cd ..

echo 3. Compilando Backend...
cd backend
:: El truco de permisos: a veces tsc falla por permisos en Windows si no se limpia antes
if exist dist rmdir /s /q dist
call npx tsc
cd ..

echo ==============================================
echo  DEPLOY COMPLETO - LISTO PARA EJECUTAR
echo ==============================================
echo Para iniciar servidor de desarrollo:
echo cd backend && npm run dev
pause
