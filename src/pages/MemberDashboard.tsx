import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Church, AlertTriangle, LogOut, Send, Heart } from "lucide-react";

const alertTypes = [
  { value: "enfermedad", label: "Me siento enfermo/a", icon: "🤒" },
  { value: "emergencia", label: "Emergencia médica", icon: "🚑" },
  { value: "oracion", label: "Necesito oración", icon: "🙏" },
  { value: "accidente", label: "Tuve un accidente", icon: "⚠️" },
  { value: "otro", label: "Otro motivo", icon: "📋" },
];

const MemberDashboard = () => {
  const { user, signOut } = useAuth();
  const [alertType, setAlertType] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertType) {
      toast.error("Selecciona el tipo de alerta.");
      return;
    }
    if (!description.trim()) {
      toast.error("Describe brevemente tu situación.");
      return;
    }

    setLoading(true);

    // Find the member record linked to this user's email
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .select("id")
      .eq("email", user?.email ?? "")
      .maybeSingle();

    if (memberError || !memberData) {
      // If no member record, create one from profile info
      const { data: newMember, error: createError } = await supabase
        .from("members")
        .insert({
          full_name: user?.user_metadata?.full_name || user?.email || "Miembro",
          email: user?.email,
        })
        .select("id")
        .single();

      if (createError || !newMember) {
        toast.error("Error al enviar la alerta. Intenta de nuevo.");
        setLoading(false);
        return;
      }

      await insertAlert(newMember.id);
    } else {
      await insertAlert(memberData.id);
    }

    setLoading(false);
  };

  const insertAlert = async (memberId: string) => {
    const selectedType = alertTypes.find((t) => t.value === alertType);
    const { error } = await supabase.from("alerts").insert({
      member_id: memberId,
      alert_type: alertType,
      description: `${selectedType?.icon} ${selectedType?.label}: ${description.trim()}`,
      status: "pendiente",
    });

    if (error) {
      toast.error("Error al enviar la alerta: " + error.message);
    } else {
      toast.success("¡Alerta enviada! El pastor será notificado.");
      setAlertType("");
      setDescription("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Church className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <p className="font-serif font-bold text-sm text-foreground">Asistencia Iglesia</p>
              <p className="text-xs text-muted-foreground">{user?.user_metadata?.full_name || user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground">
            <LogOut className="h-4 w-4 mr-1" />
            Salir
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto p-4 space-y-6 mt-6">
        {/* Welcome */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground">¡Hola, {user?.user_metadata?.full_name?.split(" ")[0] || "Miembro"}!</h1>
          <p className="text-muted-foreground text-sm">
            Si necesitas ayuda o no te sientes bien, envía una alerta al pastor.
          </p>
        </div>

        {/* Alert Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Enviar Alerta
            </CardTitle>
            <CardDescription>
              Tu pastor recibirá esta alerta y se pondrá en contacto contigo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSendAlert} className="space-y-4">
              <div className="space-y-2">
                <Label>¿Qué te sucede?</Label>
                <Select value={alertType} onValueChange={setAlertType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una opción..." />
                  </SelectTrigger>
                  <SelectContent>
                    {alertTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Describe tu situación</Label>
                <Textarea
                  placeholder="Cuéntanos brevemente cómo te sientes o qué necesitas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  "Enviando..."
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Alerta al Pastor
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MemberDashboard;
