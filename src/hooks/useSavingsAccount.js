import { useQuery } from '@apollo/client';
import { get, keyBy, property, toLower } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { compoundClient } from '../apollo/client';
import {
  COMPOUND_ACCOUNT_QUERY,
  COMPOUND_ALL_MARKETS_QUERY,
} from '../apollo/queries';
import { parseAssetName, parseAssetSymbol } from '../parsers/accounts';

// const pollInterval = 15000;

export default function useSavingsAccount(pollInterval = 0) {
  console.log('[USE SAVINGS ACCT]');
  const { accountAddress, tokenOverrides } = useSelector(
    ({ data, settings }) => ({
      accountAddress: settings.accountAddress,
      tokenOverrides: data.tokenOverrides,
    })
  );

  const marketsQuery = useQuery(COMPOUND_ALL_MARKETS_QUERY, {
    client: compoundClient,
    pollInterval,
  });

  const tokenQuery = useQuery(COMPOUND_ACCOUNT_QUERY, {
    client: compoundClient,
    pollInterval,
    skip: !toLower(accountAddress),
    variables: { id: toLower(accountAddress) },
  });

  console.log('[USE SAVINGS] token query', tokenQuery);
  const tokens = useMemo(() => {
    console.log('[SAVINGS MEMO]');
    const markets = keyBy(
      get(marketsQuery, 'data.markets', []),
      property('id')
    );
    const accountTokens = get(tokenQuery, 'data.account.tokens', []);
    return accountTokens.map(token => {
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
  }, [marketsQuery, tokenOverrides, tokenQuery]);
  console.log('[SAVINGS]', tokens);

  return tokens;
}
