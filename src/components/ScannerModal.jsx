import React, { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { FaTimes } from "react-icons/fa";

export default function ScannerModal({ isOpen, onClose, onScan, title = "Scan Barcode/QR Code" }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // We must ensure the element with id "reader" exists before initializing
    const timer = setTimeout(() => {
      const html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
        },
        /* verbose= */ false
      );

      html5QrcodeScanner.render(
        (decodedText) => {
          // Success callback
          html5QrcodeScanner.clear().then(() => {
            onScan(decodedText);
          }).catch(console.error);
        },
        (error) => {
          // Error callback (called continuously while searching, usually safe to ignore)
        }
      );

      scannerRef.current = html5QrcodeScanner;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.clear().catch(error => console.error("Failed to clear html5QrcodeScanner. ", error));
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [isOpen, onScan]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-lg dark:text-white">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400"
          >
            <FaTimes />
          </button>
        </div>
        <div className="p-4">
          <div id="reader" className="w-full bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"></div>
          <p className="text-xs font-medium text-center text-slate-500 dark:text-slate-400 mt-4 uppercase tracking-widest">
            Point your camera at the barcode or QR code
          </p>
        </div>
      </div>
    </div>
  );
}
