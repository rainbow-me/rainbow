import React from 'react';
import { SingleLineTransactionDetailsRow } from '@/screens/transaction-details/components/SingleLineTransactionDetailsRow';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import { shortenTxHashString } from '@/screens/transaction-details/helpers/shortenTxHashString';
import { Network } from '@/helpers';
import { SheetActionButton } from '@/components/sheet';
import { ethereumUtils, haptics } from '@/utils';
import startCase from 'lodash/startCase';
import { Box, Stack } from '@/design-system';
import { useTheme } from '@/theme';
import * as i18n from '@/languages';
import { ButtonPressAnimation } from '@/components/animations';
import Clipboard from '@react-native-community/clipboard';

type Props = { hash?: string; network?: Network; presentToast?: () => void };

export const TransactionDetailsHashAndActionsSection: React.FC<Props> = ({
  hash,
  network,
  presentToast,
}) => {
  const { colors } = useTheme();

  if (!hash || !network) {
    return null;
  }

  const onHashPress = () => {
    presentToast?.();
    haptics.notificationSuccess();
    Clipboard.setString(hash);
  };

  const formattedHash = shortenTxHashString(hash);
  return (
    <>
      <TransactionDetailsDivider />
      <Box paddingTop="8px" paddingBottom="20px">
        <Stack space="20px">
          {formattedHash && (
            <ButtonPressAnimation onPress={onHashPress} scaleTo={0.96}>
              <Box paddingVertical="12px">
                <SingleLineTransactionDetailsRow
                  icon="􀆃"
                  title={i18n.t(i18n.l.transaction_details.hash)}
                  value={formattedHash}
                />
              </Box>
            </ButtonPressAnimation>
          )}
          <SheetActionButton
            color={colors.appleBlue}
            onPress={() => {
              ethereumUtils.openTransactionInBlockExplorer(hash, network);
            }}
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
