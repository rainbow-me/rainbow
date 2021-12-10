import { capitalize } from 'lodash';
import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Divider from './Divider';
import ButtonPressAnimation from './animations/ButtonPressAnimation';
import { CoinIcon } from './coin-icon';
import ChainBadge from './coin-icon/ChainBadge';
import { Column, Row } from './layout';
import { Text } from './text';
import { isL2Asset } from '@rainbow-me/handlers/assets';
import { ETH_ADDRESS, ETH_SYMBOL } from '@rainbow-me/references';
import { padding, position } from '@rainbow-me/styles';

const L2Disclaimer = ({
  assetType,
  colors,
  hideDivider,
  marginBottom = 24,
  onPress,
  prominent,
  sending,
  symbol,
  verb,
}) => {
  const radialGradientProps = {
    center: [0, 1],
    colors: colors.gradients.lightGreyWhite,
    pointerEvents: 'none',
    style: {
      ...position.coverAsObject,
      overflow: 'hidden',
    },
  };

  const isL2 = isL2Asset(assetType);

  return (
    <>
      <ButtonPressAnimation
        marginBottom={marginBottom}
        onPress={onPress}
        scaleTo={0.95}
      >
        <Row
          borderRadius={16}
          css={padding(android ? 6 : 10, 10, android ? 6 : 10, 10)}
          marginHorizontal={19}
        >
          <RadialGradient
            {...radialGradientProps}
            borderRadius={16}
            radius={600}
          />
          <Column justify="center">
            {isL2 ? (
              <ChainBadge
                assetType={assetType}
                position="relative"
                size="small"
              />
            ) : (
              <CoinIcon address={ETH_ADDRESS} size={20} symbol={ETH_SYMBOL} />
            )}
          </Column>
          <Column flex={1} justify="center" marginHorizontal={8}>
            <Text
              color={
                prominent
                  ? colors.alpha(colors.blueGreyDark, 0.8)
                  : colors.alpha(colors.blueGreyDark, 0.6)
              }
              numberOfLines={2}
              size="smedium"
              weight={prominent ? 'heavy' : 'bold'}
            >
              {verb ? verb : sending ? `Sending` : `This ${symbol} is`} on the{' '}
              {capitalize(assetType)} network
            </Text>
          </Column>
          <Column align="end" justify="center">
            <Text
              align="center"
              color={colors.alpha(colors.blueGreyDark, 0.3)}
              size="smedium"
              weight="heavy"
            >
              􀅵
            </Text>
          </Column>
        </Row>
      </ButtonPressAnimation>
      {hideDivider ? null : <Divider color={colors.rowDividerExtraLight} />}
    </>
  );
};

export default L2Disclaimer;
