import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export const StubPage = ({ title, body }: { title: string; body: string }) => (
  <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/60 border-b border-border/40 px-5 pt-4 pb-3">
      <Link to="/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Community
      </Link>
    </header>
    <div className="px-5 py-16 max-w-md mx-auto text-center">
      <h1 className="font-display text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-3">{body}</p>
      <p className="text-xs text-muted-foreground mt-8">Coming in the next phase ✨</p>
    </div>
  </main>
);

export const Games = () => <StubPage title="Games" body="Daily spin wheel and trivia quiz are on the way." />;
export const Leaderboard = () => <StubPage title="Leaderboard" body="Weekly and all-time pebble rankings." />;
export const Blog = () => <StubPage title="Stories" body="Editorial features about San Vicente." />;