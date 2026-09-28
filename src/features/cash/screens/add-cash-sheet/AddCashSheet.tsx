import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';

import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { ScreenCornerRadius } from 'react-native-screen-corner-radius';

import { analytics } from '@/analytics';
import { toAnalyticsAmount } from '@/analytics/utils';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { NumberPad } from '@/components/number-pad/NumberPad';
import { DEFAULT_HANDLE_COLOR_DARK, DEFAULT_HANDLE_COLOR_LIGHT, PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, globalColors, Inline, Text, useColorMode, useForegroundColor } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { ORDER_FAST_POLL_DURATION_MS, ORDER_FAST_POLL_INTERVAL_MS, ORDER_SLOW_POLL_INTERVAL_MS } from '@/features/cash/constants';
import { openCashAuthGate } from '@/features/cash/services/cashAuthGateService';
import { isHandledCashError } from '@/features/cash/services/cashHandledError';
import { checkWalletLink } from '@/features/cash/services/walletLinkService';
import { useCashAuthGateStore } from '@/features/cash/stores/cashAuthGateStore';
import { cashBuyOrderActions, selectCashBuyPhase, useCashBuyOrderStore, useCashBuyPhase } from '@/features/cash/stores/cashBuyOrderStore';
import { useCashFundingState, type CashFundingState } from '@/features/cash/stores/cashPaymentMethodStore';
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
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import getUrlForTrustIconFallback from '@/utils/getUrlForTrustIconFallback';
import safeAreaInsetValues from '@/utils/safeAreaInsetValues';
import { clamp } from '@/worklets/numbers';
import { sanitizeAmount } from '@/worklets/strings';

import { AccountAvatar } from './AccountAvatar';
import { AddCardHint } from './AddCardHint';
import { AddFromRow } from './AddFromRow';
import { AmountDisplay } from './AmountDisplay';
import { PendingOrderContent } from './PendingOrderContent';
import { ReauthenticateContent } from './ReauthenticateContent';
import { useAddCashAmount } from './useAddCashAmount';

type AddCashMode = 'presets' | 'keypad';
type AmountPreset = { amount: number; label: string };
type AddCashAmount = ReturnType<typeof useAddCashAmount>;
type AddCashStore = AddCashAmount['useAddCashStore'];

const AMOUNT_PRESETS: AmountPreset[] = [
  { amount: 10, label: '$10' },
  { amount: 25, label: '$25' },
  { amount: 50, label: '$50' },
  { amount: 100, label: '$100' },
  { amount: 1000, label: '$1k' },
];

const DEFAULT_SELECTED_AMOUNT = 50;
const USDC_ICON_URL = getUrlForTrustIconFallback(USDC_ADDRESS, ChainId.mainnet) ?? undefined;

const PANEL_LAYOUT = LinearTransition.springify()
  .mass(SPRING_CONFIGS.sheetTransition.mass)
  .damping(SPRING_CONFIGS.sheetTransition.damping)
  .stiffness(SPRING_CONFIGS.sheetTransition.stiffness);

function AddCashHeader({ topPadding }: { topPadding: '8px' | '28px' }) {
  return (
    <Box alignItems="center" flexDirection="row" justifyContent="space-between" paddingHorizontal="24px" paddingTop={topPadding}>
      <AccountAvatar />
      <Text align="center" color="label" size="22pt" weight="heavy">
        {i18n.t(i18n.l.cash.add_cash)}
      </Text>
      <Box height={{ custom: 36 }} width={{ custom: 36 }} />
    </Box>
  );
}

function AmountChip({
  isDarkMode,
  label,
  selected,
  onPress,
  testID,
}: {
  isDarkMode: boolean;
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  const shadowFar = useForegroundColor('shadowFar');
  const accent = useForegroundColor('accent');
  const buttonColor = isDarkMode ? globalColors.blueGrey100 : globalColors.white100;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9} style={styles.chip} testID={testID} wrapperStyle={styles.chip}>
      <Box
        alignItems="center"
        backgroundColor={buttonColor}
        justifyContent="center"
        shadow={Platform.OS === 'ios' ? undefined : '12px'}
        style={[
          styles.chipInner,
          {
            borderColor: selected ? accent : 'transparent',
            overflow: selected ? 'hidden' : 'visible',
            shadowColor: selected ? 'transparent' : shadowFar,
          },
        ]}
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
  useAddCashStore,
}: {
  onMore: () => void;
  onSelectPreset: (amount: number) => void;
  useAddCashStore: AddCashStore;
}) {
  const { isDarkMode } = useColorMode();
  const selectedAmount = useAddCashStore(s => s.getSelectedAmountPreset());

  return (
    <Box
      as={Animated.View}
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(160)}
      flexDirection="row"
      flexWrap="wrap"
      paddingBottom="12px"
      paddingHorizontal="24px"
      paddingTop="28px"
      style={styles.presetGrid}
    >
      {AMOUNT_PRESETS.map(preset => (
        <AmountChip
          key={preset.amount}
          isDarkMode={isDarkMode}
          label={preset.label}
          onPress={() => onSelectPreset(preset.amount)}
          selected={selectedAmount === preset.amount}
          testID={`cash-deposit-add-cash-amount-${preset.amount}`}
        />
      ))}

      <AmountChip isDarkMode={isDarkMode} label="􀍠" onPress={onMore} selected={false} testID="cash-deposit-add-cash-amount-more" />
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
      <Inline alignVertical="center" space="4px">
        <Text align="center" color="labelQuaternary" size="13pt" weight="semibold">
          {i18n.t(i18n.l.cash.add_cash_screen.money_is_added_in)}
        </Text>

        <RainbowCoinIcon chainId={ChainId.mainnet} icon={USDC_ICON_URL} showBadge={false} size={12} symbol="USDC" />
        <Text align="center" color="labelTertiary" size="13pt" weight="semibold">
          {i18n.t(i18n.l.cash.add_cash_screen.usdc)}
        </Text>
      </Inline>
    </Box>
  );
}

function getActionButtonLabel(canSubmitAmount: boolean): string {
  return canSubmitAmount ? `􀎽  ${i18n.t(i18n.l.cash.add_cash_screen.hold_to_add)}` : i18n.t(i18n.l.cash.add_cash_screen.enter_amount);
}

const PANEL_HORIZONTAL_INSET = 8;
const PANEL_TOP_BORDER_RADIUS = 44;
const PANEL_BOTTOM_BORDER_RADIUS = Platform.OS === 'ios' ? ScreenCornerRadius - PANEL_HORIZONTAL_INSET : PANEL_TOP_BORDER_RADIUS;

const ACTION_BUTTON_HEIGHT = 48;
const MIN_ACTION_BUTTON_INSET = 24;
const MAX_ACTION_BUTTON_INSET = 34;
const ACTION_BUTTON_INSET = clamp(PANEL_BOTTOM_BORDER_RADIUS - ACTION_BUTTON_HEIGHT / 2, MIN_ACTION_BUTTON_INSET, MAX_ACTION_BUTTON_INSET);

function AddCashActionButton({
  funding,
  isKeypad,
  isProcessing,
  onAddCard,
  onHoldToAdd,
  useAddCashStore,
}: {
  funding: CashFundingState;
  isKeypad: boolean;
  isProcessing: boolean;
  onAddCard: () => void;
  onHoldToAdd: () => void;
  useAddCashStore: AddCashStore;
}) {
  const { isDarkMode } = useColorMode();
  const accent = useForegroundColor('accent');
  const canSubmitAmount = useAddCashStore(s => s.canSubmit());

  return (
    <Box
      paddingHorizontal={{ custom: ACTION_BUTTON_INSET }}
      paddingBottom={isKeypad ? undefined : { custom: ACTION_BUTTON_INSET }}
      paddingTop={isKeypad ? undefined : '24px'}
    >
      {funding.kind !== 'none' ? (
        <HoldToActivateButton
          backgroundColor="accent"
          color={canSubmitAmount ? 'label' : 'labelTertiary'}
          disabled={!canSubmitAmount || isProcessing || funding.kind === 'loading'}
          disabledBackgroundColor={isDarkMode ? opacity(accent, 0.1) : 'fillTertiary'}
          height={ACTION_BUTTON_HEIGHT}
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
          <Box
            alignItems="center"
            borderRadius={24}
            height={{ custom: ACTION_BUTTON_HEIGHT }}
            justifyContent="center"
            background="blue"
            width="full"
          >
            <Text align="center" color="label" size="22pt" weight="heavy">
              {i18n.t(i18n.l.cash.add_cash_screen.add_debit_card)}
            </Text>
          </Box>
        </ButtonPressAnimation>
      )}
    </Box>
  );
}

function PresetAmountContent({
  amount,
  funding,
  isProcessing,
  onAddCard,
  onAddFrom,
  onHoldToAdd,
  onMore,
  onSelectPreset,
}: {
  amount: AddCashAmount;
  funding: CashFundingState;
  isProcessing: boolean;
  onAddCard: () => void;
  onAddFrom: () => void;
  onHoldToAdd: () => void;
  onMore: () => void;
  onSelectPreset: (amount: number) => void;
}) {
  const selectedAmount = useStoreSharedValue(amount.useAddCashStore, s => s.amount);

  return (
    <>
      <AddCashHeader topPadding="28px" />
      <AmountPresetGrid onMore={onMore} onSelectPreset={onSelectPreset} useAddCashStore={amount.useAddCashStore} />
      {funding.kind === 'none' ? (
        <AddCardHint paddingBottom="4px" paddingTop="16px" />
      ) : (
        <AddFromRow amount={selectedAmount} funding={funding} onPress={onAddFrom} paddingHorizontal={{ custom: ACTION_BUTTON_INSET }} />
      )}
      <AddCashActionButton
        funding={funding}
        isKeypad={false}
        isProcessing={isProcessing}
        onAddCard={onAddCard}
        onHoldToAdd={onHoldToAdd}
        useAddCashStore={amount.useAddCashStore}
      />
    </>
  );
}

function KeypadAmountContent({
  amount,
  funding,
  isProcessing,
  onAddCard,
  onAddFrom,
  onHoldToAdd,
  useAddCashStore,
}: {
  amount: AddCashAmount;
  funding: CashFundingState;
  isProcessing: boolean;
  onAddCard: () => void;
  onAddFrom: () => void;
  onHoldToAdd: () => void;
  useAddCashStore: AddCashStore;
}) {
  return (
    <>
      <KeypadHandle />
      <AddCashHeader topPadding="8px" />

      <Box as={Animated.View} entering={FadeIn.duration(160)} exiting={FadeOut.duration(160)} style={styles.amountArea}>
        <AmountDisplay displayedAmount={amount.displayedAmount} shakeOffset={amount.shakeOffset} />
      </Box>

      {funding.kind === 'none' ? <AddCardHint /> : <AddFromRow amount={amount.displayedAmount} funding={funding} onPress={onAddFrom} />}

      <Box as={Animated.View} entering={FadeIn.duration(160)} paddingBottom="8px" paddingTop="24px">
        <NumberPad
          activeFieldId={amount.activeFieldId}
          fields={amount.fields}
          onBeforeChange={amount.onBeforeChange}
          onInputRejected={amount.onInputRejected}
          onValueChange={amount.onValueChange}
          stripFormatting={sanitizeAmount}
        />
      </Box>

      <Box gap={24} paddingBottom={{ custom: safeAreaInsetValues.bottom + (Platform.OS === 'android' ? 12 : 0) }}>
        <AddCashActionButton
          funding={funding}
          isKeypad
          isProcessing={isProcessing}
          onAddCard={onAddCard}
          onHoldToAdd={onHoldToAdd}
          useAddCashStore={useAddCashStore}
        />
        <KeypadFundingCaption />
      </Box>
    </>
  );
}

export const AddCashSheet = memo(function AddCashSheet() {
  const funding = useCashFundingState();
  const openGate = useCashAuthGateStore(state => (state.status.step === 'closed' ? null : state.status));
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

  // On open, replay an interrupted submit and retain any id parked by the network-policy warning;
  // otherwise clear the settled previous run so the sheet starts fresh.
  useEffect(() => {
    const { status } = useCashBuyOrderStore.getState();
    if (selectCashBuyPhase({ status }) === 'pending') {
      cashBuyOrderActions.resumePendingSubmission();
    } else if (status.step !== 'networkPolicy') {
      cashBuyOrderActions.reset();
    }
  }, []);

  // A fresh order is most likely to settle inside the fast window; polling backs off past it.
  const slowPollAt = submittedAt !== null ? submittedAt + ORDER_FAST_POLL_DURATION_MS : null;
  const isSlowPolling = useTimestampReached(slowPollAt);

  // Post-paint on purpose: parking the gate in a layout effect fires before this component's store
  // subscription attaches, and the store's snapshot cache swallows the missed update — the sheet
  // then sits on the loading row forever. The unmount clear keeps a stale gate from flashing on reopen.
  useEffect(() => {
    void openCashAuthGate();
    return useCashAuthGateStore.getState().clear;
  }, []);

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

  // A deposit can only credit a wallet the Cash account has linked, so resolve that first: the token
  // it mints also authorizes the order that follows.
  const handleHoldToAdd = useCallback(async () => {
    if (funding.kind !== 'card' || walletCheckRef.current) return;

    const depositAmount = amount.useAddCashStore.getState().amount;
    const controller = new AbortController();
    walletCheckRef.current = controller;
    setIsCheckingWallet(true);

    try {
      analytics.track(analytics.event.cashAmountEntered, {
        amount: toAnalyticsAmount(depositAmount),
        entryMode: mode === 'presets' ? 'preset' : 'keypad',
      });
      const status = await checkWalletLink(accountAddress, controller);
      if (controller.signal.aborted) return;
      if (status === 'needsLink') {
        navigation.navigate(Routes.CASH_ADD_WALLET_SHEET, {
          walletAddress: accountAddress,
          cardId: funding.card.id,
          depositAmount,
        });
        return;
      }
      cashBuyOrderActions.submitBuyOrder({ cardId: funding.card.id, depositAmount, walletAddress: accountAddress });
    } catch (error) {
      if (controller.signal.aborted || isHandledCashError(error)) return;
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
  }, [accountAddress, amount.useAddCashStore, funding, mode, navigation]);

  const handleAddCard = useCallback(() => {
    navigation.navigate(Routes.CASH_DEPOSIT_SETUP_SCREEN);
  }, [navigation]);

  const handleAddFrom = useCallback(() => {
    if (isProcessing) return;
    navigation.navigate(Routes.CASH_PAYMENT_METHODS_SHEET);
  }, [isProcessing, navigation]);

  const handleMore = useCallback(() => {
    resetKeypadAmount();
    setMode('keypad');
  }, [resetKeypadAmount]);

  const view = showPendingView ? 'pending' : openGate ? 'reauth' : mode;
  const isKeypad = view === 'keypad';

  return (
    <PanelSheet
      borderBottomRadius={isKeypad ? (Platform.OS === 'ios' ? ScreenCornerRadius : 0) : PANEL_BOTTOM_BORDER_RADIUS}
      borderTopRadius={isKeypad ? (Platform.OS === 'ios' ? ScreenCornerRadius : 20) : PANEL_TOP_BORDER_RADIUS}
      bottomOffset={isKeypad ? 0 : Platform.OS === 'ios' ? PANEL_HORIZONTAL_INSET : undefined}
      height={isKeypad ? DEVICE_HEIGHT : undefined}
      horizontalPanelInset={isKeypad ? undefined : PANEL_HORIZONTAL_INSET}
      innerBorderWidth={isKeypad ? 0 : undefined}
      layoutAnimation={PANEL_LAYOUT}
      panelStyle={isKeypad ? styles.fullScreenPanel : undefined}
      showHandle={!isKeypad}
      showTapToDismiss={!isProcessing}
    >
      <Box style={isKeypad ? styles.fullScreenContent : undefined}>
        {view === 'pending' ? (
          <PendingOrderContent />
        ) : openGate ? (
          <ReauthenticateContent status={openGate} />
        ) : view === 'keypad' ? (
          <KeypadAmountContent
            amount={amount}
            funding={funding}
            isProcessing={isProcessing}
            onAddCard={handleAddCard}
            onAddFrom={handleAddFrom}
            onHoldToAdd={handleHoldToAdd}
            useAddCashStore={amount.useAddCashStore}
          />
        ) : (
          <PresetAmountContent
            amount={amount}
            funding={funding}
            isProcessing={isProcessing}
            onAddCard={handleAddCard}
            onAddFrom={handleAddFrom}
            onHoldToAdd={handleHoldToAdd}
            onMore={handleMore}
            onSelectPreset={amount.selectPresetAmount}
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
    paddingTop: 20,
  },
  chip: {
    flexBasis: '30%',
    flexGrow: 1,
    minWidth: 0,
  },
  chipInner: {
    borderCurve: 'continuous',
    borderRadius: 20,
    borderWidth: 11 / 3,
    flex: 1,
    height: 56,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
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
