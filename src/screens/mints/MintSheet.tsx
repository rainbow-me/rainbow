import { BlurView } from '@react-native-community/blur';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { Linking, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import useWallets from '../../hooks/useWallets';
import { GasSpeedButton } from '@/components/gas';
import { Execute, getClient } from '@reservoir0x/reservoir-sdk';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { dataAddNewTransaction } from '@/redux/data';
import { HoldToAuthorizeButton } from '@/components/buttons';
import Routes from '@/navigation/routesNames';
import ImgixImage from '../../components/images/ImgixImage';
import { SlackSheet } from '../../components/sheet';
import { CardSize } from '../../components/unique-token/CardSize';
import { WrappedAlert as Alert } from '@/helpers/alert';
import {
  Box,
  ColorModeProvider,
  Column,
  Columns,
  Inline,
  Inset,
  Separator,
  Stack,
  Text,
} from '@/design-system';
import {
  useAccountProfile,
  useDimensions,
  useENSAvatar,
  useGas,
  usePersistentAspectRatio,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import styled from '@/styled-thing';
import { position } from '@/styles';
import { useTheme } from '@/theme';
import { CoinIcon, abbreviations, ethereumUtils, watchingAlert } from '@/utils';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { maybeSignUri } from '@/handlers/imgix';
import { ButtonPressAnimation } from '@/components/animations';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { ReservoirCollection } from '@/graphql/__generated__/arcDev';
import { format } from 'date-fns';
import { useLegacyNFTs } from '@/resources/nfts';
import {
  ParsedAddressAsset,
  TransactionStatus,
  TransactionType,
} from '@/entities';
import * as i18n from '@/languages';
import { analyticsV2 } from '@/analytics';
import { event } from '@/analytics/event';
import { ETH_ADDRESS, ETH_SYMBOL, ethUnits } from '@/references';
import { RainbowNetworks, getNetworkObj } from '@/networks';
import { Network } from '@/networks/types';
import { fetchReverseRecord } from '@/handlers/ens';
import { ContactAvatar } from '@/components/contacts';

import { addressHashedColorIndex } from '@/utils/profileUtils';
import { loadPrivateKey } from '@/model/wallet';
import { ChainBadge } from '@/components/coin-icon';
import { convertRawAmountToBalance, multiply } from '@/helpers/utilities';
import { RainbowError, logger } from '@/logger';
import { useDispatch } from 'react-redux';
import { QuantityButton } from './components/QuantityButton';
import { estimateGas, getProviderForNetwork } from '@/handlers/web3';
import { Alert } from '@/components/alerts';

const NFT_IMAGE_HEIGHT = 250;

const BackgroundBlur = styled(BlurView).attrs({
  blurAmount: 100,
  blurType: 'light',
})({
  ...position.coverAsObject,
});

const BackgroundImage = styled(View)({
  ...position.coverAsObject,
});

interface BlurWrapperProps {
  height: number;
  width: number;
}

const BlurWrapper = styled(View).attrs({
  shouldRasterizeIOS: true,
})({
  // @ts-expect-error missing theme types
  backgroundColor: ({ theme: { colors } }) => colors.trueBlack,
  height: ({ height }: BlurWrapperProps) => height,
  left: 0,
  overflow: 'hidden',
  position: 'absolute',
  width: ({ width }: BlurWrapperProps) => width,
  ...(android ? { borderTopLeftRadius: 30, borderTopRightRadius: 30 } : {}),
});

interface MintSheetProps {
  collection: ReservoirCollection;
  chainId: number;
}

function MintInfoRow({
  symbol,
  label,
  value,
}: {
  symbol: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box alignItems="center">
      <Columns>
        <Column>
          <Inline space="4px" alignVertical="center">
            <Box width={{ custom: 28 }}>
              <Text color="labelTertiary" size="15pt" weight="medium">
                {symbol}
              </Text>
            </Box>

            <Text color="labelTertiary" size="17pt" weight="medium">
              {label}
            </Text>
          </Inline>
        </Column>
        <Column>{value}</Column>
      </Columns>
    </Box>
  );
}

const MintSheet = () => {
  const params = useRoute();
  const { collection: mintCollection } = params.params as MintSheetProps;
  const { accountAddress } = useAccountProfile();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate, goBack } = useNavigation();
  const dispatch = useDispatch();
  const { colors, isDarkMode } = useTheme();
  const { isReadOnlyWallet } = useWallets();

  const currentNetwork =
    RainbowNetworks.find(({ id }) => id === mintCollection.chainId)?.value ||
    Network.mainnet;

  const txsRef = useRef<string[]>([]);

  const maxMintsPerWallet =
    mintCollection.mintStages?.find(item => item?.stage === 'public-sale')
      ?.maxMintsPerWallet || 3;

  const [quantity, setQuantity] = useReducer(
    (quantity: number, increment: number) => {
      if (quantity === 1 && increment === -1) {
        return quantity;
      }
      if (
        maxMintsPerWallet &&
        quantity === maxMintsPerWallet &&
        increment === 1
      ) {
        return quantity;
      }

      return quantity + increment;
    },
    1
  );

  const {
    updateTxFee,
    startPollingGasFees,
    stopPollingGasFees,
    isSufficientGas,
    isValidGas,
  } = useGas();

  const insufficientEth = isSufficientGas === false && isValidGas;

  const {
    data: { nfts },
  } = useLegacyNFTs({
    address: accountAddress,
  });
  const imageUrl = maybeSignUri(mintCollection.image || '');
  const { result: aspectRatio } = usePersistentAspectRatio(imageUrl || '');

  const getFormattedDate = (date: string) => {
    return format(new Date(date), 'MMMM dd, yyyy');
  };
  const price = mintCollection.mintStages?.find(
    item => item?.stage === 'public-sale'
  )?.price?.amount?.raw;
  /* its basically if we we have timestamps we can check a pattern,
    if they are both null, then if theres a price we are vibing and can mint forever 

*/
  const isMintingAvailable =
    mintCollection.isMintingPublicSale ||
    mintCollection.mintStages?.find(item => item?.stage === 'public-sale')
      ?.price;
  console.log(
    mintCollection.mintStages?.find(item => item?.stage === 'public-sale')
  );
  console.log(mintCollection.mintStages);

  const imageColor =
    usePersistentDominantColorFromImage(imageUrl) ?? colors.paleBlue;

  const sheetRef = useRef();
  const yPosition = useSharedValue(0);

  useFocusEffect(() => {
    if (mintCollection.name && mintCollection.id) {
      analyticsV2.track(event.nftMintsOpenedSheet, {
        collectionName: mintCollection?.name,
        contract: mintCollection.id,
        network: currentNetwork,
      });
    }
  });

  useEffect(() => {
    const fetchENSName = async (address: string) => {
      const ensName = await fetchReverseRecord(address);
      setENSName(ensName);
    };

    if (mintCollection.creator) {
      fetchENSName(mintCollection.creator);
    }
  }, [mintCollection.creator]);

  // estimate gas
  useEffect(() => {
    startPollingGasFees(currentNetwork);

    return () => {
      stopPollingGasFees();
    };
  }, [currentNetwork, startPollingGasFees, stopPollingGasFees]);

  useEffect(() => {
    const estimateMintGas = async () => {
      // should disabled this and see if the broken mints will give us a limit
      updateTxFee(
        ethUnits.basic_swap,
        null,
        ethUnits.default_l1_gas_fee_optimism_swap
      );

      const networkObj = getNetworkObj(currentNetwork);
      const provider = await getProviderForNetwork(currentNetwork);
      const signer = createWalletClient({
        account: accountAddress,
        chain: networkObj,
        transport: http(networkObj.rpc),
      });

      getClient()?.actions.buyToken({
        items: [{ fillType: 'mint', collection: mintCollection.id!, quantity }],
        wallet: signer!,
        chainId: networkObj.id,
        precheck: true,
        onProgress: async (steps: Execute['steps']) => {
          steps.forEach(step => {
            if (step.error) {
              logger.error(
                new RainbowError(`NFT Mints: Gas Step Error: ${step.error}`)
              );
              // analyticsV2.track(analyticsV2.event.nftOffersAcceptedOffer, {
              //   status: 'failed',
              //   ...analyticsEventObject,
              // });
              return;
            }
            step.items?.forEach(async item => {
              // could add safety here if unable to calc gas limit
              const tx = {
                to: item.data?.to,
                from: item.data?.from,
                data: item.data?.data,
                value: multiply(price || '0', quantity),
              };
              const gas = await estimateGas(tx, provider);
              if (gas) {
                updateTxFee(gas, null);
              } else {
                console.log('ERROR CALCULATING GAS');
              }
            });
          });
        },
      });
    };

    estimateMintGas();
  }, [
    accountAddress,
    currentNetwork,
    mintCollection.id,
    price,
    quantity,
    updateTxFee,
  ]);

  const [ensName, setENSName] = useState<string>('');
  const [mintStatus, setMintStatus] = useState<
    'none' | 'minting' | 'minted' | 'error'
  >('none');

  const { data: ensAvatar } = useENSAvatar(ensName, {
    enabled: Boolean(ensName),
  });

  const deployerDisplay = abbreviations.address(
    mintCollection.creator || '',
    4,
    6
  );

  const contractAddressDisplay = `${abbreviations.address(
    mintCollection.id || '',
    4,
    6
  )} 􀄯`;

  // case where mint isnt eth? prob not with our current entrypoints
  const mintPriceDisplay = convertRawAmountToBalance(
    multiply(price || '0', quantity),
    {
      decimals: 18,
      symbol: 'ETH',
    }
  );
  const buildMintDotFunUrl = (contract: string, network: Network) => {
    const MintDotFunNetworks = [
      Network.mainnet,
      Network.optimism,
      Network.base,
      Network.zora,
    ];
    if (!MintDotFunNetworks.includes(network)) {
      // show alert mint.fun does not support
      // i18n
      Alert.alert('Mint.fun does not support this network');
    }

    let chainSlug = 'ethereum';
    switch (network) {
      case Network.optimism:
        chainSlug = 'op';
        break;
      case Network.base:
        chainSlug = 'base';
        break;
      case Network.zora:
        chainSlug = 'zora';
        break;
    }
    return `https://mint.fun/${chainSlug}/${contract}`;
  };

  const actionOnPress = useCallback(async () => {
    if (isReadOnlyWallet) {
      watchingAlert();
      return;
    }

    // link to mint.fun if reserviornot supporting
    if (!isMintingAvailable) {
      Linking.openURL(buildMintDotFunUrl(mintCollection.id!, currentNetwork));
    }

    logger.info('Minting NFT', { name: mintCollection.name });
    analyticsV2.track(event.nftMintsMintingNFT, {
      collectionName: mintCollection.name || '',
      contract: mintCollection.id || '',
      network: currentNetwork,
      quantity,
    });
    setMintStatus('minting');

    const privateKey = await loadPrivateKey(accountAddress, false);
    // @ts-ignore
    const account = privateKeyToAccount(privateKey);
    const networkObj = getNetworkObj(currentNetwork);
    const signer = createWalletClient({
      account,
      chain: networkObj,
      transport: http(networkObj.rpc),
    });

    getClient()?.actions.buyToken({
      items: [{ fillType: 'mint', collection: mintCollection.id!, quantity }],
      wallet: signer!,
      chainId: networkObj.id,
      onProgress: (steps: Execute['steps']) => {
        steps.forEach(step => {
          if (step.error) {
            logger.error(new RainbowError(`Error minting NFT: ${step.error}`));
            setMintStatus('error');
            return;
          }
          step.items?.forEach(item => {
            console.log('reservior item :', item);
            if (
              item.txHash &&
              !txsRef.current.includes(item.txHash) &&
              item.status === 'incomplete'
            ) {
              const tx = {
                to: item.data?.to,
                from: item.data?.from,
                hash: item.txHash,
                network: currentNetwork,
                amount: mintPriceDisplay.amount,
                asset: {
                  address: ETH_ADDRESS,
                  symbol: ETH_SYMBOL,
                },
                nft: {
                  predominantColor: imageColor,
                  collection: {
                    image: imageUrl,
                  },
                  lowResUrl: imageUrl,
                  name: mintCollection.name,
                },
                type: TransactionType.mint,
                status: TransactionStatus.minting,
              };

              txsRef.current.push(tx.hash);

              // @ts-expect-error TODO: fix when we overhaul tx list, types are not good
              dispatch(dataAddNewTransaction(tx));
              analyticsV2.track(event.nftMintsMintedNFT, {
                collectionName: mintCollection.name || '',
                contract: mintCollection.id || '',
                network: currentNetwork,
                quantity,
              });
              navigate(Routes.PROFILE_SCREEN);
              setMintStatus('minted');
            }
          });
        });
      },
    });
  }, [
    accountAddress,
    currentNetwork,
    dispatch,
    imageColor,
    imageUrl,
    isMintingAvailable,
    isReadOnlyWallet,
    mintCollection.id,
    mintCollection.name,
    mintPriceDisplay.amount,
    navigate,
    quantity,
  ]);

  const buttonLabel = useMemo(() => {
    if (!isMintingAvailable) {
      return i18n.t(i18n.l.minting.mint_on_mintdotfun);
    }

    if (insufficientEth) {
      return i18n.t(i18n.l.button.confirm_exchange.insufficient_eth);
    }

    if (mintStatus === 'minting') {
      return i18n.t(i18n.l.minting.minting);
    } else if (mintStatus === 'minted') {
      return i18n.t(i18n.l.minting.minted);
    } else if (mintStatus === 'error') {
      return i18n.t(i18n.l.minting.error_minting);
    }

    return i18n.t(i18n.l.minting.hold_to_mint);
  }, [insufficientEth, isMintingAvailable, mintStatus]);

  return (
    <>
      {ios && (
        <BlurWrapper height={deviceHeight} width={deviceWidth}>
          <BackgroundImage>
            <ImgixImage
              source={{ uri: imageUrl }}
              resizeMode="cover"
              size={CardSize}
              style={{ height: deviceHeight, width: deviceWidth }}
            />
            <BackgroundBlur />
          </BackgroundImage>
        </BlurWrapper>
      )}
      {/* @ts-expect-error JavaScript component */}
      <SlackSheet
        backgroundColor={
          isDarkMode
            ? `rgba(22, 22, 22, ${ios ? 0.4 : 1})`
            : `rgba(26, 26, 26, ${ios ? 0.4 : 1})`
        }
        height={'100%'}
        ref={sheetRef}
        scrollEnabled
        testID="nft-mint-sheet"
        yPosition={yPosition}
      >
        <ColorModeProvider value="darkTinted">
          <Inset horizontal={'28px'}>
            <Stack
              space="28px"
              separator={
                <Separator color={'divider40 (Deprecated)'} thickness={1} />
              }
            >
              <Stack space="28px" alignHorizontal="center">
                <Box paddingTop={'28px'}>
                  <Stack space={'28px'} alignHorizontal="center">
                    <Box
                      as={ImgixImage}
                      background="surfaceSecondaryElevated"
                      source={{ uri: imageUrl }}
                      width={{
                        custom: NFT_IMAGE_HEIGHT,
                      }}
                      height={{
                        custom: aspectRatio
                          ? NFT_IMAGE_HEIGHT / aspectRatio
                          : NFT_IMAGE_HEIGHT,
                      }}
                      borderRadius={16}
                      size={CardSize}
                      shadow={'30px'}
                    />
                  </Stack>
                </Box>

                <Box width="full">
                  <Stack space={'10px'} alignHorizontal="center">
                    <Text size="20pt" color="label" weight="heavy">
                      {mintCollection.name}
                    </Text>
                    <Inline alignVertical="center" space={'2px'}>
                      <Text size="15pt" color="labelSecondary" weight="bold">
                        {`${i18n.t(i18n.l.minting.by)} `}
                      </Text>

                      {ensAvatar?.imageUrl ? (
                        <ImgixImage
                          size={100}
                          source={{ uri: ensAvatar?.imageUrl }}
                          style={{ width: 20, height: 20, borderRadius: 10 }}
                        />
                      ) : (
                        <ContactAvatar
                          forceDarkMode
                          size="smaller"
                          value={ensName || mintCollection?.creator}
                          color={addressHashedColorIndex(
                            mintCollection?.creator || ''
                          )}
                        />
                      )}
                      <Text size="15pt" color="labelSecondary" weight="bold">
                        {` ${
                          ensName ||
                          deployerDisplay ||
                          i18n.t(i18n.l.minting.unknown)
                        }`}
                      </Text>
                    </Inline>
                  </Stack>
                </Box>

                <Stack space={'20px'}>
                  <Box style={{ width: deviceWidth - 56 }}>
                    <Separator color={'divider40 (Deprecated)'} thickness={1} />
                  </Box>

                  <Columns alignHorizontal="justify">
                    <Column width={'content'}>
                      <Stack space="10px">
                        <Text
                          color="labelSecondary"
                          align="left"
                          size="13pt"
                          weight="medium"
                        >
                          {i18n.t(i18n.l.minting.mint_price)}
                        </Text>

                        <Text
                          color="label"
                          align="left"
                          size="22pt"
                          weight="bold"
                        >
                          {mintPriceDisplay.amount === '0'
                            ? i18n.t(i18n.l.minting.free)
                            : mintPriceDisplay.display}
                        </Text>
                      </Stack>
                    </Column>

                    <Column width={'content'}>
                      <QuantityButton
                        value={quantity}
                        plusAction={() => setQuantity(1)}
                        minusAction={() => setQuantity(-1)}
                        buttonColor={imageColor}
                        // i may be being fumb here, need to check infinity mints
                        maxValue={Number(maxMintsPerWallet)}
                      />
                    </Column>
                  </Columns>

                  {/* @ts-ignore */}
                  <HoldToAuthorizeButton
                    backgroundColor={imageColor}
                    disabled={!isSufficientGas || !isValidGas}
                    hideInnerBorder
                    label={buttonLabel}
                    onLongPress={actionOnPress}
                    parentHorizontalPadding={28}
                    showBiometryIcon={!insufficientEth}
                  />

                  <Box width={{ custom: deviceWidth - 56 }}>
                    {/* @ts-ignore */}
                    <GasSpeedButton
                      asset={{
                        color: imageColor,
                      }}
                      marginTop={0}
                      horizontalPadding={0}
                      currentNetwork={currentNetwork}
                      theme={'dark'}
                      marginBottom={0}
                    />
                  </Box>
                </Stack>

                {/*
                          nPress={()=> ethereumUtils.openAddressInBlockExplorer(mintCollection?.contract, currentNetwork)} value={contractAddressDisplay} color={imageColor}

                          */}
              </Stack>

              {mintCollection.description && (
                <Stack space={'20px'}>
                  <Text color="label" align="left" size="17pt" weight="heavy">
                    {i18n.t(i18n.l.minting.description)}
                  </Text>
                  <Text
                    color="labelTertiary"
                    align="left"
                    size="17pt"
                    weight="medium"
                  >
                    {mintCollection.description}
                  </Text>
                </Stack>
              )}
              <Stack space="28px">
                {mintCollection?.tokenCount && (
                  <MintInfoRow
                    symbol="􀐾"
                    label={i18n.t(i18n.l.minting.total_minted)}
                    value={
                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {`${mintCollection.tokenCount} NFTs`}
                      </Text>
                    }
                  />
                )}
                {mintCollection?.createdAt && (
                  <MintInfoRow
                    symbol="􀐫"
                    label={i18n.t(i18n.l.minting.first_event)}
                    value={
                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {getFormattedDate(mintCollection?.createdAt)}
                      </Text>
                    }
                  />
                )}

                {mintCollection?.id && (
                  <MintInfoRow
                    symbol="􀉆"
                    label={i18n.t(i18n.l.minting.contract)}
                    value={
                      <ButtonPressAnimation
                        onPress={() =>
                          ethereumUtils.openAddressInBlockExplorer(
                            mintCollection.id!,
                            currentNetwork
                          )
                        }
                      >
                        <Text
                          color={{ custom: imageColor }}
                          align="right"
                          size="17pt"
                          weight="medium"
                        >
                          {contractAddressDisplay}
                        </Text>
                      </ButtonPressAnimation>
                    }
                  />
                )}

                <MintInfoRow
                  symbol="􀤆"
                  label={i18n.t(i18n.l.minting.network)}
                  value={
                    <Inset vertical={{ custom: -4 }}>
                      <Inline
                        space="4px"
                        alignVertical="center"
                        alignHorizontal="right"
                      >
                        {currentNetwork === Network.mainnet ? (
                          <CoinIcon
                            address={ETH_ADDRESS}
                            size={16}
                            symbol={ETH_SYMBOL}
                            forceFallback={undefined}
                            shadowColor={undefined}
                            style={undefined}
                          />
                        ) : (
                          <ChainBadge
                            assetType={currentNetwork}
                            position="relative"
                            size="small"
                            forceDark={true}
                          />
                        )}
                        <Text
                          color="labelSecondary"
                          align="right"
                          size="17pt"
                          weight="medium"
                        >
                          {`${getNetworkObj(currentNetwork).name}`}
                        </Text>
                      </Inline>
                    </Inset>
                  }
                />
              </Stack>
            </Stack>
          </Inset>
          <Box height={{ custom: 56 }}></Box>
        </ColorModeProvider>
      </SlackSheet>
    </>
  );
};

export default MintSheet;
