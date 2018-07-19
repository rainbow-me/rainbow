import PropTypes from 'prop-types';
import React from 'react';
import Svg, { Path } from 'svgs';
import styled from 'styled-components/primitives';
import { calcDirectionToDegrees, colors } from '../../../styles';
import { directionPropType } from '../../../utils';

const SvgContainer = styled(Svg)`
  transform: rotate(${calcDirectionToDegrees}deg);
`;

const ArrowIcon = ({
  color,
  direction,
  height,
  width,
  ...props
}) => (
  <SvgContainer
    direction={direction}
    height={height}
    width={width}
  >
    <Path
      d="M5.614 4.186v1.92a.349.349 0 0 0 .552.278L9.554 3.56a.344.344 0 0 0 0-.562L6.166.174a.349.349 0 0 0-.552.278v1.922H1.41a.77.77 0 0 0-.77.77v.272c0 .425.345.77.77.77h4.204z"
      fill={color}
    />
  </SvgContainer>
);

ArrowIcon.propTypes = {
  color: PropTypes.string,
  direction: directionPropType,
  height: PropTypes.number,
  width: PropTypes.number,
};

ArrowIcon.defaultProps = {
  color: colors.black,
  height: 7,
  width: 10,
};

export default ArrowIcon;
