# 🎓 Dashboard Académico UEES

[![Android APK](https://img.shields.io/badge/Descargar-APK%20Android-FF2D55?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Bryanrys/Task/raw/main/apk/app-debug.apk)
[![GitHub Release](https://img.shields.io/github/v/release/Bryanrys/Task?style=for-the-badge&color=8B5CF6&label=Releases)](https://github.com/Bryanrys/Task/releases)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-8.5-119EFF?style=for-the-badge&logo=capacitor&logoColor=white)](https://capacitorjs.com/)

Plataforma integral y moderna de organización académica universitaria (Ciclo II / 2026) con diseño Cyber-Cosmic AMOLED, cálculo dinámico de promedios, control de entregas por parciales, enlaces directos a Teams/aulas virtuales y recordatorios flotantes nativos para Android.

---

## 📱 Apartado APK (Descarga para Android)

<div align="center">

| 🏷️ Versión | 📦 Tamaño | 📱 Requerimientos | 📅 Día y Fecha | 🕒 Hora (GMT-6) |
| :---: | :---: | :---: | :---: | :---: |
| **v2.2 (Debug)** | **8.8 MB** | **Android 7.0 - Android 14+** | **Martes, 27 de Octubre de 2026** | **09:55 PM** |

[![Descargar APK Directo](https://img.shields.io/badge/Descargar-APK%20Directo%20(8.8%20MB)-000000?style=for-the-badge&logo=android&logoColor=white)](https://github.com/Bryanrys/Task/raw/main/apk/app-debug.apk)

</div>

Puedes descargar e instalar la versión para Android directamente en tu teléfono móvil desde cualquiera de los siguientes enlaces:

### 📥 Enlaces de Descarga:
- 🚀 **[Descarga Directa del APK (`app-debug.apk`)](https://github.com/Bryanrys/Task/raw/main/apk/app-debug.apk)** *(Compilado el 27 de Octubre de 2026 a las 09:55 PM • 8.8 MB • Widget Nativo Android de Pensum, Huella Dactilar y Háptica)*
- 📂 **[Ver carpeta de APK en el Repositorio (con ficha técnica y detalles)](./apk)**
- 📦 **[Ver todas las versiones y Releases en GitHub](https://github.com/Bryanrys/Task/releases)**

### 📲 Pasos para Instalar en Android:
1. **Descargar el archivo**: Pulsa en el botón o enlace de descarga arriba desde tu dispositivo Android.
2. **Permisos de instalación**: Si Android o Chrome muestra el aviso *"Archivo potencialmente dañino"* o *"Instalar apps desconocidas"*, presiona **Descargar de todos modos** y concede permiso a tu navegador.
3. **Instalación**: Abre el archivo `.apk` descargado y pulsa **Instalar**.
4. **Permisos de notificaciones**: Al abrir la app por primera vez, acepta los permisos de notificaciones para recibir alertas y alarmas periódicas de tus tareas pendientes.

---

## 📌 Regla de Identidad del APK (Multi-dispositivo PC / Laptop)

> [!IMPORTANT]
> **Nombre de la Aplicación en Android:** El nombre interno de la aplicación (`app_name` y `title_activity_main` en `android/app/src/main/res/values/strings.xml`) **debe mantenerse estrictamente como `0`**.
>
> **Motivo técnico:**
> - El archivo descargable se compila y distribuye bajo el nombre de archivo `app-debug.apk`.
> - Al pulsar e instalar el archivo en el teléfono, Android lee el manifiesto interno y registra la app con su nombre oficial: **`0`**.
> - Mantener este nombre idéntico garantiza la compatibilidad de actualización directa entre la PC de escritorio y la laptop sin que Android bloquee la instalación con el error *"No se instaló la app"*.

---

## ✨ Características Principales

- **Gestión de Entregas y Semanas**: Organización semanal del semestre (semanas 1 a 20) con soporte automático para semanas de evaluaciones parciales (semanas 6, 12 y 18).
- **Horario de Clases Interactivo**: Agenda semanal completa (Lunes a Sábado) con detección inteligente de enlaces a Teams, Meet y aulas presenciales.
- **Calculadora y Simulador de Notas**: Registro de calificaciones parciales (P1, P2 y P3) con ponderaciones personalizadas y cálculo automático de nota mínima restante para aprobar.
- **Temporizador Pomodoro de Estudio**: Módulos de estudio (25 min) y pausas activas (5 min) con timbre sonoro.
- **Sincronización en la Nube (Supabase)**: Respaldo y restauración centralizada de datos (materias, notas, enlaces, horario y tareas).
- **Notificaciones Flotantes Nativas**: Alertas estilo heads-up banner en Android mediante `@capacitor/local-notifications`.

---

## 🛠️ Tecnologías y Entorno

- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion (Framer Motion), Lucide Icons.
- **Móvil Nativo**: Capacitor 8.5 (Android SDK, Java 21).
- **Persistencia y Nube**: Supabase (PostgreSQL), LocalStorage con sincronización por eventos.
- **Automatización**: GitHub Actions para compilación y publicación continua del APK.

---

## 💻 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción (Web)
npm run build

# 4. Sincronizar y compilar APK para Android
npx cap sync android
cd android && ./gradlew assembleDebug
```
