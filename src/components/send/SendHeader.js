import { get, isEmpty, isNumber, toLower } from 'lodash';
import React, { Fragment, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '../../navigation/Navigation';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { PasteAddressButton } from '../buttons';
import { AddressField } from '../fields';
import { Row } from '../layout';
import { SheetHandleFixedToTop, SheetTitle } from '../sheet';
import { Label, Text } from '../text';
import { removeFirstEmojiFromString } from '@rainbow-me/helpers/emojiHandler';
import { useClipboard, useDimensions } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { padding } from '@rainbow-me/styles';
import { showActionSheetWithOptions } from '@rainbow-me/utils';

const AddressInputContainer = styled(Row).attrs({ align: 'center' })`
  ${({ isSmallPhone, isTinyPhone }) =>
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

const SendSheetTitle = styled(SheetTitle).attrs({
  weight: 'heavy',
})`
  margin-bottom: ${android ? -10 : 0};
  margin-top: ${android ? 10 : 17};
`;

const DefaultContactItem = {
  address: '',
  color: 0,
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
}) {
  const { setClipboard } = useClipboard();
  const { isSmallPhone, isTinyPhone } = useDimensions();
  const { navigate } = useNavigation();
  const { colors } = useTheme();

  const contact = useMemo(() => {
    return get(contacts, `${[toLower(recipient)]}`, DefaultContactItem);
  }, [contacts, recipient]);

  const userWallet = useMemo(() => {
    return userAccounts.find(
      account => toLower(account.address) === toLower(recipient)
    );
  }, [recipient, userAccounts]);

  const handleNavigateToContact = useCallback(() => {
    let color = get(contact, 'color');
    if (!isNumber(color)) {
      color = colors.getRandomColor();
    }

    navigate(Routes.MODAL_SCREEN, {
      additionalPadding: true,
      address: recipient,
      color,
      contact: isEmpty(contact.address) ? false : contact,
      onRefocusInput,
      type: 'contact_profile',
    });
  }, [colors, contact, navigate, onRefocusInput, recipient]);

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
      async buttonIndex => {
        if (buttonIndex === 0) {
          showActionSheetWithOptions(
            {
              cancelButtonIndex: 1,
              destructiveButtonIndex: 0,
              options: ['Delete Contact', 'Cancel'],
            },
            async buttonIndex => {
              if (buttonIndex === 0) {
                removeContact(recipient);
              }
            }
          );
        } else if (buttonIndex === 1) {
          handleNavigateToContact();
        } else if (buttonIndex === 2) {
          setClipboard(recipient);
        }

        onRefocusInput();
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
        ? removeFirstEmojiFromString(userWallet.label).join('')
        : contact.nickname,
    [contact.nickname, userWallet?.label]
  );

  return (
    <Fragment>
      <SheetHandleFixedToTop />
      {isTinyPhone ? null : <SendSheetTitle>Send</SendSheetTitle>}
      <AddressInputContainer
        isSmallPhone={isSmallPhone}
        isTinyPhone={isTinyPhone}
      >
        <AddressFieldLabel>To:</AddressFieldLabel>
        <AddressField
          address={recipient}
          autoFocus={!showAssetList}
          name={name}
          onChange={onChangeAddressInput}
          onFocus={onFocus}
          ref={recipientFieldRef}
          testID="send-asset-form-field"
        />
        {isValidAddress && !userWallet && (
          <ButtonPressAnimation
            onPress={
              isPreExistingContact
                ? handleOpenContactActionSheet
                : handleNavigateToContact
            }
            testID={
              isPreExistingContact
                ? 'edit-contact-button'
                : 'add-contact-button'
            }
          >
            <Text
              align="right"
              color="appleBlue"
              size="large"
              style={{ paddingLeft: 4 }}
              weight="heavy"
            >
              {isPreExistingContact ? '􀍡' : '􀉯 Save'}
            </Text>
          </ButtonPressAnimation>
        )}
        {!isValidAddress && <PasteAddressButton onPress={onPressPaste} />}
      </AddressInputContainer>
      {hideDivider && !isTinyPhone ? null : (
        <Divider color={colors.rowDividerExtraLight} flex={0} inset={[0, 19]} />
      )}
    </Fragment>
  );
}
