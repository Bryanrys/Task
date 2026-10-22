#!/usr/bin/env bash

# ==============================================================================
# Script de Compilación de APK para Linux (Zorin OS)
# Dashboard Académico UEES
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📱 ========================================================"
echo "   Compilando Dashboard Académico UEES (APK Android)"
echo "   Entorno: Linux (Zorin OS)"
echo "=========================================================="

# 1. Asegurar JAVA_HOME si no está exportado
if [ -z "$JAVA_HOME" ]; then
    if [ -d "/usr/lib/jvm/java-21-openjdk-amd64" ]; then
        export JAVA_HOME="/usr/lib/jvm/java-21-openjdk-amd64"
    else
        POSSIBLE_JAVA=$(find /usr/lib/jvm -maxdepth 1 -name "*21*openjdk*" | head -n 1)
        if [ -n "$POSSIBLE_JAVA" ]; then
            export JAVA_HOME="$POSSIBLE_JAVA"
        fi
    fi
fi

if [ -n "$JAVA_HOME" ]; then
    echo "☕ Usando JAVA_HOME: $JAVA_HOME"
fi

# 2. Compilar el frontend web
echo "📦 1/4 Compilando frontend web con Vite..."
npm run build

# 3. Sincronizar assets con Capacitor
echo "🔄 2/4 Sincronizando assets web con Capacitor Android..."
npx cap sync android

# 4. Asegurar permisos de gradlew y compilar
echo "🔨 3/4 Compilando APK nativo con Gradle..."
chmod +x android/gradlew
cd android
./gradlew assembleDebug --no-daemon
cd "$PROJECT_ROOT"

# 5. Copiar APK a la carpeta pública apk/
echo "📁 4/4 Actualizando apk/app-debug.apk..."
mkdir -p apk
cp android/app/build/outputs/apk/debug/app-debug.apk apk/app-debug.apk

APK_SIZE=$(du -h apk/app-debug.apk | cut -f1)

echo "=========================================================="
echo "🎉 ¡Compilación completada exitosamente!"
echo "📍 APK generado en: apk/app-debug.apk ($APK_SIZE)"
echo "=========================================================="
