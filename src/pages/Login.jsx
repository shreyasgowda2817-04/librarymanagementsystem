import { API_URL } from "../config";
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import OTPInput from "../components/OTPInput";
import libraryBanner from "../assets/library.jpg";

export default function Login() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const authSuccess = searchParams.get("auth_success");
    const userData = searchParams.get("user");
    const error = searchParams.get("error");

    if (error) {
      if (error === "account_link_required") {
        toast.error("Account exists. Please log in with password to link Google.");
      } else if (error === "account_banned") {
        toast.error("This account has been suspended.");
      } else if (error === "maintenance") {
        toast.error("The platform is currently under maintenance. Please try again later.");
      } else if (error === "expired") {
        const lastBlocked = localStorage.getItem("last_blocked_request");
        if (lastBlocked) {
          try {
            const details = JSON.parse(lastBlocked);
            toast.error(`Session expired due to inactivity (Blocked: ${details.url.replace(window.location.origin, "")}). Please log in again.`);
            localStorage.removeItem("last_blocked_request");
          } catch (e) {
            toast.error("Session expired due to inactivity. Please log in again.");
          }
        } else {
          toast.error("Session expired due to inactivity. Please log in again.");
        }
      } else {
        toast.error("Authentication failed.");
      }
      return;
    }

    if (authSuccess && userData) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        localStorage.setItem("user", JSON.stringify(user));
        toast.success(`Welcome back, ${user.name}!`);
        nav(user.role === "admin" ? "/admin-dashboard" : "/dashboard");
      } catch (err) {
        toast.error("System synchronization failed.");
      }
    }
  }, [searchParams, nav]);

  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Login, 2: 2FA OTP

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      if (data.requires2FA) {
        toast.success("Security Check Required.");
        setStep(2);
      } else {
        localStorage.setItem("user", JSON.stringify(data));
        toast.success(`Welcome back, ${data.name}!`);
        if (data.role === "admin") {
          nav("/admin-dashboard");
        } else {
          nav("/dashboard");
        }
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/verify-2fa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("user", JSON.stringify(data));
      toast.success("Identity Verified.");
      if (data.role === "admin") {
        nav("/admin-dashboard");
      } else {
        nav("/dashboard");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0f172a] transition-colors duration-300">
      {/* Left Panel - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-teal-900/40 mix-blend-multiply z-10"></div>
        <img 
          src={libraryBanner} 
          alt="Library" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="relative z-20 flex flex-col justify-end p-16 h-full text-white w-full">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-8 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">Welcome back.</h1>
            <p className="text-lg text-teal-100 max-w-lg font-medium leading-relaxed">
              Log in to access your library dashboard, borrow books, and explore your personalized reading recommendations.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-gray-50 dark:bg-[#0f172a] transition-colors duration-300">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="bg-teal-600 p-2 rounded-xl flex items-center justify-center shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">LMS</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-black text-gray-900 dark:text-slate-50 tracking-tight mb-2">
              {step === 1 ? "Log in to your account" : "Security Verification"}
            </h2>
            <p className="text-gray-500 dark:text-slate-400">
              {step === 1 ? "Enter your credentials to continue." : "Enter the 6-digit code sent to your email."}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  name="email"
                      placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full p-3.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 text-gray-900 dark:text-white transition-shadow shadow-md"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-200">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm font-bold text-teal-600 hover:text-teal-500 dark:text-teal-400">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  name="password"
                  placeholder="Enter Your Password"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full p-3.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 text-gray-900 dark:text-white transition-shadow shadow-md"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/20 transition-all shadow-md hover:shadow-teal-500/30 mt-4 disabled:opacity-70 flex items-center justify-center"
              >
                {loading ? <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-800 border-t-white rounded-full animate-spin"></div> : "Log in"}
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-slate-700"></div></div>
                <div className="relative flex justify-center text-xs font-bold uppercase text-gray-500 bg-gray-50 dark:bg-[#0f172a] px-4">
                  Or continue with
                </div>
              </div>

              <button 
                type="button" 
                onClick={() => window.location.href = `${API_URL}/api/auth/google`} 
                className="w-full py-3.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-all shadow-md flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </button>

              <p className="mt-8 text-sm text-center font-medium text-gray-600 dark:text-slate-400">
                Don't have an account?{" "}
                <Link to="/register" className="text-teal-600 hover:text-teal-500 dark:text-teal-400 font-bold hover:underline">
                  Sign up
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-2">
                  Verification Code
                </label>
                <OTPInput 
                  value={otp} 
                  onChange={setOtp} 
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/20 transition-all shadow-md mt-4 flex items-center justify-center disabled:opacity-70"
              >
                {loading ? <div className="w-5 h-5 border-2 border-slate-200 dark:border-slate-800 border-t-white rounded-full animate-spin"></div> : "Verify"}
              </button>

              <p className="mt-4 text-sm text-center font-medium text-gray-600 dark:text-slate-400">
                <button type="button" onClick={() => setStep(1)} className="text-teal-600 hover:underline">
                  Back to login
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
