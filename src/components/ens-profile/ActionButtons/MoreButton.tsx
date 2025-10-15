import i18n from '@/languages';
import React, { useCallback, useMemo } from 'react';
import { Keyboard, Share } from 'react-native';
import { IS_ANDROID, IS_IOS } from '@/env';
import { showDeleteContactActionSheet } from '@/components/contacts';
import More from '../MoreButton/MoreButton';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { useClipboard, useContacts, useWatchWallet } from '@/hooks';
import { useSelectedWallet } from '@/state/wallets/walletsStore';
import { useNavigation } from '@/navigation';
import { RAINBOW_PROFILES_BASE_URL } from '@/references';
import Routes from '@/navigation/routesNames';
import { ethereumUtils, isLowerCaseMatch } from '@/utils';
import { formatAddressForDisplay } from '@/utils/abbreviations';
import { ChainId } from '@/state/backendNetworks/types';
import { switchWallet } from '@/state/wallets/switchWallet';

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
              actionTitle: i18n.profiles.details.open_wallet(),
              icon: {
                iconType: 'SYSTEM',
                iconValue: 'iphone.and.arrow.forward',
              },
            },
          ]
        : []),
      {
        actionKey: ACTIONS.COPY_ADDRESS,
        actionTitle: i18n.profiles.details.copy_address(),
        discoverabilityTitle: formattedAddress,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'square.on.square',
        },
      },
      contact
        ? {
            actionKey: ACTIONS.REMOVE_CONTACT,
            actionTitle: i18n.profiles.details.remove_from_contacts(),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'person.crop.circle.badge.minus',
            },
          }
        : {
            actionKey: ACTIONS.ADD_CONTACT,
            actionTitle: i18n.profiles.details.add_to_contacts(),
            icon: {
              iconType: 'SYSTEM',
              iconValue: 'person.crop.circle.badge.plus',
            },
          },
      {
        actionKey: ACTIONS.ETHERSCAN,
        actionTitle: i18n.profiles.details.view_on_etherscan(),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'link',
        },
      },
      {
        actionKey: ACTIONS.SHARE,
        actionTitle: i18n.profiles.details.share(),
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
        IS_ANDROID && Keyboard.dismiss();
      }
      if (actionKey === ACTIONS.SHARE) {
        const walletDisplay = ensName || address;
        const shareLink = `${RAINBOW_PROFILES_BASE_URL}/${walletDisplay}`;
        Share.share(IS_ANDROID ? { message: shareLink } : { url: shareLink });
      }
    },
    [address, contact, ensName, isSelectedWallet, navigate, onRemoveContact, setClipboard]
  );

  const menuConfig = useMemo(() => ({ menuItems, ...(IS_IOS && { menuTitle: '' }) }), [menuItems]);
  return (
    <ContextMenuButton
      enableContextMenu
      menuConfig={menuConfig}
      {...(IS_ANDROID ? { handlePressMenuItem } : {})}
      isMenuPrimaryAction
      onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
    >
      <More />
    </ContextMenuButton>
  );
}
