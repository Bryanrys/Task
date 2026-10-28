package com.uees.dashboard;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PensumWidget")
public class PensumWidgetPlugin extends Plugin {

    @PluginMethod
    public void getPensumData(PluginCall call) {
        try {
            int[] data = PensumWidgetProvider.getSavedData(getContext());
            JSObject ret = new JSObject();
            ret.put("total", data[0]);
            ret.put("aprobadas", data[1]);
            ret.put("enCurso", data[2]);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error obteniendo datos del widget: " + e.getMessage());
        }
    }

    @PluginMethod
    public void updatePensumData(PluginCall call) {
        try {
            int total = call.getInt("total", 45);
            int aprobadas = call.getInt("aprobadas", 28);
            int enCurso = call.getInt("enCurso", 5);

            PensumWidgetProvider.saveAndRefresh(getContext(), total, aprobadas, enCurso);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("total", total);
            ret.put("aprobadas", aprobadas);
            ret.put("enCurso", enCurso);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error actualizando widget: " + e.getMessage());
        }
    }
}
