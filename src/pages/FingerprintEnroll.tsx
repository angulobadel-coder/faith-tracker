import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, CheckCircle, AlertCircle, Loader2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  full_name: string;
  fingerprint_id: string | null;
}

const STORAGE_KEY = "esp32_ip";

const FingerprintEnroll = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState("");
  const [esp32Ip, setEsp32Ip] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [esp32Connected, setEsp32Connected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);

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

  const checkConnection = useCallback(async (ip: string) => {
    if (!ip) return;
    setChecking(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`http://${ip}/status`, { signal: controller.signal });
      clearTimeout(timeout);
      setEsp32Connected(res.ok);
    } catch {
      setEsp32Connected(false);
    }
    setChecking(false);
  }, []);

  // Auto-check on mount if IP saved
  useEffect(() => {
    if (esp32Ip) checkConnection(esp32Ip);
  }, [esp32Ip, checkConnection]);

  const handleSaveIp = () => {
    if (!esp32Ip.trim()) {
      toast.error("Ingresa una IP válida");
      return;
    }
    localStorage.setItem(STORAGE_KEY, esp32Ip.trim());
    toast.success("IP guardada");
    checkConnection(esp32Ip.trim());
  };

  const handleEnroll = async () => {
    if (!selectedMemberId || !esp32Ip) return;
    setEnrolling(true);
    setEnrollStatus("Solicitando enrolamiento al ESP32...");

    try {
      // Get next available slot from ESP32
      const slotRes = await fetch(`http://${esp32Ip}/next-slot`);
      const slotData = await slotRes.json();
      const nextSlot = slotData.next_slot;

      setEnrollStatus(`Coloca el dedo en el sensor (slot #${nextSlot})...`);

      // Trigger enrollment on ESP32
      const enrollRes = await fetch(`http://${esp32Ip}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: nextSlot }),
      });

      const result = await enrollRes.json();

      if (result.success) {
        // Save fingerprint_id to member
        const { error } = await supabase
          .from("members")
          .update({ fingerprint_id: String(nextSlot) })
          .eq("id", selectedMemberId);

        if (error) throw error;

        toast.success(`Huella #${nextSlot} registrada correctamente`);
        setEnrollStatus(`✅ Huella #${nextSlot} guardada`);
        fetchMembers();
        setSelectedMemberId("");
      } else {
        toast.error(result.error || "Error al enrolar huella");
        setEnrollStatus(`❌ ${result.error || "Error"}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Error de conexión con el ESP32");
      setEnrollStatus(`❌ ${err.message}`);
    }
    setEnrolling(false);
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Registro de Huellas</h1>
        <p className="text-muted-foreground">Conecta el ESP32 e inscribe huellas de los miembros</p>
      </div>

      {/* ESP32 Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {esp32Connected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            Conexión con ESP32
          </CardTitle>
          <CardDescription>
            Asegúrate de que el ESP32 y este dispositivo estén en la misma red Wi-Fi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ip">Dirección IP del ESP32</Label>
            <div className="flex gap-2">
              <Input
                id="ip"
                placeholder="192.168.1.100"
                value={esp32Ip}
                onChange={(e) => setEsp32Ip(e.target.value)}
              />
              <Button onClick={handleSaveIp} variant="secondary">
                Guardar
              </Button>
              <Button
                onClick={() => checkConnection(esp32Ip)}
                disabled={!esp32Ip || checking}
                variant="outline"
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Probar"}
              </Button>
            </div>
          </div>

          {esp32Connected !== null && (
            <div
              className={`flex items-center gap-2 p-3 rounded-md border ${
                esp32Connected
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-destructive/10 border-destructive/20"
              }`}
            >
              {esp32Connected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">ESP32 conectado correctamente</span>
                  <Badge variant="outline" className="ml-auto text-green-600 border-green-500/30">
                    Online
                  </Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">No se pudo conectar al ESP32</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enroll Fingerprint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fingerprint className="h-5 w-5 text-accent" />
            Registrar Huella
          </CardTitle>
          <CardDescription>Selecciona un miembro y enrola su huella en el sensor</CardDescription>
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
                Al registrar una nueva se reemplazará.
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
            disabled={!selectedMemberId || !esp32Connected || enrolling}
            className="w-full"
          >
            {enrolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enrolando...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Iniciar Registro de Huella
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
