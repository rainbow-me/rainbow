/* eslint-disable import/no-commonjs */

/*
It needs to be an import statement because otherwise it doesn't load properly
likely because of typescript.
*/
import analytics from '@segment/analytics-react-native';
import {
  map as _map,
  omit as _omit,
  omitBy as _omitBy,
  pick as _pick,
  pickBy as _pickBy,
} from 'lodash';
import { StartTime } from './src/performance/start-time';
import { PerformanceTracking } from './src/performance/tracking';
import { PerformanceMetrics } from './src/performance/tracking/types/PerformanceMetrics';
import { omitFlatten, omitFlattenDel } from '@rainbow-me/helpers/utilities';
import {
  addValue,
  fnReturnId,
  forEachLodash,
  forEachNative,
  forEachSet,
  forLoop,
  forOfArr,
  forOfLikeMap,
  forOfLikeReduce,
  forOfSet,
  isIdEven,
  mapLodash,
  mapNative,
  omitBy,
  omitForEach,
  omitForIn,
  omitReduce,
  pickBy,
  pickFlattenFromEntries,
  pickFlattenKeys,
  pickFlattenReduce,
  reduceLodash,
  reduceNative,
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

const smallObj = {
  company: 'ABC1',
  country: 'IN',
  id: 1001,
  name: 'Some',
  priceObj: {
    amount: 100,
    currency: 'USD',
  },
  result: 0,
  value1: 1,
  value2: 2,
  zip: 1,
};
// const smallObj = {
//   one: {
//     company: 'ABC1',
//     country: 'IN',
//     id: 1001,
//     name: 'Some',
//     priceObj: {
//       amount: 100,
//       currency: 'USD',
//     },
//     result: 0,
//     value1: 1,
//     value2: 2,
//     zip: 1,
//   },
//   three: {
//     company: 'ABC1',
//     country: 'IN',
//     id: 1002,
//     name: 'Some',
//     priceObj: {
//       amount: 100,
//       currency: 'USD',
//     },
//     result: 0,
//     value1: 3,
//     value2: 6,
//     zip: 3,
//   },
//   two: {
//     company: 'ABC1',
//     country: 'IN',
//     id: 1003,
//     name: 'Some',
//     priceObj: {
//       amount: 100,
//       currency: 'USD',
//     },
//     result: 0,
//     value1: 2,
//     value2: 4,
//     zip: 2,
//   },
// };
const largeObj = {
  eight: {
    company: 'ABC2',
    country: 'IN',
    id: 107,
    name: 'Some',
    priceObj: {
      amount: 107,
      currency: 'USD',
    },
    result: 0,
    value1: 8,
    value2: 8,
    zip: 8,
  },
  five: {
    company: 'ABC2',
    country: 'IN',
    id: 104,
    name: 'Some',
    priceObj: {
      amount: 104,
      currency: 'USD',
    },
    result: 0,
    value1: 5,
    value2: 5,
    zip: 5,
  },
  four: {
    company: 'ABC3',
    country: 'IN',
    id: 103,
    name: 'Some',
    priceObj: {
      amount: 103,
      currency: 'USD',
    },
    result: 0,
    value1: 3,
    value2: 3,
    zip: 3,
  },
  nine: {
    company: 'ABC2',
    country: 'IN',
    id: 108,
    name: 'Some',
    priceObj: {
      amount: 108,
      currency: 'USD',
    },
    result: 0,
    value1: 9,
    value2: 9,
    zip: 9,
  },
  one: {
    company: 'ABC1',
    country: 'IN',
    id: 100,
    name: 'Some',
    priceObj: {
      amount: 100,
      currency: 'USD',
    },
    result: 0,
    value1: 1,
    value2: 1,
    zip: 1,
  },
  seven: {
    company: 'ABC2',
    country: 'IN',
    id: 106,
    name: 'Some',
    priceObj: {
      amount: 106,
      currency: 'USD',
    },
    result: 0,
    value1: 7,
    value2: 7,
    zip: 7,
  },
  six: {
    company: 'ABC2',
    country: 'IN',
    id: 105,
    name: 'Some',
    priceObj: {
      amount: 105,
      currency: 'USD',
    },
    result: 0,
    value1: 6,
    value2: 6,
    zip: 6,
  },
  ten: {
    company: 'ABC2',
    country: 'IN',
    id: 109,
    name: 'Some',
    priceObj: {
      amount: 109,
      currency: 'USD',
    },
    result: 0,
    value1: 10,
    value2: 10,
    zip: 10,
  },
  three: {
    company: 'ABC3',
    country: 'IN',
    id: 102,
    name: 'Some',
    priceObj: {
      amount: 102,
      currency: 'USD',
    },
    result: 0,
    value1: 3,
    value2: 3,
    zip: 3,
  },
  two: {
    company: 'ABC2',
    country: 'IN',
    id: 101,
    name: 'Some',
    priceObj: {
      amount: 101,
      currency: 'USD',
    },
    result: 0,
    value1: 2,
    value2: 2,
    zip: 2,
  },
};
const pathsArr = [
  'eight',
  'one',
  'seven',
  'two',
  'five',
  'three',
  'four',
  'six',
];
const arr = [
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
  smallObj,
];

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
  getAvgRunTime(() => _map(arr, addValue), 5000);
  measureEventEnd('1: map lodash');

  measureEventStart('1: array.map');
  getAvgRunTime(() => arr.map(addValue), 5000);
  measureEventEnd('1: array.map');

  measureEventStart('1: forOfLikeMap');
  getAvgRunTime(() => forOfLikeMap(arr, addValue), 5000);
  measureEventEnd('1: forOfLikeMap');
  /////////

  measureEventStart('2: forEch lodash');
  getAvgRunTime(() => forEachLodash(arr), 5000);
  measureEventEnd('2: forEch lodash');

  measureEventStart('2: arr.forEch');
  getAvgRunTime(() => forEachNative(arr), 5000);
  measureEventEnd('2: arr.forEch');

  measureEventStart('2: arr.forEch with Set');
  getAvgRunTime(() => forEachSet(arr), 5000);
  measureEventEnd('2: arr.forEch with Set');

  measureEventStart('2: for..of arr');
  getAvgRunTime(() => forOfArr(arr), 5000);
  measureEventEnd('2: for..of arr');

  measureEventStart('2: for..of Set');
  getAvgRunTime(() => forOfSet(arr), 5000);
  measureEventEnd('2: for..of Set');

  measureEventStart('2: forLoop');
  getAvgRunTime(() => forLoop(arr), 5000);
  measureEventEnd('2: forLoop');
  //
  //
  measureEventStart('3: reduce lodash');
  getAvgRunTime(() => reduceLodash(arr), 5000);
  measureEventEnd('3: reduce lodash');

  measureEventStart('3: arr.reduce');
  getAvgRunTime(() => reduceNative(arr), 5000);
  measureEventEnd('3: arr.reduce');

  measureEventStart('3: for..of  like reduce');
  getAvgRunTime(() => forOfLikeReduce(arr), 5000);
  measureEventEnd('3: for..of  like reduce');

  //
  //

  measureEventStart('4: pick with reduce');
  getAvgRunTime(() => pickFlattenReduce(largeObj, [...pathsArr]), 5000);
  measureEventEnd('4: pick with reduce');

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
  }, 5000);
  measureEventEnd('4: pick with spread');

  measureEventStart('4: pick with keys');
  getAvgRunTime(() => pickFlattenKeys(largeObj, [...pathsArr]), 5000);
  measureEventEnd('4: pick with keys');

  measureEventStart('4: pick with fromEntries');
  getAvgRunTime(() => pickFlattenFromEntries(largeObj, [...pathsArr]), 5000);
  measureEventEnd('4: pick with fromEntries');

  ///
  ///
  measureEventStart('5: pickBy lodash');
  getAvgRunTime(() => _pickBy(largeObj, isIdEven), 5000);
  measureEventEnd('5: pickBy lodash');

  measureEventStart('5: pickBy reduce');
  getAvgRunTime(() => pickBy(largeObj, isIdEven), 5000);
  measureEventEnd('5: pickBy reduce');

  //
  //
  measureEventStart('6: omit lodash');
  getAvgRunTime(() => _omit(largeObj, [...pathsArr]), 5000);
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
  }, 5000);
  measureEventEnd('6: omit with spread');

  measureEventStart('6: omit forIn');
  getAvgRunTime(() => omitForIn(largeObj, [...pathsArr]), 5000);
  measureEventEnd('6: omit forIn');

  measureEventStart('6: omit reduce');
  getAvgRunTime(() => omitReduce(largeObj, [...pathsArr]), 5000);
  measureEventEnd('6: omit reduce');

  measureEventStart('6: omit forEach');
  getAvgRunTime(() => omitForEach(largeObj, [...pathsArr]), 5000);
  measureEventEnd('6: omit forEach');

  //
  //

  measureEventStart('7: omitBy lodash');
  getAvgRunTime(() => _omitBy(largeObj, isIdEven), 5000);
  measureEventEnd('7: omitBy lodash');

  measureEventStart('7: omitBy lodash');
  getAvgRunTime(() => omitBy(largeObj, isIdEven), 5000);
  measureEventEnd('7: omitBy lodash');

  //
  //

  //
  //
  //
  // measureEventStart('custom omit0');
  // getAvgRunTime(() => arr.map(fnReturnId), 5000);
  // measureEventEnd('custom omit0');

  // measureEventStart('custom omit1');
  // getAvgRunTime(() => arr.map(v => v?.id), 5000);
  // measureEventEnd('custom omit1');

  // measureEventStart('custom omit with deleting from obj ');
  // getAvgRunTime(() => omitFlattenDel(test, 'c1'), 50000);
  // measureEventEnd('custom omit with deleting from obj ');

  //
  //
  //
  //
  // measureEventStart('');
  // getAvgRunTime(() => pickFlattenReduce(largeObj, 'c1'), 50000);
  // measureEventEnd('');
  // //
  // measureEventStart('');
  // getAvgRunTime(() => pickBy(largeObj, isIdEven), 50000);
  // measureEventEnd('');
  // //
  //
  //

  return null;
}
measurement();
