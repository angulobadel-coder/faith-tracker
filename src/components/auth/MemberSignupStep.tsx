import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Users } from "lucide-react";

interface MemberSignupStepProps {
  loading: boolean;
  onBack: () => void;
  onSignup: (data: {
    name: string;
    email: string;
    phone: string;
    birthDate: string;
    reason: string;
    password: string;
  }) => void;
}

const MemberSignupStep = ({ loading, onBack, onSignup }: MemberSignupStepProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    onSignup({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      birthDate,
      reason: reason.trim(),
      password,
    });
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
            <Users className="h-5 w-5 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Registro de Miembro
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Únete a nuestra comunidad como miembro activo.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="member-name">Nombre completo</Label>
          <Input id="member-name" value={name} onChange={(e) => setName(e.target.value)} required className="h-12" autoFocus />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-email">Correo electrónico</Label>
          <Input id="member-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="member-phone">Teléfono <span className="text-muted-foreground">(opcional)</span></Label>
            <Input id="member-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-birth">Nacimiento <span className="text-muted-foreground">(opcional)</span></Label>
            <Input id="member-birth" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="h-12" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-reason">Motivo de membresía <span className="text-muted-foreground">(opcional)</span></Label>
          <Textarea id="member-reason" placeholder="¿Por qué deseas ser parte de nuestra comunidad?" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-password">Contraseña</Label>
          <Input id="member-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="member-confirm">Confirmar contraseña</Label>
          <Input id="member-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="h-12" />
        </div>

        <Button type="submit" className="w-full h-12 text-base font-semibold mt-2" disabled={loading}>
          {loading ? "Registrando..." : "Registrarme como Miembro"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <button type="button" onClick={onBack} className="text-primary hover:underline font-medium">
          Inicia sesión
        </button>
      </p>
    </div>
  );
};

export default MemberSignupStep;
