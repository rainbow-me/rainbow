import React, { Component } from 'react';
import { Image, KeyboardAvoidingView, Text, TextInput, View } from 'react-native';
import styled from 'styled-components/primitives';

import { Page, Flex } from '../components/layout';
import { Button } from '../components/buttons';
import { colors, fonts, padding, position } from '../styles';

const Container = styled(Page)`
  ${position.size('100%')}
  background-color: ${colors.white};
  align-items: center;
`;

const AddressInput = styled(TextInput)`
  flex-grow: 1;
  font-size: ${fonts.size.h5}
  font-family: ${fonts.family.SFMono};
  font-weight: ${fonts.weight.semibold};
  color: ${colors.brightRoyalBlue};
  margin-top: 1px;
`;

const AddressInputLabel = styled(Text)`
  color: ${colors.blueGreyDark};
  font-size: ${fonts.size.h5}
  font-family: ${fonts.family.SFMono};
  font-weight: ${fonts.weight.semibold};
  margin-right: 6px;
  opacity: 0.6;
`;

const AddressInputContainer = styled(Flex)`
  ${padding(45, 20)}
  padding-bottom: 20px;
  align-items: center;
`;

const AddressInputBottomBorder = styled(View)`
  background-color: ${colors.blueGreyLight};
  opacity: 0.05;
  width: 100%;
  height: 2px;
`;

const BackgroundImage = styled(Image)`
  height: 88px;
  width: 91px;
  margin-top: 130px;
`;

const BottomButton = styled(Button)`
  ${padding(0, 10)}
  background-color: ${colors.brightRoyalBlue};
  align-items: center;
  justify-content: center;
  height: 30px;
  margin-left: 10px;
`;

const BottomButtonContainer = styled(Flex)`
  ${padding(20, 20)}
  justify-content: flex-end;
  width: 100%;
`;

const BackgroundImageContainer = styled(Flex)`
  flex-grow: 1;
`;

const CameraIcon = styled(Image)`
  margin-top: -5px;
  height: 14px;
  width: 17px;
`;

export default class SendScreen extends Component {
  static propTypes = {

  };

  static defaultProps = {

  };

  constructor(props) {
    super(props);

    this.state = {
      address: '',
    };
  }

  onPressPaste = () => {

  };

  onPressCamera = () => {

  };

  render() {
    return (
      <KeyboardAvoidingView behavior="height">
        <Container showTopInset>
          <AddressInputContainer>
            <AddressInputLabel>To:</AddressInputLabel>
            <AddressInput placeholder="Ethereum Address: (0x...)" autoFocus />
          </AddressInputContainer>
          <AddressInputBottomBorder />
          <BackgroundImageContainer>
            <BackgroundImage source={require('../assets/send-background.png')} />
          </BackgroundImageContainer>
          <BottomButtonContainer>
            <BottomButton onPress={this.onPressPaste}>Paste</BottomButton>
            <BottomButton onPress={this.onPressCamera}><CameraIcon source={require('../assets/camera.png')} /></BottomButton>
          </BottomButtonContainer>
        </Container>
      </KeyboardAvoidingView>
    );
  }
}
