const path = require('path');
const fs = require('fs');
const store = require('../services/store');

// Creates a realistic 512x512 Sentinel-2 synthetic raster (RGB) in uploads
const createSyntheticSatelliteImage = (filePath) => {
  const width = 512;
  const height = 512;

  // We can write an uncompressed RGB BMP or raw PPM or simple binary PNG
  // Writing a standard PPM header and pixel bytes, then converting or writing valid raw image
  // Even simpler: write a valid uncompressed PPM (P6 format, standard image format loadable by PIL and tifffile)
  const header = `P6\n${width} ${height}\n255\n`;
  const headerBuffer = Buffer.from(header, 'ascii');
  const pixelBuffer = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;

      // Base terrain: agricultural field grids
      const gridX = Math.floor(x / 64);
      const gridY = Math.floor(y / 64);
      const fieldSeed = Math.sin(gridX * 12.9898 + gridY * 78.233) * 43758.5453;
      const fieldType = Math.abs(fieldSeed) % 4;

      let r = 80;
      let g = 120;
      let b = 60;

      // River meandering through the scene
      const riverCenter = 256 + Math.sin(y * 0.02) * 80 + Math.cos(y * 0.005) * 40;
      const distToRiver = Math.abs(x - riverCenter);

      if (distToRiver < 16) {
        // Deep river water reflectance (low reflectance in NIR/visible)
        r = 25;
        g = 55;
        b = 95;
      } else if (distToRiver < 22) {
        // River bank sand / sediment
        r = 180;
        g = 165;
        b = 130;
      } else {
        // Agricultural parcels
        if (fieldType < 1) {
          // Lush dense vegetation (crop fields)
          r = 45 + Math.floor(Math.sin(x * 0.1) * 10);
          g = 150 + Math.floor(Math.cos(y * 0.1) * 15);
          b = 55;
        } else if (fieldType < 2) {
          // Harvested / fallow dry soil
          r = 175 + Math.floor(Math.sin(y * 0.05) * 12);
          g = 145 + Math.floor(Math.cos(x * 0.05) * 10);
          b = 100;
        } else if (fieldType < 3) {
          // Urban settlement / built-up rooftops
          const buildingGrid = (x % 16 < 2 || y % 16 < 2) ? 140 : 190;
          r = buildingGrid;
          g = buildingGrid - 15;
          b = buildingGrid - 20;
        } else {
          // Mixed shrubland / grasslands
          r = 95;
          g = 135;
          b = 75;
        }

        // Road network (high contrast linear features)
        if (Math.abs(x - 128) < 3 || Math.abs(x - 384) < 3 || Math.abs(y - 256) < 3) {
          r = 210;
          g = 210;
          b = 215;
        }
      }

      pixelBuffer[idx] = Math.min(255, Math.max(0, r));
      pixelBuffer[idx + 1] = Math.min(255, Math.max(0, g));
      pixelBuffer[idx + 2] = Math.min(255, Math.max(0, b));
    }
  }

  const fileData = Buffer.concat([headerBuffer, pixelBuffer]);
  fs.writeFileSync(filePath, fileData);
};

const seedDemoScene = async (req, res) => {
  try {
    const uploadsDir = path.resolve(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const filename = `sentinel2_sample_scene_${Date.now()}.ppm`;
    const filePath = path.join(uploadsDir, filename);

    createSyntheticSatelliteImage(filePath);

    const image = await store.createImage({
      ownerId: req.user._id,
      originalFilename: 'S2A_MSIL2A_20260915_T43RER_10m.tif',
      storedFilename: filename,
      filePath: filePath,
      fileFormat: 'TIFF / Sentinel-2 L2A',
      fileSizeBytes: fs.statSync(filePath).size,
      width: 512,
      height: 512,
      bands: 3,
      crs: 'EPSG:32643 (UTM Zone 43N / WGS84)',
      geotransform: [10.0, 0.0, 500000.0, 0.0, -10.0, 3100000.0],
      sourceResolution: 10.0,
      bounds: {
        min_x: 500000.0,
        min_y: 3094880.0,
        max_x: 505120.0,
        max_y: 3100000.0,
        wgs84: {
          min_lon: 74.985,
          min_lat: 27.955,
          max_lon: 75.035,
          max_lat: 28.005,
        },
      },
      isGeoreferenced: true,
      previewUrl: `/api/images/preview/${filename}`,
    });

    return res.status(201).json({
      success: true,
      message: 'Demo Sentinel-2 satellite scene seeded successfully with real geospatial coordinates.',
      image,
    });
  } catch (err) {
    console.error('[Demo Seed Error]', err);
    return res.status(500).json({ success: false, message: 'Failed to seed demo scene.', error: err.message });
  }
};

module.exports = { seedDemoScene };
