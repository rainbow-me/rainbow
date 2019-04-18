import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { pure } from 'recompact';
import { deviceUtils } from '../../../utils';
import TransactionMessage from '../TransactionMessage';
import TransactionRow from '../TransactionRow';
import TransactionSheet from '../TransactionSheet';

const MessageSigningSection = ({ message, sendButton }) => (
  <TransactionSheet sendButton={sendButton}>
    <TransactionRow title={lang.t('wallet.message_signing.message')}>
      <TransactionMessage
        maxHeight={deviceUtils.isSmallPhone ? 100 : 250}
        message={message}
      />
    </TransactionRow>
  </TransactionSheet>
);

MessageSigningSection.propTypes = {
  message: PropTypes.string,
  sendButton: PropTypes.object,
};

export default pure(MessageSigningSection);
