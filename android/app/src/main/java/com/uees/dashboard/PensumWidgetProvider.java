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

public class PensumWidgetProvider extends AppWidgetProvider {

    private static final String PREFS_NAME = "TasksWidgetPrefs";
    private static final String KEY_SEMANA = "task_semana";
    private static final String KEY_PENDIENTES = "task_pendientes";
    private static final String KEY_COMPLETADAS = "task_completadas";
    private static final String KEY_TOTAL = "task_total";
    private static final String KEY_MATERIAS = "task_materias";
    private static final String KEY_PORCENTAJE = "task_porcentaje";
    private static final String KEY_PROXIMA = "task_proxima";

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
        int semana = prefs.getInt(KEY_SEMANA, 15);
        int pendientes = prefs.getInt(KEY_PENDIENTES, 1);
        int completadas = prefs.getInt(KEY_COMPLETADAS, 10);
        int materias = prefs.getInt(KEY_MATERIAS, 5);
        int porcentaje = prefs.getInt(KEY_PORCENTAJE, 91);
        String proxima = prefs.getString(KEY_PROXIMA, "BASES DE DATOS • Tarea entregada");

        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_pensum);
        views.setTextViewText(R.id.widget_title, "🎓 TAREAS • SEMANA " + semana);
        views.setTextViewText(R.id.widget_pct_badge, porcentaje + "% entregado");
        views.setTextViewText(R.id.widget_faltantes, String.valueOf(pendientes));

        if (pendientes == 0) {
            views.setTextViewText(R.id.widget_faltantes_label, "¡Todo entregado esta semana!");
            views.setTextViewText(R.id.widget_next_task_header, "🎉 ESTADO DE LA SEMANA:");
            views.setTextViewText(R.id.widget_proxima_tarea, "¡Excelente! No tienes tareas pendientes.");
        } else {
            views.setTextViewText(R.id.widget_faltantes_label, pendientes == 1 ? "tarea pendiente por entregar" : "tareas pendientes por entregar");
            views.setTextViewText(R.id.widget_next_task_header, "📌 PENDIENTE ACTUAL:");
            views.setTextViewText(R.id.widget_proxima_tarea, proxima);
        }

        views.setProgressBar(R.id.widget_progress, 100, Math.max(5, Math.min(100, porcentaje)), false);
        views.setTextViewText(R.id.widget_pendientes_count, String.valueOf(pendientes));
        views.setTextViewText(R.id.widget_completadas_count, String.valueOf(completadas));
        views.setTextViewText(R.id.widget_materias_count, String.valueOf(materias));

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

    public static void saveAndRefreshTasks(Context context, int semana, int pendientes, int completadas, int total, int materias, int porcentaje, String proxima) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit()
                .putInt(KEY_SEMANA, semana)
                .putInt(KEY_PENDIENTES, pendientes)
                .putInt(KEY_COMPLETADAS, completadas)
                .putInt(KEY_TOTAL, total)
                .putInt(KEY_MATERIAS, materias)
                .putInt(KEY_PORCENTAJE, porcentaje)
                .putString(KEY_PROXIMA, proxima)
                .apply();

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        if (manager != null) {
            ComponentName widgetComponent = new ComponentName(context, PensumWidgetProvider.class);
            int[] widgetIds = manager.getAppWidgetIds(widgetComponent);
            if (widgetIds != null && widgetIds.length > 0) {
                for (int id : widgetIds) {
                    updateAppWidget(context, manager, id);
                }
                // Enviar broadcast a Android
                try {
                    Intent updateIntent = new Intent(context, PensumWidgetProvider.class);
                    updateIntent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
                    updateIntent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, widgetIds);
                    context.sendBroadcast(updateIntent);
                } catch (Exception ignored) {}
            }
        }
    }
}
