import React, { useMemo } from 'react';
import { Box, Stack } from '@/design-system';
import * as i18n from '@/languages';
import { TransactionDetailsAddressRow } from '@/screens/transaction-details/components/TransactionDetailsAddressRow';
import { useContacts, useUserAccounts } from '@/hooks';
import { isLowerCaseMatch } from '@/utils';

type Props = {
  from?: string;
  to?: string;
  presentToast?: () => void;
};

export const TransactionDetailsFromToSection: React.FC<Props> = ({
  from,
  to,
  presentToast,
}) => {
  const { contacts } = useContacts();
  const fromContact = from ? contacts[from] : undefined;
  const toContact = to ? contacts[to] : undefined;

  const { userAccounts, watchedAccounts } = useUserAccounts();

  const fromAccount = useMemo(() => {
    if (!from) {
      return undefined;
    } else {
      return (
        userAccounts.find(account => isLowerCaseMatch(account.address, from)) ??
        watchedAccounts.find(account => isLowerCaseMatch(account.address, from))
      );
    }
  }, [from]);
  const toAccount = useMemo(() => {
    if (!to) {
      return undefined;
    } else {
      return (
        userAccounts.find(account => isLowerCaseMatch(account.address, to)) ??
        watchedAccounts.find(account => isLowerCaseMatch(account.address, to))
      );
    }
  }, [to]);

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
            contact={fromContact}
            account={fromAccount}
          />
        )}
        {to && (
          <TransactionDetailsAddressRow
            onAddressCopied={presentToast}
            address={to}
            title={i18n.t(i18n.l.transaction_details.to)}
            contact={toContact}
            account={toAccount}
          />
        )}
      </Stack>
    </Box>
  );
};
