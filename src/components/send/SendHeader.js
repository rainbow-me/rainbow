import { get, isEmpty, isNumber, toLower } from 'lodash';
import React, { Fragment, useCallback, useMemo } from 'react';
import styled from 'styled-components/primitives';
import { useNavigation } from '../../navigation/Navigation';
import Divider from '../Divider';
import { AddContactButton, PasteAddressButton } from '../buttons';
import { AddressField } from '../fields';
import { Icon } from '../icons';
import { Row } from '../layout';
import { SheetHandle as SheetHandleAndroid } from '../sheet';
import { Label } from '../text';
import { useClipboard, useDimensions } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { colors, padding } from '@rainbow-me/styles';
import { showActionSheetWithOptions } from '@rainbow-me/utils';

const AddressInputContainer = styled(Row).attrs({ align: 'center' })`
  ${({ isSmallPhone }) =>
    isSmallPhone
      ? padding(12, 15)
      : android
      ? padding(5, 15)
      : padding(19, 15)};
  background-color: ${colors.white};
  overflow: hidden;
  width: 100%;
`;

const AddressFieldLabel = styled(Label)`
  margin-right: 6;
  opacity: 0.45;
`;

const SheetHandle = android
  ? styled(SheetHandleAndroid)`
      margin-top: 6;
    `
  : styled(Icon).attrs({
      color: colors.sendScreen.grey,
      name: 'handle',
      testID: 'sheet-handle',
    })`
      height: 11;
      margin-top: 13;
    `;

const DefaultContactItem = {
  address: '',
  color: 0,
  nickname: '',
};

export default function SendHeader({
  contacts,
  isValidAddress,
  onChangeAddressInput,
  onFocus,
  onPressPaste,
  onRefocusInput,
  recipient,
  recipientFieldRef,
  removeContact,
  showAssetList,
}) {
  const { setClipboard } = useClipboard();
  const { isSmallPhone } = useDimensions();
  const { navigate } = useNavigation();

  const contact = useMemo(() => {
    return get(contacts, `${[toLower(recipient)]}`, DefaultContactItem);
  }, [contacts, recipient]);

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
  }, [contact, navigate, onRefocusInput, recipient]);

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

  return (
    <Fragment>
      <SheetHandle />
      <AddressInputContainer isSmallPhone={isSmallPhone}>
        <AddressFieldLabel>To:</AddressFieldLabel>
        <AddressField
          address={recipient}
          autoFocus={!showAssetList}
          name={contact.nickname}
          onChange={onChangeAddressInput}
          onFocus={onFocus}
          ref={recipientFieldRef}
          testID="send-asset-form-field"
        />
        {isValidAddress && (
          <AddContactButton
            edit={isPreExistingContact}
            onPress={
              isPreExistingContact
                ? handleOpenContactActionSheet
                : handleNavigateToContact
            }
          />
        )}
        {!isValidAddress && <PasteAddressButton onPress={onPressPaste} />}
      </AddressInputContainer>
      <Divider color={colors.rowDivider} flex={0} inset={false} />
    </Fragment>
  );
}
