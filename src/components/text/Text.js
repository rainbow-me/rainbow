import PropTypes from 'prop-types';
import { ViewPropTypes } from 'react-native';
import styled from 'styled-components/primitives';
import { buildTextStyles } from '@rainbow-me/styles';

const Text = styled.Text.attrs({ allowFontScaling: false })`
  ${buildTextStyles};
`;

Text.propTypes = {
  align: PropTypes.oneOf(['auto', 'center', 'left', 'justify', 'right']),
  color: PropTypes.string,
  family: PropTypes.string,
  isEmoji: PropTypes.bool,
  letterSpacing: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lineHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mono: PropTypes.bool,
  opacity: PropTypes.number,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  style: ViewPropTypes.style,
  uppercase: PropTypes.bool,
  weight: PropTypes.string,
};

export default Text;
