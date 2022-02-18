import { capitalize } from 'lodash';
import React from 'react';
import RadialGradient from 'react-native-radial-gradient';
import Divider from './Divider';
import ButtonPressAnimation from './animations/ButtonPressAnimation';
import ChainBadge from './coin-icon/ChainBadge';
import { Column, Row } from './layout';
import { Text } from './text';
import { padding, position } from '@rainbow-me/styles';
import { darkModeThemeColors } from '@rainbow-me/styles/colors';

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
            <ChainBadge
              assetType={assetType}
              position="relative"
              size="small"
            />
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
              {capitalize(assetType)} network
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
