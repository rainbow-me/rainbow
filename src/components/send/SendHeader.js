import { get, isEmpty, isNumber, toLower } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import styled from 'styled-components/primitives';
import { Keyboard, Clipboard } from 'react-native';
import { withNavigation } from 'react-navigation';
import { compose, withProps } from 'recompact';
import { withNeverRerender, withSelectedInput } from '../../hoc';
import { colors, padding } from '../../styles';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import { AddContactButton, PasteAddressButton } from '../buttons';
import Divider from '../Divider';
import { AddressField } from '../fields';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Label } from '../text';

const AddressInputContainer = styled(Row).attrs({ align: 'center' })`
  ${padding(19, 15)}
  background-color: ${colors.white};
  overflow: hidden;
  width: 100%;
`;

const SheetHandle = compose(
  withNeverRerender,
  withProps({
    color: colors.sendScreen.grey,
    height: 11,
    marginTop: 13,
    name: 'handle',
  })
)(Icon);

const contactPropType = PropTypes.shape({
  address: PropTypes.string,
  color: PropTypes.number,
  nickname: PropTypes.string,
  removeContact: PropTypes.func,
});

const DefaultContactItem = {
  address: '',
  color: 0,
  nickname: '',
};

const getContactForRecipient = ({ contacts, recipient }) => {
  let contact = DefaultContactItem;
  if (recipient && !isEmpty(contacts)) {
    contact = get(contacts, `${[toLower(recipient)]}`, DefaultContactItem);
  }

  return { contact };
};

const openConfirmDeleteContactActionSheet = handleSelection => {
  const config = {
    cancelButtonIndex: 1,
    destructiveButtonIndex: 0,
    options: ['Delete Contact', 'Cancel'],
  };
  return showActionSheetWithOptions(config, handleSelection);
};

const openContactActionSheet = handleSelection => {
  const config = {
    cancelButtonIndex: 3,
    destructiveButtonIndex: 0,
    options: [
      'Delete Contact', // <-- destructiveButtonIndex
      'Edit Contact',
      'Copy Address',
      'Cancel', // <-- cancelButtonIndex
    ],
  };
  return showActionSheetWithOptions(config, handleSelection);
};

class SendHeader extends PureComponent {
  static propTypes = {
    contact: contactPropType,
    isValidAddress: PropTypes.bool,
    navigation: PropTypes.any,
    onChangeAddressInput: PropTypes.func,
    onPressPaste: PropTypes.func,
    recipient: PropTypes.string,
    removeContact: PropTypes.func,
    selectedInputId: PropTypes.object,
    setSelectedInputId: PropTypes.func,
  };

  handleConfirmDeleteContactSelection = async buttonIndex => {
    const { removeContact, recipient } = this.props;
    if (buttonIndex === 0) {
      removeContact(recipient);
    }
  };

  handleContactActionSheetSelection = async buttonIndex => {
    if (buttonIndex === 0) {
      openConfirmDeleteContactActionSheet(
        this.handleConfirmDeleteContactSelection
      );
    } else if (buttonIndex === 1) {
      this.navigateToContact(this.props.contact);
    } else if (buttonIndex === 2) {
      Clipboard.setString(this.props.recipient);
    }
  };

  navigateToContact = (contact = {}) => {
    const { navigation, recipient } = this.props;
    const refocusCallback =
      this.props.selectedInputId &&
      this.props.selectedInputId.isFocused() &&
      this.props.selectedInputId.focus;

    let color = get(contact, 'color');
    if (!isNumber(color)) {
      color = Math.floor(Math.random() * colors.avatarColor.length);
    }

    Keyboard.dismiss();
    navigation.navigate('OverlayExpandedAssetScreen', {
      address: recipient,
      asset: {},
      color,
      contact: isEmpty(contact) ? false : contact,
      onRefocusInput: refocusCallback,
      type: 'contact',
    });
  };

  openActionSheet = () =>
    openContactActionSheet(this.handleContactActionSheetSelection);

  handleRef = ref => {
    this.input = ref;
  };

  onFocus = () => this.props.setSelectedInputId(this.input);

  onBlur = () => this.props.setSelectedInputId(null);

  render = () => {
    const {
      contact,
      isValidAddress,
      onChangeAddressInput,
      onPressPaste,
      recipient,
    } = this.props;

    const isPreExistingContact = contact.nickname.length > 0;

    return (
      <Fragment>
        <SheetHandle />
        <AddressInputContainer>
          <Label style={{ marginRight: 6, opacity: 0.45 }}>To:</Label>
          <AddressField
            address={recipient}
            autoFocus
            currentContact={contact}
            inputRef={this.handleRef}
            name={contact.nickname}
            onBlur={this.onBlur}
            onChange={onChangeAddressInput}
            onFocus={this.onFocus}
          />
          {isValidAddress && (
            <AddContactButton
              edit={isPreExistingContact}
              onPress={
                isPreExistingContact
                  ? this.openActionSheet
                  : this.navigateToContact
              }
            />
          )}
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
}

export default compose(
  withNavigation,
  withSelectedInput,
  withProps(getContactForRecipient)
)(SendHeader);
