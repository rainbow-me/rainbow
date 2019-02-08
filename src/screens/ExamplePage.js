import { withAccountAssets } from 'balance-common';
import { isSameDay } from 'date-fns';
import { get, join, map } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Piwik from 'react-native-matomo';
import { View } from 'react-primitives';
import { withNavigationFocus } from 'react-navigation';
import {
  compose,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import { AssetList } from '../components/asset-list';
import BlurOverlay from '../components/BlurOverlay';
import { HoldToAuthorizeButton, LongPressButton } from '../components/buttons';
import { FabWrapper } from '../components/fab';
import { CameraHeaderButton, Header, ProfileHeaderButton } from '../components/header';
import { Centered, FlexItem, Page } from '../components/layout';
import { Text } from '../components/text';
import buildWalletSectionsSelector from '../helpers/buildWalletSections';
import { getShowShitcoinsSetting, updateShowShitcoinsSetting } from '../model/localstorage';
import {
  withAccountRefresh,
  withAccountSettings,
  withBlurTransitionProps,
  withFetchingPrices,
  withIsWalletEmpty,
  withTrackingDate,
} from '../hoc';
import { padding, position } from '../styles';
import withStatusBarStyle from '../hoc/withStatusBarStyle';
import styled from 'styled-components/primitives';


const SendButton = styled(LongPressButton)`
  ${padding(18, 0)}
`;


export default class ExamplePage extends Component {

  render = () => {

    return (
      <Page style={{ flex: 1, ...position.sizeAsObject('100%') }}>
        <Centered
          css={`
            ${padding(15)};
            ${position.cover};
            flex: 0;
         `}
        >
          <FlexItem>
            <HoldToAuthorizeButton
              leftIconProps={{ name: 'faceid' }}
              onLongPress={this.onLongPressSend}
              onPress={this.onPressSend}
              onRelease={this.onReleaseSend}
            >
              Hold to Action
            </HoldToAuthorizeButton>
          </FlexItem>
        </Centered>
      </Page>
    );
  }
}
