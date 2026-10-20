#!/usr/bin/env bash

# Run from this script's folder.
cd "$(dirname "$0")" || exit 1

# Stop both servers when you press Ctrl+C.
trap 'kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null; exit' INT TERM EXIT

echo "Starting Laravel backend..."
(
  cd backend || exit 1
  exec php artisan serve --host=0.0.0.0 --port=8000
) &
BACKEND_PID=$!

echo "Starting React frontend..."
(
  cd frontend || exit 1
  exec npm run dev -- --host 0.0.0.0
) &
FRONTEND_PID=$!

wait
