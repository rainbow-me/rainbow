import {data1 as rawData1, data2 as rawData2} from './rawData';

export const data1 = rawData1.map(([x, y]) => ({x, y}));
export const data2 = rawData2.map(([x, y]) => ({x, y}));
