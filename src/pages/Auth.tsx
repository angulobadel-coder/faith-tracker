import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShieldCheck, Users, LogIn, ArrowLeft, Mail } from "lucide-react";
import logoCfa from "@/assets/logo-cfa.png";

type View = "landing" | "login" | "admin" | "member" | "forgot";

const Auth = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("landing");
  const [loading, setLoading] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Admin signup state
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [adminInviteCode, setAdminInviteCode] = useState("");

  // Member signup state
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberPhone, setMemberPhone] = useState("");
  const [memberBirthDate, setMemberBirthDate] = useState("");
  const [memberReason, setMemberReason] = useState("");
  const [memberPassword, setMemberPassword] = useState("");
  const [memberConfirmPassword, setMemberConfirmPassword] = useState("");

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return toast.error("Ingresa tu correo.");
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Te enviamos un enlace de recuperación a tu correo.");
    setForgotEmail("");
    setView("login");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("¡Bienvenido!");
      navigate("/");
    }
    setLoading(false);
  };

  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword !== adminConfirmPassword) return toast.error("Las contraseñas no coinciden.");
    if (adminPassword.length < 6) return toast.error("La contraseña debe tener al menos 6 caracteres.");
    if (!adminInviteCode.trim()) return toast.error("Debes ingresar el código de invitación.");
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("pastor-signup", {
      body: {
        full_name: adminName,
        email: adminEmail,
        password: adminPassword,
        invite_code: adminInviteCode.trim(),
      },
    });
    if (error || (data as any)?.error) {
      toast.error((data as any)?.error ?? error?.message ?? "Error al crear cuenta");
    } else {
      toast.success("Cuenta de pastor creada. Ya puedes iniciar sesión.");
      setAdminName(""); setAdminEmail(""); setAdminPassword(""); setAdminConfirmPassword(""); setAdminInviteCode("");
      setView("login");
    }
    setLoading(false);
  };

  const handleMemberSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim()) return toast.error("Nombre y correo son obligatorios.");
    if (!memberPassword || memberPassword.length < 6) return toast.error("La contraseña debe tener al menos 6 caracteres.");
    if (memberPassword !== memberConfirmPassword) return toast.error("Las contraseñas no coinciden.");
    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email: memberEmail.trim(),
      password: memberPassword,
      options: { data: { full_name: memberName.trim(), role: "member" } },
    });
    if (authError) {
      toast.error("Error al crear cuenta: " + authError.message);
      setLoading(false);
      return;
    }
    const { error: rpcError } = await supabase.rpc("register_member", {
      _full_name: memberName.trim(),
      _email: memberEmail.trim(),
      _phone: memberPhone.trim() || null,
      _birth_date: memberBirthDate || null,
      _reason: memberReason.trim() || null,
    });
    if (rpcError) toast.error("Error al registrar miembro: " + rpcError.message);

    toast.success("¡Cuenta creada! Revisa tu correo para confirmar.");
    setMemberName(""); setMemberEmail(""); setMemberPhone(""); setMemberBirthDate("");
    setMemberReason(""); setMemberPassword(""); setMemberConfirmPassword("");
    setView("login");
    setLoading(false);
  };

  const Logo = ({ size = "h-32" }: { size?: string }) => (
    <img
      src={logoCfa}
      alt="Centro Familiar de Alabanza"
      className={`mx-auto ${size} w-auto drop-shadow-[0_10px_30px_rgba(255,94,138,0.35)]`}
    />
  );

  const BackButton = () => (
    <button
      type="button"
      onClick={() => setView("landing")}
      className="absolute top-5 left-5 z-20 inline-flex items-center gap-1 text-sm text-secondary-soft hover:text-white transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> Volver
    </button>
  );

  return (
    <div className="halos relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="halo-blue" />

      {/* LANDING */}
      {view === "landing" && (
        <div className="glass relative z-10 w-full max-w-md animate-fade-in p-8 text-center">
          <Logo size="h-36" />

          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-secondary-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-gradient-primary" />
            Sistema interno de la iglesia
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight leading-tight text-white">
            Bienvenido al <span className="text-primary">Panel CFA</span>
          </h1>
          <p className="mt-3 text-secondary-soft text-sm leading-relaxed">
            Gestiona miembros, asistencia y comunicación de la iglesia desde un solo lugar.
          </p>

          <div className="mt-7 space-y-3">
            <Button
              onClick={() => setView("login")}
              className="w-full btn-gradient border-0 h-12 text-base font-semibold"
            >
              <LogIn className="h-5 w-5" /> Iniciar Sesión
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-transparent px-3 text-[11px] uppercase tracking-wider text-tertiary-soft">
                ¿Aún no tienes cuenta? Regístrate
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => setView("member")}
                className="h-11 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-white flex-col gap-0.5 py-2"
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <Users className="h-4 w-4" /> Soy Miembro
                </span>
                <span className="text-[10px] font-normal text-tertiary-soft">Registro abierto</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => setView("admin")}
                className="h-11 bg-white/5 border-white/10 hover:bg-white/10 hover:text-white text-white flex-col gap-0.5 py-2"
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4" /> Soy Pastor
                </span>
                <span className="text-[10px] font-normal text-tertiary-soft">Requiere invitación</span>
              </Button>
            </div>
          </div>

          <p className="mt-7 text-xs text-tertiary-soft">
            © 2026 Centro Familiar de Alabanza · iglesiacfa.com
          </p>
        </div>
      )}

      {/* LOGIN */}
      {view === "login" && (
        <div className="glass relative z-10 w-full max-w-md animate-fade-in p-8">
          <BackButton />
          <Logo size="h-28" />
          <div className="text-center mt-4 mb-6">
            <h1 className="text-3xl font-bold">Bienvenido</h1>
            <p className="text-secondary-soft text-sm mt-1">Accede a tu cuenta de CFA</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-secondary-soft" htmlFor="login-email">Correo electrónico</Label>
              <Input className="glass-input h-12" id="login-email" type="email" placeholder="correo@ejemplo.com"
                value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-secondary-soft" htmlFor="login-password">Contraseña</Label>
              <Input className="glass-input h-12" id="login-password" type="password" placeholder="••••••••"
                value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
            </div>
            <div className="text-right -mt-1">
              <button type="button" onClick={() => setView("forgot")} className="text-xs text-secondary-soft hover:text-white underline">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <Button type="submit" className="w-full btn-gradient border-0 h-12 text-base font-semibold" disabled={loading}>
              <LogIn className="h-5 w-5" /> {loading ? "Ingresando..." : "Ingresar"}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm space-y-1">
            <p className="text-secondary-soft">
              ¿No tienes cuenta?{" "}
              <button onClick={() => setView("member")} className="font-semibold bg-gradient-primary bg-clip-text text-transparent hover:underline">
                Regístrate
              </button>
            </p>
            <p className="text-tertiary-soft text-xs">
              ¿Eres pastor?{" "}
              <button onClick={() => setView("admin")} className="underline hover:text-white">
                Registro de administrador
              </button>
            </p>
          </div>
        </div>
      )}

      {/* FORGOT PASSWORD */}
      {view === "forgot" && (
        <div className="glass relative z-10 w-full max-w-md animate-fade-in p-8">
          <BackButton />
          <Logo size="h-24" />
          <div className="text-center mt-4 mb-6">
            <h1 className="text-2xl font-bold">Recuperar acceso</h1>
            <p className="text-secondary-soft text-sm mt-1">
              Ingresa tu correo y te enviaremos un enlace seguro para crear una nueva contraseña.
            </p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-secondary-soft" htmlFor="forgot-email">Correo electrónico</Label>
              <Input className="glass-input h-12" id="forgot-email" type="email" placeholder="correo@ejemplo.com"
                value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full btn-gradient border-0 h-12 text-base font-semibold" disabled={loading}>
              <Mail className="h-5 w-5" /> {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
          </form>
          <p className="mt-5 text-center text-xs text-tertiary-soft">
            ¿Recordaste tu contraseña?{" "}
            <button onClick={() => setView("login")} className="underline hover:text-white">
              Volver al inicio de sesión
            </button>
          </p>
        </div>
      )}

      {/* ADMIN SIGNUP */}
      {view === "admin" && (
        <div className="glass relative z-10 w-full max-w-md animate-fade-in p-8">
          <BackButton />
          <Logo size="h-24" />
          <div className="text-center mt-4 mb-6">
            <h1 className="text-2xl font-bold">Registro de Pastor</h1>
            <p className="text-secondary-soft text-sm mt-1">Requiere código de invitación</p>
          </div>
          <form onSubmit={handleAdminSignup} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-secondary-soft" htmlFor="admin-name">Nombre completo</Label>
              <Input className="glass-input h-11" id="admin-name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label className="text-secondary-soft" htmlFor="admin-email">Correo electrónico</Label>
              <Input className="glass-input h-11" id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-secondary-soft" htmlFor="admin-password">Contraseña</Label>
                <Input className="glass-input h-11" id="admin-password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label className="text-secondary-soft" htmlFor="admin-confirm">Confirmar</Label>
                <Input className="glass-input h-11" id="admin-confirm" type="password" value={adminConfirmPassword} onChange={(e) => setAdminConfirmPassword(e.target.value)} required minLength={6} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-secondary-soft" htmlFor="admin-invite">Código de invitación</Label>
              <Input className="glass-input h-11" id="admin-invite" type="password" value={adminInviteCode} onChange={(e) => setAdminInviteCode(e.target.value)} required placeholder="Provisto por el administrador" />
            </div>
            <Button type="submit" className="w-full btn-gradient border-0 h-12 text-base font-semibold" disabled={loading}>
              {loading ? "Registrando..." : "Crear Cuenta de Pastor"}
            </Button>
          </form>
        </div>
      )}

      {/* MEMBER SIGNUP */}
      {view === "member" && (
        <div className="glass relative z-10 w-full max-w-lg animate-fade-in p-8">
          <BackButton />
          <Logo size="h-24" />
          <div className="text-center mt-4 mb-6">
            <h1 className="text-2xl font-bold">Únete a la comunidad</h1>
            <p className="text-secondary-soft text-sm mt-1">Registro para miembros activos</p>
          </div>
          <form onSubmit={handleMemberSignup} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-secondary-soft" htmlFor="member-name">Nombre completo</Label>
              <Input className="glass-input h-11" id="member-name" value={memberName} onChange={(e) => setMemberName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-secondary-soft" htmlFor="member-email">Correo</Label>
                <Input className="glass-input h-11" id="member-email" type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label className="text-secondary-soft" htmlFor="member-phone">Teléfono</Label>
                <Input className="glass-input h-11" id="member-phone" type="tel" value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-secondary-soft" htmlFor="member-birth">Fecha de nacimiento</Label>
              <Input className="glass-input h-11" id="member-birth" type="date" value={memberBirthDate} onChange={(e) => setMemberBirthDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label className="text-secondary-soft" htmlFor="member-reason">Motivo de membresía</Label>
              <Textarea className="glass-input" id="member-reason" placeholder="¿Por qué deseas ser parte?" value={memberReason} onChange={(e) => setMemberReason(e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-secondary-soft" htmlFor="member-password">Contraseña</Label>
                <Input className="glass-input h-11" id="member-password" type="password" value={memberPassword} onChange={(e) => setMemberPassword(e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label className="text-secondary-soft" htmlFor="member-confirm">Confirmar</Label>
                <Input className="glass-input h-11" id="member-confirm" type="password" value={memberConfirmPassword} onChange={(e) => setMemberConfirmPassword(e.target.value)} required minLength={6} />
              </div>
            </div>
            <Button type="submit" className="w-full btn-gradient border-0 h-12 text-base font-semibold" disabled={loading}>
              {loading ? "Registrando..." : "Registrarme"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Auth;
