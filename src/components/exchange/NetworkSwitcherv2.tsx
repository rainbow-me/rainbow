import React, { useRef, useMemo } from 'react';
import { ScrollView } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { ButtonPressAnimation } from '../animations';
import ChainBadge from '../coin-icon/ChainBadge';
import { Bleed, Box, Columns, Inline, Text } from '@/design-system';
import { position } from '@rainbow-me/styles';
import { useTheme } from '@/theme';
import { EthCoinIcon } from '../coin-icon/EthCoinIcon';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

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
    return Object.values(useBackendNetworksStore.getState().getDefaultChains())
      .filter(chain => useBackendNetworksStore.getState().getSupportedChainIds().includes(chain.id))
      .map(chain => ({
        chainId: chain.id,
        title: useBackendNetworksStore.getState().getChainsLabel()[chain.id],
      }));
  }, []);

  const radialGradientProps = (chainId: ChainId) => {
    return {
      center: [0, 1],
      colors: [colors.alpha(colors.networkColors[chainId], 0.1), colors.alpha(colors.networkColors[chainId], 0.02)],
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
            {networkMenuItems.map(({ chainId, title }) => {
              const isSelected = currentChainId === chainId;
              return (
                <Box
                  as={ButtonPressAnimation}
                  height="36px"
                  key={`${testID}-${title}`}
                  // @ts-ignore overloaded props

                  onPress={() => setCurrentChainId(chainId)}
                  padding="8px"
                  testID={`${testID}-${chainId}`}
                >
                  {isSelected && (
                    <RadialGradient
                      {...radialGradientProps(chainId)}
                      // @ts-ignore overloaded props

                      borderRadius={30}
                    />
                  )}
                  <Inline alignHorizontal="center" alignVertical="center" horizontalSpace="4px" wrap={false}>
                    {chainId === ChainId.mainnet ? (
                      <EthCoinIcon size={20} />
                    ) : (
                      <ChainBadge chainId={chainId} position="relative" size="small" />
                    )}
                    <Bleed top={{ custom: android ? 2 : 0 }}>
                      <Text
                        color={isSelected ? { custom: colors.networkColors[chainId] } : 'secondary50 (Deprecated)'}
                        size="16px / 22px (Deprecated)"
                        weight="bold"
                        testID={`network-switcher-item-${chainId}`}
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
