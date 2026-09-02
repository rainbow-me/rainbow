import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

import { analytics } from '@/analytics';
import { toAnalyticsAmount } from '@/analytics/utils';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { NumberPad } from '@/components/number-pad/NumberPad';
import { DEFAULT_HANDLE_COLOR_DARK, DEFAULT_HANDLE_COLOR_LIGHT, PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Inline, Text, useColorMode, useForegroundColor } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { ORDER_FAST_POLL_DURATION_MS, ORDER_FAST_POLL_INTERVAL_MS, ORDER_SLOW_POLL_INTERVAL_MS } from '@/features/cash/constants';
import { isPasskeyCancellation } from '@/features/cash/services/cashPasskeyService';
import { checkWalletLink } from '@/features/cash/services/walletLinkService';
import { cashBuyOrderActions, selectCashBuyPhase, useCashBuyOrderStore, useCashBuyPhase } from '@/features/cash/stores/cashBuyOrderStore';
import { useCashLinkedCard, type LinkedCard } from '@/features/cash/stores/cashPaymentMethodStore';
import { getTelemetryErrorReason } from '@/features/cash/utils/getTelemetryErrorReason';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import { ChainId } from '@/features/network/types/backendNetworks';
import { useTimestampReached } from '@/framework/ui/hooks/useTimestampReached';
import { useWatcher } from '@/framework/ui/hooks/useWatcher';
import { WrappedAlert as Alert } from '@/helpers/alert';
import usePrevious from '@/hooks/usePrevious';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { USDC_ADDRESS } from '@/references/constants';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import getUrlForTrustIconFallback from '@/utils/getUrlForTrustIconFallback';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';
import { sanitizeAmount } from '@/worklets/strings';

import { AccountAvatar } from './AccountAvatar';
import { AddCardHint } from './AddCardHint';
import { AddFromRow } from './AddFromRow';
import { AmountDisplay } from './AmountDisplay';
import { PendingOrderContent } from './PendingOrderContent';
import { SettingsButton } from './SettingsButton';
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

function AddCashHeader({ onSettings, topPadding }: { onSettings: () => void; topPadding: '8px' | '28px' }) {
  return (
    <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingHorizontal="24px" paddingTop={topPadding}>
      <AccountAvatar />
      <Text align="center" color="label" size="22pt" weight="heavy">
        {i18n.t(i18n.l.cash.add_cash)}
      </Text>
      <SettingsButton onPress={onSettings} />
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

function getActionButtonLabel(canSubmitAmount: boolean): string {
  return canSubmitAmount ? `􀎽  ${i18n.t(i18n.l.cash.add_cash_screen.hold_to_add)}` : i18n.t(i18n.l.cash.add_cash_screen.enter_amount);
}

function AddCashActionButton({
  canSubmitAmount,
  hasLinkedCard,
  isKeypad,
  isProcessing,
  onAddCard,
  onHoldToAdd,
}: {
  canSubmitAmount: boolean;
  hasLinkedCard: boolean;
  isKeypad: boolean;
  isProcessing: boolean;
  onAddCard: () => void;
  onHoldToAdd: () => void;
}) {
  const { isDarkMode } = useColorMode();
  const accent = useForegroundColor('accent');

  return (
    <Box
      paddingHorizontal="20px"
      paddingTop={isKeypad ? undefined : '24px'}
      style={{ paddingBottom: isKeypad ? safeAreaInsetValues.bottom + 16 : 32 }}
    >
      {hasLinkedCard ? (
        <HoldToActivateButton
          backgroundColor="accent"
          color={canSubmitAmount ? 'label' : 'labelTertiary'}
          disabled={!canSubmitAmount || isProcessing}
          disabledBackgroundColor={isDarkMode ? opacity(accent, 0.1) : 'fillTertiary'}
          height={48}
          isProcessing={isProcessing}
          label={getActionButtonLabel(canSubmitAmount)}
          onLongPress={onHoldToAdd}
          processingLabel={i18n.t(i18n.l.cash.add_cash_screen.adding_cash)}
          showBiometryIcon={false}
          size="22pt"
          testID="cash-deposit-add-cash-hold-to-add"
          weight="heavy"
        />
      ) : (
        <ButtonPressAnimation onPress={onAddCard} scaleTo={0.97} testID="cash-deposit-add-cash-add-card">
          <Box alignItems="center" borderRadius={48} height={{ custom: 48 }} justifyContent="center" background="blue" width="full">
            <Text align="center" color="label" size="22pt" weight="heavy">
              {i18n.t(i18n.l.cash.add_cash_screen.add_credit_card)}
            </Text>
          </Box>
        </ButtonPressAnimation>
      )}
    </Box>
  );
}

function PresetAmountContent({
  amount,
  canSubmitAmount,
  isProcessing,
  linkedCard,
  onAddCard,
  onAddFrom,
  onHoldToAdd,
  onMore,
  onSelectPreset,
  onSettings,
}: {
  amount: AddCashAmount;
  canSubmitAmount: boolean;
  isProcessing: boolean;
  linkedCard: LinkedCard | null;
  onAddCard: () => void;
  onAddFrom: () => void;
  onHoldToAdd: () => void;
  onMore: () => void;
  onSelectPreset: (amount: number) => void;
  onSettings: () => void;
}) {
  return (
    <>
      <AddCashHeader onSettings={onSettings} topPadding="28px" />
      <AmountPresetGrid onMore={onMore} onSelectPreset={onSelectPreset} selectedAmount={amount.selectedPresetAmount} />
      {linkedCard ? <AddFromRow card={linkedCard} onPress={onAddFrom} /> : <AddCardHint />}
      <AddCashActionButton
        canSubmitAmount={canSubmitAmount}
        hasLinkedCard={linkedCard != null}
        isKeypad={false}
        isProcessing={isProcessing}
        onAddCard={onAddCard}
        onHoldToAdd={onHoldToAdd}
      />
    </>
  );
}

function KeypadAmountContent({
  amount,
  canSubmitAmount,
  isProcessing,
  linkedCard,
  onAddCard,
  onAddFrom,
  onHoldToAdd,
  onSettings,
}: {
  amount: AddCashAmount;
  canSubmitAmount: boolean;
  isProcessing: boolean;
  linkedCard: LinkedCard | null;
  onAddCard: () => void;
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
      {linkedCard ? (
        <>
          <KeypadFundingCaption />
          <AddFromRow card={linkedCard} onPress={onAddFrom} />
        </>
      ) : (
        <AddCardHint />
      )}
      <Box as={Animated.View} entering={FadeIn.duration(160)} paddingBottom="8px" paddingTop="24px">
        <NumberPad
          activeFieldId={amount.activeFieldId}
          fields={amount.fields}
          onValueChange={amount.onValueChange}
          stripFormatting={sanitizeAmount}
        />
      </Box>
      <AddCashActionButton
        canSubmitAmount={canSubmitAmount}
        hasLinkedCard={linkedCard != null}
        isKeypad
        isProcessing={isProcessing}
        onAddCard={onAddCard}
        onHoldToAdd={onHoldToAdd}
      />
    </>
  );
}

export const AddCashSheet = memo(function AddCashSheet() {
  const linkedCard = useCashLinkedCard();
  const [mode, setMode] = useState<AddCashMode>('presets');
  const amount = useAddCashAmount(DEFAULT_SELECTED_AMOUNT);
  const { resetKeypadAmount } = amount;

  const navigation = useNavigation();
  const accountAddress = useAccountAddress();
  const phase = useCashBuyPhase();
  const previousPhase = usePrevious(phase);
  const errorCode = useCashBuyOrderStore(state => (state.status.step === 'error' ? state.status.errorCode : null));
  const isPolling = useCashBuyOrderStore(state => state.status.step === 'polling');
  const submittedAt = useCashBuyOrderStore(state =>
    state.status.step === 'submitting' || state.status.step === 'polling' ? state.status.submittedAt : null
  );
  const { cash_pending_view_delay_ms: pendingViewDelayMs } = useRemoteConfig('cash_pending_view_delay_ms');
  const [isCheckingWallet, setIsCheckingWallet] = useState(false);
  const walletCheckRef = useRef<AbortController | null>(null);
  const isPending = phase === 'pending';
  const isProcessing = isCheckingWallet || isPending;

  // The pending view takes over only once the order has been in flight longer than the configured
  // delay; until then the hold-to-add button's processing state is the only affordance.
  const pendingViewAt = submittedAt !== null ? submittedAt + pendingViewDelayMs : null;
  const showPendingView = useTimestampReached(pendingViewAt);

  useEffect(() => {
    return () => {
      walletCheckRef.current?.abort();
    };
  }, []);

  // On open, replay a submit interrupted before an order id came back; otherwise clear the settled
  // previous run so the sheet starts fresh.
  useEffect(() => {
    if (selectCashBuyPhase(useCashBuyOrderStore.getState()) === 'pending') {
      cashBuyOrderActions.resumePendingSubmission();
    } else {
      cashBuyOrderActions.reset();
    }
  }, []);

  // A fresh order is most likely to settle inside the fast window; polling backs off past it.
  const slowPollAt = submittedAt !== null ? submittedAt + ORDER_FAST_POLL_DURATION_MS : null;
  const isSlowPolling = useTimestampReached(slowPollAt);

  useWatcher({
    enabled: isPolling,
    interval: isSlowPolling ? ORDER_SLOW_POLL_INTERVAL_MS : ORDER_FAST_POLL_INTERVAL_MS,
    watchFunction: cashBuyOrderActions.syncActiveOrder,
  });

  useEffect(() => {
    if (previousPhase === undefined || previousPhase === phase) return;
    if (phase === 'error') {
      // TODO(cash): replace this Alert with an in-place error state once the design is ready.
      Alert.alert(
        i18n.t(i18n.l.cash.add_cash_screen.buy_error_title),
        errorCode === 'PAYMENT_REJECTED'
          ? i18n.t(i18n.l.cash.add_cash_screen.payment_rejected)
          : i18n.t(i18n.l.cash.add_cash_screen.buy_error_generic)
      );
    }
    if (phase === 'success') navigation.goBack();
  }, [phase, errorCode, navigation, previousPhase]);

  // Sample the amount whenever the user taps a preset chip.
  const handleSelectPreset = useCallback(
    (presetAmount: number) => {
      analytics.track(analytics.event.cashAmountEntered, { amount: toAnalyticsAmount(presetAmount), entryMode: 'preset' });
      amount.selectPresetAmount(presetAmount);
    },
    [amount]
  );

  // Sample each keypad amount the user types; `canSubmit` skips the "0" reset and empty values.
  useEffect(() => {
    if (mode !== 'keypad' || !amount.canSubmit) return;
    analytics.track(analytics.event.cashAmountEntered, { amount: toAnalyticsAmount(amount.amount), entryMode: 'keypad' });
  }, [mode, amount.canSubmit, amount.amount]);

  // A deposit can only credit a wallet the Cash account has linked, so resolve that first: the token
  // it mints also authorizes the order that follows.
  const handleHoldToAdd = useCallback(async () => {
    if (!linkedCard || walletCheckRef.current) return;

    const controller = new AbortController();
    walletCheckRef.current = controller;
    setIsCheckingWallet(true);
    try {
      const status = await checkWalletLink(accountAddress, controller);
      if (controller.signal.aborted) return;
      if (status === 'needsLink') {
        navigation.navigate(Routes.CASH_ADD_WALLET_SHEET, {
          walletAddress: accountAddress,
          cardId: linkedCard.id,
          depositAmount: amount.amount,
        });
        return;
      }
      cashBuyOrderActions.submitBuyOrder({ cardId: linkedCard.id, depositAmount: amount.amount, walletAddress: accountAddress });
    } catch (error) {
      if (controller.signal.aborted || isPasskeyCancellation(error)) return;
      logger.error(new RainbowError('[AddCashSheet]: Failed to resolve the deposit wallet', error));
      analytics.track(analytics.event.cashWalletCheckFailed, { reason: getTelemetryErrorReason(error) });
      Alert.alert(
        i18n.t(i18n.l.cash.add_cash_screen.wallet_check_error_title),
        i18n.t(i18n.l.cash.add_cash_screen.wallet_check_error_generic)
      );
    } finally {
      if (walletCheckRef.current === controller) {
        walletCheckRef.current = null;
      }
      setIsCheckingWallet(false);
    }
  }, [accountAddress, amount.amount, linkedCard, navigation]);

  const handleAddCard = useCallback(() => {
    navigation.navigate(Routes.CASH_DEPOSIT_SETUP_SCREEN);
  }, [navigation]);

  const handleAddFrom = useCallback(() => {
    if (isProcessing) return;
    navigation.navigate(Routes.CASH_PAYMENT_METHODS_SHEET);
  }, [isProcessing, navigation]);

  const handleSettings = useCallback(() => {
    // TODO(cash): open cash settings once they land.
  }, []);

  const handleMore = useCallback(() => {
    resetKeypadAmount();
    setMode('keypad');
  }, [resetKeypadAmount]);

  const view = showPendingView ? 'pending' : mode;
  const isKeypad = view === 'keypad';

  return (
    <PanelSheet
      bottomOffset={isKeypad ? 0 : undefined}
      height={isKeypad ? KEYPAD_PANEL_HEIGHT : undefined}
      layoutAnimation={PANEL_LAYOUT}
      panelStyle={isKeypad ? styles.fullScreenPanel : undefined}
      showHandle={!isKeypad}
      showTapToDismiss={!isProcessing}
    >
      <Box background="surfaceSecondary" style={isKeypad ? styles.fullScreenContent : undefined}>
        {view === 'pending' ? (
          <PendingOrderContent onSettings={handleSettings} />
        ) : view === 'keypad' ? (
          <KeypadAmountContent
            amount={amount}
            canSubmitAmount={amount.canSubmit}
            isProcessing={isProcessing}
            linkedCard={linkedCard}
            onAddCard={handleAddCard}
            onAddFrom={handleAddFrom}
            onHoldToAdd={handleHoldToAdd}
            onSettings={handleSettings}
          />
        ) : (
          <PresetAmountContent
            amount={amount}
            canSubmitAmount={amount.canSubmit}
            isProcessing={isProcessing}
            linkedCard={linkedCard}
            onAddCard={handleAddCard}
            onAddFrom={handleAddFrom}
            onHoldToAdd={handleHoldToAdd}
            onMore={handleMore}
            onSelectPreset={handleSelectPreset}
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
