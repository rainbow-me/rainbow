import lang from 'i18n-js';
import React from 'react';
import { Text, TruncatedAddress } from '../../text';
import TransactionRow from '../TransactionRow';
import TransactionSheet from '../TransactionSheet';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

export default function DefaultTransactionConfirmationSection({
  address,
  value = '0',
}) {
  return (
    <TransactionSheet>
      <TransactionRow title={lang.t('wallet.action.to')}>
        <TruncatedAddress
          address={address}
          color={colors_NOT_REACTIVE.blueGreyDark60}
          size="lmedium"
          truncationLength={15}
        />
      </TransactionRow>
      <TransactionRow title={lang.t('wallet.action.value')}>
        <Text
          color={colors_NOT_REACTIVE.blueGreyDark60}
          size="lmedium"
          uppercase
        >
          {value} ETH
        </Text>
      </TransactionRow>
    </TransactionSheet>
  );
}
