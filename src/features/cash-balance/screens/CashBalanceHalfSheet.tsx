import React, { memo, useCallback, useState } from 'react';
import { Platform, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { type ParsedSearchAsset } from '@/__swaps__/types/assets';
import { AbsolutePortal, AbsolutePortalRoot } from '@/components/AbsolutePortal';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Column, Columns, Inline, Stack, Text, useForegroundColor } from '@/design-system';
import type { ParsedAddressAsset } from '@/entities/tokens';
import { CashBalanceIcon } from '@/features/cash-balance/components/CashBalanceIcon';
import { CASH_BALANCE_COLORS } from '@/features/cash-balance/constants';
import { useCashBalance } from '@/features/cash-balance/hooks/useCashBalance';
import { useCashBalanceAddPress } from '@/features/cash-balance/hooks/useCashBalanceAddPress';
import { ChainId } from '@/features/network/types/backendNetworks';
import useNavigationForNonReadOnlyWallets from '@/hooks/useNavigationForNonReadOnlyWallets';
import * as i18n from '@/languages';
import Routes from '@/navigation/routesNames';
import { USDC_ADDRESS } from '@/references/constants';
import getUrlForTrustIconFallback from '@/utils/getUrlForTrustIconFallback';

// Matches the arrow used by the send button elsewhere (wallet screen / expanded asset sheet)
const SEND_ICON = '􀈟';
const BUTTON_HEIGHT = 48;
// Shown when there's no held Base USDC asset to source an icon from — same fallback pattern
// used by the perps and Add Cash USDC icons.
const USDC_ICON_URL = getUrlForTrustIconFallback(USDC_ADDRESS, ChainId.mainnet) ?? undefined;

function CashBalanceHalfSheetHeader() {
  return (
    <Inline alignVertical="center" horizontalSpace="12px" wrap={false}>
      <CashBalanceIcon />
      <Text color="label" size="22pt" weight="heavy">
        {i18n.t(i18n.l.cash_balance.half_sheet.title)}
      </Text>
    </Inline>
  );
}

function CashBalanceSubLabelIcon({ asset, size }: { asset: ParsedSearchAsset | undefined; size: number }) {
  return (
    <RainbowCoinIcon
      chainId={ChainId.base}
      color={asset?.colors?.primary}
      icon={asset?.icon_url ?? USDC_ICON_URL}
      showBadge={false}
      size={size}
      symbol={asset?.symbol ?? 'USDC'}
    />
  );
}

// Shown once there's a Base USDC balance to describe: a floating pill, matching the Figma
// "has balance" half sheet.
function CashBalanceBadge({ asset }: { asset: ParsedSearchAsset | undefined }) {
  return (
    <Box
      alignItems="center"
      background="surfaceSecondaryElevated"
      borderRadius={20}
      flexDirection="row"
      gap={6}
      height={{ custom: 40 }}
      paddingLeft="10px"
      paddingRight="12px"
      shadow="12px"
    >
      <CashBalanceSubLabelIcon asset={asset} size={20} />
      <Text color="labelTertiary" size="15pt" weight="bold">
        {i18n.t(i18n.l.cash_balance.half_sheet.subtitle)}
      </Text>
    </Box>
  );
}

// Shown before there's any Base USDC balance, matching the Figma "Add only" half sheet: a plain
// caption under a hairline divider instead of the floating pill.
function CashBalanceSubLabel({ asset }: { asset: ParsedSearchAsset | undefined }) {
  const separatorColor = useForegroundColor('separatorSecondary');

  return (
    <Stack alignHorizontal="center" space="16px">
      <Box backgroundColor={separatorColor} height={{ custom: 1 }} width="full" />
      <Inline alignVertical="center" horizontalSpace="6px" wrap={false}>
        <CashBalanceSubLabelIcon asset={asset} size={16} />
        <Text color="labelQuaternary" size="15pt" weight="semibold">
          {i18n.t(i18n.l.cash_balance.half_sheet.subtitle)}
        </Text>
      </Inline>
    </Stack>
  );
}

function CashBalanceActionButton({
  children,
  circular,
  onPress,
  testID,
}: {
  children: React.ReactNode;
  circular?: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.94} testID={testID}>
      <Box
        as={LinearGradient}
        alignItems="center"
        background="green"
        borderRadius={BUTTON_HEIGHT / 2}
        colors={CASH_BALANCE_COLORS.addButtonGradient}
        end={{ x: 0.75, y: 1 }}
        height={{ custom: BUTTON_HEIGHT }}
        justifyContent="center"
        shadow="12px green"
        start={{ x: 0, y: 0 }}
        width={circular ? { custom: BUTTON_HEIGHT } : 'full'}
      >
        {children}
      </Box>
    </ButtonPressAnimation>
  );
}

// Popped up over the half sheet when Withdraw is pressed, matching the Figma mini sheet — no
// action button, dismissed by tapping anywhere on it.
const WITHDRAW_SHEET_ENTERING_ANIMATION = SlideInDown.springify().damping(70).mass(0.8).stiffness(500);
const WITHDRAW_SHEET_EXITING_ANIMATION = SlideOutDown.springify().damping(70).mass(0.8).stiffness(500);

// Memoized so the live-ticking balance re-rendering CashBalanceHalfSheet doesn't recreate this
// element on every tick — AbsolutePortal re-adds its children whenever that reference changes,
// which otherwise thrashes the portaled node before it ever gets a chance to paint.
const CashBalanceWithdrawComingSoonSheet = memo(function CashBalanceWithdrawComingSoonSheet({ onDismiss }: { onDismiss: () => void }) {
  return (
    <AbsolutePortal>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View accessibilityViewIsModal style={styles.overlay} testID="cash-balance-withdraw-coming-soon-overlay">
          <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.backdrop} />
          <Animated.View entering={WITHDRAW_SHEET_ENTERING_ANIMATION} exiting={WITHDRAW_SHEET_EXITING_ANIMATION} style={styles.panelHost}>
            <PanelSheet showTapToDismiss={false}>
              <Box paddingBottom="32px" paddingHorizontal="32px" paddingTop="52px">
                <CashBalanceIcon size={52} />
                <Box paddingTop="16px">
                  <Text color="label" size="26pt" weight="heavy">
                    {i18n.t(i18n.l.cash_balance.half_sheet.withdraw_coming_soon)}
                  </Text>
                </Box>
              </Box>
            </PanelSheet>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </AbsolutePortal>
  );
});

export const CashBalanceHalfSheet = memo(function CashBalanceHalfSheet() {
  const { asset, balanceDisplay, hasBalance } = useCashBalance();
  const navigate = useNavigationForNonReadOnlyWallets();
  const handleAddPress = useCashBalanceAddPress('cash balance half sheet');
  const [showWithdrawComingSoon, setShowWithdrawComingSoon] = useState(false);

  const handleWithdrawPress = useCallback(() => {
    setShowWithdrawComingSoon(true);
  }, []);

  const handleDismissWithdrawComingSoon = useCallback(() => {
    setShowWithdrawComingSoon(false);
  }, []);

  const handleSendPress = useCallback(() => {
    if (!asset) return;
    const sendAsset = asset as unknown as ParsedAddressAsset;
    if (Platform.OS === 'ios') {
      navigate(Routes.SEND_FLOW, { screen: Routes.SEND_SHEET, params: { asset: sendAsset } });
    } else {
      navigate(Routes.SEND_FLOW, { asset: sendAsset });
    }
  }, [asset, navigate]);

  return (
    <PanelSheet>
      <Box paddingBottom="20px" paddingHorizontal="20px" paddingTop="20px">
        <CashBalanceHalfSheetHeader />

        <Box paddingTop={{ custom: 64 }}>
          <Text align="center" color="label" size="44pt" weight="heavy">
            {balanceDisplay}
          </Text>
        </Box>

        <Box alignItems={hasBalance ? 'center' : undefined} paddingTop={{ custom: hasBalance ? 52 : 64 }}>
          {hasBalance ? <CashBalanceBadge asset={asset} /> : <CashBalanceSubLabel asset={asset} />}
        </Box>

        <Box paddingTop={{ custom: hasBalance ? 20 : 16 }}>
          <Columns space="8px">
            <CashBalanceActionButton onPress={handleAddPress} testID="cash-balance-half-sheet-add-button">
              <Text color="white" size="20pt" weight="heavy">
                {i18n.t(i18n.l.button.add)}
              </Text>
            </CashBalanceActionButton>
            {hasBalance && (
              <CashBalanceActionButton onPress={handleWithdrawPress} testID="cash-balance-half-sheet-withdraw-button">
                <Text color="white" size="20pt" weight="heavy">
                  {i18n.t(i18n.l.button.withdraw)}
                </Text>
              </CashBalanceActionButton>
            )}
            {hasBalance && asset && (
              <Column width="content">
                <CashBalanceActionButton circular onPress={handleSendPress} testID="cash-balance-half-sheet-send-button">
                  <Text color="white" size="icon 20px" weight="heavy">
                    {SEND_ICON}
                  </Text>
                </CashBalanceActionButton>
              </Column>
            )}
          </Columns>
        </Box>
      </Box>

      {showWithdrawComingSoon && <CashBalanceWithdrawComingSoonSheet onDismiss={handleDismissWithdrawComingSoon} />}

      {/* This screen is presented as its own native modal layer, so the app-level
          AbsolutePortalRoot (rendered underneath it) can't paint the sheet above — mount a
          scoped one here too, matching PaymentMethodsSheet/CashDepositSetupScreen/Swap. */}
      <AbsolutePortalRoot style={styles.portal} />
    </PanelSheet>
  );
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.44)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  panelHost: {
    ...StyleSheet.absoluteFillObject,
  },
  portal: {
    zIndex: 30001,
  },
});
