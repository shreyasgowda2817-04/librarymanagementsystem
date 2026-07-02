import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaUser, FaBell, FaGraduationCap, FaCreditCard, FaShieldAlt,
  FaCogs, FaUsers, FaPlug, FaDatabase, FaSave, FaSignOutAlt,
  FaTrash, FaKey, FaGlobe, FaPlay, FaCheckCircle, FaExclamationTriangle,
  FaCamera, FaChevronRight, FaClock, FaHistory, FaDownload, FaRobot,
  FaEnvelope, FaLaptop, FaLock, FaHeadset, FaSun, FaMoon, FaMobileAlt,
  FaEye, FaEyeSlash, FaSyncAlt, FaBookOpen, FaUniversalAccess
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { io } from "socket.io-client";
import { API_URL } from "../config";
import { Activity } from "lucide-react";
import { useFeature } from "../context/FeatureContext";

export default function SystemSettings() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin";
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'account');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSynced, setLastSynced] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [apiError, setApiError] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [socketStatus, setSocketStatus] = useState("disconnected");
  const [notifPage, setNotifPage] = useState(1);
  const [notifFilter, setNotifFilter] = useState("all");
  const { featureFlags, setFeatureFlags } = useFeature();
  const [cronJobs, setCronJobs] = useState([]);
  const [isBackupRunning, setIsBackupRunning] = useState(false);
  const [isCacheClearing, setIsCacheClearing] = useState(false);
  const [billingCycle, setBillingCycle] = useState("semester");
  const [activeBorrows, setActiveBorrows] = useState(0);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardInput, setCardInput] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [cardDetails, setCardDetails] = useState(() => {
    const saved = localStorage.getItem("mock_card_details");
    return saved ? JSON.parse(saved) : { last4: "4242", brand: "Visa", expiry: "12/29", name: user?.name || "Cardholder Name" };
  });
  const NOTIF_PER_PAGE = 10;

  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const saveTimerRef = useRef(null);
  const navigate = useNavigate();


  // Unified State for all settings
  const [settings, setSettings] = useState({
    // Account
    fullName: user?.name || "",
    username: user?.username || user?.email?.split('@')[0] || "",
    email: user?.email || "",
    avatar: null,

    // Notifications
    emailNotifs: {
      courseUpdates: true,
      deadlines: true,
      announcements: false
    },
    appNotifs: {
      courseUpdates: true,
      deadlines: true,
      announcements: true
    },

    // Learning Preferences
    language: "English",
    playbackSpeed: "1.0",
    subtitles: true,
    autoResume: true,

    // Platform (Admin)
    siteName: "Library PRO",
    maintenanceMode: false,
    defaultLang: "English",

    // Course Settings (Admin)
    autoApprove: false,
    enableReviews: true,
    defaultVisibility: "Public",
    maxUploadSize: 50,

    // Security
    require2FA: false,
    sessionTimeout: "60",
    visibility: "Public",
    profileVisible: true,
    activityVisible: true,

    // Appearance
    accentColor: "#4f46e5",
    fontSize: "medium",

    // Regional
    timezone: "IST",
    dateFormat: "DD/MM/YYYY",
    currency: "INR",
    autoRenewal: true,
    billingAddress: "",
    taxId: "",

    // Notification Preferences
    notifFrequency: "instant",
    emailCategories: {
      reminders: true,
      payments: true,
      updates: true
    },

    // Integrations
    stripeKey: "",
    zoomKey: "",
    googleCloudKey: "",
    openaiKey: ""
  });

  const fetchData = async () => {
    if (!user || !user.token) return;
    try {
      setIsLoading(true);
      setApiError(null);
      const headers = { Authorization: `Bearer ${user.token}` };

      const [sysRes, userRes, usersRes, sessRes, notifRes, auditRes, apiKeysRes] = await Promise.all([
        fetch(`${API_URL}/api/settings`, { headers, credentials: 'include' }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/auth/me`, { headers, credentials: 'include' }).catch(() => ({ ok: false })),
        isAdmin ? fetch(`${API_URL}/api/auth/users`, { headers, credentials: 'include' }).catch(() => ({ ok: false, json: () => [] })) : Promise.resolve({ ok: true, json: () => [] }),
        fetch(`${API_URL}/api/auth/sessions`, { headers, credentials: 'include' }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/notifications`, { headers, credentials: 'include' }).catch(() => ({ ok: false })),
        isAdmin ? fetch(`${API_URL}/api/audit`, { headers, credentials: 'include' }).catch(() => ({ ok: false, json: () => [] })) : Promise.resolve({ ok: true, json: () => [] }),
        fetch(`${API_URL}/api/auth/api-keys`, { headers, credentials: 'include' }).catch(() => ({ ok: false, json: () => [] }))
      ]);

      if (sysRes.ok && userRes.ok) {
        const sysData = await sysRes.json();
        const userData = await userRes.json();
        const membersData = await usersRes.json();

        setAllUsers(membersData);
        setSettings(prev => ({
          ...prev,
          ...sysData,
          fullName: userData.name || prev.fullName,
          email: userData.email || prev.email,
          username: userData.username || prev.username,
          avatar: userData.profilePhoto || prev.avatar,
          points: userData.points || 0,
          paymentHistory: userData.paymentHistory || [],
          aiQueriesCount: userData.aiQueriesCount || 0,
          ...(userData.preferences || {}),
          theme: localStorage.getItem('theme') || "system"
        }));
      } else {
        throw new Error("Failed to load primary configurations");
      }

      if (sessRes && sessRes.ok) setSessions(await sessRes.json());
      if (notifRes && notifRes.ok) setNotifications(await notifRes.json());
      if (auditRes && auditRes.ok) setAuditLogs(await auditRes.json());
      if (apiKeysRes && apiKeysRes.ok) setApiKeys(await apiKeysRes.json());

      // Fetch my active borrows
      try {
        const txRes = await fetch(`${API_URL}/api/transactions/my`, { headers, credentials: 'include' });
        if (txRes.ok) {
          const myTxs = await txRes.json();
          const activeLoans = myTxs.filter(t => !t.returned).length;
          setActiveBorrows(activeLoans);
        }
      } catch (err) {
        console.error("Error fetching my transactions:", err);
      }

      if (isAdmin) {
        const [cronRes, configRes] = await Promise.all([
          fetch(`${API_URL}/api/automation/status`, { headers, credentials: 'include' }).catch(() => ({ ok: false })),
          fetch(`${API_URL}/api/config/features`, { headers, credentials: 'include' }).catch(() => ({ ok: false }))
        ]);
        if (cronRes && cronRes.ok) setCronJobs(await cronRes.json());
        // featureFlags is now handled globally in FeatureContext
      }

    } catch (err) {
      console.error("Sync Error:", err);
      setApiError(err.message || "Failed to load settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Socket.io Connection
    const newSocket = io(API_URL);
    newSocket.on("connect", () => {
      setSocketStatus("connected");
      if (user?._id) newSocket.emit("join", user._id);
    });

    newSocket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    newSocket.on("notification:new", (notification) => {
      toast.success(`New Notification: ${notification.title}`);
      setNotifications(prev => [notification, ...prev]);
    });

    // Dropdown click-outside handler
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      newSocket.disconnect();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [user?.token, isAdmin]);

  const handleChange = (path, value) => {
    const keys = path.split('.');
    let updatedSettings;
    if (keys.length === 1) {
      updatedSettings = { ...settings, [path]: value };
    } else {
      updatedSettings = {
        ...settings,
        [keys[0]]: { ...settings[keys[0]], [keys[1]]: value }
      };
    }
    setSettings(updatedSettings);

    // Theme special case – apply immediately
    if (path === 'theme') {
      if (value === 'dark') { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
      else if (value === 'light') { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
      else { localStorage.removeItem('theme'); document.documentElement.classList.toggle('dark', window.matchMedia('(prefers-color-scheme: dark)').matches); }
      window.dispatchEvent(new Event('themeChange'));
    }

    // Instantly update localStorage and apply visual changes
    try {
      const localUser = JSON.parse(localStorage.getItem('user') || "{}");
      const tempUser = {
        ...localUser,
        preferences: {
          ...localUser.preferences,
          ...updatedSettings, // This merges the flat settings object, which is good enough for visual updates
          fontSize: path === 'fontSize' ? value : (localUser.preferences?.fontSize || 'medium'),
          accentColor: path === 'accentColor' ? value : (localUser.preferences?.accentColor || '#4f46e5')
        }
      };
      localStorage.setItem('user', JSON.stringify(tempUser));
      window.dispatchEvent(new Event("preferences_updated"));
    } catch (e) {}

    // Debounced auto-save (600ms)
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => debouncedSave(updatedSettings), 600);
  };

  const debouncedSave = async (updatedSettings) => {
    setIsSaving(true);
    try {
      const userTabs = ['account', 'notifications', 'preferences', 'privacy', 'activity', 'history', 'export', 'accessibility', 'reading'];
      if (userTabs.includes(activeTab)) {
        const response = await fetch(`${API_URL}/api/auth/profile`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
          body: JSON.stringify({
            name: updatedSettings.fullName,
            securitySettings: {
              twoFactor: updatedSettings.require2FA
            },
            preferences: {
              theme: updatedSettings.theme,
              language: updatedSettings.language,
              notifFrequency: updatedSettings.notifFrequency,
              timezone: updatedSettings.timezone,
              dateFormat: updatedSettings.dateFormat,
              currency: updatedSettings.currency,
              autoRenewal: updatedSettings.autoRenewal,
              billingAddress: updatedSettings.billingAddress,
              taxId: updatedSettings.taxId,
              accentColor: updatedSettings.accentColor,
              fontSize: updatedSettings.fontSize,
              profileVisible: updatedSettings.profileVisible,
              activityVisible: updatedSettings.activityVisible,
              emailCategories: updatedSettings.emailCategories,
              emailNotifications: updatedSettings.emailNotifs,
              appNotifications: updatedSettings.appNotifs
            }
          })
        });
        if (response.ok) {
          const data = await response.json();
          const localUser = JSON.parse(localStorage.getItem('user') || "{}");
          const updatedUser = {
            ...localUser,
            name: data.name,
            preferences: data.preferences,
            securitySettings: data.securitySettings
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        await fetch(`${API_URL}/api/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
          body: JSON.stringify(updatedSettings)
        });
      }
      setLastSynced(new Date());
    } catch (err) {
      console.error("Auto-save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = () => {
    // Now redundant but kept for UI structure if needed
    toast.success("All changes are already synced to cloud!");
  };

  const handlePasswordUpdate = async () => {
    if (!newPassword) return toast.error("Please enter a new password");
    const toastId = toast.loading("Updating password...");
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ password: newPassword })
      });
      if (!res.ok) throw new Error();
      toast.success("Password updated successfully", { id: toastId });
      setShowPasswordModal(false);
      setNewPassword("");
    } catch (err) {
      toast.error("Failed to update password", { id: toastId });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("ai_chat_history");
    toast.success("Signed out successfully");
    navigate("/login");
  };

  const markAsRead = async (id) => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await fetch(`${API_URL}/api/notifications/read/${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      }
    } catch (e) {
      console.error("Failed to mark as read", e);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
      }
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications?")) return;
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await fetch(`${API_URL}/api/notifications/clear-all`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setNotifications([]);
        toast.success("All notifications cleared");
      }
    } catch (e) {
      console.error("Failed to clear notifications", e);
      toast.error("Failed to clear notifications");
    }
  };


  const logoutSession = async (sid) => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await fetch(`${API_URL}/api/auth/sessions/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ sessionId: sid })
      });
      if (res.ok) {
        setSessions(sessions.filter(s => s.sessionId !== sid));
        toast.success("Session Terminated");
        const userObj = JSON.parse(localStorage.getItem("user") || "{}");
        if (sid === userObj.sessionId) {
          localStorage.removeItem("user");
          localStorage.removeItem("ai_chat_history");
          navigate("/login");
        }
      }
    } catch (e) { toast.error("Failed to terminate session"); }
  };

  const logoutAllSessions = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await fetch(`${API_URL}/api/auth/sessions/logout-all`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        localStorage.removeItem("user");
        localStorage.removeItem("ai_chat_history");
        navigate("/login");
        toast.success("All Sessions Logged Out");
      }
    } catch (e) { toast.error("Failed to logout sessions"); }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePhoto", file);

    const toastId = toast.loading("Uploading profile photo...");
    try {
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${user?.token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      toast.success("Profile photo updated successfully!", { id: toastId });

      setSettings(prev => ({ ...prev, avatar: data.profilePhoto }));
      const updatedUser = { ...user, profilePhoto: data.profilePhoto, token: data.token || user.token };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      toast.error(err.message || "Failed to upload photo", { id: toastId });
    }
  };

  const handlePromoteUser = async (memberId) => {
    const userToUpdate = allUsers.find(u => u._id === memberId);
    if (!userToUpdate) return;
    const isCurrentlyAdmin = userToUpdate.role === 'admin';
    const endpoint = isCurrentlyAdmin ? 'demote' : 'promote';
    const actionText = isCurrentlyAdmin ? 'Demoting to student...' : 'Promoting to admin...';
    
    const toastId = toast.loading(actionText);
    try {
      const res = await fetch(`${API_URL}/api/auth/${endpoint}/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update role");
      
      toast.success(data.message || "User role updated successfully", { id: toastId });
      
      // Reload users list
      const usersRes = await fetch(`${API_URL}/api/auth/users`, { 
        headers: { Authorization: `Bearer ${user?.token}` } 
      });
      if (usersRes.ok) setAllUsers(await usersRes.json());
    } catch (err) {
      toast.error(err.message || "Failed to update role", { id: toastId });
    }
  };

  const handleRunBackup = async () => {
    setIsBackupRunning(true);
    const toastId = toast.loading("Archiving database snapshot...");
    try {
      const res = await fetch(`${API_URL}/api/admin/backup`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message, { id: toastId });
    } catch (err) {
      toast.error(err.message || "Backup failed", { id: toastId });
    } finally {
      setIsBackupRunning(false);
    }
  };

  const handleClearCache = async () => {
    setIsCacheClearing(true);
    const toastId = toast.loading("Flushing temporary cache buffers...");
    try {
      const res = await fetch(`${API_URL}/api/admin/clear-cache`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success(data.message, { id: toastId });
    } catch (err) {
      toast.error(err.message || "Failed to clear cache", { id: toastId });
    } finally {
      setIsCacheClearing(false);
    }
  };

  const handleToggleCron = async (id) => {
    const toastId = toast.loading("Updating job configuration...");
    try {
      const res = await fetch(`${API_URL}/api/automation/toggle`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success(data.message, { id: toastId });
      setCronJobs(prev => prev.map(job => job.id === id ? { ...job, enabled: !job.enabled } : job));
    } catch (err) {
      toast.error(err.message || "Failed to update configuration", { id: toastId });
    }
  };

  const handleRunCron = async (id) => {
    const toastId = toast.loading("Executing background task...");
    try {
      const res = await fetch(`${API_URL}/api/automation/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success(data.message, { id: toastId });
      setCronJobs(prev => prev.map(job => job.id === id ? { ...job, lastRun: new Date().toISOString() } : job));
    } catch (err) {
      toast.error(err.message || "Task execution failed", { id: toastId });
    }
  };

  const handleToggleFeature = async (flagName) => {
    const updatedFlags = { ...featureFlags, [flagName]: !featureFlags[flagName] };
    setFeatureFlags(updatedFlags);
    try {
      const res = await fetch(`${API_URL}/api/config/features`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({ [flagName]: updatedFlags[flagName] })
      });
      if (!res.ok) {
        throw new Error();
      }
      toast.success(`${flagName.replace(/([A-Z])/g, ' $1')} status updated`);
    } catch {
      setFeatureFlags(featureFlags);
      toast.error("Failed to update feature flags configuration");
    }
  };

  const handleCancelPlan = async () => {
    if (!user?.membership || user.membership === 'Basic') {
      toast.error("You are already on the free Basic plan");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel your " + user.membership + " plan? You will lose advanced access rights instantly.")) {
      return;
    }

    const toastId = toast.loading("Downgrading subscription tier...");
    try {
      const res = await fetch(`${API_URL}/api/payments/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
        body: JSON.stringify({
          razorpay_order_id: `order_mock_cancel_${Date.now()}`,
          isMock: true,
          amount: 0,
          planName: "Basic Plan"
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      toast.success("Subscription cancelled successfully.", { id: toastId });

      const newLimits = { maxBooks: 3, digitalAccess: false, label: "Basic" };
      const updatedUser = { ...user, membership: "Basic", limits: newLimits };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setSettings(prev => ({
        ...prev,
        paymentHistory: [
          ...(prev.paymentHistory || []),
          { orderId: `order_mock_cancel_${Date.now()}`, paymentId: "SIMULATED_ID", amount: 0, planName: "Downgraded to Basic", date: new Date().toISOString() }
        ]
      }));

      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      toast.error(err.message || "Failed to cancel subscription", { id: toastId });
    }
  };

  const handleUpdateCard = (e) => {
    e.preventDefault();
    if (cardInput.number.replace(/\s/g, "").length < 16) {
      toast.error("Please enter a valid 16-digit card number");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(cardInput.expiry)) {
      toast.error("Please enter a valid expiry date (MM/YY)");
      return;
    }
    if (cardInput.cvv.length < 3) {
      toast.error("Please enter a valid CVV");
      return;
    }
    if (!cardInput.name.trim()) {
      toast.error("Please enter the cardholder name");
      return;
    }

    const firstDigit = cardInput.number.trim()[0];
    const brand = firstDigit === "4" ? "Visa" : firstDigit === "5" ? "Mastercard" : firstDigit === "3" ? "Amex" : "Credit Card";
    const last4 = cardInput.number.trim().slice(-4);

    const newCard = { last4, brand, expiry: cardInput.expiry, name: cardInput.name };
    setCardDetails(newCard);
    localStorage.setItem("mock_card_details", JSON.stringify(newCard));
    setShowCardModal(false);
    toast.success("Payment method updated successfully!");
  };

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 16);
    const formatted = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setCardInput(prev => ({ ...prev, number: formatted }));
  };

  const handleCardExpiryChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").substring(0, 4);
    const formatted = value.replace(/(\d{2})(?=\d)/g, "$1/");
    setCardInput(prev => ({ ...prev, expiry: formatted }));
  };

  const [selectedIntegration, setSelectedIntegration] = useState(null);

  const handleIntegrationSave = (keyName, keyValue) => {
    handleChange(keyName, keyValue);
    setSelectedIntegration(null);
    toast.success("Service credentials updated");
  };

  const integrations = [
    { id: 'stripe', name: 'Stripe Payments', status: settings.stripeKey ? 'Connected' : 'Not Configured', desc: 'Secure credit card processing', key: 'stripeKey' },
    { id: 'zoom', name: 'Zoom Meetings', status: settings.zoomKey ? 'Connected' : 'Not Configured', desc: 'Host live lectures and webinars', key: 'zoomKey' },
    { id: 'gcloud', name: 'Google Cloud Storage', status: settings.googleCloudKey ? 'Connected' : 'Not Configured', desc: 'Scalable course video hosting', key: 'googleCloudKey' },
    { id: 'openai', name: 'OpenAI API', status: settings.openaiKey ? 'Connected' : 'Not Configured', desc: 'AI-powered course summaries', key: 'openaiKey' }
  ];

  const menuItems = [
    { id: 'account', label: 'Profile', icon: <FaUser /> },
    { id: 'notifications', label: 'Notifications', icon: <FaBell /> },
    { id: 'history', label: 'Notif History', icon: <FaHistory /> },
    { id: 'activity', label: 'Sessions', icon: <FaClock /> },
    { id: 'preferences', label: 'Regional & UI', icon: <FaGlobe /> },
    { id: 'accessibility', label: 'Accessibility', icon: <FaUniversalAccess /> },
    { id: 'reading', label: 'Reading & AI', icon: <FaBookOpen /> },
    !isAdmin && { id: 'billing', label: 'Billing', icon: <FaCreditCard /> },
    { id: 'privacy', label: 'Security', icon: <FaShieldAlt /> },
    isAdmin && { id: 'users', label: 'Manage Users', icon: <FaUsers /> },
    isAdmin && { id: 'integrations', label: 'Integrations', icon: <FaPlug /> },
    isAdmin && { id: 'system', label: 'System Config', icon: <FaCogs /> },
    isAdmin && { id: 'export', label: 'Data Export', icon: <FaDownload /> },
  ].filter(Boolean);

  const filteredMenu = menuItems;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (apiError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <FaExclamationTriangle size={48} className="text-rose-500 mb-6 drop-shadow-md" />
        <h2 className="text-3xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">System Offline</h2>
        <p className="text-slate-500 dark:text-slate-400 font-medium mb-8 text-center max-w-md">{apiError}</p>
        <button onClick={fetchData} className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-md shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-3">
          <FaPlug /> Reconnect
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto pb-12 animate-pulse">
        <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl mb-8"></div>
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-72 shrink-0 h-[600px] bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          <div className="flex-1 space-y-8">
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const maxBorrows = user?.membership === 'Elite' ? 15 : user?.membership === 'Premium' ? 5 : 2;
  const borrowsPercent = Math.min(100, Math.round((activeBorrows / maxBorrows) * 100));

  const aiLimit = user?.membership === 'Elite' ? '∞' : '50';
  const aiUsed = settings.aiQueriesCount || 0;
  const aiPercent = user?.membership === 'Elite' ? 100 : Math.min(100, Math.round((aiUsed / 50) * 100));

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-8 pb-12">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-8 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-md border border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
          <p className="text-sm text-slate-500">
            {isSaving ? (
              <span className="text-indigo-500 font-medium">Saving changes...</span>
            ) : lastSynced ? (
              <span className="text-emerald-600 font-medium">Last synced {lastSynced.toLocaleTimeString()}</span>
            ) : (
              "Manage your account and preferences"
            )}
          </p>
        </div>
        <div className="flex items-center gap-4 relative">


          <div className={`px-3 py-1 rounded-md border text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${socketStatus === 'connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${socketStatus === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            {socketStatus === 'connected' ? 'Online' : 'Offline'}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 overflow-hidden">
          <nav className="bg-white dark:bg-slate-900 rounded-xl p-2 shadow-md border border-slate-200 dark:border-slate-800 sticky top-6 z-40">
            <div className="flex flex-row lg:flex-col space-x-1 lg:space-x-0 lg:space-y-0.5 overflow-x-auto lg:overflow-x-visible no-scrollbar whitespace-nowrap lg:whitespace-normal pb-2 lg:pb-0">
              {filteredMenu.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-4 lg:px-3 py-2.5 lg:py-2 rounded-xl text-sm font-medium transition-all shrink-0 lg:shrink ${activeTab === item.id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent'
                    }`}
                >
                  <span className={`text-base ${activeTab === item.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              ))}
            </div>

            <div className="hidden lg:block mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={handleLogout} className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium text-sm hover:text-rose-600 transition-colors w-full text-left px-3 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10">
                <FaSignOutAlt /> Sign Out
              </button>
            </div>
          </nav>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 space-y-8">

          {/* Password Reset Modal */}
          <AnimatePresence>
            {showPasswordModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl p-10 shadow-md border border-slate-200 dark:border-slate-800"
                >
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Change Password</h3>
                  <p className="text-sm font-bold text-slate-500 mb-8">Enter your new secure password below.</p>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
                      />
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => setShowPasswordModal(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-sm transition-all">Cancel</button>
                      <button onClick={handlePasswordUpdate} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-md shadow-indigo-500/20 transition-all">Update Now</button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Credit Card Update Modal */}
          <AnimatePresence>
            {showCardModal && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl p-8 shadow-md border border-slate-200 dark:border-slate-800"
                >
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Update Payment Method</h3>
                  <p className="text-sm font-bold text-slate-500 mb-8">Enter your new debit or credit card details below.</p>

                  <form onSubmit={handleUpdateCard} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        value={cardInput.name}
                        onChange={(e) => setCardInput(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="John Doe"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Card Number</label>
                      <input
                        type="text"
                        required
                        value={cardInput.number}
                        onChange={handleCardNumberChange}
                        placeholder="4242 4242 4242 4242"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expiration Date</label>
                        <input
                          type="text"
                          required
                          value={cardInput.expiry}
                          onChange={handleCardExpiryChange}
                          placeholder="MM/YY"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CVV</label>
                        <input
                          type="password"
                          required
                          maxLength="4"
                          value={cardInput.cvv}
                          onChange={(e) => setCardInput(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, "") }))}
                          placeholder="•••"
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowCardModal(false)} 
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-xs transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-md shadow-indigo-500/20 transition-all"
                      >
                        Save Card
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Integration Config Modal */}
          <AnimatePresence>
            {selectedIntegration && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl p-10 shadow-md border border-slate-200 dark:border-slate-800"
                >
                  <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-xl w-fit mb-6">
                    <FaPlug size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Configure {selectedIntegration.name}</h3>
                  <p className="text-sm font-bold text-slate-500 mb-8">Enter your API key or secret token to enable this service.</p>

                  <div className="space-y-6">
                    <div className="relative">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">API KEY / SECRET</label>
                      <div className="relative">
                        <input
                          type={showApiKey ? "text" : "password"}
                          defaultValue={settings[selectedIntegration.key] || ""}
                          onChange={(e) => (window._tempKey = e.target.value)}
                          placeholder="sk_test_..."
                          className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl font-bold focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white pr-14"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          {showApiKey ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button onClick={() => { setSelectedIntegration(null); setShowApiKey(false); }} className="flex-1 py-4 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-black text-sm transition-all">Cancel</button>
                      <button onClick={() => { handleIntegrationSave(selectedIntegration.key, window._tempKey); setShowApiKey(false); }} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-md shadow-indigo-500/20 transition-all">Connect Service</button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">

                {/* Tab Header */}
                <div className="px-8 py-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white capitalize flex items-center gap-3">
                    <span className="text-indigo-600 dark:text-indigo-400">
                      {menuItems.find(i => i.id === activeTab)?.icon}
                    </span>
                    {activeTab.replace('-', ' ')}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Manage your {activeTab} settings and preferences.
                  </p>
                </div>

                <div className="p-8 lg:p-12">

                  {/* --- ACCOUNT TAB --- */}
                  {activeTab === 'account' && (
                    <div className="space-y-10">
                      <div className="flex flex-col md:flex-row items-start gap-8">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-600 dark:text-slate-400 overflow-hidden relative">
                            {settings.avatar ? <img src={settings.avatar} className="w-full h-full object-cover" /> : user?.name?.[0].toUpperCase()}
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <FaCamera size={16} />
                            </div>
                          </div>
                          <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handleAvatarChange} />
                        </div>
                        <div className="flex-1 space-y-4 w-full">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Full Name</label>
                              <input type="text" value={settings.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all dark:text-white" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Username</label>
                              <input 
                                type="text" 
                                value={settings.username} 
                                readOnly={!isAdmin}
                                onChange={(e) => isAdmin && handleChange('username', e.target.value)} 
                                className={`w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm outline-none transition-all dark:text-white ${!isAdmin ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50' : 'focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'}`} 
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                            <div className="relative">
                              <input type="email" value={settings.email} disabled className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm opacity-70 cursor-not-allowed dark:text-slate-400" />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-bold rounded border border-emerald-100 uppercase">
                                <FaCheckCircle size={8} /> Verified
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Privacy Controls</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">Public Profile</p>
                              <p className="text-[11px] text-slate-500">Allow others to see your reading lists and reviews</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={settings.profileVisible} onChange={(e) => handleChange('profileVisible', e.target.checked)} className="sr-only peer" />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">Activity Visibility</p>
                              <p className="text-[11px] text-slate-500">Show your current reading status to friends</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input type="checkbox" checked={settings.activityVisible} onChange={(e) => handleChange('activityVisible', e.target.checked)} className="sr-only peer" />
                              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Appearance</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { id: 'light', label: 'Light', icon: <FaSun />, desc: 'Classic bright look' },
                            { id: 'dark', label: 'Dark', icon: <FaMoon />, desc: 'Easy on the eyes' },
                            { id: 'system', label: 'System', icon: <FaLaptop />, desc: 'Follows device' }
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => handleChange('theme', t.id)}
                              className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all ${
                                settings.theme === t.id 
                                  ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-600 dark:bg-indigo-500/10 dark:border-indigo-400 dark:ring-indigo-400' 
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${settings.theme === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                {t.icon}
                              </div>
                              <div className="text-center">
                                <p className={`text-xs font-bold ${settings.theme === t.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-white'}`}>{t.label}</p>
                                <p className="text-[9px] text-slate-500 mt-0.5">{t.desc}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- NOTIFICATIONS TAB --- */}
                  {activeTab === 'notifications' && (
                    <div className="space-y-8">
                      <section>
                        <div className="space-y-1 mb-6">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">Email Preferences</h3>
                          <p className="text-sm text-slate-500">Configure when and how you want to receive emails.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Notification Frequency</label>
                            <select value={settings.notifFrequency} onChange={(e) => handleChange('notifFrequency', e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm focus:border-indigo-500 outline-none transition-all dark:text-white">
                              <option value="instant">Instant Alerts</option>
                              <option value="daily">Daily Digest</option>
                              <option value="weekly">Weekly Summary</option>
                            </select>
                          </div>
                        </div>
                        <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                          {[
                            { id: 'reminders', label: 'Due Reminders', desc: 'Alerts when book returns are approaching' },
                            { id: 'payments', label: 'Payment Receipts', desc: 'Confirmations for membership and fines' },
                            { id: 'updates', label: 'System Updates', desc: 'New features and library announcements' }
                          ].map(item => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900">
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                                <p className="text-[11px] text-slate-500">{item.desc}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.emailCategories[item.id]} onChange={(e) => handleChange(`emailCategories.${item.id}`, e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {/* --- BILLING --- */}
                  {activeTab === 'billing' && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Current Plan Card */}
                        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-xl text-white border border-slate-800 relative overflow-hidden group flex flex-col justify-between min-h-[220px]">
                          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <FaCreditCard size={150} />
                          </div>
                          <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                              <p className="text-indigo-400 text-[10px] font-black tracking-widest uppercase">Current Active Plan</p>
                              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-bold rounded-full border border-emerald-500/30 uppercase tracking-widest">Active</span>
                            </div>
                            <h3 className="text-3xl font-black tracking-tight">{user?.membership || 'Basic'} Membership</h3>
                            <p className="text-sm text-slate-400 mt-2">
                              {user?.membership === 'Basic' ? 'Free access to catalog.' : `Your membership renews automatically on ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}.`}
                            </p>
                          </div>

                          <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mt-6 pt-6 border-t border-slate-800">
                            <div className="flex items-center gap-4">
                              <p className="text-2xl font-bold text-white">
                                ₹{user?.membership === 'Elite' ? (billingCycle === 'annual' ? '1,499' : '999') : user?.membership === 'Premium' ? (billingCycle === 'annual' ? '499' : '299') : '0'}
                                <span className="text-xs text-slate-500 font-medium lowercase">/{billingCycle === 'annual' ? 'year' : 'semester'}</span>
                              </p>
                              {billingCycle === 'annual' && (
                                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-bold uppercase tracking-wider">
                                  Save ₹{user?.membership === 'Elite' ? '499' : '99'} / year
                                </span>
                              )}
                            </div>

                            <div className="flex gap-3">
                              <button 
                                onClick={() => navigate("/membership")}
                                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-indigo-500/20 hover:-translate-y-0.5"
                              >
                                Upgrade Plan
                              </button>
                              {user?.membership && user.membership !== 'Basic' && (
                                <button 
                                  onClick={handleCancelPlan}
                                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-slate-800 rounded-xl font-bold text-xs transition-all"
                                >
                                  Cancel Subscription
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Payment Method Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between min-h-[220px]">
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Saved Card</p>
                              <button 
                                onClick={() => setShowCardModal(true)}
                                className="text-[10px] font-bold text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                              >
                                Edit Card
                              </button>
                            </div>

                            {/* Card visualization */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-955 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-all">
                              <div className="flex justify-between items-start mb-6">
                                <div className="w-10 h-7 bg-slate-800 rounded-md border border-slate-700 flex items-center justify-center opacity-60">
                                  <div className="w-6 h-5 bg-amber-500/20 rounded-sm border border-amber-500/30"></div>
                                </div>
                                <span className="text-xs font-black italic tracking-wider text-slate-400 uppercase">{cardDetails.brand}</span>
                              </div>
                              <p className="font-mono text-sm tracking-[0.2em] text-white mb-4">•••• •••• •••• {cardDetails.last4}</p>
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-[8px] text-slate-500 uppercase tracking-wider">Cardholder</p>
                                  <p className="text-[10px] font-bold text-slate-300 truncate max-w-[120px]">{cardDetails.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[8px] text-slate-500 uppercase tracking-wider">Expires</p>
                                  <p className="text-[10px] font-bold text-slate-300">{cardDetails.expiry}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-4 border-t border-slate-800">
                            <span>Auto-Renew: <strong className={settings.autoRenewal ? "text-emerald-500" : "text-slate-400"}>{settings.autoRenewal ? "ON" : "OFF"}</strong></span>
                            <span>Direct Debit</span>
                          </div>
                        </div>
                      </div>

                      {/* Billing Cycle & Calculator */}
                      {user?.membership && user.membership !== 'Basic' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                          {/* Billing Cycle Switcher */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex items-center justify-between shadow-sm">
                            <div>
                              <p className="text-xs font-bold text-slate-900 dark:text-white">Billing Frequency</p>
                              <p className="text-[10px] text-slate-500 mt-1">Switch to annual billing to save more</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold ${billingCycle === 'semester' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>Semester</span>
                              <button 
                                onClick={() => setBillingCycle(billingCycle === 'annual' ? 'semester' : 'annual')}
                                className={`w-11 h-6 rounded-full relative transition-colors ${billingCycle === 'annual' ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-800"}`}
                              >
                                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${billingCycle === 'annual' ? "right-1" : "left-1"}`} />
                              </button>
                              <span className={`text-xs font-bold ${billingCycle === 'annual' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`}>Annual</span>
                            </div>
                          </div>

                          {/* Next Invoice Estimator */}
                          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
                            <p className="text-xs font-bold text-slate-900 dark:text-white mb-4">Estimated Next Invoice Details</p>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between items-center text-slate-500">
                                <span>Subtotal ({user?.membership} Plan)</span>
                                <span>₹{user?.membership === 'Elite' ? (billingCycle === 'annual' ? '1,499' : '999') : (billingCycle === 'annual' ? '499' : '299')}.00</span>
                              </div>
                              <div className="flex justify-between items-center text-slate-500">
                                <span>Tax (GST 18%)</span>
                                <span>₹{Math.round((user?.membership === 'Elite' ? (billingCycle === 'annual' ? 1499 : 999) : (billingCycle === 'annual' ? 499 : 299)) * 0.18)}.00</span>
                              </div>
                              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                              <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white text-sm">
                                <span>Total Estimated Renewal Cost</span>
                                <span>₹{Math.round((user?.membership === 'Elite' ? (billingCycle === 'annual' ? 1499 : 999) : (billingCycle === 'annual' ? 499 : 299)) * 1.18)}.00</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* --- USAGE DASHBOARD --- */}
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Plan Usage & Limits</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex justify-between items-end mb-4">
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">Book Borrows</p>
                                <p className="text-[10px] text-slate-500 font-medium">Active loans quota</p>
                              </div>
                              <p className="text-sm font-black text-indigo-600">{activeBorrows} <span className="text-[10px] text-slate-400 font-bold uppercase">/ {maxBorrows}</span></p>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${borrowsPercent}%` }}
                                className="h-full bg-indigo-600 rounded-full"
                              />
                            </div>
                          </div>

                          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex justify-between items-end mb-4">
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">AI Analysis</p>
                                <p className="text-[10px] text-slate-500 font-medium">Power credits</p>
                              </div>
                              <p className="text-sm font-black text-purple-600">{aiUsed} <span className="text-[10px] text-slate-400 font-bold uppercase">/ {aiLimit}</span></p>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${aiPercent}%` }}
                                className="h-full bg-purple-600 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* --- BILLING PROFILE --- */}
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Billing Information</h3>
                        <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6 shadow-md">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Billing Address</label>
                              <textarea 
                                value={settings.billingAddress} 
                                onChange={(e) => handleChange('billingAddress', e.target.value)}
                                placeholder="Street address, City, State, ZIP"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 transition-all dark:text-white min-h-[100px] resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Tax ID / GST Number</label>
                              <input 
                                type="text" 
                                value={settings.taxId} 
                                onChange={(e) => handleChange('taxId', e.target.value)}
                                placeholder="e.g. 27AAACR1234A1Z1"
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 transition-all dark:text-white"
                              />
                              <div className="mt-6 p-4 bg-amber-500/5 rounded-xl border border-amber-500/10">
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold leading-relaxed">
                                  <FaExclamationTriangle className="inline mr-1 mb-0.5" /> 
                                  Information provided here will appear on your official invoices for tax purposes.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* --- AUTOMATION SECTION --- */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                              <FaSyncAlt size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">Auto-Renewal</p>
                              <p className="text-[10px] text-slate-500 font-medium">Automatically renew subscription</p>
                            </div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settings.autoRenewal} 
                              onChange={(e) => handleChange('autoRenewal', e.target.checked)}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                          </label>
                        </div>

                        <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                              <FaDownload size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white">Latest Invoice</p>
                              <p className="text-[10px] text-slate-500 font-medium">Download automated receipt</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              const plan = user?.membership || 'Elite';
                              const price = plan === 'Elite' ? '999' : '299';
                              const invoiceId = `INV-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
                              const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
                              
                              const invoiceHtml = `
                                <html>
                                  <head>
                                    <title>Invoice - ${invoiceId}</title>
                                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
                                    <style>
                                      body { font-family: 'Inter', sans-serif; padding: 60px; color: #1e293b; line-height: 1.5; }
                                      .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 40px; margin-bottom: 40px; }
                                      .logo { font-weight: 900; font-size: 24px; letter-spacing: -0.05em; color: #4f46e5; }
                                      .status { padding: 6px 12px; background: #f0fdf4; color: #166534; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                                      .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
                                      .label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
                                      .value { font-weight: 600; font-size: 14px; }
                                      table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
                                      th { text-align: left; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; padding: 12px; border-bottom: 1px solid #f1f5f9; }
                                      td { padding: 20px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                                      .total-section { display: flex; justify-content: flex-end; }
                                      .total-box { background: #f8fafc; padding: 24px; border-radius: 12px; width: 240px; }
                                      .total-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
                                      .grand-total { font-size: 20px; font-weight: 900; color: #4f46e5; margin-top: 12px; padding-top: 12px; border-top: 1px solid #e2e8f0; }
                                      .footer { margin-top: 80px; text-align: center; font-size: 12px; color: #94a3b8; }
                                      @media print { .no-print { display: none; } }
                                    </style>
                                  </head>
                                  <body>
                                    <div class="no-print" style="margin-bottom: 20px; text-align: right;">
                                      <button onclick="window.print()" style="padding: 10px 20px; background: #4f46e5; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 700;">Print or Save as PDF</button>
                                    </div>
                                    <div class="header">
                                      <div class="logo">LIBRARY PRO.</div>
                                      <div class="status">Payment Successful</div>
                                    </div>
                                    <div class="grid">
                                      <div>
                                        <div class="label">Billed To</div>
                                        <div class="value">${user?.name || 'Valued Member'}</div>
                                        <div class="value" style="font-weight: 400; color: #64748b; font-size: 11px; white-space: pre-line; margin-top: 4px;">${settings.billingAddress || user?.email || ''}</div>
                                        ${settings.taxId ? `<div class="value" style="font-weight: 700; color: #1e293b; font-size: 11px; margin-top: 8px;">TAX ID: ${settings.taxId}</div>` : ''}
                                      </div>
                                      <div style="text-align: right;">
                                        <div class="label">Invoice Details</div>
                                        <div class="value">${invoiceId}</div>
                                        <div class="value" style="font-weight: 400; color: #64748b; font-size: 12px;">Issued on ${date}</div>
                                      </div>
                                    </div>
                                    <table>
                                      <thead>
                                        <tr>
                                          <th>Description</th>
                                          <th style="text-align: right;">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr>
                                          <td>
                                            <div style="font-weight: 700;">${plan} Membership Upgrade</div>
                                            <div style="font-size: 11px; color: #64748b; margin-top: 4px;">Monthly subscription fee for advanced library features.</div>
                                          </td>
                                          <td style="text-align: right; font-weight: 700;">₹${price}.00</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                    <div class="total-section">
                                      <div class="total-box">
                                        <div class="total-row"><span class="label" style="margin:0;">Subtotal</span><span class="value">₹${price}.00</span></div>
                                        <div class="total-row"><span class="label" style="margin:0;">Tax (0%)</span><span class="value">₹0.00</span></div>
                                        <div class="total-row grand-total"><span>Total</span><span>₹${price}.00</span></div>
                                      </div>
                                    </div>
                                    <div class="footer">
                                      This is a computer-generated document. No signature required.<br>
                                      © 2026 Library PRO SaaS. All rights reserved.
                                    </div>
                                  </body>
                                </html>
                              `;
                              
                              const win = window.open('', '_blank');
                              win.document.write(invoiceHtml);
                              win.document.close();
                            }} 
                            className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-slate-400 hover:text-emerald-500 transition-colors"
                          >
                            <FaDownload size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] px-2">Payment History</h3>
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-md">
                          <div className="overflow-x-auto w-full">
                            <table className="w-full text-left min-w-[600px] lg:min-w-0">
                              <thead>
                                <tr className="border-b border-slate-50 dark:border-slate-200 dark:border-slate-800">
                                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Automated Status</th>
                                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                {(settings.paymentHistory || []).length === 0 ? (
                                  <tr>
                                    <td colSpan="3" className="px-8 py-10 text-center text-slate-400 font-medium">No payment transactions recorded yet.</td>
                                  </tr>
                                ) : (
                                  (settings.paymentHistory || []).map((tx, idx) => (
                                    <tr key={idx} className="group hover:bg-slate-50 dark:hover:bg-white/2 transition-colors">
                                      <td className="px-8 py-5 text-xs font-bold text-slate-600 dark:text-slate-400">
                                        {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </td>
                                      <td className="px-8 py-5">
                                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-xl border ${
                                          tx.amount > 0 
                                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500 border-emerald-100 dark:border-emerald-500/20' 
                                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                        }`}>
                                          {tx.planName || 'Membership'}
                                        </span>
                                      </td>
                                      <td className="px-8 py-5 text-right font-black text-sm text-slate-900 dark:text-white">
                                        ₹{tx.amount}.00
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- PRIVACY & SECURITY --- */}
                  {activeTab === 'privacy' && (
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Security Credentials</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                          <button onClick={() => setShowPasswordModal(true)} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors text-left">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-400">
                                <FaKey size={14} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Change Password</p>
                                <p className="text-[11px] text-slate-500">Update your login credentials</p>
                              </div>
                            </div>
                            <FaChevronRight size={10} className="text-slate-400" />
                          </button>
                          <button onClick={() => handleChange('require2FA', !settings.require2FA)} className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors text-left">
                            <div className="flex items-center gap-4">
                              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-400">
                                <FaShieldAlt size={14} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">Two-Factor Auth</p>
                                <p className="text-[11px] text-slate-500">Extra layer of account security</p>
                              </div>
                            </div>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${settings.require2FA ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {settings.require2FA ? 'Enabled' : 'Disabled'}
                            </div>
                          </button>
                        </div>

                        {(isAdmin || user?.membership === "Elite") && (
                          <div className="p-6 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-indigo-700 dark:text-indigo-400 font-bold text-sm">Developer API Keys</h4>
                              <button onClick={async () => {
                                try {
                                  const res = await fetch(`${API_URL}/api/auth/api-keys`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user?.token}` },
                                    body: JSON.stringify({ label: 'Default' })
                                  });
                                  const data = await res.json();
                                  setApiKeys(prev => [...prev, { id: data.id, label: data.label, preview: data.key.substring(0, 12) + '••••••••', createdAt: data.createdAt, lastUsed: null }]);
                                  navigator.clipboard.writeText(data.key);
                                  toast.success('New API key generated and copied!');
                                } catch { toast.error('Failed to generate key'); }
                              }} className="px-3 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-indigo-700 transition-colors">Generate Key</button>
                            </div>
                            {apiKeys.length === 0 ? (
                              <p className="text-xs text-slate-500 text-center py-4">No API keys yet. Generate one above.</p>
                            ) : (
                              <div className="space-y-3">
                                {apiKeys.map(k => (
                                  <div key={k.id} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{k.preview}</p>
                                      <p className="text-[10px] text-slate-400 mt-0.5">Created {new Date(k.createdAt).toLocaleDateString()} {k.lastUsed ? `· Last used ${new Date(k.lastUsed).toLocaleDateString()}` : '· Never used'}</p>
                                    </div>
                                    <button onClick={async () => {
                                      await fetch(`${API_URL}/api/auth/api-keys/${k.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${user?.token}` } });
                                      setApiKeys(prev => prev.filter(x => x.id !== k.id));
                                      toast.success('API key revoked');
                                    }} className="text-rose-500 hover:text-rose-700 text-[10px] font-bold uppercase tracking-wider">Revoke</button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </section>

                      <section className="pt-8 border-t border-slate-200 dark:border-slate-800">
                        <div className="p-6 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                          <h4 className="text-rose-700 dark:text-rose-400 font-bold text-sm">Danger Zone</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Permanently deactivate or delete your account.</p>
                          <div className="flex gap-4 mt-4">
                            <button className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-300 transition-colors">Deactivate</button>
                            <button onClick={() => {
                              if (window.confirm("Are you absolutely sure? This action is irreversible.")) {
                                handleLogout();
                              }
                            }} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition-colors">Delete Account</button>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === 'history' && (() => {
                    const filtered = notifFilter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;
                    const total = filtered.length;
                    const pages = Math.ceil(total / NOTIF_PER_PAGE);
                    const paged = filtered.slice((notifPage - 1) * NOTIF_PER_PAGE, notifPage * NOTIF_PER_PAGE);
                    return (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notification History <span className="text-slate-400 font-normal">({total})</span></h3>
                          <div className="flex gap-2 items-center">
                            {['all', 'unread'].map(f => (
                              <button key={f} onClick={() => { setNotifFilter(f); setNotifPage(1); }}
                                className={`px-3 py-1.5 text-[10px] font-bold rounded-xl capitalize transition-all ${notifFilter === f ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>
                                {f}
                              </button>
                            ))}
                            {unreadCount > 0 && <button onClick={markAllAsRead} className="text-[10px] font-bold text-indigo-600 hover:underline ml-2">Mark all read</button>}
                            {notifications.length > 0 && <button onClick={clearAllNotifications} className="text-[10px] font-bold text-rose-500 hover:underline ml-2">Clear All</button>}
                          </div>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                          {paged.length === 0 ? (
                            <div className="p-12 text-center text-slate-500">No notifications found.</div>
                          ) : paged.map((notif, idx) => (
                            <div key={idx} onClick={() => !notif.isRead && markAsRead(notif._id)} className={`p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex gap-4 cursor-pointer ${!notif.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/10' : ''}`}>
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.isRead ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400'}`}>
                                <FaBell size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-bold ${notif.isRead ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>{notif.title}</p>
                                <p className="text-xs text-slate-500 line-clamp-1">{notif.message}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                              </div>
                              {!notif.isRead && <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />}
                            </div>
                          ))}
                        </div>
                        {pages > 1 && (
                          <div className="flex justify-center gap-2">
                            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                              <button key={p} onClick={() => setNotifPage(p)}
                                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${notifPage === p ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{p}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {activeTab === 'activity' && (
                    <div className="space-y-8">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Device Sessions</h3>
                            <p className="text-sm text-slate-500">Manage all your active logins across devices.</p>
                          </div>
                          <button onClick={logoutAllSessions} className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors">
                            Logout All
                          </button>
                        </div>
                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Device</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Location & IP</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Last Active</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                              {sessions.map((session, idx) => {
                                const currentSessId = JSON.parse(localStorage.getItem("user") || "{}").sessionId;
                                const isCurrent = session.sessionId === currentSessId;
                                const isMobile = session.device?.includes('Mobile') || session.userAgent?.toLowerCase().includes('mobile');
                                return (
                                  <tr key={idx} className={`transition-colors ${isCurrent ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                                    <td className="p-4 align-middle">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCurrent ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                                          {isMobile ? <FaMobileAlt size={16} /> : <FaLaptop size={16} />}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-900 dark:text-white text-sm">
                                              {session.device || 'Unknown Browser'}
                                            </span>
                                            {isCurrent && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-full tracking-wider">Current</span>}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                      <div className="text-sm font-medium text-slate-900 dark:text-white">{session.location || "Unknown Location"}</div>
                                      <div className="text-xs text-slate-500">{session.ip}</div>
                                    </td>
                                    <td className="p-4 align-middle text-sm text-slate-500">
                                      {new Date(session.lastActive).toLocaleString()}
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                      {!isCurrent && (
                                        <button
                                          onClick={() => logoutSession(session.sessionId)}
                                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                        >
                                          Terminate
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'preferences' && (
                    <div className="space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Timezone</label>
                          <select value={settings.timezone} onChange={(e) => handleChange('timezone', e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm focus:border-indigo-500 outline-none transition-all dark:text-white">
                            <option value="UTC">UTC (Universal Time)</option>
                            <option value="IST">IST (India Standard Time)</option>
                            <option value="EST">EST (Eastern Standard Time)</option>
                            <option value="PST">PST (Pacific Standard Time)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date Format</label>
                          <select value={settings.dateFormat} onChange={(e) => handleChange('dateFormat', e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm focus:border-indigo-500 outline-none transition-all dark:text-white">
                            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Preferred Currency</label>
                          <select value={settings.currency} onChange={(e) => handleChange('currency', e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm focus:border-indigo-500 outline-none transition-all dark:text-white">
                            <option value="INR">INR (₹) - India</option>
                            <option value="USD">USD ($) - United States</option>
                            <option value="GBP">GBP (£) - UK</option>
                            <option value="EUR">EUR (€) - Europe</option>
                          </select>
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Interface Customization</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Accent Color</label>
                            <div className="flex gap-4">
                              {['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'].map(color => (
                                <button 
                                  key={color} 
                                  onClick={() => handleChange('accentColor', color)}
                                  className={`w-8 h-8 rounded-full border-2 transition-all ${settings.accentColor === color ? 'border-slate-900 dark:border-white scale-110' : 'border-transparent shadow-md'}`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                              <input type="color" value={settings.accentColor} onChange={(e) => handleChange('accentColor', e.target.value)} className="w-8 h-8 rounded-full overflow-hidden border-none cursor-pointer bg-transparent" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Font Size</label>
                            <div className="flex gap-2">
                              {['small', 'medium', 'large'].map(size => (
                                <button 
                                  key={size}
                                  onClick={() => handleChange('fontSize', size)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${settings.fontSize === size ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                                >
                                  {size}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'accessibility' && (
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Accessibility Settings</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">High Contrast Mode</p>
                              <p className="text-xs text-slate-500">Increases color contrast for better legibility.</p>
                            </div>
                            <button 
                              onClick={() => handleChange('highContrast', !settings.highContrast)} 
                              className={`${settings.highContrast ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                            >
                              <span className={`${settings.highContrast ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200`} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Reduced Motion</p>
                              <p className="text-xs text-slate-500">Minimizes animations and transitions.</p>
                            </div>
                            <button 
                              onClick={() => handleChange('reducedMotion', !settings.reducedMotion)} 
                              className={`${settings.reducedMotion ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                            >
                              <span className={`${settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Dyslexic-Friendly Font</p>
                              <p className="text-xs text-slate-500">Changes the global font to improve readability for dyslexia.</p>
                            </div>
                            <button 
                              onClick={() => handleChange('dyslexicFont', !settings.dyslexicFont)} 
                              className={`${settings.dyslexicFont ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                            >
                              <span className={`${settings.dyslexicFont ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200`} />
                            </button>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === 'reading' && (
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Reading & AI Preferences</h3>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Default Book Format</p>
                              <p className="text-xs text-slate-500">Choose your preferred reading format when opening books.</p>
                            </div>
                            <select 
                              value={settings.defaultBookFormat || 'Web Reader'} 
                              onChange={(e) => handleChange('defaultBookFormat', e.target.value)}
                              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="EPUB">EPUB Reader</option>
                              <option value="PDF">PDF Viewer</option>
                              <option value="Web Reader">Standard Web Reader</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">AI Summary Detail Level</p>
                              <p className="text-xs text-slate-500">Controls how comprehensive the AI course summaries are.</p>
                            </div>
                            <select 
                              value={settings.aiSummaryDepth || 'Standard'} 
                              onChange={(e) => handleChange('aiSummaryDepth', e.target.value)}
                              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                              <option value="Brief">Brief (Key points only)</option>
                              <option value="Standard">Standard</option>
                              <option value="Comprehensive">Comprehensive</option>
                            </select>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Daily Reading Reminders</p>
                              <p className="text-xs text-slate-500">Receive gentle nudges to hit your reading goals.</p>
                            </div>
                            <button 
                              onClick={() => handleChange('readingReminders', !settings.readingReminders)} 
                              className={`${settings.readingReminders ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                            >
                              <span className={`${settings.readingReminders ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200`} />
                            </button>
                          </div>

                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Share Reading Activity</p>
                              <p className="text-xs text-slate-500">Allow friends and the community to see your reading progress.</p>
                            </div>
                            <button 
                              onClick={() => handleChange('shareReadingActivity', !settings.shareReadingActivity)} 
                              className={`${settings.shareReadingActivity ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                            >
                              <span className={`${settings.shareReadingActivity ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200`} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <div>
                              <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">Auto-Return Digital Books</p>
                              <p className="text-xs text-slate-500">Automatically return borrowed items on their due date.</p>
                            </div>
                            <button 
                              onClick={() => handleChange('autoReturnBooks', !settings.autoReturnBooks)} 
                              className={`${settings.autoReturnBooks ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'} relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none`}
                            >
                              <span className={`${settings.autoReturnBooks ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200`} />
                            </button>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === 'export' && (
                    <div className="space-y-8">
                      <section>
                        <div className="flex justify-between items-center mb-6">
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Data Portability</h3>
                            <p className="text-sm text-slate-500">Download your personal data for your own records.</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => window.open(`${API_URL}/api/auth/export-data?format=json&token=${user.token}`, '_blank')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2">
                              <FaDownload /> Export JSON
                            </button>
                            <button onClick={() => window.open(`${API_URL}/api/auth/export-data?format=csv&token=${user.token}`, '_blank')} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2">
                              <FaDownload /> Export CSV
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            { label: 'Comprehensive Identity', desc: 'JSON bundle of profile, preferences, and sessions', icon: <FaUser />, format: 'json' },
                            { label: 'Research & Activity', desc: 'Detailed log of transactions and audit records', icon: <FaHistory />, format: 'csv' }
                          ].map((item, idx) => (
                            <button key={idx} onClick={() => window.open(`${API_URL}/api/auth/export-data?format=${item.format}&token=${user.token}`, '_blank')} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all text-left group">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-indigo-600 rounded-xl flex items-center justify-center transition-colors">
                                  {item.icon}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                                  <p className="text-[11px] text-slate-500">{item.desc}</p>
                                </div>
                              </div>
                              <FaDownload className="text-slate-300 group-hover:text-indigo-600 transition-colors" size={14} />
                            </button>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}


                  {activeTab === 'status' && isAdmin && (
                    <div className="space-y-8">
                      <section>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-6">Infrastructure Health</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {[
                            { name: 'Main Server', status: 'Operational', uptime: '99.98%', latency: '42ms', color: 'emerald' },
                            { name: 'Database (Mongo)', status: 'Operational', uptime: '100%', latency: '5ms', color: 'emerald' },
                            { name: 'Search Engine', status: 'Operational', uptime: '99.95%', latency: '120ms', color: 'emerald' },
                            { name: 'AI Processor', status: 'High Load', uptime: '98.4%', latency: '1.2s', color: 'amber' },
                            { name: 'Email Gateway', status: 'Operational', uptime: '99.9%', latency: '2s', color: 'emerald' },
                            { name: 'Storage Cluster', status: 'Degraded', uptime: '94.2%', latency: '850ms', color: 'rose' }
                          ].map((svc, idx) => (
                            <div key={idx} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                              <div className="flex justify-between items-start mb-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{svc.name}</h4>
                                <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter ${
                                  svc.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                  svc.color === 'amber' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                  'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                } border`}>
                                  {svc.status}
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Uptime</span>
                                  <span className="text-xs font-black text-slate-900 dark:text-white">{svc.uptime}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Latency</span>
                                  <span className="text-xs font-black text-slate-900 dark:text-white">{svc.latency}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: svc.uptime }} transition={{ duration: 1 }} className={`h-full ${
                                    svc.color === 'emerald' ? 'bg-emerald-500' : svc.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'
                                  }`} />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}

                  {/* --- PLATFORM CONFIG (ADMIN ONLY) --- */}
                  {activeTab === 'platform' && isAdmin && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Platform Name</label>
                            <input type="text" value={settings.siteName} onChange={(e) => handleChange('siteName', e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm outline-none transition-all dark:text-white" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Default Language</label>
                            <select value={settings.defaultLang} onChange={(e) => handleChange('defaultLang', e.target.value)} className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-sm outline-none transition-all dark:text-white">
                              <option>English</option>
                              <option>Spanish</option>
                              <option>Hindi</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                          <FaCamera className="text-slate-400 text-2xl mb-2" />
                          <p className="text-xs font-bold text-slate-900 dark:text-white">Upload Logo</p>
                        </div>
                      </div>

                      <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-500 text-white rounded-xl"><FaExclamationTriangle size={14} /></div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">Maintenance Mode</p>
                            <p className="text-[11px] text-slate-500">Temporarily disable access for system updates</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => handleChange('maintenanceMode', e.target.checked)} className="sr-only peer" />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* --- USERS & ROLES --- */}
                  {activeTab === 'users' && isAdmin && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">User Directory</h3>
                        <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-indigo-500 transition-colors">Invite User</button>
                      </div>
                      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                        <div className="overflow-x-auto w-full">
                          <table className="w-full text-left min-w-[600px] lg:min-w-0">
                          <thead className="bg-slate-50 dark:bg-slate-800/50">
                            <tr>
                              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">User</th>
                              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Role</th>
                              <th className="px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {allUsers.slice(0, 5).map((u, i) => (
                              <tr key={i} className="text-sm">
                                <td className="px-4 py-3">
                                  <div>
                                    <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                                    <p className="text-[11px] text-slate-500">{u.email}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {u.role}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button onClick={() => handlePromoteUser(u._id)} className="text-indigo-600 font-bold text-xs hover:underline">Manage</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  )}

                  {/* --- INTEGRATIONS --- */}
                  {activeTab === 'integrations' && isAdmin && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {integrations.map((app, i) => (
                          <div key={i} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col items-start transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <div className="flex justify-between items-start w-full mb-4">
                              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-indigo-600"><FaPlug size={14} /></div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${app.status === 'Connected' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                {app.status}
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{app.name}</h4>
                            <p className="text-[11px] text-slate-500 mt-1 mb-6">{app.desc}</p>
                            <button
                              onClick={() => setSelectedIntegration(app)}
                              className="mt-auto w-full py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-[11px] text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-colors"
                            >
                              {app.status === 'Connected' ? 'Manage' : 'Configure'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* --- SYSTEM --- */}
                  {activeTab === 'system' && isAdmin && (
                    <div className="space-y-10">
                      {/* Operations */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-6">Platform Maintenance Operations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2"><FaDatabase className="text-indigo-600" size={14} /> Database Backup</h4>
                              <p className="text-xs text-slate-500 leading-relaxed mb-6">Generate a secure snapshot archive of the library database. All transaction receipts, books, and user profiles will be serialized and stored securely.</p>
                            </div>
                            <button 
                              onClick={handleRunBackup} 
                              disabled={isBackupRunning}
                              className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/10"
                            >
                              {isBackupRunning ? 'Backing Up...' : 'Run Backup Now'}
                            </button>
                          </div>
                          <div className="p-6 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2"><FaHistory className="text-indigo-600" size={14} /> System Cache</h4>
                              <p className="text-xs text-slate-500 leading-relaxed mb-6">Flush all temporary cache buffers, API query indexes, and notification queues across the server application to force fresh database requests.</p>
                            </div>
                            <button 
                              onClick={handleClearCache} 
                              disabled={isCacheClearing}
                              className="w-full py-2.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-rose-500/10"
                            >
                              {isCacheClearing ? 'Clearing...' : 'Flush System Cache'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Automated Cron Jobs */}
                      <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Automated Background Jobs</h3>
                        <p className="text-xs text-slate-500 mb-6">Enable, disable, or manually trigger internal background maintenance engines.</p>
                        
                        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                          <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                              <thead className="bg-slate-50 dark:bg-slate-800/50">
                                <tr>
                                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job Name & Description</th>
                                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Schedule / Cron</th>
                                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Execution</th>
                                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {cronJobs.map((job) => (
                                  <tr key={job.id} className="text-sm hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                    <td className="px-6 py-4 max-w-sm">
                                      <p className="font-bold text-slate-900 dark:text-white">{job.name}</p>
                                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{job.description}</p>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                                      {job.schedule}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-slate-500">
                                      {job.lastRun && job.lastRun !== 'Never' ? new Date(job.lastRun).toLocaleString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4">
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                          type="checkbox" 
                                          checked={job.enabled} 
                                          onChange={() => handleToggleCron(job.id)} 
                                          className="sr-only peer" 
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                      </label>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <button 
                                        onClick={() => handleRunCron(job.id)}
                                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 dark:bg-slate-800 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ml-auto"
                                      >
                                        <FaPlay size={10} /> Execute
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Core System Feature Flags */}
                      <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Core System Feature Modules</h3>
                        <p className="text-xs text-slate-500 mb-6">Toggle core modular modules active or inactive globally across all interfaces.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {[
                            { id: 'leaderboard', name: 'Leaderboard Module', desc: 'Enable user reading engagement ranking' },
                            { id: 'reservations', name: 'Seat Reservations', desc: 'Active seat booking & study rooms booking' },
                            { id: 'aiAssistant', name: 'AI Research Agent', desc: 'Allow AI-powered query and course assist' },
                            { id: 'recommendations', name: 'Smart Book Recs', desc: 'AI automated catalog recommendations' },
                            { id: 'vault', name: 'Digital Media Vault', desc: 'Support cloud uploads and storage' },
                            { id: 'auditLedger', name: 'Audit Log Ledger', desc: 'Trace administrative activity sync logs' }
                          ].map((feature) => (
                            <div key={feature.id} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">{feature.name}</p>
                                <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{feature.desc}</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                                <input 
                                  type="checkbox" 
                                  checked={featureFlags[feature.id] ?? true} 
                                  onChange={() => handleToggleFeature(feature.id)} 
                                  className="sr-only peer" 
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
