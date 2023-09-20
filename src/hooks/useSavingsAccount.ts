import { useQuery } from '@apollo/client';
import { isEmpty, isNil, keyBy, orderBy } from 'lodash';
import { useMemo } from 'react';
import { useMMKVObject } from 'react-native-mmkv';
import { useDispatch } from 'react-redux';
import { useDeepCompareMemo } from 'use-deep-compare';
import useAccountSettings from './useAccountSettings';
import { useGenericAssets } from './useGenericAsset';
import { compoundClientDeprecated } from '@/apollo/client';
import { COMPOUND_ACCOUNT_AND_MARKET_QUERY } from '@/apollo/queries';
import { AssetTypes } from '@/entities';
import { multiply } from '@/helpers/utilities';
import { parseAssetName, parseAssetSymbol } from '@/parsers';
import { emitAssetRequest } from '@/redux/explorer';
import { CDAI_CONTRACT, DAI_ADDRESS, ETH_ADDRESS } from '@/references';
import { ethereumUtils, getTokenMetadata } from '@/utils';

const COMPOUND_QUERY_INTERVAL = 120000; // 120 seconds

const getMarketData = (marketData: any) => {
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

const getCTokenData = (marketData: any) => {
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

const getUnderlyingData = (marketData: any) => {
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

const getUnderlyingPrice = (token: any, genericAssets: any) => {
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

function usePersistentBackupSavings(accountAddress: any, network: any) {
  return useMMKVObject('savings-' + accountAddress + network);
}

export default function useSavingsAccount(includeDefaultDai: boolean) {
  const dispatch = useDispatch();
  const { accountAddress, network } = useAccountSettings();
  const [backupSavings = null, setBackupSavings] = usePersistentBackupSavings(
    accountAddress,
    network
  );

  const hasAccountAddress = !!accountAddress;

  const { data, error, loading, refetch: refetchSavings } = useQuery(
    COMPOUND_ACCOUNT_AND_MARKET_QUERY,
    {
      client: compoundClientDeprecated,
      pollInterval: COMPOUND_QUERY_INTERVAL,
      skip: !hasAccountAddress,
      variables: { id: accountAddress?.toLowerCase() },
    }
  );

  const result = useMemo(() => {
    if (error) return {};
    if (!hasAccountAddress) {
      return {};
    }

    if (data) {
      const markets = keyBy(data?.markets, 'id');
      const resultTokens = data?.account?.tokens ?? [];

      const accountTokens = resultTokens.map((token: any) => {
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
      const underlyingAddresses = accountTokens.map(
        (token: any) => token?.underlying?.address
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
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    () => result.accountTokens?.map((token: any) => token.underlying.address),
    // @ts-expect-error ts-migrate(2571) FIXME: Object is of type 'unknown'.
    [result.accountTokens]
  );

  const genericAssets = useGenericAssets(accountTokensAddresses);

  const savings = useMemo(() => {
    if (isEmpty(result)) return [];

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'accountTokens' does not exist on type 'u... Remove this comment to see the full error message
    const { accountTokens, daiMarketData } = result;
    const accountTokensWithPrices = accountTokens?.map((token: any) =>
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
      savings = orderedAccountTokens.concat(
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
  };
}
