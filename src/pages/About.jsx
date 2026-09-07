import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Github, Linkedin, ExternalLink, ChevronRight, User, Code, Globe, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = ["Impact", "Leadership", "New Releases", "Newsroom", "Investors", "Resources"];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-black min-h-screen text-white font-sans selection:bg-red-600 selection:text-white">
      
      {/* Netflix Corporate Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-black/90 backdrop-blur-md py-4 shadow-2xl border-b border-zinc-900' : 'bg-gradient-to-b from-black/80 to-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-red-600 font-black tracking-tighter text-3xl hover:scale-105 transition-transform">
              LIBRARY
            </Link>
            <div className="hidden lg:flex gap-8">
              {navItems.map(item => (
                <button 
                  key={item} 
                  onClick={() => scrollTo(item.toLowerCase().replace(' ', '-'))} 
                  className="text-sm font-bold text-gray-300 hover:text-white transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <Link to="/" className="flex items-center text-sm font-bold text-gray-400 hover:text-white transition-colors bg-zinc-900 px-4 py-2 rounded border border-zinc-800 hover:border-zinc-600">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to App
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 via-black to-black opacity-60" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 w-full mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-6xl md:text-8xl lg:text-[120px] font-black tracking-tighter mb-8 leading-[0.9]"
          >
            EDUCATE <br /> THE WORLD.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-xl md:text-3xl text-gray-400 font-light max-w-3xl mb-12"
          >
            A premium digital ecosystem for modern educational institutions, engineered for speed, scale, and seamless user experiences.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            onClick={() => scrollTo('leadership')}
            className="bg-red-600 hover:bg-red-700 text-white px-10 py-5 rounded font-bold text-xl transition-colors inline-flex items-center group"
          >
            Read the Story <ChevronRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>
      </section>

      {/* Impact Section */}
      <section id="impact" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-20">Impact</h2>
        <div className="grid md:grid-cols-3 gap-12">
           <div className="border-t border-gray-800 pt-8 group">
             <h3 className="text-7xl font-light text-red-600 mb-6 group-hover:scale-105 transition-transform origin-left">80%</h3>
             <p className="text-2xl font-bold mb-4">Faster Transactions</p>
             <p className="text-gray-400 leading-relaxed text-lg">Streamlined digital interfaces reduce the time required to checkout and return books across the entire campus.</p>
           </div>
           <div className="border-t border-gray-800 pt-8 group">
             <h3 className="text-7xl font-light text-red-600 mb-6 group-hover:scale-105 transition-transform origin-left">100%</h3>
             <p className="text-2xl font-bold mb-4">Offline Reliability</p>
             <p className="text-gray-400 leading-relaxed text-lg">Built-in Progressive Web App (PWA) capabilities ensure administrators can manage resources even during network outages.</p>
           </div>
           <div className="border-t border-gray-800 pt-8 group">
             <h3 className="text-7xl font-light text-red-600 mb-6 group-hover:scale-105 transition-transform origin-left">24/7</h3>
             <p className="text-2xl font-bold mb-4">Automated Operations</p>
             <p className="text-gray-400 leading-relaxed text-lg">Background chron jobs and smart algorithms handle overdue penalties, email notifications, and system health checks silently.</p>
           </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section id="leadership" className="py-32 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-20">Leadership</h2>
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="w-full md:w-1/3">
              <div className="aspect-[3/4] bg-zinc-900 rounded flex items-center justify-center relative overflow-hidden group border border-zinc-800 shadow-2xl">
                <User className="w-40 h-40 text-zinc-800" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 backdrop-blur-sm">
                  <a href="https://github.com/shreyasgowda2817-04" target="_blank" className="p-4 bg-red-600 rounded-full hover:scale-110 transition-transform"><Github className="w-6 h-6" /></a>
                  <a href="https://www.linkedin.com/in/shreyas-gowda-h-g-486316386" target="_blank" className="p-4 bg-red-600 rounded-full hover:scale-110 transition-transform"><Linkedin className="w-6 h-6" /></a>
                </div>
              </div>
            </div>
            <div className="w-full md:w-2/3">
              <h3 className="text-5xl md:text-7xl font-black mb-4">Shreyas Gowda HG</h3>
              <p className="text-3xl text-red-600 font-medium tracking-tight mb-10">Founder & Lead Developer</p>
              <p className="text-2xl text-gray-400 leading-relaxed mb-8 font-light">
                Shreyas Gowda HG is the sole founder and developer of the Library Management System. 
                Currently associated with Dr NSAM First Grade College, Shreyas engineered this platform to solve real-world administrative challenges.
              </p>
              <p className="text-2xl text-gray-400 leading-relaxed font-light">
                By combining cutting-edge web technologies with a relentless focus on user experience, the system pushes the boundaries of what educational software can be.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* New Releases & Newsroom */}
      <section id="new-releases" className="py-32 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-32">
          <div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-16">New Releases</h2>
            <div className="space-y-12">
              <div className="border-l-4 border-red-600 pl-8">
                <p className="text-sm text-red-500 font-bold tracking-widest uppercase mb-3">v2.0 Framework Update</p>
                <h3 className="text-3xl font-bold mb-4">Enterprise SEO & PWA</h3>
                <p className="text-gray-400 text-xl leading-relaxed">Integrated advanced Schema.org JSON-LD graph data for deep search engine optimization. Activated full Progressive Web App installation capabilities for mobile and desktop.</p>
              </div>
              <div className="border-l-4 border-zinc-800 pl-8 hover:border-zinc-600 transition-colors">
                <p className="text-sm text-gray-500 font-bold tracking-widest uppercase mb-3">v1.5 Core Update</p>
                <h3 className="text-3xl font-bold mb-4">Automated Email System</h3>
                <p className="text-gray-400 text-xl leading-relaxed">Deployed robust Nodemailer integration with Resend fallback for zero-downtime transactional emails and OTP verifications.</p>
              </div>
            </div>
          </div>
          <div id="newsroom">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-16">Newsroom</h2>
            <div className="space-y-10">
              <a href="#" className="block group">
                <p className="text-sm text-red-600 font-bold tracking-widest uppercase mb-3">September 2026</p>
                <h3 className="text-3xl font-medium group-hover:text-red-500 transition-colors leading-tight">Vercel Production Deployment stabilized achieving 100% uptime.</h3>
              </a>
              <a href="#" className="block group border-t border-zinc-900 pt-10">
                <p className="text-sm text-gray-500 font-bold tracking-widest uppercase mb-3">August 2026</p>
                <h3 className="text-3xl font-medium group-hover:text-red-500 transition-colors leading-tight">Library Management System unveils new cinematic corporate identity.</h3>
              </a>
              <a href="#" className="block group border-t border-zinc-900 pt-10">
                <p className="text-sm text-gray-500 font-bold tracking-widest uppercase mb-3">July 2026</p>
                <h3 className="text-3xl font-medium group-hover:text-red-500 transition-colors leading-tight">Dr NSAM First Grade College initiates digital transformation pilot.</h3>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Investors & Resources */}
      <section id="investors" className="py-32 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid lg:grid-cols-2 gap-32">
          <div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-16">Investors</h2>
            <div className="p-12 border border-zinc-800 rounded-lg bg-black hover:border-red-900/50 transition-colors">
              <h3 className="text-4xl font-bold mb-6 leading-tight">Dr NSAM First Grade College</h3>
              <p className="text-gray-400 text-xl leading-relaxed">The primary organization, inspiration, and testing ground for this digital transformation initiative.</p>
            </div>
          </div>
          <div id="resources">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-16">Resources</h2>
            <div className="space-y-6">
              <a href="https://github.com/shreyasgowda2817-04/librarymanagementsystem.git" target="_blank" className="flex items-center justify-between p-8 bg-black border border-zinc-800 rounded hover:border-red-600 transition-colors group">
                <div className="flex items-center gap-6">
                  <Code className="text-gray-500 group-hover:text-white transition-colors w-8 h-8" />
                  <span className="text-2xl font-bold">Source Code</span>
                </div>
                <ExternalLink className="text-gray-600 group-hover:text-red-600 w-6 h-6" />
              </a>
              <a href="https://librarymanagementsystem-psi.vercel.app" target="_blank" className="flex items-center justify-between p-8 bg-black border border-zinc-800 rounded hover:border-red-600 transition-colors group">
                <div className="flex items-center gap-6">
                  <Globe className="text-gray-500 group-hover:text-white transition-colors w-8 h-8" />
                  <span className="text-2xl font-bold">Live Application</span>
                </div>
                <ExternalLink className="text-gray-600 group-hover:text-red-600 w-6 h-6" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 text-center text-zinc-600 border-t border-zinc-900 font-medium">
        <p>Library Management System © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
