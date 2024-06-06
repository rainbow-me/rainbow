import { niceIncrementFormatter } from '@/__swaps__/utils/swaps';
import { SLIDER_WIDTH } from '../constants';

type TestCase = {
  incrementDecimalPlaces: number;
  inputAssetBalance: number | string;
  inputAssetUsdPrice: number;
  niceIncrement: number | string;
  percentageToSwap: number;
  sliderXPosition: number;
  stripSeparators?: boolean;
  isStablecoin?: boolean;
} & {
  testName: string;
  expectedResult: string;
};

const TEST_CASES: TestCase[] = [
  {
    incrementDecimalPlaces: 0,
    inputAssetBalance: 45.47364224817269,
    inputAssetUsdPrice: 0.9995363790000001,
    niceIncrement: '1',
    percentageToSwap: 0.5,
    sliderXPosition: SLIDER_WIDTH / 2,
    stripSeparators: true,
    isStablecoin: true,
    testName: 'DAI Stablecoin',
    expectedResult: '22.74',
  },
];

describe('NiceIncremenetFormatter', () => {
  TEST_CASES.forEach(({ testName, expectedResult, ...params }, index) => {
    // eslint-disable-next-line jest/valid-title
    test(testName || `test-${index}`, () => {
      expect(niceIncrementFormatter({ ...params })).toBe(expectedResult);
    });
  });
});
