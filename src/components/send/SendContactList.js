import { toLower } from 'lodash';
import React, { useCallback, useMemo, useRef } from 'react';
import { FlatList } from 'react-native-gesture-handler';
import { KeyboardArea } from 'react-native-keyboard-area';
import styled from 'styled-components/primitives';
import { useNavigation } from '../../navigation/Navigation';
import { FlyInAnimation } from '../animations';
import { SwipeableContactRow } from '../contacts';
import SendEmptyState from './SendEmptyState';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import { filterList } from '@rainbow-me/utils';

const KeyboardSizeView = styled(KeyboardArea)`
  background-color: ${colors.white};
`;

const rowHeight = 62;
const getItemLayout = (data, index) => ({
  index,
  length: rowHeight,
  offset: rowHeight * index,
});
const contentContainerStyle = { paddingBottom: 32 };
const keyExtractor = item => `SendContactList-${item.address}`;

const SendContactFlatList = styled(FlatList).attrs({
  alwaysBounceVertical: true,
  contentContainerStyle,
  directionalLockEnabled: true,
  getItemLayout,
  keyboardDismissMode: 'none',
  keyboardShouldPersistTaps: 'always',
  keyExtractor,
})`
  flex: 1;
`;

export default function SendContactList({
  contacts,
  currentInput,
  onPressContact,
  removeContact,
}) {
  const { navigate } = useNavigation();

  const contactRefs = useRef({});
  const touchedContact = useRef(undefined);

  const filteredContacts = useMemo(
    () => filterList(contacts, currentInput, ['nickname']),
    [contacts, currentInput]
  );

  const handleCloseAllDifferentContacts = useCallback(address => {
    if (touchedContact.current && contactRefs.current[touchedContact.current]) {
      contactRefs.current[touchedContact.current].close();
    }
    touchedContact.current = toLower(address);
  }, []);

  const handleEditContact = useCallback(
    ({ address, color, nickname }) => {
      navigate(Routes.MODAL_SCREEN, {
        additionalPadding: true,
        address,
        color,
        contact: { address, color, nickname },
        type: 'contact_profile',
      });
    },
    [navigate]
  );

  const renderItemCallback = useCallback(
    ({ item }) => (
      <SwipeableContactRow
        onPress={onPressContact}
        onSelectEdit={handleEditContact}
        onTouch={handleCloseAllDifferentContacts}
        ref={component => {
          contactRefs.current[toLower(item.address)] = component;
        }}
        removeContact={removeContact}
        {...item}
      />
    ),
    [
      handleCloseAllDifferentContacts,
      handleEditContact,
      onPressContact,
      removeContact,
    ]
  );

  return (
    <FlyInAnimation>
      {filteredContacts.length === 0 ? (
        <SendEmptyState />
      ) : (
        <SendContactFlatList
          data={filteredContacts}
          renderItem={renderItemCallback}
          testID="send-contact-list"
        />
      )}
      <KeyboardSizeView isOpen />
    </FlyInAnimation>
  );
}
