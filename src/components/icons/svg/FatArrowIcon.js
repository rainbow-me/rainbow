import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { withRotationForDirection } from '../../../hoc';
import { colors } from '../../../styles';
import Svg from '../Svg';

const FatArrowIcon = ({ color, ...props }) => (
  <Svg fill="none" height="19" width="16" viewBox="0 0 16 19" {...props}>
    <Path
      d="M8.17349 0C7.30065 0 6.70905 0.612545 6.70905 1.51448V12.4828L6.80604 14.5873L4.98276 12.4731L2.77155 10.2619C2.5 10 2.16056 9.80604 1.72414 9.80604C0.938578 9.80604 0.337285 10.3782 0.337285 11.2123C0.337285 11.5905 0.492457 11.9494 0.793104 12.2597L7.09698 18.5636C7.36854 18.8351 7.77586 19 8.17349 19C8.57112 19 8.97845 18.8351 9.25 18.5636L15.5442 12.2597C15.8448 11.9494 16 11.5905 16 11.2123C16 10.3782 15.3987 9.80604 14.6131 9.80604C14.1767 9.80604 13.8373 10 13.5754 10.2619L11.3642 12.4731L9.54095 14.5873L9.62823 12.4828V1.51448C9.62823 0.612545 9.04634 0 8.17349 0Z"
      fill={color}
    />
  </Svg>
);

FatArrowIcon.propTypes = {
  color: PropTypes.string,
};

FatArrowIcon.defaultProps = {
  color: colors.black,
};

export default withRotationForDirection(FatArrowIcon);
