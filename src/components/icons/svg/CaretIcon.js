import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { withRotationForDirection } from '../../../hoc';
import { colors } from '../../../styles';
import { directionPropType } from '../../../utils';
import Svg from '../Svg';

const CaretIcon = ({ color, size, ...props }) => (
  <Svg
    {...props}
    height={size ? (size * 20) / 9 : '20'}
    width={size || '9'}
    viewBox="0 0 9 20"
  >
    <Path
      d="M2.24494815,0.705401289 L8.30260563,8.06112823 C9.23008934,9.18735845 9.23008934,10.8127123 8.30260563,11.9389425 L2.24494815,19.2946694 C1.80608387,19.827576 1.01830791,19.9038124 0.485401289,19.4649481 C-0.0475053327,19.0260839 -0.123741716,18.2383079 0.31512256,17.7054013 L6.37278004,10.3496743 C6.5400312,10.1465836 6.5400312,9.85348706 6.37278004,9.65039637 L0.31512256,2.29466942 C-0.123741716,1.7617628 -0.0475053327,0.973986837 0.485401289,0.53512256 C1.01830791,0.0962582838 1.80608387,0.172494667 2.24494815,0.705401289 Z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

CaretIcon.propTypes = {
  color: PropTypes.string,
  direction: directionPropType,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

CaretIcon.defaultProps = {
  color: colors.dark,
};

export default withRotationForDirection(CaretIcon);
