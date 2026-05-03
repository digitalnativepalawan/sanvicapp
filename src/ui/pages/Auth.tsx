import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/logic/integrations/supabase/client";
import { lovable } from "@/logic/integrations/lovable/index";
import { useAuth } from "@/logic/contexts/AuthContext";
import { Button } from "@/ui/components/ui/button";
import { Input } from "@/ui/components/ui/input";
import { Label } from "@/ui/components/ui/label";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const emailSchema = z.string().trim().email("Invalid email").max(255);
const passwordSchema = z.string().min(6, "Min 6 characters").max(72);

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/community", { replace: true });
  }, [user, loading, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailParse = emailSchema.safeParse(email);
    const pwParse = passwordSchema.safeParse(password);
    if (!emailParse.success) return toast.error(emailParse.error.errors[0].message);
    if (!pwParse.success) return toast.error(pwParse.error.errors[0].message);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: emailParse.data,
          password: pwParse.data,
          options: {
            emailRedirectTo: `${window.location.origin}/community`,
            data: { display_name: displayName.trim() || undefined },
          },
        });
        if (error) throw error;
        toast.success("Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailParse.data,
          password: pwParse.data,
        });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/community`,
      });
      if (result.error) toast.error("Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-5 pt-4 pb-3 border-b border-border/40">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-bold tracking-tight text-center">
            {mode === "signin" ? "Welcome back" : "Join the community"}
          </h1>
          <p className="text-center text-muted-foreground mt-2 text-sm">
            San Vicente <span className="text-accent font-semibold">Live</span>
          </p>

          <Button
            type="button"
            variant="outline"
            className="w-full mt-6 h-11 rounded-xl"
            onClick={handleGoogle}
            disabled={busy}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path fill="#EA4335" d="M12 5c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.4 1.6 14.9.5 12 .5 7.3.5 3.3 3.2 1.4 7l3.6 2.8C5.9 7 8.7 5 12 5z"/>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.7-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"/>
              <path fill="#FBBC05" d="M5 14.2c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2L1.4 7C.5 8.5 0 10.2 0 12s.5 3.5 1.4 5l3.6-2.8z"/>
              <path fill="#34A853" d="M12 23.5c3.2 0 5.9-1.1 7.8-2.9l-3.7-2.9c-1 .7-2.4 1.2-4.1 1.2-3.3 0-6.1-2-7-4.8L1.4 17C3.3 20.8 7.3 23.5 12 23.5z"/>
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name" className="text-xs">Display name</Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1 rounded-xl" maxLength={80} />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-xs">Email</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="pw" className="text-xs">Password</Label>
              <Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 rounded-xl" />
            </div>
            <Button type="submit" disabled={busy} className="w-full h-11 rounded-xl bg-accent hover:bg-accent/90 text-accent-foreground">
              {mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-accent font-medium">
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Auth;