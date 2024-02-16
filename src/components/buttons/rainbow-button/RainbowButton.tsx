import MaskedView from '@react-native-masked-view/masked-view';
import lang from 'i18n-js';
import React from 'react';
import AddCashIconSource from '../../../assets/addCashIcon.png';
import { useTheme } from '../../../theme/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import { RowWithMargins } from '../../layout';
import { Text } from '../../text';
import RainbowButtonBackground from './RainbowButtonBackground';
import RainbowButtonTypes from './RainbowButtonTypes';
import { useDimensions } from '@/hooks';
import { ImgixImage } from '@/components/images';
import styled from '@/styled-thing';
import { position, shadow } from '@/styles';
import ShadowView from '@/react-native-shadow-stack/ShadowView';
import { View } from 'react-native';

const AddCashIcon = styled(ImgixImage).attrs({
  resizeMode: ImgixImage.resizeMode.contain,
  source: AddCashIconSource,
  size: 45,
})({
  ...position.sizeAsObject(45),
  marginTop: 7.5,
});

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
  marginRight: ({ type }: { type: RainbowButtonTypes }) => (type === RainbowButtonTypes.addCash ? 9 : 0),
});

const ButtonLabel = styled(Text).attrs(({ disabled, type, theme: { colors, isDarkMode } }: any) => ({
  align: type === RainbowButtonTypes.addCash ? 'left' : 'center',
  color: isDarkMode && disabled ? colors.white : !isDarkMode && disabled ? colors.grey : colors.whiteLabel,
  letterSpacing: type === RainbowButtonTypes.addCash ? 'roundedTight' : 'rounded',
  size: type === RainbowButtonTypes.small ? 'large' : 'larger',
  weight: type === RainbowButtonTypes.small ? 'bold' : 'heavy',
  numberOfLines: 1,
}))({});

const OuterButton = styled(View)(
  ({
    height,
    width,
    isDarkMode,
    disabled,
    strokeWidth,
    type,
    theme: { colors },
  }: {
    height: number;
    width: number;
    isDarkMode: boolean;
    disabled: boolean;
    strokeWidth: number;
    type: RainbowButtonTypes;
    theme: { colors: any };
  }) => ({
    ...shadow.buildAsObject(0, 5, 15, colors.shadow),
    backgroundColor: type === RainbowButtonTypes.addCash ? colors.darkModeDark : colors.dark,
    borderRadius: height / 2 + strokeWidth,
    height,
    shadowOpacity: isDarkMode && disabled ? 0 : isDarkMode ? 0.1 : 0.4,
    width,
  })
);

const Shadow = styled(ShadowView)(({ height, strokeWidth, isDarkMode, disabled, width, theme: { colors } }: any) => ({
  ...shadow.buildAsObject(0, 10, 30, colors.shadow, 1),
  backgroundColor: colors.white,
  borderRadius: height / 2 + strokeWidth,
  height,
  opacity: isDarkMode && disabled ? 0 : android ? 1 : 0.2,
  position: 'absolute',
  width,
}));

type MaybePromise<T> = T | Promise<T>;

type RainbowButtonProps = {
  disabled?: boolean;
  height?: number;
  label?: string;
  onPress: (...args: unknown[]) => MaybePromise<void>;
  strokeWidth?: number;
  type?: RainbowButtonTypes;
  width?: number;
  overflowMargin?: number;
  skipTopMargin?: boolean;
  testID?: string;
};

const RainbowButton = ({
  disabled = false,
  height = 56,
  label = 'Press me',
  onPress = () => Promise.resolve(),
  strokeWidth = 1,
  type,
  width,
  overflowMargin = 35,
  skipTopMargin = true,
  ...props
}: RainbowButtonProps) => {
  const { isDarkMode } = useTheme();

  const { width: deviceWidth } = useDimensions();
  const maxButtonWidth = deviceWidth - 30;

  height = type === RainbowButtonTypes.small ? 46 : height;
  strokeWidth = disabled ? 0.5 : strokeWidth;
  width = type === RainbowButtonTypes.addCash ? 155 : width || maxButtonWidth;

  const outerButtonMask = (
    <OuterButton disabled={disabled} height={height} isDarkMode={isDarkMode} strokeWidth={strokeWidth} width={width} type={type} />
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
      <Shadow disabled={disabled} height={height} isDarkMode={isDarkMode} strokeWidth={strokeWidth} width={width} />
      <ButtonContainer elevation={5} height={height} maskElement={outerButtonMask} width={width}>
        <RainbowButtonBackground disabled={disabled} height={height} strokeWidth={strokeWidth} type={type} width={width} />

        <ButtonContent type={type}>
          {type === RainbowButtonTypes.addCash && <AddCashIcon />}
          <ButtonLabel disabled={disabled} isDarkMode={isDarkMode} type={type}>
            {type === RainbowButtonTypes.addCash ? lang.t('button.add_cash') : label}
          </ButtonLabel>
        </ButtonContent>
      </ButtonContainer>
    </ButtonPressAnimation>
  );
};

export default RainbowButton;
