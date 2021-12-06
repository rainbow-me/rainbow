import { toChecksumAddress } from 'ethereumjs-util';
import { sortBy, toLower } from 'lodash';
import React, { useCallback, useMemo, useRef } from 'react';
import { SectionList } from 'react-native';
import * as DeviceInfo from 'react-native-device-info';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeArea } from 'react-native-safe-area-context';
import styled from 'styled-components';
import { FlyInAnimation } from '../animations';
import { ContactRow, SwipeableContactRow } from '../contacts';
import { SheetHandleFixedToTopHeight } from '../sheet';
import { Text } from '../text';
import { InvalidPasteToast, ToastPositionContainer } from '../toasts';
import SendEmptyState from './SendEmptyState';
import { useAccountSettings, useKeyboardHeight } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { filterList } from '@rainbow-me/utils';

const KeyboardArea = styled.View`
  height: ${({ insets, keyboardHeight }) =>
    DeviceInfo.hasNotch() ? keyboardHeight : keyboardHeight - insets.top};
`;

const rowHeight = 59;
const getItemLayout = (data, index) => ({
  index,
  length: rowHeight,
  offset: rowHeight * index,
});
const contentContainerStyle = { paddingBottom: 32, paddingTop: 7 };
const keyExtractor = item => `SendContactList-${item.address}`;

const SectionTitle = styled(Text).attrs({
  size: 'lmedium',
  weight: 'heavy',
})`
  color: ${({ theme: { colors } }) => colors.alpha(colors.blueGreyDark, 0.6)};
  margin-left: 19;
  margin-top: ${android ? 6 : 12};
`;
const SectionWrapper = styled(LinearGradient).attrs(
  ({ theme: { colors } }) => ({
    colors: [colors.white, colors.alpha(colors.white, 0)],
    end: { x: 0.5, y: 1 },
    locations: [0.55, 1],
    start: { x: 0.5, y: 0 },
  })
)`
  height: 40;
`;
const SendContactFlatList = styled(SectionList).attrs({
  alwaysBounceVertical: true,
  contentContainerStyle,
  directionalLockEnabled: true,
  getItemLayout,
  keyboardDismissMode: 'none',
  keyboardShouldPersistTaps: 'always',
  keyExtractor,
  marginTop: 0,
})`
  flex: 1;
`;

export default function SendContactList({
  contacts,
  currentInput,
  ensSuggestions,
  onPressContact,
  removeContact,
  userAccounts,
  watchedAccounts,
}) {
  const { accountAddress } = useAccountSettings();
  const { navigate } = useNavigation();
  const insets = useSafeArea();
  const keyboardHeight = useKeyboardHeight();
  const { isDarkMode } = useTheme();

  const contactRefs = useRef({});
  const touchedContact = useRef(undefined);

  const filteredContacts = useMemo(
    () => filterList(contacts, currentInput, ['nickname']),
    [contacts, currentInput]
  );

  const handleCloseAllDifferentContacts = useCallback(address => {
    if (touchedContact.current && contactRefs.current[touchedContact.current]) {
      contactRefs.current[touchedContact.current].close?.();
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
    ({ item, section }) => {
      const ComponentToReturn =
        section.id === 'contacts' ? SwipeableContactRow : ContactRow;
      return (
        <ComponentToReturn
          accountType={section.id}
          onPress={onPressContact}
          onSelectEdit={handleEditContact}
          onTouch={handleCloseAllDifferentContacts}
          ref={component => {
            contactRefs.current[toLower(item.address)] = component;
          }}
          removeContact={removeContact}
          {...item}
        />
      );
    },
    [
      handleCloseAllDifferentContacts,
      handleEditContact,
      onPressContact,
      removeContact,
    ]
  );

  const filteredAddresses = useMemo(() => {
    return sortBy(
      filterList(
        userAccounts.filter(
          account =>
            account.visible &&
            toLower(account.address) !== toLower(accountAddress)
        ),
        currentInput,
        ['label']
      ),
      ['index']
    );
  }, [accountAddress, currentInput, userAccounts]);

  const filteredWatchedAddresses = useMemo(() => {
    return sortBy(
      filterList(
        watchedAccounts.filter(
          account =>
            account.visible &&
            toLower(account.address) !== toLower(accountAddress)
        ),
        currentInput,
        ['label']
      ),
      ['index']
    );
  }, [accountAddress, currentInput, watchedAccounts]);

  const filteredEnsSuggestions = useMemo(() => {
    const ownedAddresses = filteredAddresses.map(account => account.address);
    const watchedAddresses = filteredWatchedAddresses.map(
      account => account.address
    );
    const allAddresses = [...ownedAddresses, ...watchedAddresses];
    return ensSuggestions.filter(
      account => !allAddresses?.includes(toChecksumAddress(account?.address))
    );
  }, [filteredAddresses, filteredWatchedAddresses, ensSuggestions]);

  const sections = useMemo(() => {
    const tmp = [];
    filteredContacts.length &&
      tmp.push({ data: filteredContacts, id: 'contacts', title: '􀉮 Contacts' });
    filteredAddresses.length &&
      tmp.push({
        data: filteredAddresses,
        id: 'accounts',
        title: '􀢲 My wallets',
      });
    filteredWatchedAddresses.length &&
      tmp.push({
        data: filteredWatchedAddresses,
        id: 'watching',
        title: `${isDarkMode ? '􀨭' : '􀦧'} Watching`,
      });
    filteredEnsSuggestions.length &&
      tmp.push({
        data: filteredEnsSuggestions,
        id: 'suggestions',
        title: '􀊫 Suggestions',
      });
    return tmp;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentInput,
    ensSuggestions,
    filteredAddresses,
    filteredContacts,
    isDarkMode,
  ]);

  return (
    <FlyInAnimation>
      {filteredContacts.length === 0 &&
      filteredAddresses.length === 0 &&
      ensSuggestions.length === 0 ? (
        <SendEmptyState />
      ) : (
        <SendContactFlatList
          keyExtractor={(item, index) => index}
          renderItem={renderItemCallback}
          renderSectionHeader={({ section }) => (
            <SectionWrapper>
              <SectionTitle>{section.title}</SectionTitle>
            </SectionWrapper>
          )}
          sections={sections}
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
      {ios && <KeyboardArea insets={insets} keyboardHeight={keyboardHeight} />}
    </FlyInAnimation>
  );
}
