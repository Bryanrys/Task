package com.uees.dashboard;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PensumWidgetPlugin.class);
        super.onCreate(savedInstanceState);
        setupEdgeToEdgeDisplay();
        configureWebViewSettings();
    }

    @Override
    public void onStart() {
        super.onStart();
        configureWebViewSettings();
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getResources() != null && getResources().getConfiguration() != null) {
            notifyThemeChange(getResources().getConfiguration());
        }
    }

    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        notifyThemeChange(newConfig);
    }

    /**
     * Configura el modo Edge-to-Edge puro idéntico a apps modernas (como Niu):
     * - El contenido fluye detrás de la barra de estado y la barra de navegación.
     * - La muesca (notch / display cutout) no corta la pantalla; el fondo se extiende completo.
     * - La barra de estado es 100% transparente.
     */
    private void setupEdgeToEdgeDisplay() {
        try {
            Window window = getWindow();
            if (window == null) return;

            // 1. Edge-to-Edge: Flujo de contenido completo de borde a borde
            WindowCompat.setDecorFitsSystemWindows(window, false);

            // 2. Extender detrás de la cámara frontal / muesca (Display Cutout) en Android 9+ (API 28+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                WindowManager.LayoutParams lp = window.getAttributes();
                lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                window.setAttributes(lp);
            }

            // 3. Barra de estado y barra de navegación 100% transparentes
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS | WindowManager.LayoutParams.FLAG_TRANSLUCENT_NAVIGATION);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.TRANSPARENT);
            window.setNavigationBarColor(Color.TRANSPARENT);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void notifyThemeChange(Configuration config) {
        try {
            Window window = getWindow();
            if (window != null && config != null) {
                int currentNightMode = config.uiMode & Configuration.UI_MODE_NIGHT_MASK;
                final boolean isNight = (currentNightMode == Configuration.UI_MODE_NIGHT_YES);

                // Ajustar iconos de barra de estado: blancos en modo oscuro, negros en modo claro
                WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, window.getDecorView());
                if (controller != null) {
                    controller.setAppearanceLightStatusBars(!isNight);
                    controller.setAppearanceLightNavigationBars(!isNight);
                }

                if (getBridge() != null && getBridge().getWebView() != null) {
                    final WebView webView = getBridge().getWebView();
                    webView.post(() -> {
                        try {
                            webView.setBackgroundColor(isNight ? Color.parseColor("#09090b") : Color.parseColor("#f4f4f2"));
                            String js = "window.dispatchEvent(new CustomEvent('androidThemeChange', { detail: { isDark: " + isNight + " } }));";
                            webView.evaluateJavascript(js, null);
                        } catch (Exception ignored) {}
                    });
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void configureWebViewSettings() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                Configuration config = getResources() != null ? getResources().getConfiguration() : null;
                boolean isNight = config != null && (config.uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
                webView.setBackgroundColor(isNight ? Color.parseColor("#09090b") : Color.parseColor("#f4f4f2"));

                WebSettings settings = webView.getSettings();

                // Deshabilitar oscurecimiento algorítmico forzado en Android 13+ (API 33+)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    settings.setAlgorithmicDarkeningAllowed(false);
                }
                if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                    WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false);
                }

                // Habilitar FORCE_DARK_AUTO para propagación nativa de prefers-color-scheme
                if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                    WebSettingsCompat.setForceDark(settings, WebSettingsCompat.FORCE_DARK_AUTO);
                }

                notifyThemeChange(config);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
