import { safeSum } from '../safeSum';

it('safeSum sums selected raw values', () => {
  const values = [{ value: '10' }, { value: 5 }, undefined, { value: null }, { value: ' 7 ' }, { value: '3.14' }] as const;

  const result = safeSum(values, value => value?.value);

  expect(result).toBeCloseTo(25.14);
});

it('safeSum returns zero for undefined values', () => {
  const mapper = jest.fn();

  const result = safeSum(undefined, mapper);

  expect(result).toBe(0);
  expect(mapper).not.toHaveBeenCalled();
});
