#!/usr/bin/with-contenv bashio

export LOG_LEVEL=$(bashio::config 'log_level')
bashio::log.info "Starting Semantic Router with log level: ${LOG_LEVEL}"

exec python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
