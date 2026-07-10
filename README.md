# 📚 Next Gen Library Management System (LMS)

A premium, elite engine for library research, book management, and real-time data. Built with a modern, high-performance tech stack, this full-stack application provides seamless workflows for both library administrators and students/members.

## ✨ Core Features

### 🏢 For Administrators
- **Comprehensive Management Console**: Bird's-eye view of all library operations, stats, and real-time activity.
- **Hardware Operations**: Native support for **Barcode / QR Code scanning** (`html5-qrcode`) for instant book checkouts, returns, and inventory audits.
- **Acquisitions & Inventory**: Manage books, authors, categories, and track total inventory natively.
- **Advanced Reporting**: Generate complex analytical reports and instantly export them as **PDFs** or **Excel Spreadsheets**.
- **Role-Based Access Control**: Secure, tiered access for Admins vs. Standard Members.

### 🎓 For Members
- **AI-Powered Research Assistant**: A built-in ChatGPT-style AI assistant trained to help members find books, summarize topics, and explore research materials using Markdown formatting.
- **Modern Authentication**: Secure login using **Google OAuth**, or standard email/password with **2FA (OTP Verification)**.
- **Razorpay Integration**: Seamless checkout flows for premium memberships, paying overdue fines, and booking private study rooms.
- **Live Leaderboards & Activity**: Real-time gamification and library tracking.
- **Digital ID Cards**: Mobile-responsive, scannable digital library cards.

### ⚡ Technical Highlights
- **Performance Optimized**: Achieves a 80+ Lighthouse Mobile score through aggressive Vite chunking, React lazy-loading, and intelligent bundle splitting.
- **Real-Time Communication**: Integrated with **Socket.io** for live notifications, chat support, and instant system updates.
- **Stunning UI/UX**: Designed with **Tailwind CSS v4**, **Framer Motion** for micro-animations, and fully responsive across mobile, tablet, and desktop devices. Dark/Light mode supported natively.

---

## 🛠️ Technology Stack

**Frontend (Client)**
- **Framework**: React 19 + Vite 7
- **Styling**: Tailwind CSS v4
- **Routing**: React Router DOM v7
- **Icons & Animations**: Lucide React, Framer Motion
- **Data Visualization**: Recharts
- **Specialty Libraries**: `react-markdown`, `html5-qrcode`, `jspdf`, `xlsx`, `react-hot-toast`

**Backend (Server)**
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB (via Mongoose)
- **Websockets**: Socket.io
- **Security**: JWT (JSON Web Tokens), bcrypt
- **Integrations**: Google OAuth 2.0, Razorpay API, Gemini AI / OpenAI API

---

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas connection string.
- (Optional) Razorpay Account, Google Cloud Console Account (for OAuth), and an AI API Key for full functionality.

### 2. Environment Variables
Create a `.env` file inside the `/server` directory and add the following required backend variables:
```env
MONGO_URI=mongodb://localhost:27017/library
PORT=5001
JWT_SECRET=your_super_secret_jwt_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
AI_API_KEY=your_gemini_or_openai_api_key
```

### 3. Installation
Install dependencies for both the frontend and the backend concurrently from the root directory:
```bash
npm install
cd server && npm install
```

### 4. Running the Application locally
The project is configured with `concurrently` to run both the Vite client and the Express server with a single command:
```bash
# From the root directory
npm run dev
```
- **Frontend** runs on `http://localhost:5173`
- **Backend API** runs on `http://localhost:5001`

---

## 🚀 Deployment (Production)

### Frontend (Vercel / Netlify)
To build the highly-optimized, chunk-split frontend for production:
```bash
npm run build
```
Upload the `/dist` folder, or link your GitHub repo directly to Vercel/Netlify for automatic deployments.

### Backend (Render / Heroku)
The backend can be easily deployed to Render or Heroku. Make sure to define all `.env` variables in your production environment settings and run:
```bash
npm run start --prefix server
```

---

*Built with ❤️ for modern libraries.*
