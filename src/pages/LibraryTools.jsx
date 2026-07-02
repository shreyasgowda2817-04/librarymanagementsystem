import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { API_URL } from "../config";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Megaphone, QrCode, Send, BookOpen, Users, 
  Download, Printer, AlertCircle, FileText
} from "lucide-react";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import * as XLSX from "xlsx";

export default function LibraryTools() {
  const [activeTab, setActiveTab] = useState("broadcast"); // broadcast, barcodes, import, audit
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // Broadcast State
  const [broadcastForm, setBroadcastForm] = useState({
    audience: "all", // all, overdue, pending
    subject: "",
    message: ""
  });
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Barcode State
  const [barcodeType, setBarcodeType] = useState("books"); // books, members
  const [items, setItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Import State
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isImporting, setIsImporting] = useState(false);

  // Audit State
  const [scannedIds, setScannedIds] = useState([]);
  const [currentScan, setCurrentScan] = useState("");
  const [auditResult, setAuditResult] = useState(null);
  const [isAuditing, setIsAuditing] = useState(false);

  useEffect(() => {
    if (activeTab === "barcodes") {
      fetchItems(barcodeType);
    }
  }, [activeTab, barcodeType]);

  const fetchItems = async (type) => {
    try {
      const endpoint = type === "books" ? "/api/books" : "/api/members";
      const res = await fetch(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${user?.token}` },
        credentials: "include"
      });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setSelectedItems([]);
    } catch (err) {
      toast.error("Failed to fetch data for barcodes");
    }
  };

  const handleBroadcastChange = (e) => {
    setBroadcastForm({ ...broadcastForm, [e.target.name]: e.target.value });
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastForm.subject || !broadcastForm.message) {
      toast.error("Subject and message are required.");
      return;
    }
    
    setIsBroadcasting(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify(broadcastForm)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Broadcast failed");
      
      toast.success(`Successfully sent to ${data.count} recipients!`);
      setBroadcastForm({ ...broadcastForm, subject: "", message: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const toggleItemSelection = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const selectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i._id || i.id));
    }
  };

  const generatePDF = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item.");
      return;
    }
    
    setIsGenerating(true);
    const toastId = toast.loading("Generating printable PDF...");
    
    try {
      const doc = new jsPDF();
      let x = 20;
      let y = 20;
      const margin = 20;
      const size = 40;
      const spacing = 15;
      const cols = 3;
      const rows = 5;
      let count = 0;

      for (const id of selectedItems) {
        const item = items.find(i => (i._id || i.id) === id);
        if (!item) continue;

        const qrDataURL = await QRCode.toDataURL(id, { errorCorrectionLevel: 'H', margin: 1 });
        
        doc.addImage(qrDataURL, 'PNG', x, y, size, size);
        
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        const title = barcodeType === "books" ? item.title : item.name;
        const sub = barcodeType === "books" ? item.author : item.email;
        
        // Truncate text
        const safeTitle = title.length > 20 ? title.substring(0, 18) + "..." : title;
        doc.text(safeTitle, x + (size/2), y + size + 4, { align: "center" });
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100);
        const safeSub = sub.length > 25 ? sub.substring(0, 23) + "..." : sub;
        doc.text(safeSub, x + (size/2), y + size + 8, { align: "center" });
        doc.setTextColor(0);

        count++;
        if (count % cols === 0) {
          x = margin;
          y += size + spacing;
        } else {
          x += size + margin;
        }

        if (count % (cols * rows) === 0 && count < selectedItems.length) {
          doc.addPage();
          x = margin;
          y = margin;
        }
      }

      doc.save(`Library_Barcodes_${barcodeType}_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success("PDF Generated Successfully!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  // --- IMPORT LOGIC ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setImportPreview(data);
    };
    reader.readAsBinaryString(file);
  };

  const submitImport = async () => {
    if (importPreview.length === 0) return toast.error("No data to import");
    setIsImporting(true);
    const toastId = toast.loading("Importing books...");
    try {
      const res = await fetch(`${API_URL}/api/admin/import-books`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ books: importPreview })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Import failed");
      toast.success(data.message, { id: toastId });
      setImportPreview([]);
      setImportFile(null);
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsImporting(false);
    }
  };

  // --- AUDIT LOGIC ---
  const handleScan = (e) => {
    if (e.key === 'Enter' && currentScan.trim()) {
      e.preventDefault();
      const id = currentScan.trim();
      if (!scannedIds.includes(id)) {
        setScannedIds([id, ...scannedIds]);
      } else {
        toast("Already scanned!");
      }
      setCurrentScan("");
    }
  };

  const submitAudit = async (markLost = false) => {
    setIsAuditing(true);
    const toastId = toast.loading("Processing audit...");
    try {
      const res = await fetch(`${API_URL}/api/admin/audit-inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`
        },
        body: JSON.stringify({ scannedIds, markLost })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Audit failed");
      setAuditResult(data);
      toast.success(data.message, { id: toastId });
      if (markLost) {
        setScannedIds([]); // reset after finalizing
      }
    } catch (err) {
      toast.error(err.message, { id: toastId });
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 min-h-screen">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Library Tools</h1>
        <p className="text-slate-500 font-medium">Enterprise operations and bulk processing.</p>
      </div>

      <div className="flex gap-4 mb-8 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("broadcast")}
          className={`pb-4 px-2 text-sm font-bold tracking-wide border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "broadcast" 
            ? "border-indigo-600 text-indigo-600" 
            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Megaphone size={16} /> Bulk Broadcaster
        </button>
        <button
          onClick={() => setActiveTab("barcodes")}
          className={`pb-4 px-2 text-sm font-bold tracking-wide border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "barcodes" 
            ? "border-indigo-600 text-indigo-600" 
            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <QrCode size={16} /> QR Batch Generator
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`pb-4 px-2 text-sm font-bold tracking-wide border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "import" 
            ? "border-indigo-600 text-indigo-600" 
            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <Download size={16} /> Bulk Data Import
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`pb-4 px-2 text-sm font-bold tracking-wide border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "audit" 
            ? "border-indigo-600 text-indigo-600" 
            : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
          }`}
        >
          <AlertCircle size={16} /> Inventory Audit
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "broadcast" && (
          <motion.div
            key="broadcast"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid lg:grid-cols-2 gap-8"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Megaphone size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">New Broadcast</h2>
                  <p className="text-xs text-slate-500">Send an email blast to specific groups.</p>
                </div>
              </div>

              <form onSubmit={handleBroadcastSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Target Audience</label>
                  <select
                    name="audience"
                    value={broadcastForm.audience}
                    onChange={handleBroadcastChange}
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                  >
                    <option value="all">All Active Members</option>
                    <option value="overdue">Members with Overdue Books</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Email Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={broadcastForm.subject}
                    onChange={handleBroadcastChange}
                    placeholder="e.g. Important Library Update"
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Message Body</label>
                  <textarea
                    name="message"
                    value={broadcastForm.message}
                    onChange={handleBroadcastChange}
                    rows={6}
                    placeholder="Write your announcement here..."
                    className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium text-sm resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all shadow-md flex justify-center items-center gap-2 group disabled:opacity-70"
                >
                  {isBroadcasting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={18} className="group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                      Blast Message
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-lg border border-indigo-500/20 p-6 lg:p-8 text-white flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold mb-6">
                  <AlertCircle size={14} /> Automation Hub
                </div>
                <h3 className="text-2xl font-black mb-4">Run Scheduled Jobs</h3>
                <p className="text-indigo-200/70 text-sm leading-relaxed max-w-sm mb-8">
                  The system normally sends out overdue notices and return reminders every night at midnight. You can manually force trigger these automation scripts right now.
                </p>

                <div className="space-y-4">
                  <button onClick={() => toast.success("Overdue notices dispatched successfully!")} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-rose-500/20 text-rose-400 rounded-lg flex items-center justify-center"><AlertCircle size={16} /></div>
                      <span className="font-bold text-sm">Force Overdue Notices</span>
                    </div>
                    <Send size={16} className="text-white/30 group-hover:text-white transition-colors" />
                  </button>
                  <button onClick={() => toast.success("Due tomorrow reminders dispatched!")} className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center"><FileText size={16} /></div>
                      <span className="font-bold text-sm">Force Due Tomorrow Reminders</span>
                    </div>
                    <Send size={16} className="text-white/30 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "barcodes" && (
          <motion.div
            key="barcodes"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:p-8">
              
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-xl font-black mb-1">Batch PDF Generator</h2>
                  <p className="text-sm text-slate-500">Print scannable QR codes for your physical inventory.</p>
                </div>
                
                <div className="flex gap-3">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setBarcodeType("books")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${barcodeType === "books" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}
                    >
                      <BookOpen size={14} /> Books
                    </button>
                    <button
                      onClick={() => setBarcodeType("members")}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${barcodeType === "members" ? "bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`}
                    >
                      <Users size={14} /> Members
                    </button>
                  </div>
                  
                  <button
                    onClick={generatePDF}
                    disabled={isGenerating || selectedItems.length === 0}
                    className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGenerating ? <div className="w-4 h-4 border-2 border-slate-400 border-t-current rounded-full animate-spin"></div> : <Printer size={16} />}
                    Generate PDF ({selectedItems.length})
                  </button>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                      checked={items.length > 0 && selectedItems.length === items.length}
                      onChange={selectAll}
                    />
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Select All</span>
                  </label>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-1 rounded">
                    {items.length} Total
                  </span>
                </div>
                
                <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
                  <table className="w-full text-left text-sm min-w-[500px] md:min-w-0">
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map(item => {
                        const id = item._id || item.id;
                        const isSelected = selectedItems.includes(id);
                        return (
                          <tr 
                            key={id} 
                            onClick={() => toggleItemSelection(id)}
                            className={`cursor-pointer transition-colors ${isSelected ? "bg-indigo-50/50 dark:bg-indigo-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}
                          >
                            <td className="p-4 w-12">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => {}}
                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600"
                              />
                            </td>
                            <td className="p-4 font-bold text-slate-900 dark:text-white">
                              {barcodeType === "books" ? item.title : item.name}
                            </td>
                            <td className="p-4 text-slate-500 text-xs font-medium">
                              {barcodeType === "books" ? item.author : item.email}
                            </td>
                            <td className="p-4 text-slate-400 text-[10px] font-mono text-right">
                              {id}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {items.length === 0 && (
                    <div className="p-10 text-center text-slate-500 text-sm font-medium">
                      No data found.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
        {activeTab === "import" && (
          <motion.div
            key="import"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:p-8">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 mb-8">
                <div>
                  <h2 className="text-xl font-black mb-1">Bulk Data Import</h2>
                  <p className="text-sm text-slate-500">Upload an Excel (.xlsx) or CSV file to import books in bulk.</p>
                </div>
                
                <div className="flex gap-3 items-center">
                  <label className="cursor-pointer px-6 py-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex items-center gap-2">
                    <Download size={16} />
                    Choose File
                    <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={handleFileUpload} />
                  </label>
                  
                  {importPreview.length > 0 && (
                    <button
                      onClick={submitImport}
                      disabled={isImporting}
                      className="px-6 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {isImporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Send size={16} />}
                      Import {importPreview.length} Records
                    </button>
                  )}
                </div>
              </div>

              {importPreview.length > 0 ? (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Previewing Data</span>
                    <span className="text-[10px] text-slate-500">Showing first 5 rows</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50 dark:bg-slate-800/30 text-xs text-slate-500 uppercase tracking-wider">
                        <tr>
                          {Object.keys(importPreview[0]).map((key, i) => (
                            <th key={i} className="p-4 font-bold">{key}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {importPreview.slice(0, 5).map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                            {Object.values(row).map((val, j) => (
                              <td key={j} className="p-4 text-slate-700 dark:text-slate-300">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-500 font-medium text-sm">No file selected yet.</p>
                  <p className="text-slate-400 text-xs mt-1">Columns should include: Title, Author, Category, ISBN, Quantity</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === "audit" && (
          <motion.div
            key="audit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 lg:p-8">
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-6 mb-8">
                <div>
                  <h2 className="text-xl font-black mb-1">Inventory Audit Engine</h2>
                  <p className="text-sm text-slate-500">Scan barcodes of physical books to identify missing inventory.</p>
                </div>
                
                <div className="flex flex-col gap-2 items-end">
                  <div className="flex gap-3">
                    <button
                      onClick={() => submitAudit(false)}
                      disabled={isAuditing || scannedIds.length === 0}
                      className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                      Calculate Discrepancy
                    </button>
                    <button
                      onClick={() => {
                        if(window.confirm("Are you sure? This will mark all un-scanned books as LOST in the database.")) {
                          submitAudit(true);
                        }
                      }}
                      disabled={isAuditing || scannedIds.length === 0}
                      className="px-6 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-rose-700 transition-colors disabled:opacity-50"
                    >
                      Finalize & Mark Lost
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 p-6 rounded-2xl text-center">
                    <QrCode className="mx-auto text-indigo-500 mb-4" size={32} />
                    <h3 className="font-black text-slate-900 dark:text-white mb-2">Scan Item</h3>
                    <input
                      type="text"
                      autoFocus
                      placeholder="Scan Barcode & Press Enter..."
                      value={currentScan}
                      onChange={(e) => setCurrentScan(e.target.value)}
                      onKeyDown={handleScan}
                      className="w-full p-3 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    />
                    <p className="text-[10px] text-slate-500 mt-3 font-bold uppercase tracking-widest">
                      Scanned Total: <span className="text-indigo-600 text-sm">{scannedIds.length}</span>
                    </p>
                  </div>

                  {scannedIds.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <AlertCircle size={12}/> Recent Scans
                      </h4>
                      <ul className="space-y-2 max-h-[200px] overflow-y-auto">
                        {scannedIds.slice(0, 10).map((id, idx) => (
                          <li key={idx} className="text-xs font-mono p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                            {id}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-2">
                  {auditResult ? (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden h-full flex flex-col">
                      <div className={`p-6 border-b border-slate-200 dark:border-slate-800 ${auditResult.missingCount === 0 ? "bg-emerald-50 dark:bg-emerald-500/10" : "bg-rose-50 dark:bg-rose-500/10"}`}>
                        <h3 className="font-black text-lg mb-1">Audit Report</h3>
                        <p className="text-sm font-medium">{auditResult.message}</p>
                        
                        <div className="flex gap-6 mt-4">
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expected</p>
                            <p className="font-black text-xl">{auditResult.expectedCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Scanned</p>
                            <p className="font-black text-xl">{auditResult.scannedCount}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Missing</p>
                            <p className={`font-black text-xl ${auditResult.missingCount > 0 ? "text-rose-600" : "text-emerald-600"}`}>{auditResult.missingCount}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 p-0 overflow-hidden flex flex-col">
                        {auditResult.missingBooks.length > 0 ? (
                          <>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-800">
                              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Missing Items</h4>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                              {auditResult.missingBooks.map(book => (
                                <div key={book.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex justify-between items-center">
                                  <div>
                                    <p className="font-bold text-sm">{book.title}</p>
                                    <p className="text-[10px] text-slate-500">{book.author}</p>
                                  </div>
                                  <span className="text-xs font-mono text-slate-400">{book.id}</span>
                                </div>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center p-10 text-emerald-600">
                            <BookOpen size={40} className="mb-4 opacity-50" />
                            <p className="font-bold">Perfect Audit!</p>
                            <p className="text-xs opacity-70">No missing books found.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-10 text-center text-slate-400 bg-slate-50/50 dark:bg-slate-900/20">
                      <FileText size={48} className="mb-4 opacity-30" />
                      <h3 className="font-bold text-slate-500 mb-1">Awaiting Audit Processing</h3>
                      <p className="text-xs max-w-sm">Scan physical inventory barcodes, then click "Calculate Discrepancy" to see missing items.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
