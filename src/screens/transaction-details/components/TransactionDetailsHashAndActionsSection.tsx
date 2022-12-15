import React from 'react';
import { SingleLineTransactionDetailsRow } from '@/screens/transaction-details/components/SingleLineTransactionDetailsRow';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import { shortenTxHashString } from '@/screens/transaction-details/helpers/shortenTxHashString';
import { Network } from '@/helpers';
import { SheetActionButton } from '@/components/sheet';
import { ethereumUtils } from '@/utils';
import startCase from 'lodash/startCase';
import { Box, Stack } from '@/design-system';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';

type Props = { hash?: string; network?: Network };

export const TransactionDetailsHashAndActionsSection: React.FC<Props> = ({
  hash,
  network,
}) => {
  const { colors } = useTheme();

  if (!hash || !network) {
    return null;
  }

  const formattedHash = shortenTxHashString(hash);
  return (
    <>
      <TransactionDetailsDivider />
      <Box paddingVertical="20px">
        <Stack space="32px">
          {formattedHash && (
            <SingleLineTransactionDetailsRow
              icon="􀆃"
              title={i18n.t(i18n.l.transaction_details.hash)}
              value={formattedHash}
            />
          )}
          <SheetActionButton
            color={colors.appleBlue}
            onPress={() => {
              ethereumUtils.openTransactionInBlockExplorer(hash, network);
            }}
            // @ts-expect-error JS component
            label={i18n.t(i18n.l.wallet.action.view_on, {
              blockExplorerName: startCase(
                ethereumUtils.getBlockExplorer(network)
              ),
            })}
            lightShadows
          />
        </Stack>
      </Box>
    </>
  );
};
