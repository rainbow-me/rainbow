import lang from 'i18n-js';
import React from 'react';
import { Text, TruncatedAddress } from '../../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../TransactionRow' was resolved to '/Users... Remove this comment to see the full error message
import TransactionRow from '../TransactionRow';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../TransactionSheet' was resolved to '/Use... Remove this comment to see the full error message
import TransactionSheet from '../TransactionSheet';

export default function DefaultTransactionConfirmationSection({
  address,
  value = '0',
}: any) {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <TransactionSheet>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TransactionRow title={lang.t('wallet.action.to')}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <TruncatedAddress
          address={address}
          color={colors.alpha(colors.blueGreyDark, 0.6)}
          size="lmedium"
          truncationLength={15}
        />
      </TransactionRow>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TransactionRow title={lang.t('wallet.action.value')}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
