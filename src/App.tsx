import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AdminRoute from "@/components/auth/AdminRoute";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Loader2 } from "lucide-react";

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────
// Each page is only downloaded when the user first navigates to it,
// reducing the initial bundle size significantly.

const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Plans = lazy(() => import("./pages/Plans"));
const Transactions = lazy(() => import("./pages/Transactions"));
const TransactionDetail = lazy(() => import("./pages/TransactionDetail"));
const Deposit = lazy(() => import("./pages/Deposit"));
const Withdraw = lazy(() => import("./pages/Withdraw"));
const Wallets = lazy(() => import("./pages/Wallets"));
const Settings = lazy(() => import("./pages/Settings"));
const KYCVerification = lazy(() => import("./pages/KYCVerification"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const AdminOverview = lazy(() => import("./pages/admin/AdminOverview"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminKYC = lazy(() => import("./pages/admin/AdminKYC"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminPlans = lazy(() => import("./pages/admin/AdminPlans"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminInvestments = lazy(() => import("./pages/admin/AdminInvestments"));
const AdminBonus = lazy(() => import("./pages/admin/AdminBonus"));
const AdminReferrals = lazy(() => import("./pages/admin/AdminReferrals"));
const NotFound = lazy(() => import("./pages/NotFound"));

// ─── Query client ─────────────────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 60 seconds before a background refetch
      staleTime: 60_000,
      // Retry failed queries once before showing an error
      retry: 1,
    },
  },
});

// ─── Page loader ──────────────────────────────────────────────────────────────

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <Loader2 className="w-6 h-6 animate-spin text-primary" />
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* Protected user routes */}
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
                    <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                    <Route path="/transactions/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />
                    <Route path="/deposit" element={<ProtectedRoute><Deposit /></ProtectedRoute>} />
                    <Route path="/withdraw" element={<ProtectedRoute><Withdraw /></ProtectedRoute>} />
                    <Route path="/wallets" element={<ProtectedRoute><Wallets /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/kyc" element={<ProtectedRoute><KYCVerification /></ProtectedRoute>} />
                    <Route path="/activity" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />

                    {/* Protected admin routes */}
                    <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
                    <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                    <Route path="/admin/kyc" element={<AdminRoute><AdminKYC /></AdminRoute>} />
                    <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
                    <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
                    <Route path="/admin/plans" element={<AdminRoute><AdminPlans /></AdminRoute>} />
                    <Route path="/admin/investments" element={<AdminRoute><AdminInvestments /></AdminRoute>} />
                    <Route path="/admin/bonus" element={<AdminRoute><AdminBonus /></AdminRoute>} />
                    <Route path="/admin/referrals" element={<AdminRoute><AdminReferrals /></AdminRoute>} />

                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
