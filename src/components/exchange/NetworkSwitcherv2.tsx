import React, { useEffect, useRef } from 'react';
import { ScrollView } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import ChainBadge from '../coin-icon/ChainBadge';
import { Bleed, Box, Columns, Inline, Text } from '@/design-system';
import { AssetType } from '@/entities';
import { Network } from '@/helpers';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import { ETH_ADDRESS, ETH_SYMBOL } from '@rainbow-me/references';
import { position } from '@rainbow-me/styles';
import { ethereumUtils } from '@rainbow-me/utils';
import { useTheme } from '@/theme';
import { useIsFocused } from '@react-navigation/native';

const networkMenuItems = Object.values(networkInfo)
  .filter(({ disabled, testnet }) => !disabled && !testnet)
  .map(netInfo => ({
    chainId: ethereumUtils.getChainIdFromNetwork(netInfo.value),
    network: netInfo.value,
    title: netInfo.name,
    type: netInfo.value !== Network.mainnet ? netInfo.value : AssetType.token,
  }));

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
  const isFocused = useIsFocused();

  const radialGradientProps = (network: Network) => {
    return {
      center: [0, 1],
      colors: [
        colors.alpha(colors.networkColors[network], 0.1),
        colors.alpha(colors.networkColors[network], 0.02),
      ],
      pointerEvents: 'none',
      style: {
        ...position.coverAsObject,
        overflow: 'hidden',
      },
    };
  };

  // if polygon or optimism are selected initially we should scroll into view
  useEffect(() => {
    if (
      isFocused &&
      scrollViewRef?.current &&
      (currentChainId ===
        ethereumUtils.getChainIdFromNetwork(Network.polygon) ||
        currentChainId ===
          ethereumUtils.getChainIdFromNetwork(Network.optimism))
    ) {
      scrollViewRef?.current.scrollToEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  return (
    <>
      <Box
        width="full"
        testID="network-switcher-v2"
        paddingTop="8px"
        paddingBottom="16px"
      >
        <ScrollView
          keyboardShouldPersistTaps="always"
          contentContainerStyle={{ paddingHorizontal: 20 }}
          horizontal
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={false}
          testID={'network-switcher-v2-scroll-view'}
        >
          <Columns space="8px">
            {networkMenuItems.map(({ chainId, title, type, network }) => {
              const isSelected = currentChainId === chainId;
              return (
                <Box
                  as={ButtonPressAnimation}
                  height="36px"
                  key={`${testID}-${title}`}
                  // @ts-expect-error overloaded props from ButtonPressAnimation
                  onPress={() => setCurrentChainId(chainId)}
                  padding="8px"
                  testID={`${testID}-${network}`}
                >
                  {isSelected && (
                    <RadialGradient
                      {...radialGradientProps(network)}
                      // @ts-expect-error overloaded props from RadialGradient
                      borderRadius={30}
                    />
                  )}
                  <Inline
                    alignHorizontal="center"
                    alignVertical="center"
                    horizontalSpace="4px"
                    wrap={false}
                  >
                    {type === AssetType.token ? (
                      // @ts-expect-error Javacript Component
                      <CoinIcon
                        address={ETH_ADDRESS}
                        size={20}
                        symbol={ETH_SYMBOL}
                      />
                    ) : (
                      <ChainBadge
                        assetType={type}
                        position="relative"
                        size="small"
                      />
                    )}
                    <Bleed top={{ custom: android ? 2 : 0 }}>
                      <Text
                        color={
                          isSelected
                            ? { custom: colors.networkColors[network] }
                            : 'secondary50 (Deprecated)'
                        }
                        size="16px / 22px (Deprecated)"
                        weight="bold"
                        testID={`network-switcher-v2-item-${network}`}
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
