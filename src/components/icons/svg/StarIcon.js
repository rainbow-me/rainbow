import PropTypes from 'prop-types';
import React from 'react';
import Svg, { Path } from 'svgs';

const StarIcon = ({ color, ...props }) => (
  <Svg width="20" height="20" viewBox="0 0 27 27" {...props}>
    <Path
      d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

StarIcon.propTypes = {
  color: PropTypes.string,
};

export default StarIcon;
