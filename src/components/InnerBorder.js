import PropTypes from 'prop-types';
import styled from 'styled-components/primitives';
import { colors, position } from '../styles';

const InnerBorder = styled.View`
  ${position.cover}
  border-color: ${({ color }) => color};
  border-radius: ${({ radius }) => radius};
  border-width: ${({ width }) => width};
`;

InnerBorder.propTypes = {
  color: PropTypes.string,
  radius: PropTypes.number,
  width: PropTypes.number,
};

InnerBorder.defaultProps = {
  color: colors.alpha(colors.black, 0.06),
  radius: 0,
  width: 0.5,
};

export default InnerBorder;
