import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { compose, onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import { withAccountData, withAccountSettings, withContacts } from '../../hoc';
import { colors, margin, padding } from '../../styles';
import { abbreviations, deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Button } from '../buttons';
import { ContactAvatar, showDeleteContactActionSheet } from '../contacts';
import CopyTooltip from '../copy-tooltip';
import Divider from '../Divider';
import { Input } from '../inputs';
import { Centered, KeyboardFixedOpenLayout } from '../layout';
import { Text, TruncatedAddress } from '../text';
import TouchableBackdrop from '../TouchableBackdrop';
import { AssetPanel } from './asset-panel';
import FloatingPanels from './FloatingPanels';
import PlaceholderText from '../text/PlaceholderText';
import isNativeStackAvailable from '../../helpers/isNativeStackAvailable';

const nativeStackAdditionalPadding = 80;

const AddressAbbreviation = styled(TruncatedAddress).attrs({
  align: 'center',
  color: colors.blueGreyDark,
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  size: 'lmedium',
  truncationLength: 4,
  weight: 'regular',
})`
  ${margin(9, 0, 5)};
  opacity: 0.6;
  width: 100%;
`;

class AddContactState extends PureComponent {
  static propTypes = {
    address: PropTypes.string,
    color: PropTypes.number,
    contact: PropTypes.object,
    contactsAddOrUpdate: PropTypes.func,
    navigation: PropTypes.object,
    onCloseModal: PropTypes.func,
    onRefocusInput: PropTypes.func,
    removeContact: PropTypes.func,
  };

  state = {
    color: this.props.color || 0,
    value: get(this.props, 'contact.nickname', ''),
  };

  componentDidMount = () => {
    if (this.state.value.length === 0) {
      this._text.updateValue('Name');
    }
  };

  componentWillUnmount = () => {
    if (this.props.onRefocusInput) {
      this.props.onRefocusInput();
    }
  };

  inputRef = undefined;

  handleAddContact = async () => {
    const {
      address,
      contactsAddOrUpdate,
      navigation,
      onCloseModal,
    } = this.props;
    const { color, value } = this.state;

    if (value.length > 0) {
      contactsAddOrUpdate(address, value, color);
      if (onCloseModal) {
        onCloseModal();
      }
      navigation.goBack();
    }
  };

  handleCancel = () => {
    if (this.props.onCloseModal) {
      this.props.onCloseModal();
    }
    this.props.navigation.goBack();
  };

  handleChange = ({ nativeEvent: { text } }) => {
    const value = text.charCodeAt(0) === 32 ? text.substring(1) : text;
    if (value.length > 0) {
      this._text.updateValue(' ');
    } else {
      this._text.updateValue('Name');
    }
    this.setState({ value });
  };

  handleChangeColor = async () => {
    const { color } = this.state;

    let newColor = color + 1;
    if (newColor > colors.avatarColor.length - 1) {
      newColor = 0;
    }

    this.setState({ color: newColor });
  };

  handleDeleteContact = () =>
    showDeleteContactActionSheet({
      address: this.props.address,
      nickname: this.state.value,
      onDelete: this.handleCancel,
      removeContact: this.props.removeContact,
    });

  handleFocusInput = () => {
    if (this.inputRef) {
      this.inputRef.focus();
    }
  };

  handleInputRef = ref => {
    this.inputRef = ref;
  };

  render() {
    const { address, contact, navigation } = this.props;
    const { color, value } = this.state;

    const additionalPadding =
      navigation.dangerouslyGetParent().state.routeName ===
        'SendSheetNavigator' && isNativeStackAvailable
        ? nativeStackAdditionalPadding
        : 0;

    return (
      <KeyboardFixedOpenLayout additionalPadding={additionalPadding}>
        <TouchableBackdrop onPress={this.handleAddContact} />
        <FloatingPanels maxWidth={deviceUtils.dimensions.width - 110}>
          <AssetPanel>
            <Centered css={padding(24, 25)} direction="column">
              <ButtonPressAnimation
                onPress={this.handleChangeColor}
                scaleTo={0.96}
              >
                <ContactAvatar
                  color={color}
                  large
                  marginBottom={19}
                  value={value}
                />
              </ButtonPressAnimation>
              <PlaceholderText
                ref={component => {
                  this._text = component;
                }}
              />
              <Input
                autoCapitalize="words"
                autoFocus
                letterSpacing="roundedTight"
                onChange={this.handleChange}
                onSubmitEditing={this.handleAddContact}
                returnKeyType="done"
                size="big"
                spellCheck={false}
                ref={this.handleInputRef}
                style={{ width: '100%' }}
                textAlign="center"
                value={value}
                weight="bold"
              />
              <CopyTooltip
                onHide={this.handleFocusInput}
                textToCopy={address}
                tooltipText="Copy Address"
              >
                <AddressAbbreviation address={address} />
              </CopyTooltip>
              <Centered paddingVertical={19} width={93}>
                <Divider inset={false} />
              </Centered>
              <Button
                backgroundColor={
                  value.length > 0 ? colors.appleBlue : undefined
                }
                disabled={!value.length > 0}
                height={43}
                onPress={this.handleAddContact}
                showShadow
                size="small"
                width={215}
              >
                <Text
                  color="white"
                  size="lmedium"
                  style={{ marginBottom: 1.5 }}
                  weight="semibold"
                >
                  {contact ? 'Done' : 'Add Contact'}
                </Text>
              </Button>
              <ButtonPressAnimation
                marginTop={11}
                onPress={contact ? this.handleDeleteContact : this.handleCancel}
              >
                <Centered backgroundColor={colors.white} css={padding(8, 9)}>
                  <Text
                    color={colors.alpha(colors.blueGreyDark, 0.4)}
                    size="lmedium"
                    weight="regular"
                  >
                    {contact ? 'Delete Contact' : 'Cancel'}
                  </Text>
                </Centered>
              </ButtonPressAnimation>
            </Centered>
          </AssetPanel>
        </FloatingPanels>
      </KeyboardFixedOpenLayout>
    );
  }
}

export default compose(
  withAccountData,
  withAccountSettings,
  withContacts,
  onlyUpdateForKeys(['price', 'subtitle'])
)(AddContactState);
