import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, MessageSquare, QrCode, Target, Sparkles, BarChart3, HelpCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

const PASSKEY = "5309";

const sections = [
  { key: "blog", label: "Blog stories", icon: BookOpen, desc: "Create and publish editorial posts" },
  { key: "posts", label: "Approve posts", icon: MessageSquare, desc: "Review pending reviews & photos" },
  { key: "qr", label: "QR codes", icon: QrCode, desc: "Generate codes for businesses" },
  { key: "challenges", label: "Challenges", icon: Target, desc: "Daily / weekly missions" },
  { key: "trivia", label: "Trivia", icon: HelpCircle, desc: "Quiz questions for the community" },
  { key: "pebbles", label: "Pebbles", icon: Sparkles, desc: "Manually adjust user balances" },
  { key: "analytics", label: "Analytics", icon: BarChart3, desc: "Engagement at a glance" },
] as const;

const AdminCommunity = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const ok = sessionStorage.getItem("svl_admin") === "1";
    if (ok) {
      setAuthed(true);
      return;
    }
    const code = window.prompt("Enter admin passkey");
    if (code?.trim() === PASSKEY) {
      sessionStorage.setItem("svl_admin", "1");
      setAuthed(true);
    } else {
      navigate("/", { replace: true });
    }
  }, [navigate]);

  if (!authed) return null;

  return (
    <main className="min-h-screen bg-background text-foreground pb-10">
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/40 px-5 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <h1 className="font-display text-lg font-bold">
            Community <span className="ml-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-semibold uppercase tracking-wider">Admin</span>
          </h1>
          <span className="w-12" />
        </div>
      </header>

      <div className="px-5 pt-5">
        <p className="text-sm text-muted-foreground mb-4">
          Phase 1 shell — sections are placeholders. We'll wire each tool in the next phase.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {sections.map((s) => (
            <Card key={s.key} className="p-4 border-border/60 hover:border-accent/40 transition cursor-pointer">
              <s.icon className="h-5 w-5 text-accent mb-2" />
              <p className="font-semibold text-sm">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
};

export default AdminCommunity;