ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:3.19
 
# Stage 1: Build dependencies
FROM $BUILD_FROM AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    libffi-dev \
    python3-dev \
    libstdc++

WORKDIR /build

# Create virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir \
        --index-url https://wheels.home-assistant.io/musllinux-index/ \
        --extra-index-url https://pypi.org/simple \
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
RUN apk add --no-cache python3 libstdc++

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
