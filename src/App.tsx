import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import Community from "./pages/community/Community.tsx";
import { Games, Leaderboard, Blog } from "./pages/community/Stub.tsx";
import BlogDetail from "./pages/community/BlogDetail.tsx";
import AdminCommunity from "./pages/admin/AdminCommunity.tsx";
import { AuthProvider } from "./contexts/AuthContext";

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
            <Route path="/community/blog/:slug" element={<BlogDetail />} />
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
