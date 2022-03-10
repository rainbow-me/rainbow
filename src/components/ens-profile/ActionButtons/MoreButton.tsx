import React, { useMemo } from 'react';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import More from '../MoreButton/MoreButton';
import { formatAddressForDisplay } from '@rainbow-me/utils/abbreviations';

export default function MoreButton({ address }: { address?: string }) {
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
        discoverabilityTitle: formatAddressForDisplay(address, 4, 4),
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
    ];
  }, [address]);

  return (
    <ContextMenuButton
      enableContextMenu
      menuConfig={{ menuItems, menuTitle: '' }}
      {...(android ? { onPress: () => {} } : {})}
      isMenuPrimaryAction
      // onPressMenuItem={handlePressMenuItem}
      useActionSheetFallback={false}
    >
      <More />
    </ContextMenuButton>
  );
}
