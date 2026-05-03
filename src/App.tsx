import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/ui/components/ui/sonner";
import { Toaster } from "@/ui/components/ui/toaster";
import { TooltipProvider } from "@/ui/components/ui/tooltip";
import Index from "./ui/pages/Index.tsx";
import NotFound from "./ui/pages/NotFound.tsx";
import Auth from "./ui/pages/Auth.tsx";
import Community from "./ui/pages/community/Community.tsx";
import { Games, Leaderboard, Blog } from "./ui/pages/community/Stub.tsx";
import AdminCommunity from "./ui/pages/admin/AdminCommunity.tsx";
import { AuthProvider } from "./logic/contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/games" element={<Games />} />
            <Route path="/community/leaderboard" element={<Leaderboard />} />
            <Route path="/community/blog" element={<Blog />} />
            <Route path="/admin/community" element={<AdminCommunity />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
