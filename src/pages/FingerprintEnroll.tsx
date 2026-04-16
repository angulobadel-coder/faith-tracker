import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, Wifi, WifiOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  full_name: string;
  fingerprint_id: string | null;
}

const FingerprintEnroll = () => {
  const [esp32Ip, setEsp32Ip] = useState(() => localStorage.getItem("esp32_ip") || "");
  const [ipInput, setIpInput] = useState(() => localStorage.getItem("esp32_ip") || "");
  const [connected, setConnected] = useState(false);
  const [checking, setChecking] = useState(false);
  const [connectionHint, setConnectionHint] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [enrollStatus, setEnrollStatus] = useState("");

  const normalizeEsp32Ip = (value: string) =>
    value.trim().replace(/^https?:\/\//i, "").replace(/\/.*$/, "").replace(/\s+/g, "");

  const buildEsp32Url = (ip: string, path: string) => `http://${normalizeEsp32Ip(ip)}${path}`;

  const getConnectivityHint = (ip: string) => {
    const normalizedIp = normalizeEsp32Ip(ip);
    const isSecurePage = typeof window !== "undefined" && window.location.protocol === "https:";

    if (isSecurePage) {
      return `Si ya estás en la misma Wi‑Fi, el navegador probablemente está bloqueando http://${normalizedIp} desde esta página segura. En Chrome agrega exactamente "http://${normalizedIp}" en chrome://flags/#unsafely-treat-insecure-origin-as-secure, reinicia el navegador y aquí escribe solo la IP.`;
    }

    return `Verifica que el ESP32 responda en http://${normalizedIp}/status y que ambos equipos estén en la misma red Wi‑Fi 2.4 GHz.`;
  };

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

  const checkConnection = async (ip: string) => {
    const normalizedIp = normalizeEsp32Ip(ip);
    if (!normalizedIp) return;

    setChecking(true);
    setConnected(false);
    setConnectionHint("");

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(buildEsp32Url(normalizedIp, "/status"), { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        setConnected(true);
        setEsp32Ip(normalizedIp);
        setIpInput(normalizedIp);
        localStorage.setItem("esp32_ip", normalizedIp);
        setConnectionHint("");
        toast.success("ESP32 conectado correctamente");
      } else {
        setConnectionHint(`El ESP32 respondió, pero /status devolvió un error. Revisa el firmware y confirma que esa IP sea la actual: ${normalizedIp}.`);
        toast.error("El ESP32 respondió con error en /status");
      }
    } catch {
      setConnectionHint(getConnectivityHint(normalizedIp));
      toast.error("No se pudo conectar al ESP32. Revisa la IP o el bloqueo del navegador.");
    }
    setChecking(false);
  };

  const handleSaveIp = () => {
    const normalizedIp = normalizeEsp32Ip(ipInput);
    if (!normalizedIp) return;
    setIpInput(normalizedIp);
    checkConnection(normalizedIp);
  };

  // Periodically check connection
  useEffect(() => {
    if (!esp32Ip) return;
    const interval = setInterval(() => {
      fetch(buildEsp32Url(esp32Ip, "/status"), { signal: AbortSignal.timeout(2000) })
        .then((r) => setConnected(r.ok))
        .catch(() => setConnected(false));
    }, 10000);
    return () => clearInterval(interval);
  }, [esp32Ip]);

  const handleEnroll = async () => {
    if (!selectedMemberId || !esp32Ip) return;
    setEnrolling(true);
    setEnrollStatus("Solicitando enrollment al ESP32...");

    try {
      // Get next available fingerprint slot
      const { data: allMembers } = await supabase
        .from("members")
        .select("fingerprint_id")
        .not("fingerprint_id", "is", null);

      const usedSlots = (allMembers || [])
        .map((m) => parseInt(m.fingerprint_id || "0"))
        .filter((n) => !isNaN(n) && n > 0);
      const nextSlot = usedSlots.length > 0 ? Math.max(...usedSlots) + 1 : 1;

      setEnrollStatus(`Enrollando en slot #${nextSlot}. Coloca el dedo en el sensor...`);

      const res = await fetch(buildEsp32Url(esp32Ip, `/enroll?slot=${nextSlot}`), {
        method: "POST",
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Error del ESP32");
      }

      const result = await res.json();

      if (result.success) {
        // Save fingerprint_id to member
        const { error } = await supabase
          .from("members")
          .update({ fingerprint_id: String(nextSlot) })
          .eq("id", selectedMemberId);

        if (error) {
          toast.error("Huella enrollada pero error al guardar en BD");
        } else {
          toast.success(`Huella #${nextSlot} asignada correctamente`);
          setEnrollStatus(`✅ Huella #${nextSlot} registrada exitosamente`);
          fetchMembers();
          setSelectedMemberId("");
        }
      } else {
        toast.error(result.message || "Error al enrollar huella");
        setEnrollStatus(`❌ ${result.message || "Error en enrollment"}`);
      }
    } catch (err: any) {
      if (err.name === "AbortError" || err.name === "TimeoutError") {
        toast.error("Timeout: el enrollment tardó demasiado");
        setEnrollStatus("⏱️ Timeout en enrollment");
      } else {
        toast.error(err.message || "Error de conexión con ESP32");
        setEnrollStatus(`❌ ${err.message}`);
      }
    }
    setEnrolling(false);
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Registro de Huellas</h1>
        <p className="text-muted-foreground">Conecta el ESP32 y enrolla huellas para los miembros</p>
      </div>

      {/* ESP32 Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            {connected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-muted-foreground" />
            )}
            Conexión ESP32
          </CardTitle>
          <CardDescription>
            Ingresa la IP que aparece en el Monitor Serial del ESP32
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="192.168.1.100"
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveIp()}
              />
            </div>
            <Button onClick={handleSaveIp} disabled={checking} variant="secondary">
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conectar"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Aquí escribe solo la IP del ESP32, por ejemplo <span className="font-mono">10.89.158.23</span>.
            Si configuras Chrome flags, allí sí debes usar <span className="font-mono">http://{normalizeEsp32Ip(ipInput || esp32Ip || "IP_DEL_ESP32")}</span>.
          </p>

          {esp32Ip && (
            <div className={`flex items-center gap-2 p-3 rounded-md border ${
              connected
                ? "bg-green-500/10 border-green-500/20"
                : "bg-destructive/10 border-destructive/20"
            }`}>
              {connected ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Conectado a {esp32Ip}</span>
                  <Badge variant="outline" className="ml-auto text-green-600 border-green-500/30">Online</Badge>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">Desconectado de {esp32Ip}</span>
                  <Badge variant="outline" className="ml-auto text-destructive border-destructive/30">Offline</Badge>
                </>
              )}
            </div>
          )}

          {connectionHint && (
            <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-foreground">
              {connectionHint}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enroll Fingerprint */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fingerprint className="h-5 w-5 text-accent" />
            Enrollar Huella
          </CardTitle>
          <CardDescription>Selecciona un miembro y registra su huella dactilar</CardDescription>
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
                Al enrollar se reemplazará.
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
            disabled={!connected || !selectedMemberId || enrolling}
            className="w-full"
          >
            {enrolling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enrollando...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Enrollar Huella
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
