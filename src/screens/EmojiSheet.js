import MaskedView from '@react-native-community/masked-view';
import React, { Component } from 'react';
import { StatusBar, View } from 'react-native';
import { getStatusBarHeight } from 'react-native-iphone-x-helper';
import Animated from 'react-native-reanimated';
import { withNavigation } from 'react-navigation';
import { compose, withHandlers, withProps } from 'recompact';
import styled from 'styled-components/primitives';
import EmojiSelector from '../components/EmojiSelector';
import { Centered, Column, ColumnWithMargins } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { withTransitionProps } from '../hoc';
import { borders, colors, padding } from '../styles';
import { deviceUtils, safeAreaInsetValues } from '../utils';

const statusBarHeight = getStatusBarHeight(true);
const sheetWidth = deviceUtils.dimensions.width - 30;
const Container = styled(Column)`
  background-color: ${colors.transparent};
  height: 100%;
`;

const SheetContainer = styled(Column)`
  align-self: center;
  border-radius: 20px;
  background-color: ${colors.white};
  height: 300px;
  margin-bottom: 160px;
  width: 100%;
`;

class EmojiSheet extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  render() {
    return (
      <Centered
        {...deviceUtils.dimensions}
        direction="column"
      >
        <TouchableBackdrop onPress={this.props.onPressBackground} />
        <SheetContainer>
          <ColumnWithMargins
            align="center"
            css={padding(8, 15, 15)}
            height={279}
            width="100%"
          >
            <EmojiSelector
              columns={8}
              showSearchBar={false}
            />
          </ColumnWithMargins>
        </SheetContainer>
      </Centered>
    );
  }
}

export default compose(
  withHandlers({
    onPressBackground: ({ navigation }) => () => navigation.goBack(),
  }),
  withNavigation
)(EmojiSheet);
