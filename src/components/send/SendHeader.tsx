import { isHexString } from '@ethersproject/bytes';
import { get, isEmpty, toLower } from 'lodash';
import React, { Fragment, useCallback, useMemo } from 'react';
import { ActivityIndicator, Keyboard } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../navigation/Navigation' was resolved ... Remove this comment to see the full error message
import { useNavigation } from '../../navigation/Navigation';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Divider' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Divider from '../Divider';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Spinner' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Spinner from '../Spinner';
import { ButtonPressAnimation } from '../animations';
import { PasteAddressButton } from '../buttons';
import { AddressField } from '../fields';
import { Row } from '../layout';
import { SheetHandleFixedToTop, SheetTitle } from '../sheet';
import { Label, Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { resolveNameOrAddress } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/emojiHandl... Remove this comment to see the full error message
import { removeFirstEmojiFromString } from '@rainbow-me/helpers/emojiHandler';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useClipboard, useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { padding } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { profileUtils, showActionSheetWithOptions } from '@rainbow-me/utils';

const AddressInputContainer = styled(Row).attrs({ align: 'center' })`
  ${({ isSmallPhone, isTinyPhone }) =>
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android
      ? padding(0, 19)
      : isTinyPhone
      ? padding(23, 15, 10)
      : isSmallPhone
      ? padding(11, 19, 15)
      : padding(18, 19, 19)};
  background-color: ${({ theme: { colors } }) => colors.white};
  overflow: hidden;
  width: 100%;
`;

const AddressFieldLabel = styled(Label).attrs({
  size: 'large',
  weight: 'bold',
})`
  color: ${({ theme: { colors } }) => colors.alpha(colors.blueGreyDark, 0.6)};
  margin-right: 4;
  opacity: 1;
`;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
const LoadingSpinner = styled(android ? Spinner : ActivityIndicator).attrs(
  ({ theme: { colors } }) => ({
    color: colors.alpha(colors.blueGreyDark, 0.3),
  })
)`
  margin-right: 2;
`;

const SendSheetTitle = styled(SheetTitle).attrs({
  weight: 'heavy',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-bottom: ${android ? -10 : 0};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  margin-top: ${android ? 10 : 17};
`;

const defaultContactItem = {
  address: '',
  color: null,
  nickname: '',
};

export default function SendHeader({
  contacts,
  hideDivider,
  isValidAddress,
  onChangeAddressInput,
  onFocus,
  onPressPaste,
  onRefocusInput,
  recipient,
  recipientFieldRef,
  removeContact,
  showAssetList,
  userAccounts,
  watchedAccounts,
}: any) {
  const { setClipboard } = useClipboard();
  const { isSmallPhone, isTinyPhone } = useDimensions();
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const contact = useMemo(() => {
    return get(contacts, `${[toLower(recipient)]}`, defaultContactItem);
  }, [contacts, recipient]);
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useState'.
  const [hexAddress, setHexAddress] = useState(null);

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useEffect'.
  useEffect(() => {
    if (isValidAddress && !contact.address) {
      resolveAndStoreAddress();
    } else {
      setHexAddress(null);
    }
    async function resolveAndStoreAddress() {
      const hex = await resolveNameOrAddress(recipient);
      if (!hex) {
        return;
      }
      setHexAddress(hex);
    }
  }, [isValidAddress, recipient, setHexAddress, contact]);

  const userWallet = useMemo(() => {
    return [...userAccounts, ...watchedAccounts].find(
      account => toLower(account.address) === toLower(recipient)
    );
  }, [recipient, userAccounts, watchedAccounts]);

  const handleNavigateToContact = useCallback(() => {
    let color = get(contact, 'color');
    let nickname = recipient;
    if (color !== 0 && !color) {
      const emoji = profileUtils.addressHashedEmoji(hexAddress);
      color = profileUtils.addressHashedColorIndex(hexAddress) || 0;
      nickname = isHexString(recipient) ? emoji : `${emoji} ${recipient}`;
    }

    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && Keyboard.dismiss();
    navigate(Routes.MODAL_SCREEN, {
      additionalPadding: true,
      address: isEmpty(contact.address) ? recipient : contact.address,
      color,
      contact: isEmpty(contact.address)
        ? { color, nickname, temporary: true }
        : contact,
      onRefocusInput,
      type: 'contact_profile',
    });
  }, [contact, hexAddress, navigate, onRefocusInput, recipient]);

  const handleOpenContactActionSheet = useCallback(async () => {
    return showActionSheetWithOptions(
      {
        cancelButtonIndex: 3,
        destructiveButtonIndex: 0,
        options: [
          'Delete Contact', // <-- destructiveButtonIndex
          'Edit Contact',
          'Copy Address',
          'Cancel', // <-- cancelButtonIndex
        ],
      },
      async (buttonIndex: any) => {
        if (buttonIndex === 0) {
          showActionSheetWithOptions(
            {
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              options: ['Delete Contact', 'Cancel'],
            },
            async (buttonIndex: any) => {
              if (buttonIndex === 0) {
                removeContact(recipient);
                onRefocusInput();
              } else {
                onRefocusInput();
              }
            }
          );
        } else if (buttonIndex === 1) {
          handleNavigateToContact();
          onRefocusInput();
        } else if (buttonIndex === 2) {
          setClipboard(recipient);
          onRefocusInput();
        }
      }
    );
  }, [
    handleNavigateToContact,
    onRefocusInput,
    recipient,
    removeContact,
    setClipboard,
  ]);

  const isPreExistingContact = (contact?.nickname?.length || 0) > 0;
  const name = useMemo(
    () =>
      userWallet?.label
        ? removeFirstEmojiFromString(userWallet.label)
        : removeFirstEmojiFromString(contact.nickname),
    [contact.nickname, userWallet?.label]
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SheetHandleFixedToTop />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      {isTinyPhone ? null : <SendSheetTitle>Send</SendSheetTitle>}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <AddressInputContainer
        isSmallPhone={isSmallPhone}
        isTinyPhone={isTinyPhone}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AddressFieldLabel>To:</AddressFieldLabel>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AddressField
          address={recipient}
          autoFocus={!showAssetList}
          name={name}
          onChange={onChangeAddressInput}
          onFocus={onFocus}
          ref={recipientFieldRef}
          testID="send-asset-form-field"
        />
        {isValidAddress &&
          !userWallet &&
          (hexAddress || !isEmpty(contact?.address)) && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ButtonPressAnimation
              onPress={
                isPreExistingContact
                  ? handleOpenContactActionSheet
                  : handleNavigateToContact
              }
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                align="right"
                color="appleBlue"
                size="large"
                style={{ paddingLeft: 4 }}
                testID={
                  isPreExistingContact
                    ? 'edit-contact-button'
                    : 'add-contact-button'
                }
                weight="heavy"
              >
                {isPreExistingContact ? '􀍡' : ' 􀉯 Save'}
              </Text>
            </ButtonPressAnimation>
          )}
        {isValidAddress && !hexAddress && isEmpty(contact?.address) && (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <LoadingSpinner />
        )}
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        {!isValidAddress && <PasteAddressButton onPress={onPressPaste} />}
      </AddressInputContainer>
      {hideDivider && !isTinyPhone ? null : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Divider color={colors.rowDividerExtraLight} flex={0} inset={[0, 19]} />
      )}
    </Fragment>
  );
}
