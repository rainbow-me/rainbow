import { memo } from 'react';

import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { Box, Separator, useColorMode } from '@/design-system';
import { PerpsSwapButton } from '@/features/perps/components/PerpsSwapButton';
import { time } from '@/framework/core/utils/time';
import { useStableValue } from '@/hooks/useStableValue';
import { createDerivedStore } from '@/state/internal/createDerivedStore';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { type InferStoreState } from '@/state/internal/types';
import { DepositQuoteStatus, getAccentColor, type DepositQuoteStoreType } from '@/systems/funding/types';

import { useDepositContext } from '../../contexts/DepositContext';
import { GasButton } from './gas/GasButton';

// ============ Types ========================================================== //

type InputAmountError =
  | DepositQuoteStatus.BelowMinimum
  | DepositQuoteStatus.InsufficientBalance
  | DepositQuoteStatus.ZeroAmountError
  | null;

type QuoteStatus =
  | DepositQuoteStatus.Error
  | DepositQuoteStatus.InsufficientBalance
  | DepositQuoteStatus.InsufficientGas
  | DepositQuoteStatus.Success
  | null;

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
  const { config, depositActions, gasStores, useQuoteStore } = useDepositContext();
  const useCustomExecute = Boolean(config.execute);

  const isLoading = useStoreSharedValue(
    useStableValue(() =>
      createDerivedStore(
        $ => {
          const isGasLimitLoading = $(gasStores.useGasLimitStore, state => !state.getData() && state.status === 'loading');
          const isQuoteLoading = useCustomExecute ? false : $(useQuoteStore, state => state.status === 'loading');
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
  const { config, theme, useQuoteStore } = useDepositContext();
  const useCustomExecute = Boolean(config.execute);
  const SubmitButtonComponent = config.submitButtonComponent;
  const accentColor = getAccentColor(theme, isDarkMode);

  const quoteStatus = useStoreSharedValue(useQuoteStore, selectQuoteStatus);

  const configLabels = config.labels;
  const minAmountLabel = config.validation?.minAmount?.label;

  const label = useDerivedValue(() => {
    const inputError = inputAmountError.value;
    const status = quoteStatus.value;
    const labels = configLabels;

    if (inputError === DepositQuoteStatus.ZeroAmountError) return labels.confirmButtonZeroAmount;
    if (inputError === DepositQuoteStatus.BelowMinimum) return minAmountLabel ?? labels.confirmButtonZeroAmount;
    if (inputError === DepositQuoteStatus.InsufficientBalance) return labels.confirmButtonOverBalance;
    if (status === DepositQuoteStatus.InsufficientGas) return labels.insufficientGas;
    if (!useCustomExecute && (status === DepositQuoteStatus.Error || status === DepositQuoteStatus.InsufficientBalance)) {
      return labels.confirmButtonError;
    }
    if (isSubmitting.value) return labels.confirmButtonLoading;
    return labels.confirmButton;
  });

  const disabled = useDerivedValue(() => {
    if (isSubmitting.value) return true;
    if (inputAmountError.value !== null) return true;
    if (useCustomExecute) return false;

    const status = quoteStatus.value;
    return status === null || status === DepositQuoteStatus.Error || status === DepositQuoteStatus.InsufficientGas;
  });

  return (
    <Box flexGrow={1}>
      {SubmitButtonComponent ? (
        <SubmitButtonComponent disabled={disabled} isSubmitting={isSubmitting} label={label} onSubmit={onSubmit} />
      ) : (
        <PerpsSwapButton accentColor={accentColor} disabled={disabled} label={label} onLongPress={onSubmit} />
      )}
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
