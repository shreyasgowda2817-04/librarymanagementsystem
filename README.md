# Library Management System

A full-stack modern library management system built with React, Vite, Tailwind CSS, Express, and MongoDB.

## 🚀 Features
- **Role-Based Access**: Separate interfaces for Administrators and Members.
- **Book Management**: Issue, return, and track books easily.
- **Member Dashboard**: Members can see their issued books, fines, and account details.
- **Admin Tools**: Comprehensive management console, reporting, and hardware ops.
- **Real-Time Features**: Integrated with Socket.io for live updates.

## 🛠️ Tech Stack
- **Frontend**: React 19, Vite, Tailwind CSS (v4), Framer Motion, Recharts.
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io.

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas connection string.

### 2. Environment Variables
Create a `.env` file in the `/server` directory and add your backend variables (e.g., MongoDB URI, JWT secret).
```env
MONGO_URI=mongodb://localhost:27017/library
PORT=5000
JWT_SECRET=your_super_secret_key
```

### 3. Installation
Install dependencies for both the root (frontend) and server.
```bash
npm install
cd server && npm install
```

### 4. Running the App
The project is configured to run both the client and server concurrently from the root directory.
```bash
# In the root directory
npm run dev
```
- Client runs on `http://localhost:5173`
- Server runs on `http://localhost:5000` (or your defined port)

## 📦 Build for Production
To build the frontend for production:
```bash
npm run build
```
