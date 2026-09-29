const path = require('path');
const fs = require('fs');
const store = require('../services/store');

const getResult = async (req, res) => {
  try {
    const job = await store.findJobById(req.params.jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Processing job not found.' });
    }

    const validation = await store.findValidationReportByJobId(job._id);

    return res.json({
      success: true,
      job: {
        id: job._id,
        status: job.status,
        modelName: job.modelName,
        modelVersion: job.modelVersion,
        scaleFactor: job.scaleFactor,
        targetPixelSpacingEstimate: job.targetPixelSpacingEstimate,
        durationSeconds: job.durationSeconds,
        outputWidth: job.outputWidth,
        outputHeight: job.outputHeight,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        errorMessage: job.errorMessage,
        sourceImage: job.imageId,
        outputGeoTiffUrl: `/api/results/${job._id}/download?type=geotiff`,
        outputPreviewUrl: `/api/results/preview/${path.basename(job.previewPath || '')}`,
      },
      validation: validation || {
        referenceAvailable: false,
        statusMessage: 'Reference-based validation unavailable. Objective ground-truth metrics require independent high-resolution reference data.',
        metrics: null,
        bandMetrics: [],
        uncertaintyNotes: 'AI-generated fine features are inferred and do not represent direct sensor observations.',
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve result.', error: err.message });
  }
};

const downloadResult = async (req, res) => {
  try {
    const { jobId } = req.params;
    const downloadType = req.query.type || 'geotiff';

    const job = await store.findJobById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ success: false, message: `Output file is not available. Job status: '${job.status}'.` });
    }

    let targetPath = downloadType === 'png' ? job.previewPath : job.outputPath;

    if (!targetPath || !fs.existsSync(targetPath)) {
      return res.status(404).json({ success: false, message: 'Requested output file was not found on server disk.' });
    }

    const filename = path.basename(targetPath);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', downloadType === 'png' ? 'image/png' : 'image/tiff');

    return fs.createReadStream(targetPath).pipe(res);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Download failed.', error: err.message });
  }
};

const getValidationReport = async (req, res) => {
  try {
    const { jobId } = req.params;
    const report = await store.findValidationReportByJobId(jobId);
    if (!report) {
      return res.json({
        success: true,
        report: {
          referenceAvailable: false,
          statusMessage: 'Reference-based validation unavailable.',
          uncertaintyNotes: 'High-resolution ground truth was not provided during this run.',
        },
      });
    }
    return res.json({ success: true, report });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch validation report.' });
  }
};

const serveOutputPreview = (outputsDir) => (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(outputsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Enhanced preview not found.' });
    }

    res.setHeader('Content-Type', 'image/png');
    return fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error streaming output preview.' });
  }
};

module.exports = {
  getResult,
  downloadResult,
  getValidationReport,
  serveOutputPreview,
};
