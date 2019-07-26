import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Page } from '../components/layout';
import { withHideSplashScreen } from '../hoc';
import { position } from '../styles';

class ExampleScreen extends PureComponent {
  static propTypes = {
    onHideSplashScreen: PropTypes.func,
  }

  componentDidMount = () => this.props.onHideSplashScreen()

  render = () => (
    <Page
      {...position.centeredAsObject}
      {...position.sizeAsObject('100%')}
      flex={1}
    >
      {/*
        // haha you can put stuff here if you wanna test a component in isolation!
        // ... i dont want to set up storybook right now

      */}
    </Page>
  )
}

export default withHideSplashScreen(ExampleScreen);
