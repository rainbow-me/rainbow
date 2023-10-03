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
import { TransactionStatus, TransactionType } from '@/entities';
import * as i18n from '@/languages';
import { analyticsV2 } from '@/analytics';
import { event } from '@/analytics/event';
import { ETH_ADDRESS, ETH_SYMBOL } from '@/references';
import { RainbowNetworks, getNetworkObj } from '@/networks';
import { Network } from '@/networks/types';
import { fetchReverseRecord } from '@/handlers/ens';
import { ContactAvatar } from '@/components/contacts';
import { addressHashedColorIndex } from '@/utils/profileUtils';
import { loadPrivateKey } from '@/model/wallet';
import { ChainBadge } from '@/components/coin-icon';
import {
  add,
  convertRawAmountToBalance,
  greaterThanOrEqualTo,
  multiply,
} from '@/helpers/utilities';
import { RainbowError, logger } from '@/logger';
import { useDispatch } from 'react-redux';
import { QuantityButton } from './components/QuantityButton';
import { estimateGas, getProviderForNetwork } from '@/handlers/web3';

const NFT_IMAGE_HEIGHT = 250;
// inset * 2 -> 28 *2
const INSET_OFFSET = 56;

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

const getFormattedDate = (date: string) => {
  return format(new Date(date), 'MMMM dd, yyyy');
};

const MintSheet = () => {
  const params = useRoute();
  const { collection: mintCollection } = params.params as MintSheetProps;
  const { accountAddress } = useAccountProfile();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  const dispatch = useDispatch();
  const { colors, isDarkMode } = useTheme();
  const { isReadOnlyWallet, isHardwareWallet } = useWallets();
  const [insufficientEth, setInsufficientEth] = useState(false);
  const currentNetwork =
    RainbowNetworks.find(({ id }) => id === mintCollection.chainId)?.value ||
    Network.mainnet;
  const [ensName, setENSName] = useState<string>('');
  const [mintStatus, setMintStatus] = useState<
    'none' | 'minting' | 'minted' | 'error'
  >('none');
  const txRef = useRef<string>();

  const { data: ensAvatar } = useENSAvatar(ensName, {
    enabled: Boolean(ensName),
  });

  // if there is no max mint we fallback to JS max int
  const maxMintsPerWallet =
    mintCollection.publicMintInfo?.maxMintsPerWallet || Number.MAX_SAFE_INTEGER;

  const price = convertRawAmountToBalance(
    mintCollection.publicMintInfo?.price?.amount?.raw || '0',
    {
      decimals: mintCollection.publicMintInfo?.price?.currency?.decimals || 18,
      symbol: mintCollection.publicMintInfo?.price?.currency?.symbol || 'ETH',
    }
  );

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
    getTotalGasPrice,
  } = useGas();

  const imageUrl = maybeSignUri(mintCollection.image || '');
  const { result: aspectRatio } = usePersistentAspectRatio(imageUrl || '');

  // isMintingPublicSale handles if theres a time based mint, otherwise if there is a price we should be able to mint
  const isMintingAvailable =
    !(isReadOnlyWallet || isHardwareWallet) &&
    (mintCollection.isMintingPublicSale || price);

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

  // check address balance
  useEffect(() => {
    const checkInsufficientEth = async () => {
      const nativeBalance =
        (
          await ethereumUtils.getNativeAssetForNetwork(
            currentNetwork,
            accountAddress
          )
        )?.balance?.amount ?? 0;
      const txFee = getTotalGasPrice();
      const totalMintPrice = multiply(price.amount, quantity);
      // gas price + mint price
      // TODO: need to double check this when there are paid mints available
      setInsufficientEth(
        greaterThanOrEqualTo(add(txFee, totalMintPrice), nativeBalance)
      );
    };
    checkInsufficientEth();
  }, [
    accountAddress,
    currentNetwork,
    getTotalGasPrice,
    mintCollection.publicMintInfo?.price?.currency?.decimals,
    mintCollection.publicMintInfo?.price?.currency?.symbol,
    price,
    quantity,
  ]);

  // resolve ens name
  useEffect(() => {
    const fetchENSName = async (address: string) => {
      const ensName = await fetchReverseRecord(address);
      setENSName(ensName);
    };

    if (mintCollection.creator) {
      fetchENSName(mintCollection.creator);
    }
  }, [mintCollection.creator]);

  // start poll gas price
  useEffect(() => {
    startPollingGasFees(currentNetwork);

    return () => {
      stopPollingGasFees();
    };
  }, [currentNetwork, startPollingGasFees, stopPollingGasFees]);

  // estimate gas limit
  useEffect(() => {
    const estimateMintGas = async () => {
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
          console.log(steps);
          steps.forEach(step => {
            if (step.error) {
              logger.error(
                new RainbowError(`NFT Mints: Gas Step Error: ${step.error}`)
              );
              return;
            }
            console.log({ price, quantity });
            step.items?.forEach(async item => {
              // could add safety here if unable to calc gas limit
              const tx = {
                to: item.data?.to,
                from: item.data?.from,
                data: item.data?.data,
                value: multiply(price.amount || '0', quantity),
              };

              const gas = await estimateGas(tx, provider);
              if (gas) {
                updateTxFee(gas, null);
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
    multiply(price.amount, quantity),
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
      // this isnt possible with our current entry points
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

    // link to mint.fun if reservoir not supporting
    if (!isMintingAvailable) {
      Linking.openURL(buildMintDotFunUrl(mintCollection.id!, currentNetwork));
      return;
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
            if (
              item.txHash &&
              txRef.current !== item.txHash &&
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

              txRef.current = tx.hash;
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
                  <Box style={{ width: deviceWidth - INSET_OFFSET }}>
                    <Separator color={'divider40 (Deprecated)'} thickness={1} />
                  </Box>

                  <Columns alignHorizontal="justify">
                    <Column width={'content'}>
                      <Stack space={{ custom: 14 }}>
                        <Text
                          color="labelSecondary"
                          align="left"
                          size="13pt"
                          weight="semibold"
                        >
                          {i18n.t(i18n.l.minting.mint_price)}
                        </Text>
                        <Inline alignVertical="center">
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
                        </Inline>
                      </Stack>
                    </Column>

                    <Column width={'content'}>
                      <Stack space="2px">
                        {
                          <Text
                            color="labelSecondary"
                            align="center"
                            size="13pt"
                            weight="semibold"
                          >
                            {quantity === Number(maxMintsPerWallet)
                              ? 'Max'
                              : ''}
                          </Text>
                        }

                        <QuantityButton
                          value={quantity}
                          plusAction={() => setQuantity(1)}
                          minusAction={() => setQuantity(-1)}
                          buttonColor={imageColor}
                          disabled={!isMintingAvailable}
                          maxValue={Number(maxMintsPerWallet)}
                        />
                      </Stack>
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

                  <Box width={{ custom: deviceWidth - INSET_OFFSET }}>
                    {/* @ts-ignore */}
                    <GasSpeedButton
                      fallbackColor={imageColor}
                      marginTop={0}
                      horizontalPadding={0}
                      currentNetwork={currentNetwork}
                      theme={'dark'}
                      marginBottom={0}
                    />
                  </Box>
                </Stack>
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
          <Box height={{ custom: INSET_OFFSET }}></Box>
        </ColorModeProvider>
      </SlackSheet>
    </>
  );
};

export default MintSheet;
