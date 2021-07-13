import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const SearchIcon = ({ color, colors, ...props }) => (
  <Svg height="18" viewBox="0 0 18 18" width="18" {...props}>
    <Path
      d="M7.455 0a7.444 7.444 0 0 1 5.982 11.888l4.024 3.404a1.538 1.538 0 1 1-2.169 2.168l-3.404-4.023A7.45 7.45 0 1 1 7.455 0zm0 13.34a5.885 5.885 0 1 0 0-11.77 5.885 5.885 0 0 0 0 11.77z"
      fill={color || colors.black}
      fillRule="nonzero"
    />
  </Svg>
);

SearchIcon.propTypes = {
  color: PropTypes.string,
};

export default SearchIcon;
