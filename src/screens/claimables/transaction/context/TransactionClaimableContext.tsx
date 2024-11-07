import React, { Dispatch, SetStateAction, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ChainId } from '@/chains/types';
import { ClaimStatus, TokenToReceive, TransactionClaimableTxPayload } from '../types';
import { CrosschainQuote, ETH_ADDRESS, getCrosschainQuote, getQuote, Quote, QuoteParams } from '@rainbow-me/swaps';
import { Claimable, TransactionClaimable } from '@/resources/addys/claimables/types';
import { logger, RainbowError } from '@/logger';
import { useAccountSettings } from '@/hooks';
import { convertAmountToRawAmount } from '@/helpers/utilities';
import { useUserNativeNetworkAsset } from '@/resources/assets/useUserAsset';
import { GasSpeed } from '@/__swaps__/types/gas';
import { useMeteorologySuggestion } from '@/__swaps__/utils/meteorology';
import { useSwapEstimatedGasLimit } from '@/__swaps__/screens/Swap/hooks/useSwapEstimatedGasLimit';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { getGasSettingsBySpeed, useGasSettings } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { useTokenSearch } from '@/__swaps__/screens/Swap/resources/search';
import { SearchAsset } from '@/__swaps__/types/search';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { getNextNonce } from '@/state/nonces';
import { estimateGasWithPadding, getProvider } from '@/handlers/web3';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { add, convertAmountToNativeDisplayWorklet, divide, formatNumber, multiply } from '@/__swaps__/utils/numbers';
import { lessThanOrEqualToWorklet } from '@/__swaps__/safe-math/SafeMath';
import { weiToGwei } from '@/__swaps__/utils/ethereum';
import { formatUnits } from 'viem';
import { safeBigInt } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { haptics } from '@/utils';
import { queryClient } from '@/react-query';
import { claimablesQueryKey } from '@/resources/addys/claimables/query';
import { useMutation } from '@tanstack/react-query';
import { loadWallet } from '@/model/wallet';
import { externalTokenQueryKey, fetchExternalToken, FormattedExternalAsset } from '@/resources/assets/externalAssetsQuery';
import { walletExecuteRap } from '@/raps/execute';
import { executeClaim } from '../utils';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';

interface OutputConfig {
  token: TokenToReceive;
  chainId: ChainId;
}

interface TxState {
  isSufficientGas: boolean;
  gasFeeDisplay: string;
  txPayload: TransactionClaimableTxPayload | undefined;
}

type TransactionClaimableContextType = {
  outputConfig: OutputConfig;
  quote: Quote | CrosschainQuote | undefined;
  claimStatus: ClaimStatus;
  claimable: Claimable;
  isSufficientGas: boolean;
  gasFeeDisplay: string;
  claimNativeValueDisplay: string;

  setOutputConfig: Dispatch<SetStateAction<OutputConfig>>;
  setQuote: Dispatch<SetStateAction<Quote | CrosschainQuote | undefined>>;

  claim: () => void;
};

const TransactionClaimableContext = createContext<TransactionClaimableContextType | undefined>(undefined);

export function useTransactionClaimableContext() {
  const context = useContext(TransactionClaimableContext);
  if (context === undefined) {
    throw new Error('useTransactionClaimableContext must be used within a TransactionClaimableContextProvider');
  }
  return context;
}

export function TransactionClaimableContextProvider({
  claimable,
  children,
}: {
  claimable: TransactionClaimable;
  children: React.ReactNode;
}) {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('ready');
  const [quote, setQuote] = useState<Quote | CrosschainQuote | undefined>(undefined);
  const [txState, setTxState] = useState<TxState>({ isSufficientGas: false, gasFeeDisplay: '', txPayload: undefined });
  const [lastGasEstimateTime, setLastGasEstimateTime] = useState<number>(0);
  const [outputConfig, setOutputConfig] = useState<OutputConfig>({
    chainId: claimable.asset.chainId,
    token: {
      address: claimable.asset.address,
      iconUrl: claimable.asset.icon_url,
      name: claimable.asset.name,
      symbol: claimable.asset.symbol,
      networks: claimable.asset.networks,
      isNativeAsset: false,
    },
  });

  const requiresSwap = outputConfig.token.symbol !== claimable.asset.symbol || outputConfig.chainId !== claimable.chainId;

  const { data: tokenSearchData, isFetching: isFetchingOutputToken } = useTokenSearch(
    {
      chainId: outputConfig.chainId,
      keys: ['address'],
      list: 'verifiedAssets',
      threshold: 'CASE_SENSITIVE_EQUAL',
      query: outputConfig.token.address,
    },
    {
      enabled: requiresSwap,
      select: data => {
        return data.filter(
          (asset: SearchAsset) =>
            asset.address === outputConfig.token.address &&
            asset.chainId === outputConfig.chainId &&
            asset.symbol === outputConfig.token.symbol
        );
      },
    }
  );

  console.log(tokenSearchData?.[0]);

  const parsedOutputToken: ParsedSearchAsset | undefined = useMemo(() => {
    const asset = tokenSearchData?.[0];
    if (!asset) return undefined;
    return parseSearchAsset({ searchAsset: asset });
  }, [tokenSearchData]);

  const gasSettings = useGasSettings(claimable.chainId, GasSpeed.FAST);
  const { data: swapGasLimit, isFetching: isFetchingSwapGasLimit } = useSwapEstimatedGasLimit(
    {
      chainId: claimable.chainId,
      assetToSell: parsedOutputToken,
      quote,
    },
    { enabled: !!quote && !!parsedOutputToken }
  );
  const { data: meteorologyData } = useMeteorologySuggestion({
    chainId: claimable.chainId,
    speed: GasSpeed.FAST,
    enabled: true,
  });

  const { data: userNativeNetworkAsset, isLoading: isLoadingNativeNetworkAsset } = useUserNativeNetworkAsset(claimable.chainId);

  const updateQuote = useCallback(
    async (outputToken: TokenToReceive, outputChainId: ChainId) => {
      console.log('update quote');
      console.log('updateQuote called with:', {
        outputChainId,
        willBeUsedAs_toChainId: outputChainId, // Same value at this point
      });
      const quoteParams: QuoteParams = {
        chainId: claimable.chainId,
        fromAddress: accountAddress,
        sellTokenAddress: claimable.asset.isNativeAsset ? ETH_ADDRESS : claimable.asset.address,
        buyTokenAddress: outputToken.isNativeAsset ? ETH_ADDRESS : outputToken.address,
        sellAmount: convertAmountToRawAmount(0.0001, claimable.asset.decimals),
        slippage: 0.5,
        refuel: false,
        toChainId: outputChainId,
        currency: nativeCurrency,
      };

      console.log('quoteParams created:', {
        receivedChainId: outputChainId,
        paramsToChainId: quoteParams.toChainId,
        entireParams: quoteParams,
      });

      const quote = claimable.chainId === outputChainId ? await getQuote(quoteParams) : await getCrosschainQuote(quoteParams);
      console.log('quote attempt');
      if (!quote || 'error' in quote) {
        if (quote?.message === 'no routes found') {
          console.log('NO ROUTE');
          setClaimStatus('noRoute');
        } else {
          setClaimStatus('noQuote');
          logger.error(new RainbowError('[ClaimingTransactionClaimable]: failed to get quote'), { quote, quoteParams });
        }
        setQuote(undefined);
      } else {
        console.log('setquote');
        setQuote(quote);
        setClaimStatus('ready');
      }
    },
    [accountAddress, claimable.asset.address, claimable.asset.decimals, claimable.asset.isNativeAsset, claimable.chainId, nativeCurrency]
  );

  useEffect(() => {
    if (requiresSwap && !quote) {
      setClaimStatus('fetchingQuote');
      setTxState({ isSufficientGas: false, gasFeeDisplay: '', txPayload: undefined });
      updateQuote(outputConfig.token, outputConfig.chainId);
    }
  }, [
    claimable.asset.chainId,
    claimable.asset.symbol,
    claimable.type,
    requiresSwap,
    outputConfig.chainId,
    outputConfig.token,
    quote,
    updateQuote,
  ]);

  const provider = useMemo(() => getProvider({ chainId: claimable.chainId }), [claimable.chainId]);

  const canEstimateGas = !!(
    meteorologyData?.maxBaseFee &&
    meteorologyData?.maxPriorityFee &&
    !isLoadingNativeNetworkAsset &&
    userNativeNetworkAsset &&
    gasSettings &&
    (!requiresSwap ||
      (quote && !isFetchingSwapGasLimit && swapGasLimit && !isFetchingOutputToken && parsedOutputToken && claimStatus !== 'fetchingQuote'))
  );

  const estimateGas = useCallback(async () => {
    if (!canEstimateGas) return;

    const gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts = {
      maxFeePerGas: meteorologyData.maxBaseFee,
      maxPriorityFeePerGas: meteorologyData.maxPriorityFee,
      gasPrice: meteorologyData.gasPrice,
    };

    const partialTxPayload = {
      value: '0x0' as const,
      data: claimable.action.data,
      from: accountAddress,
      chainId: claimable.chainId,
      nonce: await getNextNonce({ address: accountAddress, chainId: claimable.chainId }),
      to: claimable.action.to,
      ...gasParams,
    };

    const gasLimit = await estimateGasWithPadding(partialTxPayload, null, null, provider);

    if (!gasLimit) {
      logger.error(new RainbowError('[TransactionClaimablePanel]: Failed to estimate claim gas limit'));
      return;
    }

    let gasFeeGwei = calculateGasFeeWorklet(gasSettings, gasLimit);

    if (requiresSwap) {
      if (!swapGasLimit) {
        logger.error(new RainbowError('[TransactionClaimablePanel]: swapGasLimit is undefined'));
        return;
      }

      const swapGasFeeGwei = calculateGasFeeWorklet(gasSettings, swapGasLimit);
      gasFeeGwei = add(gasFeeGwei, swapGasFeeGwei);
    }

    const gasFeeNativeToken = divide(gasFeeGwei, Math.pow(10, userNativeNetworkAsset.decimals));
    const userBalance = userNativeNetworkAsset.balance?.amount || '0';

    const sufficientGas = lessThanOrEqualToWorklet(gasFeeNativeToken, userBalance);

    const networkAssetPrice = userNativeNetworkAsset.price?.value?.toString();

    let gasFeeNativeCurrencyDisplay;
    if (!networkAssetPrice) {
      gasFeeNativeCurrencyDisplay = `${formatNumber(weiToGwei(gasFeeGwei))} Gwei`;
    } else {
      const feeFormatted = formatUnits(safeBigInt(gasFeeGwei), userNativeNetworkAsset.decimals).toString();
      const feeInUserCurrency = multiply(networkAssetPrice, feeFormatted);

      gasFeeNativeCurrencyDisplay = convertAmountToNativeDisplayWorklet(feeInUserCurrency, nativeCurrency, true);
    }

    setLastGasEstimateTime(Date.now());
    setTxState({
      isSufficientGas: sufficientGas,
      gasFeeDisplay: gasFeeNativeCurrencyDisplay,
      txPayload: { ...partialTxPayload, gasLimit },
    });
  }, [
    canEstimateGas,
    meteorologyData?.maxBaseFee,
    meteorologyData?.maxPriorityFee,
    meteorologyData?.gasPrice,
    claimable.action.data,
    claimable.action.to,
    claimable.chainId,
    accountAddress,
    provider,
    gasSettings,
    requiresSwap,
    userNativeNetworkAsset?.decimals,
    userNativeNetworkAsset?.balance?.amount,
    userNativeNetworkAsset?.price?.value,
    swapGasLimit,
    nativeCurrency,
  ]);

  useEffect(() => {
    // estimate gas if it hasn't been estimated yet or if 10 seconds have passed since last estimate
    if (canEstimateGas && (!txState.gasFeeDisplay || Date.now() - lastGasEstimateTime > 10_000)) {
      try {
        estimateGas();
      } catch (e) {
        logger.warn('[TransactionClaimablePanel]: Failed to estimate gas', { error: e });
      }
    }
  }, [
    canEstimateGas,
    claimStatus,
    estimateGas,
    isFetchingOutputToken,
    isFetchingSwapGasLimit,
    lastGasEstimateTime,
    parsedOutputToken,
    txState.gasFeeDisplay,
  ]);

  const queryKey = claimablesQueryKey({ address: accountAddress, currency: nativeCurrency });

  const { mutate: claim } = useMutation({
    mutationFn: async () => {
      const needsRap = outputConfig.token.symbol !== claimable.asset.symbol || outputConfig.chainId !== claimable.chainId;

      if (!txState.txPayload || !outputConfig.token || !outputConfig.chainId || (needsRap && !quote)) {
        haptics.notificationError();
        setClaimStatus('error');
        logger.error(new RainbowError('[TransactionClaimablePanel]: Failed to claim claimable due to missing tx payload'));
        return;
      }

      const wallet = await loadWallet({
        address: accountAddress,
        showErrorIfNotLoaded: false,
        provider,
      });

      if (!wallet) {
        // Biometrics auth failure (retry possible)
        haptics.notificationError();
        setClaimStatus('error');
        return;
      }

      if (needsRap) {
        const outputAsset =
          queryClient.getQueryData<FormattedExternalAsset>(
            externalTokenQueryKey({ address: accountAddress, chainId: outputConfig.chainId, currency: nativeCurrency })
          ) ?? (await fetchExternalToken({ address: outputConfig.token.address, chainId: outputConfig.chainId, currency: nativeCurrency }));

        if (!outputAsset) {
          haptics.notificationError();
          setClaimStatus('error');
          logger.error(new RainbowError('[TransactionClaimablePanel]: Failed to claim claimable due to error fetching output asset'));
          return;
        }

        const swapData = {
          amount: claimable.value.claimAsset.amount,
          sellAmount: convertAmountToRawAmount(0.0001, claimable.asset.decimals),
          chainId: claimable.chainId,
          toChainId: outputConfig.chainId,
          assetToSell: outputAsset,
          assetToBuy: outputAsset.isNativeAsset ? { ...outputAsset, address: ETH_ADDRESS } : outputAsset,
          address: accountAddress,
        };

        if (!quote || 'error' in quote) {
          haptics.notificationError();
          setClaimStatus('error');
          logger.error(new RainbowError('[TransactionClaimablePanel]: quote error'));
          return;
        }

        const selectedGas = {
          maxBaseFee: meteorologyData?.maxBaseFee,
          maxPriorityFee: meteorologyData?.maxPriorityFee,
        };

        let gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts = {} as
          | TransactionGasParamAmounts
          | LegacyTransactionGasParamAmounts;

        gasParams = {
          maxFeePerGas: selectedGas?.maxBaseFee as string,
          maxPriorityFeePerGas: selectedGas?.maxPriorityFee as string,
        };
        const gasFeeParamsBySpeed = getGasSettingsBySpeed(claimable.chainId);

        const { errorMessage } = await walletExecuteRap(wallet, 'claimClaimable', {
          ...swapData,
          gasParams,
          // @ts-expect-error - collision between old gas types and new
          gasFeeParamsBySpeed,
          quote,
          additionalParams: { claimTx: txState.txPayload },
        });

        if (errorMessage) {
          haptics.notificationError();
          setClaimStatus('error');
          logger.error(new RainbowError('[TransactionClaimablePanel]: Failed to claim claimable due to rap error'), {
            message: errorMessage,
          });
          return;
        }
      } else {
        try {
          await executeClaim({
            asset: claimable.asset,
            claimTx: txState.txPayload,
            wallet,
          });
        } catch (e) {
          haptics.notificationError();
          setClaimStatus('error');
          logger.error(new RainbowError(`[TransactionClaimablePanel]: Failed to claim claimable due to executeClaim error`), {
            message: (e as Error)?.message,
          });
        }
      }

      haptics.notificationSuccess();
      setClaimStatus('success');

      // Immediately remove the claimable from cached data
      queryClient.setQueryData(queryKey, (oldData: Claimable[] | undefined) => oldData?.filter(c => c.uniqueId !== claimable.uniqueId));
    },
    onError: e => {
      haptics.notificationError();
      setClaimStatus('error');
      logger.error(new RainbowError('[TransactionClaimablePanel]: Failed to claim claimable due to unhandled error'), {
        message: (e as Error)?.message,
      });
    },
    onSuccess: () => {
      if (claimStatus === 'claiming') {
        haptics.notificationError();
        setClaimStatus('error');
        logger.error(
          new RainbowError('[TransactionClaimablePanel]: claim function completed but never resolved status to success or error state')
        );
      }
    },
    onSettled: () => {
      // Clear and refresh claimables data 20s after claim button is pressed, regardless of success or failure
      setTimeout(() => queryClient.invalidateQueries(queryKey), 20_000);
    },
  });

  return (
    <TransactionClaimableContext.Provider
      value={{
        outputConfig,
        quote,
        claimStatus,
        claimable,
        isSufficientGas: txState.isSufficientGas,
        gasFeeDisplay: txState.gasFeeDisplay,
        claimNativeValueDisplay: 'FIXME',

        setOutputConfig,
        setQuote,

        claim,
      }}
    >
      {children}
    </TransactionClaimableContext.Provider>
  );
}
