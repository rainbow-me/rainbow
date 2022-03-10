import React, { useCallback, useMemo } from 'react';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import More from '../MoreButton/MoreButton';
import { useClipboard, useContacts } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { ethereumUtils } from '@rainbow-me/utils';
import { formatAddressForDisplay } from '@rainbow-me/utils/abbreviations';

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
        actionKey: 'add-contact',
        actionTitle: 'Add to Contacts',
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'person.text.rectangle',
        },
      },
      {
        actionKey: 'copy-address',
        actionTitle: 'Copy Address',
        discoverabilityTitle: formattedAddress,
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'doc.on.doc',
        },
      },
      {
        actionKey: 'etherscan',
        actionTitle: 'View on Etherscan',
        icon: {
          iconType: 'SYSTEM',
          iconValue: 'safari.fill',
        },
      },
    ] as any;
  }, [formattedAddress]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'copy-address') {
        setClipboard(address);
      }
      if (address && actionKey === 'etherscan') {
        ethereumUtils.openAddressInBlockExplorer(address);
      }
      if (actionKey === 'add-contact') {
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
