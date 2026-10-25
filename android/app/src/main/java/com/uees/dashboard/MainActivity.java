package com.uees.dashboard;

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

    private void configureWebViewSettings() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.setBackgroundColor(Color.parseColor("#09090b"));

                WebSettings settings = webView.getSettings();

                // Deshabilitar oscurecimiento algorítmico forzado en Android 13+ (API 33+)
                // Evita que WebView invierta o altere colores de textos en tema oscuro
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    settings.setAlgorithmicDarkeningAllowed(false);
                }
                if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
                    WebSettingsCompat.setAlgorithmicDarkeningAllowed(settings, false);
                }

                // Deshabilitar Force Dark para garantizar fidelidad cromática y alto contraste
                if (WebViewFeature.isFeatureSupported(WebViewFeature.FORCE_DARK)) {
                    WebSettingsCompat.setForceDark(settings, WebSettingsCompat.FORCE_DARK_OFF);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
