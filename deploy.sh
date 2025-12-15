#!/bin/bash

echo "=============================================="
echo " MLF SYSTEM - DEPLOY SCRIPT (LINUX/HOSTINGER)"
echo "=============================================="

# Definir rutas relativas
BASE_DIR=$(pwd)
BACKEND_DIR="$BASE_DIR/backend"

echo "1. Instalando dependencias..."
npm install
cd "$BACKEND_DIR"
npm install

echo "2. Generando Cliente Prisma..."
npx prisma generate

echo "3. Compilando Backend..."
# Limpiar dist antiguo
rm -rf dist
# Compilar
npx tsc

echo "=============================================="
echo " DEPLOY COMPLETO"
echo "=============================================="
