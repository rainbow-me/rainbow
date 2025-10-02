import { memo } from 'react';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Box } from '@/design-system';
import { PerpsSwapButton } from '@/features/perps/components/PerpsSwapButton';
import { GasButton } from '@/features/perps/screens/perps-deposit-withdraw-screen/components/gas/GasButton';
import { usePerpsDepositContext } from '@/features/perps/screens/perps-deposit-withdraw-screen/PerpsDepositContext';
import { useStableValue } from '@/hooks/useStableValue';
import * as i18n from '@/languages';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { time } from '@/utils/time';

const translations = {
  confirmButtonZero: i18n.t(i18n.l.perps.deposit.confirm_button_zero_text),
  confirmButtonOverBalance: i18n.t(i18n.l.perps.deposit.confirm_button_over_balance_text),
  confirmButtonError: i18n.t(i18n.l.perps.deposit.confirm_button_error_text),
  confirmButtonLoading: i18n.t(i18n.l.perps.deposit.confirm_button_loading_text),
  confirmButton: i18n.t(i18n.l.perps.deposit.confirm_button_text),
};

export const GasButtonWrapper = memo(function GasButtonWrapper() {
  const { depositActions, gasStores, useQuoteStore } = usePerpsDepositContext();

  const isLoading = useStoreSharedValue(
    useStableValue(() =>
      createDerivedStore(
        $ => {
          const isQuoteLoading = $(useQuoteStore, state => state.getStatus('isLoading'));
          const isGasLimitLoading = $(gasStores.useGasLimitStore, state => state.getStatus('isInitialLoad'));
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

export const SwapButton = memo(function SwapButton({
  inputAmountErrorShared,
  isSubmitting,
  onSwap,
}: {
  inputAmountErrorShared: SharedValue<'zero' | 'overBalance' | null>;
  isSubmitting: SharedValue<boolean>;
  onSwap: () => Promise<void>;
}) {
  const { useQuoteStore } = usePerpsDepositContext();
  const quote = useStoreSharedValue(useQuoteStore, state => state.getData());
  const hasQuoteError = useStoreSharedValue(
    useQuoteStore,
    state => !state.enabled && state.status !== 'loading' && state.getStatus('isError')
  );

  const label = useDerivedValue(() => {
    'worklet';
    if (inputAmountErrorShared.value === 'zero') {
      return translations.confirmButtonZero;
    }
    if (inputAmountErrorShared.value === 'overBalance') {
      return translations.confirmButtonOverBalance;
    }
    if (hasQuoteError.value) {
      return translations.confirmButtonError;
    }
    if (isSubmitting.value) {
      return translations.confirmButtonLoading;
    }
    return translations.confirmButton;
  });

  const shouldDisable = useDerivedValue(() => {
    'worklet';
    return isSubmitting.value || quote.value == null || hasQuoteError.value || inputAmountErrorShared.value != null;
  });

  return (
    <Box flexGrow={1}>
      <PerpsSwapButton disabled={shouldDisable} label={label} onLongPress={onSwap} />
    </Box>
  );
});
