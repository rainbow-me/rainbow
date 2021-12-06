import React, { PureComponent } from 'react';
import { Text } from 'react-native';
import { Centered, Page } from '../components/layout';
import { darkModeThemeColors } from '../styles/colors';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

class ExampleScreen extends PureComponent {
  render = () => (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Page
      {...position.centeredAsObject}
      {...position.sizeAsObject('100%')}
      color={darkModeThemeColors.dark}
      flex={1}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Centered width="100%">
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Text>Swap</Text>
      </Centered>
    </Page>
  );
}

export default ExampleScreen;
