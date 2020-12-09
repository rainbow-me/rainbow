import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives';
import AddCashIconSource from '../../../assets/addCashIcon.png';
import { ButtonPressAnimation } from '../../animations';
import { RowWithMargins } from '../../layout';
import { Text } from '../../text';
import RainbowButtonBackground from './RainbowButtonBackground';
import RainbowButtonTypes from './RainbowButtonTypes';
import { useDimensions } from '@rainbow-me/hooks';
import { colors, position, shadow } from '@rainbow-me/styles';
import ShadowView from 'react-native-shadow-stack/ShadowView';

const AddCashIcon = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.contain,
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

const ButtonLabel = styled(Text).attrs(({ type }) => ({
  align: type === RainbowButtonTypes.addCash ? 'left' : 'center',
  color: colors.white,
  letterSpacing:
    type === RainbowButtonTypes.addCash ? 'roundedTight' : 'rounded',
  size: type === RainbowButtonTypes.small ? 'large' : 'larger',
  weight: 'bold',
}))``;

const OuterButton = styled.View`
  ${shadow.build(0, 5, 15, colors.dark, 0.4)};
  background-color: ${colors.dark};
  border-radius: ${({ height, strokeWidth }) => height / 2 + strokeWidth};
  height: ${({ height }) => height};
  width: ${({ width }) => width};
`;

const Shadow = styled(ShadowView)`
  ${shadow.build(0, 10, 30, colors.dark, 1)};
  background-color: ${colors.white};
  border-radius: ${({ height, strokeWidth }) => height / 2 + strokeWidth};
  height: ${({ height }) => height};
  opacity: 0.2;
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
  const { width: deviceWidth } = useDimensions();
  const maxButtonWidth = deviceWidth - 30;

  height = type === RainbowButtonTypes.small ? 46 : height;
  strokeWidth = disabled ? 0.5 : strokeWidth;
  width = type === RainbowButtonTypes.addCash ? 155 : width || maxButtonWidth;

  const outerButtonMask = (
    <OuterButton height={height} strokeWidth={strokeWidth} width={width} />
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
      <Shadow height={height} strokeWidth={strokeWidth} width={width} />
      <ButtonContainer
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
          <ButtonLabel type={type}>
            {type === RainbowButtonTypes.addCash ? 'Add Cash' : label}
          </ButtonLabel>
        </ButtonContent>
      </ButtonContainer>
    </ButtonPressAnimation>
  );
};

export default RainbowButton;
