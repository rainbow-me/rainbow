import PropTypes from 'prop-types';
import React from 'react';
import { Image } from 'react-native';
import { mapProps } from 'recompose';
import styled from 'styled-components';
import { colors, position } from '../styles';

const TokenImageUrl = 'https://raw.githubusercontent.com/balance-io/tokens/master/images';

const Icon = styled(Image)`
  ${({ size }) => position.size(`${size}px`)}
  background-color: ${colors.white};
  border-radius: ${({ size }) => (size / 2)};
  resize-mode: contain;
`;

const CoinIcon = ({ address, size }) => (
  <Icon
    size={size}
    source={{ uri: `${TokenImageUrl}/${address}.png` }}
  />
);

CoinIcon.propTypes = {
  address: PropTypes.string,
  size: PropTypes.number.isRequired,
  symbol: PropTypes.string,
};

CoinIcon.defaultProps = {
  size: 48,
};

export default mapProps(({ address, symbol }) => ({
  address: (symbol === 'ETH') ? 'ethereum_1' : address,
}))(CoinIcon);
