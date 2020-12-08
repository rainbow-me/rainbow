import { useQuery } from '@apollo/client';
import {
  concat,
  find,
  isEmpty,
  isNil,
  keyBy,
  orderBy,
  property,
  toLower,
} from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { compoundClient } from '../apollo/client';
import { COMPOUND_ACCOUNT_AND_MARKET_QUERY } from '../apollo/queries';
import { getSavings, saveSavings } from '../handlers/localstorage/accountLocal';
import AssetTypes from '../helpers/assetTypes';
import { multiply } from '../helpers/utilities';
import useAccountSettings from '../hooks/useAccountSettings';
import { parseAssetName, parseAssetSymbol } from '../parsers/accounts';
import { CDAI_CONTRACT, DAI_ADDRESS } from '../references';

const COMPOUND_QUERY_INTERVAL = 120000; // 120 seconds

const getMarketData = marketData => {
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
  const { id: cTokenAddress, name, symbol } = marketData;

  return {
    address: cTokenAddress,
    decimals: 8,
    name: parseAssetName(name, cTokenAddress),
    symbol: parseAssetSymbol(symbol, cTokenAddress),
  };
};

const getUnderlyingData = marketData => {
  const {
    underlyingAddress,
    underlyingDecimals,
    underlyingName,
    underlyingSymbol,
  } = marketData;

  return {
    address: underlyingAddress,
    decimals: underlyingDecimals,
    name: parseAssetName(underlyingName, underlyingAddress),
    symbol: parseAssetSymbol(underlyingSymbol, underlyingAddress),
  };
};

export default function useSavingsAccount(includeDefaultDai) {
  const [result, setResult] = useState({});
  const [backupAccountTokens, setBackupAccountTokens] = useState(null);

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
      setBackupAccountTokens(backup);
    };
    fetchBackupSavings();
  }, [accountAddress, hasAccountAddress, network]);

  useEffect(() => {
    if (!hasAccountAddress || isNil(backupAccountTokens)) return;
    const parseSavingsResult = async data => {
      if (error) return;
      let savingsAccountData = [];
      const markets = keyBy(data?.markets || [], property('id'));

      if (data) {
        const resultTokens = data?.account?.tokens || [];

        const parsedAccountTokens = resultTokens.map(token => {
          const [cTokenAddress] = token.id.split('-');
          const marketData = markets[cTokenAddress] || {};

          const {
            cToken,
            exchangeRate,
            supplyRate,
            underlying,
            underlyingPrice,
          } = getMarketData(marketData);

          const ethPrice = multiply(
            underlyingPrice,
            token.supplyBalanceUnderlying
          );

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
            type: AssetTypes.compound,
            underlying,
            underlyingPrice,
          };
        });
        savingsAccountData = orderBy(
          parsedAccountTokens,
          ['ethPrice'],
          ['desc']
        );
        saveSavings(savingsAccountData, accountAddress, network);
      } else if (loading) {
        savingsAccountData = backupAccountTokens;
      }

      const daiMarketData = getMarketData(markets[CDAI_CONTRACT]);
      const result = {
        accountTokens: savingsAccountData,
        daiMarketData: daiMarketData,
      };
      setResult(result);
    };
    parseSavingsResult(data);
  }, [
    accountAddress,
    backupAccountTokens,
    data,
    error,
    hasAccountAddress,
    loading,
    network,
  ]);

  const savings = useMemo(() => {
    const { accountTokens, daiMarketData } = result;

    const accountHasCDAI = find(
      accountTokens,
      token => token.underlying.address === DAI_ADDRESS
    );

    let savings = accountTokens;

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
