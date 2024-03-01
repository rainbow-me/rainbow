import React, { useRef, useMemo } from 'react';
import { ScrollView } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { ButtonPressAnimation } from '../animations';
import ChainBadge from '../coin-icon/ChainBadge';
import { Bleed, Box, Columns, Inline, Text } from '@/design-system';
import { Network } from '@/helpers';
import { position } from '@rainbow-me/styles';
import { useTheme } from '@/theme';
import { sortNetworks } from '@/networks';
import { EthCoinIcon } from '../coin-icon/EthCoinIcon';

const NetworkSwitcherv2 = ({
  currentChainId,
  setCurrentChainId,
  testID,
}: {
  currentChainId: number;
  setCurrentChainId(chainId: number): void;
  testID: string;
}) => {
  const { colors } = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const networkMenuItems = useMemo(() => {
    return sortNetworks()
      .filter(network => network.features.swaps)
      .map(network => ({
        chainId: network.id,
        network: network.value,
        title: network.name,
      }));
  }, []);

  const radialGradientProps = (network: Network) => {
    return {
      center: [0, 1],
      colors: [colors.alpha(colors.networkColors[network], 0.1), colors.alpha(colors.networkColors[network], 0.02)],
      pointerEvents: 'none',
      style: {
        ...position.coverAsObject,
        overflow: 'hidden',
      },
    };
  };

  return (
    <>
      <Box width="full" testID={`network-switcher-${currentChainId}`} paddingTop="8px" paddingBottom="16px">
        <ScrollView
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ paddingHorizontal: 20 }}
          horizontal
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={false}
          testID={'network-switcher-scroll-view'}
        >
          <Columns space="8px">
            {networkMenuItems.map(({ chainId, title, network }) => {
              const isSelected = currentChainId === chainId;
              return (
                <Box
                  as={ButtonPressAnimation}
                  height="36px"
                  key={`${testID}-${title}`}
                  // @ts-ignore overloaded props

                  onPress={() => setCurrentChainId(chainId)}
                  padding="8px"
                  testID={`${testID}-${network}`}
                >
                  {isSelected && (
                    <RadialGradient
                      {...radialGradientProps(network)}
                      // @ts-ignore overloaded props

                      borderRadius={30}
                    />
                  )}
                  <Inline alignHorizontal="center" alignVertical="center" horizontalSpace="4px" wrap={false}>
                    {network === Network.mainnet ? (
                      <EthCoinIcon size={20} />
                    ) : (
                      <ChainBadge network={network} position="relative" size="small" />
                    )}
                    <Bleed top={{ custom: android ? 2 : 0 }}>
                      <Text
                        color={isSelected ? { custom: colors.networkColors[network] } : 'secondary50 (Deprecated)'}
                        size="16px / 22px (Deprecated)"
                        weight="bold"
                        testID={`network-switcher-item-${network}`}
                      >
                        {title}
                      </Text>
                    </Bleed>
                  </Inline>
                </Box>
              );
            })}
          </Columns>
        </ScrollView>
      </Box>
    </>
  );
};

export default NetworkSwitcherv2;
