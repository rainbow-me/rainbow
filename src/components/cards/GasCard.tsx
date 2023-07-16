// @ts-expect-error
import AnimateNumber from '@bankify/react-native-animate-number';
import { useIsFocused } from '@react-navigation/native';
import * as i18n from '@/languages';
import { isNaN } from 'lodash';
import { usePrepareContractWrite, useContractWrite } from 'wagmi';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import * as abi from '../../generated';

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
import { useAccountSettings, useGas } from '@/hooks';
import { gasUtils } from '@/utils';
import { GenericCard, SQUARE_CARD_SIZE } from './GenericCard';
import {
  Account,
  createPublicClient,
  createWalletClient,
  hexToBigInt,
  http,
  parseEther,
  parseGwei,
  toHex,
} from 'viem';
import { mainnet } from 'viem/chains';
import { ETHEREUM_MAINNET_RPC } from 'react-native-dotenv';
import { loadWallet } from '@/model/wallet';
import { Wallet } from '@ethersproject/wallet';
import { parseBytes32String } from '@ethersproject/strings';
import { mintZoraEdition, withdrawETHZoraEdition } from '@/raps/zora';
import { Network } from '@/networks/types';

const transport = http(ETHEREUM_MAINNET_RPC);
const publicClient = createPublicClient({
  chain: mainnet,
  transport,
});

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
  const { accountAddress } = useAccountSettings();
  const {
    currentBlockParams,
    gasFeeParamsBySpeed,
    startPollingGasFees,
    stopPollingGasFees,
  } = useGas();

  //const { data, isLoading, isSuccess } =  abi.usePrepareZoraNftCreatorCreateDrop();

  const get = async () => {
    type ZoraSalesConfig = {
      publicSalePrice: bigint;
      maxSalePurchasePerAddress: number;
      publicSaleStart: bigint;
      publicSaleEnd: bigint;
      presaleStart: bigint;
      presaleEnd: bigint;
      presaleMerkleRoot: `0x${string}`;
    };
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
    };
    const skillet = '0xe826F1C06d5ae90E4C098459D1b7464a8dC604cA';
    type createDropArgs = [
      string,
      string,
      `0x${string}`,
      bigint,
      number,
      `0x${string}`,
      {
        publicSalePrice: bigint;
        maxSalePurchasePerAddress: number;
        publicSaleStart: bigint;
        publicSaleEnd: bigint;
        presaleStart: bigint;
        presaleEnd: bigint;
        presaleMerkleRoot: `0x${string}`;
      },
      string,
      string
    ];
    type createEditionArgs = [
      string,
      string,
      bigint,
      number,
      `0x${string}`,
      `0x${string}`,
      {
        publicSalePrice: bigint;
        maxSalePurchasePerAddress: number;
        publicSaleStart: bigint;
        publicSaleEnd: bigint;
        presaleStart: bigint;
        presaleEnd: bigint;
        presaleMerkleRoot: `0x${string}`;
      },
      string,
      string,
      string
    ];

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
        metadataContractUri,
      ];
    };

    const wallet = await loadWallet(accountAddress, false);
    console.log('post wallet');
    const account = privateKeyToAccount(wallet?.privateKey as `0x${string}`);
    const pkey = generatePrivateKey();
    console.log({ pkey });

    const args: createEditionArgs = [
      'Test Drop',
      'TEST',
      18446744073709551615n,
      5,
      account.address,
      account.address,
      {
        publicSalePrice: hexToBigInt('0x0'),
        maxSalePurchasePerAddress: 5,
        publicSaleStart: hexToBigInt('0x0'),
        publicSaleEnd: hexToBigInt('0x0'),
        presaleStart: hexToBigInt('0x00'),
        presaleEnd: hexToBigInt('0x00'),
        presaleMerkleRoot:
          '0x0000000000000000000000000000000000000000000000000000000000000000',
      },
      'Rainbow x Viem test drop from rainbow wallet 🤫',
      '',
      'https://rainbow.me/drop/zorb/favicon.ico',
    ];
    try {
      console.log('simming');

      console.log('post sim');

      console.log('post wallet');
      const walletClient = createWalletClient({
        chain: mainnet,
        transport,
        account,
      });

      console.log('about to write');
      // const sendHash = await walletClient.sendTransaction({
      //   account,
      //   to: skillet,
      //   value: parseEther('0.001'),
      //   gas: gasEstimate
      // })
      // console.log({sendHash})

      // const gas = await publicClient.estimateContractGas({
      //   account,
      //   address: '0xF74B146ce44CC162b601deC3BE331784DB111DC1',
      //   abi: abi.zoraNftCreatorABI,
      //   functionName: 'createEdition',
      //   args: args
      // })

      // const { request } = await publicClient.simulateContract({
      //   account,
      //   address: '0xF74B146ce44CC162b601deC3BE331784DB111DC1',
      //   abi: abi.zoraNftCreatorABI,
      //   functionName: 'createEdition',
      //   args: args,
      //   gas,
      // })

      //const hash = await walletClient.writeContract(request)

      const testDropAddress = '0x95897b34bdb3b52fdd3516d96fd900488d2d47ae';

      // parsing contract date: new Date(Number(drop.collection.salesConfig.presaleEnd) * 1000),
      const saleDetails = await publicClient.readContract({
        account,
        address: testDropAddress,
        abi: abi.zoraDropABI,
        functionName: 'saleDetails',
      });

      const zoraFee = await publicClient.readContract({
        account,
        address: testDropAddress,
        abi: abi.zoraDropABI,
        functionName: 'zoraFeeForAmount',
        args: [1n],
      });

      const newDate = new Date();

      //console.log(newDate.toUTCString);
      const starttime = BigInt(newDate.getTime()) / 1000n;
      const endDate = new Date(newDate.setFullYear(newDate.getFullYear() + 1));
      const endDateBigInt = BigInt(endDate.getTime()) / 1000n;

      // const { request: setSales }= await publicClient.simulateContract({
      //   account,
      //   address: testDropAddress,
      //   abi: abi.zoraDropABI,
      //   functionName: 'setSaleConfiguration',
      //   args: [zoraFee[1], 5, starttime, endDateBigInt, hexToBigInt('0x0'), hexToBigInt('0x0'), '0x0000000000000000000000000000000000000000000000000000000000000000'],
      // })

      // const salesHash = await walletClient.writeContract(setSales);
      // console.log({salesHash})

      // console.log('minting');
      // const hash = await mintZoraEdition({accountAddress: accountAddress as `0x${string}`, contractAddress: testDropAddress, network: Network.mainnet, quantity: 4n})
      //  console.log({hash})

      console.log('withdrawing eth');
      const hash = await withdrawETHZoraEdition({
        accountAddress: accountAddress as `0x${string}`,
        contractAddress: testDropAddress,
        network: Network.mainnet,
      });
      console.log({ hash });
    } catch (e) {
      console.log(e);
    }
  };

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

  const currentGwei = useMemo(() => data, [data]);
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
    get();
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
