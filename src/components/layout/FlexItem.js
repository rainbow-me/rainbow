import { isUndefined } from 'lodash';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { View } from 'react-primitives';
import stylePropType from 'react-style-proptype';

const FlexItem = ({ flex, grow, shrink, style, ...props }, ref) => {
  const flexItemStyles = useMemo(
    () => ({
      flex:
        isUndefined(flex) && isUndefined(grow) && isUndefined(shrink)
          ? 1
          : flex,
      flexGrow: grow,
      flexShrink: shrink,
    }),
    [flex, grow, shrink]
  );

  return <View {...props} ref={ref} style={[flexItemStyles, style]} />;
};

FlexItem.propTypes = {
  flex: PropTypes.number,
  grow: PropTypes.number,
  shrink: PropTypes.number,
  style: PropTypes.oneOfType([PropTypes.arrayOf(stylePropType), stylePropType]),
};

export default React.forwardRef(FlexItem);
