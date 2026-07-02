import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config';
import toast from 'react-hot-toast';
import { FaUsers, FaCalendarAlt, FaClock, FaCheckCircle, FaDoorOpen, FaChalkboardTeacher } from 'react-icons/fa';

export default function StudyRooms() {
  const [rooms, setRooms] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("explore");
  
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookedSlots, setBookedSlots] = useState({});
  const [isBooking, setIsBooking] = useState(false);
  
  const [checkoutSlot, setCheckoutSlot] = useState(null);
  const [priceBreakdown, setPriceBreakdown] = useState(null);

  const ALL_SLOTS = [
    "09:00 AM - 11:00 AM",
    "11:00 AM - 01:00 PM",
    "02:00 PM - 04:00 PM",
    "04:00 PM - 06:00 PM",
    "06:00 PM - 08:00 PM"
  ];

  const user = JSON.parse(localStorage.getItem('user'));
  const headers = { Authorization: `Bearer ${user?.token}`, "Content-Type": "application/json" };

  useEffect(() => {
    fetchRoomsAndBookings();
  }, []);

  const fetchRoomsAndBookings = async () => {
    try {
      const [roomsRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/api/rooms?t=${Date.now()}`, { headers }),
        fetch(`${API_URL}/api/rooms/my-bookings?t=${Date.now()}`, { headers })
      ]);
      if (roomsRes.ok && bookingsRes.ok) {
        setRooms(await roomsRes.json());
        setMyBookings(await bookingsRes.json());
      }
    } catch (err) {
      toast.error("Failed to load study rooms");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoom) {
      fetchBookedSlots(selectedRoom.id || selectedRoom._id, selectedDate);
    }
  }, [selectedRoom, selectedDate]);

  const fetchBookedSlots = async (roomId, date) => {
    try {
      const res = await fetch(`${API_URL}/api/rooms/bookings/${roomId}/${date}?t=${Date.now()}`, { headers });
      if (res.ok) {
        setBookedSlots(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculatePrice = (room) => {
    let base = 50;
    let total = base;
    let items = [];

    if (room.amenities && room.amenities.length > 0) {
      room.amenities.forEach(amenity => {
        let cost = 0;
        const lower = amenity.toLowerCase();
        if (lower.includes("ac") || lower.includes("air")) cost = 30;
        else if (lower.includes("projector")) cost = 50;
        else if (lower.includes("vr")) cost = 100;
        else if (lower.includes("whiteboard")) cost = 10;
        else cost = 20;

        if (cost > 0) {
          items.push({ name: amenity, cost });
          total += cost;
        }
      });
    }
    return { base, items, total };
  };

  const openCheckout = (slot) => {
    setCheckoutSlot(slot);
    setPriceBreakdown(calculatePrice(selectedRoom));
  };

  const handleProceedPay = async () => {
    setIsBooking(true);
    const amount = priceBreakdown.total;
    const timeSlot = checkoutSlot;

    try {
      // 1. Create Order
      const orderRes = await fetch(`${API_URL}/api/payments/create-order`, {
        method: "POST",
        headers,
        body: JSON.stringify({ amount })
      });
      const order = await orderRes.json();
      if (!orderRes.ok) throw new Error(order.error || "Failed to initiate payment");

      if (order.key_id && order.key_id !== "rzp_test_placeholder") {
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: "LMS Pro Library",
          description: `Study Room: ${selectedRoom.name}`,
          order_id: order.id,
          handler: async (response) => {
            await finalizeBooking(timeSlot, { ...response, isMock: false, amount });
          },
          prefill: { name: user?.name, email: user?.email },
          theme: { color: "#4f46e5" }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
        setIsBooking(false); // Loading stops, widget takes over
      } else {
        // Mock Flow
        await finalizeBooking(timeSlot, {
          razorpay_order_id: order.id,
          razorpay_payment_id: "mock",
          razorpay_signature: "mock",
          isMock: true,
          amount
        });
      }
    } catch (err) {
      toast.error(err.message);
      setIsBooking(false);
    }
  };

  const finalizeBooking = async (timeSlot, paymentDetails) => {
    setIsBooking(true);
    try {
      const res = await fetch(`${API_URL}/api/rooms/book`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          roomId: selectedRoom.id || selectedRoom._id,
          date: selectedDate,
          timeSlot,
          ...paymentDetails
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      toast.success(`Booked ${selectedRoom.name} successfully!`, { icon: "💳" });
      setSelectedRoom(null);
      setCheckoutSlot(null);
      fetchRoomsAndBookings();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      const res = await fetch(`${API_URL}/api/rooms/cancel/${bookingId}`, {
        method: "PATCH",
        headers
      });
      if (res.ok) {
        toast.success("Booking cancelled");
        fetchRoomsAndBookings();
      }
    } catch (err) {
      toast.error("Failed to cancel");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-slate-500">Loading Study Rooms...</div>;

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <FaDoorOpen className="text-indigo-500" />
            Study Rooms
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Reserve quiet spaces and collaborative pods.</p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab("explore")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'explore' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Explore Rooms
          </button>
          <button 
            onClick={() => setActiveTab("my-bookings")}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'my-bookings' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow' : 'text-slate-500 hover:text-slate-700'}`}
          >
            My Bookings ({myBookings.filter(b => b.status === "Active").length})
          </button>
        </div>
      </div>

      {activeTab === "explore" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map(room => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              key={room.id || room._id} 
              className="bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col hover:shadow-xl hover:border-indigo-500/30 transition-all group"
            >
              <div className="h-48 bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                {room.imageUrl ? (
                  <img src={room.imageUrl} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400"><FaDoorOpen size={48} /></div>
                )}
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm text-slate-700 dark:text-slate-200">
                  <FaUsers className="text-indigo-500" /> {room.capacity} Seats
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-4">{room.name}</h3>
                
                <div className="flex flex-wrap gap-2 mb-6 flex-1">
                  {room.amenities.map(amenity => (
                    <span key={amenity} className="text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full flex items-center gap-1">
                      <FaCheckCircle size={10} /> {amenity}
                    </span>
                  ))}
                </div>

                <button 
                  onClick={() => setSelectedRoom(room)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2"
                >
                  <FaCalendarAlt /> Check Availability
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === "my-bookings" && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
          {myBookings.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <FaChalkboardTeacher className="mx-auto text-4xl mb-4 opacity-50" />
              <p className="font-bold">You have no study room bookings.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myBookings.map(b => (
                <div key={b.id || b._id} className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center text-xl">
                      <FaCalendarAlt />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-lg">{b.roomId?.name || "Unknown Room"}</h4>
                      <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-2">
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">{new Date(b.date).toLocaleDateString()}</span>
                        <FaClock className="opacity-50" /> {b.timeSlot}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      b.status === "Active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : 
                      b.status === "Completed" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" : 
                      "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400"
                    }`}>
                      {b.status}
                    </span>
                    {b.status === "Active" && (
                      <button onClick={() => handleCancel(b.id || b._id)} className="text-rose-500 hover:text-rose-700 font-bold text-sm px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedRoom(null)} />
            
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="h-32 bg-indigo-600 relative overflow-hidden flex items-end justify-between p-6">
                <div className="absolute inset-0 opacity-20"><img src={selectedRoom.imageUrl} className="w-full h-full object-cover mix-blend-overlay" /></div>
                <h2 className="text-2xl font-black text-white relative z-10">Book {selectedRoom.name}</h2>
                <div className="relative z-10 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-white font-bold text-sm shadow-sm border border-white/10">
                  Starts at ₹50 / slot
                </div>
              </div>
              
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Select Date</label>
                  <input 
                    type="date" 
                    min={new Date().toISOString().slice(0,10)}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                {checkoutSlot ? (
                  <div className="animate-fade-in-up">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><FaCheckCircle className="text-emerald-500" /> Checkout Summary</h3>
                    
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6 border border-slate-200 dark:border-slate-700 space-y-3 text-sm">
                      <div className="flex justify-between font-semibold text-slate-600 dark:text-slate-300">
                        <span>Base Price</span>
                        <span>₹{priceBreakdown?.base}</span>
                      </div>
                      
                      {priceBreakdown?.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-slate-500">
                          <span>+ {item.name}</span>
                          <span>₹{item.cost}</span>
                        </div>
                      ))}
                      
                      <div className="pt-3 mt-3 border-t border-slate-200 dark:border-slate-700 flex justify-between font-black text-lg text-slate-900 dark:text-white">
                        <span>Total Due</span>
                        <span className="text-indigo-600 dark:text-indigo-400">₹{priceBreakdown?.total}</span>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button onClick={() => setCheckoutSlot(null)} className="flex-1 py-3 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold rounded-xl transition-colors">
                        Back
                      </button>
                      <button disabled={isBooking} onClick={handleProceedPay} className="flex-2 w-2/3 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-indigo-500/20 disabled:opacity-70">
                        {isBooking ? "Processing..." : `Pay ₹${priceBreakdown?.total}`}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Available Time Slots</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {ALL_SLOTS.map(slot => {
                        const count = bookedSlots[slot] || 0;
                        const maxCapacity = Math.max(selectedRoom?.capacity || 10, 10);
                        const isBooked = count >= maxCapacity;
                        
                        const isDisabled = isBooked || isBooking;

                        return (
                          <button
                            key={slot}
                            disabled={isDisabled}
                            onClick={() => openCheckout(slot)}
                            className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 font-bold text-sm transition-all ${
                              isDisabled 
                                ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed' 
                                : 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:border-indigo-500 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isBooked ? <FaClock className="opacity-50" /> : <FaCheckCircle />}
                              {slot}
                            </div>
                            <div className="text-xs font-medium opacity-70">
                              {isBooked ? "Fully Booked" : `${count}/${maxCapacity} Booked`}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    
                    <button onClick={() => { setSelectedRoom(null); setCheckoutSlot(null); }} className="w-full py-3 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-bold transition-colors">
                      Close
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
