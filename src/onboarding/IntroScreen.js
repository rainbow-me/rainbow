import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { AsyncStorage } from 'react-native';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../components/buttons';
import Icon from '../components/icons/Icon';
import { Column, Row } from '../components/layout';
import { Monospace } from '../components/text';
import { colors, fonts, padding } from '../styles';

const AlphaWarning = styled(Row).attrs({ align: 'center' })`
  margin-top: 37;
  margin-bottom: 7;
`;

const AlphaWarningText = styled(Monospace).attrs({
  color: 'orangeLight',
  size: 'lmedium',
  weight: 'medium',
})`
  line-height: 25;
`;

const Container = styled(Column).attrs({ align: 'start', justify: 'center' })`
  ${padding(0, 30)}
  background-color: ${colors.black};
  height: 100%;
`;

const Content = styled(Column)`
  margin-bottom: 10;
`;

const CreateWalletButton = styled.View`
  ${padding(14, 18, 17)}
  background-color: ${colors.teal};
  border-radius: 14;
  margin-top: 47;
`;

const CreateWalletButtonText = styled(Monospace).attrs({
  color: 'black',
  size: 'h5',
  weight: 'semibold',
})`
  line-height: 20;
`;

const Footer = styled(Monospace).attrs({
  size: 'h5',
  weight: 'medium',
})`
  bottom: 55;
  color: #2A2B30;
  left: 0;
  position: absolute;
  right: 0;
  text-align: center;
`;

const InstructionsText = styled(Monospace).attrs({
  color: 'white',
  size: 'lmedium',
})`
  color: ${colors.alpha(colors.white, 0.46)};
  line-height: 25;
  width: 315;
`;

const WarningIcon = styled(Icon).attrs({
  color: colors.orangeLight,
  name: 'warning',
})`
  margin-right: ${fonts.size.micro};
`;

export default class IntroScreen extends Component {
  static propTypes = {
    navigation: PropTypes.object,
  }

  handleCreateWallet = async () => {
    await AsyncStorage.setItem('isUserInitialized', 'true');
    this.props.navigation.navigate('WalletScreen');
  }

  render = () => (
    <Container>
      <Content>
        <Monospace
          color="white"
          size="big"
          weight="semibold"
        >
          Welcome to Balance
        </Monospace>
        <AlphaWarning>
          <WarningIcon />
          <AlphaWarningText>This is alpha software.</AlphaWarningText>
        </AlphaWarning>
        <InstructionsText>
          Please do not store more in your wallet than you are willing to lose.
        </InstructionsText>
        <Row>
          <ButtonPressAnimation onPress={this.handleCreateWallet}>
            <CreateWalletButton>
              <CreateWalletButtonText>
                Create a Wallet
              </CreateWalletButtonText>
            </CreateWalletButton>
          </ButtonPressAnimation>
        </Row>
      </Content>
      <Footer>Balance v0.01</Footer>
    </Container>
  )
}
