import React, { useState, useEffect } from "react";
import { API_URL } from "../config";
import {
  FaBook, FaUsers, FaTrash, FaPlus, FaClipboardList, FaCheck, FaTimes,
  FaTools, FaDatabase, FaLayerGroup, FaHistory, FaShieldAlt, FaFileExport, FaCogs, FaPlay, FaPowerOff
} from "react-icons/fa";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ManagementConsole() {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "admin";

  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [bookRequests, setBookRequests] = useState([]);
  const [automationJobs, setAutomationJobs] = useState([]);
  const [bookForm, setBookForm] = useState({ title: "", author: "", category: "", stock: 1, barcode: "", pdf: null, cover: null });
  const [editingBookId, setEditingBookId] = useState(null);
  const [newMember, setNewMember] = useState({ name: "", email: "", phone: "" });
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("assets");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${user?.token}` };
      const [booksRes, membersRes, requestsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/books`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/members`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/book-requests/all`, { headers, credentials: 'include' }),
        fetch(`${API_URL}/api/auth/users`, { headers, credentials: 'include' })
      ]);
      if (booksRes.status === 401 || membersRes.status === 401) {
        throw new Error("401 Unauthorized");
      }

      const booksData = await booksRes.json();
      const membersData = await membersRes.json();
      const requestsData = await requestsRes.json();
      const usersData = await usersRes.json();
      
      setBooks(Array.isArray(booksData) ? booksData : (booksData.books || []));
      setMembers(Array.isArray(membersData) ? membersData : []);
      setBookRequests(Array.isArray(requestsData) ? requestsData : []);
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        localStorage.removeItem("user");
        localStorage.removeItem("ai_chat_history");
        toast.error("Session expired or unauthorized. Please log in as admin.");
        window.location.href = "/login";
      }
      setLoading(false);
    }
  };

  const handlePromote = async (id) => {
    if (!window.confirm("Promote this user to Admin? This grants full access.")) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/promote/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      if (res.ok) {
        toast.success("User promoted successfully");
        fetchData();
      }
    } catch (err) {
      toast.error("Promotion failed");
    }
  };

  const handleDemote = async (id) => {
    if (!window.confirm("Revoke administrative privileges from this user?")) return;
    try {
      const res = await fetch(`${API_URL}/api/auth/demote/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Privileges Revoked");
        fetchData();
      } else {
        toast.error(data.message || "Demotion failed");
      }
    } catch (err) {
      toast.error("Demotion failed");
    }
  };


  const fetchAutomation = async () => {
    try {
      const res = await fetch(`${API_URL}/api/automation/status`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      setAutomationJobs(data);
    } catch (err) {
      console.error("Automation Sync Failed");
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchAutomation();
    }
  }, [isAdmin]);

  const handleSaveBook = async (e) => {
    e.preventDefault();
    if (!bookForm.title || !bookForm.author) return;
    const toastId = toast.loading(editingBookId ? "Saving book..." : "Adding book...");
    try {
      const formData = new FormData();
      formData.append("title", bookForm.title);
      formData.append("author", bookForm.author);
      if (bookForm.category) formData.append("category", bookForm.category);
      if (bookForm.stock) formData.append("stock", bookForm.stock);
      if (bookForm.barcode) formData.append("barcode", bookForm.barcode);
      if (bookForm.pdf) formData.append("pdf", bookForm.pdf);
      if (bookForm.cover) formData.append("cover", bookForm.cover);

      const url = editingBookId
        ? `${API_URL}/api/books/${editingBookId}`
        : `${API_URL}/api/books`;

      const method = editingBookId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${user?.token}` },
        body: formData
      });

      if (res.ok) {
        toast.success(editingBookId ? "Book updated successfully" : "Book added successfully", { id: toastId });
        setBookForm({ title: "", author: "", category: "", stock: 1, barcode: "", pdf: null, cover: null });
        setEditingBookId(null);
        fetchData();
      } else {
        toast.error("Failed to save book", { id: toastId });
      }
    } catch (err) {
      toast.error("Error saving book", { id: toastId });
    }
  };

  const handleEditBook = (book) => {
    setEditingBookId(book.id || book._id);
    setBookForm({
      title: book.title || "",
      author: book.author || "",
      category: book.category || "",
      stock: book.stock || 1,
      barcode: book.barcode || "",
      pdf: null,
      cover: null
    });
  };

  const cancelEditBook = () => {
    setEditingBookId(null);
    setBookForm({ title: "", author: "", category: "", stock: 1, barcode: "", pdf: null, cover: null });
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    try {
      await fetch(`${API_URL}/api/books/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success("Book deleted successfully");
      fetchData();
    } catch (err) {
      toast.error("Unable to delete book");
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMember.name) return;
    try {
      const res = await fetch(`${API_URL}/api/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`
        },
        body: JSON.stringify(newMember)
      });
      if (res.ok) {
        toast.success("Member added successfully");
        setNewMember({ name: "", email: "", phone: "" });
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to add member");
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm("Delete this member?")) return;
    try {
      await fetch(`${API_URL}/api/members/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      toast.success("Member deleted successfully");
      fetchData();
    } catch (err) {
      toast.error("Unable to delete member");
    }
  };

  const handleUpdateRequestStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/api/book-requests/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(`Request ${status.toLowerCase()}`, { icon: status === 'Approved' ? '✅' : '❌' });
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleExport = () => {
    try {
      let headers = [];
      let rows = [];
      let filename = "";

      if (activeTab === "assets") {
        headers = ["Title", "Author", "Category", "Stock", "Barcode"];
        rows = books.map(b => [b.title, b.author, b.category || "N/A", b.stock || 1, b.barcode || "N/A"]);
        filename = "library_assets_inventory";
      } else if (activeTab === "identities") {
        headers = ["Name", "Email", "Phone", "Status"];
        rows = members.map(m => [m.name, m.email || "N/A", m.phone || "N/A", "Active"]);
        filename = "member_directory";
      } else {
        headers = ["Requested By", "Book Title", "Author", "Status", "Reason"];
        rows = bookRequests.map(r => [r.userId?.name || "N/A", r.title, r.author, r.status, r.reason || "N/A"]);
        filename = "procurement_requests";
      }

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      toast.success("Report exported successfully");
    } catch (err) {
      toast.error("Export failed");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-10">
        <div className="text-center space-y-6">
          <FaShieldAlt size={60} className="text-rose-500 mx-auto animate-pulse" />
          <h2 className="text-2xl font-black text-white tracking-widest uppercase">Access Denied</h2>
          <p className="text-slate-400 font-medium">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-[#020617] min-h-screen font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500">

      <div className="relative h-[300px] bg-slate-950 flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-950 to-indigo-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>

        <div className="max-w-[1400px] mx-auto px-6 md:px-10 relative z-10 w-full flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                <FaTools className="text-white text-2xl" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Version 1.0</span>
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter leading-none">Admin Dashboard</h1>
            <p className="text-slate-400 text-xl font-medium max-w-xl">Manage books, members, and student requests.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: "Total Books", val: books.length, icon: <FaDatabase />, col: "indigo" },
              { label: "Total Members", val: members.length, icon: <FaUsers />, col: "purple" },
              { label: "Pending Requests", val: bookRequests.filter(r => r.status === 'Pending').length, icon: <FaHistory />, col: "amber" }
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 p-6 rounded-xl min-w-[150px] shadow-md">
                <div className={`text-${stat.col}-400 mb-2`}>{stat.icon}</div>
                <p className="text-3xl font-black text-white">{stat.val}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 md:px-10 -mt-16 relative z-20">

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 mb-16 flex flex-wrap gap-4 items-center">
          {[
            { id: "assets", label: "Manage Books", icon: <FaBook /> },
            { id: "identities", label: "Manage Members", icon: <FaUsers /> },
            { id: "procurement", label: "Book Requests", icon: <FaClipboardList /> },
            { id: "users", label: "Platform Users", icon: <FaShieldAlt /> },
            { id: "automation", label: "Automation", icon: <FaCogs /> }

          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-10 py-5 rounded-xl text-sm font-semibold transition-all flex items-center gap-4 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10 translate-y-[-2px]' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
          <div className="ml-auto flex gap-4">
            <button onClick={fetchData} className="w-14 h-14 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 transition-all"><FaHistory /></button>
            <button onClick={handleExport} className="px-8 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 group active:scale-95 transition-all shadow-md shadow-emerald-500/20">
              <FaFileExport className="group-hover:translate-x-1 transition-transform" /> Export Data
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">

          {activeTab === "assets" && (
            <motion.div key="assets" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid lg:grid-cols-3 gap-12">

              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-[100px] -translate-y-20 translate-x-20"></div>
                  <h3 className="text-2xl font-bold tracking-tight mb-10 flex items-center gap-4">
                    <FaPlus className="text-indigo-600" /> {editingBookId ? "Edit Book Details" : "Add New Book"}
                  </h3>

                  <form onSubmit={handleSaveBook} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Book Title</label>
                      <input type="text" required value={bookForm.title} onChange={e => setBookForm({ ...bookForm, title: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-indigo-500 font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Author</label>
                      <input type="text" required value={bookForm.author} onChange={e => setBookForm({ ...bookForm, author: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-indigo-500 font-bold text-sm" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Stock Count</label>
                        <input type="number" min="1" value={bookForm.stock} onChange={e => setBookForm({ ...bookForm, stock: parseInt(e.target.value) || 1 })} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-indigo-500 font-bold text-center" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Barcode / ISBN</label>
                        <input type="text" value={bookForm.barcode} onChange={e => setBookForm({ ...bookForm, barcode: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-indigo-500 font-bold text-sm" />
                      </div>
                    </div>
                    <div className="space-y-4 pt-4">
                      <label className="p-4 bg-slate-50 dark:bg-[#0f172a] border border-dashed border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center gap-2 cursor-pointer hover:border-indigo-500 transition-all">
                        <FaPlus className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-500">Upload PDF Copy</span>
                        <input type="file" accept="application/pdf" className="hidden" onChange={e => setBookForm({ ...bookForm, pdf: e.target.files[0] })} />
                      </label>
                      <label className="p-4 bg-slate-50 dark:bg-[#0f172a] border border-dashed border-slate-200 dark:border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center gap-2 cursor-pointer hover:border-indigo-500 transition-all">
                        <FaPlus className="text-slate-400" />
                        <span className="text-sm font-semibold text-slate-500">Upload Book Cover</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => setBookForm({ ...bookForm, cover: e.target.files[0] })} />
                      </label>
                    </div>
                    <div className="pt-8 flex gap-4">
                      <button type="submit" className="flex-1 py-5 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all">
                        {editingBookId ? "Save Changes" : "Add Book"}
                      </button>
                      {editingBookId && <button type="button" onClick={cancelEditBook} className="px-8 py-5 bg-slate-100 dark:bg-white/5 rounded-xl font-black text-[11px] uppercase tracking-widest">Cancel</button>}
                    </div>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-6 md:p-10 border-b border-slate-50 dark:border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
                    <h3 className="text-2xl font-bold tracking-tight">Library Book List</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{books.length} Books Registered</span>
                    </div>
                  </div>
                  <div className="max-h-[800px] overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[600px] md:min-w-0">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 font-medium tracking-wide">
                          <th className="px-10 py-6">Book Details</th>
                          <th className="px-8 py-6">Availability</th>
                          <th className="px-10 py-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {books.map(book => (
                          <tr key={book.id || book._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-6">
                                <div className="w-12 h-16 bg-indigo-600 rounded-xl overflow-hidden shadow-md flex-shrink-0">
                                  {book.coverUrl ? <img src={book.coverUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/50"><FaBook /></div>}
                                </div>
                                <div>
                                  <p className="text-lg font-bold tracking-tight leading-none mb-2">{book.title}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">by {book.author}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-8">
                              <div className="flex flex-col">
                                <p className="text-xl font-black">{book.stock || 1}</p>
                                <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Books in Stock</p>
                              </div>
                            </td>
                            <td className="px-10 py-8 text-right">
                              <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEditBook(book)} className="p-4 bg-slate-100 dark:bg-white/5 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><FaLayerGroup /></button>
                                <button onClick={() => handleDeleteBook(book.id || book._id)} className="p-4 bg-slate-100 dark:bg-white/5 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><FaTrash /></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "identities" && (
            <motion.div key="identities" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid lg:grid-cols-3 gap-12">

              <div className="lg:col-span-1">
                <div className="bg-white dark:bg-slate-900 p-10 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/5 rounded-full blur-[100px] -translate-y-20 translate-x-20"></div>
                  <h3 className="text-2xl font-bold tracking-tight mb-10 flex items-center gap-4">
                    <FaUsers className="text-emerald-500" /> Register New Member
                  </h3>

                  <form onSubmit={handleAddMember} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                      <input type="text" required value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
                      <input type="email" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 font-bold text-sm" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Phone Number</label>
                      <input type="tel" value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} className="w-full bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-6 py-4 outline-none focus:border-emerald-500 font-bold text-sm" />
                    </div>
                    <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-md shadow-emerald-500/30 hover:bg-emerald-700 active:scale-95 transition-all mt-4">
                      Register Member
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="p-6 md:p-10 border-b border-slate-50 dark:border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
                    <h3 className="text-2xl font-bold tracking-tight">Member Directory</h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{members.length} Members Enrolled</span>
                  </div>
                  <div className="max-h-[800px] overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[600px] md:min-w-0">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 font-medium tracking-wide">
                          <th className="px-10 py-6">Member Name</th>
                          <th className="px-8 py-6">Contact Info</th>
                          <th className="px-10 py-6 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                        {members.map(member => (
                          <tr key={member.id || member._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                            <td className="px-10 py-8">
                              <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-md">
                                  {member.name?.[0] || "U"}
                                </div>
                                <div>
                                  <p className="text-lg font-bold tracking-tight leading-none mb-1">{member.name}</p>
                                  <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Active</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-8">
                              <p className="text-xs font-bold text-slate-500">{member.email || "No Email Registered"}</p>
                              <p className="text-[10px] text-slate-400 mt-1">{member.phone || "No Phone Registered"}</p>
                            </td>
                            <td className="px-10 py-8 text-right">
                              <button onClick={() => handleDeleteMember(member.id || member._id)} className="p-4 bg-slate-100 dark:bg-white/5 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-md"><FaTrash /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "procurement" && (
            <motion.div key="procurement" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-10 bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-between text-white">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-md">
                      <FaClipboardList className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tighter">New Book Requests</h3>
                      <p className="text-amber-100 font-medium text-sm">Review and manage book suggestions from students.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold">
                      {bookRequests.filter(r => r.status === 'Pending').length} Pending
                    </div>
                  </div>
                </div>

                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left min-w-[600px] md:min-w-0">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 font-medium tracking-wide border-b border-slate-100 dark:border-slate-200 dark:border-slate-800">
                        <th className="px-10 py-6">Requested By</th>
                        <th className="px-8 py-6">Book Requested</th>
                        <th className="px-8 py-6">Reason for Request</th>
                        <th className="px-8 py-6">Status</th>
                        <th className="px-10 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                      {bookRequests.length === 0 && (
                        <tr>
                          <td colSpan="5" className="py-24 text-center">
                            <FaClipboardList size={60} className="mx-auto text-slate-200 dark:text-slate-800 mb-6" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.3em]">No book requests found.</p>
                          </td>
                        </tr>
                      )}
                      {bookRequests.map(req => (
                        <tr key={req.id || req._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                          <td className="px-10 py-8">
                            <p className="text-base font-bold tracking-tight">{req.userId?.name || "Anonymous Student"}</p>
                            <p className="text-[10px] font-bold text-slate-400 tracking-widest">{req.userId?.email || "No Email"}</p>
                          </td>
                          <td className="px-8 py-8">
                            <p className="text-base font-black text-indigo-600 dark:text-indigo-400">{req.title}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">by {req.author}</p>
                          </td>
                          <td className="px-8 py-8">
                            <p className="text-xs text-slate-500 italic max-w-[250px] leading-relaxed group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors">"{req.reason || "No reason provided."}"</p>
                          </td>
                          <td className="px-8 py-8">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-semibold tracking-wide ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                req.status === 'Denied' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                  'bg-amber-500/10 text-amber-500 border border-amber-500/20 animate-pulse'
                              }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-10 py-8 text-right">
                            {req.status === 'Pending' ? (
                              <div className="flex justify-end gap-3">
                                <button onClick={() => handleUpdateRequestStatus(req.id || req._id, 'Approved')} className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-emerald-500/20 hover:scale-110 transition-all"><FaCheck /></button>
                                <button onClick={() => handleUpdateRequestStatus(req.id || req._id, 'Denied')} className="w-12 h-12 bg-rose-600 text-white rounded-xl flex items-center justify-center shadow-md shadow-rose-500/20 hover:scale-110 transition-all"><FaTimes /></button>
                              </div>
                            ) : (
                              <button
                                onClick={async () => {
                                  if (!window.confirm("Delete this request record?")) return;
                                  try {
                                    const res = await fetch(`${API_URL}/api/book-requests/${req.id || req._id}`, {
                                      method: "DELETE",
                                      headers: { Authorization: `Bearer ${user?.token}` }
                                    });
                                    if (res.ok) {
                                      toast.success("Request Deleted");
                                      fetchData();
                                    }
                                  } catch (err) {
                                    toast.error("Failed to delete record");
                                  }
                                }}
                                className="w-12 h-12 bg-slate-100 dark:bg-white/5 text-slate-400 rounded-xl flex items-center justify-center hover:bg-rose-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "users" && (
            <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="p-10 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between text-white">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-800 shadow-md">
                      <FaShieldAlt className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tighter">System Authorities</h3>
                      <p className="text-indigo-100 font-medium text-sm">Manage user roles and administrative permissions.</p>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold">
                    {users.length} Total Nodes
                  </div>
                </div>

                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left min-w-[600px] md:min-w-0">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 font-medium tracking-wide border-b border-slate-100 dark:border-slate-200 dark:border-slate-800">
                        <th className="px-10 py-6">Identity</th>
                        <th className="px-8 py-6">Membership</th>
                        <th className="px-8 py-6">Access Role</th>
                        <th className="px-8 py-6">Account Status</th>
                        <th className="px-10 py-6 text-right">Administrative Actions</th>

                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                      {users.map(u => (
                        <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all group">
                          <td className="px-10 py-8">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center font-bold text-indigo-500">
                                {u.name?.[0]}
                              </div>
                              <div>
                                <p className="text-base font-bold tracking-tight">{u.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 tracking-widest">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-8">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-semibold tracking-wide ${
                              u.membership === 'Elite' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                              u.membership === 'Premium' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 
                              'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
                            }`}>
                              {u.membership || 'Basic'}
                            </span>
                          </td>

                          <td className="px-8 py-8">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-semibold tracking-wide ${u.role === 'admin' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 'bg-slate-100 text-slate-500'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-8 py-8">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-semibold tracking-wide ${u.accountStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {u.accountStatus || 'active'}
                            </span>
                          </td>
                          <td className="px-10 py-8 text-right">
                            {u.role !== 'admin' ? (
                              <button 
                                onClick={() => handlePromote(u._id)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-500/20"
                              >
                                Promote to Admin
                              </button>
                            ) : (
                              u._id !== user?.id && (
                                <button 
                                  onClick={() => handleDemote(u._id)}
                                  className="px-6 py-3 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition-all shadow-md shadow-rose-500/20"
                                >
                                  Demote from Admin
                                </button>
                              )
                            )}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "automation" && (

            <motion.div key="automation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="space-y-10">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-12 shadow-md border border-slate-200 dark:border-slate-800 relative overflow-hidden">
                <div className="flex justify-between items-center mb-16">
                  <div>
                    <h3 className="text-4xl font-black tracking-tighter mb-2">Automation</h3>
                    <p className="text-slate-500 font-medium">Manage automated tasks.</p>
                  </div>
                  <div className="w-20 h-20 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner"><FaCogs size={32} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {automationJobs.map((job) => (
                    <div key={job.id} className="bg-slate-50 dark:bg-white/2 p-8 rounded-xl border border-slate-200 dark:border-slate-800 group hover:border-indigo-600 transition-all flex flex-col justify-between shadow-md">
                      <div className="mb-10">
                        <div className="flex justify-between items-start mb-6">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-semibold tracking-wide ${job.enabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-200 text-slate-500'}`}>
                            {job.enabled ? 'Active' : 'Disabled'}
                          </span>
                          <button
                            onClick={async () => {
                              const res = await fetch(`${API_URL}/api/automation/toggle`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
                                body: JSON.stringify({ id: job.id })
                              });
                              if (res.ok) { fetchAutomation(); toast.success("Settings Updated"); }
                            }}
                            className={`p-3 rounded-xl transition-all ${job.enabled ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}
                          >
                            <FaPowerOff size={16} />
                          </button>
                        </div>
                        <h4 className="text-2xl font-black mb-3">{job.name}</h4>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">{job.description}</p>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule: <span className="text-slate-900 dark:text-white">{job.schedule}</span></p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Run: <span className="text-indigo-600">{job.lastRun !== "Never" ? new Date(job.lastRun).toLocaleString() : "Not run yet"}</span></p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const toastId = toast.loading(`Running task...`);
                          const res = await fetch(`${API_URL}/api/automation/run`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", Authorization: `Bearer ${user?.token}` },
                            body: JSON.stringify({ id: job.id })
                          });
                          if (res.ok) { fetchAutomation(); toast.success("Task completed", { id: toastId }); }
                          else { toast.error("Task failed", { id: toastId }); }
                        }}
                        className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-md"
                      >
                        <FaPlay size={10} /> Run Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
}
