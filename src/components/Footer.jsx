import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaInstagram, FaTwitter, FaYoutube, FaEnvelope,
  FaBookOpen, FaShieldAlt, FaGlobe, FaArrowRight, FaComments
} from "react-icons/fa";
import { Sparkles } from "lucide-react";
import { FaCableCar } from 'react-icons/fa6';

export default function Footer({ isAdmin }) {
  return (
    <footer className="bg-white dark:bg-[#020617] border-t border-slate-100 dark:border-slate-200 dark:border-slate-800 flex-shrink-0 relative z-20 mt-auto font-sans transition-colors duration-500">
      <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-6">

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">

          <div className="space-y-3">
            <Link to="/dashboard" className="flex items-center gap-3 inline-flex group">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/10 group-hover:scale-110 transition-transform duration-500">
                <FaBookOpen className="text-white" size={16} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold text-slate-900 dark:text-white tracking-tight leading-none">
                  LMS <span className="text-indigo-600"></span>
                </span>
                <span className="text-[9px] font-medium text-slate-400 mt-0.5">Library Management System</span>
              </div>
            </Link>

            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium leading-normal max-w-md">
              A modern library management system for managing books, members, and learning resources.
            </p>

            <div className="flex flex-col gap-1.5">
              <a href="mailto:shreyasgowda2817@gmail.com" className="flex items-center gap-2 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:opacity-70 transition-opacity">
                <FaEnvelope size={10} /> shreyasgowda2817@gmail.com
              </a>
              <p className="text-[9px] font-semibold text-slate-400 mt-1">
                Integrated with 40+ Research Databases
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Library</h3>
            <ul className="space-y-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
              <li><Link to="/dashboard" className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5">Dashboard</Link></li>
              <li><Link to="/books" className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5">Library</Link></li>
              <li><Link to="/membership" className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5">Membership Plans</Link></li>
              {isAdmin && <li><Link to="/reports" className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5">Reports</Link></li>}
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Resources</h3>
            <ul className="space-y-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5">Documentation</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5">API Status</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5">Community</a></li>
              <li><a href="#" onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('openChatSupport'));
              }} className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Security</h3>
            <ul className="space-y-1 text-[12px] font-medium text-slate-500 dark:text-slate-400">
              <li><a href="#" className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5"><FaShieldAlt size={11} className="inline mr-2" /> Secure Access</a></li>
              <li><a href="missuse.html" className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5"><FaGlobe className="inline mr-2" /> Global CDN</a></li>
              <li><a href="#" onClick={(e) => { 
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('toggleAIAssistant'));
              }} className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5"><Sparkles size={12} className="inline mr-2" /> AI Assistant</a></li>
              <li><a href="https://wa.me/917483468116" className="hover:text-indigo-600 transition-colors inline-block min-h-0 py-0.5"><FaArrowRight className="inline mr-2" /> Support</a></li>
            </ul>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 pt-5 border-t border-slate-100 dark:border-slate-200 dark:border-slate-800">
          {/* Left Side: Brand & Legal Cluster */}
          <div className="flex flex-col md:flex-row items-baseline gap-4 md:gap-8 order-2 lg:order-1 text-center md:text-left">
            <div className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
              © {new Date().getFullYear()} LMS Pro
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 pt-0.5">
              {['Privacy Policy', 'Terms of Service', 'Licensing'].map((text) => (
                <a 
                  key={text} 
                  href={`${text.toLowerCase().split(' ')[0]}.html`} 
                  className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 transition-all whitespace-nowrap min-h-0 py-0.5"
                >
                  {text}
                </a>
              ))}
            </div>
          </div>

          {/* Right Side: Socials */}
          <div className="flex items-center gap-6 order-3">
            {[
              { icon: FaTwitter, url: "https://twitter.com" },
              { icon: FaInstagram, url: "https://instagram.com/shreyasgowda0417/" },
              { icon: FaYoutube, url: "https://youtube.com" }
            ].map((soc, i) => (
              <a key={i} href={soc.url} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-indigo-600 transition-all hover:-translate-y-1 min-h-0">
                <soc.icon size={15} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
