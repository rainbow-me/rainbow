import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const InboxIcon = ({ color, ...props }) => (
  <Svg height="17" width="16" viewBox="0 0 16 17" {...props}>
    <Path
      d="M3.85 8.287A.727.727 0 0 1 4.877 7.26l2.395 2.394V1.227a.728.728 0 0 1 1.454 0v8.426l2.395-2.394a.727.727 0 1 1 1.029 1.028l-3.637 3.636a.726.726 0 0 1-1.028 0L3.849 8.287zm11.423 2.395a.727.727 0 0 0-.728.727v2.91c0 .4-.317.726-.708.726H2.182a.728.728 0 0 1-.727-.727V11.41a.727.727 0 0 0-1.455 0v2.91a2.172 2.172 0 0 0 .64 1.542 2.175 2.175 0 0 0 1.542.639h11.655a2.132 2.132 0 0 0 1.533-.642 2.184 2.184 0 0 0 .63-1.54V11.41a.727.727 0 0 0-.727-.727z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

InboxIcon.propTypes = {
  color: PropTypes.string,
};

InboxIcon.defaultProps = {
  color: colors.appleBlue,
};

export default InboxIcon;
