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
import { useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import Members from "./pages/Members";
import IssueReturn from "./pages/IssueReturn";
import Reports from "./pages/Reports";
import Membership from "./pages/Membership";
import ManagementConsole from "./pages/ManagementConsole";
import HardwareOps from "./pages/HardwareOps";
import SystemSettings from "./pages/SystemSettings";
import LibraryTools from "./pages/LibraryTools";
import LandingPage from "./pages/LandingPage";
import AccessDenied from "./pages/AccessDenied";
import Acquisitions from "./pages/Acquisitions";
import StudentFines from "./pages/StudentFines";
import Leaderboard from "./pages/Leaderboard";
import StudyRooms from "./pages/StudyRooms";
import SeatManagement from "./pages/SeatManagement";
import KioskMode from "./pages/KioskMode";

import Footer from "./components/Footer";
import ChatSupport from "./components/ChatSupport";
import FocusMode from "./components/FocusMode";
import { FaBars, FaTimes, FaSignOutAlt, FaBell, FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaCalendarAlt, FaInstagram, FaTwitter, FaYoutube, FaEnvelope, FaHeart, FaSun, FaMoon, FaUserEdit, FaChevronLeft, FaEye, FaGraduationCap, FaBookOpen, FaSearch, FaArrowRight, FaChartPie, FaBook, FaUsers, FaClipboardList, FaBrain } from "react-icons/fa";
import { Toaster, toast } from 'react-hot-toast';
import Layout from "./components/Layout";
import AIAssistant from "./components/AIAssistant";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import ModuleQuestions from "./pages/modulequstion";
import ResearchWorkspace from "./pages/ResearchWorkspace";
import AIExplore from "./pages/AIExplore";
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
      <ChatSupport />
      </SocketProvider>
    </FeatureProvider>
  );
}
