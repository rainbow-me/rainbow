const controlPoint = (current, previous, next, reverse, smoothing) => {
  'worklet';
  const p = previous || current;
  const n = next || current;
  // Properties of the opposed-line
  const lengthX = n[0] - p[0];
  const lengthY = n[1] - p[1];
  const o = {
    angle: Math.atan2(lengthY, lengthX),
    length: Math.sqrt(Math.pow(lengthX, 2) + Math.pow(lengthY, 2)),
  };
  // If is end-control-point, add PI to the angle to go backward
  const angle = o.angle + (reverse ? Math.PI : 0);
  const length = o.length * smoothing;
  // The control point position is relative to the current point
  const x = current[0] + Math.cos(angle) * length;
  const y = current[1] + Math.sin(angle) * length;
  return [x, y];
};

export const svgBezierPath = (points, smoothing, strategy) => {
  'worklet';
  const traversed = points.map(p => [p.x, p.y]);
  // build the d attributes by looping over the points
  return traversed.reduce((acc, point, i, a) => {
    if (i === 0) {
      return `M ${point[0]},${point[1]}`;
    } else {
      const cps = controlPoint(a[i - 1], a[i - 2], point, false, smoothing);
      const cpsX = cps[0];
      const cpsY = cps[1];

      const cpe = controlPoint(point, a[i - 1], a[i + 1], true, smoothing);
      const cpeX = cpe[0];
      const cpeY = cpe[1];
      if (strategy === 'simple') {
        return `${acc} Q ${(cpsX + cpeX) / 2},${(cpsY + cpeY) / 2} ${point[0]},${point[1]}`;
      } else if (strategy === 'complex') {
        return `${acc} C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`;
      } else if (strategy === 'bezier') {
        const p0 = a[i - 2] || a[i - 1];
        const x0 = p0[0];
        const y0 = p0[1];
        const p1 = a[i - 1];
        const x1 = p1[0];
        const y1 = p1[1];
        const x = point[0];
        const y = point[1];
        const cp1x = (2 * x0 + x1) / 3;
        const cp1y = (2 * y0 + y1) / 3;
        const cp2x = (x0 + 2 * x1) / 3;
        const cp2y = (y0 + 2 * y1) / 3;
        const cp3x = (x0 + 4 * x1 + x) / 6;
        const cp3y = (y0 + 4 * y1 + y) / 6;
        if (i === a.length - 1) {
          return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${cp3x},${cp3y} C${x},${y} ${x},${y} ${x},${y}`;
        }
        return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${cp3x},${cp3y}`;
      }
      return null;
    }
  }, '');
};
