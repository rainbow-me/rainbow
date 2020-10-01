import React, { PureComponent } from 'react';
import { Text } from 'react-native';
import { Centered, Page } from '../components/layout';
import { colors, position } from '@rainbow-me/styles';

class ExampleScreen extends PureComponent {
  render = () => (
    <Page
      {...position.centeredAsObject}
      {...position.sizeAsObject('100%')}
      color={colors.dark}
      flex={1}
    >
      <Centered width="100%">
        <Text>Swap</Text>
      </Centered>
    </Page>
  );
}

export default ExampleScreen;
