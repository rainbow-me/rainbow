import { filterList } from '../search';

it('filterListSimpleArray', () => {
  const list = ['a dog', 'black cat'];
  const searchPhrase = 'cat';
  const result = filterList(list, searchPhrase);
  expect(result.length).toBe(1);
});

it('filterListWithParameter', () => {
  const list = [
    { name: 'Ethereum', symbol: 'ETH' },
    { name: '0x Protocol Token', symbol: 'ZRX' },
  ];
  const searchPhrase = 'eth';
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'string[]' is not assignable to p... Remove this comment to see the full error message
  const result = filterList(list, searchPhrase, ['name']);
  expect(result.length).toBe(1);
});
