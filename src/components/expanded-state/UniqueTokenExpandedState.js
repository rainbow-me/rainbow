import { VibrancyView } from '@react-native-community/blur';
import c from 'chroma-js';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Linking, Share } from 'react-native';
import styled from 'styled-components';
import useWallets from '../../hooks/useWallets';
import { lightModeThemeColors } from '../../styles/colors';
import Link from '../Link';
import { ButtonPressAnimation } from '../animations';
import { Centered, Column, Row } from '../layout';
import {
  SendActionButton,
  SheetActionButton,
  SheetActionButtonRow,
  SheetHandle,
  SlackSheet,
} from '../sheet';
import { MarkdownText, Text } from '../text';
import { ToastPositionContainer, ToggleStateToast } from '../toasts';
import { TokenInfoItem, TokenInfoRow, TokenInfoSection } from '../token-info';
import { UniqueTokenAttributes, UniqueTokenImage } from '../unique-token';
import ExpandedStateSection from './ExpandedStateSection';
import TokenHistory from './tokenHistory/TokenHistory';
import {
  UniqueTokenExpandedStateContent,
  UniqueTokenExpandedStateHeader,
} from './unique-token';
import { apiGetUniqueTokenFloorPrice } from '@rainbow-me/handlers/opensea-api';
import { buildUniqueTokenName } from '@rainbow-me/helpers/assets';
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import {
  useAccountProfile,
  useAccountSettings,
  useDimensions,
  useShowcaseTokens,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import { convertAmountToNativeDisplay, handleSignificantDecimals } from '@rainbow-me/utilities';
import {
  buildRainbowUrl,
  ethereumUtils,
  getDominantColorFromImage,
  magicMemo,
  safeAreaInsetValues,
} from '@rainbow-me/utils';

const NftExpandedStateSection = styled(ExpandedStateSection).attrs({
  isNft: true,
})``;

const TokenHistoryExpandedStateSection = styled(ExpandedStateSection).attrs({
  isTokenHistory: true,
})``;

const BackgroundBlur = styled(VibrancyView).attrs({
  blurAmount: 100,
  blurType: 'light',
  overlayColor: 'transparent',
})`
  ${position.cover};
`;

const BackgroundImage = styled.View`
  background: black;
  height: 844px;
  position: absolute;
  width: 390px;
`;

const SheetDivider = styled(Row)`
  align-self: center;
  background-color: ${({ theme: { colors } }) =>
    colors.alpha(colors.whiteLabel, 0.01)};
  border-radius: 1;
  height: 2;
  width: ${({ deviceWidth }) => deviceWidth - 48};
`;

const Spacer = styled.View`
  height: ${safeAreaInsetValues.bottom + 20};
`;

const UniqueTokenExpandedState = ({
  aspectRatio,
  asset,
  imageColor,
  external,
  lowResUrl,
}) => {
  const { accountAddress, accountENS } = useAccountProfile();
  const { nativeCurrency, network } = useAccountSettings();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  const { colors } = useTheme();
  const { isReadOnlyWallet } = useWallets();

  const {
    collection: { description: familyDescription, external_link: familyLink },
    currentPrice,
    description,
    familyName,
    isSendable,
    lastPrice,
    traits,
    uniqueId,
    urlSuffixForAsset,
  } = asset;

  const {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  } = useShowcaseTokens();

  const [fallbackImageColor, setFallbackImageColor] = useState(null);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [floorPrice, setFloorPrice] = useState(null);
  const [showCurrentPriceInEth, setShowCurrentPriceInEth] = useState(true);
  const [showFloorInEth, setShowFloorInEth] = useState(true);

  const isShowcaseAsset = useMemo(() => showcaseTokens.includes(uniqueId), [
    showcaseTokens,
    uniqueId,
  ]);
  const isSVG = isSupportedUriExtension(lowResUrl, ['.svg']);

  const imageColorWithFallback =
    imageColor || fallbackImageColor || colors.paleBlue;

  let lastSalePrice = lastPrice || 'None';

  if (lastSalePrice != 'None') {
    lastSalePrice = handleSignificantDecimals(parseFloat(lastPrice), 5);
  }
  
  const priceOfEth = ethereumUtils.getEthPriceUnit();

  useEffect(() => {
    getDominantColorFromImage(lowResUrl, '#333333').then(result => {
      setFallbackImageColor(result);
    });
  }, [lowResUrl]);

  useEffect(() => {
    const contrastWithWhite = c.contrast(
      imageColorWithFallback,
      colors.whiteLabel
    );

    if (contrastWithWhite < 2.125) {
      setTextColor(lightModeThemeColors.dark);
    } else {
      setTextColor(colors.whiteLabel);
    }
  }, [colors.whiteLabel, imageColorWithFallback]);

  useEffect(() => {
    apiGetUniqueTokenFloorPrice(network, urlSuffixForAsset).then(result => {
      setFloorPrice(result);
    });
  }, [network, urlSuffixForAsset]);

  const handlePressCollectionFloor = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: 'floor_price',
    });
  }, [navigate]);

  const handlePressOpensea = useCallback(
    () => Linking.openURL(asset.permalink),
    [asset.permalink]
  );

  const handlePressShowcase = useCallback(() => {
    if (isShowcaseAsset) {
      removeShowcaseToken(uniqueId);
    } else {
      addShowcaseToken(uniqueId);
    }
  }, [addShowcaseToken, isShowcaseAsset, removeShowcaseToken, uniqueId]);

  const handlePressShare = useCallback(() => {
    Share.share({
      title: `Share ${buildUniqueTokenName(asset)} Info`,
      url: buildRainbowUrl(asset, accountENS, accountAddress),
    });
  }, [accountAddress, accountENS, asset]);

  const toggleCurrentPriceDisplayCurrency = useCallback(
    () =>
      showCurrentPriceInEth
        ? setShowCurrentPriceInEth(false)
        : setShowCurrentPriceInEth(true),
    [showCurrentPriceInEth, setShowCurrentPriceInEth]
  );

  const toggleFloorDisplayCurrency = useCallback(
    () => (showFloorInEth ? setShowFloorInEth(false) : setShowFloorInEth(true)),
    [showFloorInEth, setShowFloorInEth]
  );

  return (
    <Fragment>
      <BackgroundImage>
        {isSVG ? (
          <UniqueTokenImage
            backgroundColor={asset.background}
            imageUrl={lowResUrl}
            item={asset}
            size={deviceHeight}
          />
        ) : (
          <ImgixImage
            resizeMode="cover"
            source={{ uri: lowResUrl }}
            style={{ height: deviceHeight, width: deviceWidth }}
          />
        )}
        <BackgroundBlur />
      </BackgroundImage>
      <SlackSheet
        backgroundColor="rgba(26, 26, 26, 0.4)"
        bottomInset={42}
        hideHandle
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: deviceHeight - 80 })}
        scrollEnabled
      >
        <Centered paddingBottom={30} paddingTop={33}>
          <SheetHandle color={colors.alpha(colors.whiteLabel, 0.24)} />
        </Centered>
        <UniqueTokenExpandedStateContent
          aspectRatio={aspectRatio}
          asset={asset}
          imageColor={imageColorWithFallback}
          lowResUrl={lowResUrl}
        />
        <Row justify="space-between" marginTop={14} paddingHorizontal={19}>
          <ButtonPressAnimation
            onPress={handlePressShowcase}
            padding={5}
            scaleTo={0.88}
          >
            <Text
              color={imageColorWithFallback}
              lineHeight="loosest"
              size="lmedium"
              weight="heavy"
            >
              {isShowcaseAsset ? '􀫝 In Showcase' : '􀐇 Showcase'}
            </Text>
          </ButtonPressAnimation>
          <ButtonPressAnimation
            onPress={handlePressShare}
            padding={5}
            scaleTo={0.88}
          >
            <Text
              align="right"
              color={imageColorWithFallback}
              lineHeight="loosest"
              size="lmedium"
              weight="heavy"
            >
              􀈂 Share
            </Text>
          </ButtonPressAnimation>
        </Row>
        <UniqueTokenExpandedStateHeader
          asset={asset}
          imageColor={imageColorWithFallback}
        />
        <SheetActionButtonRow
          ignorePaddingTop
          paddingBottom={24}
          paddingHorizontal={16.5}
        >
          <SheetActionButton
            color={imageColorWithFallback}
            label={
              !external && !isReadOnlyWallet && isSendable
                ? '􀮶 OpenSea'
                : '􀮶 View on OpenSea'
            }
            nftShadows
            onPress={handlePressOpensea}
            textColor={textColor}
            weight="heavy"
          />
          {!external && !isReadOnlyWallet && isSendable ? (
            <SendActionButton
              asset={asset}
              color={imageColorWithFallback}
              nftShadows
              textColor={textColor}
            />
          ) : null}
        </SheetActionButtonRow>
        <TokenInfoSection isNft>
          <TokenInfoRow>
            <TokenInfoItem
              color={
                lastSalePrice === 'None' && !currentPrice
                  ? colors.alpha(colors.whiteLabel, 0.5)
                  : colors.whiteLabel
              }
              isNft
              onPress={toggleCurrentPriceDisplayCurrency}
              size="big"
              title={currentPrice ? '􀋢 For sale' : 'Last sale price'}
              weight={
                lastSalePrice === 'None' && !currentPrice ? 'bold' : 'heavy'
              }
            >
              {showCurrentPriceInEth ||
              nativeCurrency === 'ETH' ||
              !currentPrice
                ? currentPrice || lastSalePrice
                : convertAmountToNativeDisplay(
                    parseFloat(currentPrice) * priceOfEth,
                    nativeCurrency
                  )}
            </TokenInfoItem>
            <TokenInfoItem
              align="right"
              color={
                floorPrice === 'None'
                  ? colors.alpha(colors.whiteLabel, 0.5)
                  : colors.whiteLabel
              }
              isNft
              loading={!floorPrice}
              onInfoPress={handlePressCollectionFloor}
              onPress={toggleFloorDisplayCurrency}
              showInfoButton
              size="big"
              title="Collection floor"
              weight={floorPrice === 'None' ? 'bold' : 'heavy'}
            >
              {showFloorInEth ||
              nativeCurrency === 'ETH' ||
              floorPrice === 'None'
                ? handleSignificantDecimals(parseFloat(floorPrice), 5)
                : convertAmountToNativeDisplay(
                    parseFloat(floorPrice) * priceOfEth,
                    nativeCurrency
                  )}
            </TokenInfoItem>
          </TokenInfoRow>
        </TokenInfoSection>
        <Fragment>
            <SheetDivider deviceWidth={deviceWidth} />
            <TokenHistoryExpandedStateSection title="📍 History">
              <TokenHistory 
                contractAndToken={urlSuffixForAsset}
                color={imageColorWithFallback}
              />
            </TokenHistoryExpandedStateSection>
          </Fragment>
        <Column>
          
          {!!description && (
            <Fragment>
              <SheetDivider deviceWidth={deviceWidth} />
              <NftExpandedStateSection title="Description">
                {description}
              </NftExpandedStateSection>
            </Fragment>
          )}
          {!!traits.length && (
            <Fragment>
              <SheetDivider deviceWidth={deviceWidth} />
              <NftExpandedStateSection title="Properties">
                <UniqueTokenAttributes
                  {...asset}
                  color={imageColorWithFallback}
                  slug={asset.collection.slug}
                />
              </NftExpandedStateSection>
            </Fragment>
          )}
          {!!familyDescription && (
            <Fragment>
              <SheetDivider deviceWidth={deviceWidth} />
              <NftExpandedStateSection title={`About ${familyName}`}>
                <Column>
                  <MarkdownText
                    color={colors.alpha(colors.whiteLabel, 0.5)}
                    lineHeight="big"
                    size="large"
                  >
                    {familyDescription}
                  </MarkdownText>
                  {familyLink && <Link url={familyLink} />}
                </Column>
              </NftExpandedStateSection>
            </Fragment>
          )}
        </Column>
        <Spacer />
      </SlackSheet>
      {/* <HeaderBlurContainer>
        <HeaderBlur />
      </HeaderBlurContainer> */}
      <ToastPositionContainer>
        <ToggleStateToast
          addCopy="Added to showcase"
          isAdded={isShowcaseAsset}
          removeCopy="Removed from showcase"
        />
      </ToastPositionContainer>
    </Fragment>
  );
};

export default magicMemo(UniqueTokenExpandedState, 'asset');
