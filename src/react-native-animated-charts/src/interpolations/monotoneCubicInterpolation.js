/* eslint-disable no-multi-assign */
import { addExtremesIfNeeded } from '../helpers/extremesHelpers';

export default function monotoneCubicInterpolation({ data, range, includeExtremes = false, removePointsSurroundingExtremes = true }) {
  if (!data || data.length === 0) {
    return () => [];
  }
  const { x, y } = data.reduce(
    (acc, curr) => {
      acc.x.push(curr.x);
      acc.y.push(curr.y);
      return acc;
    },
    {
      x: [],
      y: [],
    }
  );
  let alpha, beta, delta, dist, i, m, n, tau, toFix, idx, jdx, len, len2, ref, ref2, ref3, ref4;

  n = x.length;
  delta = [];
  m = [];
  alpha = [];
  beta = [];
  dist = [];
  tau = [];

  for (i = 0, ref = n - 1; ref >= 0 ? i < ref : i > ref; ref >= 0 ? (i += 1) : (i -= 1)) {
    delta[i] = (y[i + 1] - y[i]) / (x[i + 1] - x[i]);
    if (i > 0) {
      m[i] = (delta[i - 1] + delta[i]) / 2;
    }
  }

  m[0] = delta[0];
  m[n - 1] = delta[n - 2];
  toFix = [];

  for (i = 0, ref2 = n - 1; ref2 >= 0 ? i < ref2 : i > ref2; ref2 >= 0 ? (i += 1) : (i -= 1)) {
    if (delta[i] === 0) {
      toFix.push(i);
    }
  }

  for (idx = 0, len = toFix.length; idx < len; idx++) {
    i = toFix[idx];
    m[i] = m[i + 1] = 0;
  }

  for (i = 0, ref3 = n - 1; ref3 >= 0 ? i < ref3 : i > ref3; ref3 >= 0 ? (i += 1) : (i -= 1)) {
    alpha[i] = m[i] / delta[i];
    beta[i] = m[i + 1] / delta[i];
    dist[i] = Math.pow(alpha[i], 2) + Math.pow(beta[i], 2);
    tau[i] = 3 / Math.sqrt(dist[i]);
  }

  toFix = [];

  for (i = 0, ref4 = n - 1; ref4 >= 0 ? i < ref4 : i > ref4; ref4 >= 0 ? (i += 1) : (i -= 1)) {
    if (dist[i] > 9) {
      toFix.push(i);
    }
  }

  for (jdx = 0, len2 = toFix.length; jdx < len2; jdx++) {
    i = toFix[jdx];
    m[i] = tau[i] * alpha[i] * delta[i];
    m[i + 1] = tau[i] * beta[i] * delta[i];
  }

  const _x = x.slice(0, n);
  const _y = y.slice(0, n);
  const _m = m;

  const firstValue = _x[0];
  const lastValue = _x[_x.length - 1];
  const res = [];
  for (let j = 0; j < range; j++) {
    const interpolatedValue = firstValue + (lastValue - firstValue) * (j / (range - 1));

    let h, h00, h01, h10, h11, i, t, t2, t3, y, _ref;

    for (i = _ref = _x.length - 2; _ref <= 0 ? i <= 0 : i >= 0; _ref <= 0 ? (i += 1) : (i -= 1)) {
      if (_x[i] <= interpolatedValue) {
        break;
      }
    }

    h = _x[i + 1] - _x[i];
    t = (interpolatedValue - _x[i]) / h;
    t2 = Math.pow(t, 2);
    t3 = Math.pow(t, 3);
    h00 = 2 * t3 - 3 * t2 + 1;
    h10 = t3 - 2 * t2 + t;
    h01 = -2 * t3 + 3 * t2;
    h11 = t3 - t2;
    y = h00 * _y[i] + h10 * h * _m[i] + h01 * _y[i + 1] + h11 * h * _m[i + 1];

    res.push({ x: interpolatedValue, y });
  }

  return addExtremesIfNeeded(res, data, includeExtremes, removePointsSurroundingExtremes);
}
