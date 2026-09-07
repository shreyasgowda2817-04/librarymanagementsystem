import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Github, Linkedin, ExternalLink, Play, Info, User, Code, Zap, Globe, Building2, BookOpen } from "lucide-react";
import Layout from "../components/Layout";

export default function About() {
  const [activeTab, setActiveTab] = useState("Leadership");

  const navItems = ["Impact", "Leadership", "New Releases", "Newsroom", "Investors", "Resources"];

  return (
    <Layout>
      <div className="bg-black text-white min-h-[90vh] rounded-2xl overflow-hidden relative shadow-2xl font-sans">
        
        {/* Netflix Corporate Style Top Sub-Nav */}
        <div className="flex overflow-x-auto hide-scrollbar border-b border-zinc-800 px-6 sm:px-12 py-4 space-x-8 bg-black/80 backdrop-blur-md sticky top-0 z-30">
          {navItems.map((item) => (
            <button
              key={item}
              onClick={() => setActiveTab(item)}
              className={`whitespace-nowrap text-sm sm:text-base font-bold transition-all duration-300 ${
                activeTab === item 
                  ? "text-white" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {item}
              {activeTab === item && (
                <motion.div 
                  layoutId="underline" 
                  className="h-1 bg-red-600 mt-3 absolute rounded-t-md" 
                  style={{ width: "20px" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Cinematic Hero Section */}
        <div className="relative h-[50vh] sm:h-[60vh] w-full bg-zinc-900 flex items-end pb-12 sm:pb-20 px-8 sm:px-16 overflow-hidden">
          {/* Subtle abstract background pattern/gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-900/20 via-black to-black z-0" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10" />
          
          <div className="relative z-20 max-w-4xl">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 1, ease: "easeOut" }}
            >
              <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tighter mb-4 text-white uppercase drop-shadow-2xl">
                <span className="text-red-600">L</span>IBRARY<br/>MANAGEMENT
              </h1>
              <p className="text-lg sm:text-2xl text-zinc-300 mb-8 max-w-2xl font-medium drop-shadow-lg">
                A premium, next-generation digital ecosystem designed to entertain your mind and educate your future.
              </p>
              <div className="flex gap-4">
                <button className="bg-white text-black px-6 sm:px-8 py-2 sm:py-3 rounded text-base sm:text-lg font-bold flex items-center hover:bg-zinc-200 transition-colors">
                  <Play className="w-5 h-5 mr-2 fill-current" /> Play Story
                </button>
                <button className="bg-zinc-600/40 backdrop-blur text-white px-6 sm:px-8 py-2 sm:py-3 rounded text-base sm:text-lg font-bold flex items-center hover:bg-zinc-600/60 transition-colors">
                  <Info className="w-5 h-5 mr-2" /> More Info
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Dynamic Content Sections */}
        <div className="px-8 sm:px-16 py-12 relative z-20 bg-black min-h-[40vh]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              
              {activeTab === "Leadership" && (
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold mb-2 text-white">The Creator</h2>
                    <h3 className="text-red-600 font-bold text-xl sm:text-2xl mb-6">Founder & Developer</h3>
                    <p className="text-zinc-400 text-lg leading-relaxed mb-8">
                      <strong className="text-zinc-200">Shreyas Gowda HG</strong> is the founder and developer of the Library Management System & Creator. 
                      Engineered to solve real-world administrative challenges, Shreyas built this platform to push the boundaries of digital library experiences and seamless user interfaces.
                    </p>
                    <div className="flex space-x-4">
                      <a href="https://github.com/shreyasgowda2817-04" target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-900 rounded-full hover:bg-red-600 hover:-translate-y-1 transition-all duration-300">
                        <Github className="w-6 h-6" />
                      </a>
                      <a href="https://www.linkedin.com/in/shreyas-gowda-h-g-486316386" target="_blank" rel="noopener noreferrer" className="p-3 bg-zinc-900 rounded-full hover:bg-red-600 hover:-translate-y-1 transition-all duration-300">
                        <Linkedin className="w-6 h-6" />
                      </a>
                    </div>
                  </div>
                  <div className="relative group">
                    <div className="aspect-[4/5] md:aspect-square rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden relative shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]">
                       <div className="absolute inset-0 bg-gradient-to-tr from-red-900/30 to-transparent z-0" />
                       <User className="w-32 h-32 text-zinc-700 relative z-10" />
                       <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent z-20">
                         <p className="text-3xl font-bold text-white mb-1">Shreyas Gowda HG</p>
                         <p className="text-red-500 font-semibold tracking-wide uppercase text-sm">Lead Engineer / Director</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Impact" && (
                <div className="max-w-4xl">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-white">Global Impact</h2>
                  <div className="grid sm:grid-cols-2 gap-8">
                    <div className="bg-zinc-900/50 p-8 rounded-xl border border-zinc-800 hover:border-red-900/50 transition-colors">
                      <Zap className="w-10 h-10 text-red-600 mb-6" />
                      <h3 className="text-xl font-bold text-white mb-3">Lightning Fast Operations</h3>
                      <p className="text-zinc-400 leading-relaxed">
                        Reduces checkout and book transaction times by 80% through an intuitive digital interface and automated penalty calculations.
                      </p>
                    </div>
                    <div className="bg-zinc-900/50 p-8 rounded-xl border border-zinc-800 hover:border-red-900/50 transition-colors">
                      <Globe className="w-10 h-10 text-red-600 mb-6" />
                      <h3 className="text-xl font-bold text-white mb-3">Offline Capable PWA</h3>
                      <p className="text-zinc-400 leading-relaxed">
                        Installable directly to mobile devices, allowing students and administrators to access library resources anytime, anywhere.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "New Releases" && (
                <div className="max-w-4xl">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-white">The Tech Stack</h2>
                  <div className="flex flex-wrap gap-4">
                    {['React.js 18', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Framer Motion', 'Vite PWA', 'Nodemailer'].map((tech) => (
                      <span key={tech} className="px-6 py-3 rounded-full text-base font-bold bg-zinc-900 text-zinc-300 border border-zinc-800 hover:border-red-600 hover:text-white transition-all cursor-default">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="mt-12 bg-zinc-900/50 border-l-4 border-red-600 p-6 rounded-r-xl">
                    <h3 className="text-xl font-bold text-white mb-2">Latest Patch Notes</h3>
                    <p className="text-zinc-400">v2.0 - Implemented Advanced SEO Schema.org Graph Data, automated email notifications via SMTP/Resend, and complete offline Progressive Web App (PWA) support.</p>
                  </div>
                </div>
              )}

              {activeTab === "Newsroom" && (
                <div className="max-w-4xl">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-white">Latest Headlines</h2>
                  <div className="space-y-6">
                    {[
                      { date: "Recent", title: "Library Management System goes fully installable with new PWA feature." },
                      { date: "Update", title: "Search Engine Optimization completely overhauled to solidify founder attribution." },
                      { date: "Launch", title: "Vercel Production Deployment successfully stabilized with zero downtime." }
                    ].map((news, i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-4 sm:gap-8 group cursor-pointer border-b border-zinc-800 pb-6 hover:border-zinc-600 transition-colors">
                        <span className="text-red-600 font-bold min-w-[100px]">{news.date}</span>
                        <h3 className="text-xl font-medium text-zinc-300 group-hover:text-white transition-colors">{news.title}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Investors" && (
                <div className="max-w-4xl">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-white">Key Stakeholders</h2>
                  <div className="bg-zinc-900 rounded-2xl p-8 sm:p-12 border border-zinc-800 flex items-center gap-8">
                    <div className="p-4 bg-black rounded-full border border-zinc-800 shadow-xl">
                      <Building2 className="w-16 h-16 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Dr NSAM First Grade College</h3>
                      <p className="text-zinc-400 text-lg">
                        The primary organization and inspiration behind this digital transformation initiative.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "Resources" && (
                <div className="max-w-4xl">
                  <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-white">Assets & Links</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <a 
                      href="https://github.com/shreyasgowda2817-04/librarymanagementsystem.git" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-6 bg-zinc-900 rounded-xl hover:bg-zinc-800 border border-zinc-800 hover:border-red-600 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <Code className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
                        <div>
                          <h3 className="font-bold text-white text-lg">Source Code</h3>
                          <p className="text-zinc-500 text-sm">GitHub Repository</p>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-zinc-600 group-hover:text-red-600" />
                    </a>

                    <a 
                      href="https://librarymanagementsystem-psi.vercel.app" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-6 bg-zinc-900 rounded-xl hover:bg-zinc-800 border border-zinc-800 hover:border-red-600 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <BookOpen className="w-8 h-8 text-zinc-400 group-hover:text-white transition-colors" />
                        <div>
                          <h3 className="font-bold text-white text-lg">Live Application</h3>
                          <p className="text-zinc-500 text-sm">Vercel Production Deployment</p>
                        </div>
                      </div>
                      <ExternalLink className="w-5 h-5 text-zinc-600 group-hover:text-red-600" />
                    </a>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
