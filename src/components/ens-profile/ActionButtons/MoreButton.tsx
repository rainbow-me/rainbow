import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { Keyboard, Share } from 'react-native';
import { MenuActionConfig } from 'react-native-ios-context-menu';
import { showDeleteContactActionSheet } from '../../contacts';
import More from '../MoreButton/MoreButton';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { useClipboard, useContacts, useWallets, useWatchWallet } from '@/hooks';
import { useNavigation } from '@/navigation';
import { RAINBOW_PROFILES_BASE_URL } from '@/references';
import Routes from '@/navigation/routesNames';
import { ethereumUtils } from '@/utils';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import { Network } from '@/networks/types';

const ACTIONS = {
  ADD_CONTACT: 'add-contact',
  COPY_ADDRESS: 'copy-address',
  ETHERSCAN: 'etherscan',
  OPEN_WALLET: 'open-wallet',
  REMOVE_CONTACT: 'remove-contact',
  SHARE: 'share',
};

export default function MoreButton({ address, ensName }: { address?: string; ensName?: string }) {
  const { switchToWalletWithAddress, selectedWallet } = useWallets();
  const { isWatching } = useWatchWallet({ address });
  const { navigate } = useNavigation();
  const { setClipboard } = useClipboard();
  const { contacts, onRemoveContact } = useContacts();
  const {
    params: { setIsSearchModeEnabled },
  } = useRoute<any>();
  const isSelectedWallet = useMemo(() => {
    const visibleWallet = selectedWallet.addresses.find((wallet: { visible: boolean }) => wallet.visible);

    return visibleWallet.address.toLowerCase() === address?.toLowerCase();
  }, [selectedWallet.addresses, address]);

  const contact = address ? contacts[address.toLowerCase()] : undefined;

  const formattedAddress = useMemo(() => (address ? formatAddressForDisplay(address, 4, 4) : ''), [address]);

  const menuItems = useMemo(() => {
    return [
      isWatching && {
        actionKey: ACTIONS.OPEN_WALLET,
        actionTitle: lang.t('profiles.details.open_wallet'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'iphone.and.arrow.forward',
        },
      },
      {
        actionKey: ACTIONS.COPY_ADDRESS,
        actionTitle: lang.t('profiles.details.copy_address'),
        discoverabilityTitle: formattedAddress,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.on.square',
        },
      },
      contact
        ? {
            actionKey: ACTIONS.REMOVE_CONTACT,
            actionTitle: lang.t('profiles.details.remove_from_contacts'),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'person.crop.circle.badge.minus',
            },
          }
        : {
            actionKey: ACTIONS.ADD_CONTACT,
            actionTitle: lang.t('profiles.details.add_to_contacts'),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'person.crop.circle.badge.plus',
            },
          },
      {
        actionKey: ACTIONS.ETHERSCAN,
        actionTitle: lang.t('profiles.details.view_on_etherscan'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'link',
        },
      },
      {
        actionKey: ACTIONS.SHARE,
        actionTitle: lang.t('profiles.details.share'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.and.arrow.up',
        },
      },
    ].filter(Boolean) as MenuActionConfig[];
  }, [isWatching, formattedAddress, contact]);

  const handlePressMenuItem = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    async ({ nativeEvent: { actionKey } }) => {
      if (actionKey === ACTIONS.OPEN_WALLET) {
        if (!isSelectedWallet) {
          setIsSearchModeEnabled?.(false);
          switchToWalletWithAddress(address!);
        }
        navigate(Routes.WALLET_SCREEN);
      }
      if (actionKey === ACTIONS.COPY_ADDRESS) {
        setClipboard(address!);
      }
      if (address && actionKey === ACTIONS.ETHERSCAN) {
        ethereumUtils.openAddressInBlockExplorer(address, Network.mainnet);
      }
      if (actionKey === ACTIONS.ADD_CONTACT) {
        navigate(Routes.MODAL_SCREEN, {
          address,
          contact,
          ens: ensName,
          nickname: ensName,
          type: 'contact_profile',
        });
      }
      if (actionKey === ACTIONS.REMOVE_CONTACT) {
        showDeleteContactActionSheet({
          address,
          nickname: contact!.nickname,
          removeContact: onRemoveContact,
        });
        android && Keyboard.dismiss();
      }
      if (actionKey === ACTIONS.SHARE) {
        const walletDisplay = ensName || address;
        const shareLink = `${RAINBOW_PROFILES_BASE_URL}/${walletDisplay}`;
        Share.share(android ? { message: shareLink } : { url: shareLink });
      }
    },
    [
      address,
      contact,
      ensName,
      isSelectedWallet,
      navigate,
      onRemoveContact,
      setClipboard,
      setIsSearchModeEnabled,
      switchToWalletWithAddress,
    ]
  );

  const menuConfig = useMemo(() => ({ menuItems, ...(ios && { menuTitle: '' }) }), [menuItems]);
  return (
    <ContextMenuButton
      enableContextMenu
      menuConfig={menuConfig}
      {...(android ? { handlePressMenuItem } : {})}
      isMenuPrimaryAction
      onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
    >
      <More />
    </ContextMenuButton>
  );
}
