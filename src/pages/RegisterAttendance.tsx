import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, CheckCircle, Fingerprint } from "lucide-react";
import { toast } from "sonner";

const serviceTypes = [
  "Servicio Dominical",
  "Estudio Bíblico",
  "Reunión de Oración",
  "Servicio de Jóvenes",
  "Célula",
  "Evento Especial",
];

const alertTypes = [
  { value: "accidente", label: "Tuve un accidente" },
  { value: "familiar", label: "Problema familiar" },
  { value: "salud", label: "Problema de salud" },
  { value: "oracion", label: "Necesito oración" },
  { value: "viaje", label: "Estoy de viaje" },
  { value: "otro", label: "Otro motivo" },
];

const RegisterAttendance = () => {
  const { user } = useAuth();
  const [fingerprintId, setFingerprintId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [serviceType, setServiceType] = useState("Servicio Dominical");
  const [hasAlert, setHasAlert] = useState(false);
  const [alertType, setAlertType] = useState("");
  const [alertDescription, setAlertDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);

  const lookupMember = async () => {
    if (!fingerprintId.trim()) return;
    const { data, error } = await supabase
      .from("members")
      .select("id, full_name")
      .eq("fingerprint_id", fingerprintId.trim())
      .maybeSingle();

    if (error || !data) {
      setMemberName(null);
      setMemberId(null);
      toast.error("Miembro no encontrado. Verifica el ID.");
    } else {
      setMemberName(data.full_name);
      setMemberId(data.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId) {
      toast.error("Primero busca un miembro válido.");
      return;
    }
    setLoading(true);

    const { error: attError } = await supabase.from("attendance").insert({
      member_id: memberId,
      attendance_date: format(date, "yyyy-MM-dd"),
      service_type: serviceType,
      registered_by: user?.id,
    });

    if (attError) {
      if (attError.code === "23505") {
        toast.error("Este miembro ya tiene asistencia registrada para este servicio y fecha.");
      } else {
        toast.error("Error al registrar asistencia.");
      }
      setLoading(false);
      return;
    }

    if (hasAlert && alertType) {
      await supabase.from("alerts").insert({
        member_id: memberId,
        alert_type: alertType,
        description: alertDescription || null,
      });
    }

    toast.success(`Asistencia registrada para ${memberName}`);
    setFingerprintId("");
    setMemberName(null);
    setMemberId(null);
    setHasAlert(false);
    setAlertType("");
    setAlertDescription("");
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Registrar Asistencia</h1>
        <p className="text-muted-foreground">Registra la asistencia de un miembro al servicio</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fingerprint className="h-5 w-5 text-accent" />
            Identificación del Miembro
          </CardTitle>
          <CardDescription>Ingresa el ID del miembro (huella dactilar)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="ID de huella dactilar"
                  value={fingerprintId}
                  onChange={(e) => { setFingerprintId(e.target.value); setMemberName(null); setMemberId(null); }}
                />
              </div>
              <Button type="button" variant="secondary" onClick={lookupMember}>
                Buscar
              </Button>
            </div>

            {memberName && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-success/10 border border-success/20">
                <CheckCircle className="h-4 w-4 text-success" />
                <span className="font-medium">{memberName}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(date, "PPP", { locale: es })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(d) => d && setDate(d)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Servicio</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  id="hasAlert"
                  checked={hasAlert}
                  onChange={(e) => setHasAlert(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="hasAlert" className="cursor-pointer">
                  Agregar una alerta o solicitud
                </Label>
              </div>

              {hasAlert && (
                <div className="space-y-3 pl-7">
                  <Select value={alertType} onValueChange={setAlertType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de alerta" />
                    </SelectTrigger>
                    <SelectContent>
                      {alertTypes.map((a) => (
                        <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Textarea
                    placeholder="Describe la situación (opcional)"
                    value={alertDescription}
                    onChange={(e) => setAlertDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading || !memberId}>
              {loading ? "Registrando..." : "Registrar Asistencia"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterAttendance;
