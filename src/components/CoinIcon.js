import PropTypes from 'prop-types';
import { Image } from 'react-native';
import styled from 'styled-components';
import { colors, position } from '../styles';

const CoinIcon = styled(Image)`
  ${({ size }) => position.size(`${size}px`)}
  background-color: ${colors.black};
  border-radius: ${({ size }) => (size / 2)};
  resize-mode: contain;
`;

CoinIcon.propTypes = {
  size: PropTypes.number.isRequired,
};

CoinIcon.defaultProps = {
  size: 48,
};

export default CoinIcon;
