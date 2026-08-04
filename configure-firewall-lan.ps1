$ErrorActionPreference = 'Stop'

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  throw 'Abre PowerShell como administrador y vuelve a ejecutar este script.'
}

$rules = @(
  @{ Name = 'HealthyReminder-Expo-LAN-8081'; Port = 8081 },
  @{ Name = 'HealthyReminder-WebAPI-LAN-8082'; Port = 8082 }
)

foreach ($rule in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
  if ($existing) {
    Remove-NetFirewallRule -DisplayName $rule.Name
  }

  New-NetFirewallRule `
    -DisplayName $rule.Name `
    -Description 'HealthyReminder: acceso exclusivo desde la red privada local.' `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $rule.Port `
    -Profile Private `
    -RemoteAddress LocalSubnet | Out-Null
}

Write-Host 'Reglas creadas para los puertos 8081 y 8082, solamente en la red privada local.'
