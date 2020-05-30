import MaskedView from '@react-native-community/masked-view';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import FastImage from 'react-native-fast-image';
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components/primitives';
import AddCashIconSource from '../../assets/addCashIcon.png';
import { colors, margin } from '../../styles';
import { deviceUtils } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { RowWithMargins } from '../layout';
import { Text } from '../text';

const maxButtonWidth = deviceUtils.dimensions.width - 30;

const AddCashIcon = styled(FastImage).attrs({
  resizeMode: FastImage.resizeMode.contain,
  source: AddCashIconSource,
})`
  height: 45;
  margin-top: 7;
  width: 45;
`;

const ButtonContainer = styled(View)`
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

const InnerButton = styled(View)`
  ${({ strokeWidth }) => margin(strokeWidth)}
  background-color: ${colors.dark};
  border-radius: ${({ strokeWidth, height }) => height / 2 - strokeWidth};
  height: ${({ strokeWidth, height }) => height - strokeWidth * 2};
  width: ${({ strokeWidth, width }) => width - strokeWidth * 2};
`;

const InnerGradient = styled(RadialGradient)`
  height: ${({ width }) => width};
  position: absolute;
  top: ${({ height, width }) => -(width - height) / 2};
  transform: scaleY(0.7884615385);
  width: ${({ width }) => width};
`;

const OuterButton = styled(View)`
  background-color: ${colors.dark};
  border-radius: ${({ height }) => height / 2};
  height: ${({ height }) => height};
  shadow-color: ${colors.dark};
  shadow-offset: 0px 5px;
  shadow-opacity: 0.4;
  shadow-radius: 7.5;
  width: ${({ width }) => width};
`;

const OuterGradient = styled(RadialGradient)`
  height: ${({ width }) => width * 2};
  left: ${({ width }) => -width / 2};
  position: absolute;
  top: ${({ height, width }) => -(width - height / 2)};
  transform: scaleY(0.7884615385);
  width: ${({ width }) => width * 2};
`;

const Shadow = styled(View)`
  background-color: ${colors.white};
  border-radius: ${({ height }) => height / 2};
  height: ${({ height }) => height};
  opacity: 0.2;
  position: absolute;
  shadow-color: ${colors.dark};
  shadow-offset: 0px 10px;
  shadow-opacity: 1;
  shadow-radius: 15;
  width: ${({ width }) => width};
`;

const RainbowButton = ({
  disabled,
  height,
  label,
  onPress,
  strokeWidth,
  type,
  width,
  ...props
}) => {
  height = type === 'small' ? 46 : height;
  strokeWidth = disabled ? 0.5 : strokeWidth;
  width = type === 'addCash' ? 155 : width;

  const gradientStops =
    type === 'addCash' ? [0, 0.544872, 1] : [0, 0.774321, 1];

  const innerButtonMask = (
    <InnerButton strokeWidth={strokeWidth} height={height} width={width} />
  );
  const innerGradientCenter = [
    width - strokeWidth * 2,
    (width - strokeWidth * 2) / 2,
  ];
  const innerGradientColors = disabled
    ? ['#B0B3B9', '#B0B3B9', '#B0B3B9']
    : type === 'addCash'
    ? ['#FFB114', '#FF54BB', '#00F0FF']
    : ['#FFB114', '#FF54BB', '#7EA4DE'];

  const outerButtonMask = <OuterButton height={height} width={width} />;
  const outerGradientCenter = [width * 1.5, width];
  const outerGradientColors = disabled
    ? ['#A5A8AE', '#A5A8AE', '#A5A8AE']
    : type === 'addCash'
    ? ['#F5AA13', '#F551B4', '#00E6F5']
    : ['#F5AA13', '#F551B4', '#799DD5'];

  return (
    <ButtonPressAnimation
      {...props}
      disabled={disabled}
      onPress={onPress}
      scaleTo={0.9}
    >
      <Shadow height={height} width={width} />
      <MaskedView maskElement={outerButtonMask} pointerEvents="none">
        <ButtonContainer height={height} width={width}>
          <OuterGradient
            center={outerGradientCenter}
            colors={outerGradientColors}
            height={height}
            radius={width}
            stops={gradientStops}
            width={width}
          />
          <MaskedView maskElement={innerButtonMask}>
            <InnerGradient
              center={innerGradientCenter}
              colors={innerGradientColors}
              height={height}
              radius={width}
              stops={gradientStops}
              width={width}
            />
          </MaskedView>
          <ButtonContent type={type}>
            {type === 'addCash' && <AddCashIcon />}
            <Text
              color="white"
              letterSpacing={
                type === 'addCash' ? 'roundedTight' : 'roundedMedium'
              }
              size={type === 'small' ? 'large' : 'larger'}
              weight="bold"
            >
              {type === 'addCash' ? 'Add Cash' : label}
            </Text>
          </ButtonContent>
        </ButtonContainer>
      </MaskedView>
    </ButtonPressAnimation>
  );
};

RainbowButton.propTypes = {
  disabled: PropTypes.bool,
  height: PropTypes.number,
  label: PropTypes.string,
  onPress: PropTypes.func,
  strokeWidth: PropTypes.number,
  type: PropTypes.oneOf(['addCash', 'small']),
  width: PropTypes.number,
};

RainbowButton.defaultProps = {
  height: 56,
  label: 'Press me',
  strokeWidth: 1,
  width: maxButtonWidth,
};

export default React.memo(RainbowButton);
