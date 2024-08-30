import { addExtremesIfNeeded } from '../helpers/extremesHelpers';

class BSpline {
  constructor(points, degree, copy) {
    if (copy) {
      this.points = [];
      for (let i = 0; i < points.length; i++) {
        this.points.push(points[i]);
      }
    } else {
      this.points = points;
    }
    this.degree = degree;
    this.dimension = points[0].length;
    if (degree === 2) {
      this.baseFunc = this.basisDeg2;
      this.baseFuncRangeInt = 2;
    } else if (degree === 3) {
      this.baseFunc = this.basisDeg3;
      this.baseFuncRangeInt = 2;
    } else if (degree === 4) {
      this.baseFunc = this.basisDeg4;
      this.baseFuncRangeInt = 3;
    } else if (degree === 5) {
      this.baseFunc = this.basisDeg5;
      this.baseFuncRangeInt = 3;
    }
  }

  seqAt(dim) {
    let points = this.points;
    let margin = this.degree + 1;
    return function (n) {
      if (n < margin) {
        return points[0][dim];
      } else if (points.length + margin <= n) {
        return points[points.length - 1][dim];
      } else {
        return points[n - margin][dim];
      }
    };
  }

  basisDeg2(x) {
    if (-0.5 <= x && x < 0.5) {
      return 0.75 - x * x;
    } else if (0.5 <= x && x <= 1.5) {
      return 1.125 + (-1.5 + x / 2.0) * x;
    } else if (-1.5 <= x && x < -0.5) {
      return 1.125 + (1.5 + x / 2.0) * x;
    } else {
      return 0;
    }
  }

  basisDeg3(x) {
    if (-1 <= x && x < 0) {
      return 2.0 / 3.0 + (-1.0 - x / 2.0) * x * x;
    } else if (1 <= x && x <= 2) {
      return 4.0 / 3.0 + x * (-2.0 + (1.0 - x / 6.0) * x);
    } else if (-2 <= x && x < -1) {
      return 4.0 / 3.0 + x * (2.0 + (1.0 + x / 6.0) * x);
    } else if (0 <= x && x < 1) {
      return 2.0 / 3.0 + (-1.0 + x / 2.0) * x * x;
    } else {
      return 0;
    }
  }

  basisDeg4(x) {
    if (-1.5 <= x && x < -0.5) {
      return 55.0 / 96.0 + x * (-(5.0 / 24.0) + x * (-(5.0 / 4.0) + (-(5.0 / 6.0) - x / 6.0) * x));
    } else if (0.5 <= x && x < 1.5) {
      return 55.0 / 96.0 + x * (5.0 / 24.0 + x * (-(5.0 / 4.0) + (5.0 / 6.0 - x / 6.0) * x));
    } else if (1.5 <= x && x <= 2.5) {
      return 625.0 / 384.0 + x * (-(125.0 / 48.0) + x * (25.0 / 16.0 + (-(5.0 / 12.0) + x / 24.0) * x));
    } else if (-2.5 <= x && x <= -1.5) {
      return 625.0 / 384.0 + x * (125.0 / 48.0 + x * (25.0 / 16.0 + (5.0 / 12.0 + x / 24.0) * x));
    } else if (-1.5 <= x && x < 1.5) {
      return 115.0 / 192.0 + x * x * (-(5.0 / 8.0) + (x * x) / 4.0);
    } else {
      return 0;
    }
  }

  getInterpol(seq, t) {
    let f = this.baseFunc;
    let rangeInt = this.baseFuncRangeInt;
    let tInt = Math.floor(t);
    let result = 0;
    for (let i = tInt - rangeInt; i <= tInt + rangeInt; i++) {
      result += seq(i) * f(t - i);
    }
    return result;
  }

  basisDeg5(x) {
    if (-2 <= x && x < -1) {
      return 17.0 / 40.0 + x * (-(5.0 / 8.0) + x * (-(7.0 / 4.0) + x * (-(5.0 / 4.0) + (-(3.0 / 8.0) - x / 24.0) * x)));
    } else if (0 <= x && x < 1) {
      return 11.0 / 20.0 + x * x * (-(1.0 / 2.0) + (1.0 / 4.0 - x / 12.0) * x * x);
    } else if (2 <= x && x <= 3) {
      return 81.0 / 40.0 + x * (-(27.0 / 8.0) + x * (9.0 / 4.0 + x * (-(3.0 / 4.0) + (1.0 / 8.0 - x / 120.0) * x)));
    } else if (-3 <= x && x < -2) {
      return 81.0 / 40.0 + x * (27.0 / 8.0 + x * (9.0 / 4.0 + x * (3.0 / 4.0 + (1.0 / 8.0 + x / 120.0) * x)));
    } else if (1 <= x && x < 2) {
      return 17.0 / 40.0 + x * (5.0 / 8.0 + x * (-(7.0 / 4.0) + x * (5.0 / 4.0 + (-(3.0 / 8.0) + x / 24.0) * x)));
    } else if (-1 <= x && x < 0) {
      return 11.0 / 20.0 + x * x * (-(1.0 / 2.0) + (1.0 / 4.0 + x / 12.0) * x * x);
    } else {
      return 0;
    }
  }

  calcAt(t) {
    t = t * ((this.degree + 1) * 2 + this.points.length); //t must be in [0,1]
    if (this.dimension === 2) {
      return [this.getInterpol(this.seqAt(0), t), this.getInterpol(this.seqAt(1), t)];
    } else if (this.dimension === 3) {
      return [this.getInterpol(this.seqAt(0), t), this.getInterpol(this.seqAt(1), t), this.getInterpol(this.seqAt(2), t)];
    } else {
      let res = [];
      for (let i = 0; i < this.dimension; i++) {
        res.push(this.getInterpol(this.seqAt(i), t));
      }
      return res;
    }
  }
}

export default function bSplineInterpolation({ data, degree = 3, range, includeExtremes = false, removePointsSurroundingExtremes = true }) {
  if (!data || data.length === 0) {
    return () => [];
  }
  const parsed = data.map(({ x, y }) => [x, y]);
  const spline = new BSpline(parsed, degree, true);

  const res = [];
  for (let i = 0; i < range; i++) {
    res.push(spline.calcAt(i / (range - 1)));
  }
  return addExtremesIfNeeded(
    res.map(([x, y]) => ({ x, y })),
    data,
    includeExtremes,
    removePointsSurroundingExtremes
  );
}
