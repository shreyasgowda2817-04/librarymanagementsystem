import React, { useState } from 'react';
import { API_URL } from "../config";
import { motion } from 'framer-motion';
import { Server, RadioReceiver, Users, Activity, AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function HardwareOps() {
  const [rfidTag, setRfidTag] = useState("RFID-7729-ALPHA");
  const [roomId, setRoomId] = useState("READING-ROOM-A");
  const [occupancy, setOccupancy] = useState(42);
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const handleSyncAsset = async () => {
    const loadingToast = toast.loading("Syncing Legacy Book...");
    try {
      const res = await fetch(`${API_URL}/api/connectors/sync-asset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          legacyId: `ALMA-${Math.floor(Math.random() * 10000)}`,
          title: "Quantum Computing: A Physical Approach",
          author: "Dr. E. Schrödinger",
          isbn: "978-0-12-345678-9",
          status: "Available",
          location: "Section 4, Shelf B (Physics)",
          rfidTag: rfidTag
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Book Synced Successfully", { id: loadingToast });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error.message || "Failed to sync book", { id: loadingToast });
    }
  };

  const handleHardwareEvent = async (eventType) => {
    const loadingToast = toast.loading(`Triggering ${eventType}...`);
    try {
      const res = await fetch(`${API_URL}/api/connectors/hardware-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          eventType,
          rfidTag,
          deviceId: "KIOSK-MAIN-LOBBY",
          timestamp: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.status || `Event ${eventType} logged`, { id: loadingToast });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error.message || "Hardware event failed", { id: loadingToast });
    }
  };

  const handleTelemetry = async () => {
    const loadingToast = toast.loading("Logging Occupancy...");
    try {
      const res = await fetch(`${API_URL}/api/connectors/telemetry/occupancy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          roomId,
          currentOccupancy: occupancy,
          maxCapacity: 100
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.status || "Activity Data Logged", { id: loadingToast });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error.message || "Activity Data logging failed", { id: loadingToast });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
          <Activity className="text-indigo-600" /> Hardware Operations Console
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Simulate physical events, legacy database syncing, and live Activity Data ingestion.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Panel 1: Legacy Sync */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
          className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
              <Server size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Legacy DB Sync</h2>
              <p className="text-xs text-slate-400">Mock Alma/SirsiDynix Handshake</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-mono text-slate-500 mb-2">Payload Preview</p>
              <div className="text-sm font-medium">Title: Quantum Computing</div>
              <div className="text-sm font-medium">RFID: {rfidTag}</div>
            </div>
            <button 
              onClick={handleSyncAsset}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              <Zap size={18} /> Execute Sync
            </button>
          </div>
        </motion.div>

        {/* Panel 2: RFID Activity Data */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
              <RadioReceiver size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">RFID Scanner</h2>
              <p className="text-xs text-slate-400">Trigger Hardware Events</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Active Target RFID</label>
              <input 
                type="text" 
                value={rfidTag} 
                onChange={(e) => setRfidTag(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono text-sm focus:border-indigo-500"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button onClick={() => handleHardwareEvent("CHECK_OUT")} className="py-3 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2"><CheckCircle2 size={16} /> Scan Out</button>
              <button onClick={() => handleHardwareEvent("CHECK_IN")} className="py-3 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2"><Server size={16} /> Scan In</button>
              <button onClick={() => handleHardwareEvent("MISPLACED")} className="sm:col-span-2 py-3 bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 rounded-xl font-bold text-sm transition-all flex justify-center items-center gap-2"><AlertTriangle size={16} /> Force Misplaced Alert</button>
            </div>
          </div>
        </motion.div>

        {/* Panel 3: Room Occupancy */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white dark:bg-slate-900 rounded-xl p-8 border border-slate-200 dark:border-slate-800 shadow-md relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Occupancy Sensors</h2>
              <p className="text-xs text-slate-400">Live Activity Data Injection</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">Zone ID</label>
              <input 
                type="text" 
                value={roomId} 
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl outline-none font-mono text-sm focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 flex justify-between">
                <span>Current Occupancy</span>
                <span className="text-amber-600">{occupancy}/100</span>
              </label>
              <input 
                type="range" 
                min="0" max="100" 
                value={occupancy} 
                onChange={(e) => setOccupancy(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
            <button 
              onClick={handleTelemetry}
              className="w-full py-4 mt-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-all active:scale-95 flex justify-center items-center gap-2"
            >
              <Activity size={18} /> Transmit Activity Data
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
