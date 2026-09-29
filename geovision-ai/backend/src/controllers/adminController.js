const store = require('../services/store');
const aiClient = require('../services/aiClient');
const os = require('os');
const fs = require('fs');
const path = require('path');

const getDashboardStats = async (req, res) => {
  try {
    const userCount = await store.getUserCount();
    const imageCount = await store.getImageCount();
    const jobCounts = await store.getJobCounts();
    const aiHealth = await aiClient.checkAIHealth();

    // Calculate disk space used by uploads and outputs
    const uploadsDir = path.resolve(__dirname, '../../../uploads');
    const outputsDir = path.resolve(__dirname, '../../../outputs');

    const getFolderSize = (dir) => {
      if (!fs.existsSync(dir)) return 0;
      let total = 0;
      const files = fs.readdirSync(dir);
      for (const f of files) {
        try {
          const stats = fs.statSync(path.join(dir, f));
          if (stats.isFile()) total += stats.size;
        } catch (e) {}
      }
      return total;
    };

    const uploadsBytes = getFolderSize(uploadsDir);
    const outputsBytes = getFolderSize(outputsDir);
    const totalStorageMb = ((uploadsBytes + outputsBytes) / (1024 * 1024)).toFixed(2);

    return res.json({
      success: true,
      stats: {
        totalUsers: userCount,
        totalUploadedImages: imageCount,
        totalJobs: jobCounts.total,
        completedJobs: jobCounts.completed,
        failedJobs: jobCounts.failed,
        pendingJobs: jobCounts.pending,
        successRatePercent: jobCounts.total > 0 ? Math.round((jobCounts.completed / jobCounts.total) * 100) : 100,
        storageUsedMb: totalStorageMb,
        system: {
          platform: os.platform(),
          cpuCount: os.cpus().length,
          totalMemoryGb: (os.totalmem() / (1024 ** 3)).toFixed(1),
          freeMemoryGb: (os.freemem() / (1024 ** 3)).toFixed(1),
          uptimeHours: (os.uptime() / 3600).toFixed(1),
        },
        aiService: {
          online: aiHealth.online,
          status: aiHealth.online ? 'Optimal' : 'Offline / Booting',
          device: aiHealth.data?.device || 'CPU',
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve admin dashboard stats.', error: err.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await store.getAllUsers();
    return res.json({ success: true, count: users.length, users });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch users list.' });
  }
};

const getJobs = async (req, res) => {
  try {
    const jobs = await store.getAllJobs();
    return res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch all processing jobs.' });
  }
};

const getModels = async (req, res) => {
  try {
    const modelsData = await aiClient.getSupportedModels();
    return res.json({ success: true, data: modelsData });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch model configs.' });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  getJobs,
  getModels,
};
