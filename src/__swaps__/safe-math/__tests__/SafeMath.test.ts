import { sum, sub, mul, div, mod, pow, equal, greaterThan, greaterThanOrEqualTo, lessThan, lessThanOrEqualTo } from '../SafeMath';
import BigNumber from 'bignumber.js';

const RESULTS = {
  sum: '1247244.585',
  sub: '1239606.105',
  mul: '4748939814.6378',
  div: '325.56878986395199044836',
  mod: '2172.345',
  pow: '1546106588588.369025',
};

const VALUE_A = '1243425.345';
const VALUE_B = '3819.24';
const VALUE_C = '2';
const NEGATIVE_VALUE = '-2412.12';
const ZERO = '0';
const ONE = '1';
const NON_NUMERIC_STRING = 'abc';

describe('SafeMath', () => {
  test('sum', () => {
    expect(() => sum(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => sum(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(sum(ZERO, ZERO)).toBe(ZERO);
    expect(sum(VALUE_A, ZERO)).toBe(VALUE_A);
    expect(sum(ZERO, VALUE_B)).toBe(VALUE_B);
    expect(sum(VALUE_A, VALUE_B)).toBe(RESULTS.sum);
  });

  test('sub', () => {
    expect(() => sub(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => sub(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(sub(ZERO, ZERO)).toBe(ZERO);
    expect(sub(VALUE_A, ZERO)).toBe(VALUE_A);
    expect(sub(ZERO, VALUE_B)).toBe(`-${VALUE_B}`);
    expect(sub(NEGATIVE_VALUE, ZERO)).toBe(NEGATIVE_VALUE);
    expect(sub(VALUE_A, VALUE_B)).toBe(RESULTS.sub);
  });

  test('mul', () => {
    expect(() => mul(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => mul(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(mul(ZERO, ZERO)).toBe(ZERO);
    expect(mul(VALUE_A, ZERO)).toBe(ZERO);
    expect(mul(ZERO, VALUE_B)).toBe(ZERO);
    expect(mul(VALUE_A, VALUE_B)).toBe(RESULTS.mul);
  });

  test('div', () => {
    expect(() => div(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => div(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(() => div(ZERO, ZERO)).toThrow('Division by zero');
    expect(() => div(VALUE_A, ZERO)).toThrow('Division by zero');
    expect(div(ZERO, VALUE_B)).toBe(ZERO);
    expect(div(VALUE_A, VALUE_B)).toBe(RESULTS.div);
  });

  test('mod', () => {
    expect(() => mod(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => mod(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(() => mod(ZERO, ZERO)).toThrow('Division by zero');
    expect(() => mod(VALUE_A, ZERO)).toThrow('Division by zero');
    expect(mod(ZERO, VALUE_B)).toBe(ZERO);
    expect(mod(VALUE_A, VALUE_B)).toBe(RESULTS.mod);
  });

  test('pow', () => {
    expect(() => pow(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => pow(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(pow(ZERO, VALUE_B)).toBe(ZERO);
    expect(pow(VALUE_A, ZERO)).toBe(ONE);
    expect(pow(ZERO, VALUE_B)).toBe(ZERO);
    expect(pow(VALUE_A, VALUE_C)).toBe(RESULTS.pow);
  });

  test('equal', () => {
    expect(() => equal(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => equal(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(equal(ZERO, ZERO)).toBe(true);
    expect(equal(VALUE_A, VALUE_A)).toBe(true);
    expect(equal(VALUE_A, VALUE_B)).toBe(false);
    expect(equal(NEGATIVE_VALUE, NEGATIVE_VALUE)).toBe(true);
  });

  test('greaterThan', () => {
    expect(() => greaterThan(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => greaterThan(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(greaterThan(VALUE_A, VALUE_B)).toBe(true);
    expect(greaterThan(VALUE_B, VALUE_A)).toBe(false);
    expect(greaterThan(VALUE_A, VALUE_A)).toBe(false);
    expect(greaterThan(NEGATIVE_VALUE, VALUE_A)).toBe(false);
  });

  test('greaterThanOrEqualTo', () => {
    expect(() => greaterThanOrEqualTo(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => greaterThanOrEqualTo(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(greaterThanOrEqualTo(VALUE_A, VALUE_B)).toBe(true);
    expect(greaterThanOrEqualTo(VALUE_B, VALUE_A)).toBe(false);
    expect(greaterThanOrEqualTo(VALUE_A, VALUE_A)).toBe(true);
    expect(greaterThanOrEqualTo(NEGATIVE_VALUE, VALUE_A)).toBe(false);
  });

  test('lessThan', () => {
    expect(() => lessThan(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => lessThan(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(lessThan(VALUE_A, VALUE_B)).toBe(false);
    expect(lessThan(VALUE_B, VALUE_A)).toBe(true);
    expect(lessThan(VALUE_A, VALUE_A)).toBe(false);
    expect(lessThan(NEGATIVE_VALUE, VALUE_A)).toBe(true);
  });

  test('lessThanOrEqualTo', () => {
    expect(() => lessThanOrEqualTo(NON_NUMERIC_STRING, VALUE_B)).toThrow('Arguments must be a numeric string');
    expect(() => lessThanOrEqualTo(VALUE_A, NON_NUMERIC_STRING)).toThrow('Arguments must be a numeric string');
    expect(lessThanOrEqualTo(VALUE_A, VALUE_B)).toBe(false);
    expect(lessThanOrEqualTo(VALUE_B, VALUE_A)).toBe(true);
    expect(lessThanOrEqualTo(VALUE_A, VALUE_A)).toBe(true);
    expect(lessThanOrEqualTo(NEGATIVE_VALUE, VALUE_A)).toBe(true);
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
