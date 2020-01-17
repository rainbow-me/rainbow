import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const MinusCircledIcon = ({ color, size, ...props }) => (
  <Svg height={size} viewBox="0 0 17 17" width={size} {...props}>
    <Path
      d="M8.07 0c4.422 0 8.086 3.656 8.086 8.086 0 4.422-3.656 8.078-8.078 8.078C3.656 16.164 0 12.508 0 8.086 0 3.656 3.648 0 8.07 0zm3.25 7.313H4.828c-.508 0-.844.296-.844.78 0 .485.352.774.844.774h6.492c.5 0 .844-.289.844-.773 0-.485-.328-.781-.844-.781z"
      fill={color}
      fillRule="nonzero"
    />
  </Svg>
);

MinusCircledIcon.propTypes = {
  color: PropTypes.string,
  size: PropTypes.number,
};

MinusCircledIcon.defaultProps = {
  color: colors.limeGreen,
  size: 17,
};

export default React.memo(MinusCircledIcon);
