import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { AsyncStorage } from 'react-native';
import styled from 'styled-components/primitives';
import Icon from '../components/icons/Icon';
import { Centered } from '../components/layout';
import { Monospace } from '../components/text';
import { colors, padding } from '../styles';

import { Transition } from 'react-navigation-fluid-transitions';

const Container = styled(Centered)`
  ${padding(0, 30)}
  background-color: ${colors.white};
  height: 100%;
`;

const Content = styled(Centered)`
  margin-bottom: 10;
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

export default class LoadingScreen extends Component {
  static propTypes = {
    navigation: PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.handleLoading();
  }

  handleLoading = async () => {
    const isUserInitialized = await AsyncStorage.getItem('isUserInitialized');

    // This will switch to the App screen or Auth screen and this loading
    // screen will be unmounted and thrown away.
    this.props.navigation.navigate('Intro'); //isUserInitialized ? 'App' : 'Intro'
  }

  render = () => (
    <Transition appear='bottom' disappear='bottom'>
    <Container>
      <Content>
        <Icon
          color={colors.lightGrey}
          name="balanceLogo"
        />
      </Content>
      <Footer>Balance v0.01</Footer>
    </Container>
    </Transition>
  )
}
