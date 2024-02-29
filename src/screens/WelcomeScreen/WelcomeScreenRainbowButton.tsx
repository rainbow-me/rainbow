import { BaseButtonAnimationProps } from '@/components/animations/ButtonPressAnimation/types';
import { StyleProp, ViewStyle } from 'react-native';
import { ButtonPressAnimation } from '@/components/animations';
import React from 'react';
import styled from '@/styled-thing';
import Reanimated from 'react-native-reanimated';
import { Emoji, Text } from '@/components/text';
import { ThemeContextProps } from '@/theme';
import { RowWithMargins } from '@/components/layout';
import { shadow } from '@/styles';

const ButtonContainer = styled(Reanimated.View)({
  borderRadius: ({ height }: { height: number }) => height / 2,
});
const ButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 4,
})({
  alignSelf: 'center',
  height: '100%',
  paddingBottom: 2,
});
const ButtonLabel = styled(Text).attrs(({ textColor: color, theme: { colors } }: { textColor: string; theme: ThemeContextProps }) => ({
  align: 'center',
  color: color || colors.dark,
  size: 'larger',
  weight: 'bold',
}))({});
const ButtonEmoji = styled(Emoji).attrs({
  align: 'center',
  size: 16.25,
})({
  paddingBottom: 1.5,
});
const DarkShadow = styled(Reanimated.View)(({ theme: { colors, isDarkMode } }: { theme: ThemeContextProps }) => ({
  ...shadow.buildAsObject(0, 10, 30, colors.dark, isDarkMode ? 0 : 1),
  backgroundColor: colors.white,
  borderRadius: 30,
  height: 60,
  left: -3,
  opacity: 0.2,
  position: 'absolute',
  top: -3,
  width: 236,
}));
const Shadow = styled(Reanimated.View)(({ theme: { colors, isDarkMode } }: { theme: ThemeContextProps }) => ({
  ...shadow.buildAsObject(0, 5, 15, colors.shadow, isDarkMode ? 0 : 0.4),
  borderRadius: 30,
  height: 60,
  position: 'absolute',
  width: 236,
  ...(ios
    ? {
        left: -3,
        top: -3,
      }
    : {
        elevation: 30,
      }),
}));

interface Props extends BaseButtonAnimationProps {
  height: number;
  textColor: string;
  text: string;
  emoji: string;
  shadowStyle?: StyleProp<ViewStyle>;
  darkShadowStyle?: StyleProp<ViewStyle>;
}

export const WelcomeScreenRainbowButton = ({
  darkShadowStyle,
  emoji,
  height,
  onPress,
  shadowStyle,
  style,
  textColor,
  text,
  ...props
}: Props) => {
  return (
    <ButtonPressAnimation onPress={onPress} overflowMargin={40} radiusAndroid={height / 2} scaleTo={0.9} {...props}>
      {ios && <DarkShadow style={darkShadowStyle} />}
      <Shadow style={shadowStyle} />
      <ButtonContainer height={height} style={style}>
        <ButtonContent>
          <ButtonEmoji name={emoji} />
          <ButtonLabel textColor={textColor}>{text}</ButtonLabel>
        </ButtonContent>
      </ButtonContainer>
    </ButtonPressAnimation>
  );
};
