import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import { StatusBar } from 'react-native';
import lang from 'i18n-js';
import { connect } from 'react-redux';
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
      this.errorTimeoutHandle = 0;
    }, 5000);
  }

  componentWillUnmount = () => {
    if (this.errorTimeoutHandle) {
      clearTimeout(this.errorTimeoutHandle);
      this.errorTimeoutHandle = 0;
    }
  }

  handleLoading = () => {
    const { navigation } = this.props;

    // If this is a brand new instance of the Balance Wallet app show the 'IntroScreen',
    // otherwise display the main 'App' route. Afterwards this view will be
    // unmounted and thrown away.
    loadAddress().then(address => navigation.navigate(address ? 'App' : 'Intro'));
  }

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

const reduxProps = ({ account: { accountAddress } }) => ({ accountAddress });
export default connect(reduxProps, null)(LoadingScreen);
