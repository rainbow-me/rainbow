import React from 'react';
import { Box, Stack } from '@/design-system';
import * as i18n from '@/languages';
import { TransactionDetailsAddressRow } from '@/screens/transaction-details/components/TransactionDetailsAddressRow';

type Props = { from?: string; to?: string; presentToast?: () => void };

export const TransactionDetailsFromToSection: React.FC<Props> = ({
  from,
  to,
  presentToast,
}) => {
  if (!from && !to) {
    return null;
  }

  return (
    <Box paddingVertical="10px">
      <Stack>
        {from && (
          <TransactionDetailsAddressRow
            onAddressCopied={presentToast}
            address={from}
            title={i18n.t(i18n.l.transaction_details.from)}
          />
        )}
        {to && (
          <TransactionDetailsAddressRow
            onAddressCopied={presentToast}
            address={to}
            title={i18n.t(i18n.l.transaction_details.to)}
          />
        )}
      </Stack>
    </Box>
  );
};
