import PropTypes from 'prop-types';
import React from 'react';
import { useWindowDimensions } from 'react-native';
import ShadowStack from 'react-native-shadow-stack';
import stylePropType from 'react-style-proptype';
import { colors, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { InnerBorder, RowWithMargins } from '../layout';
import { Text } from '../text';

const SheetActionButton = ({
  borderRadius,
  children,
  color,
  icon,
  label,
  onPress,
  shadows,
  style,
  ...props
}) => {
  const dims = useWindowDimensions();

  return (
    <ButtonPressAnimation
      {...props}
      flex={1}
      onPress={onPress}
      scaleTo={0.96}
      style={[position.centeredAsObject, style]}
    >
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={color}
        borderRadius={borderRadius}
        shadows={shadows}
      />
      {children || (
        <RowWithMargins
          align="center"
          css={padding(9, 15, 12)}
          height={dims.width >= 414 ? 44 : 40}
          margin={0}
          zIndex={1}
        >
          <Icon color="white" name={icon} size={16} />
          <Text color="white" size="lmedium" weight="semibold">
            {label}
          </Text>
        </RowWithMargins>
      )}
      <InnerBorder radius={borderRadius} />
    </ButtonPressAnimation>
  );
};

SheetActionButton.propTypes = {
  borderRadius: PropTypes.number,
  children: PropTypes.node,
  color: PropTypes.string,
  onPress: PropTypes.func,
  shadows: PropTypes.arrayOf(PropTypes.array),
  style: stylePropType,
};

SheetActionButton.defaultProps = {
  borderRadius: 50,
  color: 'appleBlue',
  shadows: [
    [0, 2, 5, colors.dark, 0.15],
    [0, 6, 10, colors.dark, 0.14],
    [0, 1, 18, colors.dark, 0.08],
  ],
};

export default SheetActionButton;
