import { BlurView } from '@react-native-community/blur';

import React, {
  ReactNode,
  ReducerState,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import { ColorValue, Linking, View } from 'react-native';
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
import {
  SheetActionButton,
  SheetActionButtonRow,
  SlackSheet,
} from '../../components/sheet';
import { CardSize } from '../../components/unique-token/CardSize';
import {
  Bleed,
  Box,
  ColorModeProvider,
  Column,
  Columns,
  DebugLayout,
  Heading,
  HeadingProps,
  Inline,
  Inset,
  Row,
  Rows,
  Separator,
  Space,
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
import {
  CoinIcon,
  abbreviations,
  ethereumUtils,
  gasUtils,
  watchingAlert,
} from '@/utils';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { maybeSignUri } from '@/handlers/imgix';
import { ButtonPressAnimation } from '@/components/animations';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { MintCollection } from '@/graphql/__generated__/arcDev';
import { format } from 'date-fns';
import { arcClient, arcDevClient } from '@/graphql';
import Spinner from '@/components/Spinner';
import { delay } from '@/utils/delay';
import { useLegacyNFTs } from '@/resources/nfts';
import {
  ParsedAddressAsset,
  TransactionStatus,
  TransactionType,
  UniqueAsset,
} from '@/entities';
import { IS_DEV, IS_IOS } from '@/env';
import * as i18n from '@/languages';
import { PoapMintError } from '@/utils/poaps';
import { analyticsV2 } from '@/analytics';
import { event } from '@/analytics/event';
import { ETH_ADDRESS, ETH_SYMBOL, ethUnits } from '@/references';
import { RainbowNetworks, getNetworkObj } from '@/networks';
import { Network } from '@/networks/types';
import { UniqueTokenImage } from '@/components/unique-token';
import { fetchReverseRecord } from '@/handlers/ens';
import { ContactAvatar } from '@/components/contacts';
import ImageAvatar from '@/components/contacts/ImageAvatar';
import { addressHashedColorIndex } from '@/utils/profileUtils';
import { loadPrivateKey } from '@/model/wallet';
import { current } from 'immer';
import { ChainBadge } from '@/components/coin-icon';
import {
  convertRawAmountToBalance,
  handleSignificantDecimals,
  multiply,
} from '@/helpers/utilities';
import { RainbowError, logger } from '@/logger';
import { useDispatch } from 'react-redux';
import { DOGConfetti } from '@/components/floating-emojis/DOGConfetti';
import { QuantityButton } from './components/QuantityButton';
import {
  estimateGas,
  estimateGasLimit,
  getProviderForNetwork,
} from '@/handlers/web3';

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
  collection: MintCollection;
}

type PoapClaimStatus = 'none' | 'claiming' | 'claimed' | 'error';

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
    <Box height="36px" alignItems="center">
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
  const mintCollection = (params.params as MintSheetProps)?.collection;
  const { accountAddress } = useAccountProfile();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate, goBack } = useNavigation();
  const dispatch = useDispatch();
  const { colors, isDarkMode, lightScheme } = useTheme();
  const { isReadOnlyWallet } = useWallets();
  const currentNetwork =
    RainbowNetworks.find(({ id }) => id === mintCollection.chainId)?.value ||
    Network.mainnet;
  getNetworkObj(currentNetwork).nativeCurrency;

  const didErrorRef = useRef<boolean>(false);
  const didCompleteRef = useRef<boolean>(false);
  const txsRef = useRef<string[]>([]);

  const [nativeAsset, setNativeAsset] = useState<
    ParsedAddressAsset | undefined
  >();
  const [quantity, setQuantity] = useReducer(
    (quantity: number, increment: number) => {
      if (quantity === 1 && increment === -1) {
        return quantity;
      }

      return quantity + increment;
    },
    1
  );

  useEffect(() => {
    const getNativeAsset = async () => {
      const asset = await ethereumUtils.getNativeAssetForNetwork(
        currentNetwork,
        accountAddress
      );
      if (asset) {
        setNativeAsset(asset);
      }
    };

    getNativeAsset();
  }, [accountAddress, currentNetwork]);

  const {
    gasLimit,
    updateTxFee,
    startPollingGasFees,
    stopPollingGasFees,
    isSufficientGas,
    selectedGasFee,
    isValidGas,
    updateDefaultGasLimit,
    updateGasFeeOption,
  } = useGas({ nativeAsset });

  const insufficientEth = isSufficientGas === false && isValidGas;

  const {
    data: { nfts },
  } = useLegacyNFTs({
    address: accountAddress,
  });
  const imageUrl = maybeSignUri(mintCollection.imageURL);
  const { result: aspectRatio } = usePersistentAspectRatio(imageUrl || '');

  const [errorCode, setErrorCode] = useState<PoapMintError | undefined>(
    undefined
  );

  const [nft, setNft] = useState<UniqueAsset | null>(null);

  const getFormattedDate = (date: string) => {
    return format(new Date(date), 'MMMM dd, yyyy');
  };

  const isTrending = mintCollection.mintsLastHour > 100;

  const imageColor =
    usePersistentDominantColorFromImage(imageUrl) ?? colors.paleBlue;

  const sheetRef = useRef();
  const yPosition = useSharedValue(0);

  const actionOnPress = useCallback(async () => {
    logger.info('Minting NFT', { name: mintCollection.name });

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
      items: [
        { fillType: 'mint', collection: mintCollection.contract, quantity },
      ],
      wallet: signer!,
      chainId: networkObj.id,
      onProgress: (steps: Execute['steps']) => {
        steps.forEach(step => {
          if (step.error && !didErrorRef.current) {
            didErrorRef.current = true;
            logger.error(new RainbowError(`Error minting NFT: ${step.error}`));
            // analyticsV2.track(analyticsV2.event.nftOffersAcceptedOffer, {
            //   status: 'failed',
            //   ...analyticsEventObject,
            // });
            return;
            console.log(step);
          }
          step.items?.forEach(item => {
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

              if (tx) {
                console.log({ txNetwork: tx.network });
                txsRef.current.push(tx.hash);
                // @ts-ignore TODO: fix when we overhaul tx list, types are not good
                dispatch(dataAddNewTransaction(tx));
                navigate(Routes.PROFILE_SCREEN);
              }
            }
          });
        });
      },
    });

    // if (claimStatus === 'claimed') {
    //   if (nft) {
    //     navigate(Routes.EXPANDED_ASSET_SHEET, {
    //       asset: nft,
    //       backgroundOpacity: 1,
    //       cornerRadius: 'device',
    //       external: false,
    //       springDamping: 1,
    //       topOffset: 0,
    //       transitionDuration: 0.25,
    //       type: 'unique_token',
    //     });
    //   }
    // } else {
    //   if (poapMintType === 'secretWord') {
    //     await claimPoapBySecret();
    //   } else {
    //     await claimPoapByQrHash();
    //   }
    // }
  }, []);

  useEffect(() => {
    // const nft = nfts.find(
    //   item => item.image_original_url === poapEvent.imageUrl
    // );
    // if (nft) {
    //   setClaimStatus('claimed');
    //   setNft(nft);
    // }
  }, [imageUrl, nfts]);

  const getErrorMessage = () => {
    if (errorCode === 'LIMIT_EXCEEDED') {
      return i18n.t(i18n.l.poaps.error_messages.limit_exceeded);
    } else if (errorCode === 'EVENT_EXPIRED') {
      return i18n.t(i18n.l.poaps.error_messages.event_expired);
    }
    return i18n.t(i18n.l.poaps.error_messages.event_expired);
  };

  useFocusEffect(() => {
    //analytics go here
  });

  useEffect(() => {
    const fetchENSName = async (address: string) => {
      const ensName = await fetchReverseRecord(address);
      setENSName(ensName);
    };
    if (mintCollection.deployer) {
      fetchENSName(mintCollection.deployer);
    }
  }, [mintCollection.deployer]);

  // estimate gas
  useEffect(() => {
    startPollingGasFees(currentNetwork);

    return () => {
      stopPollingGasFees();
    };
  }, [currentNetwork, startPollingGasFees, stopPollingGasFees]);

  useEffect(() => {
    const estimateMintGas = async () => {
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
        items: [
          { fillType: 'mint', collection: mintCollection.contract, quantity },
        ],
        wallet: signer!,
        chainId: networkObj.id,
        precheck: true,
        onProgress: async (steps: Execute['steps']) => {
          steps.forEach(step => {
            if (step.error && !didErrorRef.current) {
              didErrorRef.current = true;
              logger.error(
                new RainbowError(`Error minting NFT: ${step.error}`)
              );
              // analyticsV2.track(analyticsV2.event.nftOffersAcceptedOffer, {
              //   status: 'failed',
              //   ...analyticsEventObject,
              // });
              return;
            }
            step.items?.forEach(async item => {
              const tx = {
                to: item.data?.to,
                from: item.data?.from,
                data: item.data?.data,
                value: multiply(
                  mintCollection.mintStatus?.price || '0',
                  quantity
                ),
              };
              const gas = await estimateGas(tx, provider);
              if (gas) {
                updateTxFee(gas, null);
              }
              {
                updateTxFee(
                  ethUnits.basic_swap,
                  null,
                  ethUnits.default_l1_gas_fee_optimism_swap
                );
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
    mintCollection.contract,
    mintCollection.mintStatus?.price,
    quantity,
    updateTxFee,
  ]);

  const [ensName, setENSName] = useState<string>('');

  const { data: ensAvatar } = useENSAvatar(ensName, {
    enabled: Boolean(ensName),
  });

  const deployerDisplay = abbreviations.address(
    mintCollection.deployer || '',
    4,
    6
  );
  const contractAddressDisplay = `${abbreviations.address(
    mintCollection.contract || '',
    4,
    6
  )} 􀄯`;
  const mintPriceDisplay = convertRawAmountToBalance(
    multiply(mintCollection.mintStatus?.price || '0', quantity),
    {
      decimals: 18,
      symbol: 'ETH',
    }
    // abbreviate if amount is >= 10,000
  );
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
          <Box
            height={{
              custom: deviceHeight,
            }}
            width={{ custom: deviceWidth }}
          >
            <Inset horizontal={'28px'}>
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
                        {`By `}
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
                          value={ensName || mintCollection?.deployer}
                          color={addressHashedColorIndex(
                            mintCollection?.deployer || ''
                          )}
                        />
                      )}
                      <Text size="15pt" color="labelSecondary" weight="bold">
                        {` ${ensName || deployerDisplay || 'unknown'}`}
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
                          {'Mint Price'}
                        </Text>

                        <Text
                          color="label"
                          align="left"
                          size="22pt"
                          weight="bold"
                        >
                          {mintPriceDisplay.amount === '0'
                            ? 'Free'
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
                      />
                    </Column>
                  </Columns>

                  {/* @ts-ignore */}
                  <HoldToAuthorizeButton
                    backgroundColor={imageColor}
                    disabled={!isSufficientGas || !isValidGas}
                    hideInnerBorder
                    label={
                      insufficientEth
                        ? i18n.t(
                            i18n.l.button.confirm_exchange.insufficient_eth
                          )
                        : i18n.t(i18n.l.mints.hold_to_mint)
                    }
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

                <Box style={{ width: deviceWidth - 56 }}>
                  <Separator color={'divider40 (Deprecated)'} thickness={1} />
                </Box>
              </Stack>

              <Box height="36px"></Box>

              <Stack>
                {mintCollection?.totalMints && (
                  <MintInfoRow
                    symbol="􀐾"
                    label={i18n.t(i18n.l.mints.total_minted)}
                    value={
                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {`${mintCollection.totalMints} NFTs`}
                      </Text>
                    }
                  />
                )}
                {mintCollection?.firstEvent && (
                  <MintInfoRow
                    symbol="􀐫"
                    label={i18n.t(i18n.l.mints.first_event)}
                    value={
                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {getFormattedDate(mintCollection?.firstEvent)}
                      </Text>
                    }
                  />
                )}

                {mintCollection?.lastEvent && (
                  <MintInfoRow
                    symbol="􀐫"
                    label={i18n.t(i18n.l.mints.last_event)}
                    value={
                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {getFormattedDate(mintCollection?.lastEvent)}
                      </Text>
                    }
                  />
                )}

                {mintCollection?.maxSupply && (
                  <MintInfoRow
                    symbol="􀐾"
                    label={i18n.t(i18n.l.mints.max_supply)}
                    value={
                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {`${mintCollection.maxSupply} NFTs`}
                      </Text>
                    }
                  />
                )}

                {mintCollection?.contract && (
                  <MintInfoRow
                    symbol="􀉆"
                    label={i18n.t(i18n.l.mints.contract)}
                    value={
                      <ButtonPressAnimation
                        onPress={() =>
                          ethereumUtils.openAddressInBlockExplorer(
                            mintCollection.contract,
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
                  label={i18n.t(i18n.l.mints.network)}
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
            </Inset>
          </Box>
        </ColorModeProvider>
      </SlackSheet>
    </>
  );
};

export default MintSheet;
