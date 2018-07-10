import React, { Fragment } from 'react';
import RadialGradient from 'react-native-radial-gradient';
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

const WalletConnectFab = props => (
  <FloatingActionButton {...props}>
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

export default WalletConnectFab;
