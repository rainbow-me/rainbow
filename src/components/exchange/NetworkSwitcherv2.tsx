import React, { useEffect, useRef } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import RadialGradient from 'react-native-radial-gradient';
import Divider from '../Divider';
import { ButtonPressAnimation } from '../animations';
import { CoinIcon } from '../coin-icon';
import ChainBadge from '../coin-icon/ChainBadge';
import { Box, Columns, Inline, Text } from '@/design-system';
import { AssetType } from '@/entities';
import { Network } from '@/helpers';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import { ETH_ADDRESS, ETH_SYMBOL } from '@rainbow-me/references';
import { position } from '@rainbow-me/styles';
import { ethereumUtils } from '@rainbow-me/utils';
import { useTheme } from '@/theme';

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

  // if polygon is selcted intially we should scroll into view
  useEffect(() => {
    if (
      currentChainId === ethereumUtils.getChainIdFromNetwork(Network.polygon) &&
      scrollViewRef?.current
    ) {
      scrollViewRef?.current.scrollToEnd();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Box height="46px" width="full">
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20 }}
          horizontal
          ref={scrollViewRef}
          showsHorizontalScrollIndicator={false}
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
                  testID={`${testID}-${title}`}
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
                  >
                    {type === AssetType.token ? (
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
                    <Text
                      color={
                        isSelected
                          ? { custom: colors.networkColors[network] }
                          : 'secondary50'
                      }
                      size="16px"
                      weight="bold"
                    >
                      {title}
                    </Text>
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
