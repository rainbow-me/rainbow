import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import styled from 'styled-components/primitives';
import Icon from '../components/icons/Icon';
import { Centered, Column } from '../components/layout';
import { Monospace } from '../components/text';
import { loadAddress } from '../model/wallet';
import { colors, padding, position } from '../styles';

const Container = styled(Centered)`
  ${position.cover}
  ${padding(40)}
`;

const ErrorText = styled(Monospace).attrs({ color: 'red' })`
  margin-top: 10;
  text-align: center;
`;

const Text = styled(Monospace).attrs({ color: 'grey' })`
  margin-bottom: 10;
`;

class LoadingScreen extends Component {
  static propTypes = {
    navigation: PropTypes.object,
  }

  constructor(props) {
    super(props);
    this.handleLoading();
    this.state = { isError: false };
  }

  errorTimeoutHandle = null

  componentDidMount = () => {
    this.errorTimeoutHandle = setTimeout(() => {
      this.setState({ isError: true });
      this.timerHandle = 0;
    }, 5000);
  }

  componentWillUnmount = () => {
    if (this.errorTimeoutHandle) {
      clearTimeout(this.errorTimeoutHandle);
      this.errorTimeoutHandle = 0;
    }
  }

  // If this is a brand new instance of the Balance Wallet app show the 'IntroScreen',
  // otherwise display the main 'App' route. Afterwards this view will be
  // unmounted and thrown away.
  handleLoading = () =>
    loadAddress().then(address => this.props.navigation.navigate(address ? 'App' : 'Intro'))

  render = () => (
    <Container>
      {this.state.isError ? (
        <Column align="center" justify="center">
          <Icon color={colors.red} name="warning" />
          <ErrorText>
            there has been an error loading the wallet. please kill the app and retry
          </ErrorText>
        </Column>
      ) : (
        <Text>loading...</Text>
      )}
    </Container>
  )
}

const reduxProps = ({ account: { accountAddress } }) => ({ accountAddress });
export default connect(reduxProps, null)(LoadingScreen);
