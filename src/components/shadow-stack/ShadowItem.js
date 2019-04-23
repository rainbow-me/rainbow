import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import { pure } from 'recompact';
import { colors, position, shadow as shadowUtil } from '../../styles';

const ShadowItem = ({ backgroundColor, shadow, ...props }) => (
  <View
    {...props}
    css={`
      ${position.cover};
      ${shadowUtil.build(...shadow)}
      background-color: ${backgroundColor || colors.white};
    `}
    shouldRasterizeIOS
  />
);

ShadowItem.propTypes = {
  backgroundColor: PropTypes.string,
  height: PropTypes.number,
  shadow: PropTypes.array,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default pure(ShadowItem);
