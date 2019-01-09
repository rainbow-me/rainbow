import { withSafeTimeout } from '@hocs/safe-timers';
import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import { StatusBar } from 'react-native';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import Icon from '../components/icons/Icon';
import { Column } from '../components/layout';
import { ErrorText, Monospace } from '../components/text';
import { withHideSplashScreen } from '../hoc';
import { colors, fonts, padding, position } from '../styles';

const Container = styled(Column).attrs({ justify: 'center' })`
  ${padding(0, 0, 60, 0)}
  ${position.cover}
`;

const ErrorContainer = styled(Column)`
  ${padding(0, 50, 0, 30)}
`;

const ErrorMessage = styled(Monospace).attrs({ color: 'red' })`
  line-height: ${fonts.lineHeight.looser};
  margin-top: 7;
`;

const LoadingColor = colors.alpha(colors.grey, 0.5);

const LoadingText = styled(Monospace)`
  line-height: ${fonts.lineHeight.looser};
  margin-top: 10;
`;

class LoadingScreen extends Component {
  static propTypes = {
    screenProps: PropTypes.objectOf({
      handleWalletConfig: PropTypes.func,
    }),
    onHideSplashScreen: PropTypes.func,
    navigation: PropTypes.object,
    setSafeTimeout: PropTypes.func,
  }

  state = { isError: false }

  componentDidMount = async () => {
    // After 10 seconds, show error message if user has not been redirected
    this.props.setSafeTimeout(this.handleError, 10000);
    await this.props.screenProps.handleWalletConfig();
    await this.handleNavigation();
    this.props.onHideSplashScreen();
  }

  handleError = () => this.setState({ isError: true })

  handleNavigation = async () => this.props.navigation.navigate('App')

  render = () => (
    <Container align={this.state.isError ? 'start' : 'center'}>
      <StatusBar hidden />
      {this.state.isError ? (
        <ErrorContainer>
          <ErrorText color={colors.red} error="Error" />
          <ErrorMessage>{lang.t('wallet.loading.error')}</ErrorMessage>
        </ErrorContainer>
      ) : (
        <Fragment>
          <Icon color={LoadingColor} name="balanceLogo" />
          <LoadingText color={LoadingColor}>{lang.t('wallet.loading.message')}</LoadingText>
        </Fragment>
      )}
    </Container>
  )
}

export default compose(
  withHideSplashScreen,
  withSafeTimeout,
)(LoadingScreen);
