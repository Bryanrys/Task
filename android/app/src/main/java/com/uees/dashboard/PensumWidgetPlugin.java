package com.uees.dashboard;

import android.content.Context;
import android.content.SharedPreferences;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PensumWidget")
public class PensumWidgetPlugin extends Plugin {

    private int extractInt(PluginCall call, String key, int fallback) {
        try {
            JSObject data = call.getData();
            if (data != null && data.has(key)) {
                Object val = data.opt(key);
                if (val instanceof Number) {
                    return ((Number) val).intValue();
                } else if (val instanceof String) {
                    return Integer.parseInt((String) val);
                }
            }
        } catch (Exception ignored) {}
        Integer res = call.getInt(key, fallback);
        return res != null ? res : fallback;
    }

    private String extractString(PluginCall call, String key, String fallback) {
        try {
            JSObject data = call.getData();
            if (data != null && data.has(key)) {
                String val = data.getString(key);
                if (val != null) return val;
            }
        } catch (Exception ignored) {}
        return fallback;
    }

    @PluginMethod
    public void updateTaskWidgetData(PluginCall call) {
        try {
            int semana = extractInt(call, "semana", 15);
            int pendientes = extractInt(call, "pendientes", 1);
            int completadas = extractInt(call, "completadas", 10);
            int total = extractInt(call, "total", 11);
            int materias = extractInt(call, "materias", 5);
            int porcentaje = extractInt(call, "porcentaje", 91);
            String proxima = extractString(call, "proximaTarea", "BASES DE DATOS • Tarea entregada");

            PensumWidgetProvider.saveAndRefreshTasks(getContext(), semana, pendientes, completadas, total, materias, porcentaje, proxima);

            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error actualizando widget de tareas: " + e.getMessage());
        }
    }
}
