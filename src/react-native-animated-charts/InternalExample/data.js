import { default as bSpline } from '../interpolations/bSplineInterpolation';
import { monotoneCubicInterpolation2 } from '../interpolations/monotoneCubicInterpolation';
import { data1 as rawData1, data2 as rawData2 } from './rawData';

export function simplifyData(data, pickRange = 10) {
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

  return data.filter((_, i) => i % pickRange === 0 || i === min || i === max);
}

export const data1 = rawData1.map(([x, y]) => ({ x, y }));
export const data2 = rawData2.map(([x, y]) => ({ x, y }));
export const softData2 = data2.filter((_, i) => i % 7 === 0);
export const splineSoftData = bSpline(simplifyData(data2))(80);
export const softData = monotoneCubicInterpolation2(simplifyData(data1))(80);
export const softData1b = bSpline(simplifyData(data1))(80);
