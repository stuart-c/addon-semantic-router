ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest

# Stage 1: Build dependencies
FROM $BUILD_FROM AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    libffi-dev \
    python3-dev \
    libstdc++ \
    onnxruntime --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community

WORKDIR /build

# Set up virtual environment
RUN python3 -m venv --system-site-packages /opt/venv
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
    PYTHONPATH="/app" \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Install Python 3
RUN apk add --no-cache python3 libstdc++ \
    onnxruntime --repository=http://dl-cdn.alpinelinux.org/alpine/edge/community

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY backend/ /app/backend/
COPY frontend/ /app/frontend/
COPY config.yaml /app/config.yaml

# Copy run script
COPY run.sh /app/run.sh
RUN chmod a+x /app/run.sh

# Home Assistant Add-on labels
LABEL \
    io.hass.name="Semantic Router" \
    io.hass.description="A semantic router for LLM applications" \
    io.hass.arch="amd64|aarch64" \
    io.hass.type="addon"

# Expose the API port
EXPOSE 8000

# Set the command to run the application
CMD ["/app/run.sh"]
