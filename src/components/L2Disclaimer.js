import { capitalize } from 'lodash';
import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import ButtonPressAnimation from './animations/ButtonPressAnimation';
import ChainBadge from './coin-icon/ChainBadge';
import { Column, Row } from './layout';
import { Text, TruncatedText } from './text';
import { position } from '@rainbow-me/styles';

const L2Disclaimer = ({ assetType, colors, onPress, sending, symbol }) => {
  const { isDarkMode } = useTheme();
  const gradientColors = ['#F0F2F5', '#FFFFFF'];
  const radialGradientProps = {
    center: [0, 1],
    colors: [
      colors.alpha(gradientColors[0], isDarkMode ? 0.05 : 0.5),
      colors.alpha(gradientColors[1], isDarkMode ? 0.01 : 0.5),
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
          borderRadius={16}
          radius={600}
        />
        <Column>
          <ChainBadge
            assetType={assetType}
            badgeXPosition={-10}
            badgeYPosition={-15}
          />
        </Column>
        <Column marginLeft={27} width="80%">
          <TruncatedText
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            size="smedium"
            weight="bold"
          >
            {sending ? `Sending` : `This ${symbol} is`} on the{' '}
            {capitalize(assetType)} network
          </TruncatedText>
        </Column>
        <Column align="end" flex={1} justify="end">
          <Text color={colors.alpha(colors.blueGreyDark, 0.3)} size="smedium">
            􀅵
          </Text>
        </Column>
      </Row>
    </ButtonPressAnimation>
  );
};

export default L2Disclaimer;
