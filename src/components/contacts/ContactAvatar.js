import { toUpper } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import { borders, colors } from '../../styles';
import { getFirstGrapheme } from '../../utils';
import { Row } from '../layout';
import { Text } from '../text';

const ContactAvatar = ({ color, size, value, ...props }) => {
  const dimensions = size === 'large' ? 60 : size === 'medium' ? 40 : 34;
  const textSize =
    size === 'large' ? 'bigger' : size === 'medium' ? 'larger' : 'large';
  return (
    <ShadowStack
      {...props}
      backgroundColor={colors.avatarColor[color]}
      borderRadius={dimensions}
      {...borders.buildCircleAsObject(dimensions)}
      shadows={[
        [0, 4, 6, colors.dark, 0.04],
        [0, 1, 3, colors.dark, 0.08],
      ]}
      shouldRasterizeIOS
    >
      <Row flex={1} justify="center" align="center">
        <Text align="center" color="white" size={textSize} weight="bold">
          {value && getFirstGrapheme(toUpper(value))}
        </Text>
      </Row>
    </ShadowStack>
  );
};

ContactAvatar.propTypes = {
  color: PropTypes.number,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  value: PropTypes.string,
};

ContactAvatar.defaultPropTypes = {
  size: 'medium',
};

export default React.memo(ContactAvatar);
