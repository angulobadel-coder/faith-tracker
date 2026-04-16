import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, CheckCircle, AlertCircle, Loader2, Copy, Cloud } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  full_name: string;
  fingerprint_id: string | null;
}

const ESP32_API_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/esp32-api`;

const FingerprintEnroll = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState("");
  const [apiHealthy, setApiHealthy] = useState<boolean | null>(null);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("members")
      .select("id, full_name, fingerprint_id")
      .eq("active", true)
      .order("full_name");
    if (data) setMembers(data);
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  // Check API health on mount
  useEffect(() => {
    fetch(`${ESP32_API_URL}/status`)
      .then((r) => setApiHealthy(r.ok))
      .catch(() => setApiHealthy(false));
  }, []);

  const handleEnroll = async () => {
    if (!selectedMemberId) return;
    setEnrolling(true);
    setEnrollStatus("Obteniendo siguiente slot disponible...");

    try {
      // Get next slot
      const slotRes = await fetch(`${ESP32_API_URL}/next-slot`);
      const slotData = await slotRes.json();
      const nextSlot = slotData.next_slot;

      setEnrollStatus(`Asignando slot #${nextSlot}. Usa este número en el ESP32 para enrollar la huella.`);

      // Assign slot to member in DB via edge function
      const enrollRes = await fetch(`${ESP32_API_URL}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: String(nextSlot), member_id: selectedMemberId }),
      });

      const result = await enrollRes.json();

      if (result.success) {
        toast.success(`Slot #${nextSlot} asignado correctamente`);
        setEnrollStatus(`✅ Slot #${nextSlot} asignado. Ahora enrolla la huella en el ESP32 con ese slot.`);
        fetchMembers();
        setSelectedMemberId("");
      } else {
        toast.error(result.error || "Error al asignar slot");
        setEnrollStatus(`❌ ${result.error || "Error"}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Error de conexión");
      setEnrollStatus(`❌ ${err.message}`);
    }
    setEnrolling(false);
  };

  const copyUrl = (path: string) => {
    navigator.clipboard.writeText(`${ESP32_API_URL}${path}`);
    toast.success("URL copiada al portapapeles");
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Registro de Huellas</h1>
        <p className="text-muted-foreground">El ESP32 se comunica directamente con la nube — sin depender del navegador</p>
      </div>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cloud className="h-5 w-5 text-primary" />
            API en la Nube
          </CardTitle>
          <CardDescription>
            El ESP32 envía datos directamente a estos endpoints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`flex items-center gap-2 p-3 rounded-md border ${
            apiHealthy === true
              ? "bg-green-500/10 border-green-500/20"
              : apiHealthy === false
              ? "bg-destructive/10 border-destructive/20"
              : "bg-muted border-border"
          }`}>
            {apiHealthy === true ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">API funcionando correctamente</span>
                <Badge variant="outline" className="ml-auto text-green-600 border-green-500/30">Online</Badge>
              </>
            ) : apiHealthy === false ? (
              <>
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Error conectando a la API</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">Verificando...</span>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">URLs para el ESP32</Label>
            {[
              { label: "Registrar asistencia", path: "/attendance", method: "POST" },
              { label: "Estado", path: "/status", method: "GET" },
              { label: "Siguiente slot", path: "/next-slot", method: "GET" },
              { label: "Miembros con huella", path: "/members", method: "GET" },
            ].map((ep) => (
              <div key={ep.path} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                <Badge variant="outline" className="text-xs font-mono shrink-0">{ep.method}</Badge>
                <code className="text-xs flex-1 truncate">{ESP32_API_URL}{ep.path}</code>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => copyUrl(ep.path)}>
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm space-y-1">
            <p className="font-medium">📡 Para registrar asistencia desde el ESP32:</p>
            <code className="block text-xs bg-background p-2 rounded">
              POST {ESP32_API_URL}/attendance<br />
              Content-Type: application/json<br />
              {`{"fingerprint_id": "6"}`}
            </code>
          </div>
        </CardContent>
      </Card>

      {/* Enroll Fingerprint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fingerprint className="h-5 w-5 text-accent" />
            Asignar Slot de Huella
          </CardTitle>
          <CardDescription>Reserva un número de slot para un miembro y luego enróllalo en el ESP32</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Miembro</Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar miembro" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.full_name}
                    {m.fingerprint_id ? ` (Huella #${m.fingerprint_id})` : " (Sin huella)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMember && selectedMember.fingerprint_id && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">
                Este miembro ya tiene la huella <strong>#{selectedMember.fingerprint_id}</strong>. 
                Al asignar un nuevo slot se reemplazará.
              </span>
            </div>
          )}

          {enrollStatus && (
            <div className="p-3 rounded-md bg-muted border text-sm">
              {enrolling && <Loader2 className="inline h-4 w-4 animate-spin mr-2" />}
              {enrollStatus}
            </div>
          )}

          <Button
            onClick={handleEnroll}
            disabled={!selectedMemberId || enrolling}
            className="w-full"
          >
            {enrolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Asignar Slot de Huella
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Members with fingerprints */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Miembros con Huella Registrada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.filter((m) => m.fingerprint_id).map((m) => (
              <div key={m.id} className="flex items-center justify-between p-2 rounded border">
                <span className="text-sm font-medium">{m.full_name}</span>
                <Badge variant="secondary">Huella #{m.fingerprint_id}</Badge>
              </div>
            ))}
            {members.filter((m) => !m.fingerprint_id).length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {members.filter((m) => !m.fingerprint_id).length} miembro(s) sin huella registrada
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FingerprintEnroll;
