import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { useSafeArea } from 'react-native-safe-area-context';
import { View } from 'react-primitives';
import { colors, position } from '../../styles';

const Page = ({
  color,
  component,
  showBottomInset,
  showTopInset,
  ...props
}) => {
  const insets = useSafeArea();

  return (
    <View
      {...props}
      paddingBottom={showBottomInset ? insets.bottom : 0}
      paddingTop={showTopInset ? insets.top : 0}
    >
      {createElement(component, {
        ...props,
        ...position.sizeAsObject('100%'),
        backgroundColor: color,
      })}
    </View>
  );
};

Page.propTypes = {
  color: PropTypes.string,
  component: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  showBottomInset: PropTypes.bool,
  showTopInset: PropTypes.bool,
};

Page.defaultProps = {
  color: colors.white,
  component: View,
};

export default Page;
