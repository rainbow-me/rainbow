LOG_FILE="e2e-artifacts/metro.log"
MAX_RETRIES=15
SLEEP_INTERVAL=2

start_metro() {
  local platform="$1"

  mkdir -p "$(dirname "$LOG_FILE")"
  echo "🟢 Starting Metro bundler for platform: $platform..."
  yarn start > "$LOG_FILE" 2>&1 &
  METRO_PID=$!

  echo "⏳ Waiting for Metro to be ready..."

  for ((i = 1; i <= MAX_RETRIES; i++)); do
    if curl -s http://localhost:8081/status | grep -q "packager-status:running"; then
      echo "🚀 Bundle build triggered."
      curl -s "http://localhost:8081/index.bundle?platform=$platform&dev=true" > /dev/null || true
      return 0
    fi
    sleep "$SLEEP_INTERVAL"
  done

  echo "❌ Metro did not become ready in time."
  return 1
}

stop_metro() {
  if [[ -n "${METRO_PID:-}" ]]; then
    echo "🛑 Stopping Metro bundler (PID: $METRO_PID)"
    kill "$METRO_PID" 2>/dev/null || true
  fi
}

trap stop_metro EXIT INT TERM
