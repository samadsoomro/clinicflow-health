import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import PublicLayout from "./components/layout/PublicLayout";
import Index from "./pages/Index";
import LiveTokens from "./pages/LiveTokens";
import Notifications from "./pages/Notifications";
import Location from "./pages/Location";
import Contact from "./pages/Contact";
import PatientCard from "./pages/PatientCard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminDoctors from "./pages/admin/AdminDoctors";
import AdminTokens from "./pages/admin/AdminTokens";
import AdminPatients from "./pages/admin/AdminPatients";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminPatientCards from "./pages/admin/AdminPatientCards";
import AdminLocation from "./pages/admin/AdminLocation";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminRoute from "./components/AdminRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/tokens" element={<LiveTokens />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/location" element={<Location />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/patient-card" element={<PatientCard />} />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
            <Route index element={<AdminOverview />} />
            <Route path="doctors" element={<AdminDoctors />} />
            <Route path="tokens" element={<AdminTokens />} />
            <Route path="patients" element={<AdminPatients />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="cards" element={<AdminPatientCards />} />
            <Route path="location" element={<AdminLocation />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
