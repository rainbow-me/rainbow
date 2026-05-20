import React, { useCallback, useMemo } from 'react';

import Clipboard from '@react-native-clipboard/clipboard';
import { triggerHaptics } from 'react-native-turbo-haptics';

import { navigateToSwaps } from '@/__swaps__/screens/Swap/navigateToSwaps';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { SheetActionButton } from '@/components/sheet';
import { Box, Columns, Stack } from '@/design-system';
import { isAwaitingRelayTransactionHash, TransactionStatus, type RainbowTransaction } from '@/entities/transactions';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { swapMetadataStorage } from '@/raps/common';
import { type SwapMetadata } from '@/raps/references';
import { SingleLineTransactionDetailsRow } from '@/screens/transaction-details/components/SingleLineTransactionDetailsRow';
import { TransactionDetailsDivider } from '@/screens/transaction-details/components/TransactionDetailsDivider';
import { shortenTxHashString } from '@/screens/transaction-details/helpers/shortenTxHashString';
import { useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme/ThemeContext';
import ethereumUtils from '@/utils/ethereumUtils';
import { openInBrowser } from '@/utils/openInBrowser';

type Props = {
  transaction: RainbowTransaction;
  presentHashToast: () => void;
  presentLinkToast: () => void;
};

export const TransactionDetailsHashAndActionsSection: React.FC<Props> = ({ transaction, presentHashToast, presentLinkToast }) => {
  const { colors } = useTheme();
  const hash = useMemo(() => ethereumUtils.getHash(transaction), [transaction]);
  const { network, status, chainId } = transaction;
  const isReadOnly = useIsReadOnlyWallet();
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
    Navigation.handleAction(Routes.WALLET_SCREEN);

    // TODO: Add retry swap logic back for swaps
    navigateToSwaps();
  }, []);

  if (isAwaitingRelayTransactionHash(transaction) || !hash || !network) {
    return null;
  }

  const onHashPress = () => {
    presentHashToast();
    triggerHaptics('notificationSuccess');
    Clipboard.setString(hash);
  };

  const formattedHash = shortenTxHashString(hash);

  const explorerUrl = transaction.explorerUrl ?? ethereumUtils.getTransactionBlockExplorerUrl({ hash, chainId });

  const onCopyLinkPress = () => {
    if (!explorerUrl) return;
    presentLinkToast();
    triggerHaptics('notificationSuccess');
    Clipboard.setString(explorerUrl);
  };

  const onViewDetailsPress = () => {
    if (explorerUrl) openInBrowser(explorerUrl);
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
          <Columns space="8px">
            <SheetActionButton
              color={opacity(colors.appleBlue, 0.1)}
              textColor={colors.appleBlue}
              onPress={onCopyLinkPress}
              label={`􀐅 ${i18n.t(i18n.l.transaction_details.copy_link)}`}
              weight="heavy"
              isTransparent
              testID="copy-link"
            />
            <SheetActionButton
              color={colors.appleBlue}
              weight="heavy"
              onPress={onViewDetailsPress}
              label={i18n.t(i18n.l.transaction_details.view_details)}
              lightShadows
              testID="view-details"
            />
          </Columns>
        </Stack>
      </Box>
    </>
  );
};
