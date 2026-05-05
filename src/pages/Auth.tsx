import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Card components removed - using glass containers
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ShieldCheck, Users } from "lucide-react";
import logoCfa from "@/assets/logo-cfa.png";

const Auth = () => {
  const navigate = useNavigate();
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("¡Bienvenido!");
      navigate("/");
    }
    setLoading(false);
  };

  const handleAdminSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword !== adminConfirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (adminPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!adminInviteCode.trim()) {
      toast.error("Debes ingresar el código de invitación.");
      return;
    }
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
    }
    setLoading(false);
  };

  const handleMemberSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !memberEmail.trim()) {
      toast.error("Nombre y correo son obligatorios.");
      return;
    }
    if (!memberPassword || memberPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (memberPassword !== memberConfirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);

    // Create auth account with member role
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: memberEmail.trim(),
      password: memberPassword,
      options: {
        data: {
          full_name: memberName.trim(),
          role: "member",
        },
      },
    });

    if (authError) {
      toast.error("Error al crear cuenta: " + authError.message);
      setLoading(false);
      return;
    }

    // Insert into members table
    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .insert({
        full_name: memberName.trim(),
        email: memberEmail.trim(),
        phone: memberPhone.trim() || null,
        birth_date: memberBirthDate || null,
        membership_reason: memberReason.trim() || null,
      })
      .select("id")
      .single();

    if (!memberError && memberData) {
      await supabase.from("alerts").insert({
        member_id: memberData.id,
        alert_type: "nuevo_miembro",
        description: `Nuevo miembro registrado: ${memberName.trim()}`,
        status: "pendiente",
      });
    }

    toast.success("¡Cuenta creada! Revisa tu correo para confirmar.");
    setMemberName("");
    setMemberEmail("");
    setMemberPhone("");
    setMemberBirthDate("");
    setMemberReason("");
    setMemberPassword("");
    setMemberConfirmPassword("");
    setLoading(false);
  };

  return (
    <div className="halos relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div className="halo-blue" />
      <div className="glass relative z-10 w-full max-w-lg animate-fade-in p-8">
        <div className="text-center mb-6">
          <img
            src={logoCfa}
            alt="Centro Familiar de Alabanza"
            className="mx-auto mb-4 h-40 w-auto drop-shadow-[0_10px_30px_rgba(255,94,138,0.35)]"
          />
          <h1 className="text-2xl font-bold text-white">Asistencia CFA</h1>
          <p className="text-secondary-soft text-sm mt-1">Sistema de registro de asistencia y seguimiento</p>
        </div>
        <div>

          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10">
              <TabsTrigger value="login">Ingresar</TabsTrigger>
              <TabsTrigger value="admin">
                <ShieldCheck className="h-4 w-4 mr-1" />
                Pastor
              </TabsTrigger>
              <TabsTrigger value="member">
                <Users className="h-4 w-4 mr-1" />
                Miembro
              </TabsTrigger>
            </TabsList>

            {/* Login */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="login-email">Correo electrónico</Label>
                  <Input className="glass-input" id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="login-password">Contraseña</Label>
                  <Input className="glass-input" id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full btn-gradient border-0" disabled={loading}>
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </form>
            </TabsContent>

            {/* Admin / Pastor signup */}
            <TabsContent value="admin">
              <form onSubmit={handleAdminSignup} className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Registro para pastores y administradores del sistema.</p>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="admin-name">Nombre completo</Label>
                  <Input className="glass-input" id="admin-name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="admin-email">Correo electrónico</Label>
                  <Input className="glass-input" id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="admin-password">Contraseña</Label>
                  <Input className="glass-input" id="admin-password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="admin-confirm">Confirmar contraseña</Label>
                  <Input className="glass-input" id="admin-confirm" type="password" value={adminConfirmPassword} onChange={(e) => setAdminConfirmPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="admin-invite">Código de invitación</Label>
                  <Input className="glass-input" id="admin-invite" type="password" value={adminInviteCode} onChange={(e) => setAdminInviteCode(e.target.value)} required placeholder="Provisto por el administrador" />
                </div>
                <Button type="submit" className="w-full btn-gradient border-0" disabled={loading}>
                  {loading ? "Registrando..." : "Crear Cuenta de Pastor"}
                </Button>
              </form>
            </TabsContent>

            {/* Member signup */}
            <TabsContent value="member">
              <form onSubmit={handleMemberSignup} className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Registro para miembros activos de la iglesia.</p>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="member-name">Nombre completo</Label>
                  <Input className="glass-input" id="member-name" value={memberName} onChange={(e) => setMemberName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="member-email">Correo electrónico</Label>
                  <Input className="glass-input" id="member-email" type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="member-phone">Teléfono</Label>
                  <Input className="glass-input" id="member-phone" type="tel" value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="member-birth">Fecha de nacimiento</Label>
                  <Input className="glass-input" id="member-birth" type="date" value={memberBirthDate} onChange={(e) => setMemberBirthDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="member-reason">Motivo de membresía</Label>
                  <Textarea className="glass-input" id="member-reason" placeholder="¿Por qué deseas ser parte de nuestra comunidad?" value={memberReason} onChange={(e) => setMemberReason(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="member-password">Contraseña</Label>
                  <Input className="glass-input" id="member-password" type="password" value={memberPassword} onChange={(e) => setMemberPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label className="text-secondary-soft" htmlFor="member-confirm">Confirmar contraseña</Label>
                  <Input className="glass-input" id="member-confirm" type="password" value={memberConfirmPassword} onChange={(e) => setMemberConfirmPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full btn-gradient border-0" disabled={loading}>
                  {loading ? "Registrando..." : "Registrarme como Miembro"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Auth;
