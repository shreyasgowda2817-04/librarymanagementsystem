import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, FileText, Code } from "lucide-react";
import { motion } from "framer-motion";

const legalContent = {
  privacy: {
    title: "Privacy Policy",
    icon: <Shield className="text-indigo-500 w-8 h-8 mb-4" />,
    lastUpdated: "July 2026",
    sections: [
      {
        heading: "1. Information We Collect",
        text: "We collect information you provide directly to us, such as when you create or modify your account, request services, contact customer support, or otherwise communicate with us. This includes your name, email address, institutional ID, and any reading preferences or history associated with your library account."
      },
      {
        heading: "2. How We Use Your Information",
        text: "We use the information we collect to provide, maintain, and improve our services, including to facilitate book borrowing, process transactions for fines, send notifications (such as overdue reminders), and provide personalized reading recommendations via our AI integrations."
      },
      {
        heading: "3. Data Security",
        text: "We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction. All passwords are encrypted using industry-standard hashing algorithms like bcrypt, and API traffic is secured via SSL/TLS."
      },
      {
        heading: "4. Third-Party Services",
        text: "We may share your information with third-party vendors, consultants and other service providers who need access to such information to carry out work on our behalf, such as payment processors (e.g., Razorpay) and communication services (e.g., Resend, Twilio)."
      }
    ]
  },
  terms: {
    title: "Terms of Service",
    icon: <FileText className="text-indigo-500 w-8 h-8 mb-4" />,
    lastUpdated: "July 2026",
    sections: [
      {
        heading: "1. Acceptance of Terms",
        text: "By accessing and using the LMS Pro platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services."
      },
      {
        heading: "2. User Accounts",
        text: "You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account."
      },
      {
        heading: "3. Library Assets and Fines",
        text: "Users agree to return all physical library assets by the specified due date. Failure to do so will result in automated financial penalties as dictated by your institution's policies. Repeated violations may result in suspension of library privileges and institutional escalation."
      },
      {
        heading: "4. Termination",
        text: "We may terminate or suspend access to our Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms."
      }
    ]
  },
  licensing: {
    title: "Software Licensing",
    icon: <Code className="text-indigo-500 w-8 h-8 mb-4" />,
    lastUpdated: "July 2026",
    sections: [
      {
        heading: "1. Commercial License",
        text: "LMS Pro is proprietary software. The source code, design, and architecture are protected by copyright laws. Unauthorized reproduction, modification, or distribution of this software, or any portion of it, may result in severe civil and criminal penalties."
      },
      {
        heading: "2. Open Source Acknowledgements",
        text: "This software utilizes several open-source libraries under the MIT and Apache 2.0 licenses, including but not limited to React.js, Node.js, Express.js, MongoDB (SSPL), Tailwind CSS, and Framer Motion. We thank the open-source community for their invaluable contributions to modern web development."
      },
      {
        heading: "3. API Usage Restrictions",
        text: "Accessing the LMS Pro REST API outside of the official frontend application is strictly prohibited unless an explicit Developer API Key has been issued by the system administrator. Abuse of the API endpoints will result in IP bans."
      }
    ]
  }
};

export default function LegalPage({ type }) {
  const content = legalContent[type];

  if (!content) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-200 selection:bg-indigo-500/30">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors mb-12"
        >
          <ArrowLeft size={16} /> Back to Platform
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {content.icon}
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
            {content.title}
          </h1>
          <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-12 pb-8 border-b border-slate-200 dark:border-slate-800">
            Effective Date: {content.lastUpdated}
          </div>

          <div className="space-y-12">
            {content.sections.map((section, idx) => (
              <div key={idx}>
                <h2 className="text-xl md:text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">
                  {section.heading}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
                  {section.text}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
        
      </div>
    </div>
  );
}
