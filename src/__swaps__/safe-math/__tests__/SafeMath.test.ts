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
  divWithExp: '100000000000000000000000',
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
const MINUS_3 = '-3';
const NON_NUMERIC_STRING = 'abc';

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
  });

  test('toFixedWorklet', () => {
    expect(toFixedWorklet(VALUE_A, 2)).toBe(RESULTS.toFixed);
    expect(toFixedWorklet(Number(VALUE_A), 2)).toBe(RESULTS.toFixed);
  });

  test('ceilWorklet', () => {
    expect(ceilWorklet(VALUE_A)).toBe(RESULTS.ceil);
    expect(ceilWorklet(Number(VALUE_A))).toBe(RESULTS.ceil);
  });

  test('floorWorklet', () => {
    expect(floorWorklet(VALUE_A)).toBe(RESULTS.floor);
    expect(floorWorklet(Number(VALUE_A))).toBe(RESULTS.floor);
  });

  test('roundWorklet', () => {
    expect(roundWorklet(VALUE_A)).toBe(RESULTS.floor);
    expect(roundWorklet(VALUE_D)).toBe(RESULTS.ceil);
    expect(roundWorklet(Number(VALUE_A))).toBe(RESULTS.floor);
    expect(roundWorklet(Number(VALUE_D))).toBe(RESULTS.ceil);
  });

  test('toScaledIntegerWorklet', () => {
    expect(toScaledIntegerWorklet(VALUE_E, 18)).toBe(RESULTS.toScaledInteger);
  });

  test('orderOfMagnitude', () => {
    expect(orderOfMagnitudeWorklet(VALUE_H)).toBe(Number(RESULTS.orderOfMagnitude));
    expect(orderOfMagnitudeWorklet('12500')).toBe(4);
    expect(orderOfMagnitudeWorklet('5000')).toBe(3);
    expect(orderOfMagnitudeWorklet('500')).toBe(2);
    expect(orderOfMagnitudeWorklet('50')).toBe(1);
    expect(orderOfMagnitudeWorklet('97.29560620602980607032')).toBe(1);
    expect(orderOfMagnitudeWorklet('0.6')).toBe(-1);
    expect(orderOfMagnitudeWorklet('0.04219495')).toBe(-2);
    expect(orderOfMagnitudeWorklet('0.00133253382018097672')).toBe(-3);
    expect(orderOfMagnitudeWorklet('0.00064470276596066749')).toBe(-4);
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
