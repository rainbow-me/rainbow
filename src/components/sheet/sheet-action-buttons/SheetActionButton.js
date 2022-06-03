import React, { useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../theme/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import { Icon } from '../../icons';
import { Centered, InnerBorder, RowWithMargins } from '../../layout';
import { Emoji, Text } from '../../text';
import { containsEmoji } from '@rainbow-me/helpers/strings';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const addChartsStyling = isCharts =>
  isCharts ? { position: 'absolute', width: '100%' } : {};

const Button = styled(Centered)(({ isCharts, size }) => ({
  ...addChartsStyling(isCharts),
  height: size === 'big' ? 56 : 46,
}));

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 4,
})({
  height: ({ size }) => (size === 'big' ? 56 : 46),
  paddingBottom: ({ label }) => (label && containsEmoji(label) ? 2.5 : 1),
  paddingHorizontal: 19,
  zIndex: 1,
});

const neverRerender = () => true;
// eslint-disable-next-line react/display-name
const WhiteButtonGradient = React.memo(
  ({ colors }) => (
    <LinearGradient
      borderRadius={49}
      colors={colors.gradients.whiteButton}
      end={{ x: 0.5, y: 1 }}
      opacity={0.5}
      pointerEvents="none"
      start={{ x: 0.5, y: 0 }}
      style={position.coverAsObject}
    />
  ),
  neverRerender
);

const SheetActionButton = ({
  borderRadius = 56,
  children,
  color: givenColor,
  disabled = false,
  elevation = 24,
  emoji = null,
  forceShadows = false,
  icon = null,
  isCharts = false,
  isTransparent = false,
  label = null,
  lightShadows,
  onPress,
  nftShadows,
  scaleTo = 0.9,
  size = null,
  testID = null,
  textColor: givenTextColor,
  textSize,
  truncate = false,
  weight = 'semibold',
  ...props
}) => {
  const { isDarkMode, colors } = useTheme();
  const color = givenColor || colors.appleBlue;
  const isWhite = color === colors.white;
  const textColor = givenTextColor || colors.whiteLabel;
  const shadowsForButtonColor = useMemo(() => {
    if (nftShadows) {
      return [[0, 10, 30, colors.alpha(colors.shadowBlack, 0.3)]];
    } else if (!forceShadows && (disabled || isTransparent)) {
      return [[0, 0, 0, colors.transparent, 0]];
    } else
      return [
        [0, 10, 30, colors.shadow, isWhite ? 0.12 : lightShadows ? 0.15 : 0.2],
        [
          0,
          5,
          15,
          isDarkMode || isWhite ? colors.shadow : color,
          isWhite ? 0.08 : lightShadows ? 0.3 : 0.4,
        ],
      ];
  }, [
    color,
    colors,
    disabled,
    forceShadows,
    isTransparent,
    isDarkMode,
    lightShadows,
    nftShadows,
    isWhite,
  ]);

  return (
    <Button
      as={ButtonPressAnimation}
      contentContainerStyle={{
        height: size === 'big' ? 56 : 46,
      }}
      elevation={android ? elevation : null}
      isCharts={isCharts}
      onPress={disabled ? () => undefined : onPress}
      overflowMargin={30}
      radiusAndroid={borderRadius}
      scaleTo={disabled ? 1 : scaleTo}
      size={size}
      testID={`${testID}-action-button`}
      {...props}
    >
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={color}
        borderRadius={borderRadius}
        height={size === 'big' ? 56 : 46}
        shadows={shadowsForButtonColor}
      >
        {isWhite && <WhiteButtonGradient colors={colors} />}
        {!isWhite && !isTransparent && !nftShadows && (
          <InnerBorder
            color={disabled ? textColor : null}
            opacity={disabled ? 0.02 : null}
            radius={borderRadius}
            width={disabled ? 2 : null}
          />
        )}
      </ShadowStack>
      <Content label={label} size={size}>
        {emoji && <Emoji lineHeight={23} name={emoji} size="medium" />}
        {icon && <Icon color="white" height={18} name={icon} size={18} />}
        {label ? (
          <Text
            align="center"
            color={textColor}
            numberOfLines={truncate ? 1 : undefined}
            size={textSize ?? (size === 'big' ? 'larger' : 'large')}
            weight={weight}
          >
            {label}
          </Text>
        ) : (
          children
        )}
      </Content>
    </Button>
  );
};

export default React.memo(SheetActionButton);
