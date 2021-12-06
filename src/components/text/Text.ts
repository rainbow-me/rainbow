import PropTypes from 'prop-types';
import { ViewPropTypes } from 'react-native';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { buildTextStyles } from '@rainbow-me/styles';

// @ts-expect-error ts-migrate(2551) FIXME: Property 'Text' does not exist on type 'StyledInte... Remove this comment to see the full error message
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
