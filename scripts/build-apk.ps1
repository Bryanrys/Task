# ==============================================================================
# Script de Compilacion de APK para Windows (PowerShell)
# Dashboard Academico UEES
# ==============================================================================

$ErrorActionPreference = "Stop"

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $ProjectRoot

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "   Compilando Dashboard Academico UEES (APK Android)" -ForegroundColor Cyan
Write-Host "   Entorno: Windows (PowerShell)" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Configurar JAVA_HOME si no existe
if (-not $env:JAVA_HOME -or -not (Test-Path $env:JAVA_HOME)) {
    $PotentialPaths = @(
        "C:\Users\$env:USERNAME\.jdks\jbr-21.0.11",
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files\Java\jdk-21",
        "C:\Program Files\Eclipse Adoptium\jdk-21"
    )
    foreach ($p in $PotentialPaths) {
        if (Test-Path $p) {
            $env:JAVA_HOME = $p
            break
        }
    }
}

if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
    $DefaultSdk = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
    if (Test-Path $DefaultSdk) {
        $env:ANDROID_HOME = $DefaultSdk
    }
}

Write-Host "[1/5] JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Gray
Write-Host "[1/5] ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Gray

# 2. Compilar el frontend web
Write-Host "[2/5] Compilando frontend web con Vite..." -ForegroundColor Yellow
& cmd.exe /c "npm run build"

# 3. Sincronizar assets con Capacitor
Write-Host "[3/5] Sincronizando assets web con Capacitor Android..." -ForegroundColor Yellow
& cmd.exe /c "npx cap sync android"

# 4. Compilar con Gradle
Write-Host "[4/5] Compilando APK nativo con Gradle..." -ForegroundColor Yellow
Set-Location (Join-Path $ProjectRoot "android")
.\gradlew.bat assembleDebug --no-daemon
Set-Location $ProjectRoot

# 5. Copiar APK a la carpeta publica apk/
Write-Host "[5/5] Actualizando apk/app-debug.apk..." -ForegroundColor Yellow
$SourceApk = Join-Path $ProjectRoot "android\app\build\outputs\apk\debug\app-debug.apk"
$DestApk = Join-Path $ProjectRoot "apk\app-debug.apk"

if (Test-Path $SourceApk) {
    Copy-Item $SourceApk $DestApk -Force
    $SizeMB = [math]::Round((Get-Item $DestApk).Length / 1MB, 2)
    Write-Host "==========================================================" -ForegroundColor Green
    Write-Host "Compilacion completada exitosamente!" -ForegroundColor Green
    Write-Host "APK generado en: apk\app-debug.apk ($SizeMB MB)" -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} else {
    Write-Host "Error: No se encontro el archivo APK generado." -ForegroundColor Red
}
