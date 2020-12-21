import lang from 'i18n-js';
import React from 'react';
import { Text, TruncatedAddress } from '../../text';
import TransactionMessage from '../TransactionMessage';
import TransactionRow from '../TransactionRow';
import TransactionSheet from '../TransactionSheet';
import { colors } from '@rainbow-me/styles';

export default function DefaultTransactionConfirmationSection({
  address,
  data,
  value,
}) {
  return (
    <TransactionSheet>
      <TransactionRow title={lang.t('wallet.action.to')}>
        <TruncatedAddress
          address={address}
          color={colors.blueGreyDark60}
          size="lmedium"
          truncationLength={15}
        />
      </TransactionRow>
      {!!value && (
        <TransactionRow title={lang.t('wallet.action.value')}>
          <Text color={colors.blueGreyDark60} size="lmedium" uppercase>
            {value} ETH
          </Text>
        </TransactionRow>
      )}
      {!!data && (
        <TransactionRow title={lang.t('wallet.action.input')}>
          <TransactionMessage message={data} />
        </TransactionRow>
      )}
    </TransactionSheet>
  );
}
