import PropTypes from 'prop-types';
import React from 'react';
import stylePropType from 'react-style-proptype';
import { colors, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { InnerBorder, RowWithMargins } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { Text } from '../text';

const SheetButton = ({
  borderRadius,
  color,
  icon,
  label,
  onPress,
  shadows,
  style,
  textColor,
  ...props
}) => {
  return (
    <ButtonPressAnimation
      {...props}
      onPress={onPress}
      scaleTo={0.96}
      style={[position.centeredAsObject, style]}
      width="100%"
    >
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={color}
        borderRadius={borderRadius}
        shadows={shadows}
      />
      <RowWithMargins
        align="center"
        css={padding(9.5, 14, 11, 15)}
        height={56}
        margin={7}
        zIndex={1}
      >
        {icon && <Icon color={textColor} name={icon} size={21} />}
        <Text
          align="center"
          color={textColor}
          size="larger"
          style={{
            letterSpacing: 0, // confirm w/ @christian.. spec calls for 0.6 but its fugly
            lineHeight: 24,
          }}
          weight="semibold"
        >
          {label}
        </Text>
      </RowWithMargins>
      <InnerBorder radius={borderRadius} />
    </ButtonPressAnimation>
  );
};

SheetButton.propTypes = {
  backgroundColor: PropTypes.string,
  borderRadius: PropTypes.number,
  children: PropTypes.node,
  color: PropTypes.string,
  onPress: PropTypes.func,
  shadows: PropTypes.arrayOf(PropTypes.array),
  style: stylePropType,
};

SheetButton.defaultProps = {
  borderRadius: 50,
  shadows: [
    [0, 2, 5, colors.dark, 0.15],
    [0, 6, 10, colors.dark, 0.14],
    [0, 1, 18, colors.dark, 0.08],
  ],
  textColor: colors.white,
};

export default React.memo(SheetButton);
