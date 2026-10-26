#!/usr/bin/env bash

# Run from this script's folder.
cd "$(dirname "$0")" || exit 1

# Stop only the processes started by this launcher when you press Ctrl+C.
PIDS=()
cleanup() {
  trap - INT TERM EXIT
  if ((${#PIDS[@]})); then
    kill "${PIDS[@]}" 2>/dev/null || true
    wait "${PIDS[@]}" 2>/dev/null || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "Starting Laravel backend..."
(
  cd backend || exit 1
  exec php artisan serve --host=0.0.0.0 --port=8000
) &
BACKEND_PID=$!
PIDS+=("$BACKEND_PID")

echo "Starting React frontend..."
(
  cd frontend || exit 1
  exec npm run dev -- --host 0.0.0.0
) &
FRONTEND_PID=$!
PIDS+=("$FRONTEND_PID")

echo "Starting Laravel scheduler (mobile push delivery and scheduled notifications)..."
(
  cd backend || exit 1
  exec php artisan schedule:work
) &
PIDS+=("$!")

# A failed server or scheduler must not leave a partly running system behind.
wait -n "${PIDS[@]}"
STATUS=$?
echo "An EduPath process stopped. Shutting down this launcher's remaining processes."
if [ "$STATUS" -eq 0 ]; then STATUS=1; fi
exit "$STATUS"
