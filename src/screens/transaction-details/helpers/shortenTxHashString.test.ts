import { shortenTxHashString } from '@/screens/transaction-details/helpers/shortenTxHashString';

const exampleTransactionHash = '0x30f2e457cd93d7091bc3acefe82d091363dfb00b0e6d2b3fefdbda4c6031d2a8';

test('converting long transaction hash into short ellipsized in the middle with 6 chars on each side', () => {
  expect(shortenTxHashString(exampleTransactionHash)).toEqual('0x30f2...31d2a8');
});
