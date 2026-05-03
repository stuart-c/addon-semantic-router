#!/usr/bin/with-contenv bashio

export LOG_LEVEL=$(bashio::config 'log_level')
bashio::log.info "Starting Semantic Router with log level: ${LOG_LEVEL}"

# Ensure persistent models directory exists
mkdir -p /data/models
export FASTEMBED_CACHE_PATH="/data/models"

exec python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
