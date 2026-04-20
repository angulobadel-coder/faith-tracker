import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Fingerprint,
  AlertCircle,
  Loader2,
  Cloud,
  Trash2,
  Wifi,
  WifiOff,
  CheckCircle,
} from "lucide-react";
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
  const [slot, setSlot] = useState("");
  const [saving, setSaving] = useState(false);
  const [nextSlotHint, setNextSlotHint] = useState<number | null>(null);

  // ESP32 conexión local (opcional)
  const [esp32Ip, setEsp32Ip] = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [esp32Connected, setEsp32Connected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState("");

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("members")
      .select("id, full_name, fingerprint_id")
      .eq("active", true)
      .order("full_name");
    if (data) {
      setMembers(data);
      const used = data
        .map((m) => parseInt(m.fingerprint_id || "0"))
        .filter((n) => !isNaN(n) && n > 0);
      const next = used.length > 0 ? Math.max(...used) + 1 : 1;
      setNextSlotHint(next);
    }
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

  const handleAssign = async () => {
    if (!selectedMemberId || !slot.trim()) {
      toast.error("Selecciona un miembro y escribe el número de slot");
      return;
    }
    const slotNum = parseInt(slot.trim());
    if (isNaN(slotNum) || slotNum < 1 || slotNum > 127) {
      toast.error("El slot debe ser un número entre 1 y 127");
      return;
    }
    const occupied = members.find(
      (m) => m.fingerprint_id === String(slotNum) && m.id !== selectedMemberId
    );
    if (occupied) {
      toast.error(`El slot #${slotNum} ya está asignado a ${occupied.full_name}`);
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from("members")
      .update({ fingerprint_id: String(slotNum) })
      .eq("id", selectedMemberId);
    setSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Slot #${slotNum} asignado correctamente`);
    setSelectedMemberId("");
    setSlot("");
    fetchMembers();
  };

  const handleEnrollLocal = async () => {
    if (!selectedMemberId || !esp32Ip) return;
    setEnrolling(true);
    setEnrollStatus("Solicitando enrolamiento al ESP32...");

    try {
      const slotRes = await fetch(`http://${esp32Ip}/next-slot`);
      const slotData = await slotRes.json();
      const nextSlot = slotData.next_slot;

      setEnrollStatus(`Coloca el dedo en el sensor (slot #${nextSlot})...`);

      const enrollRes = await fetch(`http://${esp32Ip}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slot: nextSlot }),
      });
      const result = await enrollRes.json();

      if (result.success) {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error de conexión con el ESP32";
      toast.error(msg);
      setEnrollStatus(`❌ ${msg}`);
    }
    setEnrolling(false);
  };

  const handleUnassign = async (memberId: string) => {
    const { error } = await supabase
      .from("members")
      .update({ fingerprint_id: null })
      .eq("id", memberId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Huella desasignada");
    fetchMembers();
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const withFingerprint = members.filter((m) => m.fingerprint_id);
  const withoutFingerprint = members.filter((m) => !m.fingerprint_id);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Administración de Huellas</h1>
        <p className="text-muted-foreground">
          Conecta el ESP32 (modo local) o asigna manualmente el slot de cada miembro
        </p>
      </div>

      {/* Info modo nube */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Cloud className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">Modo Nube siempre activo</p>
              <p className="text-muted-foreground">
                Una vez asignado el slot, el ESP32 envía las asistencias directo al servidor con
                fecha, día y hora — sin importar desde dónde se conecte.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conexión ESP32 (modo local opcional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {esp32Connected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            Conexión con ESP32 (opcional)
          </CardTitle>
          <CardDescription>
            Solo si quieres enrolar huellas desde esta página. Requiere estar en la misma red Wi-Fi
            del ESP32 y abrir la app por HTTP local.
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

      {/* Asignar / enrolar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fingerprint className="h-5 w-5 text-accent" />
            Vincular huella a miembro
          </CardTitle>
          <CardDescription>
            Si el ESP32 está conectado podrás enrolar directamente. Si no, registra el slot
            manualmente (el que asignaste desde el Monitor Serie del ESP32 con{" "}
            <code className="px-1 bg-muted rounded">enroll &lt;n&gt;</code>).
          </CardDescription>
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
                    {m.fingerprint_id ? ` (Huella #${m.fingerprint_id})` : " — sin huella"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMember?.fingerprint_id && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm">
                Este miembro ya tiene asignada la huella{" "}
                <strong>#{selectedMember.fingerprint_id}</strong>. Al guardar se reemplazará.
              </span>
            </div>
          )}

          {/* OPCIÓN A: Enrolar con ESP32 conectado */}
          {esp32Connected && (
            <div className="space-y-3 p-4 rounded-md border border-green-500/30 bg-green-500/5">
              <p className="text-sm font-medium flex items-center gap-2">
                <Wifi className="h-4 w-4 text-green-500" /> Enrolamiento automático
              </p>
              {enrollStatus && (
                <div className="p-3 rounded-md bg-muted border text-sm">
                  {enrolling && <Loader2 className="inline h-4 w-4 animate-spin mr-2" />}
                  {enrollStatus}
                </div>
              )}
              <Button
                onClick={handleEnrollLocal}
                disabled={!selectedMemberId || enrolling}
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
            </div>
          )}

          {/* OPCIÓN B: Asignar slot manualmente */}
          <div className="space-y-3 p-4 rounded-md border">
            <p className="text-sm font-medium">Asignación manual de slot</p>
            <div className="space-y-2">
              <Label htmlFor="slot">Número de slot del sensor (1-127)</Label>
              <Input
                id="slot"
                type="number"
                min={1}
                max={127}
                placeholder={nextSlotHint ? `Sugerido: ${nextSlotHint}` : "Ej: 1"}
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
              />
              {nextSlotHint && (
                <p className="text-xs text-muted-foreground">
                  Próximo slot libre sugerido:{" "}
                  <button
                    type="button"
                    className="underline text-primary"
                    onClick={() => setSlot(String(nextSlotHint))}
                  >
                    #{nextSlotHint}
                  </button>
                </p>
              )}
            </div>
            <Button
              onClick={handleAssign}
              disabled={!selectedMemberId || !slot || saving}
              variant="secondary"
              className="w-full"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar asignación manual"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista huellas asignadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Huellas asignadas{" "}
            <Badge variant="secondary" className="ml-2">
              {withFingerprint.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {withFingerprint.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay huellas asignadas.</p>
          ) : (
            <div className="space-y-2">
              {withFingerprint.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{m.fingerprint_id}</Badge>
                    <span className="text-sm font-medium">{m.full_name}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUnassign(m.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {withoutFingerprint.length > 0 && (
            <p className="text-xs text-muted-foreground mt-4">
              {withoutFingerprint.length} miembro(s) aún sin huella registrada
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FingerprintEnroll;
