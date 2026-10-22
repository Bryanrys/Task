#!/usr/bin/env bash

# ==============================================================================
# Script de Configuración Inicial para Linux (Zorin OS / Ubuntu / Debian)
# Dashboard Académico UEES
# ==============================================================================

set -e

echo "🚀 Iniciando configuración de entorno en Linux (Zorin OS)..."

# 1. Verificar e instalar Java 21 si no está presente
if ! command -v java &> /dev/null || ! java -version 2>&1 | grep -q "21\."; then
    echo "📦 Java 21 no detectado. Instalando OpenJDK 21..."
    sudo apt update
    sudo apt install -y openjdk-21-jdk
else
    echo "✅ Java 21 ya está instalado en el sistema."
fi

# 2. Detectar ruta de Java 21 en Linux
JAVA_PATH="/usr/lib/jvm/java-21-openjdk-amd64"
if [ ! -d "$JAVA_PATH" ]; then
    # Buscar alternativa si la ruta difiere ligeramente
    POSSIBLE_PATH=$(find /usr/lib/jvm -maxdepth 1 -name "*21*openjdk*" | head -n 1)
    if [ -n "$POSSIBLE_PATH" ]; then
        JAVA_PATH="$POSSIBLE_PATH"
    fi
fi

# 3. Configurar JAVA_HOME en ~/.bashrc si aún no está configurado
if ! grep -q "JAVA_HOME" ~/.bashrc; then
    echo "⚙️ Configurando JAVA_HOME en ~/.bashrc..."
    echo "" >> ~/.bashrc
    echo "# Configuración de Java 21 para Android Gradle" >> ~/.bashrc
    echo "export JAVA_HOME=\"$JAVA_PATH\"" >> ~/.bashrc
    echo "export PATH=\"\$JAVA_HOME/bin:\$PATH\"" >> ~/.bashrc
    echo "✅ JAVA_HOME añadido a ~/.bashrc ($JAVA_PATH)"
else
    echo "✅ JAVA_HOME ya está configurado en ~/.bashrc."
fi

# 4. Asegurar permisos de ejecución en scripts y gradlew
echo "🔑 Asignando permisos de ejecución a los scripts..."
chmod +x android/gradlew 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true

echo "✨ ¡Listo! Entorno preparado con éxito."
echo "👉 Ejecuta 'source ~/.bashrc' o abre una nueva terminal para aplicar los cambios."
