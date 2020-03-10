import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const CompassIcon = ({ color, size, ...props }) => (
  <Svg height={size || 17} viewBox="0 0 16 17" width={size || 16} {...props}>
    <Path
      d="M8 16.5c-4.38 0-8-3.62-8-7.996C0 4.119 3.613.5 7.992.5 12.372.5 16 4.12 16 8.504c0 4.377-3.62 7.996-8 7.996zm-.002-1.6a6.386 6.386 0 006.407-6.396A6.4 6.4 0 007.99 2.1 6.375 6.375 0 001.6 8.504a6.38 6.38 0 006.398 6.395zm-3.1-2.591c-.542.255-.96-.17-.712-.712l2.042-4.315c.132-.27.302-.44.557-.557l4.302-2.034c.573-.27.975.155.72.712L9.772 9.71a1.131 1.131 0 01-.565.557l-4.31 2.042zM8 9.486c.542 0 .975-.44.975-.982a.975.975 0 00-1.95 0c0 .541.433.982.975.982z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

CompassIcon.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
};

CompassIcon.defaultProps = {
  color: colors.white,
};

export default CompassIcon;
