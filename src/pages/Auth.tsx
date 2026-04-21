import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Church, ShieldCheck, Users } from "lucide-react";

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
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: { data: { full_name: adminName } },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Revisa tu correo para confirmar tu cuenta de administrador.");
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg animate-fade-in">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary">
            <Church className="h-7 w-7 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Asistencia Iglesia</CardTitle>
          <CardDescription>Sistema de registro de asistencia y seguimiento</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-3">
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
                  <Label htmlFor="login-email">Correo electrónico</Label>
                  <Input id="login-email" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Ingresando..." : "Ingresar"}
                </Button>
              </form>
            </TabsContent>

            {/* Admin / Pastor signup */}
            <TabsContent value="admin">
              <form onSubmit={handleAdminSignup} className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Registro para pastores y administradores del sistema.</p>
                <div className="space-y-2">
                  <Label htmlFor="admin-name">Nombre completo</Label>
                  <Input id="admin-name" value={adminName} onChange={(e) => setAdminName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Correo electrónico</Label>
                  <Input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password">Contraseña</Label>
                  <Input id="admin-password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-confirm">Confirmar contraseña</Label>
                  <Input id="admin-confirm" type="password" value={adminConfirmPassword} onChange={(e) => setAdminConfirmPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registrando..." : "Crear Cuenta de Pastor"}
                </Button>
              </form>
            </TabsContent>

            {/* Member signup */}
            <TabsContent value="member">
              <form onSubmit={handleMemberSignup} className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Registro para miembros activos de la iglesia.</p>
                <div className="space-y-2">
                  <Label htmlFor="member-name">Nombre completo</Label>
                  <Input id="member-name" value={memberName} onChange={(e) => setMemberName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-email">Correo electrónico</Label>
                  <Input id="member-email" type="email" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-phone">Teléfono</Label>
                  <Input id="member-phone" type="tel" value={memberPhone} onChange={(e) => setMemberPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-birth">Fecha de nacimiento</Label>
                  <Input id="member-birth" type="date" value={memberBirthDate} onChange={(e) => setMemberBirthDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-reason">Motivo de membresía</Label>
                  <Textarea id="member-reason" placeholder="¿Por qué deseas ser parte de nuestra comunidad?" value={memberReason} onChange={(e) => setMemberReason(e.target.value)} rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-password">Contraseña</Label>
                  <Input id="member-password" type="password" value={memberPassword} onChange={(e) => setMemberPassword(e.target.value)} required minLength={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-confirm">Confirmar contraseña</Label>
                  <Input id="member-confirm" type="password" value={memberConfirmPassword} onChange={(e) => setMemberConfirmPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registrando..." : "Registrarme como Miembro"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
