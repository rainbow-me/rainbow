import lang from 'i18n-js';
import React from 'react';
import { Linking } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { Box } from '@/design-system';
import networkInfo from '@/helpers/networkInfo';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { padding, position } from '@/styles';
import { ethereumUtils } from '@/utils';
import { useTheme } from '@/theme';
import { ButtonPressAnimation } from '../animations';
import { Column, Row } from '../layout';
import { ChainBadge } from '../coin-icon';
import Divider from '../Divider';
import { Text } from '../text';
import { EthCoinIcon } from '../coin-icon/EthCoinIcon';

const AvailableNetworksv1 = ({ asset, networks, hideDivider, marginBottom = 24, marginHorizontal = 19, prominent }) => {
  const { colors } = useTheme();
  const { navigate } = useNavigation();

  const radialGradientProps = {
    center: [0, 1],
    colors: colors.gradients.lightGreyWhite,
    pointerEvents: 'none',
    style: {
      ...position.coverAsObject,
      overflow: 'hidden',
    },
  };

  const availableNetworks = Object.keys(networks).map(network => {
    return ethereumUtils.getNetworkFromChainId(Number(network));
  });

  const linkToHop = useCallback(() => {
    Linking.openURL('https://app.hop.exchange/#/send');
  }, []);

  const handleAvailableNetworksPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      networks: availableNetworks,
      onClose: linkToHop,
      tokenSymbol: asset.symbol,
      type: 'availableNetworks',
    });
  }, [navigate, availableNetworks, linkToHop, asset.symbol]);

  return (
    <>
      <ButtonPressAnimation onPress={handleAvailableNetworksPress} scaleTo={0.95}>
        <Row borderRadius={16} marginHorizontal={marginHorizontal} style={padding.object(android ? 6 : 10, 10, android ? 6 : 10, 10)}>
          <RadialGradient {...radialGradientProps} borderRadius={16} radius={600} />
          <Row justify="center">
            {availableNetworks?.map((network, index) => {
              return (
                <Box
                  background="body (Deprecated)"
                  height={{ custom: 22 }}
                  key={`availbleNetwork-${network}`}
                  marginLeft={{ custom: -6 }}
                  style={{
                    borderColor: colors.transparent,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    zIndex: index,
                  }}
                  width={{ custom: 22 }}
                  zIndex={availableNetworks?.length - index}
                >
                  {network !== 'mainnet' ? <ChainBadge network={network} position="relative" size="small" /> : <EthCoinIcon size={20} />}
                </Box>
              );
            })}
          </Row>
          <Column flex={1} justify="center" marginHorizontal={8}>
            <Text
              color={prominent ? colors.alpha(colors.blueGreyDark, 0.8) : colors.alpha(colors.blueGreyDark, 0.6)}
              numberOfLines={2}
              size="smedium"
              weight={prominent ? 'heavy' : 'bold'}
            >
              {availableNetworks?.length > 1
                ? lang.t('expanded_state.asset.available_networks', {
                    availableNetworks: availableNetworks?.length,
                  })
                : lang.t('expanded_state.asset.available_network', {
                    availableNetwork: networkInfo[availableNetworks?.[0]]?.name,
                  })}
            </Text>
          </Column>
          <Column align="end" justify="center">
            <Text align="center" color={colors.alpha(colors.blueGreyDark, 0.3)} size="smedium" weight="heavy">
              􀅵
            </Text>
          </Column>
        </Row>
      </ButtonPressAnimation>
      {hideDivider ? null : <Divider color={colors.rowDividerExtraLight} />}
    </>
  );
};

export default AvailableNetworksv1;
