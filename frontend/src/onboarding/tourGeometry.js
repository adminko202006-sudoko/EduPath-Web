export function visibleTarget(id, root = document) {
  return Array.from(root.querySelectorAll(`[data-tutorial-target="${id}"]`)).find((node) => {
    const rect = node.getBoundingClientRect();
    return node.getClientRects().length > 0 && rect.width > 0 && rect.height > 0 && getComputedStyle(node).visibility !== 'hidden';
  }) || null;
}

export function spotlightRect(rect, width, height) {
  if (!rect) return null;
  const left = Math.max(0, rect.left - 6);
  const top = Math.max(0, rect.top - 6);
  const right = Math.min(width, rect.right + 6);
  const bottom = Math.min(height, rect.bottom + 6);
  if (right <= left || bottom <= top) return null;
  return { left, top, width: right - left, height: bottom - top, right, bottom };
}

export function panelPosition(target, width, height, panelWidth, panelHeight) {
  const gap = 16;
  const xMax = Math.max(gap, width - panelWidth - gap);
  const yMax = Math.max(gap, height - panelHeight - gap);
  if (!target) return { left: Math.min(xMax, Math.max(gap, (width - panelWidth) / 2)), top: Math.min(yMax, Math.max(gap, (height - panelHeight) / 2)), width: panelWidth };
  const candidates = [
    { left: xMax, top: yMax }, { left: xMax, top: gap },
    { left: gap, top: yMax }, { left: gap, top: gap },
  ];
  const overlap = (p) => Math.max(0, Math.min(p.left + panelWidth, target.right + gap) - Math.max(p.left, target.left - gap)) * Math.max(0, Math.min(p.top + panelHeight, target.bottom + gap) - Math.max(p.top, target.top - gap));
  candidates.sort((a, b) => overlap(a) - overlap(b));
  return { ...candidates[0], width: panelWidth, overlaps: overlap(candidates[0]) > 0 };
}
