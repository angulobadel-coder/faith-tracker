import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, CheckCircle, AlertCircle, Loader2, Cloud } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  full_name: string;
  fingerprint_id: string | null;
}

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/esp32-api`;

const FingerprintEnroll = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [manualSlot, setManualSlot] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [loadingSlot, setLoadingSlot] = useState(false);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase
      .from("members")
      .select("id, full_name, fingerprint_id")
      .eq("active", true)
      .order("full_name");
    if (data) setMembers(data);
  }, []);

  const fetchNextSlot = useCallback(async () => {
    setLoadingSlot(true);
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/next-slot`);
      const data = await res.json();
      setManualSlot(data.next_slot);
    } catch {
      toast.error("No se pudo obtener el próximo slot");
    }
    setLoadingSlot(false);
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchNextSlot();
  }, [fetchMembers, fetchNextSlot]);

  const handleAssign = async () => {
    if (!selectedMemberId || manualSlot === null) return;
    setAssigning(true);
    const { error } = await supabase
      .from("members")
      .update({ fingerprint_id: String(manualSlot) })
      .eq("id", selectedMemberId);

    if (error) {
      toast.error("Error al asignar el slot");
    } else {
      toast.success(`Slot #${manualSlot} asignado correctamente`);
      setSelectedMemberId("");
      await fetchMembers();
      await fetchNextSlot();
    }
    setAssigning(false);
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Registro de Huellas</h1>
        <p className="text-muted-foreground">
          Asigna el slot de huella que enrolarás en el ESP32 a un miembro
        </p>
      </div>

      {/* Cloud info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cloud className="h-5 w-5 text-accent" />
            Modo Nube Activo
          </CardTitle>
          <CardDescription>
            El ESP32 se conecta directo al backend en la nube. No necesitas estar en la misma red Wi‑Fi
            para registrar asistencias — funcionan automáticamente cuando alguien pone el dedo en el sensor.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Assign slot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fingerprint className="h-5 w-5 text-accent" />
            Asignar Slot a Miembro
          </CardTitle>
          <CardDescription>
            <strong>Paso 1:</strong> Enrola la huella física en el sensor ESP32 con el botón físico (slot
            sugerido más abajo).<br />
            <strong>Paso 2:</strong> Aquí asignas ese mismo número de slot al miembro correspondiente.
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
                    {m.fingerprint_id ? ` (Huella #${m.fingerprint_id})` : " (Sin huella)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Número de slot a asignar</Label>
            <div className="flex gap-2 items-center">
              <div className="flex-1 p-3 rounded-md border bg-muted text-center">
                {loadingSlot ? (
                  <Loader2 className="inline h-4 w-4 animate-spin" />
                ) : (
                  <span className="text-xl font-bold">#{manualSlot ?? "?"}</span>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Próximo slot sugerido (puedes editar más abajo)
                </p>
              </div>
              <input
                type="number"
                min={1}
                max={127}
                value={manualSlot ?? ""}
                onChange={(e) => setManualSlot(e.target.value ? parseInt(e.target.value) : null)}
                className="w-24 h-12 text-center text-lg rounded-md border bg-background px-2"
              />
            </div>
          </div>

          {selectedMember && selectedMember.fingerprint_id && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span className="text-sm">
                Este miembro ya tiene la huella <strong>#{selectedMember.fingerprint_id}</strong>.
                Al asignar una nueva se reemplazará.
              </span>
            </div>
          )}

          <Button
            onClick={handleAssign}
            disabled={!selectedMemberId || manualSlot === null || assigning}
            className="w-full"
          >
            {assigning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Asignar Slot al Miembro
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
