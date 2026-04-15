import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Church, ArrowRight, ShieldCheck, Users } from "lucide-react";

interface EmailStepProps {
  onContinue: (email: string) => void;
  onCreateAdmin: () => void;
  onCreateMember: () => void;
}

const EmailStep = ({ onContinue, onCreateAdmin, onCreateMember }: EmailStepProps) => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) onContinue(email.trim());
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <Church className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground font-serif">
          Inicia sesión
        </h1>
        <p className="text-muted-foreground text-sm">
          Ingresa tu correo electrónico para continuar
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground/80">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12 text-base"
            autoFocus
          />
        </div>
        <Button type="submit" className="w-full h-12 text-base font-semibold gap-2">
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-3 text-muted-foreground">¿No tienes una cuenta?</span>
        </div>
      </div>

      <div className="grid gap-3">
        <Button
          variant="outline"
          className="w-full h-12 justify-start gap-3 text-sm font-medium"
          onClick={onCreateAdmin}
        >
          <ShieldCheck className="h-5 w-5 text-primary" />
          Crear cuenta como Administrador
        </Button>
        <Button
          variant="outline"
          className="w-full h-12 justify-start gap-3 text-sm font-medium"
          onClick={onCreateMember}
        >
          <Users className="h-5 w-5 text-accent-foreground" />
          Crear cuenta como Miembro
        </Button>
      </div>
    </div>
  );
};

export default EmailStep;
