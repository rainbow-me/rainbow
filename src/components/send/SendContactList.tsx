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
// @ts-expect-error ts-migrate(6142) FIXME: Module './SendEmptyState' was resolved to '/Users/... Remove this comment to see the full error message
import SendEmptyState from './SendEmptyState';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings, useKeyboardHeight } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { filterList } from '@rainbow-me/utils';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const KeyboardArea = styled.View`
  height: ${({ insets, keyboardHeight }: any) =>
    DeviceInfo.hasNotch() ? keyboardHeight : keyboardHeight - insets.top};
`;

const rowHeight = 59;
// @ts-expect-error ts-migrate(7006) FIXME: Parameter 'data' implicitly has an 'any' type.
const getItemLayout = (data, index) => ({
  index,
  length: rowHeight,
  offset: rowHeight * index,
});
const contentContainerStyle = { paddingBottom: 32, paddingTop: 7 };
const keyExtractor = (item: any) => `SendContactList-${item.address}`;

const SectionTitle = styled(Text).attrs({
  size: 'lmedium',
  weight: 'heavy',
})`
  color: ${({ theme: { colors } }) => colors.alpha(colors.blueGreyDark, 0.6)};
  margin-left: 19;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
}: any) {
  const { accountAddress } = useAccountSettings();
  const { navigate } = useNavigation();
  const insets = useSafeArea();
  const keyboardHeight = useKeyboardHeight();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { isDarkMode } = useTheme();

  const contactRefs = useRef({});
  const touchedContact = useRef(undefined);

  const filteredContacts = useMemo(
    () => filterList(contacts, currentInput, ['nickname']),
    [contacts, currentInput]
  );

  const handleCloseAllDifferentContacts = useCallback(address => {
    // @ts-expect-error ts-migrate(2538) FIXME: Type 'undefined' cannot be used as an index type.
    if (touchedContact.current && contactRefs.current[touchedContact.current]) {
      // @ts-expect-error ts-migrate(2538) FIXME: Type 'undefined' cannot be used as an index type.
      contactRefs.current[touchedContact.current].close?.();
    }
    // @ts-expect-error ts-migrate(2322) FIXME: Type 'string' is not assignable to type 'undefined... Remove this comment to see the full error message
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <ComponentToReturn
          accountType={section.id}
          onPress={onPressContact}
          onSelectEdit={handleEditContact}
          onTouch={handleCloseAllDifferentContacts}
          ref={(component: any) => {
            // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
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
          (account: any) =>
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
          (account: any) =>
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
      (account: any) =>
        !allAddresses?.includes(toChecksumAddress(account?.address))
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FlyInAnimation>
      {filteredContacts.length === 0 &&
      filteredAddresses.length === 0 &&
      ensSuggestions.length === 0 ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <SendEmptyState />
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <SendContactFlatList
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
          keyExtractor={(item: any, index: any) => index}
          renderItem={renderItemCallback}
          renderSectionHeader={({ section }) => (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <SectionWrapper>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <SectionTitle>{section.title}</SectionTitle>
            </SectionWrapper>
          )}
          sections={sections}
          testID="send-contact-list"
        />
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ToastPositionContainer
        bottom={
          DeviceInfo.hasNotch()
            ? keyboardHeight - SheetHandleFixedToTopHeight
            : keyboardHeight - SheetHandleFixedToTopHeight * 1.5
        }
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <InvalidPasteToast />
      </ToastPositionContainer>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <KeyboardArea insets={insets} keyboardHeight={keyboardHeight} />}
    </FlyInAnimation>
  );
}
