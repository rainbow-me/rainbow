import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import styled from 'styled-components';
import AddCashIconSource from '../../../assets/addCashIcon.png';
import { useTheme } from '../../../context/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import { RowWithMargins } from '../../layout';
import { Text } from '../../text';
import RainbowButtonBackground from './RainbowButtonBackground';
import RainbowButtonTypes from './RainbowButtonTypes';
import { useDimensions } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { position, shadow } from '@rainbow-me/styles';
import ShadowView from 'react-native-shadow-stack/ShadowView';

const AddCashIcon = styled(ImgixImage).attrs({
  resizeMode: ImgixImage.resizeMode.contain,
  source: AddCashIconSource,
})`
  ${position.size(45)};
  margin-top: 7;
`;

const ButtonContainer = styled(MaskedView).attrs({
  pointerEvents: 'none',
})`
  height: ${({ height }) => height};
  width: ${({ width }) => width};
`;

const ButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: -2.5,
})`
  align-self: center;
  height: 100%;
  margin-right: ${({ type }) => (type === 'addCash' ? 9 : 0)};
  padding-bottom: 4;
`;

const ButtonLabel = styled(Text).attrs(
  ({ disabled, type, theme: { colors, isDarkMode } }) => ({
    align: type === RainbowButtonTypes.addCash ? 'left' : 'center',
    color: isDarkMode && disabled ? colors.white : colors.whiteLabel,
    letterSpacing:
      type === RainbowButtonTypes.addCash ? 'roundedTight' : 'rounded',
    size: type === RainbowButtonTypes.small ? 'large' : 'larger',
    weight: 'bold',
  })
)``;

const OuterButton = styled.View`
  ${({ theme: { colors } }) => shadow.build(0, 5, 15, colors.shadow)};
  background-color: ${({ theme: { colors } }) => colors.dark};
  border-radius: ${({ height, strokeWidth }) => height / 2 + strokeWidth};
  height: ${({ height }) => height};
  shadow-opacity: ${({ disabled, isDarkMode }) =>
    isDarkMode && disabled ? 0 : isDarkMode ? 0.1 : 0.4};
  width: ${({ width }) => width};
`;

const Shadow = styled(ShadowView)`
  ${({ theme: { colors } }) => shadow.build(0, 10, 30, colors.shadow, 1)};
  background-color: ${({ theme: { colors } }) => colors.white};
  border-radius: ${({ height, strokeWidth }) => height / 2 + strokeWidth};
  height: ${({ height }) => height};
  opacity: ${({ disabled, isDarkMode }) =>
    isDarkMode && disabled ? 0 : android ? 1 : 0.2};
  position: absolute;
  width: ${({ width }) => width};
`;

const RainbowButton = ({
  disabled,
  height = 56,
  label = 'Press me',
  onPress,
  strokeWidth = 1,
  type,
  width,
  overflowMargin = 35,
  skipTopMargin = true,
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const { width: deviceWidth } = useDimensions();
  const maxButtonWidth = deviceWidth - 30;

  height = type === RainbowButtonTypes.small ? 46 : height;
  strokeWidth = disabled ? 0.5 : strokeWidth;
  width = type === RainbowButtonTypes.addCash ? 155 : width || maxButtonWidth;

  const outerButtonMask = (
    <OuterButton
      disabled={disabled}
      height={height}
      isDarkMode={isDarkMode}
      strokeWidth={strokeWidth}
      width={width}
    />
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
      <Shadow
        disabled={disabled}
        height={height}
        isDarkMode={isDarkMode}
        strokeWidth={strokeWidth}
        width={width}
      />
      <ButtonContainer
        elevation={5}
        height={height}
        maskElement={outerButtonMask}
        width={width}
      >
        <RainbowButtonBackground
          disabled={disabled}
          height={height}
          strokeWidth={strokeWidth}
          type={type}
          width={width}
        />
        <ButtonContent type={type}>
          {type === RainbowButtonTypes.addCash && <AddCashIcon />}
          <ButtonLabel disabled={disabled} isDarkMode={isDarkMode} type={type}>
            {type === RainbowButtonTypes.addCash ? 'Add Cash' : label}
          </ButtonLabel>
        </ButtonContent>
      </ButtonContainer>
    </ButtonPressAnimation>
  );
};

export default RainbowButton;
