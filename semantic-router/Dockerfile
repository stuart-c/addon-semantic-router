ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest

# Stage 1: Build dependencies
FROM $BUILD_FROM AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    libffi-dev \
    python3-dev

WORKDIR /build

# Set up virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Final image
FROM $BUILD_FROM

# Set environment variables
ENV LANG=C.UTF-8 \
    PYTHONPATH="/app" \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Install Python 3
RUN apk add --no-cache python3

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code
COPY backend/ /app/backend/

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
