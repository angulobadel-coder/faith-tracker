import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import logoCfa from "@/assets/logo-cfa.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    // Supabase recovery: session is established automatically from the email link.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Mínimo 6 caracteres.");
    if (password !== confirm) return toast.error("Las contraseñas no coinciden.");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Contraseña actualizada. Ya puedes iniciar sesión.");
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <div className="halos relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="halo-blue" />
      <div className="glass relative z-10 w-full max-w-md animate-fade-in p-8">
        <img src={logoCfa} alt="CFA" className="mx-auto h-24 w-auto drop-shadow-[0_10px_30px_rgba(255,94,138,0.35)]" />
        <div className="text-center mt-4 mb-6">
          <h1 className="text-2xl font-bold">Nueva contraseña</h1>
          <p className="text-secondary-soft text-sm mt-1">
            {ready ? "Define tu nueva contraseña para continuar." : "Validando enlace de recuperación..."}
          </p>
        </div>
        {ready && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-secondary-soft" htmlFor="np">Contraseña</Label>
              <Input className="glass-input h-12" id="np" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="space-y-2">
              <Label className="text-secondary-soft" htmlFor="cp">Confirmar contraseña</Label>
              <Input className="glass-input h-12" id="cp" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" className="w-full btn-gradient border-0 h-12 text-base font-semibold" disabled={loading}>
              <KeyRound className="h-5 w-5" /> {loading ? "Guardando..." : "Actualizar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
