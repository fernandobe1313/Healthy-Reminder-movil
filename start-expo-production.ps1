$ErrorActionPreference = 'Stop'

$env:EXPO_PUBLIC_API_URL = 'https://api.healthyreminderdental.com/api/v1'

Write-Host "Expo API (dominio propio -> Render): $env:EXPO_PUBLIC_API_URL"
Write-Host 'La web desplegada y la app movil utilizaran el mismo backend de produccion.'
Write-Host 'Abre el QR con Expo Go. El telefono y la computadora deben estar en la misma Wi-Fi.'
Write-Host 'IMPORTANTE: conserva esta terminal abierta mientras uses la aplicacion.'

npm.cmd start -- --lan --port 8081 --clear
