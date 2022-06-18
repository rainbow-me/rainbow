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
  reverse as _reverse,
  times as _times,
} from 'lodash';
import { StartTime } from './src/performance/start-time';
import { PerformanceTracking } from './src/performance/tracking';
import { PerformanceMetrics } from './src/performance/tracking/types/PerformanceMetrics';
import {
  assetCharts,
  existingCharts,
  newAssetPricesTest,
} from '@rainbow-me/helpers';
import {
  addValue,
  addValueDestructuring,
  arr,
  assetsTest,
  assetsTestTwice,
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
  omitForInWithObject,
  omitForInWithSet,
  omitReduce,
  parseAssetTest,
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
  getAvgRunTime(
    () =>
      _map(assetsTest, item => {
        return parseAssetTest(item.asset);
      }),
    5000
  );
  measureEventEnd('1: map lodash');

  measureEventStart('1: array.map');
  getAvgRunTime(() => assetsTest.map(item => parseAssetTest(item.asset)), 5000);
  measureEventEnd('1: array.map');

  measureEventStart('1: map lodash with destructuring');
  getAvgRunTime(
    () =>
      _map(assetsTest, ({ asset }) => {
        return parseAssetTest(asset);
      }),
    5000
  );
  measureEventEnd('1: map lodash with destructuring');

  measureEventStart('1: array.map with destructuring');

  getAvgRunTime(
    () => assetsTest.map(({ asset }) => parseAssetTest(asset)),
    5000
  );
  measureEventEnd('1: array.map with destructuring');

  measureEventStart('1: for..of');
  getAvgRunTime(() => forOfLikeMap(arr, parseAssetTest), 5000);
  measureEventEnd('1: for..of');

  measureEventStart('1: for loop');
  getAvgRunTime(() => forLikeMap(arr, parseAssetTest), 5000);
  measureEventEnd('1: for loop');

  //----------------------------------------------------------------

  measureEventStart('2: forEch lodash');
  getAvgRunTime(() => _forEach(assetsTest, payloadForLoop), 5000);
  measureEventEnd('2: forEch lodash');

  measureEventStart('2: arr.forEch');
  getAvgRunTime(() => assetsTest.forEach(payloadForLoop), 5000);
  measureEventEnd('2: arr.forEch');

  measureEventStart('2: for..of arr');
  getAvgRunTime(() => forOfArr(assetsTest), 5000);
  measureEventEnd('2: for..of arr');

  measureEventStart('2: for loop');
  getAvgRunTime(() => forLoop(assetsTest), 5000);
  measureEventEnd('2: for loop');

  //----------------------------------------------------------------

  measureEventStart('3: reduce lodash');
  getAvgRunTime(
    () =>
      _reduce(
        assetsTest,
        (acc, { asset }) => {
          acc += asset.price.value;
          return acc;
        },
        0
      ),
    5000
  );
  measureEventEnd('3: reduce lodash');

  measureEventStart('3: arr.reduce');
  getAvgRunTime(
    () =>
      assetsTest.reduce((acc, { asset }) => {
        acc += asset.price.value;
        return acc;
      }, 0),
    5000
  );
  measureEventEnd('3: arr.reduce');

  measureEventStart('3: for..of  like a reduce');
  getAvgRunTime(() => forOfLikeReduce(assetsTest), 5000);
  measureEventEnd('3: for..of  like a reduce');

  measureEventStart('3: for loop  like a reduce');
  getAvgRunTime(() => forLoopReduce(assetsTest), 5000);
  measureEventEnd('3: for loop  like a reduce');

  measureEventStart('3.1: reduce lodash with object');
  getAvgRunTime(
    () =>
      _reduce(
        arr,
        ((acc, { asset }) => {
          acc[asset.asset_code] = asset;
          return acc;
        },
        {})
      ),
    5000
  );
  measureEventEnd('3.1: reduce lodash with object');

  measureEventStart('3.1: arr.reduce with object');
  getAvgRunTime(
    () =>
      assetsTest.reduce((acc, { asset }) => {
        acc[asset.asset_code] = asset;
        return acc;
      }, {}),
    5000
  );
  measureEventEnd('3.1: arr.reduce with object');

  measureEventStart('3.1: for..of  like a reduce with object');
  getAvgRunTime(() => forOfLikeReduceObj(assetsTest), 5000);
  measureEventEnd('3.1: for..of  like a reduce with object');

  measureEventStart('3.1: for loop  like a reduce with object');
  getAvgRunTime(() => forLoopReduceObj(assetsTest), 5000);
  measureEventEnd('3.1: for loop  like a reduce with object');
  //
  measureEventStart('3.2: reduce lodash with spread');
  getAvgRunTime(
    () =>
      _reduce(
        assetsTest,
        (acc, { asset }) => {
          acc[asset.asset_code] = { ...asset, uniqueId: asset.asset_code };
          return acc;
        },
        {}
      ),
    5000
  );
  measureEventEnd('3.2: reduce lodash with spread');

  measureEventStart('3.2: arr.reduce with spread');
  getAvgRunTime(
    () =>
      assetsTest.reduce((acc, { asset }) => {
        acc[asset.asset_code] = { ...asset, uniqueId: asset.asset_code };
        return acc;
      }, {}),
    5000
  );
  measureEventEnd('3.2: arr.reduce with spread');

  measureEventStart('3.2: arr.reduce Object.assign');
  getAvgRunTime(
    () =>
      assetsTest.reduce((acc, { asset }) => {
        acc[asset.asset_code] = Object.assign(asset, {
          uniqueId: asset.asset_code,
        });
        return acc;
      }, {}),
    5000
  );
  measureEventEnd('3.2: arr.reduce Object.assign');

  measureEventStart('3.2: arr.reduce with acc spread');
  getAvgRunTime(
    () =>
      assetsTest.reduce(
        (acc, { asset }) => ({
          ...acc,
          [asset.asset_code]: { ...asset, uniqueId: asset.asset_code },
        }),
        {}
      ),
    5000
  );
  measureEventEnd('3.2: arr.reduce with acc spread');

  measureEventStart('3.2: for..of  like a reduce with spread');
  getAvgRunTime(() => forOfLikeReduceObjSpread(assetsTest), 5000);
  measureEventEnd('3.2: for..of  like a reduce with spread');

  measureEventStart('3.2: for loop  like a reduce with spread');
  getAvgRunTime(() => forLoopReduceObjSpread(assetsTest), 5000);
  measureEventEnd('3.2: for loop  like a reduce with spread');

  measureEventStart('3.3: arr.reduce without spread');
  getAvgRunTime(
    () =>
      assetsTest.reduce((acc, { asset }) => {
        acc[asset.asset_code] = asset;
        return acc;
      }, {}),
    5000
  );
  measureEventEnd('3.3: arr.reduce without spread');
  measureEventStart('3.3: arr.reduce with spread');
  getAvgRunTime(
    () =>
      assetsTest.reduce((acc, { asset }) => {
        acc[asset.asset_code] = { ...asset };
        return acc;
      }, {}),
    5000
  );
  measureEventEnd('3.3: arr.reduce with spread');
  // ////--------
  measureEventStart('4: pick lodash');
  getAvgRunTime(() => _pick(existingCharts, pathsArr), 5000);
  measureEventEnd('4: pick lodash');

  measureEventStart('4: pick with reduce paths');
  getAvgRunTime(() => pickFlattenReduce(existingCharts, pathsArr), 5000);
  measureEventEnd('4: pick with reduce paths');
  /////--------
  measureEventStart('4: pick with spread');
  getAvgRunTime(() => {
    const { eth, btc, ...rest } = existingCharts;
  }, 5000);
  measureEventEnd('4: pick with spread');

  measureEventStart('4: pick with keys -> filter -> reduce');
  getAvgRunTime(() => pickFlattenKeys(existingCharts, pathsArr), 5000);
  measureEventEnd('4: pick with keys -> filter -> reduce');

  measureEventStart('4: pick with fromEntries -> entries -> filter');
  getAvgRunTime(() => pickFlattenFromEntries(existingCharts, pathsArr), 5000);
  measureEventEnd('4: pick with fromEntries -> entries -> filter');
  //----------------------------------------------------------------
  measureEventStart('5: pickBy lodash');
  getAvgRunTime(() => _pickBy(existingCharts, isIdEven), 5000);
  measureEventEnd('5: pickBy lodash');

  measureEventStart('5: pickBy reduce');
  getAvgRunTime(() => pickBy(existingCharts, isIdEven), 5000);
  measureEventEnd('5: pickBy reduce');
  //----------------------------------------------------------------
  measureEventStart('6: omit lodash');
  getAvgRunTime(() => _omit(existingCharts, pathsArr), 5000);
  measureEventEnd('6: omit lodash');

  measureEventStart('6: omit with spread');
  getAvgRunTime(() => {
    const { eth, btc, ...rest } = existingCharts;
  }, 5000);
  measureEventEnd('6: omit with spread');

  measureEventStart('6: omit forIn');
  getAvgRunTime(() => omitForIn(existingCharts, pathsArr), 5000);
  measureEventEnd('6: omit forIn');

  measureEventStart('6: omit forIn with Set');
  getAvgRunTime(() => omitForInWithSet(existingCharts, pathsArr), 5000);
  measureEventEnd('6: omit forIn with Set');

  measureEventStart('6: omit reduce');
  getAvgRunTime(() => omitReduce(existingCharts, pathsArr), 5000);
  measureEventEnd('6: omit reduce');

  measureEventStart('6: omit forEach');
  getAvgRunTime(() => omitForEach(existingCharts, pathsArr), 5000);
  measureEventEnd('6: omit forEach');

  measureEventStart('6: omit forinWithObject');
  getAvgRunTime(() => omitForInWithObject(existingCharts, pathsArr), 5000);
  measureEventEnd('6: omit forinWithObject');
  //----------------------------------------------------------------
  measureEventStart('7: omitBy lodash');
  getAvgRunTime(() => _omitBy(existingCharts, isIdEven), 5000);
  measureEventEnd('7: omitBy lodash');

  measureEventStart('7: omitBy keys+reduce');
  getAvgRunTime(() => omitBy(existingCharts, isIdEven), 5000);
  measureEventEnd('7: omitBy keys+reduce');
  //----------------------------------------------------------------
  const chartType = 'y';
  //----------------------------------------------------------------
  measureEventStart('8: mapValues lodash');
  getAvgRunTime(() => {
    _mapValues(assetCharts, (chartData, address) => ({
      ...existingCharts[address],
      [chartType]: chartData?.slice().reverse(),
    }));
  }, 5000);
  measureEventEnd('8: mapValues lodash');

  measureEventStart('8: mapValues entries + reduce');
  getAvgRunTime(
    () =>
      Object.entries(assetCharts).reduce((acc, [address, chartData]) => {
        acc[address] = {
          ...existingCharts[address],
          [chartType]: chartData?.slice()?.reverse(),
        };
        return acc;
      }, {}),
    5000
  );
  measureEventEnd('8: mapValues entries + reduce');

  measureEventStart('8: mapValues fromEntries + entries + map');
  getAvgRunTime(
    () =>
      Object.fromEntries(
        Object.entries(assetCharts).map(([key, value]) => [
          key,
          {
            ...existingCharts[key],
            [chartType]: value?.slice().reverse(),
          },
        ])
      ),
    5000
  );
  measureEventEnd('8: mapValues fromEntries + entries + map');
  ////////////////////////////////////////////////////////////////

  measureEventStart('8: mapValues entries + reduce with spread value');
  getAvgRunTime(
    () =>
      Object.entries(assetCharts).reduce((acc, [address, chartData]) => {
        acc[address] = {
          ...existingCharts[address],
          [chartType]: chartData?.slice()?.reverse(),
        };
        return acc;
      }, {}),
    5000
  );
  measureEventEnd('8: mapValues entries + reduce with spread value');

  measureEventStart('8: mapValues entries + reduce with spread acc');
  getAvgRunTime(
    () =>
      Object.entries(assetCharts).reduce(
        (acc, [address, chartData]) => ({
          ...acc,
          [address]: {
            ...existingCharts[address],
            [chartType]: chartData?.slice()?.reverse(),
          },
        }),
        {}
      ),
    5000
  );
  measureEventEnd('8: mapValues entries + reduce with spread acc');
  //----------------------------------------------------------------
  measureEventStart('9: concat lodash');
  getAvgRunTime(() => _concat(assetsTest, assetsTest), 5000);
  measureEventEnd('9: concat lodash');

  measureEventStart('9: concat arr.concat');
  getAvgRunTime(() => assetsTest.concat(assetsTest), 5000);
  measureEventEnd('9: concat arr.concat');

  measureEventStart('9: times lodash');
  getAvgRunTime(() => _times(2, _constant('unicorn')), 5000);
  measureEventEnd('9: times lodash');

  measureEventStart('9: times Array.from(length)');
  getAvgRunTime(() => times(2, () => 'unicorn'), 5000);
  measureEventEnd('9: times Array.from(length)');

  measureEventStart('9: filter lodash');
  getAvgRunTime(
    () => _filter(assetsTest, ({ asset }) => asset.price.value > 1),
    5000
  );
  measureEventEnd('9: filter lodash');

  measureEventStart('9: filter arr.filter');
  getAvgRunTime(
    () => assetsTest.filter(({ asset }) => asset.price.value > 1),
    5000
  );
  measureEventEnd('9: filter arr.filter');

  const { name, company, ...restObj } = smallObj;
  const [first, second, ...restArr] = arr;

  return null;
}
measurement();
