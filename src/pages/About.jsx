import React from "react";
import { motion } from "framer-motion";
import { Github, Linkedin, ExternalLink, Zap, Shield, Code, Globe, Server, BookOpen } from "lucide-react";
import Layout from "../components/Layout";

export default function About() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Dashboard Native Hero Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-800 rounded-3xl p-8 sm:p-12 text-white shadow-lg relative overflow-hidden"
        >
          {/* Abstract subtle background circles */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium mb-6">
              <BookOpen className="w-4 h-4" /> v2.0 Enterprise Edition
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Library Management System
            </h1>
            <p className="text-indigo-100 text-lg sm:text-xl max-w-2xl leading-relaxed font-light">
              A next-generation digital ecosystem designed to empower students, streamline administrative workflows, and modernize educational infrastructure.
            </p>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Left Column: Founder & Tech Stack */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Founder Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-slate-100 to-indigo-50 dark:from-slate-800 dark:to-indigo-900/30" />
              
              <div className="relative z-10 w-24 h-24 bg-white dark:bg-slate-800 rounded-full border-4 border-white dark:border-slate-900 shadow-md flex items-center justify-center mt-8 mb-4">
                <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">SG</span>
              </div>
              
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Shreyas Gowda HG</h2>
              <p className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm uppercase tracking-wide mt-1">Founder & Developer</p>
              
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-4 leading-relaxed px-4">
                Associated with Dr NSAM First Grade College. Engineered to solve real-world administrative challenges.
              </p>

              <div className="flex gap-3 mt-6 w-full">
                <a href="https://github.com/shreyasgowda2817-04" target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors">
                  <Github className="w-5 h-5" /> <span className="text-sm font-medium">GitHub</span>
                </a>
                <a href="https://www.linkedin.com/in/shreyas-gowda-h-g-486316386" target="_blank" rel="noopener noreferrer" className="flex-1 flex justify-center items-center gap-2 p-2.5 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 transition-colors">
                  <Linkedin className="w-5 h-5" /> <span className="text-sm font-medium">LinkedIn</span>
                </a>
              </div>
            </motion.div>

            {/* Tech Stack Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-indigo-500" /> Technologies
              </h3>
              <div className="flex flex-wrap gap-2">
                {['React.js 18', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'Framer Motion', 'Vite PWA', 'Nodemailer'].map(tech => (
                  <span key={tech} className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">
                    {tech}
                  </span>
                ))}
              </div>
            </motion.div>

          </div>

          {/* Right Column: Stats, News, Resources */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* System Impact Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid sm:grid-cols-2 gap-6"
            >
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">80% Faster</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Streamlined digital interfaces reduce the time required to checkout and return books.</p>
              </div>
              
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">100% Offline</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">PWA capabilities ensure administrators can manage resources even during network outages.</p>
              </div>
            </motion.div>

            {/* Recent Updates Timeline */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800"
            >
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent System Updates</h3>
              
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-700 before:to-transparent">
                
                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-indigo-500 text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Enterprise SEO & PWA</h4>
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 rounded-full">v2.0</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Integrated advanced Schema.org JSON-LD graph data. Activated full Progressive Web App installation capabilities.</p>
                  </div>
                </div>

                <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <Server className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm">Automated Email System</h4>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full">v1.5</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Deployed robust Nodemailer integration with Resend fallback for transactional emails and OTP verifications.</p>
                  </div>
                </div>

              </div>
            </motion.div>

            {/* Resources Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid sm:grid-cols-2 gap-6"
            >
              <a href="https://github.com/shreyasgowda2817-04/librarymanagementsystem.git" target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 mr-4 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <Code className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Source Code</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">GitHub Repository</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              </a>
              
              <a href="https://librarymanagementsystem-psi.vercel.app" target="_blank" rel="noopener noreferrer" className="flex items-center p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors group">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 dark:text-slate-300 mr-4 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Live App</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Vercel Deployment</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
              </a>
            </motion.div>

          </div>
        </div>

        {/* Footer Watermark */}
        <div className="text-center py-6 pb-12 text-slate-400 dark:text-slate-500 text-sm font-medium">
          Library Management System © {new Date().getFullYear()} <br/> Founded by Shreyas Gowda HG.
        </div>

      </div>
    </Layout>
  );
}
