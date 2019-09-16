import PropTypes from 'prop-types';
import React from 'react';
import {
  InteractionManager,
  KeyboardAvoidingView,
  View,
  Keyboard,
} from 'react-native';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
import GraphemeSplitter from 'grapheme-splitter';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { Text } from 'react-primitives';
import styled from 'styled-components/primitives';
import { AssetPanel } from './asset-panel';
import FloatingPanels from './FloatingPanels';
import { withAccountData, withAccountSettings } from '../../hoc';
import { Input } from '../inputs';
import { colors, fonts } from '../../styles';
import { Button, CancelButton } from '../buttons';
import { TruncatedAddress } from '../text';
import { abbreviations, deviceUtils } from '../../utils';

import {
  addNewLocalContact,
  deleteLocalContact,
} from '../../handlers/commonStorage';
import { ButtonPressAnimation } from '../animations';
import CopyTooltip from '../CopyTooltip';
import { showActionSheetWithOptions } from '../../utils/actionsheet';

const TopMenu = styled(View)`
  justify-content: center;
  align-items: center;
  width: ${deviceUtils.dimensions.width - 110};
  padding: 24px;
`;

const Container = styled(View)`
  justify-content: center;
  align-items: center;
`;

const NameCircle = styled(View)`
  height: 60px;
  width: 60px;
  border-radius: 30px;
  margin-bottom: 19px;
`;

const FirstLetter = styled(Text)`
  width: 100%;
  text-align: center;
  line-height: 58px;
  font-size: 27px;
  color: #fff;
  padding-left: 1px;
  font-weight: 600;
`;

const AddressAbbreviation = styled(TruncatedAddress).attrs({
  align: 'center',
  color: colors.blueGreyDark,
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  size: 'lmedium',
  truncationLength: 4,
  weight: 'regular',
})`
  opacity: 0.6;
  width: 100%;
  margin-top: 9px;
  margin-bottom: 5px;
`;

const Divider = styled(View)`
  width: 93px;
  margin: 19px 0;
  height: 2px;
  opacity: 0.05;
  background-color: ${colors.blueGreyLigter};
`;

const Placeholder = styled(Text)`
  color: ${colors.blueGreyDark};
  font-size: ${fonts.size.big};
  font-weight: ${fonts.weight.semibold};
  opacity: 0.3;
  margin-bottom: -27px;
`;


class AddContactState extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      color: 0,
      value: '',
    };
  }

  componentDidMount = () => {
    const newState = {
      color: this.props.color,
      value: '',
    };
    if (this.props.contact.nickname) {
      newState.value = this.props.contact.nickname;
    }
    this.setState(newState);
  }

  format = (string) => (
    this.props.format
      ? this.props.format(string)
      : string
  )

  onChange = (event) => {
    const { nativeEvent } = event;
    let value = nativeEvent.text;
    if (value.charCodeAt(0) === 32) {
      value = value.substring(1);
    }
    this.setState({ value });
    this.props.onUnmountModal(value, this.state.color, true);
  }

  addContact = async () => {
    if (this.state.value.length > 0) {
      await addNewLocalContact(this.props.address, this.state.value, this.state.color);
      this.props.onCloseModal();
      this.props.navigation.goBack();
    }
  }

  onChangeColor = async () => {
    let newColor = this.state.color;
    newColor = ++newColor > colors.avatarColor.length - 1 ? 0 : newColor++;
    this.setState({ color: newColor });
    this.props.onUnmountModal(this.state.value, newColor, true);
  }

  onDeleteContact = () => {
    showActionSheetWithOptions({
      cancelButtonIndex: 1,
      destructiveButtonIndex: 0,
      options: [`Delete Contact`, 'Cancel'],
    }, async (buttonIndex) => {
      if (buttonIndex === 0) {
        this.props.onUnmountModal("", 0, false);
        await deleteLocalContact(this.props.address);
        this.props.onCloseModal();
        this.props.navigation.goBack();
      }
    });
  }

  render() {
    return <TouchableWithoutFeedback onPress={() => this.props.navigation.goBack()}>
      <KeyboardAvoidingView behavior="padding">
        <FloatingPanels>
          <Container>
            <TouchableWithoutFeedback>
              <AssetPanel>
                <TopMenu>
                  <ButtonPressAnimation onPress={this.onChangeColor} scaleTo={0.96}>
                    <NameCircle style={{ backgroundColor: colors.avatarColor[this.state.color] }}>
                      <FirstLetter>
                        {new GraphemeSplitter().splitGraphemes(this.state.value)[0]}
                      </FirstLetter>
                    </NameCircle>
                  </ButtonPressAnimation>
                  <Placeholder>
                    {this.state.value.length > 0 ? ' ' : 'Name'}
                  </Placeholder>
                  <Input
                    style={{ fontWeight: 600, width: `100%` }}
                    autoFocus={true}
                    color={colors.dark}
                    family={'SFProText'}
                    letterSpacing={'tightest'}
                    onChange={this.onChange}
                    size="big"
                    spellCheck="false"
                    textAlign={'center'}
                    value={this.state.value}
                    autoCapitalize
                    onSubmitEditing={this.addContact}
                    returnKeyType={'done'}
                  />
                  <ButtonPressAnimation scaleTo={1} onPress={() => Keyboard.dismiss()}>
                    <CopyTooltip textToCopy={this.props.address} tooltipText="Copy Address" waitForKeyboard>
                      <AddressAbbreviation address={this.props.address} />
                    </CopyTooltip>
                  </ButtonPressAnimation>
                  <Divider />
                  <Button
                    backgroundColor={this.state.value.length > 0 ? colors.appleBlue : undefined}
                    width={215}
                    showShadow
                    disabled={!this.state.value.length > 0}
                    onPress={this.addContact}
                  >
                    {this.props.contact ? `Done` : `Add Contact`}
                  </Button>
                  {!this.props.contact ?
                    <CancelButton
                      style={{ paddingTop: 11 }}
                      onPress={() => { 
                        this.props.onUnmountModal("", 0, false);
                        this.props.onCloseModal(); 
                        this.props.navigation.goBack() 
                      }}
                      text="Cancel"
                    /> :
                    <CancelButton
                      style={{ paddingTop: 11 }}
                      onPress={this.onDeleteContact}
                      text="Delete Contact"
                    />
                  }
                </TopMenu>
              </AssetPanel>
            </TouchableWithoutFeedback>
          </Container>
        </FloatingPanels>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  }
};

AddContactState.propTypes = {
  onPressSend: PropTypes.func,
  price: PropTypes.string,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default compose(
  withAccountData,
  withAccountSettings,
  withProps(({
    contact: {
      nickname,
      ...contact
    },
    address,
    color,
    assets,
    nativeCurrencySymbol,
  }) => { }),
  withHandlers({
    onPressSend: ({ navigation, asset: { address } }) => () => {
      navigation.goBack();

      InteractionManager.runAfterInteractions(() => {
        navigation.navigate('SendSheet', { asset: address });
      });
    },
  }),
  onlyUpdateForKeys(['price', 'subtitle']),
)(AddContactState);
