import React from 'react';
import WalletConnectLogoImage from '../../assets/walletconnect-logo-blue.png';
import ImgixImage from '../images/ImgixImage';
import { Centered } from '../layout';

const WalletConnectLogo = ({ imageStyle, ...props }) => (
  <Centered {...props}>
    <ImgixImage source={WalletConnectLogoImage} style={imageStyle} />
  </Centered>
);

export default WalletConnectLogo;
