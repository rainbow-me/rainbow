import React from 'react';
import { Box, Stack } from '@/design-system';
import * as i18n from '@/languages';
import { TransactionDetailsAddressRow } from '@/screens/transaction-details/components/TransactionDetailsAddressRow';

type Props = { from?: string; to?: string };

export const TransactionDetailsFromToSection: React.FC<Props> = ({
  from,
  to,
}) => {
  if (!from && !to) {
    return null;
  }

  return (
    <Box paddingVertical="20px">
      <Stack space="20px">
        {from && (
          <TransactionDetailsAddressRow
            address={from}
            title={i18n.t(i18n.l.transaction_details.from)}
          />
        )}
        {to && (
          <TransactionDetailsAddressRow
            address={to}
            title={i18n.t(i18n.l.transaction_details.to)}
          />
        )}
      </Stack>
    </Box>
  );
};
