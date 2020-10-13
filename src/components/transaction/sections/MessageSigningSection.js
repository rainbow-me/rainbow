import lang from 'i18n-js';
import React from 'react';
import { pure } from 'recompact';
import TransactionMessage from '../TransactionMessage';
import TransactionRow from '../TransactionRow';
import TransactionSheet from '../TransactionSheet';

const MessageSigningSection = ({ message, method }) => (
  <TransactionSheet method={method}>
    <TransactionRow title={lang.t('wallet.message_signing.message')}>
      <TransactionMessage message={message} method={method} />
    </TransactionRow>
  </TransactionSheet>
);

export default pure(MessageSigningSection);
