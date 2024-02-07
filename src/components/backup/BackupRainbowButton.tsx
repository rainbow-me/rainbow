import MaskedView from '@react-native-masked-view/masked-view';
import React from 'react';
import { useTheme } from '@/theme';
import { ButtonPressAnimation } from '@/components/animations';
import { RowWithMargins } from '@/components/layout';
import { Text } from '@/components/text';
import RainbowButtonTypes from '@/components/buttons/rainbow-button/RainbowButtonTypes';
import { useDimensions } from '@/hooks';
import styled from '@/styled-thing';
import { shadow } from '@/styles';
import ShadowView from '@/react-native-shadow-stack/ShadowView';
import BackupRainbowButtonBackground from './BackupRainbowButtonBackground';
import { View } from 'react-native';

const ButtonContainer = styled(MaskedView).attrs({
  pointerEvents: 'none',
})(({ width, height }: any) => ({
  height,
  width,
}));

const ButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: -2.5,
})({
  alignSelf: 'center',
  bottom: 2,
  height: '100%',
});

const ButtonLabel = styled(Text).attrs(({ disabled, type, theme: { colors, isDarkMode } }: any) => ({
  align: type === RainbowButtonTypes.addCash ? 'left' : 'center',
  color: isDarkMode && disabled ? colors.white : colors.whiteLabel,
  letterSpacing: type === RainbowButtonTypes.addCash ? 'roundedTight' : 'rounded',
  size: type === RainbowButtonTypes.small ? 'large' : 'larger',
  weight: type === RainbowButtonTypes.small ? 'bold' : 'heavy',
  numberOfLines: 1,
}))({});

const OuterButton = styled(View)(({ height, width, isDarkMode, disabled, strokeWidth, theme: { colors } }: any) => ({
  ...shadow.buildAsObject(0, 5, 15, colors.shadow),
  backgroundColor: colors.dark,
  borderRadius: height / 2 + strokeWidth,
  height,
  shadowOpacity: isDarkMode && disabled ? 0 : isDarkMode ? 0.1 : 0.4,
  width,
}));

const Shadow = styled(ShadowView)(({ height, strokeWidth, isDarkMode, disabled, width, theme: { colors } }: any) => ({
  ...shadow.buildAsObject(0, 10, 30, colors.shadow, 1),
  backgroundColor: colors.white,
  borderRadius: height / 2 + strokeWidth,
  height,
  opacity: isDarkMode && disabled ? 0 : android ? 1 : 0.2,
  position: 'absolute',
  width,
}));

type BackupRainbowButtonProps = {
  disabled?: boolean;
  height?: number;
  label?: string;
  onPress?: () => void;
  strokeWidth?: number;
  width?: number;
  overflowMargin?: number;
  skipTopMargin?: boolean;
};

const BackupRainbowButton = ({
  disabled = false,
  height = 56,
  label = 'Press me',
  onPress,
  strokeWidth = 1,
  width,
  overflowMargin = 35,
  skipTopMargin = true,
  ...props
}: BackupRainbowButtonProps) => {
  const { isDarkMode } = useTheme();

  const { width: deviceWidth } = useDimensions();
  const maxButtonWidth = deviceWidth - 30;

  const btnStrokeWidth = disabled ? 0.5 : strokeWidth;
  const btnWidth = width || maxButtonWidth;

  const outerButtonMask = (
    <OuterButton disabled={disabled} height={height} isDarkMode={isDarkMode} strokeWidth={strokeWidth} width={width} />
  );

  return (
    <ButtonPressAnimation
      {...props}
      disabled={disabled}
      onPress={onPress}
      overflowMargin={overflowMargin}
      scaleTo={0.9}
      skipTopMargin={skipTopMargin}
    >
      <Shadow disabled={disabled} height={height} isDarkMode={isDarkMode} strokeWidth={btnStrokeWidth} width={btnWidth} />
      <ButtonContainer elevation={5} height={height} maskElement={outerButtonMask} width={btnWidth}>
        <BackupRainbowButtonBackground
          disabled={disabled}
          height={height}
          strokeWidth={btnStrokeWidth}
          width={btnWidth}
          type={RainbowButtonTypes.backup}
        />
        <ButtonContent>
          <ButtonLabel disabled={disabled} isDarkMode={isDarkMode}>
            {label}
          </ButtonLabel>
        </ButtonContent>
      </ButtonContainer>
    </ButtonPressAnimation>
  );
};

export default BackupRainbowButton;
