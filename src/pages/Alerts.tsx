import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

const alertTypeLabels: Record<string, string> = {
  accidente: "Accidente",
  familiar: "Problema familiar",
  salud: "Problema de salud",
  oracion: "Solicitud de oración",
  viaje: "Viaje",
  otro: "Otro",
};

const Alerts = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => { fetchAlerts(); }, [filterStatus]);

  const fetchAlerts = async () => {
    let query = supabase
      .from("alerts")
      .select("*, members(full_name)")
      .order("created_at", { ascending: false });

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data } = await query;
    setAlerts(data ?? []);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: any = { status };
    if (status === "resuelta") updates.resolved_at = new Date().toISOString();

    const { error } = await supabase.from("alerts").update(updates).eq("id", id);
    if (error) {
      toast.error("Error al actualizar.");
    } else {
      toast.success("Alerta actualizada.");
      fetchAlerts();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendiente":
        return <Badge variant="outline" className="border-warning text-warning"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      case "en_proceso":
        return <Badge variant="outline" className="border-info text-info"><AlertTriangle className="h-3 w-3 mr-1" />En Proceso</Badge>;
      case "resuelta":
        return <Badge variant="outline" className="border-success text-success"><CheckCircle className="h-3 w-3 mr-1" />Resuelta</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alertas y Solicitudes</h1>
          <p className="text-muted-foreground">Seguimiento de situaciones reportadas</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="en_proceso">En Proceso</SelectItem>
            <SelectItem value="resuelta">Resueltas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {alerts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No hay alertas registradas.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{alert.members?.full_name}</span>
                      {getStatusBadge(alert.status)}
                    </div>
                    <p className="text-sm font-medium text-accent">
                      {alertTypeLabels[alert.alert_type] || alert.alert_type}
                    </p>
                    {alert.description && (
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(alert.created_at), "PPP 'a las' HH:mm", { locale: es })}
                      {alert.resolved_at && (
                        <> · Resuelta el {format(new Date(alert.resolved_at), "PPP", { locale: es })}</>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {alert.status === "pendiente" && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(alert.id, "en_proceso")}>
                        En Proceso
                      </Button>
                    )}
                    {alert.status !== "resuelta" && (
                      <Button size="sm" onClick={() => updateStatus(alert.id, "resuelta")}>
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
