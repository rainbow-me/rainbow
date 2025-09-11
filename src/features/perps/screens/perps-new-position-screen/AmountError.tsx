import { memo } from 'react';
import { Box, Inline, Text, TextIcon } from '@/design-system';
import { useOrderAmountValidation } from '@/features/perps/hooks/useOrderAmountValidation';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';

export const AmountInputError = memo(function AmountInputError() {
  const { isBelowMin, isAboveMax, minAmount, maxAmount } = useOrderAmountValidation();
  if (!isBelowMin && !isAboveMax) return null;

  const errorMessage = isBelowMin ? 'Minimum amount is ' : 'Maximum amount is ';
  const errorAmount = isBelowMin ? minAmount : maxAmount;

  return (
    <Box paddingTop={'12px'} paddingHorizontal={'8px'}>
      <Inline alignVertical="center" space={'6px'}>
        <TextIcon color="red" size="13pt" weight="bold">
          {'􀇿'}
        </TextIcon>
        <Text color="labelTertiary" size="15pt" weight="bold">
          {errorMessage}
          <Text color="labelSecondary" size="15pt" weight="heavy">
            {`${formatCurrency(errorAmount)}`}
          </Text>
        </Text>
      </Inline>
    </Box>
  );
});
