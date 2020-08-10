import { default as bSpline } from './bSpline';
import { data1 as rawData1, data2 as rawData2 } from './rawData';

function monothonicSpline(x, y) {
  let alpha,
    beta,
    delta,
    dist,
    i,
    m,
    n,
    tau,
    toFix,
    idx,
    jdx,
    len,
    len2,
    ref,
    ref2,
    ref3,
    ref4;

  n = x.length;
  delta = [];
  m = [];
  alpha = [];
  beta = [];
  dist = [];
  tau = [];

  for (
    i = 0, ref = n - 1;
    ref >= 0 ? i < ref : i > ref;
    ref >= 0 ? (i += 1) : (i -= 1)
  ) {
    delta[i] = (y[i + 1] - y[i]) / (x[i + 1] - x[i]);
    if (i > 0) {
      m[i] = (delta[i - 1] + delta[i]) / 2;
    }
  }

  m[0] = delta[0];
  m[n - 1] = delta[n - 2];
  toFix = [];

  for (
    i = 0, ref2 = n - 1;
    ref2 >= 0 ? i < ref2 : i > ref2;
    ref2 >= 0 ? (i += 1) : (i -= 1)
  ) {
    if (delta[i] === 0) {
      toFix.push(i);
    }
  }

  for (idx = 0, len = toFix.length; idx < len; idx++) {
    i = toFix[idx];
    m[i] = m[i + 1] = 0;
  }

  for (
    i = 0, ref3 = n - 1;
    ref3 >= 0 ? i < ref3 : i > ref3;
    ref3 >= 0 ? (i += 1) : (i -= 1)
  ) {
    alpha[i] = m[i] / delta[i];
    beta[i] = m[i + 1] / delta[i];
    dist[i] = Math.pow(alpha[i], 2) + Math.pow(beta[i], 2);
    tau[i] = 3 / Math.sqrt(dist[i]);
  }

  toFix = [];

  for (
    i = 0, ref4 = n - 1;
    ref4 >= 0 ? i < ref4 : i > ref4;
    ref4 >= 0 ? (i += 1) : (i -= 1)
  ) {
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

  return interpolatedValue => {
    let h, h00, h01, h10, h11, i, t, t2, t3, y, _ref;

    for (
      i = _ref = _x.length - 2;
      _ref <= 0 ? i <= 0 : i >= 0;
      _ref <= 0 ? (i += 1) : (i -= 1)
    ) {
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

    return y;
  };
}
export function simplifyData(data, throttle = 1, pickRange = 10) {
  let min = 0;
  let max = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[min].y > data[i].y) {
      min = i;
    }

    if (data[max].y < data[i].y) {
      max = i;
    }
  }

  const denseDataParsed = data.filter(
    (_, i) => i % pickRange === 0 || i === min || i === max
  );

  const { denseX, denseY } = denseDataParsed.reduce(
    (acc, curr) => {
      acc.denseX.push(curr.x);
      acc.denseY.push(curr.y);
      return acc;
    },
    {
      denseX: [],
      denseY: [],
    }
  );

  const softData = [];
  const interpolate = monothonicSpline(denseX, denseY);
  for (let i = 0; i < data.length; i++) {
    if (i % throttle !== 0) {
      continue;
    }
    const d = data[i];
    softData.push({ x: d.x, y: interpolate(d.x) });
  }
  return softData;
}

export const data1 = rawData1.map(([x, y]) => ({ x, y }));
export const data2 = rawData2.map(([x, y]) => ({ x, y }));
export const softData = simplifyData(data1);
export const softData2 = data2.filter((_, i) => i % 7 === 0);
export const splineSoftData = bSpline(data2.filter((_, i) => i % 7 === 0))(80);
