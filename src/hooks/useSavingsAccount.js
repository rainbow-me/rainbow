import { useQuery } from '@apollo/client';
import { find, get, keyBy, property, toLower } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { compoundClient } from '../apollo/client';
import {
  COMPOUND_ACCOUNT_QUERY,
  COMPOUND_ALL_MARKETS_QUERY,
} from '../apollo/queries';
import { parseAssetName, parseAssetSymbol } from '../parsers/accounts';
import { CDAI_CONTRACT } from '../references';

// const pollInterval = 15000;

export default function useSavingsAccount(pollInterval = 0) {
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

  const tokens = useMemo(() => {
    console.log('[SAVINGS MEMO]');
    const markets = keyBy(
      get(marketsQuery, 'data.markets', []),
      property('id')
    );
    let accountTokens = get(tokenQuery, 'data.account.tokens', []);
    accountTokens = accountTokens.map(token => {
      const [cTokenAddress] = token.id.split('-');
      const { name, symbol, ...marketData } = markets[cTokenAddress] || {};

      return {
        ...marketData,
        ...token,
        cTokenAddress,
        name: parseAssetName(name, cTokenAddress, tokenOverrides),
        symbol: parseAssetSymbol(symbol, cTokenAddress, tokenOverrides),
      };
    });
    console.log('Account tokens', accountTokens);
    // TODO JIN test by replacing the DAI with an empty one
    const accountHasCDAI = find(
      accountTokens,
      token => token.cTokenAddress === CDAI_CONTRACT
    );
    if (!accountHasCDAI) {
      const DAIMarketData = {
        ...markets[CDAI_CONTRACT],
        cTokenAddress: CDAI_CONTRACT,
      };
      accountTokens.push({ ...DAIMarketData });
    }

    return accountTokens;
  }, [marketsQuery, tokenOverrides, tokenQuery]);

  return tokens;
}
