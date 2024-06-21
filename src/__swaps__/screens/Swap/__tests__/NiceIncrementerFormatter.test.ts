import { niceIncrementFormatter } from '@/__swaps__/utils/swaps';
import { SLIDER_WIDTH } from '../constants';

type TestCase = {
  incrementDecimalPlaces: number;
  inputAssetBalance: number | string;
  inputAssetNativePrice: number;
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
    inputAssetNativePrice: 0.9995363790000001,
    niceIncrement: '1',
    percentageToSwap: 0.5,
    sliderXPosition: SLIDER_WIDTH / 2,
    stripSeparators: true,
    isStablecoin: true,
    testName: 'DAI Stablecoin',
    expectedResult: '22.74',
  },
  {
    incrementDecimalPlaces: 2,
    inputAssetBalance: 100,
    inputAssetNativePrice: 10,
    niceIncrement: '0.1',
    percentageToSwap: 0,
    sliderXPosition: 0,
    stripSeparators: false,
    isStablecoin: false,
    testName: 'Zero percent swap',
    expectedResult: '0.00',
  },
  {
    incrementDecimalPlaces: 2,
    inputAssetBalance: 100,
    inputAssetNativePrice: 10,
    niceIncrement: '0.1',
    percentageToSwap: 1,
    sliderXPosition: SLIDER_WIDTH,
    stripSeparators: false,
    isStablecoin: false,
    testName: 'Full swap',
    expectedResult: '100.00',
  },
  {
    incrementDecimalPlaces: 2,
    inputAssetBalance: 123.456,
    inputAssetNativePrice: 1,
    niceIncrement: '0.05',
    percentageToSwap: 0.25,
    sliderXPosition: SLIDER_WIDTH / 4,
    stripSeparators: true,
    isStablecoin: false,
    testName: 'Quarter swap with fractional increment',
    expectedResult: '30.86',
  },
  {
    incrementDecimalPlaces: 0,
    inputAssetBalance: '1000',
    inputAssetNativePrice: 0.5,
    niceIncrement: '100',
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
