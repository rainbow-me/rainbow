import PropTypes from 'prop-types';
import React from 'react';
import { mapProps } from 'recompose';
import styled from 'styled-components/primitives';
import { borders, colors, position } from '../styles';
import { Centered } from './layout';

const TokenImageUrl = 'https://raw.githubusercontent.com/balance-io/tokens/master/images';

const Container = styled(Centered)`
  ${({ size }) => position.size(size)}
  background-color: ${colors.white};
  border-radius: ${({ size }) => (size / 2)};
  overflow: hidden;
`;

const ImageFallback = styled.Image`
  resize-mode: contain;
`;

const ImageFallbackContainer = styled(Centered)`
  ${position.size('100%')}
  border-color: ${borders.color};
  border-radius: ${({ size }) => (size / 2)};
  border-width: 2;
`;

const CoinIcon = ({ asset, size }) => {
  const imageFallback = (
    <ImageFallbackContainer size={size}>
      <ImageFallback
        source={{ uri: `${TokenImageUrl}/${asset}.png` }}
        style={position.sizeAsObject(size * 0.666)}
      />
    </ImageFallbackContainer>
  );

  return (
    <Container size={size}>
      {imageFallback}
    </Container>
  );
};

CoinIcon.propTypes = {
  asset: PropTypes.string,
  size: PropTypes.number.isRequired,
};

CoinIcon.defaultProps = {
  size: 48,
};

export default mapProps(({ asset }) => ({
  asset: '0xe41d2489571d322189246dafa5ebde1f4699f498', // (asset === 'ETH') ? 'ethereum_1' : asset,
}))(CoinIcon);
