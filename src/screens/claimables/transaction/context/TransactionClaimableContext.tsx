import React, { Dispatch, SetStateAction, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ChainId } from '@/chains/types';
import { TokenToReceive, TransactionClaimableTxPayload } from '../types';
import { CrosschainQuote, ETH_ADDRESS, getCrosschainQuote, getQuote, Quote, QuoteParams } from '@rainbow-me/swaps';
import { Claimable, TransactionClaimable } from '@/resources/addys/claimables/types';
import { logger, RainbowError } from '@/logger';
import { useAccountSettings } from '@/hooks';
import {
  convertAmountToNativeDisplay,
  convertAmountToRawAmount,
  convertAmountToBalanceDisplay,
  convertRawAmountToDecimalFormat,
  multiply,
  add,
  divide,
  formatNumber,
  convertAmountToNativeDisplayWorklet,
} from '@/helpers/utilities';
import { useUserNativeNetworkAsset } from '@/resources/assets/useUserAsset';
import { GasSpeed } from '@/__swaps__/types/gas';
import { useSwapEstimatedGasLimit } from '@/__swaps__/screens/Swap/hooks/useSwapEstimatedGasLimit';
import { parseSearchAsset } from '@/__swaps__/utils/assets';
import { getGasSettingsBySpeed, useGasSettings } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { useTokenSearch } from '@/__swaps__/screens/Swap/resources/search';
import { SearchAsset } from '@/__swaps__/types/search';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { getNextNonce } from '@/state/nonces';
import { estimateGasWithPadding, getProvider } from '@/handlers/web3';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { formatUnits } from 'viem';
import { safeBigInt } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { haptics } from '@/utils';
import { queryClient } from '@/react-query';
import { claimablesQueryKey } from '@/resources/addys/claimables/query';
import { useMutation } from '@tanstack/react-query';
import { loadWallet } from '@/model/wallet';
import { externalTokenQueryFunction, externalTokenQueryKey } from '@/resources/assets/externalAssetsQuery';
import { walletExecuteRap } from '@/raps/execute';
import { executeClaim } from '../claim';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';
import { weiToGwei } from '@/parsers';
import { lessThanOrEqualToWorklet } from '@/safe-math/SafeMath';
import { ClaimStatus } from '../../shared/types';
import { analyticsV2 } from '@/analytics';
import { getDefaultSlippageWorklet } from '@/__swaps__/utils/swaps';
import { getRemoteConfig } from '@/model/remoteConfig';

const RAINBOW_FEE_BIPS = 85;

enum ErrorMessages {
  SWAP_ERROR = 'Failed to swap claimed asset due to swap action error',
  CLAIM_ERROR = 'Failed to claim claimable due to claim action error',
  UNHANDLED_ERROR = 'Failed to claim claimable due to unhandled error',
  UNRESOLVED_CLAIM_STATUS = 'Claim function completed but never resolved status to success or error state',
}

interface OutputConfig {
  token?: TokenToReceive;
  chainId?: ChainId;
}

interface TxState {
  status: 'fetching' | 'error' | 'success' | 'none';
  isSufficientGas: boolean;
  gasFeeDisplay: string | undefined;
  txPayload: TransactionClaimableTxPayload | undefined;
}

interface QuoteState {
  quote: Quote | CrosschainQuote | undefined;
  status: 'fetching' | 'noRouteError' | 'noQuoteError' | 'success' | 'none';
  nativeValueDisplay: string | undefined;
  tokenAmountDisplay: string | undefined;
}

type TransactionClaimableContextType = {
  outputConfig: OutputConfig;
  claimStatus: ClaimStatus;
  claimable: Claimable;
  txState: TxState;
  quoteState: QuoteState;
  requiresSwap: boolean;

  setClaimStatus: Dispatch<SetStateAction<ClaimStatus>>;
  setOutputConfig: Dispatch<SetStateAction<OutputConfig>>;
  setQuoteState: Dispatch<SetStateAction<QuoteState>>;
  setTxState: Dispatch<SetStateAction<TxState>>;

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

  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('notReady');
  const [quoteState, setQuoteState] = useState<QuoteState>({
    quote: undefined,
    nativeValueDisplay: undefined,
    tokenAmountDisplay: undefined,
    status: 'none',
  });
  const [txState, setTxState] = useState<TxState>({
    isSufficientGas: false,
    gasFeeDisplay: undefined,
    txPayload: undefined,
    status: 'none',
  });
  const [lastGasEstimateTime, setLastGasEstimateTime] = useState<number>(0);
  const [outputConfig, setOutputConfig] = useState<OutputConfig>({
    chainId: claimable.asset.chainId,
    token: {
      mainnetAddress: claimable.asset.address,
      iconUrl: claimable.asset.icon_url,
      name: claimable.asset.name,
      symbol: claimable.asset.symbol,
      networks: claimable.asset.networks,
      decimals: claimable.asset.decimals,
      isNativeAsset: !!claimable.asset.isNativeAsset,
      isDefaultAsset: true,
    },
  });

  // chain-specific address for output token
  const outputTokenAddress = outputConfig.chainId ? outputConfig.token?.networks[outputConfig.chainId]?.address : undefined;

  const requiresSwap = !!(
    outputConfig.token &&
    outputConfig.chainId &&
    (outputConfig.token.symbol !== claimable.asset.symbol || outputConfig.chainId !== claimable.chainId)
  );

  // need to get token data using token search api so the asset type is compatible w/ swaps v2 gas utils
  const { data: tokenSearchData, isFetching: isFetchingOutputToken } = useTokenSearch(
    {
      chainId: outputConfig.chainId,
      keys: ['address'],
      list: 'verifiedAssets',
      threshold: 'CASE_SENSITIVE_EQUAL',
      query: outputTokenAddress,
    },
    {
      enabled: requiresSwap,
      select: data => {
        return data.filter(
          (asset: SearchAsset) =>
            asset.address === outputTokenAddress && asset.chainId === outputConfig.chainId && asset.symbol === outputConfig.token?.symbol
        );
      },
    }
  );

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
      quote: quoteState.quote,
    },
    { enabled: !!quoteState.quote && !!parsedOutputToken }
  );

  const { data: userNativeNetworkAsset, isLoading: isLoadingNativeNetworkAsset } = useUserNativeNetworkAsset(claimable.chainId);

  const updateQuote = useCallback(async () => {
    if (!outputConfig?.token || !outputConfig.chainId || !outputTokenAddress) {
      logger.warn('[TransactionClaimableContext]: Somehow entered unreachable state in updateQuote');
      setQuoteState(prev => ({ ...prev, status: 'none' }));
      return;
    }
    try {
      const quoteParams: QuoteParams = {
        chainId: claimable.chainId,
        fromAddress: accountAddress,
        sellTokenAddress: claimable.asset.isNativeAsset ? ETH_ADDRESS : claimable.asset.address,
        buyTokenAddress: outputConfig.token.isNativeAsset ? ETH_ADDRESS : outputTokenAddress,
        sellAmount: convertAmountToRawAmount(claimable.value.claimAsset.amount, claimable.asset.decimals),
        slippage: +getDefaultSlippageWorklet(claimable.chainId, getRemoteConfig()),
        refuel: false,
        toChainId: outputConfig.chainId,
        currency: nativeCurrency,
        feePercentageBasisPoints: RAINBOW_FEE_BIPS,
      };

      const quote = claimable.chainId === outputConfig.chainId ? await getQuote(quoteParams) : await getCrosschainQuote(quoteParams);

      if (!quote || 'error' in quote) {
        let status: QuoteState['status'];
        if (quote?.message === 'no routes found') {
          status = 'noRouteError';
        } else {
          status = 'noQuoteError';
          logger.error(new RainbowError('[TransactionClaimableContext]: failed to get quote'), { quote, quoteParams });
        }
        setQuoteState({ quote: undefined, nativeValueDisplay: undefined, tokenAmountDisplay: undefined, status });
      } else {
        const buyAmount = convertRawAmountToDecimalFormat(quote.buyAmountMinusFees.toString(), outputConfig.token.decimals);
        const buyAmountDisplay = convertAmountToBalanceDisplay(
          buyAmount,
          { decimals: outputConfig.token.decimals, symbol: outputConfig.token.symbol },
          undefined,
          true
        );
        setQuoteState({
          quote,
          nativeValueDisplay: quote.buyTokenAsset?.price.value
            ? convertAmountToNativeDisplay(multiply(buyAmount, quote.buyTokenAsset.price.value), nativeCurrency)
            : buyAmountDisplay.split(' ')[0], // fall back to token amount instead of native value if price is not available
          tokenAmountDisplay: buyAmountDisplay,
          status: 'success',
        });
      }
    } catch (e) {
      logger.error(new RainbowError('[TransactionClaimableContext]: failed to get quote'), { error: e });
      setQuoteState({ quote: undefined, nativeValueDisplay: undefined, tokenAmountDisplay: undefined, status: 'noQuoteError' });
    }
  }, [
    accountAddress,
    claimable.asset.address,
    claimable.asset.decimals,
    claimable.asset.isNativeAsset,
    claimable.chainId,
    claimable.value.claimAsset.amount,
    nativeCurrency,
    outputConfig.chainId,
    outputConfig.token,
    outputTokenAddress,
  ]);

  // if we don't have a quote yet, fetch one
  useEffect(() => {
    if (requiresSwap && !quoteState.quote && quoteState.status === 'none' && outputTokenAddress) {
      setQuoteState(prev => ({ ...prev, status: 'fetching' }));
      setClaimStatus('notReady');
      updateQuote();
    }
  }, [outputTokenAddress, quoteState.quote, quoteState.status, requiresSwap, updateQuote]);

  const provider = useMemo(() => getProvider({ chainId: claimable.chainId }), [claimable.chainId]);

  // make sure we have necessary data before attempting gas estimation
  const canEstimateGas = !!(
    !isLoadingNativeNetworkAsset &&
    userNativeNetworkAsset &&
    gasSettings &&
    (!requiresSwap ||
      (quoteState.quote &&
        !isFetchingSwapGasLimit &&
        swapGasLimit &&
        !isFetchingOutputToken &&
        parsedOutputToken &&
        parsedOutputToken.symbol === outputConfig.token?.symbol &&
        parsedOutputToken.chainId === outputConfig.chainId &&
        quoteState.status === 'success'))
  );

  const estimateGas = useCallback(async () => {
    try {
      if (!canEstimateGas) {
        if (txState.status === 'fetching') {
          setTxState(prev => ({ ...prev, status: 'none' }));
        }
        return;
      }

      const gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts = gasSettings.isEIP1559
        ? {
            maxFeePerGas: gasSettings.maxBaseFee,
            maxPriorityFeePerGas: gasSettings.maxPriorityFee,
          }
        : { gasPrice: gasSettings.gasPrice };

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
        if (txState.status === 'fetching') {
          setTxState(prev => ({ ...prev, status: 'none' }));
        }
        logger.warn('[TransactionClaimableContext]: Failed to estimate claim gas limit');
        return;
      }

      let gasFeeGwei = calculateGasFeeWorklet(gasSettings, gasLimit);

      if (requiresSwap) {
        if (!swapGasLimit) {
          if (txState.status === 'fetching') {
            setTxState(prev => ({ ...prev, status: 'none' }));
          }
          logger.warn('[TransactionClaimableContext]: swapGasLimit is undefined');
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
        status: 'success',
      });
    } catch (e) {
      if (txState.status === 'fetching') {
        // if is initial gas estimate, set status to error
        setTxState(prev => ({ ...prev, status: 'error' }));
      }
      logger.warn('[TransactionClaimableContext]: Failed to estimate gas', { error: e });
    }
  }, [
    canEstimateGas,
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
    txState.status,
    swapGasLimit,
    nativeCurrency,
  ]);

  useEffect(() => {
    // estimate gas if it hasn't been estimated yet or if 10 seconds have passed since last estimate
    if (canEstimateGas && (!txState.gasFeeDisplay || Date.now() - lastGasEstimateTime > 10_000)) {
      // update tx state/claim status only if initial gas estimate
      if (!txState.gasFeeDisplay) {
        setTxState(prev => ({
          ...prev,
          status: 'fetching',
        }));
        setClaimStatus('notReady');
      }
      estimateGas();
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

  // claim is ready if we have tx payload, sufficent gas, quote (if required), and previously in notReady state
  useEffect(() => {
    if (
      txState.status === 'success' &&
      txState.isSufficientGas &&
      (!requiresSwap || quoteState.status === 'success') &&
      claimStatus === 'notReady' &&
      outputConfig.chainId &&
      outputConfig.token
    ) {
      setClaimStatus('ready');
    }
  }, [claimStatus, outputConfig.chainId, outputConfig.token, quoteState.status, requiresSwap, txState.isSufficientGas, txState.status]);

  const queryKey = claimablesQueryKey({ address: accountAddress, currency: nativeCurrency });

  const { mutate: claim } = useMutation({
    mutationFn: async () => {
      if (
        !txState.txPayload ||
        !gasSettings ||
        !outputConfig.token ||
        !outputConfig.chainId ||
        !outputTokenAddress ||
        (requiresSwap && (!quoteState.quote || 'error' in quoteState.quote))
      ) {
        haptics.notificationError();
        setClaimStatus('recoverableError');
        logger.warn('[TransactionClaimableContext]: Somehow entered unreachable state in claim');
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
        setClaimStatus('recoverableError');
        return;
      }

      if (requiresSwap) {
        // need to get yet another output asset type for raps compatibility
        const outputAsset = await queryClient.fetchQuery({
          queryKey: externalTokenQueryKey({ address: outputTokenAddress, chainId: outputConfig.chainId, currency: nativeCurrency }),
          queryFn: externalTokenQueryFunction,
        });

        if (!outputAsset) {
          haptics.notificationError();
          setClaimStatus('recoverableError');
          logger.error(new RainbowError('[TransactionClaimableContext]: Failed to claim claimable due to error fetching output asset'));
          return;
        }

        const swapData = {
          amount: claimable.value.claimAsset.amount,
          sellAmount: convertAmountToRawAmount(claimable.value.claimAsset.amount, claimable.asset.decimals),
          chainId: claimable.chainId,
          toChainId: outputConfig.chainId,
          assetToSell: outputAsset,
          assetToBuy: outputAsset.isNativeAsset ? { ...outputAsset, address: ETH_ADDRESS } : outputAsset,
          address: accountAddress,
        };

        const gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts = gasSettings.isEIP1559
          ? {
              maxFeePerGas: gasSettings.maxBaseFee,
              maxPriorityFeePerGas: gasSettings.maxPriorityFee,
            }
          : { gasPrice: gasSettings.gasPrice };

        const gasFeeParamsBySpeed = getGasSettingsBySpeed(claimable.chainId);

        const { errorMessage } = await walletExecuteRap(wallet, 'claimClaimable', {
          ...swapData,
          gasParams,
          // @ts-expect-error - collision between old gas types and new
          gasFeeParamsBySpeed,
          quote: quoteState.quote,
          additionalParams: { claimTx: txState.txPayload },
        });

        if (errorMessage) {
          haptics.notificationError();
          if (errorMessage.includes('[CLAIM-CLAIMABLE]')) {
            // Claim error (retry possible)
            setClaimStatus('recoverableError');
            logger.error(new RainbowError(`[TransactionClaimableContext]: ${ErrorMessages.CLAIM_ERROR}`), {
              message: errorMessage,
              recoverable: true,
            });
            analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
              claimableType: 'transaction',
              claimableId: claimable.uniqueId,
              chainId: claimable.chainId,
              asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
              amount: claimable.value.claimAsset.amount,
              usdValue: claimable.value.usd,
              isSwapping: requiresSwap,
              outputAsset: { symbol: outputConfig.token.symbol, address: outputTokenAddress },
              outputChainId: outputConfig.chainId,
              failureStep: 'claim',
              errorMessage: ErrorMessages.CLAIM_ERROR,
            });
          } else {
            // Bridge error (retry not possible)
            setClaimStatus('unrecoverableError');
            logger.error(new RainbowError(`[TransactionClaimableContext]: ${ErrorMessages.SWAP_ERROR}`), {
              message: errorMessage,
              recoverable: false,
            });
            analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
              claimableType: 'transaction',
              claimableId: claimable.uniqueId,
              chainId: claimable.chainId,
              asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
              amount: claimable.value.claimAsset.amount,
              usdValue: claimable.value.usd,
              isSwapping: requiresSwap,
              outputAsset: { symbol: outputConfig.token.symbol, address: outputTokenAddress },
              outputChainId: outputConfig.chainId,
              failureStep: 'swap',
              errorMessage: ErrorMessages.SWAP_ERROR,
            });
          }
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
          setClaimStatus('recoverableError');
          logger.error(new RainbowError(`[TransactionClaimableContext]: ${ErrorMessages.CLAIM_ERROR}`), {
            message: (e as Error)?.message,
          });
          analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
            claimableType: 'transaction',
            claimableId: claimable.uniqueId,
            chainId: claimable.chainId,
            asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
            amount: claimable.value.claimAsset.amount,
            usdValue: claimable.value.usd,
            isSwapping: requiresSwap,
            outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
            outputChainId: claimable.chainId,
            failureStep: 'claim',
            errorMessage: ErrorMessages.CLAIM_ERROR,
          });
        }
      }

      haptics.notificationSuccess();
      setClaimStatus('success');

      analyticsV2.track(analyticsV2.event.claimClaimableSucceeded, {
        claimableType: 'transaction',
        claimableId: claimable.uniqueId,
        chainId: claimable.chainId,
        asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
        amount: claimable.value.claimAsset.amount,
        usdValue: claimable.value.usd,
        isSwapping: requiresSwap,
        outputAsset: { symbol: outputConfig.token.symbol, address: outputTokenAddress },
        outputChainId: outputConfig.chainId,
      });

      // Immediately remove the claimable from cached data
      queryClient.setQueryData(queryKey, (oldData: Claimable[] | undefined) => oldData?.filter(c => c.uniqueId !== claimable.uniqueId));
    },
    onError: e => {
      haptics.notificationError();
      setClaimStatus('recoverableError');
      logger.error(new RainbowError(`[TransactionClaimableContext]: ${ErrorMessages.UNHANDLED_ERROR}`), {
        message: (e as Error)?.message,
      });
      analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
        claimableType: 'transaction',
        claimableId: claimable.uniqueId,
        chainId: claimable.chainId,
        asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
        amount: claimable.value.claimAsset.amount,
        usdValue: claimable.value.usd,
        isSwapping: requiresSwap,
        outputAsset: { symbol: outputConfig.token?.symbol ?? '', address: outputTokenAddress ?? '' },
        outputChainId: outputConfig.chainId ?? -1,
        failureStep: 'unknown',
        errorMessage: ErrorMessages.UNHANDLED_ERROR,
      });
    },
    onSuccess: () => {
      // claimStatus should not be set to claiming at this point, if it is, something went wrong
      if (claimStatus === 'claiming') {
        haptics.notificationError();
        setClaimStatus('recoverableError');
        logger.error(new RainbowError(`[TransactionClaimableContext]: ${ErrorMessages.UNRESOLVED_CLAIM_STATUS}`));
        analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
          claimableType: 'transaction',
          claimableId: claimable.uniqueId,
          chainId: claimable.chainId,
          asset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          amount: claimable.value.claimAsset.amount,
          usdValue: claimable.value.usd,
          isSwapping: requiresSwap,
          outputAsset: { symbol: outputConfig.token?.symbol ?? '', address: outputTokenAddress ?? '' },
          outputChainId: outputConfig.chainId ?? -1,
          failureStep: 'unknown',
          errorMessage: ErrorMessages.UNRESOLVED_CLAIM_STATUS,
        });
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
        claimStatus,
        claimable,
        quoteState,
        txState,
        requiresSwap,

        setClaimStatus,
        setOutputConfig,
        setQuoteState,
        setTxState,

        claim,
      }}
    >
      {children}
    </TransactionClaimableContext.Provider>
  );
}
