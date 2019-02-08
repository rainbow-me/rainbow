import { isUndefined } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-primitives';
import stylePropType from 'react-style-proptype';

const FlexItem = ({
  flex,
  grow,
  shrink,
  style,
  ...props
}) => (
  <View
    {...props}
    style={[{
      flex: (isUndefined(flex) && isUndefined(grow) && isUndefined(shrink)) ? 1 : flex,
      flexGrow: grow,
      flexShrink: shrink,
    }, style]}
  />
);

FlexItem.propTypes = {
  flex: PropTypes.number,
  grow: PropTypes.number,
  shrink: PropTypes.number,
  style: stylePropType,
};

export default FlexItem;
