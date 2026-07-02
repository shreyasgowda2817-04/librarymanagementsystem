import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaQrcode, FaCheckCircle, FaTimesCircle, FaKeyboard, FaCamera } from 'react-icons/fa';
import { Html5Qrcode } from 'html5-qrcode';
import { API_URL } from '../config';

// Reusable Camera Scanner Component
const CameraScanner = ({ onScan }) => {
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let html5QrCode;

    const startCamera = async () => {
      try {
        html5QrCode = new Html5Qrcode("reader");
        
        // Try user-facing camera first (most reliable for kiosks/laptops)
        await html5QrCode.start(
          { facingMode: "user" }, 
          {
            fps: 10,
            qrbox: { width: 300, height: 150 }
          },
          (decodedText) => {
            // Success
            onScan(decodedText);
          },
          (errorMessage) => {
            // Ignore frame parse errors
          }
        );
        setIsScanning(true);
      } catch (err) {
        console.error("Camera Error:", err);
        setError(`Camera Error: ${err?.name || err?.message || 'Permission denied or no camera found.'}`);
      }
    };

    startCamera();

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(e => console.error(e));
      }
    };
  }, [onScan]);

  return (
    <div className="w-full relative flex flex-col items-center">
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-6 py-4 rounded-2xl text-sm font-medium mb-6 text-center border border-red-100 dark:border-red-500/20">
          {error}
        </div>
      )}
      
      <div className="relative w-full max-w-sm mx-auto overflow-hidden rounded-[2rem] bg-slate-900 border-[6px] border-indigo-500/20 shadow-2xl shadow-indigo-500/10 aspect-square flex items-center justify-center">
        
        {!isScanning && !error && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
            <FaCamera size={40} className="text-indigo-400 animate-pulse opacity-50" />
            <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Starting Camera...</span>
          </div>
        )}

        {/* The video feed will attach here */}
        <div id="reader" className="w-full h-full absolute inset-0 z-10 overflow-hidden bg-black"></div>
        
        {/* Scanning Overlay (only shows when scanning) */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center">
            {/* The laser frame */}
            <div className="relative w-[80%] h-[40%] max-w-[300px] border-2 border-indigo-500/50 rounded-3xl overflow-hidden shadow-[0_0_0_999px_rgba(0,0,0,0.5)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400 shadow-[0_0_20px_#818cf8] animate-[scan_2.5s_ease-in-out_infinite]" />
              
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-3xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-3xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-3xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-3xl" />
            </div>
          </div>
        )}
      </div>

      {/* Global CSS to force video to cover container perfectly */}
      <style dangerouslySetInnerHTML={{__html: `
        #reader video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
          border-radius: 2rem !important;
        }
      `}} />
    </div>
  );
};

export default function KioskMode() {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [inputValue, setInputValue] = useState('');
  const [scanStatus, setScanStatus] = useState('idle'); // idle, success, error
  const [scannedUser, setScannedUser] = useState(null);
  const [inputMode, setInputMode] = useState('camera'); // Default to camera for full automation
  const inputRef = useRef(null);

  const isProcessingRef = useRef(false);

  // Clock tick & auto-focus for keyboard mode
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    
    const focusTimer = setInterval(() => {
      if (inputMode === 'keyboard' && inputRef.current && document.activeElement !== inputRef.current && scanStatus === 'idle') {
        inputRef.current.focus();
      }
    }, 2000);
    
    return () => {
      clearInterval(timer);
      clearInterval(focusTimer);
    };
  }, [scanStatus, inputMode]);

  // Handle Scan Logic
  const handleScan = async (id) => {
    if (!id.trim() || isProcessingRef.current) return;
    isProcessingRef.current = true;
    
    try {
      const res = await fetch(`${API_URL}/api/attendance/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: id })
      });
      const data = await res.json();
      
      if (res.ok) {
        setScannedUser({ name: data.member.name, action: data.member.action });
        setScanStatus('success');
      } else {
        setScanStatus('error');
      }
    } catch (error) {
      setScanStatus('error');
    }

    // Reset after 3 seconds
    setTimeout(() => {
      setScanStatus('idle');
      setInputValue('');
      setScannedUser(null);
      isProcessingRef.current = false;
      if (inputMode === 'keyboard' && inputRef.current) inputRef.current.focus();
    }, 3000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleScan(inputValue);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans select-none">
      
      {/* Hidden Exit Button */}
      <button 
        onClick={() => navigate('/dashboard')}
        className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[100] backdrop-blur-md opacity-20 hover:opacity-100"
        title="Exit Kiosk"
      >
        <FaArrowLeft />
      </button>

      {/* LEFT PANEL - Branding & Ambience (40%) */}
      <div className="hidden lg:flex flex-col w-[40%] h-full relative p-12 text-white overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=1500&auto=format&fit=crop" 
            alt="Library" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/80 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          <div>
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="font-bold text-xl text-white">L</span>
              </div>
              <span className="font-bold text-xl tracking-wide uppercase text-white/90">Libraryly</span>
            </div>

            <h1 className="text-5xl font-light leading-tight text-white mb-6">
              Welcome to the <br />
              <span className="font-semibold text-indigo-400">Knowledge Hub</span>
            </h1>
            <p className="text-slate-300 text-lg max-w-sm leading-relaxed">
              Scan your digital ID card or enter your member number on the terminal to check in or out.
            </p>
          </div>

          <div>
            <div className="text-6xl font-light tracking-tighter tabular-nums mb-2">
              {time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
            </div>
            <div className="text-sm font-bold tracking-widest text-indigo-400 uppercase">
              {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL - Scanning Terminal (60%) */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-white dark:bg-[#020617] p-8 md:p-16">
        
        {/* Mode Toggle */}
        {scanStatus === 'idle' && (
          <div className="absolute top-8 right-8 flex bg-slate-100 dark:bg-slate-900 p-1 rounded-full shadow-sm border border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setInputMode('keyboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${inputMode === 'keyboard' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FaKeyboard /> Keyboard
            </button>
            <button 
              onClick={() => setInputMode('camera')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${inputMode === 'camera' ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <FaCamera /> Camera
            </button>
          </div>
        )}

        <div className="w-full max-w-xl relative min-h-[500px] flex items-center justify-center">
          
          {/* BASE LAYER: Always keep scanner mounted to prevent camera hardware stop/start blinking */}
          <div className={`flex flex-col items-center w-full transition-opacity duration-300 ${scanStatus === 'idle' ? 'opacity-100 relative z-10' : 'opacity-0 absolute inset-0 pointer-events-none'}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-3 text-center">Ready to Scan</h2>
            <p className="text-slate-500 dark:text-slate-400 text-center mb-12">
              {inputMode === 'camera' ? "Hold your QR code up to the camera." : "Please present your barcode to the scanner below."}
            </p>

            {inputMode === 'camera' ? (
              <CameraScanner onScan={handleScan} />
            ) : (
              <>
                <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-8">
                  <FaQrcode size={40} />
                </div>
                <div className="w-full relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <FaKeyboard size={20} />
                  </div>
                  <input 
                    ref={inputRef}
                    autoFocus
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Or type your Member ID here..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus:border-indigo-500 dark:focus:border-indigo-500 rounded-2xl text-xl py-5 pl-14 pr-6 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                  />
                  {/* Subtle Scanning Laser Animation */}
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-indigo-500 rounded-full opacity-0 group-focus-within:animate-[scan_2s_ease-in-out_infinite] pointer-events-none" />
                </div>
              </>
            )}
          </div>

          <AnimatePresence>
            {/* SUCCESS STATE OVERLAY */}
            {scanStatus === 'success' && scannedUser && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white dark:bg-[#020617]"
              >
                <div className="flex flex-col items-center bg-emerald-50 dark:bg-emerald-500/5 p-12 rounded-[3rem] border border-emerald-100 dark:border-emerald-500/10 w-full text-center">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
                    <div className="relative w-32 h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-xl overflow-hidden bg-emerald-500 flex items-center justify-center text-white">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(scannedUser.name)}&background=10b981&color=fff&size=200`} 
                        alt="Avatar" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="absolute bottom-0 right-0 w-10 h-10 bg-emerald-500 text-white rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center">
                      <FaCheckCircle />
                    </div>
                  </div>
                  
                  <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{scannedUser.name}</h2>
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 mt-4">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-bold tracking-widest uppercase">{scannedUser.action}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ERROR STATE OVERLAY */}
            {scanStatus === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white dark:bg-[#020617]"
              >
                <div className="flex flex-col items-center bg-red-50 dark:bg-red-500/5 p-12 rounded-[3rem] border border-red-100 dark:border-red-500/10 w-full text-center">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full" />
                    <div className="relative w-32 h-32 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-500/30 border-4 border-white dark:border-slate-900">
                      <FaTimesCircle size={50} />
                    </div>
                  </div>
                  
                  <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
                  <p className="text-slate-500 dark:text-slate-400 mt-2">Member not found or ID is invalid.</p>
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 mt-6">
                    <span className="text-sm font-bold tracking-widest uppercase">Please See Admin</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
      </div>

      {/* Global CSS for scanning laser animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { top: 0px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}} />
    </div>
  );
}
