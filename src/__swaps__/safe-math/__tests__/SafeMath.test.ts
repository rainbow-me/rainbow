import { sum, sub, mul, div, mod, pow } from '../SafeMath';
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

describe('SafeMath', () => {
  test('sum', () => {
    expect(sum(VALUE_A, VALUE_B)).toBe(RESULTS.sum);
  });

  test('sub', () => {
    expect(sub(VALUE_A, VALUE_B)).toBe(RESULTS.sub);
  });

  test('mul', () => {
    expect(mul(VALUE_A, VALUE_B)).toBe(RESULTS.mul);
  });

  test('div', () => {
    expect(div(VALUE_A, VALUE_B)).toBe(RESULTS.div);
  });

  test('mod', () => {
    expect(mod(VALUE_A, VALUE_B)).toBe(RESULTS.mod);
  });
  test('pow', () => {
    expect(pow(VALUE_A, VALUE_C)).toBe(RESULTS.pow);
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
});
