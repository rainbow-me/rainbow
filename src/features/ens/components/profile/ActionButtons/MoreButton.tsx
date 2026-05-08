import React, { useCallback, useMemo } from 'react';
import { Keyboard, Platform, Share } from 'react-native';

import { showDeleteContactActionSheet } from '@/components/contacts';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import useClipboard from '@/hooks/useClipboard';
import useContacts from '@/hooks/useContacts';
import useWatchWallet from '@/hooks/useWatchWallet';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { RAINBOW_PROFILES_BASE_URL } from '@/references/constants';
import { ChainId } from '@/state/backendNetworks/types';
import { switchWallet } from '@/state/wallets/switchWallet';
import { useSelectedWallet } from '@/state/wallets/walletsStore';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import ethereumUtils from '@/utils/ethereumUtils';
import isLowerCaseMatch from '@/utils/isLowerCaseMatch';

import More from '../MoreButton';

const ACTIONS = {
  ADD_CONTACT: 'add-contact',
  COPY_ADDRESS: 'copy-address',
  ETHERSCAN: 'etherscan',
  OPEN_WALLET: 'open-wallet',
  REMOVE_CONTACT: 'remove-contact',
  SHARE: 'share',
};

export default function MoreButton({ address, ensName }: { address?: string; ensName?: string }) {
  const selectedWallet = useSelectedWallet();
  const { isWatching } = useWatchWallet({ address });
  const { navigate } = useNavigation();
  const { setClipboard } = useClipboard();
  const { contacts, onRemoveContact } = useContacts();
  const isSelectedWallet = useMemo(() => {
    if (!selectedWallet?.addresses) return false;

    const visibleWallet = selectedWallet.addresses.find(wallet => wallet.visible);
    return isLowerCaseMatch(visibleWallet?.address || '', address);
  }, [selectedWallet, address]);

  const contact = address ? contacts[address.toLowerCase()] : undefined;

  const formattedAddress = useMemo(() => (address ? formatAddressForDisplay(address, 4, 4) : ''), [address]);

  const menuItems = useMemo(() => {
    return [
      ...(isWatching
        ? [
            {
              actionKey: ACTIONS.OPEN_WALLET,
              actionTitle: i18n.t(i18n.l.profiles.details.open_wallet),
              icon: {
                iconType: 'SYSTEM',
                iconValue: 'iphone.and.arrow.forward',
              },
            },
          ]
        : []),
      {
        actionKey: ACTIONS.COPY_ADDRESS,
        actionTitle: i18n.t(i18n.l.profiles.details.copy_address),
        discoverabilityTitle: formattedAddress,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.on.square',
        },
      },
      contact
        ? {
            actionKey: ACTIONS.REMOVE_CONTACT,
            actionTitle: i18n.t(i18n.l.profiles.details.remove_from_contacts),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'person.crop.circle.badge.minus',
            },
          }
        : {
            actionKey: ACTIONS.ADD_CONTACT,
            actionTitle: i18n.t(i18n.l.profiles.details.add_to_contacts),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'person.crop.circle.badge.plus',
            },
          },
      {
        actionKey: ACTIONS.ETHERSCAN,
        actionTitle: i18n.t(i18n.l.profiles.details.view_on_etherscan),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'link',
        },
      },
      {
        actionKey: ACTIONS.SHARE,
        actionTitle: i18n.t(i18n.l.profiles.details.share),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.and.arrow.up',
        },
      },
    ].filter(Boolean);
  }, [isWatching, formattedAddress, contact]);

  const handlePressMenuItem = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    async ({ nativeEvent: { actionKey } }) => {
      if (actionKey === ACTIONS.OPEN_WALLET) {
        if (!isSelectedWallet) {
          switchWallet(address!);
        }
        navigate(Routes.WALLET_SCREEN);
      }
      if (actionKey === ACTIONS.COPY_ADDRESS) {
        setClipboard(address!);
      }
      if (address && actionKey === ACTIONS.ETHERSCAN) {
        ethereumUtils.openAddressInBlockExplorer({ address, chainId: ChainId.mainnet });
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
        Platform.OS === 'android' && Keyboard.dismiss();
      }
      if (actionKey === ACTIONS.SHARE) {
        const walletDisplay = ensName || address;
        const shareLink = `${RAINBOW_PROFILES_BASE_URL}/${walletDisplay}`;
        Share.share(Platform.OS === 'android' ? { message: shareLink } : { url: shareLink });
      }
    },
    [address, contact, ensName, isSelectedWallet, navigate, onRemoveContact, setClipboard]
  );

  const menuConfig = useMemo(() => ({ menuItems, ...(Platform.OS === 'ios' && { menuTitle: '' }) }), [menuItems]);
  return (
    <ContextMenuButton
      enableContextMenu
      menuConfig={menuConfig}
      {...(Platform.OS === 'android' ? { handlePressMenuItem } : {})}
      isMenuPrimaryAction
      onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
    >
      <More />
    </ContextMenuButton>
  );
}
