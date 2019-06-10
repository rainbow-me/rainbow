import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { WebView } from 'react-native-webview';
import { Transition } from 'react-navigation-fluid-transitions';
import FastImage from 'react-native-fast-image';
import { deviceUtils } from '../utils';
import { ButtonPressAnimation } from '../components/animations';

export const forYouBadgeWidth = deviceUtils.dimensions.width / 2 - 26;
export const forYouBadgeHeight = forYouBadgeWidth * (deviceUtils.dimensions.height / deviceUtils.dimensions.width);


const ForYouBadge = styled(FastImage)`
  height: 100%;
  width: 100%;
`;

const ForYouBadgeWebView = styled(View)`
  position: relative;
  overflow: hidden;
  height: ${forYouBadgeHeight};
  width: ${forYouBadgeWidth};
`;

/**
 * This component is a super dirty hack used for handling a fluid-transition issue.
 * Library in order to perform shared-transition needs to make a copy of a component which is shared.
 * If it's a WebView the website needs to be loaded again which takes some time for fetching and causes blinking.
 * As a workaround we make a copy of this view (as an image), load it to the Image component and then
 * start the animation. It makes a copy and then we come back to normal WebView displaying which is beneath the image.
 */
class WebViewWithImageReplacement extends React.Component {
  static propTypes = {
    onPress: PropTypes.func,
    sharedLabel: PropTypes.string,
  }

  wv = React.createRef()

  state = {
    cachedImage: null,
  }

  render() {
    return (
      <ButtonPressAnimation
        activeOpacity={0.5}
        onPress={() => {
          this.props.onPress();
          captureRef(this.wv.current)
            .then(
              uri => this.setState({
                cachedImage: uri,
              }, () => this.props.onPress()),
            );
          setImmediate(() => this.setState({ cachedImage: null }));
        }}
        scaleTo={0.96}
      >
        <ForYouBadgeWebView
          ref={this.wv}
        >
          <WebView
            source={{ uri: 'https://google.pl' }}
            style={[StyleSheet.absoluteFillObject, {
              /* Webview needs to conform full screen mode and then is resized */
              borderRadius: 16,
              height: deviceUtils.dimensions.height,
              transform: [
                { scaleX: forYouBadgeWidth / deviceUtils.dimensions.width },
                { scaleY: forYouBadgeHeight / deviceUtils.dimensions.height },
                { translateY: -forYouBadgeHeight * 1.5 },
                { translateX: -forYouBadgeWidth * 1.5 },
              ],
              width: deviceUtils.dimensions.width,
            }]}

          />
          {/* View for intercepting touches */}
          <View style={StyleSheet.absoluteFillObject}/>
          <Transition
            shared={this.props.sharedLabel}>
            <ForYouBadge
              style={{
                borderRadius: 16, // it need to be here for handling animation.
                display: this.state.cachedImage ? 'flex' : 'none',
              }}
              source={{ uri: this.state.cachedImage }}
            />
          </Transition>
        </ForYouBadgeWebView>
      </ButtonPressAnimation>
    );
  }
}

export default WebViewWithImageReplacement;
