import { useQuery } from '@apollo/client';
import { concat, isEmpty, isNil, keyBy, map, orderBy, toLower } from 'lodash';
import { useMemo } from 'react';
import { useMMKVObject } from 'react-native-mmkv';
import { useDispatch, useSelector } from 'react-redux';
import { useDeepCompareMemo } from 'use-deep-compare';
import useAccountSettings from './useAccountSettings';
import { useGenericAssets } from './useGenericAsset';
import { compoundClient } from '@rainbow-me/apollo/client';
import { COMPOUND_ACCOUNT_AND_MARKET_QUERY } from '@rainbow-me/apollo/queries';
import { AssetTypes } from '@rainbow-me/entities';
import { multiply } from '@rainbow-me/helpers/utilities';
import { parseAssetName, parseAssetSymbol } from '@rainbow-me/parsers';
import { emitAssetRequest } from '@rainbow-me/redux/explorer';
import {
  CDAI_CONTRACT,
  DAI_ADDRESS,
  ETH_ADDRESS,
} from '@rainbow-me/references';
import { ethereumUtils, getTokenMetadata } from '@rainbow-me/utils';

const COMPOUND_QUERY_INTERVAL = 120000; // 120 seconds

const getMarketData = marketData => {
  if (!marketData) return {};
  const underlying = getUnderlyingData(marketData);
  const cToken = getCTokenData(marketData);
  const { exchangeRate, supplyRate } = marketData;

  return {
    cToken,
    exchangeRate,
    supplyRate,
    underlying,
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
    address: symbol === 'ETH' ? ETH_ADDRESS : underlyingAddress,
    decimals: underlyingDecimals,
    name,
    symbol,
  };
};

const getUnderlyingPrice = (token, genericAssets) => {
  const address = token.underlying.address;
  const genericAsset = genericAssets?.[address];
  const genericPrice = genericAsset?.price?.value;
  const underlyingPrice =
    genericPrice || ethereumUtils.getAccountAsset(address)?.price?.value || 0;

  const underlyingBalanceNativeValue =
    underlyingPrice && token.supplyBalanceUnderlying
      ? multiply(underlyingPrice, token.supplyBalanceUnderlying)
      : 0;
  return {
    ...token,
    underlyingBalanceNativeValue,
    underlyingPrice,
  };
};

function usePersistentBackupSavings(accountAddress, network) {
  return useMMKVObject('savings-' + accountAddress + network);
}

export default function useSavingsAccount(includeDefaultDai) {
  const dispatch = useDispatch();
  const { accountAddress, network } = useAccountSettings();
  const [backupSavings = null, setBackupSavings] = usePersistentBackupSavings(
    accountAddress,
    network
  );

  const hasAccountAddress = !!accountAddress;

  const shouldRefetchSavings = useSelector(
    ({ data: { shouldRefetchSavings } }) => shouldRefetchSavings
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

  const result = useMemo(() => {
    if (error) return {};
    if (!hasAccountAddress) {
      return {};
    }

    if (data) {
      const markets = keyBy(data?.markets, 'id');
      const resultTokens = data?.account?.tokens;

      const accountTokens = map(resultTokens, token => {
        const [cTokenAddress] = token.id.split('-');
        const marketData = markets[cTokenAddress] || {};

        const { cToken, exchangeRate, supplyRate, underlying } = getMarketData(
          marketData
        );

        const {
          cTokenBalance,
          lifetimeSupplyInterestAccrued,
          supplyBalanceUnderlying,
        } = token;

        return {
          cToken,
          cTokenBalance,
          exchangeRate,
          lifetimeSupplyInterestAccrued,
          supplyBalanceUnderlying,
          supplyRate,
          type: AssetTypes.compound,
          underlying,
        };
      });

      const daiMarketData = getMarketData(markets[CDAI_CONTRACT]);
      const result = {
        accountTokens,
        daiMarketData,
      };
      const underlyingAddresses = map(
        accountTokens,
        token => token?.underlying?.address
      );
      dispatch(emitAssetRequest([DAI_ADDRESS, ...underlyingAddresses]));
      setBackupSavings(result);
      return result;
    } else if (loading && !isNil(backupSavings)) {
      return backupSavings;
    } else {
      return {};
    }
  }, [
    backupSavings,
    data,
    dispatch,
    error,
    hasAccountAddress,
    loading,
    setBackupSavings,
  ]);

  const accountTokensAddresses = useDeepCompareMemo(
    () => result.accountTokens?.map(token => token.underlying.address),
    [result.accountTokens]
  );

  const genericAssets = useGenericAssets(accountTokensAddresses);

  const savings = useMemo(() => {
    if (isEmpty(result)) return [];

    const { accountTokens, daiMarketData } = result;
    const accountTokensWithPrices = accountTokens?.map(token =>
      getUnderlyingPrice(token, genericAssets)
    );

    const orderedAccountTokens = orderBy(
      accountTokensWithPrices,
      ['underlyingBalanceNativeValue'],
      ['desc']
    );

    const accountHasCDAI = orderedAccountTokens.find(
      token => token.underlying.address === DAI_ADDRESS
    );

    let savings = orderedAccountTokens || [];

    const shouldAddDai =
      includeDefaultDai && !accountHasCDAI && !isEmpty(daiMarketData);

    if (shouldAddDai) {
      savings = concat(
        orderedAccountTokens,
        getUnderlyingPrice(daiMarketData, genericAssets)
      );
    }
    return savings;
  }, [includeDefaultDai, result, genericAssets]);

  // savings returns the same object with the new reference over and over
  const memoizedSavings = useDeepCompareMemo(() => savings, [savings]);

  return {
    refetchSavings,
    savings: memoizedSavings,
    shouldRefetchSavings,
  };
}
