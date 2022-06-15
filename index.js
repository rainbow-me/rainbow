/* eslint-disable no-unused-vars */
/* eslint-disable import/no-commonjs */

/*
It needs to be an import statement because otherwise it doesn't load properly
likely because of typescript.
*/
import analytics from '@segment/analytics-react-native';
import {
  concat as _concat,
  constant as _constant,
  filter as _filter,
  forEach as _forEach,
  map as _map,
  mapValues as _mapValues,
  omit as _omit,
  omitBy as _omitBy,
  pick as _pick,
  pickBy as _pickBy,
  reduce as _reduce,
  times as _times,
} from 'lodash';
import { StartTime } from './src/performance/start-time';
import { PerformanceTracking } from './src/performance/tracking';
import { PerformanceMetrics } from './src/performance/tracking/types/PerformanceMetrics';
import {
  addValue,
  addValueDestructuring,
  arr,
  forLikeMap,
  forLoop,
  forLoopReduce,
  forLoopReduceObj,
  forLoopReduceObjSpread,
  forOfArr,
  forOfLikeMap,
  forOfLikeReduce,
  forOfLikeReduceObj,
  forOfLikeReduceObjSpread,
  isIdEven,
  largeObj,
  omitBy,
  omitForEach,
  omitForIn,
  omitForInWithSet,
  omitReduce,
  pathsArr,
  payloadForLoop,
  pickBy,
  pickFlattenFromEntries,
  pickFlattenKeys,
  pickFlattenReduce,
  smallArr,
  smallObj,
  times,
} from '@rainbow-me/helpers/utilitiesTest';
import {
  measureEventEnd,
  measureEventStart,
} from '@rainbow-me/performance/utils';

analytics.track('Started executing JavaScript bundle');
PerformanceTracking.logDirectly(
  PerformanceMetrics.loadJSBundle,
  Date.now() - StartTime.START_TIME
);
PerformanceTracking.startMeasuring(PerformanceMetrics.loadJSBundle);
PerformanceTracking.startMeasuring(PerformanceMetrics.timeToInteractive);

/*
We need to use require calls in order to stop babel from moving imports
to the top of the file above all other calls. We want Performance tracking
to start before all of the imports.
 */
require('react-native-gesture-handler');
require('./shim');
require('./src/model/config');

require('./src/App');

function getAvgRunTime(func, rep) {
  let totalTime = 0;
  let tempRep = rep;
  while (tempRep--) {
    const startTime = Date.now();
    func();
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    totalTime += timeTaken;
  }
  return totalTime / rep;
}

export default function measurement() {
  measureEventStart('1: map lodash');
  getAvgRunTime(() => _map(arr, addValue), 10000);
  measureEventEnd('1: map lodash');

  measureEventStart('1: array.map');
  getAvgRunTime(() => arr.map(addValue), 10000);
  measureEventEnd('1: array.map');

  measureEventStart('1: array.map with destructuring');
  getAvgRunTime(() => arr.map(addValueDestructuring), 10000);
  measureEventEnd('1: array.map with destructuring');

  measureEventStart('1:for..of');
  getAvgRunTime(() => forOfLikeMap(arr, addValue), 10000);
  measureEventEnd('1:for..of');

  measureEventStart('1: for loop');
  getAvgRunTime(() => forLikeMap(arr, addValue), 10000);
  measureEventEnd('1: for loop');

  //----------------------------------------------------------------
  measureEventStart('2: forEch lodash');
  getAvgRunTime(() => _forEach(arr, payloadForLoop), 10000);
  measureEventEnd('2: forEch lodash');

  measureEventStart('2: arr.forEch');
  getAvgRunTime(() => arr.forEach(payloadForLoop), 10000);
  measureEventEnd('2: arr.forEch');

  measureEventStart('2: for..of arr');
  getAvgRunTime(() => forOfArr(arr), 10000);
  measureEventEnd('2: for..of arr');

  measureEventStart('2: for loop');
  getAvgRunTime(() => forLoop(arr), 10000);
  measureEventEnd('2: for loop');
  //----------------------------------------------------------------
  measureEventStart('3: reduce lodash');
  getAvgRunTime(
    () =>
      _reduce(
        arr,
        (acc, { a, b }) => {
          acc += a + b;
          return acc;
        },
        0
      ),
    10000
  );
  measureEventEnd('3: reduce lodash');

  measureEventStart('3: arr.reduce');
  getAvgRunTime(
    () =>
      arr.reduce((acc, { a, b }) => {
        acc += a + b;
        return acc;
      }, 0),
    10000
  );
  measureEventEnd('3: arr.reduce');

  measureEventStart('3: for..of  like a reduce');
  getAvgRunTime(() => forOfLikeReduce(arr), 10000);
  measureEventEnd('3: for..of  like a reduce');

  measureEventStart('3: for loop  like a reduce');
  getAvgRunTime(() => forLoopReduce(arr), 10000);
  measureEventEnd('3: for loop  like a reduce');

  measureEventStart('3.1: reduce lodash');
  getAvgRunTime(
    () =>
      _reduce(
        arr,
        (acc, value) => {
          acc[value.id] = value;
          return acc;
        },
        0
      ),
    10000
  );
  measureEventEnd('3.1: reduce lodash');

  measureEventStart('3.1: arr.reduce');
  getAvgRunTime(
    () =>
      arr.reduce((acc, value) => {
        acc[value.id] = value;
        return acc;
      }, {}),
    10000
  );
  measureEventEnd('3.1: arr.reduce');

  measureEventStart('3.1: for..of  like a reduce');
  getAvgRunTime(() => forOfLikeReduceObj(arr), 10000);
  measureEventEnd('3.1: for..of  like a reduce');

  measureEventStart('3.1: for loop  like a reduce');
  getAvgRunTime(() => forLoopReduceObj(arr), 10000);
  measureEventEnd('3.1: for loop  like a reduce');
  //
  measureEventStart('3.1: reduce lodash with spread');
  getAvgRunTime(
    () =>
      _reduce(
        arr,
        (acc, value) => {
          acc[value.id] = { ...value, newField: value.a + value.b };
          return acc;
        },
        {}
      ),
    10000
  );
  measureEventEnd('3.1: reduce lodash with spread');

  measureEventStart('3.1: arr.reduce with spread');
  getAvgRunTime(
    () =>
      arr.reduce((acc, value) => {
        acc[value.id] = { ...value, newField: value.a + value.b };
        return acc;
      }, {}),
    10000
  );
  measureEventEnd('3.1: arr.reduce with spread');

  measureEventStart('3.1: for..of  like a reduce with spread');
  getAvgRunTime(() => forOfLikeReduceObjSpread(arr), 10000);
  measureEventEnd('3.1: for..of  like a reduce with spread');

  measureEventStart('3.1: for loop  like a reduce with spread');
  getAvgRunTime(() => forLoopReduceObjSpread(arr), 10000);
  measureEventEnd('3.1: for loop  like a reduce with spread');

  //
  measureEventStart('3.1: arr.reduce with spread');
  getAvgRunTime(
    () =>
      arr.reduce((acc, value) => {
        acc[value.id] = { ...value };
        return acc;
      }, {}),
    10000
  );
  measureEventEnd('3.1: arr.reduce with spread');
  measureEventStart('3.1: arr.reduce without spread');
  getAvgRunTime(
    () =>
      arr.reduce((acc, value) => {
        acc[value.id] = value;
        return acc;
      }, {}),
    10000
  );
  measureEventEnd('3.1: arr.reduce without spread');
  //----------------------------------------------------------------
  measureEventStart('4: pick lodash');
  getAvgRunTime(() => _pick(largeObj, pathsArr), 10000);
  measureEventEnd('4: pick lodash');

  measureEventStart('4: pick with reduce paths');
  getAvgRunTime(() => pickFlattenReduce(largeObj, pathsArr), 10000);
  measureEventEnd('4: pick with reduce paths');

  measureEventStart('4: pick with spread');
  getAvgRunTime(() => {
    const {
      eight,
      one,
      seven,
      two,
      five,
      three,
      four,
      six,
      ...rest
    } = largeObj;
  }, 10000);
  measureEventEnd('4: pick with spread');

  measureEventStart('4: pick with keys -> filter -> reduce');
  getAvgRunTime(() => pickFlattenKeys(largeObj, pathsArr), 10000);
  measureEventEnd('4: pick with keys -> filter -> reduce');

  measureEventStart('4: pick with fromEntries -> entries -> filter');
  getAvgRunTime(() => pickFlattenFromEntries(largeObj, pathsArr), 10000);
  measureEventEnd('4: pick with fromEntries -> entries -> filter');
  //----------------------------------------------------------------
  measureEventStart('5: pickBy lodash');
  getAvgRunTime(() => _pickBy(largeObj, isIdEven), 10000);
  measureEventEnd('5: pickBy lodash');

  measureEventStart('5: pickBy reduce');
  getAvgRunTime(() => pickBy(largeObj, isIdEven), 10000);
  measureEventEnd('5: pickBy reduce');
  //----------------------------------------------------------------
  measureEventStart('6: omit lodash');
  getAvgRunTime(() => _omit(largeObj, pathsArr), 10000);
  measureEventEnd('6: omit lodash');

  measureEventStart('6: omit with spread');
  getAvgRunTime(() => {
    const {
      eight,
      one,
      seven,
      two,
      five,
      three,
      four,
      six,
      ...rest
    } = largeObj;
  }, 10000);
  measureEventEnd('6: omit with spread');

  measureEventStart('6: omit forIn');
  getAvgRunTime(() => omitForIn(largeObj, pathsArr), 10000);
  measureEventEnd('6: omit forIn');

  measureEventStart('6: omit forIn with Set');
  getAvgRunTime(() => omitForInWithSet(largeObj, pathsArr), 10000);
  measureEventEnd('6: omit forIn with Set');

  measureEventStart('6: omit reduce');
  getAvgRunTime(() => omitReduce(largeObj, pathsArr), 10000);
  measureEventEnd('6: omit reduce');

  measureEventStart('6: omit forEach');
  getAvgRunTime(() => omitForEach(largeObj, pathsArr), 10000);
  measureEventEnd('6: omit forEach');
  //----------------------------------------------------------------
  measureEventStart('7: omitBy lodash');
  getAvgRunTime(() => _omitBy(largeObj, isIdEven), 10000);
  measureEventEnd('7: omitBy lodash');

  measureEventStart('7: omitBy keys+reduce');
  getAvgRunTime(() => omitBy(largeObj, isIdEven), 10000);
  measureEventEnd('7: omitBy keys+reduce');
  //----------------------------------------------------------------
  measureEventStart('8: mapValues lodash');
  getAvgRunTime(
    () =>
      _mapValues(largeObj, ({ company, id, country }) => ({
        company: company.toLowerCase(),
        country,
        id,
      })),
    10000
  );
  measureEventEnd('8: mapValues lodash');

  measureEventStart('8: mapValues entries + reduce');
  getAvgRunTime(
    () =>
      Object.entries(largeObj).reduce(
        (acc, [key, { company, id, country }]) => {
          acc[key] = {
            company: company.toLowerCase(),
            country,
            id,
          };
          return acc;
        },
        {}
      ),
    10000
  );
  measureEventEnd('8: mapValues entries + reduce');

  measureEventStart('8: mapValues fromEntries + entries + map');
  getAvgRunTime(
    () =>
      Object.fromEntries(
        Object.entries(largeObj).map(([key, { company, id, country }]) => [
          key,
          {
            company: company.toLowerCase(),
            country,
            id,
          },
        ])
      ),
    10000
  );
  measureEventEnd('8: mapValues fromEntries + entries + map');

  measureEventStart('8: mapValues lodash with spread value');
  getAvgRunTime(
    () =>
      _mapValues(largeObj, value => ({
        ...value,
        company: value.company.toLowerCase(),
      })),
    10000
  );
  measureEventEnd('8: mapValues lodash with spread value');

  measureEventStart('8: mapValues entries + reduce with spread value');
  getAvgRunTime(
    () =>
      Object.entries(largeObj).reduce((acc, [key, value]) => {
        acc[key] = {
          ...value,
          company: value.company.toLowerCase(),
        };
        return acc;
      }, {}),
    10000
  );
  measureEventEnd('8: mapValues entries + reduce with spread value');

  measureEventStart('8: mapValues entries + reduce with spread acc');
  getAvgRunTime(
    () =>
      Object.entries(largeObj).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: {
            ...value,
            company: value.company.toLowerCase(),
          },
        }),
        {}
      ),
    10000
  );
  measureEventEnd('8: mapValues entries + reduce with spread acc');
  //----------------------------------------------------------------
  measureEventStart('9: concat lodash');
  getAvgRunTime(() => _concat(arr, smallArr), 10000);
  measureEventEnd('9: concat lodash');

  measureEventStart('9: concat arr.concat');
  getAvgRunTime(() => arr.concat(smallArr), 10000);
  measureEventEnd('9: concat arr.concat');

  measureEventStart('9: times lodash');
  getAvgRunTime(() => _times(2, _constant('unicorn')), 10000);
  measureEventEnd('9: times lodash');

  measureEventStart('9: times Array.from(length)');
  getAvgRunTime(() => times(2, () => 'unicorn'), 10000);
  measureEventEnd('9: times Array.from(length)');

  measureEventStart('9: filter lodash');
  getAvgRunTime(() => _filter(arr, value => value.id % 2), 10000);
  measureEventEnd('9: filter lodash');

  measureEventStart('9: filter arr.filter');
  getAvgRunTime(() => arr.filter(value => value.id % 2), 10000);
  measureEventEnd('9: filter arr.filter');

  const { name, ...restObj } = smallObj;
  const [first, second, ...restArr] = arr;

  return null;
}
measurement();
