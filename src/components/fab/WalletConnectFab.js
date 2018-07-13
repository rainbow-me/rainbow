import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { withNavigation } from 'react-navigation';
import RadialGradient from 'react-native-radial-gradient';
import { compose, withHandlers } from 'recompose';
import styled from 'styled-components/primitives';
import { position } from '../../styles';
import Icon from '../icons/Icon';
import FloatingActionButton from './FloatingActionButton';

const GradientBackground = styled(RadialGradient)`
  ${position.cover}
`;

const WalletConnectIcon = styled(Icon)`
  margin-bottom: 2;
`;

const WalletConnectFab = ({ onPress, ...props }) => (
  <FloatingActionButton {...props} onPress={onPress}>
    {({ size }) => (
      <Fragment>
        <GradientBackground
          center={[0, (size / 2)]}
          colors={['#5D9DF6', '#006FFF']}
          radius={size}
        />
        <WalletConnectIcon name="walletConnect" />
      </Fragment>
    )}
  </FloatingActionButton>
);

WalletConnectFab.propTypes = {
  onPress: PropTypes.func,
};

export default compose(
  withNavigation,
  withHandlers({
    onPress: ({ navigation }) => () => navigation.navigate('QRScannerScreen'),
  }),
)(WalletConnectFab);
