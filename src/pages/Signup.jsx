import React, { useState } from "react";
import toast from 'react-hot-toast';
import { useNavigate, Link } from "react-router-dom";
import libraryBanner from "../assets/library.jpg";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();
    localStorage.setItem("user", JSON.stringify({ name, email, password }));
    toast.success("Account created! Please login now.");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-[#0f172a] transition-colors duration-300">
      {/* Left Panel - Image Background */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-teal-900/40 mix-blend-multiply z-10"></div>
        <img 
          src={libraryBanner} 
          alt="Library Books" 
          className="absolute inset-0 w-full h-full object-cover scale-105"
        />
        <div className="relative z-20 flex flex-col justify-end p-16 h-full text-white w-full">
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center mb-8 shadow-md">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">Join our reading community.</h1>
            <p className="text-lg text-teal-100 max-w-lg font-medium leading-relaxed">
              Create an account to borrow books, track your reading history, and get personalized recommendations from our vast catalog.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
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
            <h2 className="text-3xl font-black text-gray-900 dark:text-slate-50 tracking-tight mb-2">Create an account</h2>
            <p className="text-gray-500 dark:text-slate-400">Enter your details to register.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 text-gray-900 dark:text-white transition-shadow shadow-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-2">
                Email address
              </label>
              <input
                type="email"
                name="email"
                placeholder="mail@library.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 text-gray-900 dark:text-white transition-shadow shadow-md"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-200 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3.5 bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400 text-gray-900 dark:text-white transition-shadow shadow-md"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 focus:ring-4 focus:ring-teal-500/20 transition-all shadow-md hover:shadow-teal-500/30 mt-4"
            >
              Sign up
            </button>
          </form>

          <p className="mt-8 text-sm text-center font-medium text-gray-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300 font-bold hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
