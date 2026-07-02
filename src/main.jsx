// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

// Intercept all fetch requests globally to enforce session timeouts and maintenance mode logouts
const { fetch: originalFetch } = window;
window.fetch = async (...args) => {
  try {
    const response = await originalFetch(...args);
    if (response.status === 401) {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user) {
        localStorage.setItem("last_blocked_request", JSON.stringify({ url: args[0], status: response.status }));
        // Session timed out or invalid, clean up local session and redirect
        localStorage.removeItem("user");
        localStorage.removeItem("ai_chat_history");
        window.location.href = "/login?error=expired";
      }
    } else if (response.status === 503) {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user && user.role !== "admin") {
        // Site in maintenance mode, log out non-admin users
        localStorage.removeItem("user");
        localStorage.removeItem("ai_chat_history");
        window.location.href = "/login?error=maintenance";
      }
    }
    return response;
  } catch (err) {
    throw err;
  }
};

// Apply user preferences on startup
const applyPreferences = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (user && user.preferences) {
      const prefs = user.preferences;
      // Theme
      if (prefs.theme === 'dark') document.documentElement.classList.add('dark');
      else if (prefs.theme === 'light') document.documentElement.classList.remove('dark');

      // Accessibility
      if (prefs.highContrast) document.documentElement.classList.add('high-contrast');
      else document.documentElement.classList.remove('high-contrast');
      
      if (prefs.reducedMotion) document.documentElement.classList.add('reduced-motion');
      else document.documentElement.classList.remove('reduced-motion');

      if (prefs.dyslexicFont) document.documentElement.classList.add('dyslexic-font');
      else document.documentElement.classList.remove('dyslexic-font');

      // Font Size
      if (prefs.fontSize === 'small') document.documentElement.style.fontSize = '14px';
      else if (prefs.fontSize === 'large') document.documentElement.style.fontSize = '18px';
      else document.documentElement.style.fontSize = '16px';

      // Accent Color
      if (prefs.accentColor) {
        document.documentElement.style.setProperty('--color-indigo-500', prefs.accentColor);
        document.documentElement.style.setProperty('--color-indigo-600', prefs.accentColor);
        
        let styleEl = document.getElementById('custom-accent');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'custom-accent';
          document.head.appendChild(styleEl);
        }
        styleEl.innerHTML = `
          .bg-indigo-500, .bg-indigo-600, .hover\\:bg-indigo-600:hover, .dark\\:hover\\:bg-indigo-500:hover { background-color: ${prefs.accentColor} !important; }
          .text-indigo-500, .text-indigo-600, .dark\\:text-indigo-400 { color: ${prefs.accentColor} !important; }
          .border-indigo-500, .border-indigo-600 { border-color: ${prefs.accentColor} !important; }
          .ring-indigo-500, .focus\\:ring-indigo-500:focus { --tw-ring-color: ${prefs.accentColor} !important; }
        `;
      }
    }
  } catch (e) {
    console.error("Failed to apply preferences", e);
  }
};
applyPreferences();
window.addEventListener("preferences_updated", applyPreferences);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
