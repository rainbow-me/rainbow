import React, { memo, useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { analytics } from '@/analytics';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import ContactAvatar from '@/components/contacts/ContactAvatar';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { NumberPad } from '@/components/number-pad/NumberPad';
import { DEFAULT_HANDLE_COLOR_DARK, DEFAULT_HANDLE_COLOR_LIGHT, PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Inline, Text, useColorMode, useForegroundColor } from '@/design-system';
import { ChainId } from '@/features/network/types/backendNetworks';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import { USDC_ADDRESS } from '@/references/constants';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import getUrlForTrustIconFallback from '@/utils/getUrlForTrustIconFallback';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';
import { sanitizeAmount } from '@/worklets/strings';

import { AddFromRow } from './AddFromRow';
import { AmountDisplay } from './AmountDisplay';
import { useAddCashAmount } from './useAddCashAmount';

type AddCashMode = 'presets' | 'keypad';
type AmountPreset = { amount: number; label: string };
type AddCashAmount = ReturnType<typeof useAddCashAmount>;

const AMOUNT_PRESETS: AmountPreset[] = [
  { amount: 10, label: '$10' },
  { amount: 25, label: '$25' },
  { amount: 50, label: '$50' },
  { amount: 100, label: '$100' },
  { amount: 1000, label: '$1k' },
];
const DEFAULT_SELECTED_AMOUNT = 50;

const KEYPAD_PANEL_HEIGHT = DEVICE_HEIGHT;
const USDC_ICON_URL = getUrlForTrustIconFallback(USDC_ADDRESS, ChainId.mainnet) ?? undefined;

const PANEL_LAYOUT = LinearTransition.springify()
  .mass(SPRING_CONFIGS.snappierSpringConfig.mass)
  .damping(SPRING_CONFIGS.snappierSpringConfig.damping)
  .stiffness(SPRING_CONFIGS.snappierSpringConfig.stiffness);

function AccountAvatar() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();

  return accountImage ? (
    <ImageAvatar image={accountImage} size="header" />
  ) : (
    <ContactAvatar color={accountColor} size="small" value={accountSymbol} />
  );
}

function AddCashHeader({ onSettings, topPadding }: { onSettings: () => void; topPadding: '8px' | '28px' }) {
  return (
    <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingHorizontal="24px" paddingTop={topPadding}>
      <AccountAvatar />
      <Text align="center" color="label" size="22pt" weight="heavy">
        {i18n.t(i18n.l.cash.add_cash)}
      </Text>
      <ButtonPressAnimation onPress={onSettings} scaleTo={0.8} testID="cash-deposit-add-cash-settings">
        <Box alignItems="center" height={{ custom: 36 }} justifyContent="center" width={{ custom: 36 }}>
          <Text align="center" color="accent" size="20pt" weight="heavy">
            {'􀣋'}
          </Text>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}

function AmountChip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID: string }) {
  const shadowFar = useForegroundColor('shadowFar');
  const accent = useForegroundColor('accent');
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.94} style={styles.chip} testID={testID} wrapperStyle={styles.chip}>
      <Box
        alignItems="center"
        background="surfaceSecondaryElevated"
        justifyContent="center"
        style={[styles.chipInner, { borderColor: selected ? accent : 'transparent', shadowColor: shadowFar }]}
      >
        <Text align="center" color="label" size="22pt" weight="heavy">
          {label}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}

function AmountPresetGrid({
  onMore,
  onSelectPreset,
  selectedAmount,
}: {
  onMore: () => void;
  onSelectPreset: (amount: number) => void;
  selectedAmount: number;
}) {
  return (
    <Box
      as={Animated.View}
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(160)}
      flexDirection="row"
      flexWrap="wrap"
      paddingHorizontal="28px"
      paddingTop="32px"
      style={styles.presetGrid}
    >
      {AMOUNT_PRESETS.map(preset => (
        <AmountChip
          key={preset.amount}
          label={preset.label}
          onPress={() => onSelectPreset(preset.amount)}
          selected={selectedAmount === preset.amount}
          testID={`cash-deposit-add-cash-amount-${preset.amount}`}
        />
      ))}
      <ButtonPressAnimation
        onPress={onMore}
        scaleTo={0.94}
        style={styles.chip}
        testID="cash-deposit-add-cash-amount-more"
        wrapperStyle={styles.chip}
      >
        <Box
          alignItems="center"
          background="surfaceSecondaryElevated"
          justifyContent="center"
          style={[styles.chipInner, styles.chipUnselected]}
        >
          <Text align="center" color="label" size="22pt" weight="heavy">
            {'􀍠'}
          </Text>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}

function KeypadHandle() {
  const { isDarkMode } = useColorMode();
  const handleColor = isDarkMode ? DEFAULT_HANDLE_COLOR_DARK : DEFAULT_HANDLE_COLOR_LIGHT;

  return (
    <Box alignItems="center" paddingBottom="8px" style={{ paddingTop: safeAreaInsetValues.top + 8 }}>
      <Box style={[styles.handle, { backgroundColor: handleColor }]} />
    </Box>
  );
}

function KeypadFundingCaption() {
  return (
    <Box alignItems="center" as={Animated.View} entering={FadeIn.duration(160)}>
      <Inline alignVertical="center" space="6px">
        <Text align="center" color="labelTertiary" size="15pt" weight="semibold">
          {i18n.t(i18n.l.cash.add_cash_screen.money_is_added_in)}
        </Text>
        <Inline alignVertical="center" space="3px">
          <RainbowCoinIcon chainId={ChainId.mainnet} icon={USDC_ICON_URL} showBadge={false} size={16} symbol="USDC" />
          <Text align="center" color="labelSecondary" size="15pt" weight="bold">
            {i18n.t(i18n.l.cash.add_cash_screen.usdc)}
          </Text>
        </Inline>
      </Inline>
    </Box>
  );
}

function AddCashActionButton({ canSubmit, isKeypad, onHoldToAdd }: { canSubmit: boolean; isKeypad: boolean; onHoldToAdd: () => void }) {
  const { isDarkMode } = useColorMode();
  const accent = useForegroundColor('accent');
  const buttonLabel = canSubmit
    ? `􀎽  ${i18n.t(i18n.l.cash.add_cash_screen.hold_to_add)}`
    : i18n.t(i18n.l.cash.add_cash_screen.enter_amount);

  return (
    <Box paddingHorizontal="20px" style={{ paddingBottom: isKeypad ? safeAreaInsetValues.bottom + 16 : 32 }}>
      <HoldToActivateButton
        backgroundColor="accent"
        color={canSubmit ? 'label' : 'labelTertiary'}
        disabled={!canSubmit}
        disabledBackgroundColor={isDarkMode ? opacity(accent, 0.1) : 'fillTertiary'}
        height={48}
        isProcessing={false}
        label={buttonLabel}
        onLongPress={onHoldToAdd}
        processingLabel={i18n.t(i18n.l.cash.add_cash_screen.hold_to_add)}
        showBiometryIcon={false}
        size="22pt"
        testID="cash-deposit-add-cash-hold-to-add"
        weight="heavy"
      />
    </Box>
  );
}

function PresetAmountContent({
  amount,
  onAddFrom,
  onHoldToAdd,
  onMore,
  onSettings,
}: {
  amount: AddCashAmount;
  onAddFrom: () => void;
  onHoldToAdd: () => void;
  onMore: () => void;
  onSettings: () => void;
}) {
  return (
    <>
      <AddCashHeader onSettings={onSettings} topPadding="28px" />
      <AmountPresetGrid onMore={onMore} onSelectPreset={amount.selectPresetAmount} selectedAmount={amount.selectedPresetAmount} />
      <AddFromRow onPress={onAddFrom} />
      <AddCashActionButton canSubmit={amount.canSubmit} isKeypad={false} onHoldToAdd={onHoldToAdd} />
    </>
  );
}

function KeypadAmountContent({
  amount,
  onAddFrom,
  onHoldToAdd,
  onSettings,
}: {
  amount: AddCashAmount;
  onAddFrom: () => void;
  onHoldToAdd: () => void;
  onSettings: () => void;
}) {
  return (
    <>
      <KeypadHandle />
      <AddCashHeader onSettings={onSettings} topPadding="8px" />
      <Box as={Animated.View} entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)} style={styles.amountArea}>
        <AmountDisplay displayedAmount={amount.displayedAmount} />
      </Box>
      <KeypadFundingCaption />
      <AddFromRow onPress={onAddFrom} />
      <Box as={Animated.View} entering={FadeIn.duration(160)} paddingBottom="8px">
        <NumberPad
          activeFieldId={amount.activeFieldId}
          fields={amount.fields}
          onValueChange={amount.onValueChange}
          stripFormatting={sanitizeAmount}
        />
      </Box>
      <AddCashActionButton canSubmit={amount.canSubmit} isKeypad onHoldToAdd={onHoldToAdd} />
    </>
  );
}

export const AddCashSheet = memo(function AddCashSheet() {
  const [mode, setMode] = useState<AddCashMode>('presets');
  const amount = useAddCashAmount(DEFAULT_SELECTED_AMOUNT);
  const { resetKeypadAmount } = amount;

  useFocusEffect(
    useCallback(() => {
      analytics.track(analytics.event.addCashViewed);
    }, [])
  );

  // Hold to Add -> create buy order. Buy pipeline lands in a later unit; inert for now.
  const handleHoldToAdd = useCallback(() => {
    // TODO(cash): createBuyOrder + register pending transaction once the Add Cash buy unit lands.
  }, []);

  // Add From -> payment-method picker. Lands with card linking; inert for now.
  const handleAddFrom = useCallback(() => {
    // TODO(cash): open the payment-method picker once card linking lands.
  }, []);

  const handleSettings = useCallback(() => {
    // TODO(cash): open cash settings once they land.
  }, []);

  const handleMore = useCallback(() => {
    resetKeypadAmount();
    setMode('keypad');
  }, [resetKeypadAmount]);

  const isKeypad = mode === 'keypad';

  return (
    <PanelSheet
      bottomOffset={isKeypad ? 0 : undefined}
      height={isKeypad ? KEYPAD_PANEL_HEIGHT : undefined}
      layoutAnimation={PANEL_LAYOUT}
      panelStyle={isKeypad ? styles.fullScreenPanel : undefined}
      showHandle={!isKeypad}
    >
      <Box background="surfaceSecondary" style={isKeypad ? styles.fullScreenContent : undefined}>
        {isKeypad ? (
          <KeypadAmountContent amount={amount} onAddFrom={handleAddFrom} onHoldToAdd={handleHoldToAdd} onSettings={handleSettings} />
        ) : (
          <PresetAmountContent
            amount={amount}
            onAddFrom={handleAddFrom}
            onHoldToAdd={handleHoldToAdd}
            onMore={handleMore}
            onSettings={handleSettings}
          />
        )}
      </Box>
    </PanelSheet>
  );
});

const styles = StyleSheet.create({
  amountArea: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  chip: {
    flexBasis: '30%',
    flexGrow: 1,
    height: 56,
    minWidth: 0,
  },
  chipInner: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 4,
    flex: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
  },
  chipUnselected: {
    borderColor: 'transparent',
  },
  fullScreenContent: {
    flex: 1,
  },
  fullScreenPanel: {
    width: DEVICE_WIDTH,
  },
  handle: {
    borderRadius: 3,
    height: 5,
    width: 36,
  },
  presetGrid: {
    columnGap: 10,
    rowGap: 12,
  },
});
