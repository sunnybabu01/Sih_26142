const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { getIsConnected } = require('../config/db');
const User = require('../models/User');
const Image = require('../models/Image');
const ProcessingJob = require('../models/ProcessingJob');
const ValidationReport = require('../models/ValidationReport');

// Memory store for offline/resilient mode
const mem = {
  users: [],
  images: [],
  jobs: [],
  reports: [],
};

// Seed default users for instant testing
const seedMemory = async () => {
  if (mem.users.length === 0) {
    const adminHash = await bcrypt.hash('Admin@12345', 10);
    const researcherHash = await bcrypt.hash('Researcher@12345', 10);
    const demoUserHash = await bcrypt.hash('User@12345', 10);

    const adminUser = {
      _id: '66fa89c0e123456789012341',
      name: 'System Administrator',
      email: 'admin@geovision.ai',
      passwordHash: adminHash,
      role: 'admin',
      createdAt: new Date('2026-01-01T00:00:00Z'),
    };

    const researcherUser = {
      _id: '66fa89c0e123456789012342',
      name: 'Dr. Aris Vance (GIS Researcher)',
      email: 'researcher@geovision.ai',
      passwordHash: researcherHash,
      role: 'researcher',
      createdAt: new Date('2026-01-05T00:00:00Z'),
    };

    const standardUser = {
      _id: '66fa89c0e123456789012343',
      name: 'Elena Rostova',
      email: 'user@geovision.ai',
      passwordHash: demoUserHash,
      role: 'user',
      createdAt: new Date('2026-02-01T00:00:00Z'),
    };

    mem.users.push(adminUser, researcherUser, standardUser);
  }
};

seedMemory();

const generateId = () => new mongoose.Types.ObjectId().toString();

module.exports = {
  // Users
  async findUserByEmail(email) {
    if (getIsConnected()) {
      return await User.findOne({ email: email.toLowerCase() });
    }
    return mem.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },

  async findUserById(id) {
    if (getIsConnected()) {
      return await User.findById(id).select('-passwordHash');
    }
    const u = mem.users.find((user) => String(user._id) === String(id));
    if (!u) return null;
    const { passwordHash, ...rest } = u;
    return rest;
  },

  async createUser({ name, email, passwordHash, role = 'researcher' }) {
    if (getIsConnected()) {
      const user = new User({ name, email, passwordHash, role });
      return await user.save();
    }
    const newUser = {
      _id: generateId(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
      createdAt: new Date(),
    };
    mem.users.push(newUser);
    return newUser;
  },

  async getAllUsers() {
    if (getIsConnected()) {
      return await User.find().select('-passwordHash').sort({ createdAt: -1 });
    }
    return mem.users.map(({ passwordHash, ...rest }) => rest);
  },

  async getUserCount() {
    if (getIsConnected()) {
      return await User.countDocuments();
    }
    return mem.users.length;
  },

  // Images
  async createImage(data) {
    if (getIsConnected()) {
      const img = new Image(data);
      return await img.save();
    }
    const newImg = {
      _id: generateId(),
      ...data,
      uploadedAt: new Date(),
    };
    mem.images.unshift(newImg);
    return newImg;
  },

  async findImageById(id) {
    if (getIsConnected()) {
      return await Image.findById(id);
    }
    return mem.images.find((img) => String(img._id) === String(id)) || null;
  },

  async getImagesByUserId(userId) {
    if (getIsConnected()) {
      return await Image.find({ ownerId: userId }).sort({ uploadedAt: -1 });
    }
    return mem.images.filter((img) => String(img.ownerId) === String(userId));
  },

  async getAllImages() {
    if (getIsConnected()) {
      return await Image.find().sort({ uploadedAt: -1 }).populate('ownerId', 'name email');
    }
    return mem.images;
  },

  async deleteImage(id) {
    if (getIsConnected()) {
      return await Image.findByIdAndDelete(id);
    }
    const idx = mem.images.findIndex((img) => String(img._id) === String(id));
    if (idx !== -1) {
      return mem.images.splice(idx, 1)[0];
    }
    return null;
  },

  async getImageCount() {
    if (getIsConnected()) {
      return await Image.countDocuments();
    }
    return mem.images.length;
  },

  // Processing Jobs
  async createJob(data) {
    if (getIsConnected()) {
      const job = new ProcessingJob(data);
      return await job.save();
    }
    const newJob = {
      _id: generateId(),
      ...data,
      progress: data.progress || 0,
      status: data.status || 'pending',
      createdAt: new Date(),
    };
    mem.jobs.unshift(newJob);
    return newJob;
  },

  async findJobById(id) {
    if (getIsConnected()) {
      return await ProcessingJob.findById(id).populate('imageId').populate('userId', 'name email');
    }
    const job = mem.jobs.find((j) => String(j._id) === String(id));
    if (!job) return null;
    const img = mem.images.find((i) => String(i._id) === String(job.imageId));
    const user = mem.users.find((u) => String(u._id) === String(job.userId));
    return {
      ...job,
      imageId: img || { originalFilename: 'Sample-Scene.tif' },
      userId: user ? { name: user.name, email: user.email } : null,
    };
  },

  async getJobsByUserId(userId) {
    if (getIsConnected()) {
      return await ProcessingJob.find({ userId }).sort({ createdAt: -1 }).populate('imageId');
    }
    return mem.jobs
      .filter((j) => String(j.userId) === String(userId))
      .map((job) => {
        const img = mem.images.find((i) => String(i._id) === String(job.imageId));
        return { ...job, imageId: img || { originalFilename: 'Sample-Scene.tif' } };
      });
  },

  async getAllJobs() {
    if (getIsConnected()) {
      return await ProcessingJob.find().sort({ createdAt: -1 }).populate('imageId').populate('userId', 'name email');
    }
    return mem.jobs.map((job) => {
      const img = mem.images.find((i) => String(i._id) === String(job.imageId));
      const user = mem.users.find((u) => String(u._id) === String(job.userId));
      return {
        ...job,
        imageId: img || { originalFilename: 'Sample-Scene.tif' },
        userId: user ? { name: user.name, email: user.email } : null,
      };
    });
  },

  async updateJob(id, updates) {
    if (getIsConnected()) {
      return await ProcessingJob.findByIdAndUpdate(id, updates, { new: true });
    }
    const job = mem.jobs.find((j) => String(j._id) === String(id));
    if (!job) return null;
    Object.assign(job, updates);
    return job;
  },

  async getJobCounts() {
    if (getIsConnected()) {
      const total = await ProcessingJob.countDocuments();
      const completed = await ProcessingJob.countDocuments({ status: 'completed' });
      const failed = await ProcessingJob.countDocuments({ status: 'failed' });
      const pending = await ProcessingJob.countDocuments({ status: { $in: ['pending', 'processing'] } });
      return { total, completed, failed, pending };
    }
    const total = mem.jobs.length;
    const completed = mem.jobs.filter((j) => j.status === 'completed').length;
    const failed = mem.jobs.filter((j) => j.status === 'failed').length;
    const pending = mem.jobs.filter((j) => ['pending', 'processing'].includes(j.status)).length;
    return { total, completed, failed, pending };
  },

  // Validation Reports
  async createValidationReport(data) {
    if (getIsConnected()) {
      const report = new ValidationReport(data);
      return await report.save();
    }
    const newReport = {
      _id: generateId(),
      ...data,
      createdAt: new Date(),
    };
    mem.reports.push(newReport);
    return newReport;
  },

  async findValidationReportByJobId(jobId) {
    if (getIsConnected()) {
      return await ValidationReport.findOne({ jobId });
    }
    return mem.reports.find((r) => String(r.jobId) === String(jobId)) || null;
  },
};
