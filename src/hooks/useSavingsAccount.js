import { useQuery } from '@apollo/client';
import { find, get, keyBy, orderBy, property, toLower } from 'lodash';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { compoundClient } from '../apollo/client';
import { COMPOUND_ACCOUNT_AND_MARKET_QUERY } from '../apollo/queries';
import { multiply } from '../helpers/utilities';
import { parseAssetName, parseAssetSymbol } from '../parsers/accounts';
import { CDAI_CONTRACT, DAI_ADDRESS } from '../references';

const COMPOUND_QUERY_INTERVAL = 10000;

const getMarketData = (marketData, tokenOverrides) => {
  const underlying = getUnderlyingData(marketData, tokenOverrides);
  const { supplyRate, underlyingPrice } = marketData;

  return {
    supplyRate,
    underlying,
    underlyingPrice,
  };
};

const getUnderlyingData = (marketData, tokenOverrides) => {
  const {
    underlyingAddress,
    underlyingDecimals,
    underlyingName,
    underlyingSymbol,
  } = marketData;

  return {
    address: underlyingAddress,
    decimals: underlyingDecimals,
    name: parseAssetName(underlyingName, underlyingAddress, tokenOverrides),
    symbol: parseAssetSymbol(
      underlyingSymbol,
      underlyingAddress,
      tokenOverrides
    ),
  };
};

export default function useSavingsAccount() {
  const { accountAddress, tokenOverrides } = useSelector(
    ({ data, settings }) => ({
      accountAddress: settings.accountAddress,
      tokenOverrides: data.tokenOverrides,
    })
  );

  const compoundQuery = useQuery(COMPOUND_ACCOUNT_AND_MARKET_QUERY, {
    client: compoundClient,
    pollInterval: COMPOUND_QUERY_INTERVAL,
    skip: !toLower(accountAddress),
    variables: { id: toLower(accountAddress) },
  });

  const tokens = useMemo(() => {
    const markets = keyBy(
      get(compoundQuery, 'data.markets', []),
      property('id')
    );

    let accountTokens = get(compoundQuery, 'data.account.tokens', []);

    accountTokens = accountTokens.map(token => {
      const [cTokenAddress] = token.id.split('-');
      const marketData = markets[cTokenAddress] || {};

      const { supplyRate, underlying, underlyingPrice } = getMarketData(
        marketData,
        tokenOverrides
      );

      const ethPrice = multiply(underlyingPrice, token.supplyBalanceUnderlying);

      const {
        cTokenBalance,
        lifetimeSupplyInterestAccrued,
        supplyBalanceUnderlying,
      } = token;

      return {
        cTokenBalance,
        ethPrice,
        lifetimeSupplyInterestAccrued,
        supplyBalanceUnderlying,
        supplyRate,
        underlying,
        underlyingPrice,
      };
    });

    accountTokens = orderBy(accountTokens, ['ethPrice'], ['desc']);

    const accountHasCDAI = find(
      accountTokens,
      token => token.underlying.address === DAI_ADDRESS
    );

    if (!accountHasCDAI && markets[CDAI_CONTRACT]) {
      const DAIMarketData = getMarketData(
        markets[CDAI_CONTRACT],
        tokenOverrides
      );
      accountTokens.push({ ...DAIMarketData });
    }

    return accountTokens;
  }, [compoundQuery, tokenOverrides]);

  return tokens;
}
