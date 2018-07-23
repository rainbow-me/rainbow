import PropTypes from 'prop-types';
import React from 'react';
import { omitProps } from 'recompact';
import SvgElement, { Path } from 'svgs';
import styled from 'styled-components/primitives';
import { calcDirectionToDegrees, colors } from '../../../styles';
import { directionPropType } from '../../../utils';

const Svg = styled(omitProps('direction')(SvgElement))`
  transform: rotate(${calcDirectionToDegrees}deg);
`;

const CaretIcon = ({ color, direction, ...props }) => (
  <Svg
    {...props}
    direction={direction}
    height="19"
    width="10"
    viewBox="0 0 10 19"
  >
    <Path
      d="M.329 16.877L7.039 9.5.328 2.123A1.24 1.24 0 0 1 .467.313a1.4 1.4 0 0 1 1.905.131l7.168 7.88a1.73 1.73 0 0 1 0 2.352l-7.168 7.88a1.4 1.4 0 0 1-1.905.131 1.24 1.24 0 0 1-.138-1.81z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

CaretIcon.propTypes = {
  color: PropTypes.string,
  direction: directionPropType,
};

CaretIcon.defaultProps = {
  color: colors.black,
  direction: 'right',
};

export default CaretIcon;
