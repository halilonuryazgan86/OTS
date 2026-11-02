<#
.SYNOPSIS
  OTS geliştirme ortamını başlatır: PostgreSQL, API (ağa açık) ve Expo (Expo Go ile telefonda test için).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\start-dev.ps1
  powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Clear     # Expo önbelleğini temizleyerek başlatır
  powershell -ExecutionPolicy Bypass -File .\start-dev.ps1 -Tunnel    # QR kod aynı ağda çalışmazsa
#>
param(
    [switch]$Clear,
    [switch]$Tunnel
)

$ErrorActionPreference = 'Stop'

$root      = $PSScriptRoot
$apiDir    = Join-Path $root 'backend\OtsApi'
$mobileDir = Join-Path $root 'mobile'
$envFile   = Join-Path $mobileDir '.env'
$apiPort   = 5069

$laragon = 'C:\laragon'
$pgBin   = Join-Path $laragon 'bin\postgresql\postgresql-16\bin'
$pgData  = Join-Path $laragon 'data\postgresql-16'

function Write-Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Write-Ok($text)   { Write-Host "    $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "    $text" -ForegroundColor Yellow }

function Test-Port($port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect('127.0.0.1', $port, $null, $null)
        return $async.AsyncWaitHandle.WaitOne(500) -and $client.Connected
    } catch { return $false } finally { $client.Close() }
}

# 1) PostgreSQL ---------------------------------------------------------------
Write-Step 'PostgreSQL kontrol ediliyor'
if (Test-Port 5432) {
    Write-Ok 'PostgreSQL çalışıyor (5432).'
} elseif (Test-Path (Join-Path $pgBin 'pg_ctl.exe')) {
    Write-Warn 'PostgreSQL kapalı, başlatılıyor...'
    Start-Process -FilePath (Join-Path $pgBin 'pg_ctl.exe') `
        -ArgumentList 'start', '-D', "`"$pgData`"", '-l', "`"$(Join-Path $pgData 'postgresql.log')`"", '-w' `
        -WindowStyle Hidden -Wait
    if (-not (Test-Port 5432)) { throw "PostgreSQL başlatılamadı. Laragon'u açıp 'Start All' deneyin." }
    Write-Ok 'PostgreSQL başlatıldı.'
} else {
    throw "PostgreSQL bulunamadı ($pgBin). Laragon'u açıp 'Start All' deneyin."
}

# 2) IP adresi ve mobile\.env -------------------------------------------------
Write-Step 'Bilgisayarın ağ adresi bulunuyor'
$route = Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue |
    Sort-Object RouteMetric, InterfaceMetric | Select-Object -First 1
if (-not $route) { throw 'Ağ bağlantısı bulunamadı. Wi-Fi bağlantınızı kontrol edin.' }
$ip = (Get-NetIPAddress -InterfaceIndex $route.InterfaceIndex -AddressFamily IPv4 |
    Where-Object { $_.IPAddress -notlike '169.254*' } | Select-Object -First 1).IPAddress
Write-Ok "IP adresi: $ip"

$apiUrl  = "http://${ip}:$apiPort"
$envLine = "EXPO_PUBLIC_API_URL=$apiUrl"
$current = if (Test-Path $envFile) { (Get-Content $envFile -Raw).Trim() } else { '' }
if ($current -ne $envLine) {
    # Expo .env'i derleme sırasında okur; adres değiştiyse önbellek temizlenmeli.
    [System.IO.File]::WriteAllText($envFile, "$envLine`n", (New-Object System.Text.UTF8Encoding $false))
    Write-Warn "mobile\.env güncellendi: $apiUrl (Expo önbelleği temizlenerek başlatılacak)"
    $Clear = $true
} else {
    Write-Ok 'mobile\.env güncel.'
}

$netProfile = Get-NetConnectionProfile -InterfaceIndex $route.InterfaceIndex -ErrorAction SilentlyContinue
if ($netProfile -and $netProfile.NetworkCategory -eq 'Public') {
    Write-Warn "Ağ 'Ortak (Public)' görünüyor; Windows Güvenlik Duvarı telefonun bağlantısını engelleyebilir."
    Write-Warn "Ayarlar > Ağ ve İnternet > Wi-Fi > ağınız > 'Özel ağ' seçin veya izin penceresinde 'İzin ver'e basın."
}

# 3) Node.js ------------------------------------------------------------------
Write-Step 'Node.js kontrol ediliyor'
$nodeDir = $null
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    $nodeDir = Get-ChildItem (Join-Path $laragon 'bin\nodejs') -Directory -Filter 'node-v*' -ErrorAction SilentlyContinue |
        Sort-Object Name -Descending | Select-Object -First 1 -ExpandProperty FullName
    if (-not $nodeDir) { throw 'Node.js bulunamadı. Node.js kurun veya Laragon içindeki Node.js''i kullanın.' }
    $env:Path = "$nodeDir;$env:Path"
}
Write-Ok "Node.js $(node --version)"

if (-not (Test-Path (Join-Path $mobileDir 'node_modules'))) {
    Write-Warn 'node_modules yok, paketler kuruluyor (npm ci)...'
    Push-Location $mobileDir
    try { npm ci --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { throw 'npm ci başarısız oldu.' } } finally { Pop-Location }
}

# 4) API ve Expo'yu ayrı pencerelerde başlat -----------------------------------
Write-Step 'API başlatılıyor (yeni pencere)'
if (Test-Port $apiPort) {
    Write-Warn "$apiPort portu zaten kullanımda; API zaten çalışıyor olabilir, yeni pencere açılmadı."
} else {
    Start-Process powershell -WorkingDirectory $apiDir -ArgumentList '-NoExit', '-Command',
        "`$Host.UI.RawUI.WindowTitle = 'OTS API'; dotnet run --launch-profile lan"
    Write-Ok "API: $apiUrl"
}

Write-Step 'Expo başlatılıyor (yeni pencere)'
$expoArgs = @('expo', 'start', $(if ($Tunnel) { '--tunnel' } else { '--lan' }))
if ($Clear) { $expoArgs += '--clear' }
$pathPrefix = if ($nodeDir) { "`$env:Path = '$nodeDir;' + `$env:Path; " } else { '' }
Start-Process powershell -WorkingDirectory $mobileDir -ArgumentList '-NoExit', '-Command',
    "$pathPrefix`$Host.UI.RawUI.WindowTitle = 'OTS Expo'; npx $($expoArgs -join ' ')"

Write-Host ''
Write-Host 'Hazır! Telefonda Expo Go ile:' -ForegroundColor Green
Write-Host '  - Expo penceresindeki QR kodu okutun, ya da'
Write-Host "  - 'Enter URL manually' ile: exp://${ip}:8081"
Write-Host "  - Demo öğretmen: ogretmen@ots.local / Ogretmen123!"
Write-Host "  - API kontrolü (telefon tarayıcısı): $apiUrl/api/auth/me  (401 görmek normaldir)"
Write-Host 'Durdurmak için açılan iki pencerede Ctrl+C.'
