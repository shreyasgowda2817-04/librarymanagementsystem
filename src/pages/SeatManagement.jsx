import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBolt, FaWind, FaUser, FaRobot, FaClock, FaCheck } from 'react-icons/fa';
import toast from 'react-hot-toast';

// 1. Mock Data Generator with Timestamps
const generateSeats = (count, prefix) => {
  return Array.from({ length: count }).map((_, i) => {
    const rand = Math.random();
    let status = 'available';
    let user = null;
    let expiresAt = null;
    let hasPower = Math.random() > 0.5;
    let hasWindow = Math.random() > 0.7;
    
    if (rand > 0.85) {
      status = 'occupied';
      user = { name: `Student ${Math.floor(Math.random() * 1000)}`, id: `STU${Math.floor(Math.random() * 10000)}` };
      // Expires between 10 seconds and 2 hours from now for testing auto-release
      expiresAt = Date.now() + Math.floor(Math.random() * 7200000 + 10000); 
    }

    return {
      id: `${prefix}-${i + 1}`,
      label: `${prefix}${i + 1}`,
      status,
      user,
      expiresAt,
      hasPower,
      hasWindow
    };
  });
};

const INITIAL_ZONES = [
  { id: 'Q', name: 'Quiet Reading', seats: generateSeats(40, 'Q') },
  { id: 'C', name: 'Collab Space', seats: generateSeats(24, 'C') },
  { id: 'L', name: 'Computer Lab', seats: generateSeats(16, 'L') },
];

export default function SeatManagement() {
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [activeZoneId, setActiveZoneId] = useState(INITIAL_ZONES[0].id);
  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [now, setNow] = useState(Date.now());

  const activeZone = zones.find(z => z.id === activeZoneId);
  const selectedSeat = useMemo(() => {
    if (!selectedSeatId) return null;
    for (let z of zones) {
      const s = z.seats.find(seat => seat.id === selectedSeatId);
      if (s) return s;
    }
    return null;
  }, [zones, selectedSeatId]);

  // Automation: The Global Tick for Timers & Auto-Release
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);

      let hasChanges = false;
      const updatedZones = zones.map(zone => {
        const updatedSeats = zone.seats.map(seat => {
          if (seat.status === 'occupied' && seat.expiresAt && seat.expiresAt <= currentTime) {
            hasChanges = true;
            toast.success(`${seat.label} auto-released! Session ended.`, { icon: '🤖' });
            return { ...seat, status: 'available', user: null, expiresAt: null };
          }
          return seat;
        });
        return { ...zone, seats: updatedSeats };
      });

      if (hasChanges) setZones(updatedZones);
    }, 1000);

    return () => clearInterval(interval);
  }, [zones]);

  // Automation: Auto-Assign Engine
  const handleAutoAssign = () => {
    const availableSeats = activeZone.seats.filter(s => s.status === 'available');
    if (availableSeats.length === 0) {
      toast.error('No available seats in this zone.');
      return;
    }

    // Score seats to find the "best" one
    availableSeats.sort((a, b) => {
      let scoreA = (a.hasPower ? 2 : 0) + (a.hasWindow ? 1 : 0);
      let scoreB = (b.hasPower ? 2 : 0) + (b.hasWindow ? 1 : 0);
      return scoreB - scoreA;
    });

    const bestSeat = availableSeats[0];

    // Mutate state
    const updatedZones = zones.map(z => {
      if (z.id !== activeZoneId) return z;
      return {
        ...z,
        seats: z.seats.map(s => {
          if (s.id === bestSeat.id) {
            return {
              ...s,
              status: 'occupied',
              user: { name: 'Auto Assigned', id: 'SYS-AUTO' },
              expiresAt: Date.now() + (2 * 60 * 60 * 1000) // 2 hours
            };
          }
          return s;
        })
      };
    });

    setZones(updatedZones);
    setSelectedSeatId(bestSeat.id);
    toast.success(`Auto-assigned to ${bestSeat.label}`, { icon: '🎯' });
  };

  // Manual actions
  const forceRelease = (seatId) => {
    setZones(zones.map(z => ({
      ...z,
      seats: z.seats.map(s => s.id === seatId ? { ...s, status: 'available', user: null, expiresAt: null } : s)
    })));
    toast.success('Seat released manually.');
  };

  const manualAssign = (seatId) => {
    setZones(zones.map(z => ({
      ...z,
      seats: z.seats.map(s => s.id === seatId ? { 
        ...s, 
        status: 'occupied', 
        user: { name: 'Walk-in User', id: 'WALK-IN' }, 
        // For testing, set manual assignment to expire in 30 seconds
        expiresAt: Date.now() + (30 * 1000) 
      } : s)
    })));
    toast.success('Assigned manually (Expires in 30s for demo).');
  };

  // Helper for countdown
  const formatTimeRemaining = (expiresAt) => {
    if (!expiresAt) return '00:00';
    const diff = Math.max(0, Math.floor((expiresAt - now) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-[calc(100vh-80px)] overflow-hidden font-sans bg-white dark:bg-[#020617] text-slate-900 dark:text-slate-100 selection:bg-indigo-500/30 border-t border-slate-100 dark:border-slate-800/60">
      
      {/* Left Pane: Minimalist Map */}
      <div className="flex-1 flex flex-col border-r border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/10">
        
        {/* Header & Auto-Assign */}
        <div className="p-8 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black tracking-tight mb-1">Seats</h1>
            <div className="flex gap-4 text-xs font-semibold text-slate-400">
              {zones.map(z => (
                <button 
                  key={z.id} 
                  onClick={() => { setActiveZoneId(z.id); setSelectedSeatId(null); }}
                  className={`transition-colors ${activeZoneId === z.id ? 'text-slate-900 dark:text-white' : 'hover:text-slate-600 dark:hover:text-slate-300'}`}
                >
                  {z.name}
                </button>
              ))}
            </div>
          </div>
          <button 
            onClick={handleAutoAssign}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-bold tracking-wide flex items-center gap-2 hover:opacity-80 transition-opacity shadow-sm"
          >
            <FaRobot /> Auto-Assign
          </button>
        </div>

        {/* Hyper-Minimalist Grid */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 w-full max-w-4xl">
            {activeZone.seats.map(seat => {
              const isSelected = selectedSeatId === seat.id;
              let bg = seat.status === 'available' 
                ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/50 dark:hover:bg-slate-800 text-slate-400' 
                : 'bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 shadow-md';
              
              if (isSelected) {
                bg += ' ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-[#020617]';
              }

              return (
                <button
                  key={seat.id}
                  onClick={() => setSelectedSeatId(seat.id)}
                  className={`aspect-square rounded-md flex flex-col items-center justify-center transition-all ${bg}`}
                >
                  <span className="text-[10px] font-black tracking-wider">{seat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Pane: Split-Pane Data */}
      <div className="w-full max-w-xs xl:max-w-sm bg-white dark:bg-[#020617] flex flex-col">
        {selectedSeat ? (
          <motion.div 
            key={selectedSeat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col p-8 h-full"
          >
            <div className="mb-8">
              <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Seat Inspector</div>
              <h2 className="text-4xl font-black">{selectedSeat.label}</h2>
              <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                selectedSeat.status === 'available' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${selectedSeat.status === 'available' ? 'bg-slate-400' : 'bg-emerald-500'}`}></div>
                {selectedSeat.status}
              </div>
            </div>

            <div className="space-y-6 flex-1">
              {/* Features */}
              <div>
                <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3">Attributes</div>
                <div className="flex gap-2">
                  <div className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-xs font-semibold ${selectedSeat.hasPower ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 border border-slate-100 dark:border-slate-800'}`}>
                    <FaBolt /> Power
                  </div>
                  <div className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg text-xs font-semibold ${selectedSeat.hasWindow ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-400 border border-slate-100 dark:border-slate-800'}`}>
                    <FaWind /> Window
                  </div>
                </div>
              </div>

              {/* Automation / Session Data */}
              {selectedSeat.status === 'occupied' && (
                <>
                  <div>
                    <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3">Occupant</div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><FaUser size={12}/></div>
                      <div>
                        <div className="text-sm font-bold">{selectedSeat.user?.name}</div>
                        <div className="text-[10px] text-slate-500">{selectedSeat.user?.id}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-3">Session Timer</div>
                    <div className="bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-200 p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><FaClock /> Auto-Release in</div>
                      <div className="text-xl font-black font-mono tracking-tighter w-20 text-right">
                        {formatTimeRemaining(selectedSeat.expiresAt)}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800/60">
              {selectedSeat.status === 'available' ? (
                <button 
                  onClick={() => manualAssign(selectedSeat.id)}
                  className="w-full py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-bold tracking-wide hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                >
                  <FaCheck /> Assign Manually
                </button>
              ) : (
                <button 
                  onClick={() => forceRelease(selectedSeat.id)}
                  className="w-full py-3 bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 rounded-lg text-xs font-bold tracking-wide hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                >
                  Force Release Session
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8 text-slate-400">
            <div>
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900/50 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FaCheck size={16} className="text-slate-300 dark:text-slate-700"/>
              </div>
              <p className="text-xs font-medium">Select a seat to view details and manage sessions.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
