import React from "react";
import { motion } from "framer-motion";
import { Github, Linkedin, ExternalLink, Code, BookOpen, User, Server } from "lucide-react";
import Layout from "../components/Layout";

export default function About() {
  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            About <span className="text-blue-600">Library Management System</span>
          </h1>
          <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
            A modern, comprehensive software solution for managing library resources, users, and digital assets.
          </p>
        </motion.div>

        {/* Project Details Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200 mb-12"
        >
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex items-center">
            <BookOpen className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">Project Specifications</h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Project Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-semibold">Library Management System</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Organization / College</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">Dr NSAM First Grade College</dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Technologies Used</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">React.js</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Node.js</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Express</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">MongoDB</span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">Tailwind CSS</span>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Source Code</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <a href="https://github.com/shreyasgowda2817-04" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 flex items-center">
                    <Github className="h-4 w-4 mr-1" /> GitHub Repository
                  </a>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Live Application</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <a href="https://librarymanagementsystem-psi.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 flex items-center">
                    <ExternalLink className="h-4 w-4 mr-1" /> https://librarymanagementsystem-psi.vercel.app
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </motion.div>

        {/* Developer Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white overflow-hidden shadow-sm sm:rounded-lg border border-gray-200"
        >
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex items-center">
            <User className="h-6 w-6 text-indigo-600 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">About the Developer</h3>
          </div>
          <div className="px-4 py-6 sm:px-6 flex flex-col sm:flex-row gap-8 items-start">
            
            <div className="w-full sm:w-1/3 flex flex-col items-center">
              <div className="h-32 w-32 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-inner">
                <Code className="h-12 w-12" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 text-center">Shreyas Gowda HG</h4>
              <p className="text-sm text-gray-500 text-center mb-4">Full Stack Developer & Creator</p>
              
              <div className="flex space-x-3">
                <a href="https://github.com/shreyasgowda2817-04" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                  <span className="sr-only">GitHub</span>
                  <Github className="h-6 w-6" />
                </a>
                <a href="https://www.linkedin.com/in/shreyas-gowda-h-g-486316386" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-700 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <Linkedin className="h-6 w-6" />
                </a>
              </div>
            </div>
            
            <div className="w-full sm:w-2/3">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Biography</h4>
              <p className="text-gray-600 mb-6 leading-relaxed">
                I am a passionate software developer and creator of this Library Management System. I am currently associated with Dr NSAM First Grade College, where I recognized the need to solve real-world administrative challenges. I built this comprehensive digital solution to provide a seamless, modern library experience for students and administrators.
              </p>
              
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Technical Skills</h4>
              <div className="flex flex-wrap gap-2">
                {['JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs', 'Tailwind CSS'].map((skill) => (
                  <span key={skill} className="px-3 py-1 rounded-md text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </motion.div>

      </div>
    </Layout>
  );
}
