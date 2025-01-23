import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { createUserNftsStore, UserNftsParams, UserNftsResponse } from '.';

const TEST_ADDRESS_1 = '0x1_TEST_ADDRESS';
const TEST_ADDRESS_2 = '0x2_TEST_ADDRESS';
const TEST_DATA = {
  [TEST_ADDRESS_1]: {
    [NftCollectionSortCriterion.Abc]: ['a', 'b', 'c'],
    [NftCollectionSortCriterion.FloorPrice]: [1, 2, 3],
    [NftCollectionSortCriterion.MostRecent]: ['last', 'middle', 'first'],
  },
  [TEST_ADDRESS_2]: {
    [NftCollectionSortCriterion.Abc]: ['d', 'e', 'f'],
    [NftCollectionSortCriterion.FloorPrice]: [4, 5, 6],
    [NftCollectionSortCriterion.MostRecent]: ['foo', 'bar', 'baz'],
  },
};

const testFetcher = async (params: UserNftsParams): Promise<unknown> => {
  const data = TEST_DATA[params.address as keyof typeof TEST_DATA][params.sortBy];
  return Promise.resolve({
    nfts: params.sortDirection === SortDirection.Asc ? data.reverse() : data,
    nftsMap: new Map(),
  });
};

// Wrapper to match the type
const fetcher: (params: UserNftsParams) => UserNftsResponse = params => {
  return testFetcher(params) as unknown as UserNftsResponse;
};

test('should exist', async () => {
  const store = createUserNftsStore({
    address: TEST_ADDRESS_1,
    fetcher,
    internal: true,
  });
  const nfts = store(s => s.nfts);
  expect(nfts).toStrictEqual(['last', 'middle', 'first']);
});
