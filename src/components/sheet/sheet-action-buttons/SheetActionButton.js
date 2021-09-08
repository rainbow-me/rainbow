import React, { useMemo } from 'react';
import { View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import styled from 'styled-components';
import { useTheme } from '../../../context/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import { Icon } from '../../icons';
import { Centered, InnerBorder, RowWithMargins } from '../../layout';
import { Emoji, Text } from '../../text';
import { containsEmoji } from '@rainbow-me/helpers/strings';
import { useDimensions } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const addChartsStyling = isCharts =>
  isCharts ? 'position: absolute; width: 100%;' : '';

const Button = styled(Centered)`
  height: ${({ size }) => (size === 'big' ? 56 : 46)};
  ${({ isCharts }) => addChartsStyling(isCharts)}
`;

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 4,
})`
  height: ${({ size }) => (size === 'big' ? 56 : 46)};
  padding-bottom: ${({ label }) => (label && containsEmoji(label) ? 5.5 : 4)};
  padding-horizontal: 19;
  z-index: 1;
`;

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
  androidWidth = null,
  borderRadius = 56,
  children,
  color: givenColor,
  disabled = false,
  elevation = 24,
  emoji = null,
  forceShadows = false,
  fullWidth = false,
  icon = null,
  isCharts = false,
  isTransparent = false,
  label = null,
  scaleTo = 0.9,
  size = null,
  testID = null,
  textColor: givenTextColor,
  weight = 'semibold',
  ...props
}) => {
  const { isDarkMode, colors } = useTheme();
  const color = givenColor || colors.appleBlue;
  const textColor = givenTextColor || colors.whiteLabel;
  const { width: deviceWidth } = useDimensions();
  const shadowsForButtonColor = useMemo(() => {
    const isWhite = color === colors.white;

    if (!forceShadows && (disabled || isTransparent)) {
      return [[0, 0, 0, colors.transparent, 0]];
    } else
      return [
        [0, 10, 30, colors.shadow, isWhite ? 0.12 : 0.2],
        [
          0,
          5,
          15,
          isDarkMode || isWhite ? colors.shadow : color,
          isWhite ? 0.08 : 0.4,
        ],
      ];
  }, [color, colors, disabled, forceShadows, isTransparent, isDarkMode]);

  const androidButtonWidth =
    androidWidth || (fullWidth ? deviceWidth - 38 : (deviceWidth - 53) / 2);

  return (
    <View
      style={{ ...((android || fullWidth) && { width: androidButtonWidth }) }}
    >
      <Button
        as={ButtonPressAnimation}
        contentContainerStyle={{
          height: size === 'big' ? 56 : 46,
          ...((android || fullWidth) && { width: androidButtonWidth }),
        }}
        elevation={android ? elevation : null}
        isCharts={isCharts}
        overflowMargin={30}
        radiusAndroid={borderRadius}
        scaleTo={scaleTo}
        size={size}
        testID={`${testID}-action-button`}
        wrapperStyle={{ alignItems: 'center' }}
        {...props}
      >
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={color}
          borderRadius={borderRadius}
          height={size === 'big' ? 56 : 46}
          shadows={shadowsForButtonColor}
          {...((android || fullWidth) && { width: androidButtonWidth })}
        >
          {color === colors.white && <WhiteButtonGradient colors={colors} />}
          {color !== colors.white && !isTransparent && (
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
              size={size === 'big' ? 'larger' : 'large'}
              weight={weight}
            >
              {label}
            </Text>
          ) : (
            children
          )}
        </Content>
      </Button>
    </View>
  );
};

export default React.memo(SheetActionButton);
