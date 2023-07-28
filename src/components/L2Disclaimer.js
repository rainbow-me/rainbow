import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Divider from './Divider';
import ButtonPressAnimation from './animations/ButtonPressAnimation';
import { CoinIcon } from './coin-icon';
import ChainBadge from './coin-icon/ChainBadge';
import { Column, Row } from './layout';
import { Text } from './text';
import { isL2Asset } from '@/handlers/assets';
import { ETH_ADDRESS, ETH_SYMBOL } from '@/references';
import { padding, position } from '@/styles';
import { darkModeThemeColors } from '@/styles/colors';
import { ethereumUtils } from '@/utils';
import { getNetworkObj } from '@/networks';

const L2Disclaimer = ({
  assetType,
  colors,
  hideDivider,
  isNft = false,
  marginBottom = 24,
  marginHorizontal = 19,
  onPress,
  prominent,
  sending,
  symbol,
  verb,
  forceDarkMode,
}) => {
  const localColors = isNft ? darkModeThemeColors : colors;
  const radialGradientProps = {
    center: [0, 1],
    colors: localColors.gradients.lightGreyWhite,
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
          marginHorizontal={marginHorizontal}
          style={padding.object(android ? 6 : 10, 10, android ? 6 : 10, 10)}
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
                forceDark={forceDarkMode}
              />
            ) : (
              <CoinIcon address={ETH_ADDRESS} size={20} symbol={ETH_SYMBOL} />
            )}
          </Column>
          <Column flex={1} justify="center" marginHorizontal={8}>
            <Text
              color={
                prominent
                  ? colors.alpha(localColors.blueGreyDark, 0.8)
                  : colors.alpha(localColors.blueGreyDark, 0.6)
              }
              numberOfLines={2}
              size="smedium"
              weight={prominent ? 'heavy' : 'bold'}
            >
              {verb ? verb : sending ? `Sending` : `This ${symbol} is`} on the{' '}
              {getNetworkObj(ethereumUtils.getNetworkFromType(assetType)).name}{' '}
              network
            </Text>
          </Column>
          <Column align="end" justify="center">
            <Text
              align="center"
              color={colors.alpha(localColors.blueGreyDark, 0.3)}
              size="smedium"
              weight="heavy"
            >
              􀅵
            </Text>
          </Column>
        </Row>
      </ButtonPressAnimation>
      {hideDivider ? null : (
        <Divider color={localColors.rowDividerExtraLight} />
      )}
    </>
  );
};

export default L2Disclaimer;
