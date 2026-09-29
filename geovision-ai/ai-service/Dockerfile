FROM python:3.12-slim

WORKDIR /app

# Install system dependencies for image and matrix processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run training to produce checkpoints if missing
RUN python train_srm.py --epochs 1 --batch-size 8 --scale 4 --output checkpoints/srmnet_x4.pth || true

EXPOSE 8000

ENV PORT=8000
ENV PYTHONUNBUFFERED=1

CMD ["python", "main.py"]
