import { capitalize } from 'lodash';
import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import ButtonPressAnimation from './animations/ButtonPressAnimation';
import ChainBadge from './coin-icon/ChainBadge';
import { Column, Row } from './layout';
import { Text } from './text';
import { lightModeThemeColors, position } from '@rainbow-me/styles';

const L2Disclaimer = ({ assetType, colors, onPress, sending, symbol }) => {
  const gradientColors = ['#FFFFFF', '#F0F2F5'];
  const radialGradientProps = {
    center: [0, 1],
    colors: [
      lightModeThemeColors.alpha(gradientColors[0], 0.1),
      lightModeThemeColors.alpha(gradientColors[1], 0.08),
    ],
    pointerEvents: 'none',
    style: {
      ...position.coverAsObject,
      overflow: 'hidden',
    },
  };
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.99}>
      <Row
        background={colors.red}
        borderRadius={16}
        marginBottom={19}
        marginLeft={15}
        marginRight={15}
        padding={10}
      >
        <RadialGradient
          {...radialGradientProps}
          borderRadius={21}
          radius={81}
        />
        <Column>
          <ChainBadge
            assetType={assetType}
            badgeXPosition={-3}
            badgeYPosition={-15}
          />
        </Column>
        <Column marginLeft={40}>
          <Text
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            size="smedium"
            weight="bold"
          >
            {sending ? `Sending` : `This ${symbol} is`} on the{' '}
            {capitalize(assetType)} network
          </Text>
        </Column>
        <Column align="end" flex={1} justify="end">
          <Text color={colors.alpha(colors.blueGreyDark, 0.6)} size="smedium">
            􀅵
          </Text>
        </Column>
      </Row>
    </ButtonPressAnimation>
  );
};

export default L2Disclaimer;
