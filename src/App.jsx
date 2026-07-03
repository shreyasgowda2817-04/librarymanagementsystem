// src/App.jsx
import React from "react";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  Link,
  useNavigate,
  useLocation
} from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Books = lazy(() => import("./pages/Books"));
const Members = lazy(() => import("./pages/Members"));
const IssueReturn = lazy(() => import("./pages/IssueReturn"));
const Reports = lazy(() => import("./pages/Reports"));
const Membership = lazy(() => import("./pages/Membership"));
const ManagementConsole = lazy(() => import("./pages/ManagementConsole"));
const HardwareOps = lazy(() => import("./pages/HardwareOps"));
const SystemSettings = lazy(() => import("./pages/SystemSettings"));
const LibraryTools = lazy(() => import("./pages/LibraryTools"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const Acquisitions = lazy(() => import("./pages/Acquisitions"));
const StudentFines = lazy(() => import("./pages/StudentFines"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const StudyRooms = lazy(() => import("./pages/StudyRooms"));
const SeatManagement = lazy(() => import("./pages/SeatManagement"));
const KioskMode = lazy(() => import("./pages/KioskMode"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ModuleQuestions = lazy(() => import("./pages/modulequstion"));
const ResearchWorkspace = lazy(() => import("./pages/ResearchWorkspace"));
const AIExplore = lazy(() => import("./pages/AIExplore"));

import Footer from "./components/Footer";
import ChatSupport from "./components/ChatSupport";
import FocusMode from "./components/FocusMode";
import { FaBars, FaTimes, FaSignOutAlt, FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaCalendarAlt, FaInstagram, FaTwitter, FaYoutube, FaEnvelope, FaHeart, FaSun, FaMoon, FaUserEdit, FaChevronLeft, FaEye, FaGraduationCap, FaBookOpen, FaSearch, FaArrowRight, FaChartPie, FaBook, FaUsers, FaClipboardList, FaBrain } from "react-icons/fa";
import { Toaster, toast } from 'react-hot-toast';
import Layout from "./components/Layout";
import AIAssistant from "./components/AIAssistant";
import { SocketProvider } from "./hooks/useSocket";
import { FeatureProvider } from "./context/FeatureContext";

/* ---------- AUTH HELPERS ---------- */

function useAuth() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  return { user };
}

function Protected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminProtected({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/access-denied" replace />;

  return children;
}

/* ---------- ROOT APP ROUTES ---------- */

export default function App() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user && user.token) {
      try {
        // Simple base64 decode to check expiry without external lib
        const base64Url = user.token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        
        if (payload.exp * 1000 < Date.now()) {
          localStorage.removeItem("user");
          localStorage.removeItem("ai_chat_history");
          toast.error("Session expired. Please login again.");
          navigate("/login");
        }
      } catch (e) {
        console.error("Token check failed", e);
      }
    }
  }, [location.pathname, navigate, user]);

  return (
    <FeatureProvider>
      <SocketProvider>
        <Toaster position="top-right" />
        <Suspense fallback={<div className="flex h-screen items-center justify-center bg-gray-900 text-white"><div className="animate-spin h-12 w-12 border-4 border-indigo-500 rounded-full border-t-transparent"></div></div>}>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <Protected>
              <Layout>
                <Dashboard />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            <AdminProtected>
              <Layout>
                <Dashboard />
              </Layout>
            </AdminProtected>
          }
        />
        <Route path="/access-denied" element={<AccessDenied />} />

        <Route
          path="/acquisitions"
          element={
            <Protected>
              <Layout>
                <Acquisitions />
              </Layout>
            </Protected>
          }
        />

        <Route
          path="/kiosk"
          element={
            <AdminProtected>
              <KioskMode />
            </AdminProtected>
          }
        />
        <Route
          path="/books"
          element={
            <Protected>
              <Layout>
                <Books />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/research"
          element={
            <Protected>
              <Layout>
                <ResearchWorkspace />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/explore"
          element={
            <Protected>
              <Layout>
                <AIExplore />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <Protected>
              <Layout>
                <Leaderboard />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/seats"
          element={
            <Protected>
              <Layout>
                <SeatManagement />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/study-rooms"
          element={
            <Protected>
              <Layout>
                <StudyRooms />
              </Layout>
            </Protected>
          }
        />
        <Route
          path="/members"
          element={
            <AdminProtected>
              <Layout>
                <Members />
              </Layout>
            </AdminProtected>
          }
        />
        <Route
          path="/issue-return"
          element={
            <AdminProtected>
              <Layout>
                <IssueReturn />
              </Layout>
            </AdminProtected>
          }
        />
        <Route
          path="/reports"
          element={
            <AdminProtected>
              <Layout>
                <Reports />
              </Layout>
            </AdminProtected>
          }
        />
        <Route
          path="/console"
          element={
            <AdminProtected>
              <Layout>
                <ManagementConsole />
              </Layout>
            </AdminProtected>
          }
        />
        <Route
          path="/tools"
          element={
            <AdminProtected>
              <Layout>
                <LibraryTools />
              </Layout>
            </AdminProtected>
          }
        />
        <Route
          path="/hardware-ops"
          element={
            <AdminProtected>
              <Layout>
                <HardwareOps />
              </Layout>
            </AdminProtected>
          }
        />
        <Route
          path="/profile"
          element={
            <Protected>
              <Layout>
                <SystemSettings />
              </Layout>
            </Protected>
          }
        />

        <Route
          path="/membership"
          element={
            <Protected>
              <Layout>
                <Membership />
              </Layout>
            </Protected>
          }
        />

        <Route
          path="/fines"
          element={
            <Protected>
              <Layout>
                <StudentFines />
              </Layout>
            </Protected>
          }
        />

        <Route
          path="/modules/:moduleName/questions"
          element={
            <AdminProtected>
              <Layout>
                <ModuleQuestions />
              </Layout>
            </AdminProtected>
          }
        />

        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* Default */}
        <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? "/admin-dashboard" : "/dashboard") : "/"} replace />} />

      </Routes>
      </Suspense>
      <ChatSupport />
      </SocketProvider>
    </FeatureProvider>
  );
}
