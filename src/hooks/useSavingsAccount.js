import { useQuery } from '@apollo/client';
import { find, get, keyBy, orderBy, property, toLower } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { compoundClient } from '../apollo/client';
import {
  COMPOUND_ACCOUNT_QUERY,
  COMPOUND_ALL_MARKETS_QUERY,
} from '../apollo/queries';
import { multiply } from '../helpers/utilities';
import { parseAssetName, parseAssetSymbol } from '../parsers/accounts';
import { CDAI_CONTRACT, SAI_ADDRESS } from '../references';

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
    const markets = keyBy(
      get(marketsQuery, 'data.markets', []),
      property('id')
    );

    let accountTokens = get(tokenQuery, 'data.account.tokens', []);

    accountTokens = accountTokens.map(token => {
      const [cTokenAddress] = token.id.split('-');
      const { name, symbol, ...marketData } = markets[cTokenAddress] || {};

      // Rename old DAI as SAI
      marketData.underlyingSymbol =
        marketData.underlyingAddress === SAI_ADDRESS
          ? 'SAI'
          : marketData.underlyingSymbol;

      const ethPrice = multiply(
        marketData.underlyingPrice,
        token.supplyBalanceUnderlying
      );

      return {
        ...marketData,
        ...token,
        cTokenAddress,
        ethPrice,
        name: parseAssetName(name, cTokenAddress, tokenOverrides),
        symbol: parseAssetSymbol(symbol, cTokenAddress, tokenOverrides),
      };
    });

    accountTokens = orderBy(accountTokens, ['ethPrice'], ['desc']);

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
