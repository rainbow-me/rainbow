import React, { Dispatch, SetStateAction, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ChainId } from '@/state/backendNetworks/types';
import { TokenToReceive, TransactionClaimableTxPayload } from '../types';
import { CrosschainQuote, ETH_ADDRESS, getCrosschainQuote, getQuote, Quote, QuoteParams } from '@rainbow-me/swaps';
import { Claimable, ClaimableType, TransactionClaimable } from '@/resources/addys/claimables/types';
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
  add,
} from '@/helpers/utilities';
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
import { useMutation } from '@tanstack/react-query';
import { loadWallet } from '@/model/wallet';
import { externalTokenQueryFunction, externalTokenQueryKey } from '@/resources/assets/externalAssetsQuery';
import { walletExecuteRap } from '@/raps/execute';
import { executeClaim } from '../claim';
import { weiToGwei } from '@/parsers';
import { lessThanOrEqualToWorklet } from '@/safe-math/SafeMath';
import { ClaimStatus } from '../../shared/types';
import { analytics } from '@/analytics';
import { getDefaultSlippageWorklet } from '@/__swaps__/utils/swaps';
import { getRemoteConfig } from '@/model/remoteConfig';
import { estimateClaimUnlockSwapGasLimit } from '../estimateGas';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import showWalletErrorAlert from '@/helpers/support';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useClaimablesStore } from '@/state/claimables/claimables';
import { transformRainbowTokenToParsedSearchAsset } from '@/__swaps__/utils/assets';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

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

interface GasState {
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
  gasState: GasState;
  quoteState: QuoteState;
  swapEnabled: boolean;
  requiresSwap: boolean;

  setClaimStatus: Dispatch<SetStateAction<ClaimStatus>>;
  setOutputConfig: Dispatch<SetStateAction<OutputConfig>>;
  setQuoteState: Dispatch<SetStateAction<QuoteState>>;
  setGasState: Dispatch<SetStateAction<GasState>>;

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
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const accountAddress = useAccountAddress();

  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('notReady');
  const [quoteState, setQuoteState] = useState<QuoteState>({
    quote: undefined,
    nativeValueDisplay: undefined,
    tokenAmountDisplay: undefined,
    status: 'none',
  });
  const [gasState, setGasState] = useState<GasState>({
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
    },
  });

  // chain-specific address for output token
  const outputTokenAddress = outputConfig.chainId ? outputConfig.token?.networks[outputConfig.chainId]?.address : undefined;
  const swapEnabled = claimable.type !== ClaimableType.RainbowSuperTokenCreatorFees && claimable.actionType !== 'multi_transaction';
  const requiresSwap = !!(
    swapEnabled &&
    outputConfig.token &&
    outputConfig.chainId &&
    (outputConfig.token.symbol !== claimable.asset.symbol || outputConfig.chainId !== claimable.chainId)
  );

  const gasSettings = useGasSettings(claimable.chainId, GasSpeed.FAST);

  const updateQuoteState = useCallback(async () => {
    if (!outputConfig?.token || !outputConfig.chainId || !outputTokenAddress) {
      logger.warn('[TransactionClaimableContext]: Somehow entered unreachable state in updateQuote');
      setQuoteState(prev => ({ ...prev, status: 'none' }));
      return;
    }
    try {
      const [asset] = claimable.assets;
      const quoteParams: QuoteParams = {
        chainId: claimable.chainId,
        fromAddress: accountAddress,
        sellTokenAddress: asset.asset.isNativeAsset ? ETH_ADDRESS : asset.asset.address,
        buyTokenAddress: outputConfig.token.isNativeAsset ? ETH_ADDRESS : outputTokenAddress,
        sellAmount: convertAmountToRawAmount(asset.amount.amount, asset.asset.decimals),
        slippage: +getDefaultSlippageWorklet(claimable.chainId, getRemoteConfig().default_slippage_bips_chainId),
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
  }, [accountAddress, claimable.assets, claimable.chainId, nativeCurrency, outputConfig.chainId, outputConfig.token, outputTokenAddress]);

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
  const canEstimateGas = !!(gasSettings && (!requiresSwap || (quoteState.quote && quoteState.status === 'success')));

  const updateGasState = useCallback(async () => {
    try {
      if (!canEstimateGas) {
        if (gasState.status === 'fetching') {
          setGasState(prev => ({ ...prev, status: 'none' }));
        }
        return;
      }

      const gasLimit = await estimateClaimUnlockSwapGasLimit({
        chainId: claimable.chainId,
        claim: claimable.action.map(action => ({ to: action.to, from: accountAddress, data: action.data })),
        quote: quoteState.quote,
      });

      if (!gasLimit || gasLimit === '0') {
        if (gasState.status === 'fetching') {
          setGasState(prev => ({ ...prev, status: 'error' }));
        }
        logger.warn('[TransactionClaimableContext]: Failed to estimate gas limit');
        return;
      }

      const gasFeeWei = calculateGasFeeWorklet(gasSettings, gasLimit);

      const nativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[claimable.chainId];
      const userNativeAsset = userAssetsStore.getState().getNativeAssetForChain(claimable.chainId);

      const gasFeeNativeToken = formatUnits(safeBigInt(gasFeeWei), nativeAsset.decimals);
      const userBalance = userNativeAsset?.balance?.amount || '0';

      const sufficientGas = lessThanOrEqualToWorklet(gasFeeNativeToken, userBalance);
      const networkAssetPrice = userNativeAsset?.price?.value?.toString();

      let gasFeeNativeCurrencyDisplay;
      if (!networkAssetPrice) {
        gasFeeNativeCurrencyDisplay = `${formatNumber(weiToGwei(gasFeeWei))} Gwei`;
      } else {
        const feeInUserCurrency = multiply(networkAssetPrice, gasFeeNativeToken);

        gasFeeNativeCurrencyDisplay = convertAmountToNativeDisplayWorklet(feeInUserCurrency, nativeCurrency, true);
      }

      setLastGasEstimateTime(Date.now());
      setGasState({
        isSufficientGas: sufficientGas,
        gasFeeDisplay: gasFeeNativeCurrencyDisplay,
        gasLimit,
        status: 'success',
      });
    } catch (e) {
      if (gasState.status === 'fetching') {
        // if is initial gas estimate, set status to error
        setGasState(prev => ({ ...prev, status: 'error' }));
      }
      logger.warn('[TransactionClaimableContext]: Failed to estimate gas', { error: e });
    }
  }, [canEstimateGas, claimable.chainId, claimable.action, accountAddress, quoteState.quote, gasSettings, gasState.status, nativeCurrency]);

  useEffect(() => {
    // estimate gas if it hasn't been estimated yet or if 10 seconds have passed since last estimate
    if (
      gasState.status !== 'fetching' &&
      canEstimateGas &&
      ((!gasState.gasLimit && gasState.status !== 'error') || Date.now() - lastGasEstimateTime > 10_000)
    ) {
      // update tx state/claim status only if initial gas estimate
      if (!gasState.gasLimit) {
        setGasState(prev => ({
          ...prev,
          status: 'fetching',
        }));
        setClaimStatus('notReady');
      }
      updateGasState();
    }
  }, [canEstimateGas, claimStatus, lastGasEstimateTime, gasState.gasFeeDisplay, gasState.gasLimit, gasState.status, updateGasState]);

  // claim is ready if we have tx payload, sufficent gas, quote (if required), and previously in notReady state
  useEffect(() => {
    if (
      gasState.status === 'success' &&
      gasState.isSufficientGas &&
      (!requiresSwap || quoteState.status === 'success') &&
      claimStatus === 'notReady' &&
      outputConfig.chainId &&
      outputConfig.token
    ) {
      setClaimStatus('ready');
    }
  }, [claimStatus, outputConfig.chainId, outputConfig.token, quoteState.status, requiresSwap, gasState.isSufficientGas, gasState.status]);

  const { mutate: claim } = useMutation({
    mutationFn: async () => {
      if (
        !gasState.gasLimit ||
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

      let wallet;
      try {
        wallet = await loadWallet({
          address: accountAddress,
          provider,
        });
      } catch {
        showWalletErrorAlert();
      }

      if (!wallet) {
        // Biometrics auth failure (retry possible)
        haptics.notificationError();
        setClaimStatus('recoverableError');
        return;
      }

      const gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts = gasSettings.isEIP1559
        ? {
            maxFeePerGas: add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee),
            maxPriorityFeePerGas: gasSettings.maxPriorityFee,
          }
        : { gasPrice: gasSettings.gasPrice };

      const gasFeeParamsBySpeed = getGasSettingsBySpeed(claimable.chainId);

      const claimTxns: TransactionClaimableTxPayload[] = [];
      let currentNonce = await getNextNonce({ address: accountAddress, chainId: claimable.chainId });
      for (const action of claimable.action) {
        claimTxns.push({
          value: '0x0' as const,
          data: action.data,
          from: accountAddress,
          chainId: claimable.chainId,
          nonce: currentNonce,
          to: action.to,
          gasLimit: gasState.gasLimit,
          ...gasParams,
        });
        currentNonce++;
      }

      try {
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

          if (!quoteState.quote) {
            haptics.notificationError();
            setClaimStatus('recoverableError');
            logger.error(new RainbowError('[TransactionClaimableContext]: Failed to claim claimable due to undefined quote'));
            return;
          }

          const [asset] = claimable.assets;

          const swapData = {
            amount: asset.amount.amount,
            sellAmount: convertAmountToRawAmount(asset.amount.amount, asset.asset.decimals),
            chainId: claimable.chainId,
            toChainId: outputConfig.chainId,
            assetToSell: transformRainbowTokenToParsedSearchAsset(
              asset.asset.isNativeAsset ? { ...asset.asset, address: ETH_ADDRESS } : asset.asset
            ),
            assetToBuy: outputAsset.isNativeAsset ? { ...outputAsset, address: ETH_ADDRESS } : outputAsset,
            address: accountAddress,
          };

          // @ts-expect-error - TODO: assetToBuy is not typed correctly
          const { errorMessage } = await walletExecuteRap(wallet, 'claimClaimable', {
            ...swapData,
            gasParams,
            gasFeeParamsBySpeed,
            quote: quoteState.quote,
            additionalParams: { claimTxns },
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
              analytics.track(analytics.event.claimClaimableFailed, {
                claimableType: 'transaction',
                claimableId: claimable.type,
                chainId: claimable.chainId,
                assets: claimable.assets.map(asset => ({
                  symbol: asset.asset.symbol,
                  address: asset.asset.address,
                  amount: asset.amount.amount,
                })),
                usdValue: claimable.totalCurrencyValue.amount,
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
              analytics.track(analytics.event.claimClaimableFailed, {
                claimableType: 'transaction',
                claimableId: claimable.type,
                chainId: claimable.chainId,
                assets: claimable.assets.map(asset => ({
                  symbol: asset.asset.symbol,
                  address: asset.asset.address,
                  amount: asset.amount.amount,
                })),
                usdValue: claimable.totalCurrencyValue.amount,
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
          await executeClaim({
            asset: claimable.asset,
            claimTxns,
            wallet,
          });
        }

        setClaimStatus('success');

        analytics.track(analytics.event.claimClaimableSucceeded, {
          claimableType: claimable.actionType,
          claimableId: claimable.type,
          chainId: claimable.chainId,
          assets: claimable.assets.map(asset => ({
            symbol: asset.asset.symbol,
            address: asset.asset.address,
            amount: asset.amount.amount,
          })),
          isSwapping: requiresSwap,
          usdValue: claimable.totalCurrencyValue.amount,
          outputAsset: { symbol: outputConfig.token.symbol, address: outputTokenAddress },
          outputChainId: outputConfig.chainId,
        });

        useClaimablesStore.getState().markClaimed(claimable.uniqueId);
      } catch (e) {
        haptics.notificationError();
        setClaimStatus('recoverableError');
        logger.error(new RainbowError(`[TransactionClaimableContext]: ${ErrorMessages.CLAIM_ERROR}`), {
          message: (e as Error)?.message,
        });
        analytics.track(analytics.event.claimClaimableFailed, {
          claimableType: 'transaction',
          claimableId: claimable.type,
          chainId: claimable.chainId,
          assets: claimable.assets.map(asset => ({
            symbol: asset.asset.symbol,
            address: asset.asset.address,
            amount: asset.amount.amount,
          })),
          isSwapping: requiresSwap,
          usdValue: claimable.totalCurrencyValue.amount,
          outputAsset: { symbol: claimable.asset.symbol, address: claimable.asset.address },
          outputChainId: claimable.chainId,
          failureStep: 'claim',
          errorMessage: ErrorMessages.CLAIM_ERROR,
        });
      }
    },
    onError: e => {
      haptics.notificationError();
      setClaimStatus('recoverableError');
      logger.error(new RainbowError(`[TransactionClaimableContext]: ${ErrorMessages.UNHANDLED_ERROR}`), {
        message: (e as Error)?.message,
      });
      analytics.track(analytics.event.claimClaimableFailed, {
        claimableType: 'transaction',
        claimableId: claimable.type,
        chainId: claimable.chainId,
        assets: claimable.assets.map(asset => ({ symbol: asset.asset.symbol, address: asset.asset.address, amount: asset.amount.amount })),
        isSwapping: requiresSwap,
        usdValue: claimable.totalCurrencyValue.amount,
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
        analytics.track(analytics.event.claimClaimableFailed, {
          claimableType: 'transaction',
          claimableId: claimable.type,
          chainId: claimable.chainId,
          assets: claimable.assets.map(asset => ({
            symbol: asset.asset.symbol,
            address: asset.asset.address,
            amount: asset.amount.amount,
          })),
          isSwapping: requiresSwap,
          usdValue: claimable.totalCurrencyValue.amount,
          outputAsset: { symbol: outputConfig.token?.symbol ?? '', address: outputTokenAddress ?? '' },
          outputChainId: outputConfig.chainId ?? -1,
          failureStep: 'unknown',
          errorMessage: ErrorMessages.UNRESOLVED_CLAIM_STATUS,
        });
      }
    },
    onSettled: () => {
      // Clear and refresh claimables data 20s after claim button is pressed, regardless of success or failure
      setTimeout(() => useClaimablesStore.getState().fetch(undefined, { staleTime: 0 }), 20_000);
    },
  });

  return (
    <TransactionClaimableContext.Provider
      value={{
        outputConfig,
        claimStatus,
        claimable,
        quoteState,
        gasState,
        swapEnabled,
        requiresSwap,
        setClaimStatus,
        setOutputConfig,
        setQuoteState,
        setGasState,

        claim,
      }}
    >
      {children}
    </TransactionClaimableContext.Provider>
  );
}
