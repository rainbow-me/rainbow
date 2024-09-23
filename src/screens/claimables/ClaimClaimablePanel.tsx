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
import { Claimable, SponsoredClaimable, TransactionClaimable } from '@/resources/addys/claimables/types';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useTheme } from '@/theme';
import { FasterImageView } from '@candlefinance/faster-image';
import { claimablesQueryKey, useClaimables } from '@/resources/addys/claimables/query';
import { useMutation } from '@tanstack/react-query';
import { loadWallet } from '@/model/wallet';
import { estimateGasWithPadding, getProvider } from '@/handlers/web3';
import { parseGasParamsForTransaction } from '@/parsers';
import { getNextNonce } from '@/state/nonces';
import { chainsLabel, needsL1SecurityFeeChains } from '@/chains';
import { logger, RainbowError } from '@/logger';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { walletExecuteRapV2 } from '@/raps/execute';
import { queryClient } from '@/react-query';
import { useNavigation } from '@/navigation';
import { TextColor } from '@/design-system/color/palettes';
import { TransactionClaimableTxPayload } from '@/raps/references';

type RouteParams = {
  ClaimClaimablePanelParams: { claimable: Claimable };
};

type ClaimStatus = 'idle' | 'claiming' | 'success' | 'error';

export const ClaimClaimablePanel = () => {
  const {
    params: { claimable },
  } = useRoute<RouteProp<RouteParams, 'ClaimClaimablePanelParams'>>();

  return claimable.type === 'transaction' ? (
    <ClaimingTransactionClaimable claimable={claimable} />
  ) : (
    <ClaimingSponsoredClaimable claimable={claimable} />
  );
};

const ClaimingSponsoredClaimable = ({ claimable }: { claimable: SponsoredClaimable }) => {
  const { accountAddress, nativeCurrency } = useAccountSettings();

  const { refetch } = useClaimables({ address: accountAddress, currency: nativeCurrency });

  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('idle');

  const { mutate: claimClaimable } = useMutation({
    mutationFn: async () => {
      const provider = getProvider({ chainId: claimable.chainId });
      const wallet = await loadWallet({
        address: accountAddress,
        showErrorIfNotLoaded: true,
        provider,
      });

      if (!wallet) {
        // Biometrics auth failure (retry possible)
        setClaimStatus('error');
        return;
      }

      try {
        const { errorMessage } = await walletExecuteRapV2(wallet, {
          type: 'claimSponsoredClaimableRap',
          claimSponsoredClaimableActionParameters: { url: claimable.action.url, method: claimable.action.method as 'POST' | 'GET' },
        });

        if (errorMessage) {
          setClaimStatus('error');
          logger.error(new RainbowError('[ClaimingSponsoredClaimable]: Failed to claim claimable due to rap error'), {
            message: errorMessage,
          });
        } else {
          setClaimStatus('success');
          // Clear and refresh claimables data
          queryClient.invalidateQueries(claimablesQueryKey({ address: accountAddress, currency: nativeCurrency }));
          refetch();
        }
      } catch (e) {
        logger.error(new RainbowError('[ClaimingSponsoredClaimable]: Failed to claim claimable due to unknown error'), {
          message: (e as Error)?.message,
        });
      }
    },
    onError: e => {
      setClaimStatus('error');
      logger.error(new RainbowError('[ClaimingSponsoredClaimable]: Failed to claim claimable due to unhandled error'), {
        message: (e as Error)?.message,
      });
    },
  });

  return <ClaimingClaimableUI claim={claimClaimable} claimable={claimable} claimStatus={claimStatus} setClaimStatus={setClaimStatus} />;
};

const ClaimingTransactionClaimable = ({ claimable }: { claimable: TransactionClaimable }) => {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { isGasReady, isSufficientGas, isValidGas, selectedGasFee, startPollingGasFees, stopPollingGasFees, updateTxFee } = useGas();

  const [baseTxPayload, setBaseTxPayload] = useState<
    Omit<TransactionClaimableTxPayload, 'gasLimit' | 'maxPriorityFeePerGas' | 'maxFeePerGas'> | undefined
  >();
  const [txPayload, setTxPayload] = useState<TransactionClaimableTxPayload | undefined>();
  const [claimStatus, setClaimStatus] = useState<ClaimStatus>('idle');

  const { refetch } = useClaimables({ address: accountAddress, currency: nativeCurrency });

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
    startPollingGasFees();
    return () => {
      stopPollingGasFees();
    };
  }, [startPollingGasFees, stopPollingGasFees]);

  const estimateGas = useCallback(async () => {
    if (!baseTxPayload) {
      logger.error(new RainbowError('[ClaimingTransactionClaimable]: attempted to estimate gas without a tx payload'));
      return;
    }

    const gasParams = parseGasParamsForTransaction(selectedGasFee);
    const updatedTxPayload = { ...baseTxPayload, ...gasParams };

    const gasLimit = await estimateGasWithPadding(updatedTxPayload, null, null, provider);

    if (!gasLimit) {
      updateTxFee(null, null);
      logger.error(new RainbowError('[ClaimingTransactionClaimable]: Failed to estimate gas limit'));
      return;
    }

    if (needsL1SecurityFeeChains.includes(claimable.chainId)) {
      const l1SecurityFee = await ethereumUtils.calculateL1FeeOptimism(
        // @ts-expect-error - type mismatch, but this tx request structure is the same as in SendSheet.js
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
  }, [baseTxPayload, selectedGasFee, provider, claimable.chainId, claimable.action.to, claimable.action.data, updateTxFee, accountAddress]);

  useEffect(() => {
    if (baseTxPayload) {
      estimateGas();
    }
  }, [baseTxPayload, estimateGas, selectedGasFee]);

  const isTransactionReady = !!(isGasReady && isSufficientGas && isValidGas && txPayload);

  const nativeCurrencyGasFeeDisplay = useMemo(
    () => convertAmountToNativeDisplay(selectedGasFee?.gasFee?.estimatedFee?.native?.value?.amount, nativeCurrency),
    [nativeCurrency, selectedGasFee?.gasFee?.estimatedFee?.native?.value?.amount]
  );

  const { mutate: claimClaimable } = useMutation({
    mutationFn: async () => {
      if (!txPayload) {
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
        setClaimStatus('error');
        return;
      }

      try {
        const { errorMessage } = await walletExecuteRapV2(wallet, {
          type: 'claimTransactionClaimableRap',
          claimTransactionClaimableActionParameters: { claimTx: txPayload },
        });

        if (errorMessage) {
          setClaimStatus('error');
          logger.error(new RainbowError('[ClaimingTransactionClaimable]: Failed to claim claimable due to rap error'), {
            message: errorMessage,
          });
        } else {
          setClaimStatus('success');
          // Clear and refresh claimables data
          queryClient.invalidateQueries(claimablesQueryKey({ address: accountAddress, currency: nativeCurrency }));
          refetch();
        }
      } catch (e) {
        setClaimStatus('error');
        logger.error(new RainbowError('[ClaimingTransactionClaimable]: Failed to claim claimable due to unknown error'), {
          message: (e as Error)?.message,
        });
      }
    },
    onError: e => {
      setClaimStatus('error');
      logger.error(new RainbowError('[ClaimingTransactionClaimable]: Failed to claim claimable due to unhandled error'), {
        message: (e as Error)?.message,
      });
    },
  });

  return (
    <ClaimingClaimableUI
      claim={claimClaimable}
      claimable={claimable}
      claimStatus={claimStatus}
      hasSufficientFunds={isSufficientGas}
      isGasReady={!!txPayload?.gasLimit}
      isTransactionReady={isTransactionReady}
      nativeCurrencyGasFeeDisplay={nativeCurrencyGasFeeDisplay}
      setClaimStatus={setClaimStatus}
    />
  );
};

const ClaimingClaimableUI = ({
  claim,
  claimable,
  claimStatus,
  hasSufficientFunds,
  isGasReady,
  isTransactionReady,
  nativeCurrencyGasFeeDisplay,
  setClaimStatus,
}:
  | {
      claim: () => void;
      claimable: TransactionClaimable;
      claimStatus: ClaimStatus;
      hasSufficientFunds: boolean;
      isGasReady: boolean;
      isTransactionReady: boolean;
      nativeCurrencyGasFeeDisplay: string;
      setClaimStatus: React.Dispatch<React.SetStateAction<ClaimStatus>>;
    }
  | {
      claim: () => void;
      claimable: SponsoredClaimable;
      claimStatus: ClaimStatus;
      hasSufficientFunds?: never;
      isGasReady?: never;
      isTransactionReady?: never;
      nativeCurrencyGasFeeDisplay?: never;
      setClaimStatus: React.Dispatch<React.SetStateAction<ClaimStatus>>;
    }) => {
  const { isDarkMode } = useColorMode();
  const theme = useTheme();
  const { goBack } = useNavigation();

  const isButtonDisabled =
    claimStatus === 'claiming' || (claimStatus !== 'success' && claimable.type === 'transaction' && !isTransactionReady);
  const shouldShowClaimText =
    (claimStatus === 'idle' || claimStatus === 'claiming') && (claimable.type !== 'transaction' || hasSufficientFunds);

  const buttonLabel = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
        if (shouldShowClaimText) {
          return `Claim ${claimable.value.claimAsset.display}`;
        } else {
          return 'Insufficient Funds';
        }
      case 'claiming':
        return `Claim ${claimable.value.claimAsset.display}`;
      case 'success':
        return i18n.t(i18n.l.button.done);
      case 'error':
      default:
        return i18n.t(i18n.l.points.points.try_again);
    }
  }, [claimStatus, claimable.value.claimAsset.display, shouldShowClaimText]);

  const panelTitle = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
        return 'Claim';
      case 'claiming':
        return 'Claiming...';
      case 'success':
        return 'Claimed!';
      case 'error':
      default:
        return i18n.t(i18n.l.points.points.error_claiming);
    }
  }, [claimStatus]);

  const panelTitleColor: TextColor = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
      case 'claiming':
        return 'label';
      case 'success':
        return 'green';
      case 'error':
      default:
        return 'red';
    }
  }, [claimStatus]);

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
                  <Text align="center" color={panelTitleColor} size="20pt" weight="heavy">
                    {panelTitle}
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
            <Box gap={20} alignItems="center" width="full">
              {/* TODO: needs shimmer when claimStatus === 'claiming' */}
              <ButtonPressAnimation
                disabled={isButtonDisabled}
                style={{ width: '100%', paddingHorizontal: 18 }}
                scaleTo={0.96}
                onPress={() => {
                  if (claimStatus === 'idle' || claimStatus === 'error') {
                    setClaimStatus('claiming');
                    claim();
                  } else if (claimStatus === 'success') {
                    goBack();
                  }
                }}
              >
                <AccentColorProvider color={`rgba(41, 90, 247, ${claimable.type !== 'transaction' || isTransactionReady ? 1 : 0.2})`}>
                  <Box
                    background="accent"
                    shadow="30px accent"
                    borderRadius={43}
                    height={{ custom: 48 }}
                    width="full"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Inline alignVertical="center" space="6px">
                      {shouldShowClaimText && (
                        <TextShadow shadowOpacity={0.3}>
                          <Text align="center" color="label" size="icon 20px" weight="heavy">
                            􀎽
                          </Text>
                        </TextShadow>
                      )}
                      <TextShadow shadowOpacity={0.3}>
                        <Text align="center" color="label" size="20pt" weight="heavy">
                          {buttonLabel}
                        </Text>
                      </TextShadow>
                    </Inline>
                  </Box>
                </AccentColorProvider>
              </ButtonPressAnimation>
              {claimable.type === 'transaction' &&
                (isGasReady ? (
                  <Inline alignVertical="center" space="2px">
                    <Text align="center" color="labelQuaternary" size="icon 10px" weight="heavy">
                      􀵟
                    </Text>
                    <Text color="labelQuaternary" size="13pt" weight="bold">
                      {`${nativeCurrencyGasFeeDisplay} to claim on ${chainsLabel[claimable.chainId]}`}
                    </Text>
                  </Inline>
                ) : (
                  <Text color="labelQuaternary" size="13pt" weight="bold">
                    Calculating gas fee...
                  </Text>
                ))}
            </Box>
          </Box>
        </Panel>
      </Box>
      <TapToDismiss />
    </>
  );
};
