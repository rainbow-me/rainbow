import lang from 'i18n-js';
import React, { useCallback, useMemo } from 'react';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import More from '../MoreButton/MoreButton';
import { useClipboard, useContacts } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { ethereumUtils } from '@rainbow-me/utils';
import { formatAddressForDisplay } from '@rainbow-me/utils/abbreviations';

const ACTIONS = {
  ADD_CONTACT: 'add-contact',
  COPY_ADDRESS: 'copy-address',
  ETHERSCAN: 'etherscan',
};

export default function MoreButton({ address }: { address?: string }) {
  const { navigate } = useNavigation();
  const { setClipboard } = useClipboard();
  const { contacts } = useContacts();

  const contact = useMemo(
    () => (address ? contacts[address.toLowerCase()] : undefined),
    [address, contacts]
  );

  const formattedAddress = useMemo(
    () => (address ? formatAddressForDisplay(address, 4, 4) : ''),
    [address]
  );

  const menuItems = useMemo(() => {
    return [
      {
        actionKey: ACTIONS.ADD_CONTACT,
        actionTitle: lang.t('profiles.search.add_to_contacts'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'person.text.rectangle',
        },
      },
      {
        actionKey: ACTIONS.COPY_ADDRESS,
        actionTitle: lang.t('profiles.search.copy_address'),
        discoverabilityTitle: formattedAddress,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'doc.on.doc',
        },
      },
      {
        actionKey: ACTIONS.ETHERSCAN,
        actionTitle: lang.t('profiles.search.view_on_etherscan'),
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'safari.fill',
        },
      },
    ] as any;
  }, [formattedAddress]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === ACTIONS.COPY_ADDRESS) {
        setClipboard(address);
      }
      if (address && actionKey === ACTIONS.ETHERSCAN) {
        ethereumUtils.openAddressInBlockExplorer(address);
      }
      if (actionKey === ACTIONS.ADD_CONTACT) {
        navigate(Routes.MODAL_SCREEN, {
          address,
          color: contact?.color,
          contact,
          type: 'contact_profile',
        });
      }
    },
    [address, contact, navigate, setClipboard]
  );

  return (
    <ContextMenuButton
      enableContextMenu
      menuConfig={{ menuItems, menuTitle: '' }}
      {...(android ? { onPress: () => {} } : {})}
      isMenuPrimaryAction
      onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
    >
      <More />
    </ContextMenuButton>
  );
}
