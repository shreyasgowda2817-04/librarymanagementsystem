import React, { createContext, useContext, useState, useEffect } from "react";
import { API_URL } from "../config";

const FeatureContext = createContext();

export function FeatureProvider({ children }) {
  const [featureFlags, setFeatureFlags] = useState({
    leaderboard: true,
    reservations: true,
    aiAssistant: true,
    recommendations: true,
    vault: true,
    auditLedger: true
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const res = await fetch(`${API_URL}/api/config/features`);
        if (res.ok) {
          const data = await res.json();
          setFeatureFlags(prev => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error("Failed to fetch feature flags:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatures();
  }, []);

  return (
    <FeatureContext.Provider value={{ featureFlags, setFeatureFlags, isLoading }}>
      {children}
    </FeatureContext.Provider>
  );
}

export function useFeature() {
  return useContext(FeatureContext);
}
