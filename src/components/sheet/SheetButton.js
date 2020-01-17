import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import stylePropType from 'react-style-proptype';
import { colors, margin, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import InnerBorder from '../InnerBorder';
import { Centered, Row, RowWithMargins } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { Text } from '../text';



        // height={44}
const SheetButton = ({
  borderRadius,
  children,
  color,
  icon,
  label,
  onPress,
  shadows,
  style,
}) => (
  <ButtonPressAnimation
    flex={1}
    onPress={onPress}
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
        css={padding(9.5, 14, 11, 15)}
        margin={4}
    height={44}
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

SheetButton.propTypes = {
  borderRadius: PropTypes.number,
  children: PropTypes.node,
  color: PropTypes.string,
  onPress: PropTypes.func,
  shadows: PropTypes.arrayOf(PropTypes.array),
  style: stylePropType,
};

SheetButton.defaultProps = {
  borderRadius: 50,
  color: 'pink',
  shadows: [
    [0, 2, 5, colors.dark, 0.15],
    [0, 6, 10, colors.dark, 0.14],
    [0, 1, 18, colors.dark, 0.08],
  ],
};

export default SheetButton;
