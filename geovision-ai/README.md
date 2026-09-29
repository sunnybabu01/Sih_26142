# GeoVision AI &mdash; Satellite Super Resolution Mapping (SRM) Platform

> **Problem Statement:** Deep Learning Based Super Resolution Mapping (SRM) from Medium Resolution Satellite Imageries.  
> **Platform Target:** Enhances **Sentinel-2** 10-meter optical imagery to sub-4m (2.5m nominal pixel spacing) while strictly preserving Coordinate Reference Systems (CRS), affine geotransforms, and spectral consistency.

---

## 🛰️ 1. Project Overview & Architectural Vision

GeoVision AI is an end-to-end, full-stack geospatial artificial intelligence platform designed to tackle the fundamental challenge in Earth Observation: **enhancing spatial resolution from medium-resolution sensors without destroying geospatial alignment or fabricating ground truth.**

While conventional interpolation (bilinear, bicubic) artificially increases pixel density, **GeoVision AI’s SRM-Net (Deep Residual Dense Attention Network with sub-pixel PixelShuffle convolution)** reconstructs high-frequency spatial boundaries (crop parcels, road corridors, waterways, and urban structures) by learning sensor point spread functions (PSF) and land-cover spatial priors.

### 🌟 Core Capabilities
- **Strict Geospatial Preservation:** Automatically updates affine geotransform matrices (`dx/scale`, `dy/scale`) preserving upper-left tiepoints and native projections (e.g., `EPSG:32643` UTM Zone 43N).
- **Overlapping Tile Inference:** Employs sliding window extraction with Hann/cosine window blending to eliminate seam artifacts across large gigabyte satellite rasters.
- **Interactive Multi-Mode Comparator:** Split before/after draggable slider, side-by-side synchronized view, and Leaflet geospatial map overlay with satellite base layers.
- **Scientific Validation & Transparency:** Calculates true **PSNR**, **SSIM**, **MAE**, and **RMSE** strictly when registered high-resolution reference data is provided. When unavailable, it clearly discloses *"Reference-based validation unavailable"* with transparent uncertainty notices.
- **One-Click Demo Evaluator:** Built-in synthetic Sentinel-2 scene generator and demo role switchers for instant evaluation without requiring manual GIS data mounting.

---

## 🏗️ 2. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TypeScript, Tailwind CSS, React Router DOM, Axios, Recharts, Leaflet, React Leaflet, Lucide Icons |
| **Backend** | Node.js, Express.js, RESTful APIs, JWT Authentication, Role-Based Access Control, Multer, Mongoose ODM |
| **AI / Deep Learning** | Python 3.12, PyTorch, Torchvision, NumPy, SciPy, Pillow, Tifffile, FastAPI, Uvicorn |
| **Database** | MongoDB Atlas / Local MongoDB (with resilient in-memory fallback store) |
| **Deployment** | Docker, Docker Compose, Nginx |

---

## 📁 3. Project Structure

```text
geovision-ai/
├── frontend/                     # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/           # ImageComparisonSlider, GeospatialMapViewer, Navbar, Sidebar, QualityMetricsCard
│   │   ├── pages/                # 8 Complete Pages (Landing, Dashboard, Upload, Processing, Compare, Results, History, Admin)
│   │   ├── layouts/              # DashboardLayout
│   │   ├── context/              # AuthContext with token & role management
│   │   ├── services/             # Axios API client with bearer token interception
│   │   ├── App.tsx               # Application routing and route guards
│   │   ├── main.tsx              # React DOM entry point
│   │   └── index.css             # Tailwind v4 and Leaflet dark geospatial styling
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf
│   └── Dockerfile
├── backend/                      # Node.js + Express REST API Server
│   ├── src/
│   │   ├── config/               # MongoDB connection (with resilient offline fallback)
│   │   ├── models/               # User, Image, ProcessingJob, ValidationReport
│   │   ├── controllers/          # Auth, Image, Processing, Results, Admin, Demo
│   │   ├── routes/               # Modular Express API endpoints
│   │   ├── middleware/           # JWT auth and role authorization guards
│   │   ├── services/             # AI service HTTP client and data store
│   │   ├── app.js                # Express app setup, CORS, Helmet, static serving
│   │   └── server.js             # Bootstrap and port listener (Port 5000)
│   ├── package.json
│   └── Dockerfile
├── ai-service/                   # Python 3.12 + PyTorch Deep Learning Microservice
│   ├── models/                   # SRMNet architecture (Residual Dense Blocks + Channel Attention + PixelShuffle)
│   ├── preprocessing/            # GeoTIFF reader, affine parsing, normalization, tile extractor
│   ├── postprocessing/           # Hann window tile stitcher, GeoTIFF exporter, preview PNG generator
│   ├── validation/               # PSNR, SSIM, MAE, RMSE metrics calculator & uncertainty reporter
│   ├── routes/                   # FastAPI endpoints (inspect, super-resolve, validate, models)
│   ├── services/                 # Model caching, device placement (CPU/CUDA), inference orchestration
│   ├── train_srm.py              # Documented paired Sentinel-2 training pipeline with checkpointing
│   ├── requirements.txt          # Python dependencies
│   ├── main.py                   # FastAPI server entry point (Port 8000)
│   └── Dockerfile
├── uploads/                      # Persistent storage for uploaded satellite imagery
├── outputs/                      # Persistent storage for enhanced GeoTIFFs and previews
├── docker-compose.yml            # Multi-container orchestration (MongoDB, AI, Backend, Frontend)
├── .env.example                  # Environment configuration template
└── README.md                     # Comprehensive documentation
```

---

## ⚡ 4. Quick Start (Local Development)

### Prerequisites
- **Node.js** v18+ and **npm**
- **Python** 3.10 to 3.12 (with `venv` support)
- *(Optional)* **MongoDB** local instance or **MongoDB Atlas** connection string

---

### Step 1: AI Deep Learning Service Setup
```bash
cd geovision-ai/ai-service

# Create virtual environment (Python 3.12 recommended)
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install PyTorch and processing dependencies
pip install -r requirements.txt

# (Optional) Verify model training & generate initial weights checkpoint
python train_srm.py --epochs 1 --batch-size 8 --scale 4 --output checkpoints/srmnet_x4.pth

# Start the FastAPI AI Microservice on Port 8000
python main.py
```
*AI service OpenAPI interactive documentation will be accessible at: `http://localhost:8000/docs`.*

---

### Step 2: Backend API Server Setup
Open a new terminal:
```bash
cd geovision-ai/backend

# Install dependencies
npm install

# Start development server with auto-reload (Port 5000)
npm run dev
```
*Backend will output:*
```text
[MongoDB Connected] Host: ... (or resilient memory store active)
GeoVision AI Node.js Backend Server Running on: http://localhost:5000
API Base: http://localhost:5000/api
```

---

### Step 3: Frontend Application Setup
Open a new terminal:
```bash
cd geovision-ai/frontend

# Install dependencies
npm install

# Start Vite dev server on Port 5173
npm run dev
```
*Open your browser at: **`http://localhost:5173`**.*

---

## 🐳 5. Running with Docker Compose

To spin up the entire full-stack cluster (MongoDB, AI Service, Backend, and Frontend) in isolated containers:

```bash
cd geovision-ai
docker-compose up --build
```

- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:5000/api`
- **AI Service:** `http://localhost:8000`
- **MongoDB:** `localhost:27017`

---

## 🔑 6. Default Demo Credentials

For quick evaluation and testing, predefined demo accounts with varying role permissions are ready:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@geovision.ai` | `Admin@12345` | Full system telemetry, user management, queue monitor, model configs |
| **GIS Researcher** | `researcher@geovision.ai` | `Researcher@12345` | Image upload, 4x/2x SRM processing, comparator, GeoTIFF downloads, reports |
| **Standard User** | `user@geovision.ai` | `User@12345` | Upload, processing, interactive comparison |

*Note: The frontend navbar and login page also feature a **"Demo Login"** fast-switcher button to instantly jump into any role with a single click.*

---

## 📡 7. REST API Endpoints Specification

### Authentication
- `POST /api/auth/register` &mdash; Register new user/researcher (`name`, `email`, `password`, `role`).
- `POST /api/auth/login` &mdash; Authenticate and receive JWT bearer token.
- `GET /api/auth/me` &mdash; Retrieve authenticated user profile (Protected).

### Satellite Imagery Management
- `POST /api/images/upload` &mdash; Upload GeoTIFF (`.tif`, `.tiff`), PNG, or JPEG raster with automatic metadata parsing.
- `GET /api/images` &mdash; List images owned by authenticated user.
- `GET /api/images/:id` &mdash; Inspect single image metadata (CRS, dimensions, bands, resolution).
- `DELETE /api/images/:id` &mdash; Remove image from store and filesystem.
- `GET /api/images/preview/:filename` &mdash; Stream web-friendly preview.

### Super-Resolution Processing
- `POST /api/processing/start` &mdash; Initiate SRM job (`imageId`, `scaleFactor: 2 | 4`, optional `referenceImageId`).
- `GET /api/processing/jobs` &mdash; List processing jobs with status.
- `GET /api/processing/jobs/:id` &mdash; Retrieve job details and progress.
- `GET /api/processing/jobs/:id/status` &mdash; Lightweight status polling (`progress`, `status`).
- `POST /api/processing/jobs/:id/cancel` &mdash; Cancel an active job in queue.

### Results & Verification
- `GET /api/results/:jobId` &mdash; Retrieve enhanced output metadata, dimensions, and execution telemetry.
- `GET /api/results/:jobId/download?type=geotiff|png` &mdash; Download 32-bit enhanced GeoTIFF or PNG preview.
- `GET /api/results/:jobId/validation` &mdash; Fetch objective validation report (`PSNR`, `SSIM`, `MAE`, `RMSE`, band breakdown).

### Administrative Management (Role: `admin`)
- `GET /api/admin/dashboard` &mdash; System stats (storage usage, success rate, CPU telemetry, AI status).
- `GET /api/admin/users` &mdash; List registered researchers and users.
- `GET /api/admin/jobs` &mdash; Monitor global processing queue across all users.
- `GET /api/admin/models` &mdash; Inspect supported SRM deep learning model configurations.

### Instant Testing Seeder
- `POST /api/demo/seed` &mdash; Generates a synthetic Sentinel-2 agricultural scene with real UTM coordinates.

---

## 🔬 8. Deep Learning Super-Resolution Pipeline Details

### SRM-Net Architecture
- **Shallow Feature Extraction:** 3x3 convolution mapping input spectral bands (3 RGB or 4 RGB+NIR) to 64 feature dimensions.
- **Deep Feature Extraction:** Stack of **Residual Groups**, each containing **Residual Dense Blocks (RDB)** with multi-level feature reuse and **Squeeze-and-Excitation Channel Attention** to maintain spectral band relationships.
- **Sub-Pixel Upsampling:** PixelShuffle layers mapping learned feature maps directly to target spatial dimensions without bicubic artifacts.
- **Skip Connection:** Residual learning on top of base bicubic upsample ensuring training stability and preservation of low-frequency reflectance.

### Tile-Based Overlap Processing
To handle high-resolution satellite scenes with limited VRAM/RAM:
1. Scenes are subdivided into $128 \times 128$ pixel patches with a 32-pixel overlap margin.
2. Each patch is processed through PyTorch `SRMNet(x)`.
3. Patches are stitched back using a 2D **Hann/Cosine window**:
   $$W(y, x) = \sin^2\left(\frac{\pi y}{H}\right) \cdot \sin^2\left(\frac{\pi x}{W}\right)$$
   This guarantees zero visible seam boundaries in the enhanced output.

### Geospatial Transform Scaling
When an affine transform matrix is defined as:
$$\begin{bmatrix} X_{geo} \\ Y_{geo} \end{bmatrix} = \begin{bmatrix} dx & 0 & X_0 \\ 0 & dy & Y_0 \end{bmatrix} \begin{bmatrix} x_{pix} \\ y_{pix} \\ 1 \end{bmatrix}$$
For a $4\times$ scale enhancement:
- Upper-left origin $(X_0, Y_0)$ is maintained exactly.
- New pixel spacing: $dx_{new} = \frac{dx}{4}$, $dy_{new} = \frac{dy}{4}$.
- ModelTiepointTag and ModelPixelScaleTag are written to the resulting GeoTIFF.

---

## ⚖️ 9. Scientific Validation & Uncertainty Reporting

> **Crucial Remote Sensing Reality:** Sentinel-2 sensor hardware operates at a native ground sampling distance (GSD) of **10 meters** for visible bands. A deep learning model targeting $<4\text{m}$ (e.g. 2.5m) spatial detail produces **inferred spatial reconstructions** based on statistical priors learned during training.

- **Ground Truth Requirement:** Objective mathematical fidelity (PSNR, SSIM, MAE, RMSE) requires paired, geographically aligned high-resolution reference data (e.g., PlanetScope 3m, SPOT 6/7 1.5m, or Pleiades 0.5m).
- **Zero Fabrication Guarantee:** If no reference image is supplied during an enhancement run, GeoVision AI explicitly marks the report as **`reference_available: false`** and states:
  > *"Reference-based validation unavailable. Objective ground-truth metrics require independent high-resolution reference data."*
- **Visual Warning Banner:** All comparison screens and reports feature an advisory warning clarifying that reconstructed boundaries are model inferences and do not represent direct physical sensor observations.

---

## 📜 10. License & Credits

Developed for the **AI-Based Satellite Image Super Resolution Mapping (SRM)** initiative.  
Engineered with React, PyTorch, Node.js, and Leaflet.
