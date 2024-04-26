/* eslint-disable no-nested-ternary */
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import EthIcon from '@/assets/eth-icon.png';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { globalColors } from '@/design-system';
import { Network } from '@/networks/types';
import { borders, fonts } from '@/styles';
import { ThemeContextProps } from '@/theme';
import { FallbackIcon as CoinIconTextFallback, isETH } from '@/utils';
import { FastFallbackCoinIconImage } from '@/components/asset-list/RecyclerAssetList2/FastComponents/FastFallbackCoinIconImage';
import Animated, { DerivedValue, runOnJS, runOnUI, useDerivedValue } from 'react-native-reanimated';
import { uuid4 } from '@/browser/utils';

// TODO: Delete this and replace with RainbowCoinIcon
// ⚠️ When replacing this component with RainbowCoinIcon, make sure
// ⚠️ to exactly replicate the sizing and shadows defined below

const fallbackTextStyles = {
  fontFamily: fonts.family.SFProRounded,
  fontWeight: fonts.weight.bold,
  letterSpacing: fonts.letterSpacing.roundedTight,
  marginBottom: 0.5,
  textAlign: 'center',
};

const fallbackIconStyle = {
  ...borders.buildCircleAsObject(32),
  position: 'absolute',
};

const largeFallbackIconStyle = {
  ...borders.buildCircleAsObject(36),
  position: 'absolute',
};

const smallFallbackIconStyle = {
  ...borders.buildCircleAsObject(16),
  position: 'absolute',
};

/**
 * If mainnet asset is available, get the token under /ethereum/ (token) url.
 * Otherwise let it use whatever type it has
 * @param param0 - optional mainnetAddress, address and network
 * @returns a proper type and address to use for the url
 */
function resolveNetworkAndAddress({ address, mainnetAddress, network }: { mainnetAddress?: string; address: string; network: Network }) {
  if (mainnetAddress) {
    return {
      resolvedAddress: mainnetAddress,
      resolvedNetwork: Network.mainnet,
    };
  }

  return {
    resolvedAddress: address,
    resolvedNetwork: network,
  };
}

export const AnimatedSwapCoinIcon = React.memo(function FeedCoinIcon({
  address,
  color,
  iconUrl,
  disableShadow,
  forceDarkMode,
  large,
  mainnetAddress,
  network,
  small,
  symbol,
  theme,
}: {
  address: DerivedValue<string | undefined>;
  color?: DerivedValue<string | undefined>;
  iconUrl?: DerivedValue<string | undefined>;
  disableShadow?: boolean;
  forceDarkMode?: boolean;
  large?: boolean;
  mainnetAddress?: DerivedValue<string | undefined>;
  network: DerivedValue<Network | undefined>;
  small?: boolean;
  symbol: DerivedValue<string | undefined>;
  theme: ThemeContextProps;
}) {
  const [iconUrlValue, setIconUrlValue] = useState(iconUrl?.value);
  const [networkValue, setNetworkValue] = useState(network.value);
  const [sybmolValue, setSymbolValue] = useState(symbol.value);
  const [colorValue, setColorValue] = useState(color?.value);
  const [addressValue, setAddressValue] = useState(address.value);
  const [mainnetAddressValue, setMainnetAddressValue] = useState(mainnetAddress?.value);
  const iconUrlListenerId = uuid4();
  const networkListenerId = uuid4();
  const symbolListenerId = uuid4();
  const colorListenerId = uuid4();
  const addressListenerId = uuid4();
  const mainnetAddressListenerId = uuid4();

  useEffect(() => {
    const addListeners = () => {
      'worklet';
      iconUrl?.addListener(iconUrlListenerId, (value: string | undefined) => {
        runOnJS(setIconUrlValue)(value);
      });
      network.addListener(networkListenerId, (value: Network | undefined) => {
        runOnJS(setNetworkValue)(value);
      });
      symbol.addListener(symbolListenerId, (value: string | undefined) => {
        runOnJS(setSymbolValue)(value);
      });
      color?.addListener(colorListenerId, (value: string | undefined) => {
        runOnJS(setColorValue)(value);
      });
      address.addListener(addressListenerId, (value: string | undefined) => {
        runOnJS(setAddressValue)(value);
      });
      mainnetAddress?.addListener(mainnetAddressListenerId, (value: string | undefined) => {
        runOnJS(setMainnetAddressValue)(value);
      });
    };

    const removeListeners = () => {
      'worklet';
      iconUrl?.removeListener(iconUrlListenerId);
      network.removeListener(networkListenerId);
      symbol.removeListener(symbolListenerId);
      color?.removeListener(colorListenerId);
      address.removeListener(addressListenerId);
      mainnetAddress?.removeListener(mainnetAddressListenerId);
    };

    runOnUI(addListeners)();

    return () => runOnUI(removeListeners)();
  }, [
    address,
    addressListenerId,
    color,
    colorListenerId,
    iconUrl,
    iconUrlListenerId,
    mainnetAddress,
    mainnetAddressListenerId,
    network,
    networkListenerId,
    symbol,
    symbolListenerId,
  ]);

  console.log(iconUrlValue);
  const { colors } = theme;

  const { resolvedAddress, resolvedNetwork } = resolveNetworkAndAddress({
    address: addressValue ?? '',
    mainnetAddress: mainnetAddressValue ?? '',
    network: networkValue ?? Network.mainnet,
  });

  const fallbackIconColor = colorValue ?? colors.purpleUniswap;
  const shadowColor = theme.isDarkMode || forceDarkMode ? colors.shadow : colorValue || fallbackIconColor;
  const eth = isETH(resolvedAddress);

  return (
    <View style={small ? sx.containerSmall : large ? sx.containerLarge : sx.container}>
      {eth ? (
        <View
          style={[
            sx.reactCoinIconContainer,
            small ? sx.coinIconFallbackSmall : large ? sx.coinIconFallbackLarge : sx.coinIconFallback,
            small || disableShadow ? {} : sx.withShadow,
            { shadowColor },
          ]}
        >
          <Image source={EthIcon} style={small ? sx.coinIconFallbackSmall : large ? sx.coinIconFallbackLarge : sx.coinIconFallback} />
        </View>
      ) : (
        <FastFallbackCoinIconImage
          size={small ? 16 : large ? 36 : 32}
          icon={iconUrlValue}
          network={resolvedNetwork}
          shadowColor={shadowColor}
          symbol={sybmolValue ?? ''}
          theme={theme}
        >
          {() => (
            <CoinIconTextFallback
              color={colorValue}
              height={small ? 16 : large ? 36 : 32}
              style={small ? smallFallbackIconStyle : large ? largeFallbackIconStyle : fallbackIconStyle}
              symbol={sybmolValue}
              textStyles={fallbackTextStyles}
              width={small ? 16 : large ? 36 : 32}
            />
          )}
        </FastFallbackCoinIconImage>
      )}

      {network && networkValue !== Network.mainnet && !small && (
        <View style={sx.badge}>
          <ChainImage chain={networkValue} size={16} />
        </View>
      )}
    </View>
  );
});

const sx = StyleSheet.create({
  badge: {
    bottom: -0,
    left: -8,
    position: 'absolute',
    shadowColor: globalColors.grey100,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowRadius: 6,
    shadowOpacity: 0.2,
  },
  coinIconFallback: {
    borderRadius: 16,
    height: 32,
    overflow: 'visible',
    width: 32,
  },
  coinIconFallbackLarge: {
    borderRadius: 18,
    height: 36,
    overflow: 'visible',
    width: 36,
  },
  coinIconFallbackSmall: {
    borderRadius: 8,
    height: 16,
    overflow: 'visible',
    width: 16,
  },
  container: {
    elevation: 6,
    height: 32,
    overflow: 'visible',
  },
  containerLarge: {
    elevation: 6,
    height: 36,
    overflow: 'visible',
  },
  containerSmall: {
    elevation: 6,
    height: 16,
    overflow: 'visible',
  },
  reactCoinIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  withShadow: {
    elevation: 6,
    shadowOffset: {
      height: 4,
      width: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});
