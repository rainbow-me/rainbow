import BigNumber from 'bignumber.js';
import {
  ceilWorklet,
  divWorklet,
  equalWorklet,
  floorWorklet,
  greaterThanOrEqualToWorklet,
  greaterThanWorklet,
  lessThanOrEqualToWorklet,
  lessThanWorklet,
  modWorklet,
  mulWorklet,
  orderOfMagnitudeWorklet,
  powWorklet,
  roundWorklet,
  subWorklet,
  sumWorklet,
  toFixedWorklet,
  toScaledIntegerWorklet,
} from '../SafeMath';

const RESULTS = {
  sum: '1247244.585',
  sub: '1239606.105',
  mul: '4748939814.6378',
  div: '325.56878986395199044836',
  mod: '2172.345',
  pow: '1546106588588.369025',
  toFixed: '1243425.35',
  ceil: '1243426',
  floor: '1243425',
  toScaledInteger: '57464009350560633',
  negativePow: '0.001',
  negativeExp: '6.0895415516156',
  orderOfMagnitude: '29',
  divWithExp: '1000000000000000000000',
};

const VALUE_A = '1243425.345';
const VALUE_B = '3819.24';
const VALUE_C = '2';
const VALUE_D = '1243425.745';
const VALUE_E = '0.057464009350560633';
const VALUE_F = '147887324';
const VALUE_G = '4.11769e-8';
const VALUE_H = '123456789012345678901234567890';
const VALUE_I = '6.25e+21';
const VALUE_K = '6.25';
const NEGATIVE_VALUE = '-2412.12';
const ZERO = '0';
const ONE = '1';
const TEN = '10';
const ONE_HUNDRED = '100';
const MINUS_3 = '-3';
const NON_NUMERIC_STRING = 'abc';

const VALUE_L = '1.23e-5';
const VALUE_M = '9.99999e-5';
const VALUE_N = '-2.5e3';
const VALUE_O = '5.00000000000000000001e-18';
const VALUE_P = '99999999999999999999.9999999999';

describe('SafeMath', () => {
  test('sumWorklet', () => {
    expect(() => sumWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string or number');
    expect(() => sumWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string or number');
    expect(sumWorklet(ZERO, ZERO)).toBe(ZERO);
    expect(sumWorklet(VALUE_A, ZERO)).toBe(VALUE_A);
    expect(sumWorklet(ZERO, VALUE_B)).toBe(VALUE_B);
    expect(sumWorklet(VALUE_A, VALUE_B)).toBe(RESULTS.sum);
    expect(sumWorklet(Number(VALUE_A), VALUE_B)).toBe(RESULTS.sum);
    expect(sumWorklet(VALUE_A, Number(VALUE_B))).toBe(RESULTS.sum);

    const sumLM = new BigNumber(VALUE_L).plus(VALUE_M).toFixed();
    expect(sumWorklet(VALUE_L, VALUE_M)).toBe(sumLM);

    const sumN_100 = new BigNumber(VALUE_N).plus(ONE_HUNDRED).toFixed();
    expect(sumWorklet(VALUE_N, ONE_HUNDRED)).toBe(sumN_100);
  });

  test('subWorklet', () => {
    expect(() => subWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string or number');
    expect(() => subWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string or number');
    expect(subWorklet(ZERO, ZERO)).toBe(ZERO);
    expect(subWorklet(VALUE_A, ZERO)).toBe(VALUE_A);
    expect(subWorklet(ZERO, VALUE_B)).toBe(`-${VALUE_B}`);
    expect(subWorklet(NEGATIVE_VALUE, ZERO)).toBe(NEGATIVE_VALUE);
    expect(subWorklet(VALUE_A, VALUE_B)).toBe(RESULTS.sub);
    expect(subWorklet(Number(VALUE_A), VALUE_B)).toBe(RESULTS.sub);
    expect(subWorklet(VALUE_A, Number(VALUE_B))).toBe(RESULTS.sub);

    const subML = new BigNumber(VALUE_M).minus(VALUE_L).toFixed();
    expect(subWorklet(VALUE_M, VALUE_L)).toBe(subML);

    const subNN = new BigNumber(VALUE_N).minus(VALUE_N).toFixed();
    expect(subWorklet(VALUE_N, VALUE_N)).toBe(subNN);
  });

  test('mulWorklet', () => {
    expect(() => mulWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string or number');
    expect(() => mulWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string or number');
    expect(mulWorklet(ZERO, ZERO)).toBe(ZERO);
    expect(mulWorklet(VALUE_A, ZERO)).toBe(ZERO);
    expect(mulWorklet(ZERO, VALUE_B)).toBe(ZERO);
    expect(mulWorklet(VALUE_A, VALUE_B)).toBe(RESULTS.mul);
    expect(mulWorklet(Number(VALUE_A), VALUE_B)).toBe(RESULTS.mul);
    expect(mulWorklet(VALUE_A, Number(VALUE_B))).toBe(RESULTS.mul);
    expect(mulWorklet(VALUE_F, VALUE_G)).toBe(RESULTS.negativeExp);

    const mulLM = new BigNumber(VALUE_L).times(VALUE_M).toFixed();
    expect(mulWorklet(VALUE_L, VALUE_M)).toBe(mulLM);

    const mulN_001 = new BigNumber(VALUE_N).times('0.001').toFixed();
    expect(mulWorklet(VALUE_N, '0.001')).toBe(mulN_001);
  });

  test('divWorklet', () => {
    expect(() => divWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string or number');
    expect(() => divWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string or number');
    expect(() => divWorklet(ZERO, ZERO)).toThrow('Division by zero');
    expect(() => divWorklet(VALUE_A, ZERO)).toThrow('Division by zero');
    expect(divWorklet(ZERO, VALUE_B)).toBe(ZERO);
    expect(divWorklet(VALUE_A, VALUE_B)).toBe(RESULTS.div);
    expect(divWorklet(Number(VALUE_A), VALUE_B)).toBe(RESULTS.div);
    expect(divWorklet(VALUE_A, Number(VALUE_B))).toBe(RESULTS.div);
    expect(divWorklet(VALUE_I, VALUE_K)).toBe(RESULTS.divWithExp);
    expect(new BigNumber(VALUE_I).div(VALUE_K).toFixed()).toBe(RESULTS.divWithExp);

    const divML = new BigNumber(VALUE_M).div(VALUE_L).toFixed();
    expect(divWorklet(VALUE_M, VALUE_L)).toBe(divML);

    const divN_125 = new BigNumber(VALUE_N).div('-1.25').toFixed();
    expect(divWorklet(VALUE_N, '-1.25')).toBe(divN_125);
  });

  test('modWorklet', () => {
    expect(() => modWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string or number');
    expect(() => modWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string or number');
    expect(() => modWorklet(ZERO, ZERO)).toThrow('Division by zero');
    expect(() => modWorklet(VALUE_A, ZERO)).toThrow('Division by zero');
    expect(modWorklet(ZERO, VALUE_B)).toBe(ZERO);
    expect(modWorklet(VALUE_A, VALUE_B)).toBe(RESULTS.mod);
    expect(modWorklet(Number(VALUE_A), VALUE_B)).toBe(RESULTS.mod);
    expect(modWorklet(VALUE_A, Number(VALUE_B))).toBe(RESULTS.mod);

    const modML = new BigNumber(VALUE_M).mod(VALUE_L).toFixed();
    expect(modWorklet(VALUE_M, VALUE_L)).toBe(modML);

    const modN_500 = new BigNumber(VALUE_N).mod('500').toFixed();
    expect(modWorklet(VALUE_N, '500')).toBe(modN_500);
  });

  test('powWorklet', () => {
    expect(() => powWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string or number');
    expect(() => powWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string or number');
    expect(powWorklet(ZERO, VALUE_B)).toBe(ZERO);
    expect(powWorklet(VALUE_A, ZERO)).toBe(ONE);
    expect(powWorklet(VALUE_A, VALUE_C)).toBe(RESULTS.pow);
    expect(powWorklet(Number(VALUE_A), VALUE_C)).toBe(RESULTS.pow);
    expect(powWorklet(VALUE_A, Number(VALUE_C))).toBe(RESULTS.pow);
    expect(powWorklet(TEN, Number(MINUS_3))).toBe(RESULTS.negativePow);

    const powL_2 = new BigNumber(VALUE_L).pow(2).toFixed();
    expect(powWorklet(VALUE_L, 2)).toBe(powL_2);

    const powNegative = new BigNumber('-2.5').pow(3).toFixed();
    expect(powWorklet('-2.5', 3)).toBe(powNegative);
  });

  test('equalWorklet', () => {
    expect(() => equalWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string or number');
    expect(() => equalWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string or number');
    expect(equalWorklet(ZERO, ZERO)).toBe(true);
    expect(equalWorklet(VALUE_A, VALUE_A)).toBe(true);
    expect(equalWorklet(VALUE_A, VALUE_B)).toBe(false);
    expect(equalWorklet(NEGATIVE_VALUE, NEGATIVE_VALUE)).toBe(true);
    expect(equalWorklet(Number(VALUE_A), VALUE_A)).toBe(true);
    expect(equalWorklet(VALUE_A, Number(VALUE_A))).toBe(true);
    expect(equalWorklet('1.23e-5', '0.0000123')).toBe(true);
    expect(equalWorklet(VALUE_N, '-2500')).toBe(true);
  });

  test('greaterThanWorklet', () => {
    expect(() => greaterThanWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string or number');
    expect(() => greaterThanWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string or number');
    expect(greaterThanWorklet(VALUE_A, VALUE_B)).toBe(true);
    expect(greaterThanWorklet(VALUE_B, VALUE_A)).toBe(false);
    expect(greaterThanWorklet(VALUE_A, VALUE_A)).toBe(false);
    expect(greaterThanWorklet(NEGATIVE_VALUE, VALUE_A)).toBe(false);
    expect(greaterThanWorklet(Number(VALUE_A), VALUE_B)).toBe(true);
    expect(greaterThanWorklet(VALUE_A, Number(VALUE_B))).toBe(true);
    expect(greaterThanWorklet(VALUE_M, VALUE_L)).toBe(true);
    expect(greaterThanWorklet(VALUE_N, '0')).toBe(false);
  });

  test('greaterThanOrEqualToWorklet', () => {
    expect(() => greaterThanOrEqualToWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string or number');
    expect(() => greaterThanOrEqualToWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string or number');
    expect(greaterThanOrEqualToWorklet(VALUE_A, VALUE_B)).toBe(true);
    expect(greaterThanOrEqualToWorklet(VALUE_B, VALUE_A)).toBe(false);
    expect(greaterThanOrEqualToWorklet(VALUE_A, VALUE_A)).toBe(true);
    expect(greaterThanOrEqualToWorklet(NEGATIVE_VALUE, VALUE_A)).toBe(false);
    expect(greaterThanOrEqualToWorklet(Number(VALUE_A), VALUE_B)).toBe(true);
    expect(greaterThanOrEqualToWorklet(VALUE_A, Number(VALUE_B))).toBe(true);
    expect(greaterThanOrEqualToWorklet(VALUE_L, VALUE_L)).toBe(true);
    expect(greaterThanOrEqualToWorklet(VALUE_N, '-3000')).toBe(true);
  });

  test('lessThanWorklet', () => {
    expect(() => lessThanWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string or number');
    expect(() => lessThanWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string or number');
    expect(lessThanWorklet(VALUE_A, VALUE_B)).toBe(false);
    expect(lessThanWorklet(VALUE_B, VALUE_A)).toBe(true);
    expect(lessThanWorklet(VALUE_A, VALUE_A)).toBe(false);
    expect(lessThanWorklet(NEGATIVE_VALUE, VALUE_A)).toBe(true);
    expect(lessThanWorklet(Number(VALUE_A), VALUE_B)).toBe(false);
    expect(lessThanWorklet(VALUE_A, Number(VALUE_B))).toBe(false);
    expect(lessThanWorklet(VALUE_L, VALUE_M)).toBe(true);
    expect(lessThanWorklet(VALUE_N, '-2400')).toBe(true);
  });

  test('lessThanOrEqualToWorklet', () => {
    expect(() => lessThanOrEqualToWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string or number');
    expect(() => lessThanOrEqualToWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string or number');
    expect(lessThanOrEqualToWorklet(VALUE_A, VALUE_B)).toBe(false);
    expect(lessThanOrEqualToWorklet(VALUE_B, VALUE_A)).toBe(true);
    expect(lessThanOrEqualToWorklet(VALUE_A, VALUE_A)).toBe(true);
    expect(lessThanOrEqualToWorklet(NEGATIVE_VALUE, VALUE_A)).toBe(true);
    expect(lessThanOrEqualToWorklet(Number(VALUE_A), VALUE_B)).toBe(false);
    expect(lessThanOrEqualToWorklet(VALUE_A, Number(VALUE_B))).toBe(false);
    expect(lessThanOrEqualToWorklet(VALUE_L, VALUE_L)).toBe(true);
    expect(lessThanOrEqualToWorklet(VALUE_N, '-2500')).toBe(true);
  });

  test('toFixedWorklet', () => {
    expect(toFixedWorklet(VALUE_A, 2)).toBe(RESULTS.toFixed);
    expect(toFixedWorklet(Number(VALUE_A), 2)).toBe(RESULTS.toFixed);

    const bigO = new BigNumber(VALUE_O);
    const fixedO = bigO.toFixed(18);
    expect(toFixedWorklet(VALUE_O, 18)).toBe(fixedO);

    const bigP = new BigNumber(VALUE_P);
    const fixedP6 = bigP.toFixed(6);
    expect(toFixedWorklet(VALUE_P, 6)).toBe(fixedP6);

    // Test negative numbers
    const values = [
      { num: '-0.121235', expected: '-0.12', decimalPlaces: 2 },
      { num: '-1.345678', expected: '-1.346', decimalPlaces: 3 },
    ];
    values.forEach(({ num, expected, decimalPlaces }) => {
      expect(toFixedWorklet(num, decimalPlaces)).toBe(expected);
      expect(toFixedWorklet(Number(num), decimalPlaces)).toBe(expected);
    });
  });

  test('ceilWorklet', () => {
    expect(ceilWorklet(VALUE_A)).toBe(RESULTS.ceil);
    expect(ceilWorklet(Number(VALUE_A))).toBe(RESULTS.ceil);
    expect(ceilWorklet(VALUE_L)).toBe('1');
    expect(ceilWorklet(VALUE_N)).toBe('-2499');
  });

  test('floorWorklet', () => {
    expect(floorWorklet(VALUE_A)).toBe(RESULTS.floor);
    expect(floorWorklet(Number(VALUE_A))).toBe(RESULTS.floor);
    expect(floorWorklet(VALUE_M)).toBe('0');
    expect(floorWorklet(VALUE_N)).toBe('-2500');
  });

  test('roundWorklet', () => {
    expect(roundWorklet(VALUE_A)).toBe(RESULTS.floor);
    expect(roundWorklet(VALUE_D)).toBe(RESULTS.ceil);
    expect(roundWorklet(Number(VALUE_A))).toBe(RESULTS.floor);
    expect(roundWorklet(Number(VALUE_D))).toBe(RESULTS.ceil);
    expect(roundWorklet(VALUE_L)).toBe('0');
    expect(roundWorklet('-2500.4')).toBe('-2500');

    const roundedNegative = new BigNumber('-2500.5').toFixed(0);
    expect(roundWorklet('-2500.5')).toBe(roundedNegative);
  });

  test('toScaledIntegerWorklet', () => {
    expect(toScaledIntegerWorklet(VALUE_E, 18)).toBe(RESULTS.toScaledInteger);

    const scaledL8 = new BigNumber(VALUE_L).shiftedBy(8).toFixed(0);
    expect(toScaledIntegerWorklet(VALUE_L, 8)).toBe(scaledL8);

    const scaledN2 = new BigNumber(VALUE_N).shiftedBy(2).toFixed(0);
    expect(toScaledIntegerWorklet(VALUE_N, 2)).toBe(scaledN2);
  });

  test('orderOfMagnitude', () => {
    [
      VALUE_H,
      VALUE_L,
      VALUE_M,
      VALUE_N,
      VALUE_O,
      VALUE_P,
      '12500',
      '5000',
      '500',
      '50',
      '97.29560620602980607032',
      '0.6',
      '0.04219495',
      '0.00133253382018097672',
      '0.00064470276596066749',
    ].forEach(value => {
      const bigNumberResult = new BigNumber(value).e;
      expect(orderOfMagnitudeWorklet(value)).toBe(bigNumberResult);
    });

    expect(orderOfMagnitudeWorklet(VALUE_H)).toBe(Number(RESULTS.orderOfMagnitude));
  });

  test('exponents', () => {
    expect(new BigNumber(VALUE_L).plus(VALUE_M).toFixed()).toBe(sumWorklet(VALUE_L, VALUE_M));
    expect(new BigNumber(VALUE_N).minus(ONE_HUNDRED).toFixed()).toBe(subWorklet(VALUE_N, ONE_HUNDRED));
    expect(new BigNumber(VALUE_L).times(VALUE_M).toFixed()).toBe(mulWorklet(VALUE_L, VALUE_M));
    expect(new BigNumber(VALUE_M).div(VALUE_L).toFixed()).toBe(divWorklet(VALUE_M, VALUE_L));
    expect(new BigNumber(VALUE_M).mod(VALUE_L).toFixed()).toBe(modWorklet(VALUE_M, VALUE_L));
  });
});

describe('BigNumber', () => {
  test('sum', () => {
    expect(new BigNumber(VALUE_A).plus(VALUE_B).toString()).toBe(RESULTS.sum);
  });

  test('sub', () => {
    expect(new BigNumber(VALUE_A).minus(VALUE_B).toString()).toBe(RESULTS.sub);
  });

  test('mul', () => {
    expect(new BigNumber(VALUE_A).multipliedBy(VALUE_B).toString()).toBe(RESULTS.mul);
  });

  test('div', () => {
    expect(new BigNumber(VALUE_A).dividedBy(VALUE_B).toString()).toBe(RESULTS.div);
  });

  test('mod', () => {
    expect(new BigNumber(VALUE_A).mod(VALUE_B).toString()).toBe(RESULTS.mod);
  });

  test('pow', () => {
    expect(new BigNumber(VALUE_A).pow(VALUE_C).toString()).toBe(RESULTS.pow);
  });

  test('equal', () => {
    expect(new BigNumber(VALUE_A).eq(VALUE_B)).toBe(false);
    expect(new BigNumber(VALUE_A).eq(VALUE_A)).toBe(true);
  });

  test('greaterThan', () => {
    expect(new BigNumber(VALUE_A).gt(VALUE_B)).toBe(true);
    expect(new BigNumber(VALUE_B).gt(VALUE_A)).toBe(false);
  });

  test('greaterThanOrEqualTo', () => {
    expect(new BigNumber(VALUE_A).gte(VALUE_B)).toBe(true);
    expect(new BigNumber(VALUE_B).gte(VALUE_A)).toBe(false);
    expect(new BigNumber(VALUE_A).gte(VALUE_A)).toBe(true);
  });

  test('lessThan', () => {
    expect(new BigNumber(VALUE_A).lt(VALUE_B)).toBe(false);
    expect(new BigNumber(VALUE_B).lt(VALUE_A)).toBe(true);
  });

  test('lessThanOrEqualTo', () => {
    expect(new BigNumber(VALUE_A).lte(VALUE_B)).toBe(false);
    expect(new BigNumber(VALUE_B).lte(VALUE_A)).toBe(true);
    expect(new BigNumber(VALUE_A).lte(VALUE_A)).toBe(true);
  });

  test('toScaledInteger', () => {
    expect(new BigNumber(VALUE_E).shiftedBy(18).toFixed(0)).toBe(RESULTS.toScaledInteger);
  });
});
