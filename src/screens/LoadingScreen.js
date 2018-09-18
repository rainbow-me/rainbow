import { withSafeTimeout } from '@hocs/safe-timers';
import PropTypes from 'prop-types';
import React, { Fragment, PureComponent } from 'react';
import { StatusBar } from 'react-native';
import styled from 'styled-components/primitives';
import Icon from '../components/icons/Icon';
import { Column } from '../components/layout';
import { ErrorText, Monospace } from '../components/text';
import { loadAddress } from '../model/wallet';
import { colors, fonts, padding, position } from '../styles';

const Container = styled(Column).attrs({ justify: 'center' })`
  ${position.cover}
  ${padding(0, 0, 60, 0)}
`;

const ErrorContainer = styled(Column)`
  ${padding(0, 50, 0, 30)}
`;

const ErrorMessage = styled(Monospace).attrs({ color: 'red' })`
  line-height: ${fonts.lineHeight.loose};
  margin-top: 7;
`;

const LoadingColor = colors.alpha(colors.grey, 0.5);

const LoadingText = styled(Monospace)`
  line-height: ${fonts.lineHeight.loose};
  margin-top: 10;
`;

class LoadingScreen extends PureComponent {
  static propTypes = {
    navigation: PropTypes.object,
    setSafeTimeout: PropTypes.func,
  }

  constructor(props) {
    super(props);
    loadAddress().then(this.handleNavigation);
    this.state = { isError: false };
  }

  componentDidMount = () => this.props.setSafeTimeout(this.handleError, 5000)
  handleError = () => this.setState({ isError: true })

  // If this is a brand new instance of the Balance Wallet app show the 'IntroScreen',
  // otherwise display the main 'App' route. Afterwards this view will be
  // unmounted and thrown away.
  handleNavigation = address => this.props.navigation.navigate(address ? 'App' : 'Intro')

  render = () => (
    <Container align={this.state.isError ? 'start' : 'center'}>
      <StatusBar hidden />
      {this.state.isError ? (
        <ErrorContainer>
          <ErrorText color={colors.red} error="Error" />
          <ErrorMessage>There has been an error loading the wallet. Please kill the app and retry.</ErrorMessage>
        </ErrorContainer>
      ) : (
        <Fragment>
          <Icon color={LoadingColor} name="balanceLogo" />
          <LoadingText color={LoadingColor}>Loading</LoadingText>
        </Fragment>
      )}
    </Container>
  )
}

export default withSafeTimeout(LoadingScreen);
