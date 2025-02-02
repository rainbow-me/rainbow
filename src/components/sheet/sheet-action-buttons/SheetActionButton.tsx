import React, { PropsWithChildren, useMemo } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { ThemeContextProps, useTheme } from '@/theme';
import { ButtonPressAnimation } from '../../animations';
import { Icon } from '../../icons';
import { Centered, InnerBorder, RowWithMargins } from '../../layout';
import { Emoji, Text } from '../../text';
import { containsEmoji } from '@/helpers/strings';
import styled from '@/styled-thing';
import { position } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';
import { StyleProp, ViewStyle } from 'react-native';

export type SheetActionButtonProps = PropsWithChildren<{
  borderRadius?: number;
  color?: string;
  disabled?: boolean;
  elevation?: number;
  emoji?: string;
  forceShadows?: boolean;
  icon?: string;
  isCharts?: boolean;
  isTransparent?: boolean;
  label?: string;
  lightShadows?: boolean;
  marginBottom?: number;
  newShadows?: boolean;
  nftShadows?: boolean;
  onPress?: () => void;
  scaleTo?: number;
  size?: 'big' | number | null;
  isSquare?: boolean;
  testID?: string;
  textColor?: string;
  /**
   * textSize accepts every key of fonts.size object which is a legacy dictionary of font sizes
   */
  textSize?: string | number;
  truncate?: boolean;
  weight?: string;
  style?: StyleProp<ViewStyle>;
}>;

const addChartsStyling = (isCharts: boolean) => (isCharts ? { position: 'absolute', width: '100%' } : {});

const Button = styled(Centered)(({ isCharts, size, isSquare }: { isCharts?: boolean; size?: string | number; isSquare?: boolean }) => ({
  ...addChartsStyling(!!isCharts),
  height: typeof size === 'number' ? size : size === 'big' ? 52 : 46,
  width: isSquare ? (typeof size === 'number' ? size : size === 'big' ? 52 : 46) : undefined,
}));

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 4,
})({
  height: ({ size }: Pick<SheetActionButtonProps, 'size'>) => (typeof size === 'number' ? size : size === 'big' ? 52 : 46),
  width: ({ isSquare, size }: Pick<SheetActionButtonProps, 'isSquare' | 'size'>) =>
    isSquare ? (typeof size === 'number' ? size : size === 'big' ? 52 : 46) : undefined,
  paddingBottom: ({ label }: Pick<SheetActionButtonProps, 'label'>) => (label && containsEmoji(label) ? 2.5 : 1),
  paddingHorizontal: ({ isSquare }: Pick<SheetActionButtonProps, 'isSquare'>) => (isSquare ? 0 : 19),
  zIndex: 1,
});
const neverRerender = () => true;
// eslint-disable-next-line react/display-name
const WhiteButtonGradient = React.memo(
  ({ colors }: { colors: ThemeContextProps['colors'] }) => (
    <LinearGradient
      colors={colors.gradients.whiteButton}
      end={{ x: 0.5, y: 1 }}
      pointerEvents="none"
      start={{ x: 0.5, y: 0 }}
      style={[position.coverAsObject, { borderRadius: 49, opacity: 0.5 }]}
    />
  ),
  neverRerender
);

const SheetActionButton: React.FC<SheetActionButtonProps> = ({
  borderRadius = 52,
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
  newShadows,
  nftShadows,
  scaleTo = 0.9,
  size = null,
  isSquare = false,
  testID = null,
  textColor: givenTextColor,
  textSize,
  truncate = false,
  weight = 'semibold',
  marginBottom,
  ...props
}) => {
  const { isDarkMode, colors } = useTheme();
  const color = givenColor || colors.appleBlue;
  const isWhite = color === colors.white;
  const textColor = givenTextColor || colors.whiteLabel;
  const shadowsForButtonColor = useMemo(() => {
    if (newShadows) {
      return [
        [0, 2, 6, colors.trueBlack, 0.02],
        [0, 10, 30, isDarkMode ? colors.shadow : color, 0.4],
      ];
    } else if (nftShadows) {
      return [[0, 10, 30, colors.alpha(colors.shadowBlack, 0.3)]];
    } else if (!forceShadows && (disabled || isTransparent)) {
      return [[0, 0, 0, colors.transparent, 0]];
    } else
      return [
        [0, 10, 30, colors.shadow, isWhite ? 0.12 : lightShadows ? 0.15 : 0.2],
        [0, 5, 15, isDarkMode || isWhite ? colors.shadow : color, isWhite ? 0.08 : lightShadows ? 0.3 : 0.4],
      ];
  }, [color, colors, disabled, forceShadows, isTransparent, isDarkMode, lightShadows, newShadows, nftShadows, isWhite]);

  return (
    <Button
      as={ButtonPressAnimation}
      contentContainerStyle={{
        height: typeof size === 'number' ? size : size === 'big' ? 52 : 46,
        width: isSquare ? (typeof size === 'number' ? size : size === 'big' ? 52 : 46) : undefined,
      }}
      elevation={android ? elevation : null}
      isCharts={isCharts}
      isSquare={isSquare}
      onPress={disabled ? () => undefined : onPress}
      overflowMargin={30}
      radiusAndroid={borderRadius}
      borderRadius={borderRadius}
      scaleTo={disabled ? 1 : scaleTo}
      size={size}
      testID={`${testID}-action-button`}
      marginBottom={marginBottom}
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
    >
      {/*  @ts-expect-error JavaScript component with an improper typing for children prop */}
      <ShadowStack
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...position.coverAsObject}
        backgroundColor={color}
        width={isSquare ? (typeof size === 'number' ? size : size === 'big' ? 52 : 46) : undefined}
        borderRadius={borderRadius}
        height={typeof size === 'number' ? size : size === 'big' ? 52 : 46}
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
      <Content label={label} size={size} isSquare={isSquare}>
        {emoji && <Emoji lineHeight={23} name={emoji} size="medium" />}
        {icon && <Icon color="white" height={18} name={icon} size={18} />}
        {label ? (
          <Text
            align="center"
            color={textColor}
            lineHeight={typeof size === 'number' ? size : size === 'big' ? 52 : 46}
            numberOfLines={truncate ? 1 : undefined}
            size={textSize ?? (size === 'big' ? 'larger' : 'large')}
            style={{ width: '100%' }}
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
