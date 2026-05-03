ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base-debian:bookworm
 
# Stage 1: Build dependencies
FROM $BUILD_FROM AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    python3-dev \
    build-essential \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Create virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir \
        -r requirements.txt

# Stage 2: Final image
FROM $BUILD_FROM

# Set environment variables
ENV LANG=C.UTF-8 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Install Python 3 and runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY . .

# Ensure run.sh is executable
RUN chmod a+x run.sh

# Expose port
EXPOSE 8000

# Start application
CMD [ "./run.sh" ]
