import { toUpper } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import ShadowStack from 'react-native-shadow-stack/dist/ShadowStack';
import { borders, colors } from '../../styles';
import { getFirstGrapheme } from '../../utils';
import { Text } from '../text';

const ContactAvatar = ({ color, size, value, ...props }) => {
  const dimensions = size === 'large' ? 60 : size === 'medium' ? 40 : 34;
  const textSize =
    size === 'large' ? 'biggest' : size === 'medium' ? 'big' : 'large';
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
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <Text align="center" color="white" size={textSize} weight="semibold">
          {value && getFirstGrapheme(toUpper(value))}
        </Text>
      </View>
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
