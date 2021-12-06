import React from 'react';
import styled from 'styled-components';
import UniswapLogoImage from '../../assets/uniswap-logo.png';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../images/ImgixImage' was resolved to '/Us... Remove this comment to see the full error message
import ImgixImage from '../images/ImgixImage';
import { Centered } from '../layout';

const Container = styled(Centered).attrs(({ theme: { colors } }) => ({
  backgroundColor: colors.purpleUniswap,
}))``;

const UniswapLogo = ({ imageStyle, ...props }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Container {...props}>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <ImgixImage source={UniswapLogoImage} style={imageStyle} />
  </Container>
);

export default UniswapLogo;
