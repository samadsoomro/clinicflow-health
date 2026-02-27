import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PublicLayout from "./components/layout/PublicLayout";
import Index from "./pages/Index";
import LiveTokens from "./pages/LiveTokens";
import Notifications from "./pages/Notifications";
import Location from "./pages/Location";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public pages with shared layout */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/tokens" element={<LiveTokens />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/location" element={<Location />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Auth pages (no shared layout) */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin dashboard */}
          <Route path="/admin" element={<AdminDashboard />}>
            <Route index element={<AdminOverview />} />
            <Route path="doctors" element={<AdminPlaceholder title="Manage Doctors" />} />
            <Route path="tokens" element={<AdminPlaceholder title="Token Management" />} />
            <Route path="patients" element={<AdminPlaceholder title="Patient List" />} />
            <Route path="notifications" element={<AdminPlaceholder title="Manage Notifications" />} />
            <Route path="cards" element={<AdminPlaceholder title="Patient Card Designer" />} />
            <Route path="location" element={<AdminPlaceholder title="Location & Contact" />} />
            <Route path="settings" element={<AdminPlaceholder title="Clinic Settings" />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
