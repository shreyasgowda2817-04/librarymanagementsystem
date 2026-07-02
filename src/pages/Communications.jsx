import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWhatsapp, FaPlus, FaSave, FaArrowRight, FaCode, FaCheckCircle, FaTrash, FaPlay, FaRobot } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

export default function Communications() {
  const [activeTab, setActiveTab] = useState('flows');
  const [flows, setFlows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Real API Fetch
  const fetchFlows = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${API_URL}/api/automation/status`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFlows(data);
      } else {
        toast.error('Failed to fetch automations');
      }
    } catch (error) {
      console.error(error);
      toast.error('Server error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlows();
  }, []);

  // Real Toggle Logic
  const toggleFlow = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'));
    try {
      const res = await fetch(`${API_URL}/api/automation/toggle`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}` 
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setFlows(flows.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to toggle automation');
    }
  };

  // Real Run Manually Logic
  const runManually = async (id) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const toastId = toast.loading('Running task...');
    try {
      const res = await fetch(`${API_URL}/api/automation/run`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}` 
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message, { id: toastId });
      } else {
        toast.error(data.message || 'Failed to run task', { id: toastId });
      }
    } catch (error) {
      toast.error('Server error during execution', { id: toastId });
    }
  };

  // Template Logic
  const [templates, setTemplates] = useState([]);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const fetchTemplates = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await fetch(`${API_URL}/api/automation/templates`, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTemplates(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFlows();
    fetchTemplates();
  }, []);

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !editingTemplate.id) return toast.error('Template ID required');
    
    const user = JSON.parse(localStorage.getItem('user'));
    const toastId = toast.loading('Saving template...');
    
    try {
      const res = await fetch(`${API_URL}/api/automation/templates`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}` 
        },
        body: JSON.stringify({ id: editingTemplate.id, content: editingTemplate.content })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Template saved successfully', { id: toastId });
        fetchTemplates();
      } else {
        toast.error(data.message || 'Failed to save template', { id: toastId });
      }
    } catch (error) {
      toast.error('Server error', { id: toastId });
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (!window.confirm("Are you sure you want to delete this template?")) return;
    
    const user = JSON.parse(localStorage.getItem('user'));
    const toastId = toast.loading('Deleting...');
    
    try {
      const res = await fetch(`${API_URL}/api/automation/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      if (res.ok) {
        toast.success('Deleted', { id: toastId });
        setEditingTemplate(null);
        fetchTemplates();
      } else {
        toast.error('Failed to delete', { id: toastId });
      }
    } catch (error) {
      toast.error('Server error', { id: toastId });
    }
  };

  const createNewTemplate = () => {
    const newId = prompt("Enter a unique Template ID (e.g. 'welcome_message'):");
    if (newId) {
      setEditingTemplate({ id: newId.trim().replace(/\s+/g, '_').toLowerCase(), content: '' });
    }
  };

  const insertVariable = (variable) => {
    if (editingTemplate) {
      setEditingTemplate({
        ...editingTemplate,
        content: editingTemplate.content + ` {{${variable}}}`
      });
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1200px] mx-auto min-h-[calc(100vh-80px)] font-sans">
      
      {/* Header & Mini Analytics */}
      <div className="mb-12">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-6">Automations Hub</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">System Status</div>
              <div className="text-2xl font-light text-slate-900 dark:text-white">Online</div>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <FaCheckCircle size={24} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Background Tasks</div>
            <div className="text-4xl font-light text-slate-900 dark:text-white">{flows.length}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Active Jobs</div>
            <div className="text-4xl font-light text-indigo-600 dark:text-indigo-400">{flows.filter(f => f.enabled).length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-slate-200 dark:border-slate-800 mb-8">
        <button 
          onClick={() => setActiveTab('flows')}
          className={`pb-4 text-sm font-bold tracking-wide transition-colors relative ${activeTab === 'flows' ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Server Cron Jobs
          {activeTab === 'flows' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white" />}
        </button>
        <button 
          onClick={() => setActiveTab('templates')}
          className={`pb-4 text-sm font-bold tracking-wide transition-colors relative ${activeTab === 'templates' ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600'}`}
        >
          Message Templates
          {activeTab === 'templates' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900 dark:bg-white" />}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden min-h-[500px]">
        <AnimatePresence mode="wait">
          
          {/* FLOWS TAB */}
          {activeTab === 'flows' && (
            <motion.div key="flows" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">Active Background Tasks</h2>
              </div>

              {isLoading ? (
                <div className="flex justify-center p-12 text-slate-400">Loading server jobs...</div>
              ) : (
                <div className="space-y-4">
                  {flows.map(flow => (
                    <div key={flow.id} className={`p-6 rounded-2xl border ${flow.enabled ? 'border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-500/5' : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'} flex items-center justify-between transition-colors`}>
                      <div className="flex items-center gap-8">
                        {/* Toggle */}
                        <button 
                          onClick={() => toggleFlow(flow.id)}
                          className={`w-12 h-6 rounded-full transition-colors relative ${flow.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                        >
                          <motion.div 
                            layout
                            className="w-4 h-4 bg-white rounded-full absolute top-1"
                            initial={false}
                            animate={{ left: flow.enabled ? '1.75rem' : '0.25rem' }}
                          />
                        </button>

                        {/* Rule Logic */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 dark:text-white">{flow.name}</h3>
                            <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-mono">{flow.schedule}</span>
                          </div>
                          <p className="text-xs text-slate-500">{flow.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-xs text-slate-400 text-right">
                          Last run: <br/>
                          <span className="font-mono">{flow.lastRun}</span>
                        </div>
                        <button 
                          onClick={() => runManually(flow.id)}
                          className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all shadow-sm"
                          title="Run Job Now"
                        >
                          <FaPlay />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* TEMPLATES TAB */}
          {activeTab === 'templates' && (
            <motion.div key="templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-[500px]">
              
              {/* Template List */}
              <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-2 overflow-y-auto">
                <button onClick={createNewTemplate} className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors mb-4">
                  <FaPlus /> New Template
                </button>
                {templates.map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => setEditingTemplate({...t})}
                    className={`p-4 rounded-xl text-left border transition-all ${editingTemplate?.id === t.id ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'}`}
                  >
                    <div className="font-bold mb-1">{t.id}</div>
                    <div className={`text-xs truncate ${editingTemplate?.id === t.id ? 'text-slate-300 dark:text-slate-500' : 'text-slate-400'}`}>{t.content}</div>
                  </button>
                ))}
                {templates.length === 0 && (
                  <div className="text-center text-slate-400 text-sm mt-10">No templates found.<br/>Create one above!</div>
                )}
              </div>

              {/* Editor */}
              <div className="w-2/3 p-8 bg-slate-50/50 dark:bg-slate-900 flex flex-col">
                {editingTemplate ? (
                  <>
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">{editingTemplate.id}</h2>
                        <button onClick={() => handleDeleteTemplate(editingTemplate.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete Template">
                          <FaTrash />
                        </button>
                      </div>
                      <button onClick={handleSaveTemplate} className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-lg text-xs font-bold tracking-wide flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <FaSave /> Save Changes
                      </button>
                    </div>

                    <div className="flex gap-2 mb-4">
                      {['student_name', 'due_date', 'amount', 'student_id'].map(v => (
                        <button key={v} onClick={() => insertVariable(v)} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-indigo-100 transition-colors">
                          <FaCode /> {v}
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={editingTemplate.content}
                      onChange={(e) => setEditingTemplate({...editingTemplate, content: e.target.value})}
                      className="flex-1 w-full bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                    />

                    <div className="mt-6 bg-slate-900 dark:bg-slate-800 text-white p-6 rounded-2xl flex gap-4">
                      <FaWhatsapp className="text-emerald-500 text-3xl shrink-0" />
                      <div>
                        <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">Live Preview</div>
                        <p className="text-sm leading-relaxed">
                          {editingTemplate.content.replace(/{{student_name}}/g, 'Shreyas').replace(/{{amount}}/g, '500').replace(/{{due_date}}/g, 'Oct 15').replace(/{{student_id}}/g, 'STU-992')}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-400 font-medium text-sm">
                    Select a template to edit
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
