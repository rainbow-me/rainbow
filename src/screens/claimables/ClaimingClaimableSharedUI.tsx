import React, { useEffect, useMemo } from 'react';
import { AccentColorProvider, Bleed, Box, Inline, Text, TextShadow, globalColors, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { ListHeader, Panel, TapToDismiss, controlPanelStyles } from '@/components/SmoothPager/ListPanel';
import { safeAreaInsetValues } from '@/utils';
import { View } from 'react-native';
import { IS_IOS } from '@/env';
import { ButtonPressAnimation } from '@/components/animations';
import { SponsoredClaimable, TransactionClaimable } from '@/resources/addys/claimables/types';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { useTheme } from '@/theme';
import { FasterImageView } from '@candlefinance/faster-image';
import { chainsLabel } from '@/chains';
import { useNavigation } from '@/navigation';
import { TextColor } from '@/design-system/color/palettes';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export type ClaimStatus =
  | 'idle' // initial state
  | 'claiming' // user has pressed the claim button
  | 'pending' // claim has been submitted but we don't have a tx hash
  | 'success' // claim has been submitted and we have a tx hash
  | 'error'; // claim has failed

export const ClaimingClaimableSharedUI = ({
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
    claimStatus === 'claiming' ||
    (claimStatus !== 'success' && claimStatus !== 'pending' && claimable.type === 'transaction' && !isTransactionReady);

  const shouldShowClaimText =
    (claimStatus === 'idle' || claimStatus === 'claiming') && (claimable.type !== 'transaction' || hasSufficientFunds);

  const buttonLabel = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
        if (shouldShowClaimText) {
          return i18n.t(i18n.l.claimables.panel.claim_amount, { amount: claimable.value.claimAsset.display });
        } else {
          return i18n.t(i18n.l.claimables.panel.insufficient_funds);
        }
      case 'claiming':
        return i18n.t(i18n.l.claimables.panel.claim_amount, { amount: claimable.value.claimAsset.display });
      case 'pending':
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
        return i18n.t(i18n.l.claimables.panel.claim);
      case 'claiming':
        return i18n.t(i18n.l.claimables.panel.claiming);
      case 'pending':
        return i18n.t(i18n.l.claimables.panel.tokens_on_the_way);
      case 'success':
        return i18n.t(i18n.l.claimables.panel.claimed);
      case 'error':
      default:
        return i18n.t(i18n.l.claimables.panel.claiming_failed);
    }
  }, [claimStatus]);

  const panelTitleColor: TextColor = useMemo(() => {
    switch (claimStatus) {
      case 'idle':
      case 'claiming':
        return 'label';
      case 'pending':
      case 'success':
        return 'green';
      case 'error':
      default:
        return 'red';
    }
  }, [claimStatus]);

  const animationProgress = useSharedValue(0);

  useEffect(() => {
    switch (claimStatus) {
      case 'idle':
      case 'error':
        animationProgress.value = withTiming(0, { duration: 300 });
        break;
      case 'claiming':
      case 'pending':
      case 'success':
      default:
        animationProgress.value = withTiming(1, { duration: 300 });
        break;
    }
  }, [claimStatus, animationProgress]);

  const gasAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: (1 - animationProgress.value) * 30,
      opacity: 1 - animationProgress.value,
    };
  });

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
            <Box alignItems="center" width="full">
              <ButtonPressAnimation
                disabled={isButtonDisabled}
                style={{ width: '100%', paddingHorizontal: 18 }}
                scaleTo={0.96}
                onLongPress={() => {
                  if (claimStatus === 'idle' || claimStatus === 'error') {
                    setClaimStatus('claiming');
                    claim();
                  } else if (claimStatus === 'success' || claimStatus === 'pending') {
                    goBack();
                  }
                }}
              >
                <AccentColorProvider
                  color={`rgba(41, 90, 247, ${(claimable.type === 'transaction' && !isTransactionReady) || claimStatus === 'claiming' ? 0.2 : 1})`}
                >
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
              {claimable.type === 'transaction' && (
                <Animated.View style={gasAnimatedStyle}>
                  <Box paddingTop="20px">
                    {isGasReady ? (
                      <Inline alignVertical="center" space="2px">
                        <Text align="center" color="labelQuaternary" size="icon 10px" weight="heavy">
                          􀵟
                        </Text>
                        <Text color="labelQuaternary" size="13pt" weight="bold">
                          {i18n.t(i18n.l.claimables.panel.amount_to_claim_on_network, {
                            amount: nativeCurrencyGasFeeDisplay,
                            network: chainsLabel[claimable.chainId],
                          })}
                        </Text>
                      </Inline>
                    ) : (
                      <Text color="labelQuaternary" size="13pt" weight="bold">
                        {i18n.t(i18n.l.claimables.panel.calculating_gas_fee)}
                      </Text>
                    )}
                  </Box>
                </Animated.View>
              )}
            </Box>
          </Box>
        </Panel>
      </Box>
      <TapToDismiss />
    </>
  );
};
