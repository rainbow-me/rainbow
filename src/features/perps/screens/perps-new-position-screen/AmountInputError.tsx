import { memo } from 'react';
import { Box, Inline, Text, TextIcon } from '@/design-system';
import { useOrderAmountValidation } from '@/features/perps/stores/derived/useOrderAmountValidation';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { truncateToDecimals } from '@/safe-math/SafeMath';
import * as i18n from '@/languages';

export const AmountInputError = memo(function AmountInputError() {
  const { isBelowMin, isAboveMax, minAmount, maxAmount } = useOrderAmountValidation();
  if (!isBelowMin && !isAboveMax) return null;

  const errorMessage = isBelowMin ? i18n.t(i18n.l.perps.inputs.minimum_amount_is) : i18n.t(i18n.l.perps.inputs.maximum_amount_is);
  const errorAmount = isBelowMin ? minAmount : maxAmount;

  return (
    <Box paddingTop={'12px'} paddingHorizontal={'8px'}>
      <Inline alignVertical="center" space={'6px'}>
        <TextIcon color="red" size="13pt" weight="bold">
          {'􀇿'}
        </TextIcon>
        <Text color="labelTertiary" size="15pt" weight="bold">
          {`${errorMessage} `}
          <Text color="labelSecondary" size="15pt" weight="heavy">
            {`${formatCurrency(truncateToDecimals(errorAmount, 2))}`}
          </Text>
        </Text>
      </Inline>
    </Box>
  );
});
