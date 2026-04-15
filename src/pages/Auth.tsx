import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmailStep from "@/components/auth/EmailStep";
import PasswordStep from "@/components/auth/PasswordStep";
import AdminSignupStep from "@/components/auth/AdminSignupStep";
import MemberSignupStep from "@/components/auth/MemberSignupStep";

type AuthStep = "email" | "password" | "admin-signup" | "member-signup";

const Auth = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailContinue = (enteredEmail: string) => {
    setEmail(enteredEmail);
    setStep("password");
  };

  const handleLogin = async (password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("¡Bienvenido!");
      navigate("/");
    }
    setLoading(false);
  };

  const handleAdminSignup = async (data: { name: string; email: string; password: string }) => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.name } },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Revisa tu correo para confirmar tu cuenta de administrador.");
      setStep("email");
    }
    setLoading(false);
  };

  const handleMemberSignup = async (data: {
    name: string; email: string; phone: string;
    birthDate: string; reason: string; password: string;
  }) => {
    setLoading(true);
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.name, role: "member" } },
    });

    if (authError) {
      toast.error("Error al crear cuenta: " + authError.message);
      setLoading(false);
      return;
    }

    const { data: memberData, error: memberError } = await supabase
      .from("members")
      .insert({
        full_name: data.name,
        email: data.email,
        phone: data.phone || null,
        birth_date: data.birthDate || null,
        membership_reason: data.reason || null,
      })
      .select("id")
      .single();

    if (!memberError && memberData) {
      await supabase.from("alerts").insert({
        member_id: memberData.id,
        alert_type: "nuevo_miembro",
        description: `Nuevo miembro registrado: ${data.name}`,
        status: "pendiente",
      });
    }

    toast.success("¡Cuenta creada! Revisa tu correo para confirmar.");
    setStep("email");
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Revisa tu correo para restablecer tu contraseña.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {step === "email" && (
          <EmailStep
            onContinue={handleEmailContinue}
            onCreateAdmin={() => setStep("admin-signup")}
            onCreateMember={() => setStep("member-signup")}
          />
        )}
        {step === "password" && (
          <PasswordStep
            email={email}
            loading={loading}
            onBack={() => setStep("email")}
            onLogin={handleLogin}
            onForgotPassword={handleForgotPassword}
          />
        )}
        {step === "admin-signup" && (
          <AdminSignupStep
            loading={loading}
            onBack={() => setStep("email")}
            onSignup={handleAdminSignup}
          />
        )}
        {step === "member-signup" && (
          <MemberSignupStep
            loading={loading}
            onBack={() => setStep("email")}
            onSignup={handleMemberSignup}
          />
        )}
      </div>
    </div>
  );
};

export default Auth;
