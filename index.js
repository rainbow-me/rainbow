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
  groupBy as _groupBy,
  map as _map,
  mapValues as _mapValues,
  omit as _omit,
  omitBy as _omitBy,
  pick as _pick,
  pickBy as _pickBy,
  reduce as _reduce,
  reverse as _reverse,
  sortBy as _sortBy,
  times as _times,
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
  sorterByFamiliesName,
  sorterByFamiliesNameReverse,
  sorterByFamiliesNameWithDestr,
  times,
  uniqueTokensLarge,
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

  // if (+etalon <= 0 || +current === +etalon) {
  //   return '';
  // }
  // let res = (+current * 100) / +etalon - 100;
  // const formatted = res > 0 && res < 1 ? 1 : res.toFixed(0);
  // return res > 0 ? `(+${formatted}%)` : ``;
};

function measure(title, count, func) {
  executionCount = count;
  func();
  const min = values.reduce((acc, el) => {
    return acc.average > el.average ? el : acc;
  });

  const res = values.map(i => {
    const _average = getPercent(i.average, min.average);
    const _max = getPercent(i.max, min.max);
    const _min = getPercent(i.min, min.min);

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

  return values.push({ average, blockAverage, count, max, min, title });
}

const chartType = 'y';

export default function measurement() {
  measure('1: map', 50, () => {
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
  });

  measure('2: forEch', 50, () => {
    average('lodash forEch', () => _forEach(assetsTestTwice, payloadForLoop));
    average('JS forEch', () => assetsTestTwice.forEach(payloadForLoop));
    average('for..of', () => forOfArr(assetsTestTwice));
    average('for loop', () => forLoop(assetsTestTwice));
  });

  measure('3: reduce with number acc', 50, () => {
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
  measure('30: reduce with number acc', 50, () => {
    average('lodash reduce', () =>
      _reduce(
        assetsTest,
        (acc, { asset }) => {
          acc += asset.price.value;
          return acc;
        },
        0
      )
    );
    average('JS reduce', () =>
      assetsTest.reduce((acc, { asset }) => {
        acc += asset.price.value;
        return acc;
      }, 0)
    );
    average('for..of', () => forOfLikeReduce(assetsTest));
  });

  measure('3.1: reduce with object acc', 50, () => {
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
    average('for..of', () => forOfLikeReduceObj(assetsTestTwice));
  });
  measure('3.2: reduce with object and spread', 50, () => {
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
    average('JS reduce with Object.assign', () =>
      assetsTestTwice.reduce((acc, { asset }) => {
        acc[asset.asset_code] = Object.assign(asset, {
          uniqueId: asset.asset_code,
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

  measure('3.3: comparing reduce with and without spread', 50, () => {
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

  measure('4: pick(obj, [path])', 50, () => {
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

  measure('5: pickBy(obj, predicate)', 50, () => {
    average('lodash', () => _pickBy(existingCharts, isIdEven));
    average('JS reduce', () => pickBy(existingCharts, isIdEven));
  });

  measure('6: omit(obj, keysToOmit)', 50, () => {
    average('lodash', () => _omit(existingCharts, pathsArr));
    average('spread', () => {
      const { eth, btc, ...rest } = existingCharts;
    });
    average('for..in', () => omitForIn(existingCharts, pathsArr));
    average('for..in with Set', () =>
      omitForInWithSet(existingCharts, pathsArr)
    );
    average('reduce', () => omitReduce(existingCharts, pathsArr));
    average('forEch', () => omitForEach(existingCharts, pathsArr));
    average('omit forIn with object', () =>
      omitForInWithObject(existingCharts, pathsArr)
    );
  });
  measure('7: omitBy(obj, predicate)', 50, () => {
    average('lodash', () => _omit(existingCharts, pathsArr));
    average('spread', () => omitBy(existingCharts, isIdEven));
  });

  measure('8: mapValues', 50, () => {
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

  measure('9: Other', 50, () => {
    average('lodash concat', () => _concat(assetsTestTwice, assetsTestTwice));
    average('JS concat', () => assetsTestTwice.concat(assetsTestTwice));
  });
  // measure('10: Other', 50, () => {
  //   average('lodash times', () => _times(20, _constant('unicorn')));
  //   average('JS times', () => times(20, () => 'unicorn'));
  // });
  // measure('11: Other', 50, () => {
  //   average('lodash filter', () =>
  //     _filter(assetsTestTwice, ({ asset }) => asset.price.value > 1)
  //   );
  //   average('JS filter', () =>
  //     assetsTestTwice.filter(({ asset }) => asset.price.value > 1)
  //   );
  // });
  measure('11.1: Other', 50, () => {
    average('lodash filter', () =>
      _filter(testRows, ({ familyName }) => familyName === 'CRYPTODRAGOON')
    );
    average('JS filter', () =>
      testRows.filter(({ familyName }) => familyName === 'CRYPTODRAGOON')
    );
  });
  // measure('12: Other', 50, () => {
  //   average('lodash filter', () =>
  //     _groupBy(uniqueTokensLarge, token => token.familyName)
  //   );
  //   average('JS filter', () =>
  //     uniqueTokensLarge.reduce((acc, token) => {
  //       if (acc[token.familyName]) {
  //         acc[token.familyName].push(token);
  //       } else {
  //         Object.assign(acc, {
  //           [token.familyName]: [token],
  //         });
  //       }
  //       return acc;
  //     }, {})
  //   );
  // });
  measure('12.1: groupBy', 50, () => {
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
    average('JS reduce assign', () => groupBy(uniqueTokensLarge, 'familyName'));
  });
  measure('13: sortBy', 50, () => {
    average('lodash sortBy', () =>
      _sortBy(testRows, row => row.familyName.replace(regex, '').toLowerCase())
    );
    average('JS sort', () => testRows.sort(sorterByFamiliesName));
  });
  // measure('13: Other', 50, () => {
  //   average('lodash filter', () =>
  //     _sortBy(testRows, ({ familyName }) =>
  //       familyName.replace(regex, '').toLowerCase()
  //     )
  //   );
  //   average('JS filter', () => testRows.sort(sorterByFamiliesNameWithDestr));
  // });
  // measure('13: Other', 50, () => {
  //   average('lodash filter', () =>
  //     _reverse(
  //       _sortBy(testRows, row =>
  //         row.familyName.replace(regex, '').toLowerCase()
  //       )
  //     )
  //   );
  //   average('JS filter', () => testRows.sort(sorterByFamiliesNameReverse));
  // });
  // measure('13: Other', 50, () => {
  //   average('lodash filter', () =>
  //     _sortBy(testRows, ({ familyName }) =>
  //       familyName.replace(regex, '').toLowerCase()
  //     )
  //   );
  //   average('JS filter', () => testRows.sort(sorterByFamiliesNameWithDestr));
  // });

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  // measureAverage(
  //   '1: map lodash',
  //   () =>
  //     _map(assetsTest, item => {
  //       return parseAssetTest(item.asset);
  //     }),
  //   5
  // );

  // measureAverage(
  //   '1: array.map',
  //   () => assetsTest.map(item => parseAssetTest(item.asset)),
  //   5
  // );

  // measureAverage(
  //   '1: map lodash with destructuring',
  //   () =>
  //     _map(assetsTest, ({ asset }) => {
  //       return parseAssetTest(asset);
  //     }),
  //   5
  // );

  // measureAverage(
  //   '1: array.map with destructuring',
  //   () => assetsTest.map(({ asset }) => parseAssetTest(asset)),
  //   5
  // );

  // measureAverage('1: for..of', () => forOfLikeMap(arr, parseAssetTest), 50);

  // measureAverage('1: for loop', () => forLikeMap(arr, parseAssetTest), 50);

  // //----------------------------------------------------------------

  // measureAverage(
  //   '2: forEch lodash',
  //   () => _forEach(assetsTest, payloadForLoop),
  //   5
  // );

  // measureAverage(
  //   '2: arr.forEch',
  //   () => assetsTest.forEach(payloadForLoop),
  //   5
  // );

  // measureAverage('2: for..of arr', () => forOfArr(assetsTest), 50);

  // measureAverage('2: for loop', () => forLoop(assetsTest), 50);

  // //----------------------------------------------------------------

  // measureAverage(
  //   '3: reduce lodash',
  //   () =>
  //     _reduce(
  //       assetsTest,
  //       (acc, { asset }) => {
  //         acc += asset.price.value;
  //         return acc;
  //       },
  //       0
  //     ),
  //   5
  // );

  // measureAverage(
  //   '3: arr.reduce',
  // () =>
  //   assetsTest.reduce((acc, { asset }) => {
  //     acc += asset.price.value;
  //     return acc;
  //   }, 0),
  //   5
  // );

  // measureAverage(
  //   '3: for..of  like a reduce',
  //   () => forOfLikeReduce(assetsTest),
  //   5
  // );

  // measureAverage(
  //   '3: for loop  like a reduce',
  //   () => forLoopReduce(assetsTest),
  //   5
  // );

  // measureAverage(
  //   '3.1: reduce lodash with object',
  //   () =>
  // _reduce(
  //   arr,
  //   ((acc, { asset }) => {
  //     acc[asset.asset_code] = asset;
  //     return acc;
  //   },
  //   {})
  //     ),
  //   5
  // );

  // measureAverage(
  //   '3.1: arr.reduce with object',
  //   () =>
  // assetsTest.reduce((acc, { asset }) => {
  //   acc[asset.asset_code] = asset;
  //   return acc;
  // }, {}),
  //   5
  // );

  // measureAverage(
  //   '3.1: for..of  like a reduce with object',
  //   () => forOfLikeReduceObj(assetsTest),
  //   5
  // );

  // measureAverage(
  //   '3.1: for loop  like a reduce with object',
  //   () => forLoopReduceObj(assetsTest),
  //   5
  // );
  // //
  // measureAverage(
  //   '3.2: reduce lodash with spread',
  //   () =>
  // _reduce(
  //   assetsTest,
  //   (acc, { asset }) => {
  //     acc[asset.asset_code] = { ...asset, uniqueId: asset.asset_code };
  //     return acc;
  //   },
  //   {}
  // ),
  //   5
  // );

  // measureAverage(
  //   '3.2: arr.reduce with spread',
  //   () =>
  // assetsTest.reduce((acc, { asset }) => {
  //   acc[asset.asset_code] = { ...asset, uniqueId: asset.asset_code };
  //   return acc;
  // }, {}),
  //   5
  // );

  // measureAverage(
  //   '3.2: arr.reduce Object.assign',
  //   () =>
  // assetsTest.reduce((acc, { asset }) => {
  //   acc[asset.asset_code] = Object.assign(asset, {
  //     uniqueId: asset.asset_code,
  //   });
  //   return acc;
  // }, {}),
  //   5
  // );

  // measureAverage(
  //   '3.2: arr.reduce with acc spread',
  //   () =>
  // assetsTest.reduce(
  //   (acc, { asset }) => ({
  //     ...acc,
  //     [asset.asset_code]: { ...asset, uniqueId: asset.asset_code },
  //   }),
  //   {}
  // ),
  //   5
  // );

  // measureAverage(
  //   '3.2: for..of  like a reduce with spread',
  //   () => forOfLikeReduceObjSpread(assetsTest),
  //   5
  // );

  // measureAverage(
  //   '3.2: for loop  like a reduce with spread',
  //   () => forLoopReduceObjSpread(assetsTest),
  //   5
  // );

  // measureAverage(
  //   '3.3: arr.reduce without spread',
  //   () =>
  // assetsTest.reduce((acc, { asset }) => {
  //   acc[asset.asset_code] = asset;
  //   return acc;
  // }, {}),
  //   5
  // );
  // measureAverage(
  //   '3.3: arr.reduce with spread',
  //   () =>
  //     assetsTest.reduce((acc, { asset }) => {
  //       acc[asset.asset_code] = { ...asset };
  //       return acc;
  //     }, {}),
  //   5
  // );
  // // ////--------
  // measureAverage('4: pick lodash', () => _pick(existingCharts, pathsArr), 50);

  // measureAverage(
  //   '4: pick with reduce paths',
  //   () => pickFlattenReduce(existingCharts, pathsArr),
  //   5
  // );
  // /////--------
  // measureAverage(
  //   '4: pick with spread',
  //   () => {
  //     const { eth, btc, ...rest } = existingCharts;
  //   },
  //   5
  // );

  // measureAverage(
  //   '4: pick with keys -> filter -> reduce',
  //   () => pickFlattenKeys(existingCharts, pathsArr),
  //   5
  // );

  // measureAverage(
  //   '4: pick with fromEntries -> entries -> filter',
  //   () => pickFlattenFromEntries(existingCharts, pathsArr),
  //   5
  // );
  // //----------------------------------------------------------------
  // measureAverage(
  //   '5: pickBy lodash',
  //   () => _pickBy(existingCharts, isIdEven),
  //   5
  // );

  // measureAverage(
  //   '5: pickBy reduce',
  //   () => pickBy(existingCharts, isIdEven),
  //   5
  // );
  // //----------------------------------------------------------------
  // measureAverage('6: omit lodash', () => _omit(existingCharts, pathsArr), 50);

  // measureAverage(
  //   '6: omit with spread',
  // () => {
  //   const { eth, btc, ...rest } = existingCharts;
  // },
  //   5
  // );

  // measureAverage(
  //   '6: omit forIn',
  //   () => omitForIn(existingCharts, pathsArr),
  //   5
  // );

  // measureAverage(
  //   '6: omit forIn with Set',
  //   () => omitForInWithSet(existingCharts, pathsArr),
  //   5
  // );

  // measureAverage(
  //   '6: omit reduce',
  //   () => omitReduce(existingCharts, pathsArr),
  //   5
  // );

  // measureAverage(
  //   '6: omit forEach',
  //   () => omitForEach(existingCharts, pathsArr),
  //   5
  // );

  // measureAverage(
  //   '6: omit forinWithObject',
  //   () => omitForInWithObject(existingCharts, pathsArr),
  //   5
  // );
  // //----------------------------------------------------------------
  // measureAverage(
  //   '7: omitBy lodash',
  //   () => _omitBy(existingCharts, isIdEven),
  //   5
  // );

  // measureAverage(
  //   '7: omitBy keys+reduce',
  //   () => omitBy(existingCharts, isIdEven),
  //   5
  // );
  // //----------------------------------------------------------------
  // const chartType = 'y';
  // //----------------------------------------------------------------
  // measureAverage(
  //   '8: mapValues lodash',
  //   () => {
  //     _mapValues(assetCharts, (chartData, address) => ({
  //       ...existingCharts[address],
  //       [chartType]: chartData?.slice().reverse(),
  //     }));
  //   },
  //   5
  // );

  // measureAverage(
  //   '8: mapValues entries + reduce',
  //   () =>
  // Object.entries(assetCharts).reduce((acc, [address, chartData]) => {
  //   acc[address] = {
  //     ...existingCharts[address],
  //     [chartType]: chartData?.slice()?.reverse(),
  //   };
  //   return acc;
  // }, {}),
  //   5
  // );

  // measureAverage(
  //   '8: mapValues fromEntries + entries + map',
  //   () =>
  // Object.fromEntries(
  //   Object.entries(assetCharts).map(([key, value]) => [
  //     key,
  //     {
  //       ...existingCharts[key],
  //       [chartType]: value?.slice().reverse(),
  //     },
  //   ])
  // ),
  //   5
  // );
  // ////////////////////////////////////////////////////////////////

  // measureAverage(
  //   '8: mapValues entries + reduce with spread value',
  //   () =>
  // Object.entries(assetCharts).reduce((acc, [address, chartData]) => {
  //   acc[address] = {
  //     ...existingCharts[address],
  //     [chartType]: chartData?.slice()?.reverse(),
  //   };
  //   return acc;
  // }, {}),
  //   5
  // );

  // measureAverage(
  //   '8: mapValues entries + reduce with spread acc',
  //   () =>
  // Object.entries(assetCharts).reduce(
  //   (acc, [address, chartData]) => ({
  //     ...acc,
  //     [address]: {
  //       ...existingCharts[address],
  //       [chartType]: chartData?.slice()?.reverse(),
  //     },
  //   }),
  //   {}
  // ),
  //   5
  // );
  // //----------------------------------------------------------------
  // measureAverage(
  //   '9: concat lodash',
  //   () => _concat(assetsTest, assetsTest),
  //   5
  // );

  // measureAverage(
  //   '9: concat arr.concat',
  //   () => assetsTest.concat(assetsTest),
  //   5
  // );

  // measureAverage(
  //   '9: times lodash',
  //   () => _times(2, _constant('unicorn')),
  //   5
  // );

  // measureAverage(
  //   '9: times Array.from(length)',
  //   () => times(2, () => 'unicorn'),
  //   5
  // );

  // measureAverage(
  //   '9: filter lodash',
  //   () => _filter(assetsTest, ({ asset }) => asset.price.value > 1),
  //   5
  // );

  // measureAverage(
  //   '9: filter arr.filter',
  //   () => assetsTest.filter(({ asset }) => asset.price.value > 1),
  //   5
  // );

  const { name, company, ...restObj } = smallObj;
  const [first, second, ...restArr] = arr;

  return null;
}
measurement();
