import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccountSettings, useGas } from '@/hooks';
import { ethereumUtils, haptics } from '@/utils';
import { Claimable, TransactionClaimable } from '@/resources/addys/claimables/types';
import { estimateGasWithPadding, getProvider } from '@/handlers/web3';
import { getNextNonce } from '@/state/nonces';
import { needsL1SecurityFeeChains } from '@/chains';
import { logger, RainbowError } from '@/logger';
import { convertAmountToNativeDisplayWorklet, convertAmountToRawAmount } from '@/__swaps__/utils/numbers';
import { useMutation } from '@tanstack/react-query';
import { loadWallet } from '@/model/wallet';
import { walletExecuteRap } from '@/raps/execute';
import { claimablesQueryKey } from '@/resources/addys/claimables/query';
import { queryClient } from '@/react-query';
import { CrosschainQuote, ETH_ADDRESS, getCrosschainQuote, getQuote, Quote, QuoteParams } from '@rainbow-me/swaps';
import { useNativeAsset } from '@/utils/ethereumUtils';
import { useMeteorologySuggestion } from '@/__swaps__/utils/meteorology';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { getGasSettingsBySpeed } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { GasSpeed } from '@/__swaps__/types/gas';
import { ChainId } from '@/chains/types';
import { Box } from '@/design-system';
import * as i18n from '@/languages';
import { ClaimPanel } from './ClaimPanel';
import { ClaimValueDisplay } from './ClaimValueDisplay';
import { ClaimCustomization } from './ClaimCustomization';
import { ClaimButton } from './ClaimButton';
import { GasDetails } from './GasDetails';
import { TokenToReceive, TransactionClaimableTxPayload } from '../types';
import { useExternalToken } from '@/resources/assets/externalAssetsQuery';
import { useClaimContext } from './ClaimContext';

export function TransactionClaimablePanel({ claimable }: { claimable: TransactionClaimable }) {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { isGasReady, isSufficientGas, isValidGas, selectedGasFee, startPollingGasFees, stopPollingGasFees, updateTxFee } = useGas();
  const { data: meteorologyData } = useMeteorologySuggestion({
    chainId: claimable.chainId,
    speed: GasSpeed.FAST,
    enabled: true,
  });

  const {
    outputConfig: { chainId: outputChainId, token: outputToken },
    claimStatus,
    setClaimStatus,
  } = useClaimContext();

  const [baseTxPayload, setBaseTxPayload] = useState<
    Omit<TransactionClaimableTxPayload, 'gasLimit' | 'maxPriorityFeePerGas' | 'maxFeePerGas'> | undefined
  >();
  const [txPayload, setTxPayload] = useState<TransactionClaimableTxPayload | undefined>();
  const [quote, setQuote] = useState<Quote | CrosschainQuote | undefined>();

  const queryKey = claimablesQueryKey({ address: accountAddress, currency: nativeCurrency });

  const provider = useMemo(() => getProvider({ chainId: claimable.chainId }), [claimable.chainId]);

  const buildTxPayload = useCallback(async () => {
    const payload = {
      value: '0x0' as const,
      data: claimable.action.data,
      from: accountAddress,
      chainId: claimable.chainId,
      nonce: await getNextNonce({ address: accountAddress, chainId: claimable.chainId }),
      to: claimable.action.to,
    };

    setBaseTxPayload(payload);
  }, [accountAddress, claimable.action.to, claimable.action.data, claimable.chainId, setBaseTxPayload]);

  useEffect(() => {
    buildTxPayload();
  }, [buildTxPayload]);

  useEffect(() => {
    startPollingGasFees(claimable.chainId);
    return () => {
      stopPollingGasFees();
    };
  }, [claimable.chainId, startPollingGasFees, stopPollingGasFees]);

  const estimateGas = useCallback(async () => {
    if (!baseTxPayload) {
      logger.error(new RainbowError('[ClaimingTransactionClaimable]: attempted to estimate gas without a tx payload'));
      return;
    }

    if (!meteorologyData?.maxBaseFee || !meteorologyData?.maxPriorityFee) {
      logger.error(new RainbowError('[ClaimingTransactionClaimable]: incomplete meteorology gas data'));
      return;
    }

    const gasParams: TransactionGasParamAmounts = {
      maxFeePerGas: meteorologyData.maxBaseFee,
      maxPriorityFeePerGas: meteorologyData.maxPriorityFee,
    };
    // const gasFeeParamsBySpeed = getGasSettingsBySpeed(claimable.chainId);

    // const gasParams = parseGasParamsForTransaction(selectedGasFee);
    const updatedTxPayload = { ...baseTxPayload, ...gasParams };

    const gasLimit = await estimateGasWithPadding(updatedTxPayload, null, null, provider);

    if (!gasLimit) {
      updateTxFee(null, null);
      logger.error(new RainbowError('[ClaimingTransactionClaimable]: Failed to estimate gas limit'));
      return;
    }

    if (needsL1SecurityFeeChains.includes(claimable.chainId)) {
      const l1SecurityFee = await ethereumUtils.calculateL1FeeOptimism(
        {
          to: claimable.action.to,
          from: accountAddress,
          value: '0x0',
          data: claimable.action.data,
        },
        provider
      );

      if (!l1SecurityFee) {
        updateTxFee(null, null);
        logger.error(new RainbowError('[ClaimingTransactionClaimable]: Failed to calculate L1 security fee'));
        return;
      }

      updateTxFee(gasLimit, null, l1SecurityFee);
    } else {
      updateTxFee(gasLimit, null);
    }

    setTxPayload({ ...updatedTxPayload, gasLimit });
  }, [
    baseTxPayload,
    meteorologyData?.maxBaseFee,
    meteorologyData?.maxPriorityFee,
    provider,
    claimable.chainId,
    claimable.action.to,
    claimable.action.data,
    updateTxFee,
    accountAddress,
  ]);

  useEffect(() => {
    if (baseTxPayload) {
      try {
        estimateGas();
      } catch (e) {
        logger.warn('[ClaimingTransactionClaimable]: Failed to estimate gas', { error: e });
      }
    }
  }, [baseTxPayload, estimateGas, selectedGasFee]);

  const isTransactionReady = !!(isGasReady && isSufficientGas && isValidGas && txPayload);

  const nativeCurrencyGasFeeDisplay = convertAmountToNativeDisplayWorklet(
    selectedGasFee?.gasFee?.estimatedFee?.native?.value?.amount,
    nativeCurrency,
    true
  );

  const { data: outputAsset } = useExternalToken(
    {
      address: (outputToken as TokenToReceive)?.address,
      chainId: outputChainId!,
      currency: nativeCurrency,
    },
    { enabled: !!(outputToken && outputChainId) }
  );

  const updateQuote = useCallback(async () => {
    if (!outputAsset || !outputChainId) {
      return;
    }
    const quoteParams: QuoteParams = {
      chainId: claimable.chainId,
      fromAddress: accountAddress,
      sellTokenAddress: claimable.asset.isNativeAsset ? ETH_ADDRESS : claimable.asset.address,
      buyTokenAddress: outputAsset.isNativeAsset ? ETH_ADDRESS : outputAsset.address,
      sellAmount: convertAmountToRawAmount(0.00001, claimable.asset.decimals),
      slippage: 0.5,
      refuel: false,
      toChainId: outputChainId,
      currency: nativeCurrency,
    };

    const quote = claimable.chainId === outputChainId ? await getQuote(quoteParams) : await getCrosschainQuote(quoteParams);
    if (!quote || 'error' in quote) {
      if (quote?.message === 'no routes found') {
        setClaimStatus('noRoute');
      } else {
        setClaimStatus('noQuote');
        logger.error(new RainbowError('[ClaimingTransactionClaimable]: failed to get quote'), { quote, quoteParams });
      }
      setQuote(undefined);
    } else {
      setQuote(quote);
    }
  }, [
    accountAddress,
    claimable.asset.address,
    claimable.asset.decimals,
    claimable.asset.isNativeAsset,
    claimable.chainId,
    nativeCurrency,
    outputAsset,
    outputChainId,
    setClaimStatus,
  ]);

  useEffect(() => {
    updateQuote();
  }, [updateQuote]);

  const { mutate: claimClaimable } = useMutation({
    mutationFn: async () => {
      if (!txPayload || !outputAsset || !outputChainId || !quote) {
        haptics.notificationError();
        setClaimStatus('error');
        logger.error(new RainbowError('[ClaimingTransactionClaimable]: Failed to claim claimable due to missing tx payload'));
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

      // source?: Source;
      // chainId: number;
      // fromAddress: EthereumAddress;
      // sellTokenAddress: EthereumAddress;
      // buyTokenAddress: EthereumAddress;
      // sellAmount?: BigNumberish;
      // buyAmount?: BigNumberish;
      // slippage: number;
      // destReceiver?: EthereumAddress;
      // refuel?: boolean;
      // feePercentageBasisPoints?: number;
      // toChainId?: number;
      // currency: string;

      // const params = buildQuoteParams({
      //   currentAddress: accountAddress,
      //   inputAmount: maxAdjustedInputAmount,
      //   inputAsset: claimable.asset,
      //   lastTypedInput: lastTypedInputParam,
      //   outputAmount,
      //   outputAsset: internalSelectedOutputAsset.value,
      // });

      const swapData = {
        amount: claimable.value.claimAsset.amount,
        sellAmount: convertAmountToRawAmount(0.00001, claimable.asset.decimals),
        buyAmount: undefined,
        // permit?: boolean;
        chainId: claimable.chainId,
        toChainId: outputChainId,
        // requiresApprove?: boolean;
        // meta?: SwapMetadata;
        assetToSell: outputAsset,
        assetToBuy: outputAsset.isNativeAsset ? { ...outputAsset, address: ETH_ADDRESS } : outputAsset,
        // nonce?: number;
        // flashbots?: boolean;
        address: accountAddress,
      };
      console.log(outputChainId, 'outputChainId');
      console.log(outputAsset, 'outputAsset');
      console.log(claimable.chainId, outputChainId);

      console.log(claimable.value.claimAsset.amount);
      console.log('quote', quote);
      if (!quote || 'error' in quote) {
        haptics.notificationError();
        setClaimStatus('error');
        logger.error(new RainbowError('[ClaimingTransactionClaimable]: quote error'));
        return;
      }

      // const { errorMessage } = await walletExecuteRap(wallet, {
      //   type: 'claimTransactionClaimableRap',
      //   claimTransactionClaimableActionParameters: { claimTx: txPayload, asset: claimable.asset },
      //   crosschainSwapActionParameters: { ...swapData, quote },
      // });

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
        additionalParams: { claimTx: txPayload },
      });

      if (errorMessage) {
        haptics.notificationError();
        setClaimStatus('error');
        logger.error(new RainbowError('[ClaimingTransactionClaimable]: Failed to claim claimable due to rap error'), {
          message: errorMessage,
        });
      } else {
        haptics.notificationSuccess();
        setClaimStatus('success');

        // Immediately remove the claimable from cached data
        queryClient.setQueryData(queryKey, (oldData: Claimable[] | undefined) => oldData?.filter(c => c.uniqueId !== claimable.uniqueId));
      }
    },
    onError: e => {
      haptics.notificationError();
      setClaimStatus('error');
      logger.error(new RainbowError('[ClaimingTransactionClaimable]: Failed to claim claimable due to unhandled error'), {
        message: (e as Error)?.message,
      });
    },
    onSuccess: () => {
      if (claimStatus === 'claiming') {
        haptics.notificationError();
        setClaimStatus('error');
        logger.error(
          new RainbowError('[ClaimingTransactionClaimable]: claim function completed but never resolved status to success or error state')
        );
      }
    },
    onSettled: () => {
      // Clear and refresh claimables data 20s after claim button is pressed, regardless of success or failure
      setTimeout(() => queryClient.invalidateQueries(queryKey), 20_000);
    },
  });

  return (
    <ClaimPanel claimStatus={claimStatus} iconUrl={claimable.iconUrl}>
      <Box gap={20} alignItems="center">
        <ClaimValueDisplay
          chainId={outputChainId}
          iconUrl={outputToken?.iconUrl}
          nativeValueDisplay={claimable.value.nativeAsset.display} // FIXME
          symbol={outputToken?.symbol}
        />
        <ClaimCustomization claimableAsset={claimable.asset} />
      </Box>
      <Box alignItems="center" width="full">
        <ClaimButton
          isTransactionReady={isTransactionReady}
          isSufficientGas={isSufficientGas}
          claimType="transaction"
          claim={claimClaimable}
          claimStatus={claimStatus}
          claimValueDisplay={claimable.value.claimAsset.display} // FIXME
        />
        <GasDetails
          chainId={claimable.chainId}
          claimStatus={claimStatus}
          isGasReady={isGasReady}
          nativeValueDisplay={nativeCurrencyGasFeeDisplay}
        />
      </Box>
    </ClaimPanel>
  );
}
