import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { compose } from 'recompact';
import { GasSpeedButton } from '../components/gas';
import { Centered, Page } from '../components/layout';
import { withDataInit, withAccountData } from '../hoc';
import { colors, position } from '../styles';
import Example from '../components/Example';

class ExampleScreen extends PureComponent {
  static propTypes = {
    initializeWallet: PropTypes.func,
  };

  componentDidMount = async () => {
    try {
      await this.props.initializeWallet();
    } catch (error) {
      console.log('lol error on ExampleScreen like a n00b: ', error);
    }
  };

  render = () => (
    <Page
      {...position.centeredAsObject}
      {...position.sizeAsObject('100%')}
      color={colors.dark}
      flex={1}
    >
      {/*
        // haha you can put stuff here if you wanna test a component in isolation!
        // ... i dont want to set up storybook right now

      */}
      <Centered width="100%">
        <Example />
      </Centered>
    </Page>
  );
}

export default compose(withAccountData, withDataInit)(ExampleScreen);
