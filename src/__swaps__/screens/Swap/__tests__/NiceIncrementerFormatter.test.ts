import { niceIncrementFormatter } from '@/__swaps__/utils/swaps';
import { SLIDER_WIDTH } from '../constants';

type TestCase = {
  inputAssetBalance: number | string;
  assetBalanceDisplay: string;
  inputAssetNativePrice: number;
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
    inputAssetBalance: 45.47364224817269,
    assetBalanceDisplay: '45.47364225',
    inputAssetNativePrice: 0.9995363790000001,
    percentageToSwap: 0.5,
    sliderXPosition: SLIDER_WIDTH / 2,
    stripSeparators: true,
    isStablecoin: true,
    testName: 'DAI Stablecoin',
    expectedResult: '22.74',
  },
  {
    inputAssetBalance: 100,
    assetBalanceDisplay: '100.00',
    inputAssetNativePrice: 10,
    percentageToSwap: 0,
    sliderXPosition: 0,
    stripSeparators: false,
    isStablecoin: false,
    testName: 'Zero percent swap',
    expectedResult: '0.00',
  },
  {
    inputAssetBalance: 100,
    assetBalanceDisplay: '100.00',
    inputAssetNativePrice: 10,
    percentageToSwap: 1,
    sliderXPosition: SLIDER_WIDTH,
    stripSeparators: false,
    isStablecoin: false,
    testName: 'Full swap',
    expectedResult: '100.00',
  },
  {
    inputAssetBalance: 123.456,
    assetBalanceDisplay: '123.46',
    inputAssetNativePrice: 1,
    percentageToSwap: 0.25,
    sliderXPosition: SLIDER_WIDTH / 4,
    stripSeparators: true,
    isStablecoin: false,
    testName: 'Quarter swap with fractional increment',
    expectedResult: '30.86',
  },
  {
    inputAssetBalance: '1000',
    assetBalanceDisplay: '1,000',
    inputAssetNativePrice: 0.5,
    percentageToSwap: 0.75,
    sliderXPosition: (3 * SLIDER_WIDTH) / 4,
    stripSeparators: false,
    isStablecoin: false,
    testName: 'Large increment test',
    expectedResult: '750',
  },
];

describe('NiceIncrementFormatter', () => {
  beforeAll(() => {
    jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
  });

  TEST_CASES.forEach(({ testName, expectedResult, ...params }, index) => {
    // eslint-disable-next-line jest/valid-title
    test(testName || `test-${index}`, () => {
      expect(niceIncrementFormatter({ ...params })).toBe(expectedResult);
    });
  });
});
