import { memo } from 'react';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { Box } from '@/design-system/components/Box/Box';
import { Separator } from '@/design-system/components/Separator/Separator';
import { useColorMode } from '@/design-system/color/ColorMode';
import { PerpsSwapButton } from '@/features/perps/components/PerpsSwapButton';
import { useStableValue } from '@/hooks/useStableValue';
import * as i18n from '@/languages';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { InferStoreState } from '@/state/internal/types';
import { DepositQuoteStatus, DepositQuoteStoreType, getAccentColor } from '@/systems/funding/types';
import { time } from '@/utils/time';
import { useDepositContext } from '../../contexts/DepositContext';
import { GasButton } from './gas/GasButton';

// ============ Types ========================================================== //

type InputAmountError = DepositQuoteStatus.InsufficientBalance | DepositQuoteStatus.ZeroAmountError | null;

type QuoteStatus =
  | DepositQuoteStatus.Error
  | DepositQuoteStatus.InsufficientBalance
  | DepositQuoteStatus.InsufficientGas
  | DepositQuoteStatus.Success
  | null;

// ============ Translations =================================================== //

const translations = {
  confirm: i18n.t(i18n.l.perps.deposit.confirm_button_text),
  error: i18n.t(i18n.l.perps.deposit.confirm_button_error_text),
  insufficientGas: i18n.t(i18n.l.perps.deposit.insufficient_gas),
  loading: i18n.t(i18n.l.perps.deposit.confirm_button_loading_text),
  overBalance: i18n.t(i18n.l.perps.deposit.confirm_button_over_balance_text),
  zeroAmount: i18n.t(i18n.l.perps.deposit.confirm_button_zero_text),
};

// ============ Footer ========================================================= //

type DepositFooterProps = {
  inputAmountError: SharedValue<InputAmountError>;
  isSubmitting: SharedValue<boolean>;
  onSubmit: () => Promise<void>;
};

export const DepositFooter = memo(function DepositFooter({ inputAmountError, isSubmitting, onSubmit }: DepositFooterProps) {
  return (
    <>
      <GasButtonWrapper />
      <Box height={32}>
        <Separator color="separatorTertiary" direction="vertical" thickness={1} />
      </Box>
      <SubmitButton inputAmountError={inputAmountError} isSubmitting={isSubmitting} onSubmit={onSubmit} />
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

// ============ Submit Button ================================================== //

type SubmitButtonProps = {
  inputAmountError: SharedValue<InputAmountError>;
  isSubmitting: SharedValue<boolean>;
  onSubmit: () => Promise<void>;
};

const SubmitButton = memo(function SubmitButton({ inputAmountError, isSubmitting, onSubmit }: SubmitButtonProps) {
  const { isDarkMode } = useColorMode();
  const { theme, useQuoteStore } = useDepositContext();
  const accentColor = getAccentColor(theme, isDarkMode);

  const quoteStatus = useStoreSharedValue(useQuoteStore, selectQuoteStatus);

  const label = useDerivedValue(() => {
    const inputError = inputAmountError.value;
    const status = quoteStatus.value;

    if (inputError === DepositQuoteStatus.ZeroAmountError) return translations.zeroAmount;
    if (inputError === DepositQuoteStatus.InsufficientBalance) return translations.overBalance;
    if (status === DepositQuoteStatus.InsufficientGas) return translations.insufficientGas;
    if (status === DepositQuoteStatus.Error || status === DepositQuoteStatus.InsufficientBalance) return translations.error;
    if (isSubmitting.value) return translations.loading;
    return translations.confirm;
  });

  const disabled = useDerivedValue(() => {
    if (isSubmitting.value) return true;
    if (inputAmountError.value !== null) return true;

    const status = quoteStatus.value;
    return status === null || status === DepositQuoteStatus.Error || status === DepositQuoteStatus.InsufficientGas;
  });

  return (
    <Box flexGrow={1}>
      <PerpsSwapButton accentColor={accentColor} disabled={disabled} label={label} onLongPress={onSubmit} />
    </Box>
  );
});

// ============ Selectors ====================================================== //

function selectQuoteStatus(state: InferStoreState<DepositQuoteStoreType>): QuoteStatus {
  const hasStoreError = !state.enabled && state.status !== 'loading' && state.getStatus('isError');
  if (hasStoreError) return DepositQuoteStatus.Error;

  const data = state.getData();
  if (data === null) return null;
  if (data === DepositQuoteStatus.InsufficientBalance) return DepositQuoteStatus.InsufficientBalance;
  if (data === DepositQuoteStatus.InsufficientGas) return DepositQuoteStatus.InsufficientGas;
  return DepositQuoteStatus.Success;
}
