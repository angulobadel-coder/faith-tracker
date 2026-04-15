import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogIn, Mail } from "lucide-react";

interface PasswordStepProps {
  email: string;
  loading: boolean;
  onBack: () => void;
  onLogin: (password: string) => void;
  onForgotPassword: () => void;
}

const PasswordStep = ({ email, loading, onBack, onLogin, onForgotPassword }: PasswordStepProps) => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(password);
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

        <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
          Ingresa tu contraseña
        </h1>

        <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5">
          <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm text-foreground truncate">{email}</span>
          <button
            type="button"
            onClick={onBack}
            className="ml-auto text-xs text-primary hover:underline shrink-0"
          >
            Cambiar
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground/80">Contraseña</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-12 text-base"
            autoFocus
          />
        </div>

        <Button type="submit" className="w-full h-12 text-base font-semibold gap-2" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
          {!loading && <LogIn className="h-4 w-4" />}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={onForgotPassword}
          className="text-sm text-primary hover:underline"
        >
          ¿Olvidaste la contraseña?
        </button>
      </div>
    </div>
  );
};

export default PasswordStep;
