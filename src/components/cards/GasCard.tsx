// @ts-expect-error
import AnimateNumber from '@bankify/react-native-animate-number';
import { useIsFocused } from '@react-navigation/native';
import * as i18n from '@/languages';
import { isNaN } from 'lodash';
import { usePrepareContractWrite, useContractWrite} from 'wagmi'
import * as abi from '../../generated'

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  AccentColorProvider,
  Box,
  globalColors,
  Stack,
  Text,
} from '@/design-system';
import { add } from '@/helpers/utilities';
import { useGas } from '@/hooks';
import { gasUtils } from '@/utils';
import { GenericCard, SQUARE_CARD_SIZE } from './GenericCard';
import { createPublicClient, decodeFunctionData, hexToBigInt, http, toHex, } from 'viem'
import { mainnet } from 'viem/chains'
import { ETHEREUM_MAINNET_RPC } from 'react-native-dotenv';
import { simulateContract } from 'viem/dist/types/actions/public/simulateContract';

const transport = http(ETHEREUM_MAINNET_RPC)
const publicClient = createPublicClient({ 
  chain: mainnet,
  transport
})


type AnimationConfigOptions = {
  duration: number;
  easing: Animated.EasingFunction;
};

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
  const [data, setData] = useState(0);
  const {
    currentBlockParams,
    gasFeeParamsBySpeed,
    startPollingGasFees,
    stopPollingGasFees,
  } = useGas();

  //const { data, isLoading, isSuccess } =  abi.usePrepareZoraNftCreatorCreateDrop();

useEffect(()=>{
  const get = async ()=>{
    const data = await publicClient.readContract({
      address: abi.zoraNftCreatorAddress[1],
      abi: abi.zoraNftCreatorABI,
      functionName: 'contractVersion',
    })
    console.log('!!!!!!!!!!!!!!')
    console.log({data})
    setData(data)
    console.log('!!!!!!!!!!!!!!')
    type ZoraSalesConfig = {
      publicSalePrice: bigint,
      maxSalePurchasePerAddress: number,
      publicSaleStart: bigint,
      publicSaleEnd:  bigint,
      presaleStart: bigint,
      presaleEnd:  bigint,
      presaleMerkleRoot: `0x${string}`,
      
    }
    type CreateDropArgs = {
      name: string;
      symbol: string;
      defaultAdmin: `0x${string}`;
      editionSize: number;
      royaltyBPS: number;
      fundsRecipient: `0x${string}`;
      metadataURIBase: string;
      metadataContractUri: `0x${string}`;
      salesConfig: ZoraSalesConfig;
    }
    const skillet = '0xe826F1C06d5ae90E4C098459D1b7464a8dC604cA'
    type createDropArgs = [string, string, `0x${string}`, bigint, number, `0x${string}`, { publicSalePrice: bigint; maxSalePurchasePerAddress: number; publicSaleStart: bigint; publicSaleEnd: bigint; presaleStart: bigint; presaleEnd: bigint; presaleMerkleRoot: `0x${string}`; }, string, string]

    const buildDropArgs = ({
      name,
      symbol,
      defaultAdmin,  
      editionSize,
      royaltyBPS,
      fundsRecipient,
      metadataURIBase,
      metadataContractUri,
      salesConfig,
    }: CreateDropArgs): createDropArgs => {
      return [
         name,
        symbol,
        defaultAdmin,
        hexToBigInt(toHex(editionSize)),
        royaltyBPS,
        fundsRecipient,
        salesConfig,
        metadataURIBase,
        metadataContractUri
      ]

    }

    const args: createDropArgs = [
        'test',
        'tst',
        skillet,
        hexToBigInt('0x01'),
        5,
        skillet,
        {
          publicSalePrice: hexToBigInt('0x01'),
          maxSalePurchasePerAddress: 5,
          publicSaleStart: hexToBigInt('0x01'),
          publicSaleEnd:  hexToBigInt('0x01'),
          presaleStart: hexToBigInt('0x01'),
          presaleEnd:  hexToBigInt('0x01'),
          presaleMerkleRoot: '0x01',
        },
        'https://rainbow.me/drop/zorb/favicon.ico',
        '0xnone'
    ]
    const { request } = await publicClient.simulateContract({
      account: '0xe826F1C06d5ae90E4C098459D1b7464a8dC604cA',
      address: abi.zoraNftCreatorAddress[1],
      abi: abi.zoraNftCreatorABI,
      functionName: 'createDrop',
      args: args
    })



  
  }

  get();
})
 


  const isFocused = useIsFocused();
  const [lastKnownGwei, setLastKnownGwei] = useState('');

  const container = useSharedValue(1);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  // Listen to gas prices
  useEffect(() => {
    if (isFocused) {
      startPollingGasFees();
    } else {
      stopPollingGasFees();
    }
  }, [isFocused, startPollingGasFees, stopPollingGasFees]);

  const { NORMAL } = gasUtils;

  const currentGwei = useMemo(
    () =>
      data,
    [data]
  );
  const isCurrentGweiLoaded = currentGwei && Number(currentGwei) > 0;

  const renderGweiText = useCallback(
    // @ts-expect-error passed to an untyped JS component
    animatedNumber => {
      const priceText =
        animatedNumber === 0
          ? isCurrentGweiLoaded
            ? Math.round(Number(currentGwei))
            : Math.round(Number(lastKnownGwei)) || '􀖇'
          : animatedNumber;
      return (
        <Text color="accent" size="44pt" weight="bold">
          {priceText}
        </Text>
      );
    },
    [currentGwei, isCurrentGweiLoaded, lastKnownGwei]
  );

  // @ts-expect-error passed to an untyped JS component
  const formatGasPrice = useCallback(animatedValue => {
    if (animatedValue === null || isNaN(animatedValue)) {
      return 0;
    } else {
      return Math.round(animatedValue);
    }
  }, []);

  const handlePress = useCallback(() => {
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
  }, [container, opacity, scale]);

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
      isCurrentGweiLoaded &&
      Math.round(Number(currentGwei)) !== Math.round(Number(lastKnownGwei))
    ) {
      setLastKnownGwei(currentGwei);
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
    currentGwei,
    isCurrentGweiLoaded,
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
  }, [currentGwei, lastKnownGwei]);

  const pulseStyle = useAnimatedStyle(() => {
    const color = getColorForGwei(currentGwei, lastKnownGwei);

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
  }, [currentGwei, lastKnownGwei]);

  return (
    <Animated.View style={containerStyle}>
      <GenericCard onPress={handlePress} testID="gas-button" type="square">
        <AccentColorProvider
          color={getColorForGwei(currentGwei, lastKnownGwei)}
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
                value={currentGwei || lastKnownGwei}
              />
              <Text color="accent" size="17pt" weight="bold">
                {!isCurrentGweiLoaded && !lastKnownGwei
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
                  !isCurrentGweiLoaded && !lastKnownGwei
                    ? 'labelTertiary'
                    : 'labelSecondary'
                }
                size="20pt"
                weight="bold"
              >
                {getCurrentPriceComparison(currentGwei, lastKnownGwei)}
              </Text>
            </Stack>
          </Box>
        </AccentColorProvider>
      </GenericCard>
    </Animated.View>
  );
};
