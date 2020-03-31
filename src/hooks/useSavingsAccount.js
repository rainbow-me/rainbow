import { useQuery } from '@apollo/client';
import { concat, find, get, keyBy, orderBy, property, toLower } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { compoundClient } from '../apollo/client';
import { COMPOUND_ACCOUNT_AND_MARKET_QUERY } from '../apollo/queries';
import { getSavings, saveSavings } from '../handlers/localstorage/accountLocal';
import AssetTypes from '../helpers/assetTypes';
import { multiply } from '../helpers/utilities';
import { useAccountSettings } from '../hooks';
import { parseAssetName, parseAssetSymbol } from '../parsers/accounts';
import { CDAI_CONTRACT, DAI_ADDRESS } from '../references';

const COMPOUND_QUERY_INTERVAL = 10000;

const getMarketData = (marketData, tokenOverrides) => {
  const underlying = getUnderlyingData(marketData, tokenOverrides);
  const cToken = getCTokenData(marketData, tokenOverrides);
  const { exchangeRate, supplyRate, underlyingPrice } = marketData;

  return {
    cToken,
    exchangeRate,
    supplyRate,
    underlying,
    underlyingPrice,
  };
};

const getCTokenData = (marketData, tokenOverrides) => {
  const { id: cTokenAddress, name, symbol } = marketData;

  return {
    address: cTokenAddress,
    decimals: 8,
    name: parseAssetName(name, cTokenAddress, tokenOverrides),
    symbol: parseAssetSymbol(symbol, cTokenAddress, tokenOverrides),
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

export default function useSavingsAccount(includeDefaultDai = false) {
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

      const {
        cToken,
        exchangeRate,
        supplyRate,
        underlying,
        underlyingPrice,
      } = getMarketData(marketData, tokenOverrides);

      const ethPrice = multiply(underlyingPrice, token.supplyBalanceUnderlying);

      const {
        cTokenBalance,
        lifetimeSupplyInterestAccrued,
        supplyBalanceUnderlying,
      } = token;

      return {
        cToken,
        cTokenBalance,
        ethPrice,
        exchangeRate,
        lifetimeSupplyInterestAccrued,
        supplyBalanceUnderlying,
        supplyRate,
        type: AssetTypes.cToken,
        underlying,
        underlyingPrice,
      };
    });

    accountTokens = orderBy(accountTokens, ['ethPrice'], ['desc']);

    if (accountTokens.length) {
      saveSavings(accountTokens, accountAddress, network);
    }

    const accountHasCDAI = find(
      accountTokens,
      token => token.underlying.address === DAI_ADDRESS
    );

    const shouldAddDai =
      includeDefaultDai && !accountHasCDAI && markets[CDAI_CONTRACT];

    if (accountTokens.length && shouldAddDai) {
      const DAIMarketData = getMarketData(
        markets[CDAI_CONTRACT],
        tokenOverrides
      );
      return concat(accountTokens, { ...DAIMarketData });
    }
    if (accountTokens.length) {
      return accountTokens;
    }
    if (shouldAddDai) {
      const DAIMarketData = getMarketData(
        markets[CDAI_CONTRACT],
        tokenOverrides
      );
      return concat(accountTokensBackup, { ...DAIMarketData });
    }
    return accountTokensBackup;
  }, [
    accountAddress,
    accountTokensBackup,
    compoundQuery,
    includeDefaultDai,
    network,
    tokenOverrides,
  ]);

  return tokens;
}
