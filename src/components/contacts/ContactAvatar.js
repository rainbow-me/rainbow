import PropTypes from 'prop-types';
import React from 'react';
import { borders, colors } from '../../styles';
import { getFirstGrapheme } from '../../utils';
import { Centered } from '../layout';
import { Text } from '../text';

const ContactAvatar = ({
  color,
  large,
  value,
  ...props
}) => (
  <Centered
    {...props}
    {...borders.buildCircleAsObject(large ? 60 : 40)}
    backgroundColor={colors.avatarColor[color]}
  >
    <Text
      align="center"
      color="white"
      size={large ? 'biggest' : 'large'}
      weight="semibold"
    >
      {getFirstGrapheme(value)}
    </Text>
  </Centered>
);

ContactAvatar.propTypes = {
  color: PropTypes.number,
  large: PropTypes.bool,
  value: PropTypes.string,
};

export default React.memo(ContactAvatar);
