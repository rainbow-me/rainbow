import { BlurView } from '@react-native-community/blur';
import c from 'chroma-js';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking, Share } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
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
  usePersistentDominantColorFromImage,
  useShowcaseTokens,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import { convertAmountToNativeDisplay } from '@rainbow-me/utilities';
import {
  buildRainbowUrl,
  ethereumUtils,
  magicMemo,
  safeAreaInsetValues,
} from '@rainbow-me/utils';
import TokenHistory from './tokenHistory/TokenHistory';

const NftExpandedStateSection = styled(ExpandedStateSection).attrs({
  isNft: true,
})``;

const BackgroundBlur = styled(BlurView).attrs({
  blurAmount: 100,
  blurType: 'light',
})`
  ${position.cover};
`;

const BackgroundImage = styled.View`
  ${position.cover};
`;

const BlurWrapper = styled.View.attrs({
  shouldRasterizeIOS: true,
})`
  background-color: ${({ theme: { colors } }) => colors.trueBlack};
  height: ${({ height }) => height};
  left: 0;
  overflow: hidden;
  position: absolute;
  width: ${({ width }) => width};
  ${android && 'border-top-left-radius: 30; border-top-right-radius: 30;'}
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

const UniqueTokenExpandedState = ({ asset, external, lowResUrl }) => {
  const { accountAddress, accountENS } = useAccountProfile();
  const { nativeCurrency, network } = useAccountSettings();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
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

  const [floorPrice, setFloorPrice] = useState(null);
  const [showCurrentPriceInEth, setShowCurrentPriceInEth] = useState(true);
  const [showFloorInEth, setShowFloorInEth] = useState(true);
  const animationProgress = useSharedValue(0);
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: 1 - animationProgress.value,
  }));
  const sheetHandleStyle = useAnimatedStyle(() => ({
    opacity: 1 - animationProgress.value,
  }));

  const isShowcaseAsset = useMemo(() => showcaseTokens.includes(uniqueId), [
    showcaseTokens,
    uniqueId,
  ]);
  const isSVG = isSupportedUriExtension(lowResUrl, ['.svg']);

  const imageColor =
    usePersistentDominantColorFromImage(asset.image_url).result ||
    colors.paleBlue;

  const lastSalePrice = lastPrice || 'None';
  const priceOfEth = ethereumUtils.getEthPriceUnit();

  const textColor = useMemo(() => {
    const contrastWithWhite = c.contrast(imageColor, colors.whiteLabel);

    if (contrastWithWhite < 2.125) {
      return lightModeThemeColors.dark;
    } else {
      return colors.whiteLabel;
    }
  }, [colors.whiteLabel, imageColor]);

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
      message: android && buildRainbowUrl(asset, accountENS, accountAddress),
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

  const sheetRef = useRef();
  const yPosition = useSharedValue(0);

  return (
    <Fragment>
      <BlurWrapper height={deviceHeight} width={deviceWidth}>
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
      </BlurWrapper>
      <SlackSheet
        backgroundColor={
          isDarkMode ? 'rgba(22, 22, 22, 0.4)' : 'rgba(26, 26, 26, 0.4)'
        }
        bottomInset={42}
        hideHandle
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: deviceHeight })}
        ref={sheetRef}
        scrollEnabled
        yPosition={yPosition}
      >
        <Centered paddingBottom={30} paddingTop={33}>
          <Animated.View style={sheetHandleStyle}>
            <SheetHandle color={colors.alpha(colors.whiteLabel, 0.24)} />
          </Animated.View>
        </Centered>
        <UniqueTokenExpandedStateContent
          animationProgress={animationProgress}
          asset={asset}
          imageColor={imageColor}
          lowResUrl={lowResUrl}
          sheetRef={sheetRef}
          textColor={textColor}
          yPosition={yPosition}
        />
        <Animated.View style={opacityStyle}>
          <Row justify="space-between" marginTop={14} paddingHorizontal={19}>
            <ButtonPressAnimation
              onPress={handlePressShowcase}
              padding={5}
              scaleTo={0.88}
            >
              <Text
                color={imageColor}
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
                color={imageColor}
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
            imageColor={imageColor}
          />
          <SheetActionButtonRow
            ignorePaddingTop
            paddingBottom={24}
            paddingHorizontal={16.5}
          >
            <SheetActionButton
              color={imageColor}
              fullWidth={external || isReadOnlyWallet || !isSendable}
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
                color={imageColor}
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
                enableHapticFeedback={!!currentPrice}
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
                enableHapticFeedback={floorPrice !== 'None'}
                isNft
                loading={!floorPrice}
                onInfoPress={handlePressCollectionFloor}
                onPress={toggleFloorDisplayCurrency}
                showInfoButton
                size="big"
                title="Floor price"
                weight={floorPrice === 'None' ? 'bold' : 'heavy'}
              >
                {showFloorInEth ||
                nativeCurrency === 'ETH' ||
                floorPrice === 'None'
                  ? floorPrice
                  : convertAmountToNativeDisplay(
                      parseFloat(floorPrice) * priceOfEth,
                      nativeCurrency
                    )}
              </TokenInfoItem>
            </TokenInfoRow>
          </TokenInfoSection>
          <Fragment>
            <SheetDivider deviceWidth={deviceWidth} />
            <NftExpandedStateSection isTokenHistory={true} title="History">
              <TokenHistory 
               contractAndToken={urlSuffixForAsset}
               color={imageColor}
              />
            </NftExpandedStateSection>
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
                    color={imageColor}
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
        </Animated.View>
      </SlackSheet>
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
