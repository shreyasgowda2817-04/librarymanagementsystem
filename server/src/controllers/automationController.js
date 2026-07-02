import { 
  scanOverdueBooks, 
  cleanupAbandonedRequests, 
  systemHealthCheck, 
  scanExpiredMemberships,
  scanDueTomorrowBooks,
  jobConfigs 
} from "../utils/cronJobs.js";
import MessageTemplate from "../models/MessageTemplate.js";

export const getCronStatus = async (req, res) => {
  try {
    const status = Object.keys(jobConfigs).map(key => ({
      id: key,
      name: jobConfigs[key].name,
      description: jobConfigs[key].description,
      enabled: jobConfigs[key].enabled,
      schedule: jobConfigs[key].schedule,
      lastRun: jobConfigs[key].lastRun || "Never"
    }));
    res.json(status);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch automation status" });
  }
};

export const toggleCronJob = async (req, res) => {
  const { id } = req.body;
  try {
    if (jobConfigs[id]) {
      jobConfigs[id].enabled = !jobConfigs[id].enabled;
      res.json({ message: `${jobConfigs[id].name} ${jobConfigs[id].enabled ? 'Enabled' : 'Disabled'}` });
    } else {
      res.status(404).json({ message: "Job not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to toggle job" });
  }
};

export const runCronManually = async (req, res) => {
  const { id } = req.body;
  try {
    switch (id) {
      case "overdue":
        await scanOverdueBooks();
        break;
      case "requests":
        await cleanupAbandonedRequests();
        break;
      case "health":
        await systemHealthCheck();
        break;
      case "dueTomorrow":
        await scanDueTomorrowBooks();
        break;
      case "membershipExpiry":
        await scanExpiredMemberships();
        break;
      default:
        return res.status(404).json({ message: "Task identifier unknown" });
    }
    res.json({ message: `${jobConfigs[id].name} executed successfully` });
  } catch (err) {
    res.status(500).json({ message: "Execution failure" });
  }
};

// ==========================================
// MESSAGE TEMPLATES
// ==========================================

export const getTemplates = async (req, res) => {
  try {
    const templates = await MessageTemplate.find().sort({ updatedAt: -1 });
    // Format to match UI exactly
    res.json(templates.map(t => ({ id: t.templateId, content: t.content })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch templates" });
  }
};

export const saveTemplate = async (req, res) => {
  const { id, content } = req.body;
  if (!id || !content) return res.status(400).json({ message: "ID and Content required" });

  try {
    const template = await MessageTemplate.findOneAndUpdate(
      { templateId: id },
      { content },
      { new: true, upsert: true } // Create if doesn't exist
    );
    res.json({ message: "Template saved successfully", template: { id: template.templateId, content: template.content } });
  } catch (err) {
    res.status(500).json({ message: "Failed to save template" });
  }
};

export const deleteTemplate = async (req, res) => {
  const { id } = req.params;
  try {
    await MessageTemplate.findOneAndDelete({ templateId: id });
    res.json({ message: "Template deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete template" });
  }
};
