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
  const result = filterList(list, searchPhrase, ['name']);
  expect(result.length).toBe(1);
});
