import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import { Keyboard, Clipboard } from 'react-native';
import { withNavigation } from 'react-navigation';
import Divider from '../Divider';
import { AddressField } from '../fields';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Label } from '../text';
import { colors, padding } from '../../styles';
import { PasteAddressButton, AddContactButton } from '../buttons';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import { deleteLocalContact } from '../../handlers/commonStorage';

const AddressInputContainer = styled(Row).attrs({ align: 'center' })`
  ${padding(19, 15)}
  background-color: ${colors.white};
  overflow: hidden;
  width: 100%;
`;

const SendHeader = ({
  onChangeAddressInput,
  recipient,
  onPressPaste,
  isValidAddress,
  contacts,
  navigation,
  onUpdateContacts,
}) => {
  let contact = {
    address: '',
    color: 0,
    nickname: '',
  };
  if (contacts && contacts.length > 0) {
    for (let i = 0; i < contacts.length; i++) {
      if (recipient === contacts[i].address) {
        contact = contacts[i];
      }
    }
  }

  return (
    <Fragment>
      <Icon
        color={colors.sendScreen.grey}
        name="handle"
        style={{ height: 11, marginTop: 13 }}
      />
      <AddressInputContainer>
        <Label style={{ marginRight: 6, opacity: 0.45 }}>
          To:
        </Label>
        <AddressField
          address={recipient}
          autoFocus
          onChange={onChangeAddressInput}
          currentContact={contact}
          name={contact.nickname}
          contacts={contacts}
        />
        {isValidAddress && contact.nickname.length > 0
          && <AddContactButton edit onPress={() => {
            showActionSheetWithOptions({
              cancelButtonIndex: 3,
              destructiveButtonIndex: 0,
              options: ['Delete Contact', 'Edit Contact', 'Copy Address', 'Cancel'],
            }, async (buttonIndex) => {
              if (buttonIndex === 2) {
                Clipboard.setString(recipient);
              }
              if (buttonIndex === 1) {
                Keyboard.dismiss();
                navigation.navigate('ExpandedAssetScreen', {
                  address: recipient,
                  asset: [],
                  color: contact.color,
                  contact,
                  onCloseModal: onUpdateContacts,
                  type: 'contact',
                });
              }
              if (buttonIndex === 0) {
                await deleteLocalContact(recipient);
                onUpdateContacts();
              }
            });
          }} />
        }
        {isValidAddress && contact.nickname.length === 0
          && <AddContactButton onPress={() => {
            const contactColor = Math.floor(Math.random() * colors.avatarColor.length);
            Keyboard.dismiss();
            navigation.navigate('ExpandedAssetScreen', {
              address: recipient,
              asset: [],
              color: contactColor,
              contact: false,
              onCloseModal: onUpdateContacts,
              type: 'contact',
            });
          }} />
        }
        {!isValidAddress && <PasteAddressButton onPress={onPressPaste} />}
      </AddressInputContainer>
      <Divider
        color={colors.alpha(colors.blueGreyLight, 0.05)}
        flex={0}
        inset={false}
      />
    </Fragment>
  );
};

SendHeader.propTypes = {
  contacts: PropTypes.array,
  isValidAddress: PropTypes.bool,
  navigation: PropTypes.any,
  onChangeAddressInput: PropTypes.func,
  onPressPaste: PropTypes.func,
  onUpdateContacts: PropTypes.func,
  recipient: PropTypes.string,
};

export default compose(withNavigation)(SendHeader);
