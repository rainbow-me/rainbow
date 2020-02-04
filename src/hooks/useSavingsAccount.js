import { get, keyBy, property } from 'lodash';
import { useQuery } from '@apollo/client';
import {
  COMPOUND_ACCOUNT_QUERY,
  COMPOUND_MARKET_QUERY,
} from '../apollo/queries';
import { parseAssetName, parseAssetSymbol } from '../parsers/accounts';
import useAccountData from './useAccountData';

export default function useSavingsAccount() {
  const { accountAddress, tokenOverrides } = useAccountData();

  const marketsQuery = useQuery(COMPOUND_MARKET_QUERY, { pollInterval: 5000 });
  const markets = keyBy(get(marketsQuery, 'data.markets', []), property('id'));

  console.log('marketsQuery', marketsQuery);

  const tokenQuery = useQuery(COMPOUND_ACCOUNT_QUERY, {
    pollInterval: 5000,
    skip: !accountAddress.toLowerCase(),
    variables: { id: accountAddress.toLowerCase() },
  });

  console.log('tokenQuery', tokenQuery);

  const tokens = get(tokenQuery, 'data.account.tokens', []).map(token => {
    const address = token.id.split('-')[0];
    const { name, symbol, ...marketData } = markets[address] || {};

    return {
      ...marketData,
      ...token,
      cTokenAddress: address,
      name: parseAssetName(name, address, tokenOverrides),
      symbol: parseAssetSymbol(symbol, address, tokenOverrides),
    };
  });

  return tokens;
}
