import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccentColorProvider, Bleed, Box, Inline, Text, TextShadow, globalColors, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { ListHeader, Panel, TapToDismiss, controlPanelStyles } from '@/components/SmoothPager/ListPanel';
import { useAccountSettings, useGas } from '@/hooks';
import { ethereumUtils, safeAreaInsetValues } from '@/utils';
import { View } from 'react-native';
import { IS_IOS } from '@/env';
import { ButtonPressAnimation } from '@/components/animations';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Claimable, TransactionClaimable } from '@/resources/addys/claimables/types';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useTheme } from '@/theme';
import { FasterImageView } from '@candlefinance/faster-image';
import { useClaimables } from '@/resources/addys/claimables/query';
import { useMutation } from '@tanstack/react-query';
import { RapSwapActionParameters } from '@/raps/references';
import { loadWallet } from '@/model/wallet';
import { getGasSettings, getGasSettingsBySpeed } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';
import { GasSpeed } from '@/__swaps__/types/gas';
import { estimateGasWithPadding, getProvider } from '@/handlers/web3';
import { parseGasParamsForTransaction } from '@/parsers';
import { BigNumber } from '@ethersproject/bignumber';
import { getNextNonce } from '@/state/nonces';
import { TransactionRequest } from '@ethersproject/providers';
import { chainsLabel, chainsName, needsL1SecurityFeeChains } from '@/chains';
import { logger, RainbowError } from '@/logger';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
// import { ContextMenuButton } from '@/components/context-menu';

type RouteParams = {
  ClaimClaimablePanelParams: { uniqueId: string };
};

export const ClaimClaimablePanel = () => {
  const {
    params: { uniqueId },
  } = useRoute<RouteProp<RouteParams, 'ClaimClaimablePanelParams'>>();

  const { isDarkMode } = useColorMode();
  const theme = useTheme();
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const { data = [] } = useClaimables(
    {
      address: accountAddress,
      currency: nativeCurrency,
    },
    {
      select: data => data?.filter(claimable => claimable.uniqueId === uniqueId),
    }
  );

  const [claimable] = data;

  if (!claimable || claimable.type !== 'transaction') return null;

  return (
    <>
      <Box
        style={[
          controlPanelStyles.panelContainer,
          { bottom: Math.max(safeAreaInsetValues.bottom + 5, IS_IOS ? 8 : 30), alignItems: 'center', width: '100%' },
        ]}
      >
        <Panel>
          <ListHeader
            TitleComponent={
              <Box alignItems="center" flexDirection="row" gap={10} justifyContent="center">
                <Box
                  as={FasterImageView}
                  source={{ url: claimable.iconUrl }}
                  style={{ height: 20, width: 20, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.03)' }}
                />
                <TextShadow shadowOpacity={0.3}>
                  <Text align="center" color="label" size="20pt" weight="heavy">
                    Claim
                  </Text>
                </TextShadow>
              </Box>
            }
            showBackButton={false}
          />

          <Box alignItems="center" paddingTop="44px" paddingBottom="24px" gap={42}>
            <Box alignItems="center" flexDirection="row" gap={8} justifyContent="center">
              <Bleed vertical={{ custom: 4.5 }}>
                <View
                  style={
                    IS_IOS && isDarkMode
                      ? {
                          shadowColor: globalColors.grey100,
                          shadowOpacity: 0.2,
                          shadowOffset: { height: 4, width: 0 },
                          shadowRadius: 6,
                        }
                      : {}
                  }
                >
                  <RainbowCoinIcon
                    size={40}
                    icon={claimable.asset.iconUrl}
                    chainId={claimable.chainId}
                    symbol={claimable.asset.symbol}
                    theme={theme}
                    colors={undefined}
                  />
                </View>
              </Bleed>
              <TextShadow blur={12} color={globalColors.grey100} shadowOpacity={0.1} y={4}>
                <Text align="center" color="label" size="44pt" weight="black">
                  {claimable.value.nativeAsset.display}
                </Text>
              </TextShadow>
            </Box>
            <ClaimingTransactionClaimable claimable={claimable} />
          </Box>
        </Panel>
      </Box>
      <TapToDismiss />
    </>
  );
};

const ClaimingTransactionClaimable = ({ claimable }: { claimable: TransactionClaimable }) => {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { isGasReady, isSufficientGas, isValidGas, selectedGasFee, startPollingGasFees, stopPollingGasFees, updateTxFee } = useGas();

  const [txPayload, setTxPayload] = useState<TransactionRequest | undefined>();

  const buildTxPayload = useCallback(async () => {
    const payload = {
      value: '0x0',
      data: claimable.action.data,
      from: accountAddress,
      network: chainsName[claimable.chainId],
      chainId: claimable.chainId,
      nonce: await getNextNonce({ address: accountAddress, chainId: claimable.chainId }),
      to: claimable.action.to,
    };

    setTxPayload(payload);
  }, [accountAddress, claimable.action.to, claimable.action.data, claimable.chainId, setTxPayload]);

  useEffect(() => {
    buildTxPayload();
  }, [buildTxPayload]);

  useEffect(() => {
    startPollingGasFees();
    return () => {
      stopPollingGasFees();
    };
  }, [startPollingGasFees, stopPollingGasFees]);

  const estimateGas = useCallback(async () => {
    if (!txPayload) {
      logger.error(new RainbowError('[ClaimingClaimablePanel]: attempted to estimate gas without a tx payload'));
      return;
    }

    const provider = getProvider({ chainId: claimable.chainId });

    const gasParams = parseGasParamsForTransaction(selectedGasFee);
    const updatedTxPayload: TransactionRequest = { ...txPayload, ...gasParams };

    const gasLimit = await estimateGasWithPadding(updatedTxPayload, null, null, provider);

    if (!gasLimit) {
      updateTxFee(null, null);
      logger.error(new RainbowError('[ClaimingClaimablePanel]: Failed to estimate gas limit'));
      return;
    }

    if (needsL1SecurityFeeChains.includes(claimable.chainId)) {
      const l1SecurityFee = await ethereumUtils.calculateL1FeeOptimism(
        // @ts-expect-error - type mismatch, but this tx request structure is the same as in SendSheet.js
        {
          to: updatedTxPayload.to ?? null,
          from: updatedTxPayload.from ?? null,
          value: updatedTxPayload.value,
          data: updatedTxPayload.data as string,
        },
        provider
      );

      if (!l1SecurityFee) {
        updateTxFee(null, null);
        logger.error(new RainbowError('[ClaimingClaimablePanel]: Failed to calculate L1 security fee'));
        return;
      }

      updateTxFee(gasLimit, null, l1SecurityFee);
    } else {
      updateTxFee(gasLimit, null);
    }

    setTxPayload({ ...updatedTxPayload, gasLimit });
  }, [txPayload, claimable.chainId, selectedGasFee, updateTxFee]);

  useEffect(() => {
    if (txPayload) {
      estimateGas();
    }
  }, [estimateGas, selectedGasFee, txPayload]);

  const isTransactionReady = isGasReady && isSufficientGas && isValidGas && txPayload?.gasLimit;

  const nativeCurrencyGasFee = useMemo(
    () => convertAmountToNativeDisplay(selectedGasFee?.gasFee?.estimatedFee?.native?.value?.amount, nativeCurrency),
    [nativeCurrency, selectedGasFee?.gasFee?.estimatedFee?.native?.value?.amount]
  );

  // const { mutate: claimRewards } = useMutation<{
  //   nonce: number | null;
  // }>({
  //   mutationFn: async () => {
  //     // Fetch the native asset from the origin chain
  //     const opEth_ = await ethereumUtils.getNativeAssetForNetwork({ chainId: ChainId.optimism });
  //     const opEth = {
  //       ...opEth_,
  //       chainName: chainNameFromChainId(ChainId.optimism),
  //     };

  //     // Fetch the native asset from the destination chain
  //     let destinationEth_;
  //     if (chainId === ChainId.base) {
  //       destinationEth_ = await ethereumUtils.getNativeAssetForNetwork({ chainId: ChainId.base });
  //     } else if (chainId === ChainId.zora) {
  //       destinationEth_ = await ethereumUtils.getNativeAssetForNetwork({ chainId: ChainId.zora });
  //     } else {
  //       destinationEth_ = opEth;
  //     }

  //     // Add missing properties to match types
  //     const destinationEth = {
  //       ...destinationEth_,
  //       chainName: chainNameFromChainId(chainId as ChainId),
  //     };

  //     const selectedGas = {
  //       maxBaseFee: meteorologyData?.fast.maxBaseFee,
  //       maxPriorityFee: meteorologyData?.fast.maxPriorityFee,
  //     };

  //     let gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts = {} as
  //       | TransactionGasParamAmounts
  //       | LegacyTransactionGasParamAmounts;

  //     gasParams = {
  //       maxFeePerGas: selectedGas?.maxBaseFee as string,
  //       maxPriorityFeePerGas: selectedGas?.maxPriorityFee as string,
  //     };
  //     const gasFeeParamsBySpeed = getGasSettings(GasSpeed.FAST, claimable.chainId);

  //     const actionParams = {
  //       address: accountAddress,
  //       toChainId: claimable.chainId,
  //       sellAmount: claimable as string,
  //       chainId: ChainId.optimism,
  //       assetToSell: opEth as ParsedAsset,
  //       assetToBuy: destinationEth as ParsedAsset,
  //       quote: undefined,
  //       // @ts-expect-error - collision between old gas types and new
  //       gasFeeParamsBySpeed,
  //       gasParams,
  //     } satisfies RapSwapActionParameters<'claimRewardsBridge'>;

  //    const tx = {
  //       to: claimable.action.to,
  //       from: accountAddress,

  //       data: claimable.action.data,
  //       chainId: claimable.chainId,

  //       gasLimit?: BigNumberish,
  //       gasPrice?: BigNumberish,

  //       maxPriorityFeePerGas?: BigNumberish;
  //       maxFeePerGas?: BigNumberish;
  //   }

  //     const provider = getProvider({ chainId: ChainId.optimism });
  //     const wallet = await loadWallet({
  //       address,
  //       showErrorIfNotLoaded: false,
  //       provider,
  //     });
  //     if (!wallet) {
  //       // Biometrics auth failure (retry possible)
  //       setClaimStatus('error');
  //       return { nonce: null };
  //     }

  //     try {
  //       const { errorMessage, nonce: bridgeNonce } = await walletExecuteRap(
  //         wallet,
  //         'claimRewardsBridge',
  //         // @ts-expect-error - collision between old gas types and new
  //         actionParams
  //       );

  //       if (errorMessage) {
  //         if (errorMessage.includes('[CLAIM-REWARDS]')) {
  //           // Claim error (retry possible)
  //           setClaimStatus('error');
  //         } else {
  //           // Bridge error (retry not possible)
  //           setClaimStatus('bridge-error');
  //         }

  //         logger.error(new RainbowError('[ClaimRewardsPanel]: Failed to claim ETH rewards'), { message: errorMessage });

  //         return { nonce: null };
  //       }

  //       if (typeof bridgeNonce === 'number') {
  //         // Clear and refresh claim data so available claim UI disappears
  //         invalidatePointsQuery(address);
  //         refetch();
  //         return { nonce: bridgeNonce };
  //       } else {
  //         setClaimStatus('error');
  //         return { nonce: null };
  //       }
  //     } catch (e) {
  //       setClaimStatus('error');
  //       return { nonce: null };
  //     }
  //   },
  //   onError: error => {
  //     const errorCode =
  //       error && typeof error === 'object' && 'code' in error && isClaimError(error.code as PointsErrorType)
  //         ? (error.code as PointsErrorType)
  //         : 'error';
  //     setClaimStatus(errorCode);
  //   },
  //   onSuccess: async ({ nonce }: { nonce: number | null }) => {
  //     if (typeof nonce === 'number') {
  //       setClaimStatus('success');
  //     }
  //   },
  // });

  return (
    <Box gap={20} alignItems="center" width="full">
      <ButtonPressAnimation disabled={!isTransactionReady} style={{ width: '100%', paddingHorizontal: 18 }} scaleTo={0.96}>
        <AccentColorProvider color={`rgba(41, 90, 247, ${isTransactionReady ? 1 : 0.2})`}>
          <Box
            background="accent"
            shadow="30px accent"
            borderRadius={43}
            height={{ custom: 48 }}
            width="full"
            alignItems="center"
            justifyContent="center"
          >
            {isSufficientGas ? (
              <Inline alignVertical="center" space="6px">
                <TextShadow shadowOpacity={0.3}>
                  <Text align="center" color="label" size="icon 20px" weight="heavy">
                    􀎽
                  </Text>
                </TextShadow>
                <TextShadow shadowOpacity={0.3}>
                  <Text align="center" color="label" size="20pt" weight="heavy">
                    {`Claim ${claimable.value.claimAsset.display}`}
                  </Text>
                </TextShadow>
              </Inline>
            ) : (
              <TextShadow shadowOpacity={0.3}>
                <Text align="center" color="label" size="icon 20px" weight="heavy">
                  Insufficient Funds
                </Text>
              </TextShadow>
            )}
          </Box>
        </AccentColorProvider>
      </ButtonPressAnimation>
      {txPayload?.gasLimit ? (
        <Inline alignVertical="center" space="2px">
          <Text align="center" color="labelQuaternary" size="icon 10px" weight="heavy">
            􀵟
          </Text>
          <Text color="labelQuaternary" size="13pt" weight="bold">
            {`${nativeCurrencyGasFee} to claim on ${chainsLabel[claimable.chainId]}`}
          </Text>
        </Inline>
      ) : (
        <Text color="labelQuaternary" size="13pt" weight="bold">
          Calculating gas fee...
        </Text>
      )}
    </Box>
  );
};
