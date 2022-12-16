import React from 'react';
import { Box, Stack } from '@/design-system';
import * as i18n from '@/languages';
import { TransactionDetailsAddressRow } from '@/screens/transaction-details/components/TransactionDetailsAddressRow';
import { Contact } from '@/redux/contacts';

type Props = {
  from?: string;
  to?: string;
  presentToast?: () => void;
  contacts: { [address: string]: Contact };
};

export const TransactionDetailsFromToSection: React.FC<Props> = ({
  from,
  to,
  presentToast,
  contacts,
}) => {
  if (!from && !to) {
    return null;
  }

  const fromContact = from ? contacts[from] : undefined;
  const toContact = to ? contacts[to] : undefined;

  return (
    <Box paddingVertical="10px">
      <Stack>
        {from && (
          <TransactionDetailsAddressRow
            onAddressCopied={presentToast}
            address={from}
            title={i18n.t(i18n.l.transaction_details.from)}
            contact={fromContact}
          />
        )}
        {to && (
          <TransactionDetailsAddressRow
            onAddressCopied={presentToast}
            address={to}
            title={i18n.t(i18n.l.transaction_details.to)}
            contact={toContact}
          />
        )}
      </Stack>
    </Box>
  );
};
