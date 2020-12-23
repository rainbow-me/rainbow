import { toLower } from 'lodash';
import React, { useCallback, useMemo, useRef } from 'react';
import DeviceInfo from 'react-native-device-info';
import { FlatList } from 'react-native-gesture-handler';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components/primitives';
import { FlyInAnimation } from '../animations';
import { SwipeableContactRow } from '../contacts';
import { SheetHandleFixedToTopHeight } from '../sheet';
import { InvalidPasteToast, ToastPositionContainer } from '../toasts';
import SendEmptyState from './SendEmptyState';
import { useKeyboardHeight } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { filterList } from '@rainbow-me/utils';

const KeyboardArea = styled.View`
  height: ${({ insets, keyboardHeight }) =>
    DeviceInfo.hasNotch() ? keyboardHeight : keyboardHeight - insets.top};
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
  const insets = useSafeArea();
  const keyboardHeight = useKeyboardHeight();

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
          marginTop={17}
          renderItem={renderItemCallback}
          testID="send-contact-list"
        />
      )}
      <ToastPositionContainer
        bottom={
          DeviceInfo.hasNotch()
            ? keyboardHeight - SheetHandleFixedToTopHeight
            : keyboardHeight - SheetHandleFixedToTopHeight * 1.5
        }
      >
        <InvalidPasteToast />
      </ToastPositionContainer>
      <KeyboardArea insets={insets} keyboardHeight={keyboardHeight} />
    </FlyInAnimation>
  );
}
