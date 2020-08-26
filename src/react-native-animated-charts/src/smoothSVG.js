const controlPoint = (current, previous, next, reverse, smoothing) => {
  'worklet';
  // When 'current' is the first or last point of the array
  // 'previous' or 'next' don't exist.
  // Replace with 'current'

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

export const svgBezierPath = (points, smoothing, strategy = 'complex') => {
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
      if (strategy === 'simple')
        return `${acc} Q ${(cpsX + cpeX) / 2},${(cpsY + cpeY) / 2} ${
          point[0]
        },${point[1]}`;
      else {
        return `${acc} C ${cpsX},${cpsY} ${cpeX},${cpeY} ${point[0]},${point[1]}`;
      }
    }
  }, '');
};
