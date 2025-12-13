import { memo } from 'react';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Box, Separator, useColorMode } from '@/design-system';
import { DepositQuoteStatus, getAccentColor } from '@/features/funding/types';
import { PerpsSwapButton } from '@/features/perps/components/PerpsSwapButton';
import { useStableValue } from '@/hooks/useStableValue';
import * as i18n from '@/languages';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { time } from '@/utils/time';
import { useDepositContext } from '../../contexts/DepositContext';
import { GasButton } from './gas/GasButton';

// ============ Translations =================================================== //

const translations = {
  confirmButton: i18n.t(i18n.l.perps.deposit.confirm_button_text),
  confirmButtonError: i18n.t(i18n.l.perps.deposit.confirm_button_error_text),
  confirmButtonInsufficientGas: 'Insufficient Gas',
  confirmButtonLoading: i18n.t(i18n.l.perps.deposit.confirm_button_loading_text),
  confirmButtonOverBalance: i18n.t(i18n.l.perps.deposit.confirm_button_over_balance_text),
  confirmButtonZero: i18n.t(i18n.l.perps.deposit.confirm_button_zero_text),
};

// ============ Footer ========================================================= //

type DepositFooterProps = {
  inputAmountErrorShared: SharedValue<'overBalance' | 'zero' | null>;
  isSubmitting: SharedValue<boolean>;
  onSubmit: () => Promise<void>;
};

export const DepositFooter = memo(function DepositFooter({ inputAmountErrorShared, isSubmitting, onSubmit }: DepositFooterProps) {
  return (
    <>
      <GasButtonWrapper />
      <Box height={32}>
        <Separator color="separatorTertiary" direction="vertical" thickness={1} />
      </Box>
      <SwapButton inputAmountErrorShared={inputAmountErrorShared} isSubmitting={isSubmitting} onSwap={onSubmit} />
    </>
  );
});

// ============ Gas Button Wrapper ============================================= //

const GasButtonWrapper = memo(function GasButtonWrapper() {
  const { depositActions, gasStores, useQuoteStore } = useDepositContext();

  const isLoading = useStoreSharedValue(
    useStableValue(() =>
      createDerivedStore(
        $ => {
          const isGasLimitLoading = $(gasStores.useGasLimitStore, state => !state.getData() && state.status === 'loading');
          const isQuoteLoading = $(useQuoteStore, state => state.status === 'loading');
          return isQuoteLoading || isGasLimitLoading;
        },
        { debounce: time.ms(100), fastMode: true }
      )
    ),
    state => state
  );

  return (
    <Box alignItems="flex-start" justifyContent="center">
      <GasButton isFetching={isLoading} onSelectGasSpeed={depositActions.setGasSpeed} />
    </Box>
  );
});

// ============ Swap Button ==================================================== //

const SwapButton = memo(function SwapButton({
  inputAmountErrorShared,
  isSubmitting,
  onSwap,
}: {
  inputAmountErrorShared: SharedValue<'overBalance' | 'zero' | null>;
  isSubmitting: SharedValue<boolean>;
  onSwap: () => Promise<void>;
}) {
  const { isDarkMode } = useColorMode();
  const { theme, useQuoteStore } = useDepositContext();
  const accentColor = getAccentColor(theme, isDarkMode);
  const hasQuoteError = useStoreSharedValue(
    useQuoteStore,
    state => !state.enabled && state.status !== 'loading' && state.getStatus('isError')
  );
  const quote = useStoreSharedValue(useQuoteStore, state => state.getData());

  const label = useDerivedValue(() => {
    'worklet';
    if (inputAmountErrorShared.value === 'zero') {
      return translations.confirmButtonZero;
    }
    if (inputAmountErrorShared.value === 'overBalance') {
      return translations.confirmButtonOverBalance;
    }
    if (quote.value === DepositQuoteStatus.InsufficientGas) {
      return translations.confirmButtonInsufficientGas;
    }
    if (hasQuoteError.value || quote.value === DepositQuoteStatus.InsufficientBalance) {
      return translations.confirmButtonError;
    }
    if (isSubmitting.value) {
      return translations.confirmButtonLoading;
    }
    return translations.confirmButton;
  });

  const shouldDisable = useDerivedValue(() => {
    'worklet';
    const isInsufficientGas = quote.value === DepositQuoteStatus.InsufficientGas;
    return isSubmitting.value || quote.value == null || hasQuoteError.value || inputAmountErrorShared.value != null || isInsufficientGas;
  });

  return (
    <Box flexGrow={1}>
      <PerpsSwapButton accentColor={accentColor} disabled={shouldDisable} label={label} onLongPress={onSwap} />
    </Box>
  );
});
