import lang from 'i18n-js';
import React from 'react';
import { Text, TruncatedAddress } from '../../text';
import TransactionRow from '../TransactionRow';
import TransactionSheet from '../TransactionSheet';

export default function DefaultTransactionConfirmationSection({
  address,
  value = '0',
}) {
  const { colors } = useTheme();
  return (
    <TransactionSheet>
      <TransactionRow title={lang.t('wallet.action.to')}>
        <TruncatedAddress
          address={address}
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          size="lmedium"
          truncationLength={15}
        />
      </TransactionRow>
      <TransactionRow title={lang.t('wallet.action.value')}>
        <Text
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          size="lmedium"
          uppercase
        >
          {value} ETH
        </Text>
      </TransactionRow>
    </TransactionSheet>
  );
}
