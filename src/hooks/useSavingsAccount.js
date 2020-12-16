import { useQuery } from '@apollo/client';
import {
  concat,
  find,
  isEmpty,
  isNil,
  keyBy,
  map,
  orderBy,
  toLower,
} from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { compoundClient } from '@rainbow-me/apollo/client';
import { COMPOUND_ACCOUNT_AND_MARKET_QUERY } from '@rainbow-me/apollo/queries';
import {
  getSavings,
  saveSavings,
} from '@rainbow-me/handlers/localstorage/accountLocal';
import AssetTypes from '@rainbow-me/helpers/assetTypes';
import { multiply } from '@rainbow-me/helpers/utilities';
import { parseAssetName, parseAssetSymbol } from '@rainbow-me/parsers/accounts';
import { CDAI_CONTRACT, DAI_ADDRESS } from '@rainbow-me/references';
import { getTokenMetadata } from '@rainbow-me/utils';

const COMPOUND_QUERY_INTERVAL = 120000; // 120 seconds

const getMarketData = marketData => {
  if (!marketData) return {};
  const underlying = getUnderlyingData(marketData);
  const cToken = getCTokenData(marketData);
  const { exchangeRate, supplyRate, underlyingPrice } = marketData;

  return {
    cToken,
    exchangeRate,
    supplyRate,
    underlying,
    underlyingPrice,
  };
};

const getCTokenData = marketData => {
  const {
    id: cTokenAddress,
    name: originalName,
    symbol: originalSymbol,
  } = marketData;
  const metadata = getTokenMetadata(cTokenAddress);
  const name = parseAssetName(metadata, originalName);
  const symbol = parseAssetSymbol(metadata, originalSymbol);

  return {
    address: cTokenAddress,
    decimals: 8,
    name,
    symbol,
  };
};

const getUnderlyingData = marketData => {
  const {
    underlyingAddress,
    underlyingDecimals,
    underlyingName,
    underlyingSymbol,
  } = marketData;
  const metadata = getTokenMetadata(underlyingAddress);
  const name = parseAssetName(metadata, underlyingName);
  const symbol = parseAssetSymbol(metadata, underlyingSymbol);

  return {
    address: underlyingAddress,
    decimals: underlyingDecimals,
    name,
    symbol,
  };
};

export default function useSavingsAccount(includeDefaultDai) {
  const [result, setResult] = useState({});
  const [backupSavings, setBackupSavings] = useState(null);

  const { accountAddress, network } = useAccountSettings();

  const hasAccountAddress = !!accountAddress;
  const { shouldRefetchSavings } = useSelector(
    ({ data: { shouldRefetchSavings } }) => ({
      shouldRefetchSavings,
    })
  );

  const { data, error, loading, refetch: refetchSavings } = useQuery(
    COMPOUND_ACCOUNT_AND_MARKET_QUERY,
    {
      client: compoundClient,
      pollInterval: COMPOUND_QUERY_INTERVAL,
      skip: !hasAccountAddress,
      variables: { id: toLower(accountAddress) },
    }
  );

  useEffect(() => {
    if (!hasAccountAddress) return;
    const fetchBackupSavings = async () => {
      const backup = await getSavings(accountAddress, network);
      if (!isEmpty(backup)) {
        setBackupSavings(backup);
      }
    };
    fetchBackupSavings();
  }, [accountAddress, hasAccountAddress, network]);

  useEffect(() => {
    if (!hasAccountAddress) return;
    const parseSavingsResult = async data => {
      if (error) return;

      if (data) {
        const markets = keyBy(data?.markets, 'id');
        const resultTokens = data?.account?.tokens;

        const parsedAccountTokens = map(resultTokens, token => {
          const [cTokenAddress] = token.id.split('-');
          const marketData = markets[cTokenAddress] || {};

          const {
            cToken,
            exchangeRate,
            supplyRate,
            underlying,
            underlyingPrice,
          } = getMarketData(marketData);

          const {
            cTokenBalance,
            lifetimeSupplyInterestAccrued,
            supplyBalanceUnderlying,
          } = token;

          const ethPrice = multiply(underlyingPrice, supplyBalanceUnderlying);

          return {
            cToken,
            cTokenBalance,
            ethPrice,
            exchangeRate,
            lifetimeSupplyInterestAccrued,
            supplyBalanceUnderlying,
            supplyRate,
            type: AssetTypes.compound,
            underlying,
            underlyingPrice,
          };
        });
        const accountTokens = orderBy(
          parsedAccountTokens,
          ['ethPrice'],
          ['desc']
        );
        const daiMarketData = getMarketData(markets[CDAI_CONTRACT]);
        const result = {
          accountTokens,
          daiMarketData,
        };
        saveSavings(result, accountAddress, network);
        setResult(result);
      } else if (loading && !isNil(backupSavings)) {
        setResult(backupSavings);
      }
    };
    parseSavingsResult(data);
  }, [
    accountAddress,
    backupSavings,
    data,
    error,
    hasAccountAddress,
    loading,
    network,
  ]);

  const savings = useMemo(() => {
    if (isEmpty(result)) return [];

    const { accountTokens, daiMarketData } = result;

    const accountHasCDAI = find(
      accountTokens,
      token => token.underlying.address === DAI_ADDRESS
    );

    let savings = accountTokens || [];

    const shouldAddDai =
      includeDefaultDai && !accountHasCDAI && !isEmpty(daiMarketData);

    if (shouldAddDai) {
      savings = concat(accountTokens, {
        ...daiMarketData,
      });
    }
    return savings;
  }, [includeDefaultDai, result]);

  return {
    refetchSavings,
    savings,
    shouldRefetchSavings,
  };
}
