$ErrorActionPreference = 'Stop'

$lanAddress = Get-NetIPAddress -AddressFamily IPv4 |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'vEthernet|WSL|Docker' } |
  Sort-Object InterfaceMetric |
  Select-Object -First 1 -ExpandProperty IPAddress

if (-not $lanAddress) { throw 'No se encontró una dirección IPv4 de red local.' }

$env:EXPO_PUBLIC_API_URL = "http://${lanAddress}:8082/api/v1"
Write-Host "Expo API: $env:EXPO_PUBLIC_API_URL"
Write-Host 'Abre el QR con Expo Go; el teléfono debe estar en la misma Wi-Fi.'
npm.cmd start -- --lan --port 8081 --clear
