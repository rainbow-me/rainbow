import { useQuery } from '@apollo/client';
import { get, keyBy, property } from 'lodash';
import { compoundClient } from '../apollo/client';
import {
  COMPOUND_ACCOUNT_QUERY,
  COMPOUND_ALL_MARKETS_QUERY,
} from '../apollo/queries';
import { parseAssetName, parseAssetSymbol } from '../parsers/accounts';
import useAccountData from './useAccountData';

// const pollInterval = 15000;

export default function useSavingsAccount() {
  console.log('[USE SAVINGS ACCT]');
  const { accountAddress, tokenOverrides } = useAccountData();

  const marketsQuery = useQuery(COMPOUND_ALL_MARKETS_QUERY, {
    client: compoundClient,
    //    pollInterval,
  });
  const markets = keyBy(get(marketsQuery, 'data.markets', []), property('id'));

  console.log('[USE SAVINGS] markets', markets);

  const tokenQuery = useQuery(COMPOUND_ACCOUNT_QUERY, {
    client: compoundClient,
    // pollInterval,
    skip: !accountAddress.toLowerCase(),
    variables: { id: accountAddress.toLowerCase() },
  });

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
