# Stage 1: Build dependencies
ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest
FROM python:3.11-alpine AS builder

WORKDIR /build

# Install build dependencies
RUN apk add --no-cache build-base libffi-dev

# Copy requirements and install
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Stage 2: Final image
# Using Home Assistant base image build argument
FROM $BUILD_FROM

# Set environment variables
ENV LANG=C.UTF-8 \
    PYTHONPATH="/app"

WORKDIR /app

# Install Python 3 and basic tools
RUN apk add --no-cache \
    python3 \
    py3-pip

# Copy installed dependencies from the builder stage
COPY --from=builder /install /usr/local

# Copy application code
COPY backend/ /app/backend/

# Home Assistant Add-on labels
LABEL \
    io.hass.name="Semantic Router" \
    io.hass.description="A semantic router for LLM applications" \
    io.hass.arch="amd64|armv7|armhf|aarch64" \
    io.hass.type="addon"

# Expose the API port
EXPOSE 8000

# Set the command to run the application
# We use uvicorn directly. In a more complex setup, we might use an s6 service.
CMD ["python3", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
