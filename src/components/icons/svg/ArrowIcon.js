import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { withRotationForDirection } from '../../../hoc';
import { colors } from '../../../styles';
import Svg from '../Svg';

const ArrowIcon = ({ color, fat, height, width, ...props }) => (
  <Svg height={height} width={width} {...props}>
    <Path
      d={
        fat
          ? 'M6.305 15c.703 0 1.18-.493 1.18-1.22V5.75l-.079-1.695 1.469 1.703 1.781 1.781c.219.211.492.367.844.367.633 0 1.117-.46 1.117-1.133 0-.304-.125-.593-.367-.843L7.172.852A1.257 1.257 0 006.305.5c-.32 0-.649.133-.867.352L.367 5.93C.124 6.18 0 6.469 0 6.773c0 .672.484 1.133 1.117 1.133.352 0 .625-.156.836-.367l1.781-1.781 1.47-1.703-.071 1.695v8.03c0 .727.469 1.22 1.172 1.22z'
          : 'M 4.21 10 C 4.424 10 4.643 9.911 4.789 9.765 L 8.179 6.375 C 8.341 6.208 8.425 6.015 8.425 5.811 C 8.425 5.363 8.101 5.055 7.679 5.055 C 7.444 5.055 7.261 5.159 7.115 5.3 L 5.926 6.489 L 4.945 7.627 L 4.997 6.495 L 4.997 0.814 C 4.997 0.329 4.679 0 4.21 0 C 3.74 0 3.427 0.329 3.427 0.814 L 3.427 6.495 L 3.474 7.627 L 2.493 6.489 L 1.304 5.3 C 1.163 5.159 0.981 5.055 0.746 5.055 C 0.323 5.055 0 5.363 0 5.811 C 0 6.015 0.083 6.208 0.245 6.375 L 3.631 9.765 C 3.777 9.911 3.996 10 4.21 10 Z'
      }
      fill={color}
      fillRule={fat ? 'nonzero' : undefined}
    />
  </Svg>
);

ArrowIcon.propTypes = {
  color: PropTypes.string,
  fat: PropTypes.bool,
  height: PropTypes.number,
  width: PropTypes.number,
};

ArrowIcon.defaultProps = {
  color: colors.black,
  height: 10,
  width: 10,
};

export default withRotationForDirection(ArrowIcon);
