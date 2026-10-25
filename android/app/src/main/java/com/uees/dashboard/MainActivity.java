package com.uees.dashboard;

import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.webkit.WebSettingsCompat;
import androidx.webkit.WebViewFeature;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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

    private void notifyThemeChange(Configuration config) {
        try {
            if (getBridge() != null && getBridge().getWebView() != null && config != null) {
                int currentNightMode = config.uiMode & Configuration.UI_MODE_NIGHT_MASK;
                final boolean isNight = (currentNightMode == Configuration.UI_MODE_NIGHT_YES);
                final WebView webView = getBridge().getWebView();
                
                webView.post(() -> {
                    try {
                        // Actualizar fondo de WebView dinámicamente según el tema para evitar destellos
                        webView.setBackgroundColor(isNight ? Color.parseColor("#09090b") : Color.parseColor("#f4f4f2"));
                        
                        // Notificar a la capa web en tiempo real
                        String js = "window.dispatchEvent(new CustomEvent('androidThemeChange', { detail: { isDark: " + isNight + " } }));";
                        webView.evaluateJavascript(js, null);
                    } catch (Exception ignored) {}
                });
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
                // Evita que WebView invierta o altere colores de textos en tema oscuro
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    settings.setAlgorithmicDarkeningAllowed(false);
                }
                if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                    WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false);
                }

                // Habilitar FORCE_DARK_AUTO para que Chromium WebView detecte y propague prefers-color-scheme
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
