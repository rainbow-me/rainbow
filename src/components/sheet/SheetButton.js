import PropTypes from 'prop-types';
import React from 'react';
import ShadowStack from 'react-native-shadow-stack';
import stylePropType from 'react-style-proptype';
import { colors, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { InnerBorder, RowWithMargins } from '../layout';
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
        css={padding(14, 15, 18)}
        height={56}
        margin={6}
        zIndex={1}
      >
        {icon && <Icon color={textColor} name={icon} size={21} />}
        <Text
          align="center"
          color={textColor}
          lineHeight={24}
          size="larger"
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
    [0, 10, 30, colors.dark, 0.2],
    [0, 5, 15, colors.swapPurple, 0.4],
  ],
  textColor: colors.white,
};

export default React.memo(SheetButton);
