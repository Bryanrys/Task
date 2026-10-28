package com.uees.dashboard;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;
import android.widget.RemoteViews;

import java.util.Locale;

public class PensumWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "PensumWidgetPrefs";
    private static final String KEY_TOTAL = "pensum_total";
    private static final String KEY_APROBADAS = "pensum_aprobadas";
    private static final String KEY_EN_CURSO = "pensum_en_curso";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        if (appWidgetIds == null) return;
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager appWidgetManager, int appWidgetId, Bundle newOptions) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
        updateAppWidget(context, appWidgetManager, appWidgetId);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent != null ? intent.getAction() : null;
        if (AppWidgetManager.ACTION_APPWIDGET_UPDATE.equals(action) ||
            "android.appwidget.action.APPWIDGET_ENABLED".equals(action)) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            if (manager != null) {
                ComponentName widgetComponent = new ComponentName(context, PensumWidgetProvider.class);
                int[] widgetIds = manager.getAppWidgetIds(widgetComponent);
                if (widgetIds != null) {
                    for (int id : widgetIds) {
                        updateAppWidget(context, manager, id);
                    }
                }
            }
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int total = prefs.getInt(KEY_TOTAL, 45);
        int aprobadas = prefs.getInt(KEY_APROBADAS, 28);
        int enCurso = prefs.getInt(KEY_EN_CURSO, 5);

        if (aprobadas > total) aprobadas = total;
        int faltantes = Math.max(0, total - aprobadas - enCurso);
        int porcentaje = total > 0 ? (int) Math.round(((double) (aprobadas + (enCurso * 0.5)) / total) * 100) : 0;
        porcentaje = Math.min(100, Math.max(0, porcentaje));

        String ciclosRestantes = enCurso > 0 ? String.format(Locale.US, "~%.1f cic", (double) faltantes / enCurso) : "--";

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_pensum);
        views.setTextViewText(R.id.widget_faltantes, String.valueOf(faltantes));
        views.setTextViewText(R.id.widget_faltantes_label, faltantes == 1 ? "materia por cursar" : "materias por cursar");
        views.setTextViewText(R.id.widget_pct_badge, porcentaje + "% completado");
        views.setProgressBar(R.id.widget_progress, 100, Math.max(5, porcentaje), false);
        views.setTextViewText(R.id.widget_aprobadas, String.valueOf(aprobadas));
        views.setTextViewText(R.id.widget_en_curso, String.valueOf(enCurso));
        views.setTextViewText(R.id.widget_ciclos, ciclosRestantes);

        // Click en cualquier parte del widget abre la aplicación
        Intent intent = new Intent(context, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, intent, flags);
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    public static void saveAndRefresh(Context context, int total, int aprobadas, int enCurso) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putInt(KEY_TOTAL, total)
                .putInt(KEY_APROBADAS, aprobadas)
                .putInt(KEY_EN_CURSO, enCurso)
                .apply();

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        if (manager != null) {
            ComponentName widgetComponent = new ComponentName(context, PensumWidgetProvider.class);
            int[] widgetIds = manager.getAppWidgetIds(widgetComponent);
            if (widgetIds != null && widgetIds.length > 0) {
                for (int id : widgetIds) {
                    updateAppWidget(context, manager, id);
                }
                // Enviar broadcast del sistema para sincronizar cualquier launcher
                try {
                    Intent updateIntent = new Intent(context, PensumWidgetProvider.class);
                    updateIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                    updateIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds);
                    context.sendBroadcast(updateIntent);
                } catch (Exception ignored) {}
            }
        }
    }

    public static int[] getSavedData(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int total = prefs.getInt(KEY_TOTAL, 45);
        int aprobadas = prefs.getInt(KEY_APROBADAS, 28);
        int enCurso = prefs.getInt(KEY_EN_CURSO, 5);
        return new int[]{total, aprobadas, enCurso};
    }
}
