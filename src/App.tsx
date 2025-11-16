import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";
import { AuthProvider } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import CreateClass from "./pages/CreateClass";
import Assessment from "./pages/Assessment";
import Dashboard from "./pages/Dashboard";
import Insights from "./pages/Insights";
import TeachingGuide from "./pages/TeachingGuide";
import ParentGuide from "./pages/ParentGuide";
import Worksheets from "./pages/Worksheets";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import TeacherSignIn from "./pages/auth/TeacherSignIn";
import ParentSignIn from "./pages/auth/ParentSignIn";
import TeacherSignUp from "./pages/auth/TeacherSignUp";
import ParentSignUp from "./pages/auth/ParentSignUp";
import RoleSelection from "./pages/auth/RoleSelection";
import AuthCallback from "./pages/auth/AuthCallback";
import TeacherOnboarding from "./pages/auth/TeacherOnboarding";
import StudentSelection from "./pages/StudentSelection";
import StudentAssessment from "./pages/StudentAssessment";
import StudentGuide from "./pages/StudentGuide";
import StudentCategories from "./pages/StudentCategories";

const queryClient = new QueryClient();

// Get Clerk publishable key from environment
const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

const App = () => (
  <ClerkProvider publishableKey={clerkPubKey}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LanguageProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />

              {/* Legacy routes (redirect to role-specific routes) */}
              <Route path="/sign-in" element={<SignIn />} />
              <Route path="/sign-up" element={<SignUp />} />

              {/* Role-specific auth routes */}
              <Route path="/signin/teacher" element={<TeacherSignIn />} />
              <Route path="/signin/parent" element={<ParentSignIn />} />
              <Route path="/signup/teacher" element={<TeacherSignUp />} />
              <Route path="/signup/parent" element={<ParentSignUp />} />

              {/* Role selection (for signup flow) */}
              <Route path="/select-role" element={<RoleSelection />} />

              {/* Auth callback */}
              <Route path="/auth-callback" element={<AuthCallback />} />

              {/* Teacher onboarding */}
              <Route path="/teacher-onboarding" element={<ProtectedRoute requireRole="teacher"><TeacherOnboarding /></ProtectedRoute>} />

              {/* Public student assessment routes */}
              <Route path="/student-selection/:classId" element={<StudentSelection />} />
              <Route path="/student-assessment/:classId/:studentId" element={<StudentAssessment />} />
              {/* Token-based assessment route (secure, personalized) */}
              <Route path="/student-assessment/token/:token" element={<StudentAssessment />} />

              {/* Teacher-only routes */}
              <Route path="/create-class" element={<ProtectedRoute requireRole="teacher"><Layout><CreateClass /></Layout></ProtectedRoute>} />
              <Route path="/assessment" element={<ProtectedRoute requireRole="teacher"><Layout><Assessment /></Layout></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute requireRole="teacher"><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/insights" element={<ProtectedRoute requireRole="teacher"><Layout><Insights /></Layout></ProtectedRoute>} />
              <Route path="/teaching-guide" element={<ProtectedRoute requireRole="teacher"><Layout><TeachingGuide /></Layout></ProtectedRoute>} />
              <Route path="/worksheets" element={<ProtectedRoute requireRole="teacher"><Layout><Worksheets /></Layout></ProtectedRoute>} />
              <Route path="/student-guide/:studentId" element={<ProtectedRoute requireRole="teacher"><Layout><StudentGuide /></Layout></ProtectedRoute>} />
              <Route path="/student-categories" element={<ProtectedRoute requireRole="teacher"><Layout><StudentCategories /></Layout></ProtectedRoute>} />

              {/* Parent route (accessible by both teachers and parents) */}
              <Route path="/parent-guide" element={<ProtectedRoute><Layout><ParentGuide /></Layout></ProtectedRoute>} />

              {/* Settings (accessible by all authenticated users) */}
              <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />

              {/* 404 Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </LanguageProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
