import React, { useEffect, useMemo, useState } from 'react';
import { Linking, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { SimpleSheet } from '@/components/sheet/SimpleSheet';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  Inline,
  Inset,
  Separator,
  Text,
  Columns,
  Column,
  useForegroundColor,
} from '@/design-system';
import { ImgixImage } from '@/components/images';
import {
  getFormattedTimeQuantity,
  convertAmountToNativeDisplay,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import * as i18n from '@/languages';
import { NftOffer } from '@/graphql/__generated__/arc';
import { CoinIcon } from '@/components/coin-icon';
import { ButtonPressAnimation } from '@/components/animations';
import { useNavigation } from '@/navigation';
import { IS_ANDROID } from '@/env';
import ConditionalWrap from 'conditional-wrap';
import Routes from '@/navigation/routesNames';
import { useLegacyNFTs } from '@/resources/nfts';
import { useAccountSettings, useWallets } from '@/hooks';
import { TransactionStatus, TransactionType, UniqueAsset } from '@/entities';
import { analyticsV2 } from '@/analytics';
import { RAINBOW_ROUTER_CONTRACT_ADDRESS } from '@rainbow-me/swaps';
import { BigNumber } from '@ethersproject/bignumber';
import { SheetActionButtonRow } from '@/components/sheet/sheet-action-buttons';
import { HoldToAuthorizeButton } from '@/components/buttons';
import { GasSpeedButton } from '@/components/gas';
import { loadPrivateKey, loadWallet } from '@/model/wallet';
import { Network } from '@/helpers';
import { getProviderForNetwork } from '@/handlers/web3';
import { Execute, getClient } from '@reservoir0x/reservoir-sdk';
// import { adaptEthersSigner } from '@reservoir0x/ethers-wallet-adapter';
import { Wallet } from '@ethersproject/wallet';
import { mainnet } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { useDispatch } from 'react-redux';
import { dataAddNewTransaction } from '@/redux/data';

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function Row({
  symbol,
  label,
  value,
}: {
  symbol: string;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <Box height={{ custom: 36 }} alignItems="center">
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

export function NFTSingleOfferSheet() {
  const { params } = useRoute();
  const { navigate, setParams } = useNavigation();
  const { accountAddress } = useAccountSettings();
  const { isReadOnlyWallet } = useWallets();
  const { data: nfts } = useLegacyNFTs({ address: accountAddress });
  const dispatch = useDispatch();

  const { offer } = params as { offer: NftOffer };

  const [tx, setTx] = useState(null);
  const [height, setHeight] = useState(0);

  const nft = useMemo(() => {
    if (nfts) {
      return nfts.find(
        (nft: UniqueAsset) => nft.fullUniqueId === offer.nft.uniqueId
      );
    }
  }, [nfts, offer.nft.uniqueId]);

  useEffect(() => {
    const tx = {
      data:
        '0xf2d12b12000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000009600000000000000000000000000000000000000000000000000000000000000a600000000000000000000000002dc92aa78358310a87276cf6f893f48e896d8fc50000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000004e000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000003a0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000061e9c01f1b0f88467b5a703bae144301c3ee99e6000000000000000000000000000000e7ec00e7b300774b00001314b8610022b80000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000000030000000000000000000000000000000000000000000000000000000064c0bdf70000000000000000000000000000000000000000000000000000000064e5a7f7000000000000000000000000000000000000000000000000000000000000000072db8c0b0000000000000000000000000000000000000000ffbdd089a6fa30e80000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000aa87bee538000000000000000000000000000000000000000000000000000000aa87bee53800000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000004000000000000000000000000f91523bc0ffa151abd971f1b11d2567d4167db3e0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000061e9c01f1b0f88467b5a703bae144301c3ee99e60000000000000000000000000000000000000000000000000000000000000040380b05041a73f542755de2f51c684153f3eec08bbedc8ef4f352083a7e3730dc3cee1d464c0f5d185d81c8bce04cd2005803b9af558c536cbd2f7230d7dd7294000000000000000000000000000000000000000000000000000000000000007e002dc92aa78358310a87276cf6f893f48e896d8fc50000000064c164169fc29248f509748dc8dd2f60a756ed4e0e71348816fa838b2b16eff62781cf9edf9e39c421993bef221870f38ca3d09224ceb89121f65d8fd215257ac27c7782000000000000000000000000000000000000000000000000000000000000001cb6000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000003a000000000000000000000000000000000000000000000000000000000000003c00000000000000000000000002dc92aa78358310a87276cf6f893f48e896d8fc5000000000000000000000000000000e7ec00e7b300774b00001314b8610022b80000000000000000000000000000000000000000000000000000000000000160000000000000000000000000000000000000000000000000000000000000022000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000064c0bdf70000000000000000000000000000000000000000000000000000000064e5a7f700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006af8bc8beeee58e10000007b02230091a7ed01230072f7006a004d60a8d4e71d599b8104250f0000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002000000000000000000000000f91523bc0ffa151abd971f1b11d2567d4167db3e0000000000000000000000000000000000000000000000000000000000001cb6000000000000000000000000000000000000000000000000000000000000001e000000000000000000000000000000000000000000000000000000000000001e00000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000c02aaa39b223fe8d0a0e5c4f27ead9083c756cc20000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000aa87bee538000000000000000000000000000000000000000000000000000000aa87bee5380000000000000000000000000002dc92aa78358310a87276cf6f893f48e896d8fc500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001cb600000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000140000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000001d4da48b',
      to: '0x00000000000000adc04c56bf30ac9d3c0aaf14dc',
      from: '0x2dc92aa78358310a87276cf6f893f48e896d8fc5',
      hash:
        '0x077201947b05329dadc5aa62776467ca887f4753c55b1b8ef38a9c66a564c5a2',
      network: Network.mainnet,
      // description: `${offer.nft.name} #${offer.nft.tokenId}`,
      amount: 1,
      asset: {},
      nonce: null,
      nft,
      type: TransactionType.sell,
      title: 'Test 1',
      description: 'Test 2',
      status: TransactionStatus.selling,
    };
    console.log(tx);
    // setTx(tx);
    dispatch(dataAddNewTransaction(tx));
  }, [dispatch, nft]);

  useEffect(() => {
    setParams({ longFormHeight: height });
  }, [height, setParams]);

  const [timeRemaining, setTimeRemaining] = useState(
    offer.validUntil
      ? Math.max(offer.validUntil * 1000 - Date.now(), 0)
      : undefined
  );

  const isFloorDiffPercentagePositive = offer.floorDifferencePercentage >= 0;
  const listPrice = handleSignificantDecimals(
    offer.grossAmount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.grossAmount.decimal >= 10_000
  );
  const floorPrice = handleSignificantDecimals(
    offer.floorPrice.amount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.grossAmount.decimal >= 10_000
  );
  const netCurrency = convertAmountToNativeDisplay(
    offer.netAmount.usd,
    'USD',
    undefined,
    // don't show decimals
    false,
    // abbreviate if amount is >= 10,000
    offer.netAmount.decimal >= 10_000
  );
  const netCrypto = handleSignificantDecimals(
    offer.netAmount.decimal,
    18,
    // don't show more than 3 decimals
    3,
    undefined,
    // abbreviate if amount is >= 10,000
    offer.netAmount.decimal >= 10_000
  );

  useEffect(() => {
    if (offer.validUntil) {
      const interval = setInterval(() => {
        setTimeRemaining(Math.max(offer.validUntil * 1000 - Date.now(), 0));
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [offer.validUntil]);
  const isExpiring =
    timeRemaining !== undefined && timeRemaining <= TWO_HOURS_MS;
  const isExpired = timeRemaining === 0;
  const time = timeRemaining
    ? getFormattedTimeQuantity(timeRemaining)
    : undefined;
  const buttonColorFallback = useForegroundColor('accent');

  return (
    <BackgroundProvider color="surfaceSecondary">
      {({ backgroundColor }) => (
        <SimpleSheet
          backgroundColor={backgroundColor as string}
          scrollEnabled={false}
        >
          <View onLayout={e => setHeight(e.nativeEvent.layout.height)}>
            <Inset top="32px" horizontal="28px" bottom="52px">
              <Inset bottom={{ custom: 36 }}>
                <Text color="label" align="center" size="20pt" weight="heavy">
                  {i18n.t(i18n.l.nft_offers.single_offer_sheet.title)}
                </Text>
                <Inset top="10px">
                  {timeRemaining !== undefined && (
                    <Inline
                      space="4px"
                      alignHorizontal="center"
                      alignVertical="center"
                    >
                      <Text
                        color={
                          isExpiring || isExpired ? 'red' : 'labelTertiary'
                        }
                        align="center"
                        size="13pt"
                        weight="semibold"
                      >
                        {isExpired ? '􀇾' : '􀐫'}
                      </Text>
                      <Text
                        color={
                          isExpiring || isExpired ? 'red' : 'labelTertiary'
                        }
                        align="center"
                        size="15pt"
                        weight="semibold"
                      >
                        {isExpired
                          ? i18n.t(i18n.l.nft_offers.single_offer_sheet.expired)
                          : i18n.t(
                              i18n.l.nft_offers.single_offer_sheet.expires_in,
                              {
                                timeLeft: time!,
                              }
                            )}
                      </Text>
                    </Inline>
                  )}
                </Inset>
              </Inset>

              <Box alignItems="center">
                <ButtonPressAnimation
                  disabled={!nft}
                  onPress={() =>
                    navigate(Routes.EXPANDED_ASSET_SHEET, {
                      asset: nft,
                      backgroundOpacity: 1,
                      cornerRadius: 'device',
                      external: false,
                      springDamping: 1,
                      topOffset: 0,
                      transitionDuration: 0.25,
                      type: 'unique_token',
                    })
                  }
                  overflowMargin={100}
                >
                  <ConditionalWrap
                    condition={!!offer.nft.predominantColor}
                    wrap={(children: React.ReactNode) => (
                      <AccentColorProvider color={offer.nft.predominantColor!}>
                        {children}
                      </AccentColorProvider>
                    )}
                  >
                    <Box
                      as={ImgixImage}
                      background="surfaceSecondaryElevated"
                      source={{ uri: offer.nft.imageUrl }}
                      width={{ custom: 160 }}
                      height={{ custom: 160 }}
                      borderRadius={16}
                      size={160}
                      shadow={
                        offer.nft.predominantColor ? '30px accent' : '30px'
                      }
                    />
                  </ConditionalWrap>
                </ButtonPressAnimation>
              </Box>

              <Inset top={{ custom: 40 }} bottom="24px">
                <Columns alignVertical="center">
                  <Column>
                    <Text color="label" size="17pt" weight="bold">
                      {offer.nft.name}
                    </Text>
                    <Inset top="10px">
                      <Text color="labelTertiary" size="13pt" weight="medium">
                        {offer.nft.collectionName}
                      </Text>
                    </Inset>
                  </Column>
                  <Column>
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <CoinIcon
                        address={offer.paymentToken.address}
                        size={16}
                        symbol={offer.paymentToken.symbol}
                      />

                      <Text
                        color="label"
                        align="right"
                        size="17pt"
                        weight="bold"
                      >
                        {listPrice} {offer.paymentToken.symbol}
                      </Text>
                    </Inline>

                    <Inset top="6px">
                      <Inline alignHorizontal="right">
                        <Text
                          size="13pt"
                          weight="medium"
                          color={
                            isFloorDiffPercentagePositive
                              ? 'green'
                              : 'labelTertiary'
                          }
                        >
                          {`${isFloorDiffPercentagePositive ? '+' : ''}${
                            offer.floorDifferencePercentage
                          }% `}
                        </Text>
                        <Text size="13pt" weight="medium" color="labelTertiary">
                          {i18n.t(
                            isFloorDiffPercentagePositive
                              ? i18n.l.nft_offers.sheet.above_floor
                              : i18n.l.nft_offers.sheet.below_floor
                          )}
                        </Text>
                      </Inline>
                    </Inset>
                  </Column>
                </Columns>
              </Inset>

              <Separator color="separatorTertiary" />

              <Inset top="24px">
                <Row
                  symbol="􀐾"
                  label={i18n.t(
                    i18n.l.nft_offers.single_offer_sheet.floor_price
                  )}
                  value={
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <CoinIcon
                        address={offer.paymentToken.address}
                        size={16}
                        symbol={offer.paymentToken.symbol}
                      />

                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {floorPrice} {offer.paymentToken.symbol}
                      </Text>
                    </Inline>
                  }
                />

                <Row
                  symbol="􀍩"
                  label={i18n.t(
                    i18n.l.nft_offers.single_offer_sheet.marketplace
                  )}
                  value={
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <Box
                        as={ImgixImage}
                        background="surfaceSecondaryElevated"
                        source={{ uri: offer.marketplace.imageUrl }}
                        width={{ custom: 16 }}
                        height={{ custom: 16 }}
                        borderRadius={16}
                        size={16}
                        // shadow is way off on android idk why
                        shadow={IS_ANDROID ? undefined : '30px accent'}
                      />

                      <Text
                        color="labelSecondary"
                        align="right"
                        size="17pt"
                        weight="medium"
                      >
                        {offer.marketplace.name}
                      </Text>
                    </Inline>
                  }
                />

                <Row
                  symbol="􀘾"
                  label={i18n.t(
                    i18n.l.nft_offers.single_offer_sheet.marketplace_fees,
                    { marketplace: offer.marketplace.name }
                  )}
                  value={
                    <Text
                      color="labelSecondary"
                      align="right"
                      size="17pt"
                      weight="medium"
                    >
                      {Math.floor(offer.feesPercentage * 10) / 10}%
                    </Text>
                  }
                />

                <Row
                  symbol="􀣶"
                  label={i18n.t(
                    i18n.l.nft_offers.single_offer_sheet.creator_royalties
                  )}
                  value={
                    <Text
                      color="labelSecondary"
                      align="right"
                      size="17pt"
                      weight="medium"
                    >
                      {Math.floor(offer.royaltiesPercentage * 10) / 10}%
                    </Text>
                  }
                />

                {/* <Row
                symbol="􀖅"
                label={i18n.t(i18n.l.nft_offers.single_offer_sheet.receive)}
                value={
                  <Text
                    color="labelSecondary"
                    align="right"
                    size="17pt"
                    weight="medium"
                  >
                    {offer.paymentToken.symbol}
                  </Text>
                }
              /> */}
              </Inset>

              <Separator color="separatorTertiary" />

              <Inset vertical="24px">
                <Columns alignVertical="center">
                  <Column>
                    <Text color="label" size="17pt" weight="bold">
                      {i18n.t(i18n.l.nft_offers.single_offer_sheet.proceeds)}
                    </Text>
                  </Column>
                  <Column>
                    <Inline
                      space="4px"
                      alignVertical="center"
                      alignHorizontal="right"
                    >
                      <CoinIcon
                        address={offer.paymentToken.address}
                        size={16}
                        symbol={offer.paymentToken.symbol}
                      />

                      <Text
                        color="label"
                        align="right"
                        size="17pt"
                        weight="bold"
                      >
                        {netCrypto} {offer.paymentToken.symbol}
                      </Text>
                    </Inline>

                    <Inset top="10px">
                      <Text
                        color="labelTertiary"
                        align="right"
                        size="13pt"
                        weight="medium"
                      >
                        {netCurrency}
                      </Text>
                    </Inset>
                  </Column>
                </Columns>
              </Inset>
              {isReadOnlyWallet ? (
                <AccentColorProvider
                  color={offer.nft.predominantColor || buttonColorFallback}
                >
                  {/* @ts-ignore js component */}
                  <Box
                    as={ButtonPressAnimation}
                    background="accent"
                    height="46px"
                    // @ts-ignore
                    disabled={isExpired}
                    width="full"
                    borderRadius={99}
                    justifyContent="center"
                    alignItems="center"
                    style={{ overflow: 'hidden' }}
                    onPress={() => {
                      analyticsV2.track(
                        analyticsV2.event.nftOffersViewedExternalOffer,
                        {
                          marketplace: offer.marketplace.name,
                          offerPriceUSD: offer.grossAmount.usd,
                          nft: {
                            collectionAddress: offer.nft.contractAddress,
                            tokenId: offer.nft.tokenId,
                            network: offer.network,
                          },
                        }
                      );
                      Linking.openURL(offer.url);
                    }}
                  >
                    <Text
                      color="label"
                      align="center"
                      size="17pt"
                      weight="heavy"
                    >
                      {i18n.t(
                        isExpired
                          ? i18n.l.nft_offers.single_offer_sheet.offer_expired
                          : i18n.l.nft_offers.single_offer_sheet.view_offer
                      )}
                    </Text>
                  </Box>
                </AccentColorProvider>
              ) : (
                <>
                  <HoldToAuthorizeButton
                    backgroundColor={
                      offer.nft.predominantColor || buttonColorFallback
                    }
                    // disabled={!isSufficientGas || !isValidGas}
                    hideInnerBorder
                    // label={
                    //   insufficientEth
                    //     ? lang.t('profiles.confirm.insufficient_eth')
                    //     : label
                    // }
                    label="Hold to sell"
                    onLongPress={async () => {
                      const provider = await getProviderForNetwork(
                        offer.network as Network
                      );
                      // const ethersSigner = await loadWallet(
                      //   accountAddress,
                      //   true,
                      //   provider
                      // );
                      const privateKey = await loadPrivateKey(
                        accountAddress,
                        false
                      );
                      const account = privateKeyToAccount(privateKey);
                      // const reservoirSigner = adaptEthersSigner(
                      //   ethersSigner as Wallet
                      // );
                      const reservoirSigner = createWalletClient({
                        account,
                        chain: mainnet,
                        transport: http(),
                      });
                      console.log('HELLO???');
                      console.log('test');
                      console.log(
                        BigNumber.from(offer.grossAmount.raw)
                          .div(100)
                          .toString()
                      );
                      console.log(
                        `${RAINBOW_ROUTER_CONTRACT_ADDRESS}:${BigNumber.from(
                          offer.grossAmount.raw
                        )
                          .div(100)
                          .toString()}`
                      );
                      getClient()?.actions.acceptOffer({
                        items: [
                          {
                            token: `${offer.nft.contractAddress}:${offer.nft.tokenId}`,
                            quantity: 1,
                          },
                        ],
                        // options: {
                        //   feesOnTop: [
                        //     `${RAINBOW_ROUTER_CONTRACT_ADDRESS}:${BigNumber.from(
                        //       offer.grossAmount.raw
                        //     )
                        //       .div(100)
                        //       .toString()}`,
                        //   ],
                        // },
                        // precheck: true,
                        wallet: reservoirSigner,
                        onProgress: (
                          steps: Execute['steps'],
                          path: Execute['path']
                        ) => {
                          // const tx = {
                          // ...gasParams,
                          // amount: inputAmount,
                          // asset: inputCurrency,
                          // data: swap?.data,
                          // from: accountAddress,
                          // gasLimit,
                          // hash: swap?.hash,
                          // network: ethereumUtils.getNetworkFromChainId(Number(chainId)),
                          // nonce: swap?.nonce,
                          // protocol: ProtocolType.socket,
                          // status: isBridge ? TransactionStatus.bridging : TransactionStatus.swapping,
                          // to: swap?.to,
                          // type: TransactionType.trade,
                          // value: (swap && toHex(swap.value)) || undefined,
                          // swap: {
                          //   type: SwapType.crossChain,
                          //   fromChainId: ethereumUtils.getChainIdFromType(inputCurrency?.type),
                          //   toChainId: ethereumUtils.getChainIdFromType(outputCurrency?.type),
                          //   isBridge,
                          // },
                          // };
                          // console.log(steps);
                          // steps.forEach(step =>
                          //   step.items?.forEach(item => {
                          //     console.log(item);
                          //     if (item.data?.txHash) {
                          //       console.log(item, 'ITEM');
                          //       console.log(step, 'STEP');
                          //     }
                          //   })
                          // );
                          console.log('ON PROGRESS');
                          if (!tx) {
                            console.log('MAKING TX');
                            console.log('steps');
                            console.log(steps);
                            const step = steps.find(step => step.id === 'sale');
                            const item = step?.items?.find(
                              item =>
                                item.txHash && item.status === 'incomplete'
                            );
                            console.log('item');
                            console.log(item);
                            console.log('order id');
                            console.log(item?.orderIds);
                            if (item) {
                              console.log('hello');
                              const tx = {
                                data: item.data.data,
                                to: item.data.to,
                                from: item.data.from,
                                hash: item.txHash!,
                                network: Network.mainnet,
                                // description: `${offer.nft.name} #${offer.nft.tokenId}`,
                                amount: null,
                                asset: nft,
                                nonce: null,
                                status: TransactionStatus.selling,
                              };
                              console.log(tx);
                              setTx(tx);
                              dispatch(dataAddNewTransaction(tx));
                            }
                          }
                          navigate(Routes.PROFILE_SCREEN);
                          // console.log('WHYY');
                          // console.log('STEPS', steps);
                          // console.log('PATH', path);
                        },
                      });
                      console.log('pls');
                    }}
                    parentHorizontalPadding={28}
                    // showBiometryIcon={!insufficientEth}
                    showBiometryIcon
                    // testID={`ens-transaction-action-${testID}`}
                  />
                  <GasSpeedButton
                    asset={{
                      color: offer.nft.predominantColor || buttonColorFallback,
                    }}
                    currentNetwork="mainnet"
                    theme="light"
                  />
                </>
              )}
            </Inset>
          </View>
        </SimpleSheet>
      )}
    </BackgroundProvider>
  );
}
