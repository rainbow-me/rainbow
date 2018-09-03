import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const CloseIcon = ({ color, ...props }) => (
  <Svg height="30" width="30" viewBox="0 0 32 32" {...props}>
    <Path
      d="M31.384 31.387a2 2 0 0 1-2.828 0l-12.588-12.58L3.392 31.375a2 2 0 0 1-2.82-.008 1.998 1.998 0 0 1-.008-2.819L13.14 15.98.566 3.413A1.998 1.998 0 0 1 .586.608a2 2 0 0 1 2.808-.02l12.574 12.566L28.554.576a2 2 0 0 1 3.366.886 1.998 1.998 0 0 1-.539 1.94L18.796 15.98l12.588 12.58a1.997 1.997 0 0 1 0 2.827z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

CloseIcon.propTypes = {
  color: PropTypes.string,
};

CloseIcon.defaultProps = {
  color: colors.black,
};

export default CloseIcon;
