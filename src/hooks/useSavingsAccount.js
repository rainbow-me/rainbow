import { useQuery } from '@apollo/client';
import { find, get, keyBy, orderBy, property, toLower } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { compoundClient } from '../apollo/client';
import { COMPOUND_ACCOUNT_AND_MARKET_QUERY } from '../apollo/queries';
import { getSavings, saveSavings } from '../handlers/localstorage/accountLocal';
import { multiply } from '../helpers/utilities';
import { useAccountSettings } from '../hooks';
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
  const [accountTokensBackup, setAccountTokensBackup] = useState([]);

  const { tokenOverrides } = useSelector(({ data }) => ({
    tokenOverrides: data.tokenOverrides,
  }));

  const { accountAddress, network } = useAccountSettings();

  const compoundQuery = useQuery(COMPOUND_ACCOUNT_AND_MARKET_QUERY, {
    client: compoundClient,
    pollInterval: COMPOUND_QUERY_INTERVAL,
    skip: !toLower(accountAddress),
    variables: { id: toLower(accountAddress) },
  });

  const getSavingsFromStorage = useCallback(async () => {
    if (accountAddress) {
      const savingsAccountLocal = await getSavings(accountAddress, network);
      setAccountTokensBackup(savingsAccountLocal);
    }
  }, [accountAddress, network]);

  useEffect(() => {
    getSavingsFromStorage();
  }, [accountAddress, getSavingsFromStorage, network]);

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

    if (accountTokens.length) {
      saveSavings(accountTokens, accountAddress, network);
    }
    return (accountTokens.length && accountTokens) || accountTokensBackup;
  }, [
    accountAddress,
    accountTokensBackup,
    compoundQuery,
    network,
    tokenOverrides,
  ]);

  return tokens;
}
