import lang from 'i18n-js';
import React from 'react';
import { compose, mapProps, pure } from 'recompact';
import { Text, TruncatedAddress } from '../../text';
import TransactionMessage from '../TransactionMessage';
import TransactionRow from '../TransactionRow';
import TransactionSheet from '../TransactionSheet';
import { colors } from '@rainbow-me/styles';

const DefaultTransactionConfirmationSection = ({ address, data, value }) => (
  <TransactionSheet>
    <TransactionRow title={lang.t('wallet.action.to')}>
      <TruncatedAddress
        address={address}
        color={colors.alpha(colors.blueGreyDark, 0.6)}
        size="lmedium"
        truncationLength={15}
      />
    </TransactionRow>
    {!!value && (
      <TransactionRow title={lang.t('wallet.action.value')}>
        <Text
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          size="lmedium"
          uppercase
        >
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

export default compose(
  mapProps(({ asset, ...props }) => ({
    ...props,
    ...asset,
  })),
  pure
)(DefaultTransactionConfirmationSection);
