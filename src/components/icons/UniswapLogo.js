import React from 'react';
import styled from '@rainbow-me/styled';
import UniswapLogoImage from '../../assets/uniswap-logo.png';
import ImgixImage from '../images/ImgixImage';
import { Centered } from '../layout';

const Container = styled(Centered).attrs(({ theme: { colors } }) => ({
  backgroundColor: colors.purpleUniswap,
}))({});

const UniswapLogo = ({ imageStyle, ...props }) => (
  <Container {...props}>
    <ImgixImage source={UniswapLogoImage} style={imageStyle} />
  </Container>
);

export default UniswapLogo;
