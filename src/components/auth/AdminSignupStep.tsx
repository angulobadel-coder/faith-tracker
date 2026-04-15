import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ShieldCheck } from "lucide-react";

interface AdminSignupStepProps {
  loading: boolean;
  onBack: () => void;
  onSignup: (data: { name: string; email: string; password: string }) => void;
}

const AdminSignupStep = ({ loading, onBack, onSignup }: AdminSignupStepProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
    onSignup({ name: name.trim(), email: email.trim(), password });
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
            Cuenta de Administrador
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Para pastores y administradores del sistema.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="admin-name">Nombre completo</Label>
          <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} required className="h-12" autoFocus />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-email">Correo electrónico</Label>
          <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-password">Contraseña</Label>
          <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-12" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="admin-confirm">Confirmar contraseña</Label>
          <Input id="admin-confirm" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="h-12" />
        </div>

        <Button type="submit" className="w-full h-12 text-base font-semibold mt-2" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta de administrador"}
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

export default AdminSignupStep;
