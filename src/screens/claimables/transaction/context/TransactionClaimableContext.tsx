import React, { Dispatch, SetStateAction, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ChainId } from '@/chains/types';
import { TokenToReceive } from '../types';
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
  formatNumber,
  convertAmountToNativeDisplayWorklet,
} from '@/helpers/utilities';
import { useUserNativeNetworkAsset } from '@/resources/assets/useUserAsset';
import { GasSpeed } from '@/__swaps__/types/gas';
import { getGasSettingsBySpeed, useGasSettings } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { getNextNonce } from '@/state/nonces';
import { getProvider } from '@/handlers/web3';
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
import { weiToGwei } from '@/parsers';
import { lessThanOrEqualToWorklet } from '@/safe-math/SafeMath';
import { ClaimStatus } from '../../shared/types';
import { analyticsV2 } from '@/analytics';
import { getDefaultSlippageWorklet } from '@/__swaps__/utils/swaps';
import { getRemoteConfig } from '@/model/remoteConfig';
import { estimateClaimUnlockSwapGasLimit } from '../estimateGas';

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
  gasLimit: string | undefined;
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
    gasLimit: undefined,
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

  const gasSettings = useGasSettings(claimable.chainId, GasSpeed.FAST);

  const { data: userNativeNetworkAsset, isLoading: isLoadingNativeNetworkAsset } = useUserNativeNetworkAsset(claimable.chainId);

  const updateQuoteState = useCallback(async () => {
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
        sellAmount: convertAmountToRawAmount(0.0001, claimable.asset.decimals),
        slippage: +getDefaultSlippageWorklet(claimable.chainId, getRemoteConfig()),
        refuel: false,
        toChainId: outputConfig.chainId,
        currency: nativeCurrency,
        feePercentageBasisPoints: 0,
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
      updateQuoteState();
    }
  }, [outputTokenAddress, quoteState.quote, quoteState.status, requiresSwap, updateQuoteState]);

  const provider = useMemo(() => getProvider({ chainId: claimable.chainId }), [claimable.chainId]);

  // make sure we have necessary data before attempting gas estimation
  const canEstimateGas = !!(
    !isLoadingNativeNetworkAsset &&
    userNativeNetworkAsset &&
    gasSettings &&
    (!requiresSwap || (quoteState.quote && quoteState.status === 'success'))
  );

  const updateGasState = useCallback(async () => {
    try {
      if (!canEstimateGas) {
        if (txState.status === 'fetching') {
          setTxState(prev => ({ ...prev, status: 'none' }));
        }
        return;
      }

      const gasLimit = await estimateClaimUnlockSwapGasLimit({
        chainId: claimable.chainId,
        claim: { to: claimable.action.to, from: accountAddress, data: claimable.action.data },
        quote: quoteState.quote,
      });

      if (!gasLimit) {
        if (txState.status === 'fetching') {
          setTxState(prev => ({ ...prev, status: 'none' }));
        }
        logger.warn('[TransactionClaimableContext]: Failed to estimate claim gas limit');
        return;
      }

      const gasFeeWei = calculateGasFeeWorklet(gasSettings, gasLimit);

      const gasFeeNativeToken = formatUnits(safeBigInt(gasFeeWei), userNativeNetworkAsset.decimals);
      const userBalance = userNativeNetworkAsset.balance?.amount || '0';

      const sufficientGas = lessThanOrEqualToWorklet(gasFeeNativeToken, userBalance);
      const networkAssetPrice = userNativeNetworkAsset.price?.value?.toString();

      let gasFeeNativeCurrencyDisplay;
      if (!networkAssetPrice) {
        gasFeeNativeCurrencyDisplay = `${formatNumber(weiToGwei(gasFeeWei))} Gwei`;
      } else {
        const feeInUserCurrency = multiply(networkAssetPrice, gasFeeNativeToken);

        gasFeeNativeCurrencyDisplay = convertAmountToNativeDisplayWorklet(feeInUserCurrency, nativeCurrency, true);
      }

      setLastGasEstimateTime(Date.now());
      setTxState({
        isSufficientGas: sufficientGas,
        gasFeeDisplay: gasFeeNativeCurrencyDisplay,
        gasLimit,
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
    claimable.chainId,
    claimable.action.to,
    claimable.action.data,
    accountAddress,
    quoteState.quote,
    gasSettings,
    userNativeNetworkAsset?.decimals,
    userNativeNetworkAsset?.balance?.amount,
    userNativeNetworkAsset?.price?.value,
    txState.status,
    nativeCurrency,
  ]);

  useEffect(() => {
    // estimate gas if it hasn't been estimated yet or if 10 seconds have passed since last estimate
    if (canEstimateGas && ((!txState.gasLimit && txState.status !== 'error') || Date.now() - lastGasEstimateTime > 10_000)) {
      // update tx state/claim status only if initial gas estimate
      if (!txState.gasLimit) {
        setTxState(prev => ({
          ...prev,
          status: 'fetching',
        }));
        setClaimStatus('notReady');
      }
      updateGasState();
    }
  }, [canEstimateGas, claimStatus, lastGasEstimateTime, txState.gasFeeDisplay, txState.gasLimit, txState.status, updateGasState]);

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
        !txState.gasLimit ||
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

      const gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts = gasSettings.isEIP1559
        ? {
            maxFeePerGas: gasSettings.maxBaseFee,
            maxPriorityFeePerGas: gasSettings.maxPriorityFee,
          }
        : { gasPrice: gasSettings.gasPrice };

      const gasFeeParamsBySpeed = getGasSettingsBySpeed(claimable.chainId);

      const txPayload = {
        value: '0x0' as const,
        data: claimable.action.data,
        from: accountAddress,
        chainId: claimable.chainId,
        nonce: await getNextNonce({ address: accountAddress, chainId: claimable.chainId }),
        to: claimable.action.to,
        gasLimit: txState.gasLimit,
        ...gasParams,
      };

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
          assetToSell: claimable.asset.isNativeAsset ? { ...claimable.asset, address: ETH_ADDRESS } : claimable.asset,
          assetToBuy: outputAsset.isNativeAsset ? { ...outputAsset, address: ETH_ADDRESS } : outputAsset,
          address: accountAddress,
        };

        const { errorMessage } = await walletExecuteRap(wallet, 'claimClaimable', {
          ...swapData,
          gasParams,
          // @ts-expect-error - collision between old gas types and new
          gasFeeParamsBySpeed,
          quote: quoteState.quote,
          additionalParams: { claimTx: txPayload },
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
            claimTx: txPayload,
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
