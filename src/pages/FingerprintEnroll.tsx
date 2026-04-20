import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Fingerprint, AlertCircle, Loader2, Cloud, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  full_name: string;
  fingerprint_id: string | null;
}

const FingerprintEnroll = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [slot, setSlot] = useState("");
  const [saving, setSaving] = useState(false);
  const [nextSlotHint, setNextSlotHint] = useState<number | null>(null);

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

    // Verificar slot no ocupado por OTRO miembro
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
          Asigna a cada miembro el número de slot de huella registrado en el sensor
        </p>
      </div>

      {/* Info: arquitectura cloud */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Cloud className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-medium">Modo Nube activado</p>
              <p className="text-muted-foreground">
                El ESP32 envía las asistencias directamente al servidor. Esta página solo se usa para
                vincular cada slot del sensor con un miembro registrado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asignar slot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Fingerprint className="h-5 w-5 text-accent" />
            Vincular slot a miembro
          </CardTitle>
          <CardDescription>
            Inscribe la huella en el sensor con el ESP32 (apunta el slot que queda asignado) y luego
            registra ese mismo número aquí.
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

          {selectedMember?.fingerprint_id && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-sm">
                Este miembro ya tiene asignada la huella{" "}
                <strong>#{selectedMember.fingerprint_id}</strong>. Al guardar se reemplazará.
              </span>
            </div>
          )}

          <Button onClick={handleAssign} disabled={!selectedMemberId || !slot || saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Guardar asignación
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Miembros con huella */}
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
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded border"
                >
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
