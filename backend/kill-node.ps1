# Kill all node processes
Write-Host "Deteniendo procesos Node.js..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "Procesos Node.js detenidos" -ForegroundColor Green
