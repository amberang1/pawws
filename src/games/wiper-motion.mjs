// Continuous swept rubber coverage, including droplets between rendered frames.
export function wiperAngle(progress) {
  return -Math.PI + .1 + Math.sin(Math.PI * Math.max(0, Math.min(1, progress))) * (Math.PI - .27);
}
export function sweptDrop(drop, pivot, length, previous, current, width) {
  const dx = drop.x - pivot.x, dy = drop.y - pivot.y;
  const radius = Math.hypot(dx, dy), angle = Math.atan2(dy, dx);
  const pad = width / 2 + drop.r;
  const lo = Math.min(previous, current), hi = Math.max(previous, current);
  if (radius >= length * .25 && radius <= length && angle >= lo && angle <= hi) return true;
  // Rounded ends and the blade thickness, at both boundary poses.
  for (const a of [lo, hi]) {
    const along = Math.max(length * .25, Math.min(length, dx * Math.cos(a) + dy * Math.sin(a)));
    if (Math.hypot(dx - Math.cos(a) * along, dy - Math.sin(a) * along) <= pad) return true;
  }
  return false;
}
// Split at the turn so a frame spanning the reversal still clears its full path.
export function sweepAngles(from, to) {
  return from < .5 && to > .5 ? [[wiperAngle(from), wiperAngle(.5)], [wiperAngle(.5), wiperAngle(to)]] : [[wiperAngle(from), wiperAngle(to)]];
}
