import lang from 'i18n-js';
import React from 'react';
import TransactionMessage from '../TransactionMessage';
import TransactionRow from '../TransactionRow';
import TransactionSheet from '../TransactionSheet';

export default function MessageSigningSection({ message, method }) {
  return (
    <TransactionSheet method={method}>
      <TransactionRow title={lang.t('wallet.message_signing.message')}>
        <TransactionMessage message={message} method={method} />
      </TransactionRow>
    </TransactionSheet>
  );
}
