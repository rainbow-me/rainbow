import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const PlusCircledIcon = ({ color, size, ...props }) => (
  <Svg height={size} viewBox="0 0 19 19" width={size} {...props}>
    <Path
      d="M9.308 0c5.115 0 9.316 4.201 9.316 9.316 0 5.116-4.201 9.308-9.316 9.308C4.2 18.624 0 14.432 0 9.316 0 4.201 4.192 0 9.308 0zm-.01 4.896c-.614 0-1.036.448-1.036 1.063v2.32H5.897c-.624 0-1.072.422-1.072 1.046 0 .615.457 1.046 1.072 1.046h2.365v2.224c0 .615.422 1.063 1.037 1.063.624 0 1.055-.44 1.055-1.063V10.37h2.364c.624 0 1.072-.43 1.072-1.046 0-.624-.44-1.046-1.072-1.046h-2.364V5.96c0-.624-.431-1.063-1.055-1.063z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

PlusCircledIcon.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
};

PlusCircledIcon.defaultProps = {
  color: colors.limeGreen,
  size: 19,
};

export default React.memo(PlusCircledIcon);
