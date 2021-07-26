import { capitalize } from 'lodash';
import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import ButtonPressAnimation from './animations/ButtonPressAnimation';
import ChainIcon from './coin-icon/ChainIcon';
import { Column, Row } from './layout';
import { Text } from './text';
import { position } from '@rainbow-me/styles';

const L2Disclaimer = ({ assetType, colors, onPress, sending, symbol }) => {
  const radialGradientProps = {
    center: [0, 1],
    colors: colors.gradients.lightGreyWhite,
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
        <Column justify="center">
          <ChainIcon assetType={assetType} size="medium" />
        </Column>
        <Column justify="center" marginLeft={8} width="80%">
          <Text
            align="left"
            color={colors.alpha(colors.blueGreyDark, 0.6)}
            numberOfLines={2}
            size="smedium"
            weight="bold"
          >
            {sending ? `Sending` : `This ${symbol} is`} on the{' '}
            {capitalize(assetType)} network
          </Text>
        </Column>
        <Column align="center" flex={1} justify="center">
          <Text color={colors.alpha(colors.blueGreyDark, 0.3)} size="large">
            􀅵
          </Text>
        </Column>
      </Row>
    </ButtonPressAnimation>
  );
};

export default L2Disclaimer;
