// @ts-expect-error
import AnimateNumber from '@bankify/react-native-animate-number';
import { useIsFocused } from '@react-navigation/native';
import * as i18n from '@/languages';
import { isNaN, truncate } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Routes from '@/navigation/routesNames';

import {
  AccentColorProvider,
  Box,
  globalColors,
  Stack,
  Text,
} from '@/design-system';
import { add } from '@/helpers/utilities';
import { useAccountSettings } from '@/hooks';
import { gasUtils } from '@/utils';
import { GenericCard, SQUARE_CARD_SIZE } from './GenericCard';
import { arcClient, arcDevClient } from '@/graphql';
import { getZoraNetworkObject } from '@/networks/zora';
import { useNavigation } from '@/navigation';
import { getOptimismNetworkObject } from '@/networks/optimism';

type AnimationConfigOptions = {
  duration: number;
  easing: Animated.EasingFunction;
};

const mints = {
  OP: {
    addy: '0xcB0Bb5D835A47584fdA53F57bb4193B28d2738dB',
    chain: getOptimismNetworkObject().id
  },
  Zora: {
    addy: '0x81eCE04F2aFadCfb1c06f8331de8cba253564Ec1',
    chain: getZoraNetworkObject().id
  },
  Eth: {
    addy: '0x932261f9Fc8DA46C4a22e31B45c4De60623848bF',
    chain: 1
  }
}
const TRANSLATIONS = i18n.l.cards.gas;

const containerConfig = {
  damping: 15,
  mass: 1,
  stiffness: 200,
};
const pulseConfig = {
  damping: 66,
  mass: 1,
  stiffness: 333,
};
const fadeOutConfig: AnimationConfigOptions = {
  duration: 600,
  easing: Easing.bezierFn(0.76, 0, 0.24, 1),
};

export const GasCard = () => {
  const isFocused = useIsFocused();
  const [lastKnownGwei, setLastKnownGwei] = useState('');
  const { accountAddress} = useAccountSettings();
  const { navigate} = useNavigation();

  const container = useSharedValue(1);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);



  const { NORMAL } = gasUtils;




  const renderGweiText = useCallback(
    // @ts-expect-error passed to an untyped JS component
    animatedNumber => {
      const priceText =
       'lol'
      return (
        <Text color="accent" size="44pt" weight="bold">
          {priceText}
        </Text>
      );
    },
    []
  );

  // @ts-expect-error passed to an untyped JS component
  const formatGasPrice = useCallback(animatedValue => {
    if (animatedValue === null || isNaN(animatedValue)) {
      return 0;
    } else {
      return Math.round(animatedValue);
    }
  }, []);

  const handlePress = useCallback(async () => {
    try{ 
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR);
     // navigate(Routes.NOTIFICATIONS_PROMO_SHEET);
      // const res = await arcDevClient.getSingleCollection({walletAddress: accountAddress, contractAddress: mints.Zora.addy, chain: mints.Zora.chain})
      // console.log('posty');
      // console.log({res});
      // navigate(Routes.MINT_SHEET, {collection: res.getSingleCollection?.collection})

    } catch (e)
{
  console.log(e)
}

  }, [accountAddress, navigate]);

  const getColorForGwei = (currentGwei: string, lastKnownGwei: string) => {
    'worklet';
    const gwei =
      Math.round(Number(currentGwei)) || Math.round(Number(lastKnownGwei));

    if (!gwei) {
      return globalColors.grey60;
    } else if (gwei < 40) {
      return globalColors.green60;
    } else if (gwei < 100) {
      return globalColors.blue60;
    } else if (gwei < 200) {
      return globalColors.orange60;
    } else {
      return globalColors.pink60;
    }
  };

  const getCurrentPriceComparison = (
    currentGwei: string,
    lastKnownGwei: string
  ) => {
    const gwei =
      Math.round(Number(currentGwei)) || Math.round(Number(lastKnownGwei));

    if (!gwei) {
      return i18n.t(TRANSLATIONS.loading);
    } else if (gwei < 30) {
      return i18n.t(TRANSLATIONS.very_low);
    } else if (gwei < 40) {
      return i18n.t(TRANSLATIONS.low);
    } else if (gwei < 100) {
      return i18n.t(TRANSLATIONS.average);
    } else if (gwei < 200) {
      return i18n.t(TRANSLATIONS.high);
    } else {
      return i18n.t(TRANSLATIONS.surging);
    }
  };

  useEffect(() => {
    if (
    true
    ) {
      setLastKnownGwei('66');
      opacity.value = 0;
      scale.value = 0;
      container.value = withSequence(
        withSpring(1.04, containerConfig),
        withSpring(1, pulseConfig)
      );
      opacity.value = withSequence(
        withSpring(1, pulseConfig),
        withTiming(0, fadeOutConfig),
        withTiming(0, { duration: 0 })
      );
      scale.value = withSequence(
        withSpring(1, pulseConfig),
        withTiming(1, fadeOutConfig),
        withTiming(0, { duration: 0 })
      );
    }
  }, [
    container,
    lastKnownGwei,
    opacity,
    scale,
  ]);

  const containerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: 1 * container.value,
        },
      ],
    };
  }, [ lastKnownGwei]);

  const pulseStyle = useAnimatedStyle(() => {
    const color = getColorForGwei('66', lastKnownGwei);

    return {
      backgroundColor: color,
      borderRadius: 20,
      height: SQUARE_CARD_SIZE,
      opacity: 0.08 * opacity.value,
      transform: [
        {
          scale: 1 * scale.value,
        },
      ],
      width: SQUARE_CARD_SIZE,
    };
  }, [ lastKnownGwei]);

  return (
    <Animated.View style={containerStyle}>
      <GenericCard onPress={handlePress} testID="gas-button" type="square">
        <AccentColorProvider
          color={getColorForGwei('66', lastKnownGwei)}
        >
          <Box as={Animated.View} position="absolute" style={pulseStyle} />
          <Box
            height="full"
            width="full"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <Stack space={{ custom: 14 }}>
              <AnimateNumber
                formatter={formatGasPrice}
                interval={2}
                renderContent={renderGweiText}
                timing={(t: number) => 1 - --t * t * t * t}
                value={'66' || lastKnownGwei}
              />
              <Text color="accent" size="17pt" weight="bold">
                { !lastKnownGwei
                  ? ''
                  : i18n.t(TRANSLATIONS.gwei)}
              </Text>
            </Stack>
            <Stack space="10px">
              <Text color="labelTertiary" size="13pt" weight="bold">
                {i18n.t(TRANSLATIONS.network_fees)}
              </Text>
              <Text
                color={
                !lastKnownGwei
                    ? 'labelTertiary'
                    : 'labelSecondary'
                }
                size="20pt"
                weight="bold"
              >
                {getCurrentPriceComparison('66', lastKnownGwei)}
              </Text>
            </Stack>
          </Box>
        </AccentColorProvider>
      </GenericCard>
    </Animated.View>
  );
};
