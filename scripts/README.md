# 🛠️ Scripts de Automatización y Compilación (Multiplataforma)

Esta carpeta contiene scripts optimizados para trabajar de forma transparente tanto en **Linux (Zorin OS / Ubuntu / Debian)** como en **Windows 11**.

---

## 🐧 En Linux (Laptop con Zorin OS)

### 1. Configuración Inicial (Solo la primera vez)
Prepara Java 21, configura la variable `JAVA_HOME` en tu `~/.bashrc` y otorga permisos de ejecución a los ejecutables:

```bash
chmod +x scripts/*.sh
./scripts/setup-linux.sh
```

> **Nota:** Después de ejecutarlo, reinicia la terminal o corre `source ~/.bashrc`.

### 2. Compilar APK con un solo comando
Compila el frontend con Vite, sincroniza con Capacitor, ejecuta Gradle y actualiza automáticamente `apk/app-debug.apk`:

```bash
./scripts/build-apk.sh
```

---

## 🪟 En Windows (PC de Escritorio)

### 1. Compilar APK con PowerShell
Ejecuta el script de compilación para Windows:

```powershell
.\scripts\build-apk.ps1
```

O también usando npm:
```powershell
npm run build:apk
```

---

## 💡 Reglas Importantes de Compatibilidad

* **Nunca agregar `org.gradle.java.home` en `android/gradle.properties`**: Este archivo se comparte en el repositorio Git. Si se define una ruta específica de Linux o Windows allí, provocará fallos de compilación en el otro sistema operativo.
* El nombre de la aplicación en `android/app/src/main/res/values/strings.xml` debe permanecer siempre como `0` para mantener la identidad del APK cruzada entre dispositivos.
