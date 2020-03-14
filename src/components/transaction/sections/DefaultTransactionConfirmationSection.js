import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, mapProps, pure } from 'recompose';
import { colors } from '../../../styles';
import { Text, TruncatedAddress } from '../../text';
import TransactionMessage from '../TransactionMessage';
import TransactionSheet from '../TransactionSheet';
import TransactionRow from '../TransactionRow';

const DefaultTransactionConfirmationSection = ({
  address,
  data,
  sendButton,
  value,
}) => (
  <TransactionSheet sendButton={sendButton}>
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
          {value}
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

DefaultTransactionConfirmationSection.propTypes = {
  address: PropTypes.string,
  data: PropTypes.string,
  sendButton: PropTypes.object,
  value: PropTypes.string,
};

export default compose(
  mapProps(({ asset, ...props }) => ({
    ...props,
    ...asset,
  })),
  pure
)(DefaultTransactionConfirmationSection);
