import { ButtonPressAnimation } from '@/components/animations';
import { SheetActionButton } from '@/components/sheet';
import { Box, Stack } from '@/design-system';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import * as i18n from '@/languages';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { swapMetadataStorage } from '@/raps/common';
import { SwapMetadata } from '@/raps/references';
import { SingleLineTransactionDetailsRow } from '@/screens/transaction-details/components/SingleLineTransactionDetailsRow';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import { shortenTxHashString } from '@/screens/transaction-details/helpers/shortenTxHashString';
import { useTheme } from '@/theme';
import { ethereumUtils, haptics } from '@/utils';
import { openInBrowser } from '@/utils/openInBrowser';
import Clipboard from '@react-native-clipboard/clipboard';
import startCase from 'lodash/startCase';
import React, { useCallback, useMemo } from 'react';
import { useWalletsStore } from '../../../redux/wallets';

type Props = {
  transaction: RainbowTransaction;
  presentToast?: () => void;
};

export const TransactionDetailsHashAndActionsSection: React.FC<Props> = ({ transaction, presentToast }) => {
  const { colors } = useTheme();
  const hash = useMemo(() => ethereumUtils.getHash(transaction), [transaction]);
  const { network, status, chainId } = transaction;
  const isReadOnly = useWalletsStore(state => state.getIsReadOnlyWallet());
  // Retry swap related data
  const retrySwapMetadata = useMemo(() => {
    const data = swapMetadataStorage.getString(hash ?? '');
    const wrappedData = data ? JSON.parse(data) : {};
    if (wrappedData?.type === 'swap') {
      return wrappedData.data as SwapMetadata;
    }
    return undefined;
  }, [hash]);

  const isRetrySwapButtonVisible = !isReadOnly && status === TransactionStatus.failed && !!retrySwapMetadata;

  const onRetrySwap = useCallback(() => {
    Navigation.handleAction(Routes.WALLET_SCREEN, {});

    // TODO: Add retry swap logic back for swaps
    Navigation.handleAction(Routes.SWAP, {});
  }, []);

  if (!hash || !network) {
    return null;
  }

  const onHashPress = () => {
    presentToast?.();
    haptics.notificationSuccess();
    Clipboard.setString(hash);
  };

  const formattedHash = shortenTxHashString(hash);

  const onViewOnBlockExplorerPress = () => {
    if (transaction.explorerUrl) {
      openInBrowser(transaction.explorerUrl);
    } else {
      ethereumUtils.openTransactionInBlockExplorer({ hash, chainId });
    }
  };

  return (
    <>
      <TransactionDetailsDivider />
      <Box paddingTop="8px" paddingBottom="20px">
        <Stack space="20px">
          {formattedHash && (
            <ButtonPressAnimation onPress={onHashPress} scaleTo={0.96}>
              <Box paddingVertical="12px">
                <SingleLineTransactionDetailsRow icon="􀆃" title={i18n.t(i18n.l.transaction_details.hash)} value={formattedHash} />
              </Box>
            </ButtonPressAnimation>
          )}
          {isRetrySwapButtonVisible && (
            <SheetActionButton
              color={colors.transparent}
              textColor={colors.appleBlue}
              onPress={onRetrySwap}
              label={i18n.t(i18n.l.transaction_details.try_again)}
              weight="heavy"
              isTransparent
            />
          )}
          <SheetActionButton
            color={colors.appleBlue}
            weight="heavy"
            onPress={onViewOnBlockExplorerPress}
            label={i18n.t(i18n.l.wallet.action.view_on, {
              blockExplorerName: transaction.explorerLabel ?? startCase(ethereumUtils.getBlockExplorer({ chainId: transaction.chainId })),
            })}
            lightShadows
          />
        </Stack>
      </Box>
    </>
  );
};
