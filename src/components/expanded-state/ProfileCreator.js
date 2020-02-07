import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import { withAccountData, withAccountSettings } from '../../hoc';
import { colors, margin, padding } from '../../styles';
import { abbreviations, deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { Button } from '../buttons';
import { ContactAvatar } from '../contacts';
import { deleteUserInfo, editUserInfo } from '../../model/wallet';
import CopyTooltip from '../copy-tooltip';
import Divider from '../Divider';
import { Input } from '../inputs';
import { Centered, KeyboardFixedOpenLayout } from '../layout';
import { Text, TruncatedAddress } from '../text';
import TouchableBackdrop from '../TouchableBackdrop';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import { AssetPanel } from './asset-panel';
import store from '../../redux/store';
import FloatingPanels from './FloatingPanels';
import PlaceholderText from '../text/PlaceholderText';
import {
  settingsUpdateAccountName,
  settingsUpdateAccountColor,
} from '../../redux/settings';

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
    actionType: PropTypes.string,
    address: PropTypes.string,
    color: PropTypes.number,
    isCurrentProfile: PropTypes.bool,
    isNewProfile: PropTypes.bool,
    navigation: PropTypes.object,
    onCloseModal: PropTypes.func,
    onUnmountModal: PropTypes.func,
    profile: PropTypes.object,
  };

  constructor(props) {
    super(props);

    this.state = {
      color: this.props.isNewProfile
        ? Math.floor(Math.random() * colors.avatarColor.length)
        : this.props.profile.color,
      isCreatingWallet: false,
      value: get(this.props, 'profile.name', ''),
    };
  }

  componentDidMount = () => {
    if (this.state.value.length === 0) {
      this._text.updateValue('Name');
    }
  };

  inputRef = undefined;

  editProfile = async () => {
    if (this.state.value.length > 0) {
      const { address, privateKey, seedPhrase } = this.props.profile;
      await editUserInfo(
        this.state.value,
        this.state.color,
        seedPhrase,
        privateKey,
        address
      );
      if (this.props.isCurrentProfile) {
        store.dispatch(settingsUpdateAccountName(this.state.value));
        store.dispatch(settingsUpdateAccountColor(this.state.color));
      }
      this.props.onCloseModal({
        address,
        color: this.state.color,
        name: this.state.value,
        privateKey,
        seedPhrase,
      });
      this.props.navigation.goBack();
    }
  };

  addProfileInfo = async () => {
    this.props.navigation.goBack();
    if (this.props.setIsLoading) {
      this.props.setIsLoading(false);
    }
    await store.dispatch(settingsUpdateAccountName(this.state.value));
    await store.dispatch(settingsUpdateAccountColor(this.state.color));
    this.props.onCloseModal();
  };

  handleDeleteProfile = () => {
    showActionSheetWithOptions(
      {
        cancelButtonIndex: 1,
        destructiveButtonIndex: 0,
        message: `Are you sure that you want to delete this wallet?`,
        options: ['Delete Wallet', 'Cancel'],
      },
      async buttonIndex => {
        if (buttonIndex === 0) {
          this.props.navigation.goBack();
          await deleteUserInfo(this.props.address);
          const { address } = this.props.profile;
          this.props.onCloseModal({
            address,
            isDeleted: true,
          });
        }
      }
    );
  };

  handleCancel = () => {
    this.props.onUnmountModal('', 0, false);
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

  handleFocusInput = () => {
    if (this.inputRef) {
      this.inputRef.focus();
    }
  };

  handleInputRef = ref => {
    this.inputRef = ref;
  };

  render() {
    const { address } = this.props;
    const { color, value } = this.state;
    const acceptAction = this.props.isNewProfile
      ? this.addProfileInfo
      : this.editProfile;

    return (
      <KeyboardFixedOpenLayout>
        <TouchableBackdrop />
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
                autoCapitalize
                autoFocus
                letterSpacing="tightest"
                onChange={this.handleChange}
                onSubmitEditing={acceptAction}
                returnKeyType="done"
                size="big"
                spellCheck="false"
                ref={this.handleInputRef}
                style={{ width: '100%' }}
                textAlign="center"
                value={value}
                weight="semibold"
              />
              {this.props.isNewProfile || (
                <CopyTooltip
                  onHide={this.handleFocusInput}
                  textToCopy={address}
                  tooltipText="Copy Address"
                >
                  <AddressAbbreviation address={address} />
                </CopyTooltip>
              )}
              <Centered paddingVertical={19} width={93}>
                <Divider inset={false} />
              </Centered>
              <Button
                backgroundColor={
                  value.length > 0 ? colors.appleBlue : undefined
                }
                disabled={!value.length > 0}
                height={43}
                onPress={acceptAction}
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
                  {this.props.isNewProfile
                    ? `${this.props.actionType} Wallet`
                    : 'Done'}
                </Text>
              </Button>
              <ButtonPressAnimation
                marginTop={11}
                onPress={
                  this.props.isNewProfile || this.props.isCurrentProfile
                    ? this.handleCancel
                    : this.handleDeleteProfile
                }
              >
                <Centered backgroundColor={colors.white} css={padding(8, 9)}>
                  <Text
                    color={colors.alpha(colors.blueGreyDark, 0.4)}
                    size="lmedium"
                    weight="regular"
                  >
                    {this.props.isNewProfile || this.props.isCurrentProfile
                      ? 'Cancel'
                      : 'Delete Wallet'}
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

export default compose(withAccountData, withAccountSettings)(AddContactState);
