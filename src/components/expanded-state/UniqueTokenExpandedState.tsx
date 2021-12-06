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
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Link' was resolved to '/Users/nickbytes... Remove this comment to see the full error message
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
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExpandedStateSection' was resolved to '/... Remove this comment to see the full error message
import ExpandedStateSection from './ExpandedStateSection';
import {
  UniqueTokenExpandedStateContent,
  UniqueTokenExpandedStateHeader,
} from './unique-token';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/opensea-a... Remove this comment to see the full error message
import { apiGetUniqueTokenFloorPrice } from '@rainbow-me/handlers/opensea-api';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/assets' or... Remove this comment to see the full error message
import { buildUniqueTokenName } from '@rainbow-me/helpers/assets';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/isSupporte... Remove this comment to see the full error message
import isSupportedUriExtension from '@rainbow-me/helpers/isSupportedUriExtension';
import {
  useAccountProfile,
  useAccountSettings,
  useDimensions,
  usePersistentDominantColorFromImage,
  useShowcaseTokens,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { convertAmountToNativeDisplay } from '@rainbow-me/utilities';
import {
  buildRainbowUrl,
  ethereumUtils,
  magicMemo,
  safeAreaInsetValues,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/utils';

const NftExpandedStateSection = styled(ExpandedStateSection).attrs({
  isNft: true,
})``;

const BackgroundBlur = styled(BlurView).attrs({
  blurAmount: 100,
  blurType: 'light',
})`
  ${position.cover};
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const BackgroundImage = styled.View`
  ${position.cover};
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const BlurWrapper = styled.View.attrs({
  shouldRasterizeIOS: true,
})`
  background-color: ${({ theme: { colors } }: any) => colors.trueBlack};
  height: ${({ height }: any) => height};
  left: 0;
  overflow: hidden;
  position: absolute;
  width: ${({ width }: any) => width};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  height: ${safeAreaInsetValues.bottom + 20};
`;

const UniqueTokenExpandedState = ({ asset, external, lowResUrl }: any) => {
  const { accountAddress, accountENS } = useAccountProfile();
  const { nativeCurrency, network } = useAccountSettings();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
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
    apiGetUniqueTokenFloorPrice(network, urlSuffixForAsset).then(
      (result: any) => {
        setFloorPrice(result);
      }
    );
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
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Fragment>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BlurWrapper height={deviceHeight} width={deviceWidth}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <BackgroundImage>
          {isSVG ? (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <UniqueTokenImage
              backgroundColor={asset.background}
              imageUrl={lowResUrl}
              item={asset}
              size={deviceHeight}
            />
          ) : (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ImgixImage
              resizeMode="cover"
              source={{ uri: lowResUrl }}
              style={{ height: deviceHeight, width: deviceWidth }}
            />
          )}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <BackgroundBlur />
        </BackgroundImage>
      </BlurWrapper>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <SlackSheet
        backgroundColor={
          isDarkMode ? 'rgba(22, 22, 22, 0.4)' : 'rgba(26, 26, 26, 0.4)'
        }
        bottomInset={42}
        hideHandle
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: deviceHeight })}
        ref={sheetRef}
        scrollEnabled
        yPosition={yPosition}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Centered paddingBottom={30} paddingTop={33}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Animated.View style={sheetHandleStyle}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SheetHandle color={colors.alpha(colors.whiteLabel, 0.24)} />
          </Animated.View>
        </Centered>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <UniqueTokenExpandedStateContent
          animationProgress={animationProgress}
          asset={asset}
          imageColor={imageColor}
          lowResUrl={lowResUrl}
          sheetRef={sheetRef}
          textColor={textColor}
          yPosition={yPosition}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Animated.View style={opacityStyle}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Row justify="space-between" marginTop={14} paddingHorizontal={19}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ButtonPressAnimation
              onPress={handlePressShowcase}
              padding={5}
              scaleTo={0.88}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Text
                color={imageColor}
                lineHeight="loosest"
                size="lmedium"
                weight="heavy"
              >
                {isShowcaseAsset ? '􀫝 In Showcase' : '􀐇 Showcase'}
              </Text>
            </ButtonPressAnimation>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ButtonPressAnimation
              onPress={handlePressShare}
              padding={5}
              scaleTo={0.88}
            >
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <UniqueTokenExpandedStateHeader
            asset={asset}
            imageColor={imageColor}
          />
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <SheetActionButtonRow
            ignorePaddingTop
            paddingBottom={24}
            paddingHorizontal={16.5}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <SheetActionButton
              color={imageColor}
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
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <SendActionButton
                asset={asset}
                color={imageColor}
                nftShadows
                textColor={textColor}
              />
            ) : null}
          </SheetActionButtonRow>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <TokenInfoSection isNft>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <TokenInfoRow>
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
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
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
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
                      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'null' is not assignable to param... Remove this comment to see the full error message
                      parseFloat(floorPrice) * priceOfEth,
                      nativeCurrency
                    )}
              </TokenInfoItem>
            </TokenInfoRow>
          </TokenInfoSection>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Column>
            {!!description && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Fragment>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <SheetDivider deviceWidth={deviceWidth} />
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <NftExpandedStateSection title="Description">
                  {description}
                </NftExpandedStateSection>
              </Fragment>
            )}
            {!!traits.length && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Fragment>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <SheetDivider deviceWidth={deviceWidth} />
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <NftExpandedStateSection title="Properties">
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <UniqueTokenAttributes
                    {...asset}
                    color={imageColor}
                    slug={asset.collection.slug}
                  />
                </NftExpandedStateSection>
              </Fragment>
            )}
            {!!familyDescription && (
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
              <Fragment>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <SheetDivider deviceWidth={deviceWidth} />
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <NftExpandedStateSection title={`About ${familyName}`}>
                  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                  unless the '--jsx' flag is provided... Remove this comment to
                  see the full error message
                  <Column>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    <MarkdownText
                      color={colors.alpha(colors.whiteLabel, 0.5)}
                      lineHeight="big"
                      size="large"
                    >
                      {familyDescription}
                    </MarkdownText>
                    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                    unless the '--jsx' flag is provided... Remove this comment
                    to see the full error message
                    {familyLink && <Link url={familyLink} />}
                  </Column>
                </NftExpandedStateSection>
              </Fragment>
            )}
          </Column>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Spacer />
        </Animated.View>
      </SlackSheet>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ToastPositionContainer>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
