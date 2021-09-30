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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useAccountSettings from './useAccountSettings';
import { compoundClient } from '@rainbow-me/apollo/client';
import { COMPOUND_ACCOUNT_AND_MARKET_QUERY } from '@rainbow-me/apollo/queries';
import { AssetTypes } from '@rainbow-me/entities';
import {
  getSavings,
  saveSavings,
} from '@rainbow-me/handlers/localstorage/accountLocal';
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

export default function useSavingsAccount(includeDefaultDai) {
  const [result, setResult] = useState({});
  const [backupSavings, setBackupSavings] = useState(null);
  const genericAssets = useSelector(
    ({ data: { genericAssets } }) => genericAssets
  );

  const dispatch = useDispatch();
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

  const parseSavingsResult = useCallback(async () => {
    if (error) return;

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
      dispatch(emitAssetRequest(underlyingAddresses));
      saveSavings(result, accountAddress, network);
      setResult(result);
    } else if (loading && !isNil(backupSavings)) {
      setResult(backupSavings);
    } else {
      setResult({});
    }
  }, [accountAddress, backupSavings, data, dispatch, error, loading, network]);

  useEffect(() => {
    if (!hasAccountAddress) return;
    parseSavingsResult();
  }, [hasAccountAddress, parseSavingsResult]);

  const savings = useMemo(() => {
    if (isEmpty(result)) return [];

    const { accountTokens, daiMarketData } = result;
    const accountTokensWithPrices = map(accountTokens, token => {
      const underlyingPrice = ethereumUtils.getAssetPrice(
        token.underlying.address
      );
      const underlyingBalanceNativeValue =
        underlyingPrice && token.supplyBalanceUnderlying
          ? multiply(underlyingPrice, token.supplyBalanceUnderlying)
          : 0;
      return {
        ...token,
        underlyingBalanceNativeValue,
        underlyingPrice,
      };
    });

    const orderedAccountTokens = orderBy(
      accountTokensWithPrices,
      ['underlyingBalanceNativeValue'],
      ['desc']
    );

    const accountHasCDAI = find(
      orderedAccountTokens,
      token => token.underlying.address === DAI_ADDRESS
    );

    let savings = orderedAccountTokens || [];

    const shouldAddDai =
      includeDefaultDai && !accountHasCDAI && !isEmpty(daiMarketData);

    if (shouldAddDai) {
      savings = concat(orderedAccountTokens, {
        ...daiMarketData,
      });
    }
    return savings;
  }, [genericAssets, includeDefaultDai, result]);

  return {
    refetchSavings,
    savings,
    shouldRefetchSavings,
  };
}
