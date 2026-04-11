import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ClinicProvider } from "@/hooks/useClinicContext";
import PublicLayout from "./components/layout/PublicLayout";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy-loaded routes
const Index = lazy(() => import("./pages/Index"));
const LiveTokens = lazy(() => import("./pages/LiveTokens"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Location = lazy(() => import("./pages/Location"));
const Contact = lazy(() => import("./pages/Contact"));
const PatientCard = lazy(() => import("./pages/PatientCard"));
const PatientMessages = lazy(() => import("./pages/PatientMessages"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const TokenDisplay = lazy(() => import("./pages/TokenDisplay"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminDoctors = lazy(() => import("./pages/admin/AdminDoctors"));
const AdminTokens = lazy(() => import("./pages/admin/AdminTokens"));
const AdminPatients = lazy(() => import("./pages/admin/AdminPatients"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const AdminPatientCards = lazy(() => import("./pages/admin/AdminPatientCards"));
const AdminLocation = lazy(() => import("./pages/admin/AdminLocation"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminHomepage = lazy(() => import("./pages/admin/AdminHomepage"));
const AdminContactMessages = lazy(() => import("./pages/admin/AdminContactMessages"));
const AdminRoute = lazy(() => import("./components/AdminRoute"));
const SuperAdminLayout = lazy(() => import("./pages/superadmin/SuperAdminLayout"));
const SuperAdminOverview = lazy(() => import("./pages/superadmin/SuperAdminOverview"));
const SuperAdminClinics = lazy(() => import("./pages/superadmin/SuperAdminClinics"));
const SuperAdminAdmins = lazy(() => import("./pages/superadmin/SuperAdminAdmins"));
const SuperAdminSettings = lazy(() => import("./pages/superadmin/SuperAdminSettings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <ClinicProvider>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route element={<PublicLayout />}>
                      <Route path="/" element={<Index />} />
                      <Route path="/tokens" element={<LiveTokens />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/location" element={<Location />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/patient-card" element={<PatientCard />} />
                      <Route path="/messages" element={<PatientMessages />} />
                    </Route>

                    <Route path="/token" element={<TokenDisplay />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
                      <Route index element={<AdminOverview />} />
                      <Route path="homepage" element={<AdminHomepage />} />
                      <Route path="doctors" element={<AdminDoctors />} />
                      <Route path="tokens" element={<AdminTokens />} />
                      <Route path="patients" element={<AdminPatients />} />
                      <Route path="notifications" element={<AdminNotifications />} />
                      <Route path="cards" element={<AdminPatientCards />} />
                      <Route path="location" element={<AdminLocation />} />
                      <Route path="contact-messages" element={<AdminContactMessages />} />
                      <Route path="settings" element={<AdminSettings />} />
                    </Route>

                    <Route path="/superadmin" element={<SuperAdminLayout />}>
                      <Route index element={<SuperAdminOverview />} />
                      <Route path="clinics" element={<SuperAdminClinics />} />
                      <Route path="admins" element={<SuperAdminAdmins />} />
                      <Route path="settings" element={<SuperAdminSettings />} />
                    </Route>

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </ClinicProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
