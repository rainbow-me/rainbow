import React from 'react';
import UniswapLogoImage from '../../assets/uniswap-logo.png';
import ImgixImage from '../images/ImgixImage';
import { Centered } from '../layout';
import styled from 'rainbowed-components';

const Container = styled(Centered).attrs(({ theme: { colors } }) => ({
  backgroundColor: colors.purpleUniswap,
}))({});

const UniswapLogo = ({ imageStyle, ...props }) => (
  <Container {...props}>
    <ImgixImage source={UniswapLogoImage} style={imageStyle} />
  </Container>
);

export default UniswapLogo;
