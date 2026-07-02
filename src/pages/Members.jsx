import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { FaUserPlus, FaSearch, FaEnvelope, FaPhoneAlt, FaIdCard, FaUserGraduate, FaUsers, FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import { API_URL } from "../config";
import { motion, AnimatePresence } from "framer-motion";
import CheckoutModal from "../components/CheckoutModal";
import IDCardModal from "../components/IDCardModal";
import { useNavigate } from "react-router-dom";
import { FaQrcode } from "react-icons/fa";

export default function Members() {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(null);
  const [showIdCard, setShowIdCard] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", rollNo: "", department: "" });

  const fetchData = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const res = await fetch(`${API_URL}/api/members`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
      setLoading(false);
    } catch (err) {
      console.log(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!user || user.role !== "admin") {
      toast.error("Admin access required.");
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const url = editingMember 
        ? `${API_URL}/api/members/${editingMember._id || editingMember.id}`
        : `${API_URL}/api/members`;
      
      const res = await fetch(url, {
        method: editingMember ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        toast.success(editingMember ? "Member updated successfully" : "Member added successfully");
        setShowModal(false);
        setEditingMember(null);
        setForm({ name: "", email: "", phone: "", rollNo: "", department: "" });
        fetchData();
      }
    } catch (err) {
      toast.error("Error saving member");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      await fetch(`${API_URL}/api/members/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success("Member deleted successfully");
      fetchData();
    } catch (err) {
      toast.error("Error deleting member");
    }
  };


  const handlePayAllFines = async (member) => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`
      };

      const resOrder = await fetch(`${API_URL}/api/payments/create-order`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ amount: member.totalFine }),
      });
      const order = await resOrder.json();

      if (order.key_id && order.key_id !== "rzp_test_placeholder") {
        const options = {
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: "Library System",
          description: "Mass Fine Payment",
          order_id: order.id,
          handler: async (response) => {
            try {
              await fetch(`${API_URL}/api/payments/verify`, {
                method: "POST",
                headers: authHeaders,
                body: JSON.stringify({
                  ...response,
                  amount: member.totalFine,
                  planName: "Fine Payment"
                })
              });
              await clearAllFines(member.id || member._id, authHeaders);
              toast.success("Payment Successful!", { icon: "💳" });
            } catch (err) {
              toast.error("Payment verification failed.");
            }
          },
          prefill: { name: user?.name, email: user?.email },
          theme: { color: "#4f46e5" }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setShowCheckout({ amount: member.totalFine, id: member.id || member._id, order });
      }
    } catch (err) {
      toast.error("Failed to initialize payment gateway.");
    }
  };

  const clearAllFines = async (memberId, authHeaders) => {
    try {
      const res = await fetch(`${API_URL}/api/transactions/pay-all-fines/${memberId}`, {
        method: "PATCH",
        headers: authHeaders
      });
      if (!res.ok) throw new Error("Failed to clear fines");
      fetchData();
    } catch (err) {
      toast.error("Failed to clear fines from database.");
    }
  };

  const handleMockPaymentSuccess = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const authHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user?.token}`
      };
      
      const memberId = showCheckout.id;
      
      await fetch(`${API_URL}/api/payments/verify`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          razorpay_order_id: showCheckout.order?.id || `mock_order_${Date.now()}`,
          isMock: true,
          planName: "Fine Payment",
          amount: showCheckout.amount
        })
      });

      await clearAllFines(memberId, authHeaders);
      toast.success("Payment Successful!");
      setShowCheckout(null);
    } catch (err) {
      toast.error("Payment failed to verify.");
    }
  };

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.rollNo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-[#020617] min-h-screen text-slate-900 dark:text-slate-100 pb-20 font-sans transition-colors duration-500">
      
      <AnimatePresence>
        {showCheckout && (
          <CheckoutModal 
            amount={showCheckout.amount} 
            onComplete={handleMockPaymentSuccess} 
            onClose={() => setShowCheckout(null)} 
          />
        )}
        {showIdCard && (
          <IDCardModal 
            member={showIdCard}
            onClose={() => setShowIdCard(null)}
          />
        )}
      </AnimatePresence>

      {/* ELITE HEADER */}
      <div className="relative h-[250px] bg-slate-900 flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950 to-blue-900 opacity-60"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        
        <div className="max-w-[1600px] mx-auto px-10 relative z-10 w-full flex flex-col md:flex-row justify-between items-center">
          <div>
            <h2 className="text-5xl font-bold text-white tracking-tight flex items-center gap-6">
               <FaUsers className="text-indigo-400" /> Members
            </h2>
            <p className="text-slate-400 text-lg font-medium mt-2">Manage {members.length} registered members.</p>
          </div>
          <button 
            onClick={() => { setEditingMember(null); setForm({ name: "", email: "", phone: "", rollNo: "", department: "" }); setShowModal(true); }}
            className="bg-white text-slate-900 px-10 py-5 rounded-xl font-bold text-[11px] tracking-wider transition-all hover:bg-indigo-600 hover:text-white active:scale-95 shadow-md flex items-center gap-4"
          >
            <FaUserPlus size={18} /> Add New Member
          </button>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-10 -mt-12 relative z-20">
        
        {/* COMMAND SEARCH */}
        <div className="bg-white dark:bg-[#1e293b] p-4 rounded-xl shadow-md border border-gray-100 dark:border-slate-200 dark:border-slate-800 mb-12">
          <div className="flex items-center gap-6 px-6 py-2">
            <FaSearch className="text-indigo-500" />
            <input 
              type="text" 
              placeholder="Search members by name, email, or ID..." 
              className="w-full bg-transparent outline-none py-3 text-sm font-bold placeholder-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-8 space-y-4">
             {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse"></div>)}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#0f172a] border-b border-slate-200 dark:border-slate-800">
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:table-cell">Contact & ID</th>
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:table-cell">Status</th>
                    <th className="py-5 px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {filteredMembers.map((m, idx) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      key={m.id || m._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group"
                    >
                      {/* MEMBER COLUMN */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-center text-indigo-600 font-bold text-lg shadow-sm">
                            {m.name?.[0] || "U"}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{m.name}</div>
                            <div className="text-[10px] font-bold text-indigo-500 tracking-wider mt-0.5">{m.department || "General"}</div>
                          </div>
                        </div>
                      </td>

                      {/* CONTACT & ID COLUMN */}
                      <td className="py-4 px-6 hidden md:table-cell">
                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 flex items-center gap-2">
                           <FaEnvelope className="text-slate-400" size={10} /> {m.email}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                             <FaIdCard size={10} /> {m.rollNo || "N/A"}
                          </div>
                          {m.phone && (
                            <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                               <FaPhoneAlt size={9} /> {m.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* STATUS COLUMN */}
                      <td className="py-4 px-6 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                           {m.hasOverdue ? (
                             <span className="px-3 py-1 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-md text-[9px] font-bold tracking-wider">Overdue</span>
                           ) : (
                             <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-md text-[9px] font-bold tracking-wider">Active</span>
                           )}
                           
                           {m.totalFine > 0 ? (
                             <span className="px-3 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-md text-[9px] font-bold tracking-wider">
                               Fine: ₹{m.totalFine}
                             </span>
                           ) : (
                             <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-md text-[9px] font-bold tracking-wider">Clear</span>
                           )}
                        </div>
                      </td>

                      {/* ACTIONS COLUMN */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {m.totalFine > 0 && (
                            <button 
                              onClick={() => handlePayAllFines(m)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold tracking-wider transition-all shadow-sm active:scale-95 mr-2"
                            >
                              Pay Fine
                            </button>
                          )}
                          <button onClick={() => setShowIdCard(m)} className="w-8 h-8 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all" title="Generate ID Card">
                             <FaQrcode size={12} />
                          </button>
                          <button onClick={() => { setEditingMember(m); setForm(m); setShowModal(true); }} className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all" title="Edit Member">
                             <FaEdit size={12} />
                          </button>
                          <button onClick={() => handleDelete(m.id || m._id)} className="w-8 h-8 bg-rose-50 dark:bg-rose-500/10 text-rose-600 rounded-lg flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all" title="Delete Member">
                             <FaTrash size={12} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan="4" className="py-12 text-center text-slate-400 text-sm font-medium">
                        No members found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ESTABLISH IDENTITY */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-2xl z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-xl p-16 shadow-md relative border border-slate-200 dark:border-slate-800"
            >
              <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                <FaTimes size={24} />
              </button>
              
              <div className="mb-12 text-center">
                 <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white mx-auto mb-6 shadow-md shadow-indigo-500/20">
                    <FaUserGraduate size={32} />
                 </div>
                 <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                   {editingMember ? "Edit Member" : "Add Member"}
                 </h3>
                 <p className="text-slate-500 font-medium mt-2">Add or update member details.</p>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-indigo-500 tracking-wider">Full Name</label>
                       <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Full Name" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-indigo-500 font-bold text-sm" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-indigo-500 tracking-wider">Email</label>
                       <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="email@institution.edu" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-indigo-500 font-bold text-sm" />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-indigo-500 tracking-wider">Phone Number</label>
                       <input type="text" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 XXXX" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-indigo-500 font-bold text-sm" />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-indigo-500 tracking-wider">Member ID</label>
                       <input type="text" name="rollNo" value={form.rollNo} onChange={handleChange} placeholder="LMS-XXXX" className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-indigo-500 font-bold text-sm" />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-bold text-indigo-500 tracking-wider">Department</label>
                    <select name="department" value={form.department} onChange={handleChange} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-indigo-500 font-bold text-sm appearance-none">
                       <option value="">General</option>
                       <option value="Computer Science">Computer Science</option>
                       <option value="Mathematics">Mathematics</option>
                       <option value="Physics">Physics</option>
                       <option value="Literature">Literature</option>
                    </select>
                 </div>

                 <div className="pt-10 flex gap-4">
                    <button type="submit" className="flex-1 bg-indigo-600 text-white font-bold text-[11px] tracking-wider py-5 rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-[0.98]">
                       {editingMember ? "Save Changes" : "Add Member"}
                    </button>
                    <button type="button" onClick={() => setShowModal(false)} className="px-10 bg-slate-100 dark:bg-white/5 text-slate-500 font-bold text-[11px] tracking-wider py-5 rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                 </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}