import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaPrint, FaDownload } from 'react-icons/fa';
import JsBarcode from 'jsbarcode';
import toast from 'react-hot-toast';

export default function IDCardModal({ member, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (member && member.rollNo) {
      // The Kiosk backend expects the raw Student ID (rollNo).
      const idToEncode = member.rollNo;
      
      try {
        const canvas = document.createElement('canvas');
        JsBarcode(canvas, idToEncode, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: true,
          margin: 10,
          background: "#ffffff",
          lineColor: "#000000"
        });
        setQrCodeUrl(canvas.toDataURL("image/png"));
      } catch (err) {
        console.error(err);
        toast.error('Failed to generate Barcode');
      }
    } else {
      setQrCodeUrl('');
    }
  }, [member]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `Library_Barcode_${member.name.replace(/\s+/g, '_')}.png`;
    link.href = qrCodeUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!member) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 print:p-0 print:bg-white"
    >
      <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col items-center relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <FaTimes size={20} />
        </button>

        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 mb-1 text-center">{member.name}</h3>
        <p className="text-sm font-bold text-slate-500 mb-8">{member.rollNo || "No Student ID"}</p>

        <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-8 w-full flex justify-center overflow-hidden">
          {qrCodeUrl ? (
            <img src={qrCodeUrl} alt="Student Barcode" className="max-w-full h-auto rounded-lg" />
          ) : (
            <div className="w-[200px] h-[100px] flex items-center justify-center text-slate-400 text-sm font-bold text-center px-4">
              NO STUDENT ID ASSIGNED
            </div>
          )}
        </div>

        <div className="flex gap-4 w-full justify-center print:hidden">
          <button onClick={handlePrint} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-md transition-all text-sm">
            <FaPrint /> Print
          </button>
          <button onClick={handleDownload} className="flex-1 bg-slate-800 dark:bg-slate-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 dark:hover:bg-slate-600 shadow-md transition-all text-sm">
            <FaDownload /> Save
          </button>
        </div>
      </div>
      
      {/* CSS For Printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
          .fixed { position: absolute !important; background: white !important; }
          .fixed > div, .fixed > div * { visibility: visible; }
          .fixed > div {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}} />
    </motion.div>
  );
}
