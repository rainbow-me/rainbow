import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForKeys } from 'recompact';
import styled from 'styled-components/primitives';
import FastImage from 'react-native-fast-image';
import { Transition } from 'react-navigation-fluid-transitions';
import { WebView } from 'react-native-webview';
import { Centered } from '../components/layout';
import { colors, position } from '../styles';
import SimulatorFakeCameraImageSource from '../assets/simulator-fake-camera-image.jpg';


const Container = styled(Centered)`
  ${position.size('100%')};
  background-color: ${colors.black};
  overflow: hidden;
`;


const ForYouExpanded = ({
  navigation,
}) => (
  <Container direction="column">
    <Transition shared={navigation.state.params.fluidTargetName}>
      {navigation.state.params.website
        ? <WebView
          source={{ uri: navigation.state.params.website }}
          style={position.sizeAsObject('100%')}

        />
        : <FastImage
          source={SimulatorFakeCameraImageSource}
          style={position.sizeAsObject('100%')}
        />
      }
    </Transition>
  </Container>
);

ForYouExpanded.propTypes = {
  navigation: PropTypes.object,
};

ForYouExpanded.defaultProps = {
  showWalletConnectSheet: true,
};

export default ForYouExpanded;
