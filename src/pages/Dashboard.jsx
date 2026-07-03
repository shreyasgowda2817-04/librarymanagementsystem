import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  FaBook,
  FaUsers,
  FaExchangeAlt,
  FaSearch,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaShieldAlt,
  FaChevronRight,
  FaDatabase,
  FaPlus,
  FaArrowUp,
  FaSyncAlt,
  FaBrain,
  FaClipboardList,
  FaDesktop,
  FaMobileAlt,
  FaLaptop,
  FaDownload,
  FaSignOutAlt,
  FaCog,
  FaAt,
  FaGlobe,
  FaBell,
} from "react-icons/fa";
import libraryBanner from "../assets/library.jpg";
import toast from "react-hot-toast";
import FocusMode from "../components/FocusMode";
import { AnimatePresence, motion } from "framer-motion";
import { translations } from "../i18n/translations";
import { io } from "socket.io-client";
import { API_URL } from "../config";
import DashboardAI from "../components/DashboardAI";
import { DashboardSkeleton } from "../components/Skeleton";
import IDCardModal from "../components/IDCardModal";

import JsBarcode from "jsbarcode";

function BarcodeImage({ rollNo }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (rollNo) {
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, rollNo, {
          format: "CODE128",
          width: 2,
          height: 60,
          displayValue: true,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000"
        });
        setUrl(canvas.toDataURL("image/png"));
      } catch (err) {}
    }
  }, [rollNo]);

  if (!url) return null;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Student ID Barcode</span>
      <img src={url} alt="ID Barcode" className="max-w-[200px] w-full h-auto rounded-lg mix-blend-multiply dark:mix-blend-normal" />
    </div>
  );
}


export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [telemetry, setTelemetry] = useState([]);
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState(new Date());
  const [apiStatus, setApiStatus] = useState("online");
  const [heartbeat, setHeartbeat] = useState(0);
  const [showIdModal, setShowIdModal] = useState(false);



  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin";
  const fileInputRef = useRef(null);

  // 🕹️ ACCOUNT COMMAND CENTER STATE
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "identity",
  );
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userData, setUserData] = useState(user);
  const [favorites, setFavorites] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [bookRequests, setBookRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    password: "",
  });
  const [language, setLanguage] = useState(user?.preferences?.language || "en");
  const t = translations[language] || translations.en;
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, saved
  const [featureConfig, setFeatureConfig] = useState({
    leaderboard: true,
    reservations: true,
    aiAssistant: true,
    recommendations: true,
    vault: true,
    auditLedger: true,
  });

  useEffect(() => {
    console.log("Dashboard Feature Config:", featureConfig);
  }, [featureConfig]);


  const orchestrationModules = [
    {
      id: "leaderboard",
      label: "Member Leaderboard",
      desc: "Manage gamification and points system",
      icon: FaBrain,
    },
    {
      id: "reservations",
      label: "Reservation Engine",
      desc: "Process and manage book holds",
      icon: FaClock,
    },
    {
      id: "aiAssistant",
      label: "AI Assistant",
      desc: "AI-powered research guidance",
      icon: FaBrain,
    },
    {
      id: "recommendations",
      label: "Recommendations",
      desc: "Personalized book suggestions",
      icon: FaSearch,
    },
    {
      id: "vault",
      label: "User Data",
      desc: "Secure member data encryption",
      icon: FaShieldAlt,
    },
    {
      id: "auditLedger",
      label: "Audit Logs",
      desc: "Immutable system event logging",
      icon: FaClipboardList,
    },
  ];
  const [globalSettings, setGlobalSettings] = useState(null);
  const [systemSettings, setSystemSettings] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [socketStatus, setSocketStatus] = useState("disconnected");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    fetchData();

    // Initialize Socket Connection
    const newSocket = io(API_URL);

    newSocket.on("connect", () => {
      setSocketStatus("connected");
      const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
      if (currentUser._id) {
        newSocket.emit("join", currentUser._id);
      }
    });

    newSocket.on("disconnect", () => {
      setSocketStatus("disconnected");
    });

    newSocket.on("notification:new", (notification) => {
      toast.success(`New Notification: ${notification.title}`);
      setNotifications((prev) => [notification, ...prev]);
      fetchData();
    });

    newSocket.on("dashboard:update", (data) => {
      // Silently fetch fresh data when books or transactions change
      fetchData();
    });

    newSocket.on("system:update", (settings) => {
      if (isAdmin) {
        setGlobalSettings(settings);
        toast("System Settings Updated by Admin", { icon: "🔄" });
      }
      fetchData(); // Refresh config for everyone
    });

    const pulseInterval = setInterval(
      () => setHeartbeat((h) => (h + 1) % 100),
      2000,
    );
    return () => {
      clearInterval(pulseInterval);
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isEditingProfile) {
      const autoSave = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          const userObj = JSON.parse(localStorage.getItem("user") || "{}");
          const token = userObj.token || localStorage.getItem("token");
          const res = await fetch(`${API_URL}/api/auth/profile`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: 'include',
            body: JSON.stringify(profileForm),

          });
          if (res.ok) {
            const updated = await res.json();
            setUserData(updated);
            localStorage.setItem("user", JSON.stringify(updated));
            setSaveStatus("saved");
            setTimeout(() => setSaveStatus("idle"), 2000);
          }
        } catch (e) {
          setSaveStatus("idle");
        }
      }, 1000);
      return () => clearTimeout(autoSave);
    }
  }, [profileForm, isEditingProfile]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      const token = userObj.token || localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // CORE DATA - Fetched first to unblock UI instantly
      const coreRes = await Promise.all([
        fetch(`${API_URL}/api/books`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/transactions${isAdmin ? "" : "/my"}`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/auth/me`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/config/features`, { headers, credentials: 'include' }).catch(() => ({ ok: false })),
        fetch(`${API_URL}/api/settings`, { headers, credentials: 'include' }).catch(() => ({ ok: false }))
      ]);

      if (coreRes[0].ok) {
        const booksData = await coreRes[0].json();
        setBooks(Array.isArray(booksData) ? booksData : (booksData.books || []));
      }
      if (coreRes[1].ok) {
        const txData = await coreRes[1].json();
        setTransactions(Array.isArray(txData) ? txData : (txData.transactions || []));
      }
      if (coreRes[2].ok) {
        const data = await coreRes[2].json();
        setUserData(data);
        setProfileForm({ name: data.name, email: data.email, password: "" });
        if (data.preferences?.language) setLanguage(data.preferences.language);
      }
      if (coreRes[3].ok) setFeatureConfig(await coreRes[3].json());
      if (coreRes[4].ok) setSystemSettings(await coreRes[4].json());

      // UNBLOCK UI IMMEDIATELY
      setIsLoading(false);
      setApiStatus("online");
      setLastSync(new Date());

      // SECONDARY DATA - Fetched silently in the background
      Promise.all([
        isAdmin ? fetch(`${API_URL}/api/members`, { headers, credentials: 'include' }) : Promise.resolve({ ok: false }),
        fetch(`${API_URL}/api/auth/favorites`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/reservations/my`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/book-requests/my`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/auth/leaderboard`, { headers, credentials: 'include' }),
        isAdmin ? fetch(`${API_URL}/api/transactions/telemetry`, { headers, credentials: 'include' }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
        fetch(`${API_URL}/api/auth/sessions`, { headers, credentials: 'include' }).catch(() => ({ ok: false })),
        isAdmin ? fetch(`${API_URL}/api/audit`, { headers, credentials: 'include' }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
        isAdmin ? fetch(`${API_URL}/api/admin/settings`, { headers, credentials: 'include' }).catch(() => ({ ok: false })) : Promise.resolve({ ok: false }),
        fetch(`${API_URL}/api/notifications`, { headers, credentials: 'include' }).catch(() => ({ ok: false }))
      ]).then(async (secRes) => {
        if (secRes[0].ok) setMembers(await secRes[0].json());
        if (secRes[1].ok) setFavorites(await secRes[1].json());
        if (secRes[2].ok) setReservations(await secRes[2].json());
        if (secRes[3].ok) setBookRequests(await secRes[3].json());
        if (secRes[4].ok) setLeaderboard(await secRes[4].json());
        if (secRes[5].ok) setTelemetry(await secRes[5].json());
        if (secRes[6].ok) setSessions(await secRes[6].json());
        if (secRes[7] && secRes[7].ok) setAuditLogs(await secRes[7].json());
        if (secRes[8] && secRes[8].ok) setGlobalSettings(await secRes[8].json());
        if (secRes[9] && secRes[9].ok) setNotifications(await secRes[9].json());
      }).catch(console.error);

    } catch (error) {
      setApiStatus("offline");
      toast.error("System Offline. Retrying...");
      setIsLoading(false);
    }
  };

  const logoutSession = async (sid) => {
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      const token = userObj.token;
      const res = await fetch(`${API_URL}/api/auth/sessions/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: sid }),
      });
      if (res.ok) {
        setSessions(sessions.filter((s) => s.sessionId !== sid));
        toast.success("Session Terminated");
        if (sid === userObj.sessionId) {
          localStorage.removeItem("user");
          navigate("/login");
        }
      }
    } catch (e) {
      toast.error("Security Error");
    }
  };

  const logoutAllSessions = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await fetch(`${API_URL}/api/auth/sessions/logout-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        localStorage.removeItem("user");
        navigate("/login");
        toast.success("Logout All Sessions");
      }
    } catch (e) {
      toast.error("Security Error");
    }
  };

  const handleUpdateSettings = async (type, settings) => {
    setSaveStatus("saving");
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      const token = userObj.token;
      const res = await fetch(`${API_URL}/api/auth/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ [type]: settings }),
      });
      if (res.ok) {
        const data = await res.json();
        // Merge into component state
        setUserData(prev => ({ ...prev, ...data }));
        // Persist to localStorage so toggles survive page reload
        const updatedUser = { ...userObj, ...data };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSaveStatus("saved");
        toast.success("Settings Updated");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("idle");
        toast.error("Failed to update settings");
      }
    } catch (e) {
      setSaveStatus("idle");
      toast.error("Settings Error");
    }
  };

  const toggleFeature = async (feature) => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const updatedFeatures = {
        ...featureConfig,
        [feature]: !featureConfig[feature],
      };
      const res = await fetch(`${API_URL}/api/config/features`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedFeatures),
      });
      if (res.ok) {
        setFeatureConfig(updatedFeatures);
        toast.success(
          `${feature.charAt(0).toUpperCase() + feature.slice(1)} Settings Updated`,
        );
      }
    } catch (e) {
      toast.error("Configuration Connection Failed");
    }
  };

  const updateGlobalSettings = async (section, data) => {
    setSaveStatus("saving");
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const updated = {
        ...globalSettings,
        [section]: { ...globalSettings[section], ...data },
      };
      const res = await fetch(`${API_URL}/api/admin/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setGlobalSettings(await res.json());
        setSaveStatus("saved");
        toast.success("System Settings Updated");
        setTimeout(() => setSaveStatus("idle"), 2000);
      }
    } catch (e) {
      setSaveStatus("idle");
      toast.error("Request Failed");
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    const loadingToast = toast.loading(
      "Preparing data export...",
    );
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await fetch(`${API_URL}/api/auth/export-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `System-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("Data Exported Successfully", {
          id: loadingToast,
        });
      } else {
        toast.error("Connection Failed", { id: loadingToast });
      }
    } catch (e) {
      toast.error("Request Failed", { id: loadingToast });
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      const token = userObj.token || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      if (res.ok) {
        const updated = await res.json();
        setUserData(updated);
        localStorage.setItem("user", JSON.stringify(updated));
        setIsEditingProfile(false);
        toast.success("Profile Updated");
      } else {
        toast.error("Update Failed");
      }
    } catch (error) {
      toast.error("Connection Slow");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profilePhoto", file);

    const toastId = toast.loading("Uploading profile photo...");
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      const token = userObj.token || localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      toast.success("Profile photo updated successfully!", { id: toastId });

      setUserData(prev => ({ ...prev, profilePhoto: data.profilePhoto }));
      const updatedUser = { ...userObj, profilePhoto: data.profilePhoto, token: data.token || userObj.token };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      window.dispatchEvent(new Event("storage"));
    } catch (err) {
      toast.error(err.message || "Failed to upload photo", { id: toastId });
    }
  };

  const analytics = useMemo(() => {
    const activeTx = transactions.filter((t) => !t.returned).length;
    const returnedTx = transactions.filter((t) => t.returned).length;

    // 🧠 RECOMMENDATION LOGIC
    const userInterests = [
      ...favorites.map((f) => f.bookId?.category),
      ...transactions.map((t) => t.bookId?.category),
      ...reservations.map((r) => r.bookId?.category),
    ].filter(Boolean);

    const freq = userInterests.reduce((acc, cat) => {
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});

    const topCategory = Object.entries(freq).sort(
      (a, b) => b[1] - a[1],
    )[0]?.[0];

    const recommended = books
      .filter(
        (b) =>
          b.category === topCategory &&
          !favorites.some((f) => f.bookId?.id === b.id),
      )
      .slice(0, 4);

    return {
      activeLoans: activeTx,
      efficiency: transactions.length
        ? Math.round((returnedTx / transactions.length) * 100)
        : 0,
      points: userData?.points || 0,
      rank: leaderboard.findIndex((l) => l._id === userData?._id) + 1 || "--",
      recommended,
      topCategory,
      insights: [
        {
          msg:
            socketStatus === "connected"
              ? "Online"
              : "Realtime Disconnected",
          icon: FaCheckCircle,
          color: socketStatus === "connected" ? "emerald" : "rose",
        },
        {
          msg:
            apiStatus === "online"
              ? "System Online"
              : "System Offline",
          icon: FaCheckCircle,
          color: apiStatus === "online" ? "emerald" : "amber",
        },
        {
          msg: `${activeTx} Books Issued`,
          icon: FaClock,
          color: "indigo",
        },
        {
          msg: `System Health: ${heartbeat}%`,
          icon: FaBrain,
          color: "purple",
        },
      ],
    };
  }, [
    transactions,
    userData,
    leaderboard,
    apiStatus,
    heartbeat,
    favorites,
    reservations,
    books,
  ]);

  const pendingDues = useMemo(() => {
    return transactions
      .filter((tx) => {
        const txUserId = tx.memberId?._id || tx.memberId || tx.user?._id || tx.user;
        const isMyTx = String(txUserId) === String(userData?._id);
        return isMyTx && tx.currentPenalty > 0 && !tx.finePaid;
      })
      .reduce((acc, curr) => acc + curr.currentPenalty, 0);
  }, [transactions, userData]);

  const chartData =
    telemetry.length > 0
      ? telemetry
      : [
        { name: "Mon", value: 0 },
        { name: "Tue", value: 0 },
        { name: "Wed", value: 0 },
        { name: "Thu", value: 0 },
        { name: "Fri", value: 0 },
        { name: "Sat", value: 0 },
        { name: "Sun", value: 0 },
      ];

  const markAsRead = async (id) => {
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await fetch(`${API_URL}/api/notifications/read/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
        );
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        toast.success("All notifications marked as read");
      }
    } catch (e) {
      console.error("Failed to mark all as read", e);
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm("Clear all notifications?")) return;
    try {
      const token = JSON.parse(localStorage.getItem("user") || "{}").token;
      const res = await fetch(`${API_URL}/api/notifications/clear-all`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications([]);
        toast.success("Notifications cleared");
      }
    } catch (e) {
      console.error("Failed to clear notifications", e);
    }
  };


  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.isRead).length
    : 0;

  if (isLoading && books.length === 0) {
    return <DashboardSkeleton />;
  }

  const kpis = [
    {
      label: "Total Books",
      val: books.length,
      icon: FaBook,
      col: "indigo",
      desc: "Total assets in catalog",
    },
    {
      label: "Active Members",
      val: members.length,
      icon: FaUsers,
      col: "purple",
      desc: "Registered library users",
    },
    {
      label: "Transactions",
      val: transactions.length,
      icon: FaExchangeAlt,
      col: "emerald",
      desc: "Books issued & returned",
    },
    {
      label: "Reward Credits",
      val: analytics.points,
      icon: FaBrain,
      col: "amber",
      desc: "Points earned by members",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10">
        {/* Security Warning Banner */}
        {((systemSettings?.require2FA || globalSettings?.security?.require2FA || (globalSettings?.security?.force2FAForAdmins && userData?.role === "admin")) && !userData?.securitySettings?.twoFactor) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10 dark:from-red-500/20 dark:to-amber-500/20 border border-red-500/30 dark:border-red-500/40 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-xl relative overflow-hidden animate-pulse-slow"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-red-600 dark:bg-red-500 text-white rounded-xl shadow-md shadow-red-500/20">
                <FaShieldAlt className="animate-pulse" size={18} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">
                  Security Check Required
                </h4>
                <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5 max-w-2xl font-medium">
                  An administrator has enforced Two-Factor Authentication (2FA) for your account tier. You must enable it immediately to prevent restriction of platform privileges.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab("security")}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/15 transition-all self-stretch md:self-auto text-center"
            >
              Configure 2FA
            </button>
          </motion.div>
        )}


        {/* Hero Section */}
        <div className="relative h-[360px] rounded-xl overflow-hidden mb-10 shadow-md group">
          <img
            src={libraryBanner}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Library"
          />
          <div className="absolute inset-0 bg-slate-950/60"></div>

          <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-indigo-400 font-bold text-sm uppercase tracking-wider mb-2">
                Welcome Back
              </p>
              <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">
                Library <span className="text-indigo-400">Dashboard</span>
              </h1>
              <p className="text-slate-300 text-lg max-w-xl mb-8">
                Manage books, members, and transactions in one place.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate("/books")}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-500 transition-colors flex items-center gap-2"
                >
                  <FaBook /> Browse Books
                </button>
                <button
                  onClick={() =>
                    isAdmin ? navigate("/members") : navigate("/leaderboard")
                  }
                  className="px-6 py-3 bg-white/10 backdrop-blur-md text-white border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors flex items-center gap-2"
                >
                  <FaUsers /> {isAdmin ? "Manage Members" : "View Leaderboard"}
                </button>
                
                <button
                  onClick={() => {
                    navigate("/fines");
                  }}
                  className={`px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center gap-2 shadow-lg backdrop-blur-md border ${
                    pendingDues > 0 
                      ? "bg-gradient-to-r from-rose-600/90 to-red-600/90 text-white border-rose-400/50 hover:from-rose-500 hover:to-red-500 hover:scale-105 hover:-translate-y-1 shadow-rose-500/40 relative overflow-hidden group" 
                      : "bg-emerald-600/20 text-emerald-100 border-emerald-500/30 hover:bg-emerald-600/40"
                  }`}
                >
                  {pendingDues > 0 && (
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                  )}
                  <FaBell className={`relative z-10 ${pendingDues > 0 ? "animate-bounce" : ""}`} /> 
                  <span className="relative z-10">{pendingDues > 0 ? `Pay Fines (₹${pendingDues})` : "No Pending Dues"}</span>
                </button>
                {!isAdmin && (
                  <button
                    onClick={() => setShowIdModal(true)}
                    className="px-6 py-3 bg-emerald-600/90 backdrop-blur-md text-white border border-emerald-500/50 rounded-xl font-bold text-sm hover:bg-emerald-500 transition-colors flex items-center gap-2"
                  >
                    <FaDesktop /> View My ID Barcode
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {kpis.map((kpi, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md group"
            >
              <div className="flex justify-between items-center mb-4">
                <div
                  className={`p-3 bg-${kpi.col}-50 dark:bg-${kpi.col}-500/10 text-${kpi.col}-600 rounded-xl`}
                >
                  <kpi.icon size={20} />
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                  Growing
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {kpi.val}
              </h3>
              <p className="text-sm font-medium text-slate-500 mt-1">
                {kpi.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Activity Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-md">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Recent Activity
                </h3>
                <p className="text-sm text-slate-500">
                  Overview of book circulation trends
                </p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                Live Updates
              </div>
            </div>
            <div className="h-[300px] w-full" style={{ minHeight: '300px' }}>
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      background: "#fff",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPulse)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 🧠 NEURAL INTERFACE SECTION */}
          {featureConfig.aiAssistant && (
            <DashboardAI />
          )}
        </div>

        {/* 📟 QUICK HUB & ELITE VAULT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
          {/* 🧠 RECOMMENDATIONS */}
          {featureConfig.recommendations && (
            <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl p-12 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-3xl font-black tracking-tighter">
                    Recommendations
                  </h3>
                  <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">
                    Active Members
                  </p>
                </div>
                <FaBrain className="text-indigo-600 animate-pulse" size={24} />
              </div>
              <div className="space-y-6">
                {analytics.recommended.length > 0 ? (
                  analytics.recommended.map((book, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ x: 10 }}
                      onClick={() => navigate(`/books?id=${book.id}`)}
                      className="flex items-center gap-6 p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-transparent hover:border-indigo-600 transition-all cursor-pointer group"
                    >
                      <div className="w-16 h-20 bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden shadow-md group-hover:scale-105 transition-transform shrink-0">
                        <img
                          src={book.coverUrl || libraryBanner}
                          className="w-full h-full object-cover"
                          alt="B"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-base truncate group-hover:text-indigo-600 transition-colors">
                          {book.title}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {book.author}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 text-center text-slate-400 font-semibold tracking-wide text-[10px] opacity-40">
                    Recommendations initializing... <br /> Borrow more
                    assets to refine.
                  </div>
                )}
              </div>
              {analytics.recommended.length > 0 && (
                <button
                  onClick={() => navigate("/books")}
                  className="mt-8 w-full py-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl text-sm font-semibold hover:bg-indigo-600 hover:text-white transition-all shadow-md"
                >
                  Explore More
                </button>
              )}
            </div>
          )}

          {/* 📜 Transactions */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-12 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FaExchangeAlt className="text-indigo-500" />
                {isAdmin ? "Transactions" : "My Transactions"}
              </h3>
              <button
                onClick={() =>
                  navigate(isAdmin ? "/issue-return" : "/dashboard")
                }
                className="text-[10px] font-black text-indigo-600 hover:underline uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-full"
              >
                View All
              </button>
            </div>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left min-w-[600px] lg:min-w-0">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-6">Book Title</th>
                    {isAdmin && <th className="pb-6">Member</th>}
                    <th className="pb-6">Due Date</th>
                    <th className="pb-6">Status</th>
                    <th className="pb-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {transactions.slice(0, 5).map((tx, i) => (
                    <tr
                      key={i}
                      className="group hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <td className="py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                            {tx.bookId?.title || "System Update"}
                          </span>
                          <span className="text-[11px] text-slate-500 uppercase tracking-wider">
                            {tx.bookId?.author}
                          </span>
                        </div>
                      </td>
                      {isAdmin && (
                        <td className="py-4">
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {tx.memberId?.name || "N/A"}
                          </span>
                        </td>
                      )}
                      <td className="py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {tx.dueDate ? new Date(tx.dueDate).toLocaleDateString() : "N/A"}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tx.returned ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                        >
                          {tx.returned ? "Returned" : "Issued"}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button
                          onClick={() =>
                            navigate(
                              isAdmin
                                ? "/issue-return"
                                : "/dashboard?tab=identity",
                            )
                          }
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <FaChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              {transactions.length === 0 && (
                <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">
                  No active transactions
                </div>
              )}
            </div>

          {/* Premium Perks Card */}
          <div className="lg:col-span-1 flex flex-col gap-8">
            {user?.membership === "Premium" ? (
              <div className="bg-slate-900 rounded-xl p-8 text-white relative overflow-hidden border border-slate-800 shadow-md">
                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-amber-500 text-white rounded-xl shadow-md shadow-amber-500/20">
                      <FaDatabase size={20} />
                    </div>
                    <h3 className="text-lg font-bold tracking-tight uppercase tracking-wider">
                      Premium Access
                    </h3>
                  </div>
                  <div className="space-y-4">
                    {[
                      { t: "Exclusive Books", d: "Access rare manuscripts" },
                      { t: "Advanced Search", d: "AI-powered discovery" },
                      { t: "Cloud Sync", d: "Sync reading data anywhere" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="p-4 bg-white/5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-colors cursor-pointer"
                      >
                        <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1">
                          {item.t}
                        </p>
                        <p className="text-sm text-slate-400 leading-tight">
                          {item.d}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-[10px] font-bold text-amber-500/80 uppercase tracking-widest text-center">
                  Premium Membership Active
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                    <FaDatabase className="text-indigo-600" />{" "}
                    {isAdmin ? "Admin Panel" : "Shortcuts"}
                  </h3>
                  <div className="space-y-4">
                    <button
                      onClick={() => navigate("/books")}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl group hover:bg-indigo-600 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 group-hover:bg-white/20 group-hover:text-white rounded-xl flex items-center justify-center">
                          {isAdmin ? <FaPlus /> : <FaSearch />}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider group-hover:text-white">
                          {isAdmin ? "Add New Book" : "Browse Catalog"}
                        </span>
                      </div>
                      <FaChevronRight
                        className="text-slate-400 group-hover:text-white"
                        size={12}
                      />
                    </button>
                    <button
                      onClick={() =>
                        navigate(isAdmin ? "/members" : "/membership")
                      }
                      className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl group hover:bg-indigo-600 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 group-hover:bg-white/20 group-hover:text-white rounded-xl flex items-center justify-center">
                          {isAdmin ? <FaPlus /> : <FaArrowUp />}
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider group-hover:text-white">
                          {isAdmin ? "Register Member" : "Upgrade Plan"}
                        </span>
                      </div>
                      <FaChevronRight
                        className="text-slate-400 group-hover:text-white"
                        size={12}
                      />
                    </button>
                  </div>
                </div>
                <div
                  className="mt-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-dashed border-indigo-200 dark:border-indigo-800 text-center cursor-pointer hover:bg-indigo-600 group transition-colors"
                  onClick={() => navigate("/membership")}
                >
                  <p className="text-[11px] font-bold text-indigo-600 group-hover:text-white uppercase tracking-wider">
                    Unlock Premium Features
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Account Settings Section */}
        <div className="mt-20 border-t border-slate-200 dark:border-slate-800 pt-16 pb-20">
          <div className="max-w-[1400px] mx-auto px-4">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6 border border-indigo-100 shadow-md">
                <FaShieldAlt size={12} /> Secure Profile
              </div>
              <h2 className="text-4xl font-bold tracking-tight mb-4">
                Account <span className="text-indigo-600">Settings</span>
              </h2>
              <div className="flex items-center justify-center gap-3 mb-8 h-6">
                <AnimatePresence mode="wait">
                  {saveStatus === "saving" && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2 text-indigo-500 font-bold text-[10px] uppercase tracking-wider"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                        className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full"
                      />
                      {t.saving}
                    </motion.div>
                  )}
                  {saveStatus === "saved" && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-wider"
                    >
                      <FaCheckCircle size={12} /> {t.saved}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium max-w-xl mx-auto">
                Manage your profile, library activity, and account security.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Navigation Sidebar */}
              <div className="lg:col-span-3 space-y-2 sticky top-10">
                {[
                  {
                    id: "identity",
                    icon: FaUsers,
                    label: "Profile Info",
                    desc: "Account credentials",
                    color: "indigo",
                  },
                  {
                    id: "protocols",
                    icon: FaCheckCircle,
                    label: "My Reservations",
                    desc: "Active book requests",
                    color: "emerald",
                  },
                  {
                    id: "vault",
                    icon: FaDatabase,
                    label: "My Library",
                    desc: "Saved book collection",
                    color: "amber",
                  },
                  {
                    id: "history",
                    icon: FaClipboardList,
                    label: "Activity Log",
                    desc: "Recent history",
                    color: "blue",
                  },

                  ...(isAdmin
                    ? [
                      {
                        id: "security",
                        icon: FaShieldAlt,
                        label: "Security",
                        desc: "Access & Password",
                        color: "rose",
                      },
                    ]
                    : []),
                  ...(isAdmin
                    ? [
                      {
                        id: "orchestration",
                        icon: FaSyncAlt,
                        label: "Features",
                        desc: "System toggles",
                        color: "indigo",
                      },
                    ]
                    : []),
                  ...(isAdmin
                    ? [
                      {
                        id: "system",
                        icon: FaCog,
                        label: "System Settings",
                        desc: "Global config",
                        color: "slate",
                      },
                    ]
                    : []),
                  
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all border border-transparent text-left group ${activeTab === item.id ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800 text-indigo-600" : "bg-transparent text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                  >
                    <div
                      className={`p-2 rounded-xl transition-all shrink-0 ${activeTab === item.id ? `bg-indigo-600 text-white shadow-md shadow-indigo-600/20` : `bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-slate-600`}`}
                    >
                      <item.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold uppercase tracking-wider">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate font-medium">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="lg:col-span-9 min-h-[500px]">
                <AnimatePresence mode="wait">
                  {activeTab === "identity" && (
                    <motion.div
                      key="identity"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    >
                      <div className="bg-white dark:bg-slate-900 rounded-xl p-10 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col items-center text-center">
                          <div className="w-32 h-32 rounded-full p-1 bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 mb-8 relative">
                            <img
                              src={
                                userData?.profilePhoto ||
                                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                              }
                              className="w-full h-full object-cover rounded-full"
                              alt="Profile"
                            />
                            <input 
                               type="file" 
                               ref={fileInputRef} 
                               onChange={handleAvatarChange} 
                               className="hidden" 
                               accept="image/*" 
                             />
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className="absolute -bottom-1 -right-1 w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900 hover:scale-105 transition-all"
                            >
                              <FaPlus size={14} />
                            </button>
                          </div>
                          <h3 className="text-3xl font-bold tracking-tight mb-2">
                            {userData?.name}
                          </h3>
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-8 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
                            {isAdmin ? "Administrator" : "Library Member"}
                          </p>
                          <div className="w-full space-y-4">
                            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                User Role
                              </span>
                              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase px-2 py-0.5 bg-white dark:bg-slate-800 rounded shadow-md">
                                {isAdmin ? "Root Admin" : "Standard"}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Reward Points
                              </span>
                              <span className="text-lg font-bold text-indigo-600">
                                {userData?.points || 0} pts
                              </span>
                            </div>
                            {!isAdmin && userData?.rollNo && (
                              <BarcodeImage rollNo={userData.rollNo} />
                            )}
                            <div className="p-6 bg-slate-900 rounded-xl text-white shadow-md relative overflow-hidden group">
                              <div className="relative z-10 text-left">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                                  Current Plan
                                </span>
                                <h4 className="text-2xl font-bold mb-4">
                                  {userData?.membership || "Basic"}
                                </h4>
                                {userData?.membership === "Basic" ? (
                                  <button
                                    onClick={() => navigate("/membership")}
                                    className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-500 transition-colors"
                                  >
                                    Upgrade Membership
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                                      All Features Unlocked
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-xl p-10 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col">
                        <div className="flex justify-between items-center mb-10">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Personal Information
                          </h4>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleExportData}
                              disabled={isExporting}
                              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-colors flex items-center gap-2"
                            >
                              <FaDownload size={12} />{" "}
                              {isExporting ? "Exporting..." : "Export Data"}
                            </button>
                            <button
                              onClick={() =>
                                setIsEditingProfile(!isEditingProfile)
                              }
                              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-colors ${isEditingProfile ? "bg-rose-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-indigo-600 hover:text-white"}`}
                            >
                              {isEditingProfile ? "Cancel" : "Edit"}
                            </button>
                          </div>
                        </div>

                        <div className="flex-1">
                          {isEditingProfile ? (
                            <form className="space-y-6">
                              <div className="space-y-6">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                    Full Name
                                  </label>
                                  <input
                                    type="text"
                                    value={profileForm.name}
                                    onChange={(e) =>
                                      setProfileForm({
                                        ...profileForm,
                                        name: e.target.value,
                                      })
                                    }
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-sm outline-none focus:border-indigo-600 transition-all"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                    Email Address
                                  </label>
                                  <input
                                    type="email"
                                    value={profileForm.email}
                                    onChange={(e) =>
                                      setProfileForm({
                                        ...profileForm,
                                        email: e.target.value,
                                      })
                                    }
                                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-sm outline-none focus:border-indigo-600 transition-all"
                                  />
                                </div>
                              </div>
                            </form>
                          ) : (
                            <div className="space-y-10">
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                  Full Name
                                </p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                  {userData?.name}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                  Email Address
                                </p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                  {userData?.email}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                  Member Since
                                </p>
                                <p className="text-xl font-bold text-slate-900 dark:text-white">
                                  {new Date(
                                    userData?.createdAt,
                                  ).toLocaleDateString(undefined, {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                                  Display Language
                                </p>
                                <div className="flex gap-3">
                                  {[
                                    { id: "en", label: "English" },
                                    { id: "hi", label: "Hindi" },
                                    { id: "kn", label: "Kannada" },
                                  ].map((lang) => (
                                    <button
                                      key={lang.id}
                                      onClick={() => {
                                        setLanguage(lang.id);
                                        handleUpdateSettings("preferences", {
                                          language: lang.id,
                                        });
                                      }}
                                      className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-colors ${language === lang.id ? "bg-indigo-600 border-indigo-600 text-white shadow-md" : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-600"}`}
                                    >
                                      {lang.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "protocols" && (
                    <motion.div
                      key="protocols"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8"
                    >
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold tracking-tight">
                              Reserved Books
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                              Status of your pending reservations.
                            </p>
                          </div>
                          <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {reservations.length} Active
                          </span>
                        </div>
                        <div className="p-8">
                          {reservations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {reservations.map((res, i) => (
                                <div
                                  key={i}
                                  className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent hover:border-indigo-100 transition-all group"
                                >
                                  <div className="w-16 h-24 rounded-xl overflow-hidden shadow-md shrink-0">
                                    <img
                                      src={
                                        res.bookId?.coverUrl || libraryBanner
                                      }
                                      className="w-full h-full object-cover"
                                      alt="B"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-base truncate mb-1 group-hover:text-indigo-600 transition-colors">
                                      {res.bookId?.title}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                      {res.bookId?.author}
                                    </p>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-xl text-[10px] font-bold text-slate-600">
                                      Queue: #{res.queuePosition}
                                    </div>
                                  </div>
                                  <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                                    <FaSyncAlt size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                              No active reservations.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold tracking-tight">
                              Book Requests
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                              Tracking your new book suggestions.
                            </p>
                          </div>
                          <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {bookRequests.length} Pending
                          </span>
                        </div>
                        <div className="p-8">
                          {bookRequests.length > 0 ? (
                            <div className="space-y-4">
                              {bookRequests.map((req, i) => (
                                <div
                                  key={i}
                                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"
                                >
                                  <div>
                                    <h4 className="font-bold text-base mb-1">
                                      {req.title}
                                    </h4>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                      {req.author || "General Request"}
                                    </p>
                                  </div>
                                  <div
                                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${req.status === "Approved" ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"}`}
                                  >
                                    {req.status}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                              No book requests found.
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "vault" && (
                    <motion.div
                      key="vault"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white dark:bg-slate-900 rounded-xl p-10 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden"
                    >
                      {userData?.membership === "Basic" && !isAdmin && (
                        <div className="absolute inset-0 z-50 bg-slate-950/20 backdrop-blur-sm flex items-center justify-center p-8 text-center">
                          <div className="bg-white dark:bg-slate-900 p-10 rounded-xl shadow-md border border-slate-100 dark:border-slate-800 max-w-md">
                            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                              <FaShieldAlt size={32} />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">
                              Premium Feature
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed text-sm">
                              The Personal Collection is restricted to Premium
                              members. Upgrade your account to save books and
                              manage your personal library.
                            </p>
                            <button
                              onClick={() => navigate("/membership")}
                              className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-indigo-500 transition-all"
                            >
                              Upgrade Plan
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-10 relative z-10">
                        <div>
                          <h3 className="text-2xl font-bold tracking-tight">
                            My Collection
                          </h3>
                          <p className="text-sm text-slate-500">
                            Your saved books and resources.
                          </p>
                        </div>
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center shadow-md">
                          <FaDatabase size={20} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 relative z-10">
                        {favorites.map((fav, i) => (
                          <div key={i} className="group cursor-pointer">
                            <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800 group-hover:border-indigo-600 transition-all duration-300">
                              <img
                                src={fav.bookId?.coverUrl || libraryBanner}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                alt="B"
                              />
                            </div>
                            <p className="mt-3 text-[11px] font-bold text-center truncate group-hover:text-indigo-600 transition-colors uppercase tracking-wider">
                              {fav.bookId?.title}
                            </p>
                          </div>
                        ))}
                        {favorites.length === 0 && (
                          <div className="col-span-full py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                            Your collection is empty
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "history" && (
                    <motion.div
                      key="history"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8"
                    >
                      {isAdmin && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Admin Logs</h3>
                              <p className="text-sm text-slate-500">Audit log of system modifications.</p>
                            </div>
                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold">
                              {auditLogs.length} Events
                            </span>
                          </div>
                          <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800">
                                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Admin</th>
                                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Action</th>
                                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Target</th>
                                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Details</th>
                                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Time</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                {auditLogs.map((log, i) => (
                                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                    <td className="p-4 align-middle">
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                          {log.adminName.charAt(0)}
                                        </div>
                                        <span className="font-medium text-slate-900 dark:text-white text-sm">{log.adminName}</span>
                                      </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-xs font-medium border border-slate-200 dark:border-slate-700">
                                        {log.action}
                                      </span>
                                    </td>
                                    <td className="p-4 align-middle font-medium text-sm text-slate-900 dark:text-white">
                                      {log.target}
                                    </td>
                                    <td className="p-4 align-middle text-sm text-slate-500 max-w-xs truncate" title={log.details}>
                                      {log.details}
                                    </td>
                                    <td className="p-4 align-middle text-right text-xs text-slate-500 font-medium whitespace-nowrap">
                                      {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                                {auditLogs.length === 0 && (
                                  <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500 text-sm">Admin log is empty.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold tracking-tight">
                              My Activity
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                              History of your library transactions.
                            </p>
                          </div>
                          {!isAdmin && (
                            <button
                              onClick={() => window.open(`${API_URL}/api/auth/export-data?format=csv&token=${user.token}`, '_blank')}
                              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-bold uppercase tracking-wider hover:shadow-md transition-all flex items-center gap-2"
                            >
                              <FaDownload size={12} /> Export CSV
                            </button>
                          )}

                        </div>
                        <div className="p-8 space-y-4">
                          {transactions.slice(0, 10).map((tx, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-6 p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-indigo-100 transition-colors group"
                            >
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${tx.returned ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"}`}
                              >
                                {tx.returned ? "✓" : "•"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-lg truncate group-hover:text-indigo-600 transition-colors">
                                  {tx.bookId?.title}
                                </h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                  Date:{" "}
                                  {new Date(tx.issueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div
                                className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tx.returned ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}
                              >
                                {tx.returned ? "Returned" : "Issued"}
                              </div>
                            </div>
                          ))}
                          {transactions.length === 0 && (
                            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                              No activity found.
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "orchestration" && isAdmin && (
                    <motion.div
                      key="orchestration"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8"
                    >
                      <div className="mb-16">
                        <h3 className="text-4xl font-black tracking-tighter mb-4">
                          System Orchestration
                        </h3>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[12px]">
                          Infrastructure Module Management
                        </p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {orchestrationModules.map((module) => (
                          <div
                            key={module.id}
                            className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between hover:border-indigo-600 transition-colors"
                          >
                            <div className="mb-6">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl flex items-center justify-center">
                                  <module.icon size={18} />
                                </div>
                                <h4 className="text-sm font-bold uppercase tracking-wider">
                                  {module.label}
                                </h4>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {module.desc}
                              </p>
                            </div>
                            <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider ${featureConfig[module.id] ? "text-emerald-500" : "text-rose-500"}`}
                              >
                                {featureConfig[module.id]
                                  ? "Active"
                                  : "Disabled"}
                              </span>
                              <button
                                onClick={() => toggleFeature(module.id)}
                                className={`w-12 h-6 rounded-full relative transition-all ${featureConfig[module.id] ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-800"}`}
                              >
                                <motion.div
                                  animate={{
                                    x: featureConfig[module.id] ? 24 : 4,
                                  }}
                                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "security" && (
                    <motion.div
                      key="security"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-10 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between relative overflow-hidden">
                          <div className="relative z-10">
                            <h3 className="text-xl font-bold tracking-tight mb-8 flex items-center gap-3">
                              <FaShieldAlt className="text-rose-500" /> Security
                              Controls
                            </h3>
                            <div className="space-y-6">
                              {[
                                {
                                  id: "biometric",
                                  label: "Biometric Login",
                                  desc: "Fingerprint or Face ID",
                                  icon: FaBrain,
                                  color: "emerald",
                                },
                                {
                                  id: "twoFactor",
                                  label: "Two-Factor Auth",
                                  desc: "Account verification codes",
                                  icon: FaShieldAlt,
                                  color: "indigo",
                                },
                                {
                                  id: "shieldProtocol",
                                  label: "Auto Logout",
                                  desc: "Log out after inactivity",
                                  icon: FaSyncAlt,
                                  color: "amber",
                                },
                              ].map((setting) => (
                                <div
                                  key={setting.id}
                                  className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group hover:border-indigo-600 transition-colors"
                                >
                                  <div className="flex items-center gap-4">
                                    <div
                                      className={`w-10 h-10 bg-${setting.color}-50 text-${setting.color}-500 dark:bg-${setting.color}-900/20 rounded-xl flex items-center justify-center`}
                                    >
                                      <setting.icon size={16} />
                                    </div>
                                    <div>
                                      <p className="font-bold text-sm mb-0.5">
                                        {setting.label}
                                      </p>
                                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                        {setting.desc}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleUpdateSettings("securitySettings", {
                                        [setting.id]:
                                          !userData?.securitySettings?.[
                                          setting.id
                                          ],
                                      })
                                    }
                                    className={`w-12 h-6 rounded-full relative transition-all ${userData?.securitySettings?.[setting.id] ? `bg-${setting.color}-500` : "bg-slate-300 dark:bg-slate-700"}`}
                                  >
                                    <motion.div
                                      animate={{
                                        x: userData?.securitySettings?.[
                                          setting.id
                                        ]
                                          ? 24
                                          : 4,
                                      }}
                                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                                    />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl p-10 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-8">
                              <h3 className="text-xl font-bold tracking-tight">
                                Active Protection
                              </h3>
                              <button
                                onClick={logoutAllSessions}
                                className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                              >
                                Logout All Devices
                              </button>
                            </div>
                            <div className="p-8 bg-slate-900 rounded-xl text-white relative overflow-hidden group">
                              <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-6">
                                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-indigo-400 border border-slate-200 dark:border-slate-800">
                                    <FaShieldAlt size={24} />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">
                                      Security Status
                                    </p>
                                    <h4 className="text-xl font-bold tracking-tight">
                                      Secure Sessions
                                    </h4>
                                  </div>
                                </div>
                                <p className="text-slate-400 font-medium text-sm leading-relaxed mb-6">
                                  Your account is currently signed in on{" "}
                                  <span className="text-white font-bold">
                                    {sessions.length} devices
                                  </span>
                                  . Monitor active sessions below.
                                </p>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-2">
                                  <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "100%" }}
                                    transition={{ duration: 1 }}
                                    className="h-full bg-indigo-500"
                                  ></motion.div>
                                </div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center">
                                  Status: Fully Encrypted
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-8">
                        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                          <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Device Sessions</h3>
                            <p className="text-sm text-slate-500">Current signed-in devices for your account.</p>
                          </div>
                          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-semibold">
                            {sessions.length} Active
                          </span>
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
                              {sessions.map((sess, i) => {
                                const currentSessId = JSON.parse(localStorage.getItem("user") || "{}").sessionId;
                                const isCurrent = sess.sessionId === currentSessId;
                                const isMobile = sess.userAgent.toLowerCase().includes("mobile") || sess.userAgent.toLowerCase().includes("android") || sess.userAgent.toLowerCase().includes("iphone");
                                return (
                                  <tr key={i} className={`transition-colors ${isCurrent ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                                    <td className="p-4 align-middle">
                                      <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCurrent ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                                          {isMobile ? <FaMobileAlt size={16} /> : <FaDesktop size={16} />}
                                        </div>
                                        <div>
                                          <div className="flex items-center gap-2">
                                            <span className="font-medium text-slate-900 dark:text-white text-sm">
                                              {sess.userAgent.split(" ")[0]}
                                            </span>
                                            {isCurrent && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold uppercase rounded-full tracking-wider">Current</span>}
                                          </div>
                                          <p className="text-xs text-slate-500 truncate max-w-[150px]">{sess.userAgent}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="p-4 align-middle">
                                      <div className="text-sm font-medium text-slate-900 dark:text-white">{sess.location || "Unknown Location"}</div>
                                      <div className="text-xs text-slate-500">{sess.ip}</div>
                                    </td>
                                    <td className="p-4 align-middle text-sm text-slate-500">
                                      {new Date(sess.lastActive).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 align-middle text-right">
                                      {!isCurrent && (
                                        <button
                                          onClick={() => {
                                            if (window.confirm("Terminate this session?")) {
                                              logoutSession(sess.sessionId);
                                            }
                                          }}
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
                    </motion.div>
                  )}

 

                  {activeTab === "system" && isAdmin && globalSettings && (
                    <motion.div
                      key="system"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-md">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                              <FaGlobe size={20} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold tracking-tight">
                                Platform Config
                              </h3>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Global metadata
                              </p>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                Library Name
                              </label>
                              <input
                                type="text"
                                value={globalSettings.platform.siteName}
                                onChange={(e) =>
                                  updateGlobalSettings("platform", {
                                    siteName: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-sm outline-none focus:border-indigo-600 transition-colors"
                              />
                            </div>
                            <div className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                              <div>
                                <p className="font-bold text-sm mb-0.5">
                                  Maintenance Mode
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                                  Restrict user access
                                </p>
                              </div>
                              <button
                                onClick={() =>
                                  updateGlobalSettings("platform", {
                                    maintenanceMode:
                                      !globalSettings.platform.maintenanceMode,
                                  })
                                }
                                className={`w-12 h-6 rounded-full relative transition-all ${globalSettings.platform.maintenanceMode ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-700"}`}
                              >
                                <motion.div
                                  animate={{
                                    x: globalSettings.platform.maintenanceMode
                                      ? 24
                                      : 4,
                                  }}
                                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                                />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-md">
                          <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                              <FaAt size={20} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold tracking-tight">
                                Email Settings
                              </h3>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Configure SMTP for emails
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                  SMTP Host
                                </label>
                                <input
                                  type="text"
                                  value={globalSettings.email.smtpHost}
                                  onChange={(e) =>
                                    updateGlobalSettings("email", {
                                      smtpHost: e.target.value,
                                    })
                                  }
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-sm outline-none focus:border-purple-600 transition-colors"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                  Port
                                </label>
                                <input
                                  type="number"
                                  value={globalSettings.email.smtpPort}
                                  onChange={(e) =>
                                    updateGlobalSettings("email", {
                                      smtpPort: e.target.value,
                                    })
                                  }
                                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-sm outline-none focus:border-purple-600 transition-colors"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                                Sender Email
                              </label>
                              <input
                                type="email"
                                value={globalSettings.email.senderEmail}
                                onChange={(e) =>
                                  updateGlobalSettings("email", {
                                    senderEmail: e.target.value,
                                  })
                                }
                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-sm outline-none focus:border-purple-600 transition-colors"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-xl p-10 border border-slate-200 dark:border-slate-800 shadow-md md:col-span-2">
                          <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                              <FaShieldAlt size={20} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold tracking-tight">
                                System Security
                              </h3>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Global security settings
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 space-y-4">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Two-Factor Auth
                              </p>
                              <div className="flex justify-between items-center">
                                <p className="font-bold text-xs">Require 2FA (All)</p>
                                <button
                                  onClick={() =>
                                    updateGlobalSettings("security", {
                                      require2FA:
                                        !globalSettings.security.require2FA,
                                    })
                                  }
                                  className={`w-10 h-5 rounded-full relative transition-all ${globalSettings.security.require2FA ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-700"}`}
                                >
                                  <motion.div
                                    animate={{
                                      x: globalSettings.security.require2FA
                                        ? 20
                                        : 4,
                                    }}
                                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
                                  />
                                </button>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="font-bold text-xs">Force 2FA (Admins)</p>
                                <button
                                  onClick={() =>
                                    updateGlobalSettings("security", {
                                      force2FAForAdmins:
                                        !globalSettings.security.force2FAForAdmins,
                                    })
                                  }
                                  className={`w-10 h-5 rounded-full relative transition-all ${globalSettings.security.force2FAForAdmins ? "bg-rose-500" : "bg-slate-300 dark:bg-slate-700"}`}
                                >
                                  <motion.div
                                    animate={{
                                      x: globalSettings.security.force2FAForAdmins
                                        ? 20
                                        : 4,
                                    }}
                                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
                                  />
                                </button>
                              </div>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                                Session Timeout
                              </p>
                              <input
                                type="number"
                                value={globalSettings.security.sessionTimeout}
                                onChange={(e) =>
                                  updateGlobalSettings("security", {
                                    sessionTimeout: e.target.value,
                                  })
                                }
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 font-bold text-lg text-center focus:border-rose-500 outline-none"
                              />
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2">
                                Minutes before logout
                              </p>
                            </div>
                            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-4">
                                User Onboarding
                              </p>
                              <div className="flex justify-between items-center mb-3">
                                <p className="font-bold text-sm">
                                  Allow Signup
                                </p>
                                <button
                                  onClick={() =>
                                    updateGlobalSettings("userSystem", {
                                      enableRegistration:
                                        !globalSettings.userSystem
                                          .enableRegistration,
                                    })
                                  }
                                  className={`w-10 h-5 rounded-full relative transition-all ${globalSettings.userSystem.enableRegistration ? "bg-emerald-500" : "bg-slate-300"}`}
                                >
                                  <motion.div
                                    animate={{
                                      x: globalSettings.userSystem
                                        .enableRegistration
                                        ? 20
                                        : 4,
                                    }}
                                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
                                  />
                                </button>
                              </div>
                              <div className="flex justify-between items-center">
                                <p className="font-bold text-sm">
                                  Auto-Approve
                                </p>
                                <button
                                  onClick={() =>
                                    updateGlobalSettings("userSystem", {
                                      autoApproveUsers:
                                        !globalSettings.userSystem
                                          .autoApproveUsers,
                                    })
                                  }
                                  className={`w-10 h-5 rounded-full relative transition-all ${globalSettings.userSystem.autoApproveUsers ? "bg-emerald-500" : "bg-slate-300"}`}
                                >
                                  <motion.div
                                    animate={{
                                      x: globalSettings.userSystem
                                        .autoApproveUsers
                                        ? 20
                                        : 4,
                                    }}
                                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md"
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFocusMode && (
            <FocusMode onClose={() => setShowFocusMode(false)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showIdModal && userData?.rollNo && (
            <IDCardModal
              member={{ name: userData.name, rollNo: userData.rollNo }}
              onClose={() => setShowIdModal(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
