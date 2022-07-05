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
  difference as _difference,
  filter as _filter,
  forEach as _forEach,
  get as _get,
  groupBy as _groupBy,
  map as _map,
  mapValues as _mapValues,
  omit as _omit,
  omitBy as _omitBy,
  orderBy as _orderBy,
  pick as _pick,
  pickBy as _pickBy,
  reduce as _reduce,
  reverse as _reverse,
  sortBy as _sortBy,
  times as _times,
  uniqBy as _uniqBy,
  without as _without,
} from 'lodash';
// import { foregroundColors } from 'src/design-system/color/palettes';
// import { StartTime } from './src/performance/start-time';
// import { PerformanceTracking } from './src/performance/tracking';
// import { PerformanceMetrics } from './src/performance/tracking/types/PerformanceMetrics';
import {
  assetCharts,
  existingCharts,
  newAssetPricesTest,
} from '@rainbow-me/helpers';
import { testRows } from '@rainbow-me/helpers/testData';
import {
  addValue,
  addValueDestructuring,
  arr,
  assetsTest,
  assetsTestTwice,
  differenceStrings,
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
  groupBy,
  groupBy2,
  groupByFunc,
  groupByK,
  groupByK2,
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
  regex,
  smallArr,
  smallObj,
  sortDESC,
  sorterByFamiliesName,
  sorterByFamiliesNameReverse,
  sorterByFamiliesNameWithDestr,
  times,
  uniqBy,
  uniqBy0,
  uniqBy01,
  uniqBy2,
  uniqBy3,
  uniqBy4,
  uniqBy5,
  uniqueArray,
  uniqueTokensLarge,
  withoutSomeStrings,
  withoutSomeStrings2,
} from '@rainbow-me/helpers/utilitiesTest';
import {
  measureEventEnd,
  measureEventStart,
} from '@rainbow-me/performance/utils';

// analytics.track('Started executing JavaScript bundle');
// PerformanceTracking.logDirectly(
//   PerformanceMetrics.loadJSBundle,
//   Date.now() - StartTime.START_TIME
// );
// PerformanceTracking.startMeasuring(PerformanceMetrics.loadJSBundle);
// PerformanceTracking.startMeasuring(PerformanceMetrics.timeToInteractive);

/*
We need to use require calls in order to stop babel from moving imports
to the top of the file above all other calls. We want Performance tracking
to start before all of the imports.
 */
require('react-native-gesture-handler');
require('./shim');
require('./src/model/config');

require('./src/App');

let values = [];
let executionCount = 5;
const getPercent = (current, etalon) => {
  if (+etalon === 0 || +current === +etalon) {
    return '';
  }
  let res = (+current * 100) / +etalon - 100;
  const formated = res.toFixed(0);
  return res >= 1 ? `(+${formated}%)` : `($1%)`;
};

function measure(title, count, func) {
  executionCount = count;
  func();
  const min = values.reduce((acc, el) => {
    return +acc.average > +el.average ? el : acc;
  });
  const res = values.map(i => {
    const _average = getPercent(i.average, min.average);
    const _max = getPercent(i.max, min.max, i.title);
    const _min = getPercent(i.min, min.min, i.title);

    const len = 35 - i.title.length;
    const spaces = '-'.repeat(len > 0 ? len : 0);
    return `${i.title} (${i.count}) -${spaces} ${i.average}ms${_average} (max: ${i.max}ms${_max}; min: ${i.min}ms${_min}) - average block value: ${i.blockAverage}
    `;
  });

  global.console.log(`${title}:
  ${res.join('')}`);
  values = [];
}

function average(title, func) {
  const val = [];

  var exCount = executionCount;
  const startAverageTime = performance.now();
  while (exCount--) {
    const startTime = performance.now();
    func();
    const endTime = performance.now();
    val.push(endTime - startTime);
  }
  const endAverageTime = performance.now();

  const total = val.reduce((acc, curr) => acc + curr);
  const max = Math.max(...val).toFixed(3);
  const min = Math.min(...val).toFixed(3);

  const count = val.length;
  const average = (total / val.length).toFixed(3);
  const blockAverage = (
    (endAverageTime - startAverageTime) /
    val.length
  ).toFixed(2);

  return values.push({ average, blockAverage, count, max, min, title, val });
}

const chartType = 'y';

export default function measurement() {
  measure('1: map', 200, () => {
    average('lodash map', () =>
      _map(assetsTestTwice, item => {
        return parseAssetTest(item.asset);
      })
    );
    average('JS map', () =>
      assetsTestTwice.map(item => parseAssetTest(item.asset))
    );
    average('map lodash with destructuring', () =>
      _map(assetsTestTwice, ({ asset }) => {
        return parseAssetTest(asset);
      })
    );
    average('JS map with destructuring', () =>
      assetsTestTwice.map(({ asset }) => parseAssetTest(asset))
    );
    average('lodash map with get', () =>
      _map(assetsTestTwice, item => {
        return parseAssetTest(_get(item, 'asset'));
      })
    );
    average('JS map with get', () =>
      assetsTestTwice.map(item => parseAssetTest(_get(item, 'asset')))
    );
  });

  measure('2: forEach', 200, () => {
    average('lodash forEach', () => _forEach(assetsTestTwice, payloadForLoop));
    average('JS forEach', () => assetsTestTwice.forEach(payloadForLoop));
    average('for..of', () => forOfArr(assetsTestTwice));
    average('for loop', () => forLoop(assetsTestTwice));
  });

  measure('3: reduce with number acc', 200, () => {
    average('lodash reduce', () =>
      _reduce(
        assetsTestTwice,
        (acc, { asset }) => {
          acc += asset.price.value;
          return acc;
        },
        0
      )
    );
    average('JS reduce', () =>
      assetsTestTwice.reduce((acc, { asset }) => {
        acc += asset.price.value;
        return acc;
      }, 0)
    );
    average('for..of', () => forOfLikeReduce(assetsTestTwice));
  });

  measure('3.1: reduce with object acc', 200, () => {
    average('lodash reduce', () =>
      _reduce(
        assetsTestTwice,
        ((acc, { asset }) => {
          acc[asset.asset_code] = asset;
          return acc;
        },
        {})
      )
    );
    average('JS reduce', () =>
      assetsTestTwice.reduce((acc, { asset }) => {
        acc[asset.asset_code] = asset;
        return acc;
      }, {})
    );

    average('JS reduce with Object.assign', () =>
      assetsTestTwice.reduce(
        (acc, { asset }) => Object.assign(acc, { [asset.asset_code]: asset }),
        {}
      )
    );
    average('for..of', () => forOfLikeReduceObj(assetsTestTwice));
  });
  measure('3.2: reduce with object and spread', 200, () => {
    average('lodash reduce', () =>
      _reduce(
        assetsTestTwice,
        (acc, { asset }) => {
          acc[asset.asset_code] = { ...asset, uniqueId: asset.asset_code };
          return acc;
        },
        {}
      )
    );
    average('JS reduce', () =>
      assetsTestTwice.reduce((acc, { asset }) => {
        acc[asset.asset_code] = { ...asset, uniqueId: asset.asset_code };
        return acc;
      }, {})
    );
    average('JS reduce with Object.assign value', () =>
      assetsTestTwice.reduce((acc, { asset }) => {
        acc[asset.asset_code] = Object.assign(asset, {
          uniqueId: asset.asset_code,
        });
        return acc;
      }, {})
    );
    average('JS reduce with Object.assign whole item', () =>
      assetsTestTwice.reduce((acc, { asset }) => {
        Object.assign(acc, {
          [asset.asset_code]: { ...asset, uniqueId: asset.asset_code },
        });
        return acc;
      }, {})
    );
    average('JS reduce with acc spread', () =>
      assetsTestTwice.reduce(
        (acc, { asset }) => ({
          ...acc,
          [asset.asset_code]: { ...asset, uniqueId: asset.asset_code },
        }),
        {}
      )
    );
    average('for..of', () => forOfLikeReduceObjSpread(assetsTestTwice));
  });

  measure('3.3: comparing reduce with and without spread', 200, () => {
    average('lodash with spread', () =>
      _reduce(
        assetsTestTwice,
        (acc, { asset }) => {
          acc[asset.asset_code] = { ...asset };
          return acc;
        },
        {}
      )
    );
    average('lodash without spread', () =>
      _reduce(
        assetsTestTwice,
        (acc, { asset }) => {
          acc[asset.asset_code] = asset;
          return acc;
        },
        {}
      )
    );
    average('JS with spread', () =>
      assetsTestTwice.reduce((acc, { asset }) => {
        acc[asset.asset_code] = { ...asset };
        return acc;
      }, {})
    );
    average('JS without spread', () =>
      assetsTestTwice.reduce((acc, { asset }) => {
        acc[asset.asset_code] = asset;
        return acc;
      }, {})
    );
  });

  measure('4: pick(obj, [path])', 200, () => {
    average('lodash', () => _pick(existingCharts, pathsArr));
    average('JS reduce paths', () =>
      pickFlattenReduce(existingCharts, pathsArr)
    );
    average('spread', () => {
      const { eth, btc, ...rest } = existingCharts;
    });
    average('fromEntries -> entries -> filter', () =>
      pickFlattenKeys(existingCharts, pathsArr)
    );
  });

  measure('5: pickBy(obj, predicate)', 200, () => {
    average('lodash', () => _pickBy(existingCharts, isIdEven));
    average('JS reduce', () => pickBy(existingCharts, isIdEven));
  });

  measure('6: omit(obj, keysToOmit)', 200, () => {
    average('lodash', () => _omit(existingCharts, pathsArr));
    average('spread', () => {
      const { eth, btc, ...rest } = existingCharts;
    });
    average('for..in', () => omitForIn(existingCharts, pathsArr));
    average('for..in with Set', () =>
      omitForInWithSet(existingCharts, pathsArr)
    );
    average('reduce', () => omitReduce(existingCharts, pathsArr));
    average('forEach', () => omitForEach(existingCharts, pathsArr));
    average('omit forIn with object', () =>
      omitForInWithObject(existingCharts, pathsArr)
    );
  });
  measure('7: omitBy(obj, predicate)', 200, () => {
    average('lodash', () => _omit(existingCharts, pathsArr));
    average('spread', () => omitBy(existingCharts, isIdEven));
  });

  measure('8: mapValues', 200, () => {
    average('lodash', () => {
      _mapValues(assetCharts, (chartData, address) => ({
        ...existingCharts[address],
        [chartType]: chartData?.slice().reverse(),
      }));
    });
    average('entries + reduce', () =>
      Object.entries(assetCharts).reduce((acc, [address, chartData]) => {
        acc[address] = {
          ...existingCharts[address],
          [chartType]: chartData?.slice()?.reverse(),
        };
        return acc;
      }, {})
    );
    average('fromEntries + entries + map', () =>
      Object.fromEntries(
        Object.entries(assetCharts).map(([key, value]) => [
          key,
          {
            ...existingCharts[key],
            [chartType]: value?.slice().reverse(),
          },
        ])
      )
    );
    average('entries + reduce with spread value', () =>
      Object.entries(assetCharts).reduce((acc, [address, chartData]) => {
        acc[address] = {
          ...existingCharts[address],
          [chartType]: chartData?.slice()?.reverse(),
        };
        return acc;
      }, {})
    );
    average('entries + reduce with spread acc', () =>
      Object.entries(assetCharts).reduce(
        (acc, [address, chartData]) => ({
          ...acc,
          [address]: {
            ...existingCharts[address],
            [chartType]: chartData?.slice()?.reverse(),
          },
        }),
        {}
      )
    );
  });

  measure('9: Other', 200, () => {
    average('lodash concat', () => _concat(assetsTestTwice, assetsTestTwice));
    average('JS concat', () => assetsTestTwice.concat(assetsTestTwice));
  });

  measure('10: Filter', 200, () => {
    average('lodash filter', () =>
      _filter(
        testRows,
        ({ familyName }) => familyName === 'CRYPTODRAGOON' || 'ENS'
      )
    );
    average('JS filter', () =>
      testRows.filter(
        ({ familyName }) => familyName === 'CRYPTODRAGOON' || 'ENS'
      )
    );
  });
  measure('11: groupBy', 200, () => {
    average('lodash groupBy', () =>
      _groupBy(uniqueTokensLarge, token => token.familyName)
    );
    average('JS reduce', () =>
      uniqueTokensLarge.reduce((acc, token) => {
        if (acc[token.familyName]) {
          acc[token.familyName].push(token);
        } else {
          acc[token.familyName] = [token];
        }
        return acc;
      }, {})
    );
    average('JS reduce assign', () =>
      uniqueTokensLarge.reduce((acc, token) => {
        if (acc[token.familyName]) {
          acc[token.familyName].push(token);
        } else {
          Object.assign(acc, { [token.familyName]: [token] });
        }
        return acc;
      }, {})
    );
    average('JS groupByFunc', () =>
      groupByFunc(uniqueTokensLarge, ({ familyName }) => familyName)
    );
    average('JS groupByFunc 2', () =>
      groupByFunc(uniqueTokensLarge, v => v.familyName)
    );
    // average('JS groupByK', () => groupByK(uniqueTokensLarge, 'familyName'));
    average('JS groupByK2', () => groupByK2(uniqueTokensLarge, 'familyName'));
    average('JS reduce imported', () =>
      groupBy(uniqueTokensLarge, 'familyName')
    );
  });
  measure('12: sortBy', 200, () => {
    average('lodash sortBy', () =>
      _sortBy(testRows, row => row.familyName.replace(regex, '').toLowerCase())
    );
    average('JS sort', () => testRows.sort(sorterByFamiliesName));
  });
  measure('13: uniqBy', 200, () => {
    average('lodash uniqBy', () =>
      _uniqBy(assetsTest, v => v.asset.asset_code)
    );
    average('lodash uniqBy2', () =>
      _uniqBy(assetsTest, ({ asset }) => asset.asset_code)
    );
    average('lodash uniqBy3', () =>
      _uniqBy(assetsTestTwice, 'asset.asset_code')
    );
    average('JS uniqBy1', () =>
      uniqBy(assetsTestTwice, v => v.asset.asset_code)
    );
    average('JS uniqBy0', () =>
      uniqBy0(assetsTestTwice, v => v.asset.asset_code)
    );
    // average('JS uniqBy01', () =>
    //   uniqBy01(assetsTestTwice, v => v.asset.asset_code)
    // );
    average('JS uniqBy2', () =>
      uniqBy2(assetsTestTwice, v => v.asset.asset_code)
    );
    average('JS uniqBy3', () =>
      uniqBy3(assetsTestTwice, v => v.asset.asset_code)
    );
    average('JS uniqBy4', () =>
      uniqBy4(assetsTestTwice, v => v.asset.asset_code)
    );
    average('JS uniqBy5', () =>
      uniqBy(assetsTestTwice, ({ asset }) => asset.asset_code)
    );
    average('JS uniqBy6', () =>
      uniqBy5(assetsTestTwice, v => v.asset.asset_code)
    );
    average('JS uniqBy7', () =>
      uniqueArray(assetsTestTwice, ['asset.asset_code'])
    );
  });

  measure('14: uniqBy', 200, () => {
    average('lodash uniqBy', () =>
      _uniqBy(assetsTestTwice, token => token.asset.asset_code)
    );
    average('JS uniqBy', () =>
      uniqBy(assetsTestTwice, token => token.asset.asset_code)
    );
  });
  /////
  measure('15: sortBy', 200, () => {
    average('lodash sortBy', () =>
      _sortBy(testRows, ({ familyName }) =>
        familyName.replace(regex, '').toLowerCase()
      )
    );
    average('JS sortBy', () => testRows.sort(sorterByFamiliesNameWithDestr));
  });
  measure('16: sortBy reverse', 200, () => {
    average('lodash sortBy', () =>
      _reverse(
        _sortBy(testRows, row =>
          row.familyName.replace(regex, '').toLowerCase()
        )
      )
    );
    average('JS sort', () => testRows.sort(sorterByFamiliesNameReverse));
  });
  measure('17: Filter ', 200, () => {
    average('lodash filter destructing ', () =>
      _sortBy(testRows, ({ familyName }) =>
        familyName.replace(regex, '').toLowerCase()
      )
    );
    average('JS sort', () => testRows.sort(sorterByFamiliesNameWithDestr));
  });

  const newFamilies = testRows.map(i => i.familyName); //162 el
  const arrWithNumbers = testRows.map(i => i.childrenAmount); //162 el
  const existingFamilies = [
    newFamilies[3],
    newFamilies[90],
    newFamilies[17],
    newFamilies[50],
    newFamilies[33],
    newFamilies[87],
    newFamilies[1],
  ];
  measure('17: without ', 200, () => {
    average('lodash without ', () =>
      _without(newFamilies, ...existingFamilies)
    );
    average('JS withoutSomeStrings', () =>
      withoutSomeStrings(newFamilies, existingFamilies)
    );
  });
  measure('18: difference ', 200, () => {
    average('lodash difference ', () =>
      _difference(newFamilies, ...existingFamilies)
    );
    average('JS differenceStrings', () =>
      differenceStrings(newFamilies, existingFamilies)
    );
  });

  measure('18: orderBy `desc`', 200, () => {
    average('lodash orderBy `desc`', () =>
      _orderBy(testRows, ({ childrenAmount }) => Number(childrenAmount), [
        'desc',
      ])
    );
    average('JS orderBy `desc`', () =>
      testRows.sort((a, b) => {
        // 'desc'
        return a.childrenAmount > b.childrenAmount ? -1 : 1;
      })
    );
    average('JS orderBy `desc 2`', () =>
      testRows.sort((a, b) => sortDESC(a.childrenAmount, b.childrenAmount))
    );
  });

  const { name, company, ...restObj } = smallObj;
  const [first, second, ...restArr] = arr;

  return null;
}
measurement();
