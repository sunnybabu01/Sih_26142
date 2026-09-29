const path = require('path');
const store = require('../services/store');
const aiClient = require('../services/aiClient');

const startProcessing = async (req, res) => {
  try {
    const { imageId, scaleFactor = 4, referenceImageId = null } = req.body;

    if (!imageId) {
      return res.status(400).json({ success: false, message: 'Please specify an imageId to process.' });
    }

    const factor = parseInt(scaleFactor, 10);
    if (![2, 4].includes(factor)) {
      return res.status(400).json({ success: false, message: 'Invalid scale factor. GeoVision AI supports 2x and 4x super-resolution mapping.' });
    }

    const image = await store.findImageById(imageId);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Source satellite image not found.' });
    }

    // Check optional reference image
    let referencePath = null;
    if (referenceImageId) {
      const refImg = await store.findImageById(referenceImageId);
      if (refImg) referencePath = refImg.filePath;
    }

    const sourceRes = image.sourceResolution || 10.0;
    const targetPixelSpacing = parseFloat((sourceRes / factor).toFixed(2));

    // Create job record
    const job = await store.createJob({
      userId: req.user._id,
      imageId: image._id,
      modelName: factor === 4 ? 'SRM-Net 4x (Residual Dense Attention)' : 'SRM-Net 2x (High-Fidelity SRM)',
      modelVersion: '1.4.0',
      scaleFactor: factor,
      targetPixelSpacingEstimate: targetPixelSpacing,
      status: 'processing',
      progress: 10,
      startedAt: new Date(),
    });

    // Run processing asynchronously so HTTP response is returned immediately
    const outputsDir = path.resolve(__dirname, '../../../outputs');

    // Asynchronous background task execution
    (async () => {
      try {
        await store.updateJob(job._id, { progress: 30 });

        // Call AI Service
        const aiResult = await aiClient.superResolve({
          jobId: String(job._id),
          inputPath: image.filePath,
          outputDir: outputsDir,
          scaleFactor: factor,
          referencePath: referencePath,
        });

        await store.updateJob(job._id, { progress: 85 });

        // Save validation report
        if (aiResult.validation) {
          const val = aiResult.validation;
          await store.createValidationReport({
            jobId: job._id,
            referenceAvailable: val.reference_available,
            statusMessage: val.status_message,
            psnr: val.metrics ? val.metrics.psnr_db : null,
            ssim: val.metrics ? val.metrics.ssim : null,
            mae: val.metrics ? val.metrics.mae : null,
            rmse: val.metrics ? val.metrics.rmse : null,
            bandMetrics: val.band_metrics || [],
            geospatialIntegrity: val.geospatial_integrity,
            uncertaintyNotes: val.uncertainty_notes,
          });
        }

        // Complete job
        await store.updateJob(job._id, {
          status: 'completed',
          progress: 100,
          outputPath: aiResult.output.geotiff_path,
          previewPath: aiResult.output.preview_path,
          outputWidth: aiResult.output.output_width,
          outputHeight: aiResult.output.output_height,
          durationSeconds: aiResult.duration_seconds,
          completedAt: new Date(),
        });
        console.log(`[Job Succeeded] Job ${job._id} super-resolution completed.`);
      } catch (procErr) {
        console.error(`[Job Failed] Job ${job._id} error:`, procErr.message);
        await store.updateJob(job._id, {
          status: 'failed',
          progress: 100,
          errorMessage: procErr.message || 'Super-resolution inference failed.',
          completedAt: new Date(),
        });
      }
    })();

    return res.status(202).json({
      success: true,
      message: 'Super-resolution processing job initiated.',
      jobId: job._id,
      targetPixelSpacingEstimate: `${targetPixelSpacing}m`,
      status: 'processing',
    });
  } catch (err) {
    console.error('[Start Processing Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to start processing job.', error: err.message });
  }
};

const getJobs = async (req, res) => {
  try {
    const jobs = await store.getJobsByUserId(req.user._id);
    return res.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve jobs.', error: err.message });
  }
};

const getJobById = async (req, res) => {
  try {
    const job = await store.findJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Processing job not found.' });
    }

    if (String(job.userId?._id || job.userId) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to view this job.' });
    }

    return res.json({ success: true, job });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving job.', error: err.message });
  }
};

const getJobStatus = async (req, res) => {
  try {
    const job = await store.findJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    return res.json({
      success: true,
      status: job.status,
      progress: job.progress,
      errorMessage: job.errorMessage,
      completedAt: job.completedAt,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error checking job status.' });
  }
};

const cancelJob = async (req, res) => {
  try {
    const job = await store.findJobById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel job in status '${job.status}'.` });
    }

    const updated = await store.updateJob(req.params.id, {
      status: 'cancelled',
      errorMessage: 'Cancelled by user request.',
      completedAt: new Date(),
    });

    return res.json({ success: true, message: 'Job cancelled.', job: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to cancel job.' });
  }
};

module.exports = {
  startProcessing,
  getJobs,
  getJobById,
  getJobStatus,
  cancelJob,
};
