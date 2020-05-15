import PropTypes from 'prop-types';
import React from 'react';
import { StyleSheet } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import ShadowStack from 'react-native-shadow-stack';
import stylePropType from 'react-style-proptype';
import { withProps } from 'recompose';
import { colors, padding, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { InnerBorder, RowWithMargins } from '../layout';
import { Text } from '../text';

const BorderRadius = 56;

const sx = StyleSheet.create({
  gradient: {
    alignItems: 'center',
    borderRadius: BorderRadius,
    height: 56,
    overflow: 'hidden',
    width: '100%',
    zIndex: 1,
  },
});

const GradientStops = [0, 0.63, 1];

const ButtonRadialGradient = withProps({
  radius: 450,
  stops: GradientStops,
})(RadialGradient);

const GradientCenter = [1, 0.46];
const Gradient = withProps({
  center: GradientCenter,
  style: sx.gradient,
})(ButtonRadialGradient);

const SheetButton = ({
  borderRadius,
  color,
  disabled,
  gradientBackground,
  gradientColors,
  icon,
  label,
  onPress,
  shadows,
  style,
  textColor,
  ...props
}) => {
  const buttonContent = (
    <RowWithMargins
      align="center"
      css={padding(16, 15)}
      height={56}
      margin={6}
      zIndex={1}
    >
      {icon && <Icon color={textColor} name={icon} size={21} />}
      <Text
        align="center"
        color={textColor}
        size="larger"
        style={{
          lineHeight: 24,
        }}
        weight="semibold"
      >
        {label}
      </Text>
    </RowWithMargins>
  );

  return (
    <ButtonPressAnimation
      {...props}
      onPress={onPress}
      scaleTo={0.96}
      style={[position.centeredAsObject, style]}
      width="100%"
      disabled={disabled}
    >
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={color || colors.white}
        borderRadius={borderRadius}
        shadows={shadows}
        height={56}
      />
      {!gradientBackground ? (
        buttonContent
      ) : (
        <Gradient colors={gradientColors}>{buttonContent}</Gradient>
      )}
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
  borderRadius: 56,
  disabled: false,
  gradientColors: ['#FFB114', '#FF54BB', '#00F0FF'],
  shadows: [
    [0, 10, 30, colors.dark, 0.2],
    [0, 5, 15, colors.swapPurple, 0.4],
  ],
  textColor: colors.white,
};

export default React.memo(SheetButton);
