import React, { PureComponent } from 'react';
import { Text } from 'react-native';
import { Centered, Page } from '../components/layout';
import { darkModeThemeColors } from '../styles/colors';
import { position } from '@rainbow-me/styles';

class ExampleScreen extends PureComponent {
  render = () => (
    <Page
      {...position.centeredAsObject}
      {...position.sizeAsObject('100%')}
      color={darkModeThemeColors.dark}
      flex={1}
    >
      <Centered width="100%">
        <Text>Swap</Text>
      </Centered>
    </Page>
  );
}

export default ExampleScreen;
