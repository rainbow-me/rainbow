import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import styled from 'styled-components';
import AddCashIconSource from '../../../assets/addCashIcon.png';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../../context/ThemeContext' was resolve... Remove this comment to see the full error message
import { useTheme } from '../../../context/ThemeContext';
import { ButtonPressAnimation } from '../../animations';
import { RowWithMargins } from '../../layout';
import { Text } from '../../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './RainbowButtonBackground' was resolved to... Remove this comment to see the full error message
import RainbowButtonBackground from './RainbowButtonBackground';
import RainbowButtonTypes from './RainbowButtonTypes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDimensions } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position, shadow } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack/Shad... Remove this comment to see the full error message
import ShadowView from 'react-native-shadow-stack/ShadowView';

const AddCashIcon = styled(ImgixImage).attrs({
  resizeMode: ImgixImage.resizeMode.contain,
  source: AddCashIconSource,
})`
  ${position.size(45)};
  margin-top: 7.5;
`;

const ButtonContainer = styled(MaskedView).attrs({
  pointerEvents: 'none',
})`
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'MaskedVi... Remove this comment to see the full error message
  height: ${({ height }) => height};
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'width' does not exist on type 'MaskedVie... Remove this comment to see the full error message
  width: ${({ width }) => width};
`;

const ButtonContent = styled(RowWithMargins).attrs({
  align: 'center',
  margin: -2.5,
})`
  align-self: center;
  bottom: 2;
  height: 100%;
  margin-right: ${({ type }) => (type === 'addCash' ? 9 : 0)};
`;

const ButtonLabel = styled(Text).attrs(
  ({ disabled, type, theme: { colors, isDarkMode } }) => ({
    align: type === RainbowButtonTypes.addCash ? 'left' : 'center',
    color: isDarkMode && disabled ? colors.white : colors.whiteLabel,
    letterSpacing:
      type === RainbowButtonTypes.addCash ? 'roundedTight' : 'rounded',
    size: type === RainbowButtonTypes.small ? 'large' : 'larger',
    weight: type === RainbowButtonTypes.small ? 'bold' : 'heavy',
  })
)``;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const OuterButton = styled.View`
  ${({ theme: { colors } }: any) => shadow.build(0, 5, 15, colors.shadow)};
  background-color: ${({ theme: { colors } }: any) => colors.dark};
  border-radius: ${({ height, strokeWidth }: any) => height / 2 + strokeWidth};
  height: ${({ height }: any) => height};
  shadow-opacity: ${({ disabled, isDarkMode }: any) =>
    isDarkMode && disabled ? 0 : isDarkMode ? 0.1 : 0.4};
  width: ${({ width }: any) => width};
`;

const Shadow = styled(ShadowView)`
  ${({ theme: { colors } }) => shadow.build(0, 10, 30, colors.shadow, 1)};
  background-color: ${({ theme: { colors } }) => colors.white};
  border-radius: ${({ height, strokeWidth }) => height / 2 + strokeWidth};
  height: ${({ height }) => height};
  opacity: ${({ disabled, isDarkMode }) =>
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
}: any) => {
  const { isDarkMode } = useTheme();

  const { width: deviceWidth } = useDimensions();
  const maxButtonWidth = deviceWidth - 30;

  height = type === RainbowButtonTypes.small ? 46 : height;
  strokeWidth = disabled ? 0.5 : strokeWidth;
  width = type === RainbowButtonTypes.addCash ? 155 : width || maxButtonWidth;

  const outerButtonMask = (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <OuterButton
      disabled={disabled}
      height={height}
      isDarkMode={isDarkMode}
      strokeWidth={strokeWidth}
      width={width}
    />
  );

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      {...props}
      disabled={disabled}
      onPress={onPress}
      overflowMargin={overflowMargin}
      scaleTo={0.9}
      skipTopMargin={skipTopMargin}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Shadow
        disabled={disabled}
        height={height}
        isDarkMode={isDarkMode}
        strokeWidth={strokeWidth}
        width={width}
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonContainer
        // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
        elevation={5}
        height={height}
        maskElement={outerButtonMask}
        width={width}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RainbowButtonBackground
          disabled={disabled}
          height={height}
          strokeWidth={strokeWidth}
          type={type}
          width={width}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ButtonContent type={type}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {type === RainbowButtonTypes.addCash && <AddCashIcon />}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ButtonLabel disabled={disabled} isDarkMode={isDarkMode} type={type}>
            {type === RainbowButtonTypes.addCash ? 'Add Cash' : label}
          </ButtonLabel>
        </ButtonContent>
      </ButtonContainer>
    </ButtonPressAnimation>
  );
};

export default RainbowButton;
