import { BlurView } from '@react-native-community/blur';
import c from 'chroma-js';
import lang from 'i18n-js';
import React, {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Linking, Share, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import URL from 'url-parse';
import { CardSize } from '../../components/unique-token/CardSize';
import useWallets from '../../hooks/useWallets';
import { lightModeThemeColors } from '../../styles/colors';
import L2Disclaimer from '../L2Disclaimer';
import Link from '../Link';
import { ButtonPressAnimation } from '../animations';
import {
  SendActionButton,
  SheetActionButton,
  SheetHandle,
  SlackSheet,
} from '../sheet';
import { ToastPositionContainer, ToggleStateToast } from '../toasts';
import { TokenInfoItem } from '../token-info';
import { UniqueTokenAttributes, UniqueTokenImage } from '../unique-token';
import {
  UniqueTokenExpandedStateContent,
  UniqueTokenExpandedStateHeader,
} from './unique-token';
import {
  AccentColorProvider,
  Bleed,
  ColorModeProvider,
  Columns,
  Divider,
  Heading,
  Inline,
  Inset,
  MarkdownText,
  MarkdownTextProps,
  Space,
  Stack,
  Text,
  TextProps,
} from '@rainbow-me/design-system';
import { AssetTypes, UniqueAsset } from '@rainbow-me/entities';
import { apiGetUniqueTokenFloorPrice } from '@rainbow-me/handlers/opensea-api';
import { buildUniqueTokenName } from '@rainbow-me/helpers/assets';
import {
  useAccountProfile,
  useAccountSettings,
  useBooleanState,
  useDimensions,
  usePersistentDominantColorFromImage,
  useShowcaseTokens,
} from '@rainbow-me/hooks';
import { useNavigation, useUntrustedUrlOpener } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import { useTheme } from '@rainbow-me/theme';
import { convertAmountToNativeDisplay } from '@rainbow-me/utilities';
import {
  buildRainbowUrl,
  ethereumUtils,
  magicMemo,
  safeAreaInsetValues,
} from '@rainbow-me/utils';

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

const Spacer = styled(View)({
  height: safeAreaInsetValues.bottom + 20,
});

const TextButton = ({
  onPress,
  children,
  align,
}: {
  onPress: () => void;
  children: ReactNode;
  align?: TextProps['align'];
}) => {
  const hitSlop: Space = '19px';

  return (
    <Bleed space={hitSlop}>
      <ButtonPressAnimation onPress={onPress} scaleTo={0.88}>
        <Inset space={hitSlop}>
          <Text align={align} color="accent" size="16px" weight="heavy">
            {children}
          </Text>
        </Inset>
      </ButtonPressAnimation>
    </Bleed>
  );
};

const textSize: TextProps['size'] = '18px';
const textColor: TextProps['color'] = 'secondary50';
const sectionSpace: Space = '30px';
const paragraphSpace: Space = '24px';
const listSpace: Space = '19px';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <Stack space={paragraphSpace}>
    <Heading size={textSize}>{title}</Heading>
    {children}
  </Stack>
);

const Markdown = ({
  children,
}: {
  children: MarkdownTextProps['children'];
}) => {
  const openUntrustedUrl = useUntrustedUrlOpener();

  return (
    <MarkdownText
      color={textColor}
      handleLinkPress={openUntrustedUrl}
      listSpace={listSpace}
      paragraphSpace={paragraphSpace}
      size={textSize}
    >
      {children}
    </MarkdownText>
  );
};

interface UniqueTokenExpandedStateProps {
  asset: UniqueAsset;
  external: boolean;
}

const UniqueTokenExpandedState = ({
  asset,
  external,
}: UniqueTokenExpandedStateProps) => {
  const { accountAddress, accountENS } = useAccountProfile();
  const { nativeCurrency, network } = useAccountSettings();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { isReadOnlyWallet } = useWallets();

  const {
    collection: { description: familyDescription, external_url: familyLink },
    currentPrice,
    description,
    familyName,
    isPoap,
    isSendable,
    lastPrice,
    lastSalePaymentToken,
    traits,
    uniqueId,
    urlSuffixForAsset,
  } = asset;

  const {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  } = useShowcaseTokens();

  const [floorPrice, setFloorPrice] = useState<string | null>(null);
  const [showCurrentPriceInEth, setShowCurrentPriceInEth] = useState(true);
  const [showFloorInEth, setShowFloorInEth] = useState(true);
  const [
    contentFocused,
    handleContentFocus,
    handleContentBlur,
  ] = useBooleanState();
  const animationProgress = useSharedValue(0);
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: 1 - animationProgress.value,
  }));
  const sheetHandleStyle = useAnimatedStyle(() => ({
    opacity: 1 - animationProgress.value,
  }));

  const handleL2DisclaimerPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: asset.network,
    });
  }, [asset.network, navigate]);

  const isShowcaseAsset = useMemo(
    () => showcaseTokens.includes(uniqueId) as boolean,
    [showcaseTokens, uniqueId]
  );

  const imageColor =
    // @ts-expect-error image_url could be null or undefined?
    usePersistentDominantColorFromImage(asset.lowResUrl).result ||
    colors.paleBlue;

  const lastSalePrice =
    lastPrice != null
      ? lastPrice === 0
        ? `< 0.001 ${lastSalePaymentToken}`
        : `${lastPrice} ${lastSalePaymentToken}`
      : 'None';
  const priceOfEth = ethereumUtils.getEthPriceUnit() as number;

  const textColor = useMemo(() => {
    const contrastWithWhite = c.contrast(imageColor, colors.whiteLabel);

    if (contrastWithWhite < 2.125) {
      return lightModeThemeColors.dark;
    } else {
      return colors.whiteLabel;
    }
  }, [colors.whiteLabel, imageColor]);

  useEffect(() => {
    !isPoap &&
      asset.network !== AssetTypes.polygon &&
      apiGetUniqueTokenFloorPrice(network, urlSuffixForAsset).then(result => {
        setFloorPrice(result);
      });
  }, [asset.network, isPoap, network, urlSuffixForAsset]);

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
      message: android
        ? buildRainbowUrl(asset, accountENS, accountAddress)
        : undefined,
      title: `Share ${buildUniqueTokenName(asset)} Info`,
      url: buildRainbowUrl(asset, accountENS, accountAddress),
    });
  }, [accountAddress, accountENS, asset]);

  const toggleCurrentPriceDisplayCurrency = useCallback(
    () => setShowCurrentPriceInEth(!showCurrentPriceInEth),
    [showCurrentPriceInEth, setShowCurrentPriceInEth]
  );

  const toggleFloorDisplayCurrency = useCallback(
    () => setShowFloorInEth(!showFloorInEth),
    [showFloorInEth, setShowFloorInEth]
  );

  const sheetRef = useRef();
  const yPosition = useSharedValue(0);

  const hasSendButton = !external && !isReadOnlyWallet && isSendable;

  const familyLinkDisplay = useMemo(
    () =>
      familyLink ? new URL(familyLink).hostname.replace(/^www\./, '') : null,
    [familyLink]
  );

  return (
    <Fragment>
      {ios && (
        <BlurWrapper height={deviceHeight} width={deviceWidth}>
          <BackgroundImage>
            <UniqueTokenImage
              backgroundColor={asset.background || imageColor}
              imageUrl={asset.lowResUrl}
              item={asset}
              resizeMode="cover"
              size={CardSize}
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
        bottomInset={42}
        hideHandle
        {...(ios
          ? { height: '100%' }
          : { additionalTopPadding: true, contentHeight: deviceHeight })}
        ref={sheetRef}
        scrollEnabled
        showsVerticalScrollIndicator={!contentFocused}
        yPosition={yPosition}
      >
        <ColorModeProvider value="darkTinted">
          <AccentColorProvider color={imageColor}>
            <Inset bottom={sectionSpace} top={{ custom: 33 }}>
              <Stack alignHorizontal="center">
                <Animated.View style={sheetHandleStyle}>
                  {/* @ts-expect-error JavaScript component */}
                  <SheetHandle color={colors.alpha(colors.whiteLabel, 0.24)} />
                </Animated.View>
              </Stack>
            </Inset>
            <UniqueTokenExpandedStateContent
              animationProgress={animationProgress}
              asset={asset}
              horizontalPadding={24}
              imageColor={imageColor}
              onContentBlur={handleContentBlur}
              onContentFocus={handleContentFocus}
              // @ts-expect-error JavaScript component
              sheetRef={sheetRef}
              textColor={textColor}
              yPosition={yPosition}
            />
            <Animated.View style={opacityStyle}>
              <Inset horizontal="24px" vertical={sectionSpace}>
                <Stack space={sectionSpace}>
                  <Stack space="42px">
                    <Inline alignHorizontal="justify" wrap={false}>
                      <TextButton onPress={handlePressShowcase}>
                        {isShowcaseAsset
                          ? `􀁏 ${lang.t(
                              'expanded_state.unique_expanded.in_showcase'
                            )}`
                          : `􀁍 ${lang.t(
                              'expanded_state.unique_expanded.showcase'
                            )}`}
                      </TextButton>
                      <TextButton align="right" onPress={handlePressShare}>
                        􀈂 {lang.t('button.share')}
                      </TextButton>
                    </Inline>
                    <UniqueTokenExpandedStateHeader asset={asset} />
                  </Stack>
                  {!isPoap ? (
                    <Columns space="15px">
                      <SheetActionButton
                        color={imageColor}
                        // @ts-expect-error JavaScript component
                        label={
                          hasSendButton ? '􀮶 OpenSea' : '􀮶 View on OpenSea'
                        }
                        nftShadows
                        onPress={handlePressOpensea}
                        textColor={textColor}
                        weight="heavy"
                      />
                      {hasSendButton ? (
                        <SendActionButton
                          asset={asset}
                          color={imageColor}
                          nftShadows
                          textColor={textColor}
                        />
                      ) : null}
                    </Columns>
                  ) : null}
                  {asset.network === AssetTypes.polygon ? (
                    // @ts-expect-error JavaScript component
                    <L2Disclaimer
                      assetType={AssetTypes.polygon}
                      colors={colors}
                      hideDivider
                      isNft
                      marginBottom={0}
                      marginHorizontal={0}
                      onPress={handleL2DisclaimerPress}
                      symbol="NFT"
                    />
                  ) : null}
                  <Stack
                    separator={<Divider color="divider20" />}
                    space={sectionSpace}
                  >
                    {!isPoap && asset.network !== AssetTypes.polygon ? (
                      <Bleed // Manually crop surrounding space until TokenInfoItem uses design system components
                        bottom={android ? '15px' : '6px'}
                        top={android ? '10px' : '4px'}
                      >
                        <Columns space="19px">
                          {/* @ts-expect-error JavaScript component */}
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
                            title={
                              currentPrice ? '􀋢 For sale' : 'Last sale price'
                            }
                            weight={
                              lastSalePrice === 'None' && !currentPrice
                                ? 'bold'
                                : 'heavy'
                            }
                          >
                            {showCurrentPriceInEth ||
                            nativeCurrency === 'ETH' ||
                            !currentPrice
                              ? currentPrice || lastSalePrice
                              : convertAmountToNativeDisplay(
                                  // @ts-expect-error currentPrice is a number?
                                  parseFloat(currentPrice) * priceOfEth,
                                  nativeCurrency
                                )}
                          </TokenInfoItem>
                          {/* @ts-expect-error JavaScript component */}
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
                            floorPrice === 'None' ||
                            floorPrice === null
                              ? floorPrice
                              : convertAmountToNativeDisplay(
                                  parseFloat(floorPrice) * priceOfEth,
                                  nativeCurrency
                                )}
                          </TokenInfoItem>
                        </Columns>
                      </Bleed>
                    ) : null}
                    {description ? (
                      <Section title="Description">
                        <Markdown>{description}</Markdown>
                      </Section>
                    ) : null}
                    {traits.length ? (
                      <Section title="Properties">
                        <UniqueTokenAttributes
                          {...asset}
                          color={imageColor}
                          hideOpenSeaAction={isPoap}
                          slug={asset.collection.slug}
                        />
                      </Section>
                    ) : null}
                    {familyDescription ? (
                      <Section title={`About ${familyName}`}>
                        <Stack space={sectionSpace}>
                          <Markdown>{familyDescription}</Markdown>
                          {familyLink ? (
                            <Bleed // Manually crop surrounding space until Link uses design system components
                              bottom={android ? '15px' : undefined}
                              top="15px"
                            >
                              {/* @ts-expect-error JavaScript component */}
                              <Link
                                color={imageColor}
                                display={familyLinkDisplay}
                                url={familyLink}
                              />
                            </Bleed>
                          ) : null}
                        </Stack>
                      </Section>
                    ) : null}
                  </Stack>
                </Stack>
              </Inset>
              <Spacer />
            </Animated.View>
          </AccentColorProvider>
        </ColorModeProvider>
      </SlackSheet>
      <ToastPositionContainer>
        <ToggleStateToast
          addCopy={lang.t(
            'expanded_state.unique_expanded.toast_added_to_showcase'
          )}
          isAdded={isShowcaseAsset}
          removeCopy={lang.t(
            'expanded_state.unique_expanded.toast_removed_from_showcase'
          )}
        />
      </ToastPositionContainer>
    </Fragment>
  );
};

export default magicMemo(UniqueTokenExpandedState, 'asset');
