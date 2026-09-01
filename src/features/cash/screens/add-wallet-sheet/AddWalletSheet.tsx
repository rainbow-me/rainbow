import React, { memo, useCallback } from 'react';

import { useFocusEffect, useRoute, type RouteProp } from '@react-navigation/native';

import { analytics } from '@/analytics';
import ContactAvatar from '@/components/contacts/ContactAvatar';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, Stack, Text } from '@/design-system';
import { CashActionButton } from '@/features/cash/components/CashActionButton';
import { cashBuyOrderActions } from '@/features/cash/stores/cashBuyOrderStore';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { useAccountProfileInfo, useIsHardwareWallet, useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import { formatAddressForDisplay } from '@/utils/abbreviations';

import { useWalletLinkFlow } from './useWalletLinkFlow';

function WalletAvatar() {
  const { accountSymbol, accountColor, accountImage } = useAccountProfileInfo();

  return accountImage ? (
    <ImageAvatar image={accountImage} size="lmedium" />
  ) : (
    <ContactAvatar color={accountColor} size="lmedium" value={accountSymbol} />
  );
}

function LinkDescription({ walletAddress }: { walletAddress: string }) {
  const address = formatAddressForDisplay(walletAddress, 4, 6);
  const [before, after] = i18n.t(i18n.l.cash.add_wallet.description, { address }).split(address);

  return (
    <Text color="labelQuaternary" size="17pt" weight="bold">
      {before}
      <Text color="labelTertiary" size="17pt" weight="bold">
        {address}
      </Text>
      {after}
    </Text>
  );
}

function UnsupportedWallet({ description, onDismiss }: { description: string; onDismiss: () => void }) {
  return (
    <Box paddingBottom="32px" paddingHorizontal="24px" paddingTop="52px">
      <Stack space="24px">
        <Stack space="24px">
          <Text align="center" color="label" size="22pt" weight="heavy">
            {i18n.t(i18n.l.cash.add_wallet.unsupported_title)}
          </Text>
          <Text align="center" color="labelTertiary" size="17pt" weight="semibold">
            {description}
          </Text>
        </Stack>
        <CashActionButton
          label={i18n.t(i18n.l.cash.add_wallet.cancel)}
          onPress={onDismiss}
          testID="cash-deposit-add-wallet-unsupported-dismiss"
        />
      </Stack>
    </Box>
  );
}

export const AddWalletSheet = memo(function AddWalletSheet() {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.CASH_ADD_WALLET_SHEET>>();
  const { walletAddress, cardId, depositAmount } = params;
  const { goBack } = useNavigation();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const isHardwareWallet = useIsHardwareWallet();

  const handleLinked = useCallback(() => {
    goBack();
    cashBuyOrderActions.submitBuyOrder({ cardId, depositAmount, walletAddress });
  }, [cardId, depositAmount, goBack, walletAddress]);

  const { state, confirm } = useWalletLinkFlow({ onLinked: handleLinked, walletAddress });
  const isUnsupportedWallet = isReadOnlyWallet || isHardwareWallet;

  useFocusEffect(
    useCallback(() => {
      // Only a wallet that can actually sign was prompted; counting the rest would read as drop-off.
      if (isUnsupportedWallet) return;
      analytics.track(analytics.event.cashWalletLinkPrompted);
    }, [isUnsupportedWallet])
  );

  if (isUnsupportedWallet) {
    return (
      <PanelSheet>
        <UnsupportedWallet
          description={i18n.t(isReadOnlyWallet ? i18n.l.cash.add_wallet.watching_description : i18n.l.cash.add_wallet.hardware_description)}
          onDismiss={goBack}
        />
      </PanelSheet>
    );
  }

  const isError = state === 'error';

  return (
    <PanelSheet showTapToDismiss={state !== 'linking' && state !== 'linked'}>
      <Box paddingBottom="20px" paddingHorizontal="20px" paddingTop="52px">
        <Stack space="32px">
          <Box paddingHorizontal="12px">
            <Stack space="16px">
              <WalletAvatar />
              <Stack space="16px">
                <Text color="label" size="26pt" weight="heavy">
                  {i18n.t(isError ? i18n.l.cash.add_wallet.error_title : i18n.l.cash.add_wallet.title)}
                </Text>
                <LinkDescription walletAddress={walletAddress} />
                {isError && (
                  <Text color="red" size="17pt" weight="bold">
                    {i18n.t(i18n.l.cash.add_wallet.error_description)}
                  </Text>
                )}
              </Stack>
            </Stack>
          </Box>
          <CashActionButton
            label={i18n.t(isError ? i18n.l.cash.add_wallet.retry : i18n.l.cash.add_wallet.confirm)}
            loading={state === 'linking' || state === 'linked'}
            onPress={confirm}
            testID="cash-deposit-add-wallet-confirm"
          />
        </Stack>
      </Box>
    </PanelSheet>
  );
});
