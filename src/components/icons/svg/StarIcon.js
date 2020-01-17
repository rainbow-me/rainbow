import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import Svg from '../Svg';

const StarIcon = ({ color, ...props }) => (
  <Svg height="18" width="19" viewBox="0 0 18 19" {...props}>
    <Path
      d="M9.411 15.009l-4.618 2.835c-.81.487-1.782-.243-1.54-1.134l1.216-5.266L.337 7.879C-.31 7.312.013 6.178.985 6.097l5.348-.486L8.439.668c.405-.89 1.54-.89 1.945 0l2.106 4.943 5.347.486c.891.08 1.297 1.215.567 1.782l-4.05 3.565 1.215 5.266c.162.891-.73 1.62-1.54 1.134L9.411 15.01z"
      fill={color}
      fillRule="evenodd"
    />
  </Svg>
);

StarIcon.propTypes = {
  color: PropTypes.string,
};

export default StarIcon;
