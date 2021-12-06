import lang from 'i18n-js';
import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../TransactionMessage' was resolved to '/U... Remove this comment to see the full error message
import TransactionMessage from '../TransactionMessage';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../TransactionRow' was resolved to '/Users... Remove this comment to see the full error message
import TransactionRow from '../TransactionRow';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../TransactionSheet' was resolved to '/Use... Remove this comment to see the full error message
import TransactionSheet from '../TransactionSheet';

export default function MessageSigningSection({ message, method }: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TransactionSheet method={method}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TransactionRow title={lang.t('wallet.message_signing.message')}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <TransactionMessage message={message} method={method} />
      </TransactionRow>
    </TransactionSheet>
  );
}
