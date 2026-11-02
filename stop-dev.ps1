<#
.SYNOPSIS
  start-dev.ps1 ile başlatılan OTS geliştirme ortamını durdurur: API ve Expo (isteğe bağlı PostgreSQL).

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\stop-dev.ps1           # API ve Expo'yu durdurur
  powershell -ExecutionPolicy Bypass -File .\stop-dev.ps1 -StopDb   # PostgreSQL'i de durdurur
  powershell -ExecutionPolicy Bypass -File .\stop-dev.ps1 -WhatIf   # Hiçbir şeyi durdurmadan ne yapılacağını gösterir
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [switch]$StopDb
)

$ErrorActionPreference = 'Stop'

# CIM modülü yüklenirken kendi alias'larını tanımlar; -WhatIf ile çalışınca bunlar gereksiz çıktı üretmesin.
$whatIf = $WhatIfPreference
$WhatIfPreference = $false
Import-Module CimCmdlets
$WhatIfPreference = $whatIf

$pgBin  = 'C:\laragon\bin\postgresql\postgresql-16\bin'
$pgData = 'C:\laragon\data\postgresql-16'

# start-dev.ps1'in açtığı pencereler, dinledikleri portlar ve beklenen işlem adları.
$services = @(
    @{ Name = 'API';  Title = 'OTS API';  Port = 5069; Processes = @('dotnet', 'OtsApi') },
    @{ Name = 'Expo'; Title = 'OTS Expo'; Port = 8081; Processes = @('node') }
)

# Pencereye kadar yukarı çıkarken geçilebilecek ara işlemler (npx -> node, dotnet run -> OtsApi).
$launchers = @('node', 'dotnet', 'OtsApi', 'cmd', 'conhost')
$shells    = @('powershell', 'pwsh')

function Write-Step($text) { Write-Host "`n==> $text" -ForegroundColor Cyan }
function Write-Ok($text)   { Write-Host "    $text" -ForegroundColor Green }
function Write-Warn($text) { Write-Host "    $text" -ForegroundColor Yellow }

# Portu dinleyen işlem kimlikleri (IPv4 ve IPv6). netstat kullanılır; ek modül gerekmez.
function Get-ListenerPids($port) {
    netstat -ano | ForEach-Object {
        $cols = -split $_
        if ($cols.Count -ge 5 -and $cols[0] -eq 'TCP' -and $cols[3] -eq 'LISTENING' -and $cols[1] -match ":$port$") { [int]$cols[4] }
    } | Select-Object -Unique
}

# İşlemden yukarı doğru çıkıp onu başlatan PowerShell penceresini bulur; bulamazsa işlemin kendisini döner.
function Get-OwnerWindow($processId) {
    $current = Get-CimInstance Win32_Process -Filter "ProcessId = $processId"
    while ($current) {
        $parent = Get-CimInstance Win32_Process -Filter "ProcessId = $($current.ParentProcessId)"
        if (-not $parent) { break }
        $name = [IO.Path]::GetFileNameWithoutExtension($parent.Name)
        if ($shells -contains $name) { return [int]$parent.ProcessId }
        if ($launchers -notcontains $name) { break }
        $current = $parent
    }
    return $processId
}

# İşlemi alt işlemleriyle birlikte kapatır (pencere -> npx -> node / dotnet -> OtsApi).
function Stop-Tree($processId, $label) {
    if ($PSCmdlet.ShouldProcess("$label (PID $processId)", 'Durdur')) {
        & taskkill.exe /PID $processId /T /F 2>&1 | Out-Null
        Write-Ok "$label durduruldu (PID $processId)."
    }
}

foreach ($svc in $services) {
    Write-Step "$($svc.Name) durduruluyor"
    $targets = @{}

    # 1) start-dev.ps1'in açtığı pencere, başlığı hâlâ duruyorsa
    Get-Process $shells -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -eq $svc.Title } |
        ForEach-Object { $targets[$_.Id] = "'$($svc.Title)' penceresi" }

    # 2) Portu dinleyen işlem -> ait olduğu pencere (yalnızca beklenen işlem adlarıysa)
    foreach ($procId in Get-ListenerPids $svc.Port) {
        $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
        if (-not $proc) { continue }
        if ($svc.Processes -notcontains $proc.ProcessName) {
            Write-Warn "$($svc.Port) portunu '$($proc.ProcessName)' (PID $procId) kullanıyor; OTS'ye ait görünmediği için dokunulmadı."
            continue
        }
        $owner = Get-OwnerWindow $procId
        if (-not $targets.ContainsKey($owner)) {
            $targets[$owner] = if ($owner -eq $procId) { "$($proc.ProcessName) ($($svc.Port) portu)" } else { "$($svc.Name) penceresi" }
        }
    }

    if ($targets.Count -eq 0) { Write-Ok "$($svc.Name) zaten çalışmıyor."; continue }
    foreach ($id in $targets.Keys) { Stop-Tree $id $targets[$id] }
}

# 3) PostgreSQL (yalnızca -StopDb ile; normalde Laragon yönetir)
Write-Step 'PostgreSQL'
if (-not $StopDb) {
    Write-Ok "Çalışır bırakıldı (durdurmak için -StopDb veya Laragon'da 'Stop')."
} elseif (-not (Test-Path (Join-Path $pgBin 'pg_ctl.exe'))) {
    Write-Warn "pg_ctl bulunamadı ($pgBin); PostgreSQL'i Laragon'dan durdurun."
} elseif ($PSCmdlet.ShouldProcess("PostgreSQL ($pgData)", 'Durdur')) {
    & (Join-Path $pgBin 'pg_ctl.exe') stop -D $pgData -m fast 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Ok 'PostgreSQL durduruldu.' }
    else { Write-Warn 'PostgreSQL zaten kapalı ya da durdurulamadı.' }
}

Write-Host ''
Write-Host 'Bitti. Yeniden başlatmak için: powershell -ExecutionPolicy Bypass -File .\start-dev.ps1' -ForegroundColor Green
