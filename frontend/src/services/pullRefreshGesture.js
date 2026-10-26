export const PULL_THRESHOLD = 72;

export function pullDistance(start, point) {
  const vertical = point.y - start.y;
  if (vertical <= 0 || Math.abs(point.x - start.x) > vertical) return 0;
  return Math.min(110, vertical * 0.5);
}

export function canStartPull({ scrollTop, offsetY, interactive, busy, modalOpen }) {
  return scrollTop <= 0 && offsetY >= 0 && offsetY <= 180 && !interactive && !busy && !modalOpen;
}
