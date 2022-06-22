import React from 'react';
import UniswapLogoImage from '../../assets/uniswap-logo.png';
import TransformationImage from '../images/TransformationImage';
import { Centered } from '../layout';
import styled from '@rainbow-me/styled-components';

const Container = styled(Centered).attrs(({ theme: { colors } }) => ({
  backgroundColor: colors.purpleUniswap,
}))({});

const UniswapLogo = ({ imageStyle, ...props }) => (
  <Container {...props}>
    <TransformationImage source={UniswapLogoImage} style={imageStyle} />
  </Container>
);

export default UniswapLogo;
