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
  log10Worklet,
  modWorklet,
  mulWorklet,
  powWorklet,
  roundWorklet,
  subWorklet,
  sumWorklet,
  toFixedWorklet,
} from '../SafeMath';

const RESULTS = {
  sum: '1247244.585',
  sub: '1239606.105',
  mul: '4748939814.6378',
  div: '325.56878986395199044836',
  mod: '2172.345',
  pow: '1546106588588.369025',
  log10: '0.30102999566398124032',
  toFixed: '1243425.35',
  ceil: '1243426',
  floor: '1243425',
};

const VALUE_A = '1243425.345';
const VALUE_B = '3819.24';
const VALUE_C = '2';
const VALUE_D = '1243425.745';
const NEGATIVE_VALUE = '-2412.12';
const ZERO = '0';
const ONE = '1';
const NON_NUMERIC_STRING = 'abc';

describe('SafeMath', () => {
  test('sumWorklet', () => {
    expect(() => sumWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => sumWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(sumWorklet(ZERO, ZERO)).toBe(ZERO);
    expect(sumWorklet(VALUE_A, ZERO)).toBe(VALUE_A);
    expect(sumWorklet(ZERO, VALUE_B)).toBe(VALUE_B);
    expect(sumWorklet(VALUE_A, VALUE_B)).toBe(RESULTS.sum);
  });

  test('subWorklet', () => {
    expect(() => subWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => subWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(subWorklet(ZERO, ZERO)).toBe(ZERO);
    expect(subWorklet(VALUE_A, ZERO)).toBe(VALUE_A);
    expect(subWorklet(ZERO, VALUE_B)).toBe(`-${VALUE_B}`);
    expect(subWorklet(NEGATIVE_VALUE, ZERO)).toBe(NEGATIVE_VALUE);
    expect(subWorklet(VALUE_A, VALUE_B)).toBe(RESULTS.sub);
  });

  test('mulWorklet', () => {
    expect(() => mulWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => mulWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(mulWorklet(ZERO, ZERO)).toBe(ZERO);
    expect(mulWorklet(VALUE_A, ZERO)).toBe(ZERO);
    expect(mulWorklet(ZERO, VALUE_B)).toBe(ZERO);
    expect(mulWorklet(VALUE_A, VALUE_B)).toBe(RESULTS.mul);
  });

  test('divWorklet', () => {
    expect(() => divWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => divWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(() => divWorklet(ZERO, ZERO)).toThrow('Division by zero');
    expect(() => divWorklet(VALUE_A, ZERO)).toThrow('Division by zero');
    expect(divWorklet(ZERO, VALUE_B)).toBe(ZERO);
    expect(divWorklet(VALUE_A, VALUE_B)).toBe(RESULTS.div);
  });

  test('modWorklet', () => {
    expect(() => modWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => modWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(() => modWorklet(ZERO, ZERO)).toThrow('Division by zero');
    expect(() => modWorklet(VALUE_A, ZERO)).toThrow('Division by zero');
    expect(modWorklet(ZERO, VALUE_B)).toBe(ZERO);
    expect(modWorklet(VALUE_A, VALUE_B)).toBe(RESULTS.mod);
  });

  test('powWorklet', () => {
    expect(() => powWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => powWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(powWorklet(ZERO, VALUE_B)).toBe(ZERO);
    expect(powWorklet(VALUE_A, ZERO)).toBe(ONE);
    expect(powWorklet(ZERO, VALUE_B)).toBe(ZERO);
    expect(powWorklet(VALUE_A, VALUE_C)).toBe(RESULTS.pow);
    expect(powWorklet(10, 4)).toBe('10000');
  });

  test('log10Worklet', () => {
    expect(() => log10Worklet(NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(() => log10Worklet(ZERO)).toThrow('Argument must be greater than 0');
    expect(log10Worklet(VALUE_C)).toBe(RESULTS.log10);
    expect(log10Worklet(Number(VALUE_C))).toBe(RESULTS.log10);
  });

  test('equalWorklet', () => {
    expect(() => equalWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => equalWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(equalWorklet(ZERO, ZERO)).toBe(true);
    expect(equalWorklet(VALUE_A, VALUE_A)).toBe(true);
    expect(equalWorklet(VALUE_A, VALUE_B)).toBe(false);
    expect(equalWorklet(NEGATIVE_VALUE, NEGATIVE_VALUE)).toBe(true);
  });

  test('greaterThanWorklet', () => {
    expect(() => greaterThanWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => greaterThanWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(greaterThanWorklet(VALUE_A, VALUE_B)).toBe(true);
    expect(greaterThanWorklet(VALUE_B, VALUE_A)).toBe(false);
    expect(greaterThanWorklet(VALUE_A, VALUE_A)).toBe(false);
    expect(greaterThanWorklet(NEGATIVE_VALUE, VALUE_A)).toBe(false);
  });

  test('greaterThanOrEqualToWorklet', () => {
    expect(() => greaterThanOrEqualToWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => greaterThanOrEqualToWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(greaterThanOrEqualToWorklet(VALUE_A, VALUE_B)).toBe(true);
    expect(greaterThanOrEqualToWorklet(VALUE_B, VALUE_A)).toBe(false);
    expect(greaterThanOrEqualToWorklet(VALUE_A, VALUE_A)).toBe(true);
    expect(greaterThanOrEqualToWorklet(NEGATIVE_VALUE, VALUE_A)).toBe(false);
  });

  test('lessThanWorklet', () => {
    expect(() => lessThanWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => lessThanWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(lessThanWorklet(VALUE_A, VALUE_B)).toBe(false);
    expect(lessThanWorklet(VALUE_B, VALUE_A)).toBe(true);
    expect(lessThanWorklet(VALUE_A, VALUE_A)).toBe(false);
    expect(lessThanWorklet(NEGATIVE_VALUE, VALUE_A)).toBe(true);
  });

  test('lessThanOrEqualToWorklet', () => {
    expect(() => lessThanOrEqualToWorklet(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => lessThanOrEqualToWorklet(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(lessThanOrEqualToWorklet(VALUE_A, VALUE_B)).toBe(false);
    expect(lessThanOrEqualToWorklet(VALUE_B, VALUE_A)).toBe(true);
    expect(lessThanOrEqualToWorklet(VALUE_A, VALUE_A)).toBe(true);
    expect(lessThanOrEqualToWorklet(NEGATIVE_VALUE, VALUE_A)).toBe(true);
  });

  test('toFixedWorklet', () => {
    expect(toFixedWorklet(VALUE_A, 2)).toBe(RESULTS.toFixed);
  });

  test('ceilWorklet', () => {
    expect(ceilWorklet(VALUE_A)).toBe(RESULTS.ceil);
  });

  test('floorWorklet', () => {
    expect(floorWorklet(VALUE_A)).toBe(RESULTS.floor);
  });

  test('roundWorklet', () => {
    expect(roundWorklet(VALUE_A)).toBe(RESULTS.floor);
    expect(roundWorklet(VALUE_D)).toBe(RESULTS.ceil);
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
});
