import React, { memo, useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';

import { useFocusEffect } from '@react-navigation/native';

import { analytics } from '@/analytics';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ContactAvatar from '@/components/contacts/ContactAvatar';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Inline, Text, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';

type AmountPreset = { amount: number; label: string };
const AMOUNT_PRESETS: AmountPreset[] = [
  { amount: 10, label: '$10' },
  { amount: 25, label: '$25' },
  { amount: 50, label: '$50' },
  { amount: 100, label: '$100' },
  { amount: 1000, label: '$1k' },
];
const DEFAULT_SELECTED_AMOUNT = 50;

// Placeholder payment method — the real "Add From" source lands with card linking.
const MOCK_PAYMENT_METHOD = { brand: 'Visa Debit', maskedNumber: '*8990' };

function AccountAvatar() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();

  return accountImage ? (
    <ImageAvatar image={accountImage} size="header" />
  ) : (
    <ContactAvatar color={accountColor} size="small" value={accountSymbol} />
  );
}

function VisaBadge() {
  return (
    <Box
      alignItems="center"
      borderRadius={6}
      height={{ custom: 20 }}
      justifyContent="center"
      style={styles.visaBadge}
      width={{ custom: 28 }}
    >
      <Text align="center" color="white" size="icon 8px" weight="heavy">
        {'VISA'}
      </Text>
    </Box>
  );
}

function AmountChip({ label, selected, onPress, testID }: { label: string; selected: boolean; onPress: () => void; testID: string }) {
  const blue = useForegroundColor('blue');
  const shadowFar = useForegroundColor('shadowFar');
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.94} style={styles.chip} testID={testID} wrapperStyle={styles.chip}>
      <Box
        alignItems="center"
        background="surfaceSecondaryElevated"
        justifyContent="center"
        style={[styles.chipInner, { borderColor: selected ? blue : 'transparent', shadowColor: shadowFar }]}
      >
        <Text align="center" color="label" size="22pt" weight="heavy">
          {label}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
}

export const AddCashSheet = memo(function AddCashSheet() {
  const blue = useForegroundColor('blue');
  const separatorTertiary = useForegroundColor('separatorTertiary');
  const shadowFar = useForegroundColor('shadowFar');
  const [selectedAmount, setSelectedAmount] = useState(DEFAULT_SELECTED_AMOUNT);

  useFocusEffect(
    useCallback(() => {
      analytics.track(analytics.event.addCashViewed);
    }, [])
  );

  // Hold to Add → create buy order. Buy pipeline lands in a later unit; inert for now.
  const handleHoldToAdd = useCallback(() => {
    // TODO(cash): createBuyOrder + register pending transaction once the Add Cash buy unit lands.
  }, []);

  // Add From → payment-method picker. Lands with card linking; inert for now.
  const handleAddFrom = useCallback(() => {
    // TODO(cash): open the payment-method picker once card linking lands.
  }, []);

  // Custom amount entry. Lands with the keypad; inert for now.
  const handleMore = useCallback(() => {
    // TODO(cash): open custom amount entry once the keypad unit lands.
  }, []);

  const handleSettings = useCallback(() => {
    // TODO(cash): open cash settings once they land.
  }, []);

  return (
    <PanelSheet>
      <Box background="surfaceSecondary">
        <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingHorizontal="24px" paddingTop="28px">
          <AccountAvatar />
          <Text align="center" color="label" size="22pt" weight="heavy">
            {i18n.t(i18n.l.cash.add_cash)}
          </Text>
          <ButtonPressAnimation onPress={handleSettings} scaleTo={0.8} testID="cash-deposit-add-cash-settings">
            <Box alignItems="center" height={{ custom: 36 }} justifyContent="center" width={{ custom: 36 }}>
              <Text align="center" color="blue" size="20pt" weight="heavy">
                {'􀣋'}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Box>

        <Box flexDirection="row" flexWrap="wrap" paddingHorizontal="28px" paddingTop="32px" style={styles.presetGrid}>
          {AMOUNT_PRESETS.map(preset => (
            <AmountChip
              key={preset.amount}
              label={preset.label}
              onPress={() => setSelectedAmount(preset.amount)}
              selected={selectedAmount === preset.amount}
              testID={`cash-deposit-add-cash-amount-${preset.amount}`}
            />
          ))}
          <ButtonPressAnimation
            onPress={handleMore}
            scaleTo={0.94}
            style={styles.chip}
            testID="cash-deposit-add-cash-amount-more"
            wrapperStyle={styles.chip}
          >
            <Box
              alignItems="center"
              background="surfaceSecondaryElevated"
              justifyContent="center"
              style={[styles.chipInner, styles.chipUnselected, { shadowColor: shadowFar }]}
            >
              <Text align="center" color="label" size="22pt" weight="heavy">
                {'􀍠'}
              </Text>
            </Box>
          </ButtonPressAnimation>
        </Box>

        <Box paddingTop="24px">
          <Box style={[styles.separator, { backgroundColor: separatorTertiary }]} />
          <ButtonPressAnimation onPress={handleAddFrom} scaleTo={0.96} testID="cash-deposit-add-cash-add-from">
            <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingHorizontal="28px" paddingTop="20px">
              <Text color="labelQuaternary" size="17pt" weight="bold">
                {i18n.t(i18n.l.cash.add_cash_screen.add_from)}
              </Text>
              <Inline alignVertical="center" space="8px">
                <VisaBadge />
                <Text color="label" size="17pt" weight="bold">
                  {MOCK_PAYMENT_METHOD.brand}
                </Text>
                <Text color="labelTertiary" size="17pt" weight="semibold">
                  {MOCK_PAYMENT_METHOD.maskedNumber}
                </Text>
                <Text color="labelSecondary" size="13pt" weight="heavy">
                  {'􀆊'}
                </Text>
              </Inline>
            </Box>
          </ButtonPressAnimation>
        </Box>

        <Box paddingBottom="32px" paddingHorizontal="20px" paddingTop="36px">
          <HoldToActivateButton
            backgroundColor={blue}
            color="white"
            disabledBackgroundColor={blue}
            height={48}
            isProcessing={false}
            label={`􀎽  ${i18n.t(i18n.l.cash.add_cash_screen.hold_to_add)}`}
            onLongPress={handleHoldToAdd}
            processingLabel={i18n.t(i18n.l.cash.add_cash_screen.hold_to_add)}
            showBiometryIcon={false}
            size="22pt"
            testID="cash-deposit-add-cash-hold-to-add"
            weight="heavy"
          />
        </Box>
      </Box>
    </PanelSheet>
  );
});

const styles = StyleSheet.create({
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
  presetGrid: {
    columnGap: 10,
    rowGap: 12,
  },
  separator: {
    borderRadius: 1,
    height: 1,
    marginHorizontal: 28,
  },
  visaBadge: {
    backgroundColor: '#1B33C3',
  },
});
