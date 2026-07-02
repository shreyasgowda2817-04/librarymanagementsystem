// server/src/config/membershipLimits.js

export const membershipLimits = {
  Basic: {
    maxBooks: 2,
    digitalAccess: false,
    aiAnalysisAccess: false,
    label: "Basic Student"
  },
  Premium: {
    maxBooks: 5,
    digitalAccess: true,
    aiAnalysisAccess: true,
    label: "Premium Scholar"
  },
  Elite: {
    maxBooks: 15,
    digitalAccess: true,
    aiAnalysisAccess: true,
    label: "Elite Researcher"
  }
};
