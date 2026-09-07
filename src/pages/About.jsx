import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Github, Linkedin, ExternalLink, ArrowRight, ArrowLeft, Zap, Shield, Users, Building } from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = ["Impact", "Leadership", "New Releases", "Newsroom", "Investors", "Resources"];

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 font-sans selection:bg-red-600 selection:text-white overflow-x-hidden">
      
      {/* Premium Corporate Navbar - Crisp White */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-lg shadow-sm py-4' : 'bg-white py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-red-600 font-black tracking-tighter text-2xl md:text-3xl hover:opacity-80 transition-opacity">
              LIBRARY
            </Link>
            <div className="hidden lg:flex gap-8">
              {navItems.map(item => (
                <button 
                  key={item} 
                  onClick={() => scrollTo(item.toLowerCase().replace(' ', '-'))} 
                  className="text-sm font-semibold text-slate-600 hover:text-red-600 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <Link to="/" className="hidden md:flex items-center text-sm font-semibold text-slate-700 hover:text-red-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Cinematic Hero - Dark Contrast */}
      <section className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 bg-slate-950 overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 -mr-40 -mt-40 w-96 h-96 rounded-full bg-red-600/20 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-96 h-96 rounded-full bg-blue-600/20 blur-3xl opacity-50" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-8"
          >
            A new era for <br className="hidden md:block"/> educational resources.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto font-light leading-relaxed"
          >
            Discover the story, the impact, and the technology behind the world's most seamless Library Management System.
          </motion.p>
        </div>
      </section>

      {/* Impact Section - Clean White */}
      <section id="impact" className="py-24 lg:py-32 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 text-slate-900">Global Impact</h2>
          <p className="text-xl text-slate-600 leading-relaxed">
            By digitizing traditional library workflows, we've created an ecosystem that empowers students to learn faster and administrators to manage smarter.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
           <div className="border-t-2 border-slate-100 pt-8">
             <Zap className="w-8 h-8 text-red-600 mb-6" />
             <h3 className="text-5xl lg:text-6xl font-light text-slate-900 mb-4 tracking-tighter">80%</h3>
             <p className="text-xl font-bold mb-2 text-slate-900">Faster Checkouts</p>
             <p className="text-slate-600 leading-relaxed">Streamlined digital interfaces completely eliminate long queues at the circulation desk.</p>
           </div>
           <div className="border-t-2 border-slate-100 pt-8">
             <Shield className="w-8 h-8 text-red-600 mb-6" />
             <h3 className="text-5xl lg:text-6xl font-light text-slate-900 mb-4 tracking-tighter">100%</h3>
             <p className="text-xl font-bold mb-2 text-slate-900">Offline Reliability</p>
             <p className="text-slate-600 leading-relaxed">Progressive Web App technology ensures administrators can manage resources even during outages.</p>
           </div>
           <div className="border-t-2 border-slate-100 pt-8">
             <Users className="w-8 h-8 text-red-600 mb-6" />
             <h3 className="text-5xl lg:text-6xl font-light text-slate-900 mb-4 tracking-tighter">24/7</h3>
             <p className="text-xl font-bold mb-2 text-slate-900">Automated Support</p>
             <p className="text-slate-600 leading-relaxed">Smart algorithms handle overdue penalties, emails, and system health checks silently.</p>
           </div>
        </div>
      </section>

      {/* Leadership Section - Light Gray */}
      <section id="leadership" className="py-24 lg:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-16 text-slate-900">Leadership</h2>
          <div className="bg-white rounded-3xl p-8 lg:p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/3">
              <div className="aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center p-8 text-center border border-slate-100">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
                  <span className="text-3xl font-bold text-red-600">SG</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Shreyas Gowda HG</h3>
                <p className="text-red-600 font-semibold mt-2 tracking-wide text-sm uppercase">Founder & Developer</p>
                <div className="flex gap-4 mt-8">
                  <a href="https://github.com/shreyasgowda2817-04" target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-full shadow-sm border border-slate-100 hover:border-slate-300 hover:text-red-600 transition-all"><Github className="w-5 h-5" /></a>
                  <a href="https://www.linkedin.com/in/shreyas-gowda-h-g-486316386" target="_blank" rel="noopener noreferrer" className="p-3 bg-white rounded-full shadow-sm border border-slate-100 hover:border-slate-300 hover:text-red-600 transition-all"><Linkedin className="w-5 h-5" /></a>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-2/3">
              <h3 className="text-3xl md:text-4xl font-bold mb-8 text-slate-900 leading-tight">Building the future of educational infrastructure.</h3>
              <p className="text-xl text-slate-600 leading-relaxed mb-6 font-light">
                <strong className="font-semibold text-slate-900">Shreyas Gowda HG</strong> is the sole founder and developer of the Library Management System. 
                Currently associated with Dr NSAM First Grade College, Shreyas engineered this platform from the ground up to solve real-world administrative challenges.
              </p>
              <p className="text-xl text-slate-600 leading-relaxed font-light">
                By combining cutting-edge web technologies—like React, Node.js, and Progressive Web Apps—with a relentless focus on user experience, the system pushes the boundaries of what educational software can be.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* New Releases & Newsroom */}
      <section className="py-24 lg:py-32 max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-20">
          <div id="new-releases">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-12 text-slate-900">New Releases</h2>
            <div className="space-y-12">
              <div className="relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-red-600">
                <p className="text-sm text-red-600 font-bold tracking-widest uppercase mb-3">v2.0 Framework Update</p>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">Enterprise SEO & PWA</h3>
                <p className="text-slate-600 text-lg leading-relaxed">Integrated advanced Schema.org JSON-LD graph data for deep search engine optimization. Activated full Progressive Web App installation capabilities for mobile and desktop.</p>
              </div>
              <div className="relative pl-8 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-200">
                <p className="text-sm text-slate-500 font-bold tracking-widest uppercase mb-3">v1.5 Core Update</p>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">Automated Email System</h3>
                <p className="text-slate-600 text-lg leading-relaxed">Deployed robust Nodemailer integration with Resend fallback for zero-downtime transactional emails and OTP verifications.</p>
              </div>
            </div>
          </div>
          
          <div id="newsroom">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-12 text-slate-900">Newsroom</h2>
            <div className="space-y-6">
              <a href="#" className="block p-8 rounded-2xl border border-slate-200 hover:border-red-200 hover:bg-red-50/50 transition-colors group">
                <p className="text-sm text-slate-500 font-semibold mb-3">September 2026</p>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug">Vercel Production Deployment stabilized achieving 100% uptime.</h3>
              </a>
              <a href="#" className="block p-8 rounded-2xl border border-slate-200 hover:border-red-200 hover:bg-red-50/50 transition-colors group">
                <p className="text-sm text-slate-500 font-semibold mb-3">August 2026</p>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug">Library Management System unveils new corporate product identity.</h3>
              </a>
              <a href="#" className="block p-8 rounded-2xl border border-slate-200 hover:border-red-200 hover:bg-red-50/50 transition-colors group">
                <p className="text-sm text-slate-500 font-semibold mb-3">July 2026</p>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-red-600 transition-colors leading-snug">Dr NSAM First Grade College initiates digital transformation pilot.</h3>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Investors & Resources - Dark Footer Area */}
      <section className="bg-slate-950 text-white pt-24 lg:pt-32 pb-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-20 mb-24">
          <div id="investors">
            <h2 className="text-3xl font-bold mb-10">Investors & Partners</h2>
            <div className="flex items-start gap-6">
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                <Building className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">Dr NSAM First Grade College</h3>
                <p className="text-slate-400 text-lg leading-relaxed">
                  The primary organization, inspiration, and testing ground for this digital transformation initiative.
                </p>
              </div>
            </div>
          </div>
          
          <div id="resources">
            <h2 className="text-3xl font-bold mb-10">Resources</h2>
            <div className="flex flex-col gap-4">
              <a href="https://github.com/shreyasgowda2817-04/librarymanagementsystem.git" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                    <Code className="w-6 h-6 text-slate-300" />
                  </div>
                  <span className="font-semibold text-lg">Source Code Repository</span>
                </div>
                <ArrowRight className="text-slate-600 group-hover:text-red-500 transition-colors" />
              </a>
              <a href="https://librarymanagementsystem-psi.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all group">
                <div className="flex items-center gap-5">
                  <div className="p-3 bg-slate-800 rounded-lg group-hover:bg-slate-700 transition-colors">
                    <ExternalLink className="w-6 h-6 text-slate-300" />
                  </div>
                  <span className="font-semibold text-lg">Live Application</span>
                </div>
                <ArrowRight className="text-slate-600 group-hover:text-red-500 transition-colors" />
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-8 border-t border-slate-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-red-600 font-black tracking-tighter text-2xl">LIBRARY</div>
          <p className="text-slate-500 text-sm font-medium">© {new Date().getFullYear()} Library Management System. Founded by Shreyas Gowda HG.</p>
        </div>
      </section>

    </div>
  );
}
