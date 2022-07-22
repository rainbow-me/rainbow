import { BlurView } from '@react-native-community/blur';
import c from 'chroma-js';
import lang from 'i18n-js';
import React, { ReactNode, useCallback, useMemo, useRef } from 'react';
import { InteractionManager, Linking, Share, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import URL from 'url-parse';
import { CardSize } from '../../components/unique-token/CardSize';
import useWallets from '../../hooks/useWallets';
import { lightModeThemeColors } from '../../styles/colors';
import L2Disclaimer from '../L2Disclaimer';
import Link from '../Link';
import { ButtonPressAnimation } from '../animations';
import ImagePreviewOverlay from '../images/ImagePreviewOverlay';
import ImgixImage from '../images/ImgixImage';
import {
  SendActionButton,
  SheetActionButton,
  SheetHandle,
  SlackSheet,
} from '../sheet';
import { ToastPositionContainer, ToggleStateToast } from '../toasts';
import { UniqueTokenAttributes, UniqueTokenImage } from '../unique-token';
import AdvancedSection from './ens/AdvancedSection';
import ConfigurationSection from './ens/ConfigurationSection';
import ProfileInfoSection from './ens/ProfileInfoSection';
import {
  UniqueTokenExpandedStateContent,
  UniqueTokenExpandedStateHeader,
} from './unique-token';
import ENSBriefTokenInfoRow from './unique-token/ENSBriefTokenInfoRow';
import NFTBriefTokenInfoRow from './unique-token/NFTBriefTokenInfoRow';
import { PROFILES, useExperimentalFlag } from '@rainbow-me/config';
import {
  AccentColorProvider,
  Bleed,
  Box,
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
import { Network } from '@rainbow-me/helpers';
import { buildUniqueTokenName } from '@rainbow-me/helpers/assets';
import { ENS_RECORDS, REGISTRATION_MODES } from '@rainbow-me/helpers/ens';
import {
  useAccountProfile,
  useBooleanState,
  useDimensions,
  useENSProfile,
  useENSRegistration,
  usePersistentDominantColorFromImage,
  useShowcaseTokens,
} from '@rainbow-me/hooks';
import { useNavigation, useUntrustedUrlOpener } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import { useTheme } from '@rainbow-me/theme';
import {
  buildRainbowUrl,
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
  size = '16px',
  weight = 'heavy',
}: {
  onPress: () => void;
  children: ReactNode;
  align?: TextProps['align'];
  size?: TextProps['size'];
  weight?: TextProps['weight'];
}) => {
  const hitSlop: Space = '19px';

  return (
    <Bleed space={hitSlop}>
      <ButtonPressAnimation onPress={onPress} scaleTo={0.88}>
        <Inset space={hitSlop}>
          <Text align={align} color="accent" size={size} weight={weight}>
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
const paragraphSpace: Space = { custom: 22 };
const listSpace: Space = '19px';

const Section = ({
  addonComponent,
  paragraphSpace = '24px',
  title,
  titleEmoji,
  titleImageUrl,
  children,
}: {
  addonComponent?: React.ReactNode;
  paragraphSpace?: Space;
  title: string;
  titleEmoji?: string;
  titleImageUrl?: string | null;
  children: ReactNode;
}) => (
  <Stack space={paragraphSpace}>
    <Inline alignHorizontal="justify" alignVertical="center" wrap={false}>
      <Inline alignVertical="center" space="8px">
        <Box width={{ custom: 24 }}>
          {titleImageUrl && (
            <Bleed vertical="8px">
              <Box
                as={ImgixImage}
                borderRadius={24}
                height={{ custom: 24 }}
                source={{ uri: titleImageUrl }}
                width={{ custom: 24 }}
              />
            </Bleed>
          )}
          {titleEmoji && (
            <Bleed right="1px">
              <Heading containsEmoji size={ios ? '23px' : '20px'}>
                {titleEmoji}
              </Heading>
            </Bleed>
          )}
        </Box>
        <Heading size={textSize}>{title}</Heading>
      </Inline>
      {addonComponent}
    </Inline>
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

export enum UniqueTokenType {
  NFT = 'NFT',
  ENS = 'ENS',
  POAP = 'POAP',
}

interface UniqueTokenExpandedStateProps {
  asset: UniqueAsset;
  external: boolean;
}

const getIsSupportedOnRainbowWeb = network => {
  switch (network) {
    case Network.mainnet:
    case Network.polygon:
      return true;
    default:
      return false;
  }
};

const UniqueTokenExpandedState = ({
  asset,
  external,
}: UniqueTokenExpandedStateProps) => {
  const isSupportedOnRainbowWeb = getIsSupportedOnRainbowWeb(asset.network);

  const { accountAddress, accountENS } = useAccountProfile();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { isReadOnlyWallet } = useWallets();

  const {
    collection: {
      description: familyDescription,
      external_url: familyLink,
      slug,
    },
    currentPrice,
    description,
    familyImage,
    familyName,
    isSendable,
    lastPrice,
    lastSalePaymentToken,
    marketplaceName,
    traits,
    uniqueId,
    urlSuffixForAsset,
  } = asset;

  const uniqueTokenType = useMemo(() => {
    if (asset.isPoap) return UniqueTokenType.POAP;
    if (familyName === 'ENS' && uniqueId !== 'Unknown ENS name') {
      return UniqueTokenType.ENS;
    }
    return UniqueTokenType.NFT;
  }, [asset.isPoap, familyName, uniqueId]);

  // Create deterministic boolean flags from the `uniqueTokenType` (for easier readability).
  const isPoap = uniqueTokenType === UniqueTokenType.POAP;
  const isENS = uniqueTokenType === UniqueTokenType.ENS;
  const isNFT = uniqueTokenType === UniqueTokenType.NFT;

  // Fetch the ENS profile if the unique token is an ENS name.
  const cleanENSName = isENS && uniqueId ? uniqueId?.split(' ')?.[0] : uniqueId;
  const ensProfile = useENSProfile(cleanENSName, { enabled: isENS });
  const ensData = ensProfile.data;

  const profileInfoSectionAvailable = useMemo(() => {
    const available = Object.keys(ensData?.records || {}).some(
      key => key !== ENS_RECORDS.avatar
    );
    return available;
  }, [ensData?.records]);

  const {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  } = useShowcaseTokens();

  const [
    contentFocused,
    handleContentFocus,
    handleContentBlur,
  ] = useBooleanState();
  const animationProgress = useSharedValue(0);
  const ensCoverAnimationProgress = useSharedValue(0);
  // TODO(jxom): This is temporary until `ZoomableWrapper` refactor
  const opacityStyle = useAnimatedStyle(() => ({
    opacity: 1 - (animationProgress.value || ensCoverAnimationProgress.value),
  }));
  // TODO(jxom): This is temporary until `ZoomableWrapper` refactor
  const sheetHandleStyle = useAnimatedStyle(() => ({
    opacity: 1 - (animationProgress.value || ensCoverAnimationProgress.value),
  }));
  // TODO(jxom): This is temporary until `ZoomableWrapper` refactor
  const contentOpacity = useDerivedValue(
    () => 1 - ensCoverAnimationProgress.value
  );
  // TODO(jxom): This is temporary until `ZoomableWrapper` refactor
  const ensCoverOpacity = useDerivedValue(() => 1 - animationProgress.value);

  const handleL2DisclaimerPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: asset.network,
    });
  }, [asset.network, navigate]);

  const isShowcaseAsset = useMemo(
    () => showcaseTokens.includes(uniqueId) as boolean,
    [showcaseTokens, uniqueId]
  );

  const rainbowWebUrl = buildRainbowUrl(asset, accountENS, accountAddress);

  const imageColor =
    // @ts-expect-error image_url could be null or undefined?
    usePersistentDominantColorFromImage(asset.lowResUrl).result ||
    colors.paleBlue;

  const textColor = useMemo(() => {
    const contrastWithWhite = c.contrast(imageColor, colors.whiteLabel);

    if (contrastWithWhite < 2.125) {
      return lightModeThemeColors.dark;
    } else {
      return colors.whiteLabel;
    }
  }, [colors.whiteLabel, imageColor]);

  const handlePressMarketplaceName = useCallback(
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
    const shareUrl = isSupportedOnRainbowWeb ? rainbowWebUrl : asset.permalink;

    Share.share({
      message: android ? shareUrl : undefined,
      title: `Share ${buildUniqueTokenName(asset)} Info`,
      url: shareUrl,
    });
  }, [asset, isSupportedOnRainbowWeb, rainbowWebUrl]);

  const { startRegistration } = useENSRegistration();
  const handlePressEdit = useCallback(() => {
    if (isENS) {
      InteractionManager.runAfterInteractions(() => {
        startRegistration(uniqueId, REGISTRATION_MODES.EDIT);
        navigate(Routes.REGISTER_ENS_NAVIGATOR, {
          ensName: uniqueId,
          externalAvatarUrl: asset?.lowResUrl,
          mode: REGISTRATION_MODES.EDIT,
        });
      });
    }
  }, [isENS, navigate, startRegistration, uniqueId, asset?.lowResUrl]);

  const sheetRef = useRef();
  const yPosition = useSharedValue(0);

  const profilesEnabled = useExperimentalFlag(PROFILES);
  const isActionsEnabled = !external && !isReadOnlyWallet;
  const hasSendButton = isActionsEnabled && isSendable;

  const hasEditButton =
    isActionsEnabled && profilesEnabled && isENS && ensProfile.isOwner;
  const hasExtendDurationButton = !isReadOnlyWallet && profilesEnabled && isENS;

  const familyLinkDisplay = useMemo(
    () =>
      familyLink ? new URL(familyLink).hostname.replace(/^www\./, '') : null,
    [familyLink]
  );

  const hideNftMarketplaceAction = isPoap || !slug;

  return (
    <>
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
        testID="unique-token-expanded-state"
        yPosition={yPosition}
      >
        <ColorModeProvider value="darkTinted">
          <AccentColorProvider color={imageColor}>
            <ImagePreviewOverlay
              opacity={ensCoverOpacity}
              yPosition={yPosition}
            >
              <Inset bottom={sectionSpace} top={{ custom: 33 }}>
                <Stack alignHorizontal="center">
                  <Animated.View style={sheetHandleStyle}>
                    {/* @ts-expect-error JavaScript component */}
                    <SheetHandle
                      color={colors.alpha(colors.whiteLabel, 0.24)}
                    />
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
                opacity={contentOpacity}
                // @ts-expect-error JavaScript component
                sheetRef={sheetRef}
                textColor={textColor}
                uniqueId={asset.uniqueId}
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
                        {isSupportedOnRainbowWeb || asset.permalink ? (
                          <TextButton align="right" onPress={handlePressShare}>
                            􀈂 {lang.t('button.share')}
                          </TextButton>
                        ) : null}
                      </Inline>
                      <UniqueTokenExpandedStateHeader
                        asset={asset}
                        hideNftMarketplaceAction={hideNftMarketplaceAction}
                        isSupportedOnRainbowWeb={isSupportedOnRainbowWeb}
                        rainbowWebUrl={rainbowWebUrl}
                      />
                    </Stack>
                    {isNFT || isENS ? (
                      <Columns space="15px">
                        {hasEditButton ? (
                          <SheetActionButton
                            color={imageColor}
                            // @ts-expect-error JavaScript component
                            label={`􀉮 ${lang.t(
                              'expanded_state.unique_expanded.edit'
                            )}`}
                            nftShadows
                            onPress={handlePressEdit}
                            textColor={textColor}
                            weight="heavy"
                          />
                        ) : asset.permalink ? (
                          <SheetActionButton
                            color={imageColor}
                            // @ts-expect-error JavaScript component
                            label={
                              hasSendButton
                                ? `􀮶 ${marketplaceName}`
                                : `􀮶 ${lang.t(
                                    'expanded_state.unique_expanded.view_on_marketplace_name',
                                    {
                                      marketplaceName,
                                    }
                                  )}`
                            }
                            nftShadows
                            onPress={handlePressMarketplaceName}
                            textColor={textColor}
                            weight="heavy"
                          />
                        ) : null}
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
                    {asset.network !== Network.mainnet ? (
                      // @ts-expect-error JavaScript component
                      <L2Disclaimer
                        assetType={asset.network}
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
                      {(isNFT || isENS) &&
                      asset.network !== AssetTypes.polygon ? (
                        <Bleed // Manually crop surrounding space until TokenInfoItem uses design system components
                          bottom={android ? '15px' : '6px'}
                          top={android ? '10px' : '4px'}
                        >
                          {isNFT && (
                            <NFTBriefTokenInfoRow
                              currentPrice={currentPrice}
                              lastPrice={lastPrice}
                              lastSalePaymentToken={lastSalePaymentToken}
                              network={asset.network}
                              urlSuffixForAsset={urlSuffixForAsset}
                            />
                          )}
                          {isENS && (
                            <ENSBriefTokenInfoRow
                              color={imageColor}
                              ensName={uniqueId}
                              expiryDate={ensData?.registration.expiryDate}
                              externalAvatarUrl={asset?.lowResUrl}
                              registrationDate={
                                ensData?.registration.registrationDate
                              }
                              showExtendDuration={hasExtendDurationButton}
                            />
                          )}
                        </Bleed>
                      ) : null}
                      {(isNFT || isPoap) && (
                        <>
                          {description ? (
                            <Section
                              title={`${lang.t(
                                'expanded_state.unique_expanded.description'
                              )}`}
                              titleEmoji="📖"
                            >
                              <Markdown>{description}</Markdown>
                            </Section>
                          ) : null}
                          {traits.length ? (
                            <Section
                              title={`${lang.t(
                                'expanded_state.unique_expanded.properties'
                              )}`}
                              titleEmoji="🎨"
                            >
                              <UniqueTokenAttributes
                                {...asset}
                                color={imageColor}
                                hideNftMarketplaceAction={
                                  hideNftMarketplaceAction
                                }
                                slug={slug}
                              />
                            </Section>
                          ) : null}
                        </>
                      )}
                      {isENS && (
                        <>
                          {profileInfoSectionAvailable && (
                            <Section
                              addonComponent={
                                hasEditButton && (
                                  <TextButton
                                    align="right"
                                    onPress={handlePressEdit}
                                    size="18px"
                                    weight="bold"
                                  >
                                    {lang.t(
                                      'expanded_state.unique_expanded.edit'
                                    )}
                                  </TextButton>
                                )
                              }
                              paragraphSpace={{ custom: 22 }}
                              title={`${lang.t(
                                'expanded_state.unique_expanded.profile_info'
                              )}`}
                              titleEmoji="🤿"
                            >
                              <ProfileInfoSection
                                allowEdit={hasEditButton}
                                coinAddresses={ensData?.coinAddresses}
                                ensName={uniqueId}
                                images={ensData?.images}
                                isLoading={ensProfile.isLoading}
                                records={ensData?.records}
                              />
                            </Section>
                          )}
                          <Section
                            paragraphSpace={{ custom: 22 }}
                            title={`${lang.t(
                              'expanded_state.unique_expanded.configuration'
                            )}`}
                            titleEmoji="⚙️"
                          >
                            <ConfigurationSection
                              externalAvatarUrl={asset?.lowResUrl}
                              isExternal={external}
                              isLoading={ensProfile.isLoading}
                              isOwner={ensProfile?.isOwner}
                              isPrimary={ensProfile?.isPrimaryName}
                              isProfilesEnabled={profilesEnabled}
                              isReadOnlyWallet={isReadOnlyWallet}
                              isSetNameEnabled={ensProfile?.isSetNameEnabled}
                              name={cleanENSName}
                              owner={ensData?.owner}
                              registrant={ensData?.registrant}
                            />
                          </Section>
                          <Section
                            paragraphSpace={{ custom: 22 }}
                            title={`${lang.t(
                              'expanded_state.unique_expanded.advanced'
                            )}`}
                            titleEmoji="👽"
                          >
                            <AdvancedSection resolver={ensData?.resolver} />
                          </Section>
                        </>
                      )}
                      {familyDescription ? (
                        <Section
                          paragraphSpace={{ custom: 26 }}
                          title={`${lang.t(
                            'expanded_state.unique_expanded.about',
                            { assetFamilyName: familyName }
                          )}`}
                          titleImageUrl={familyImage}
                        >
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
                                  weight="bold"
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
            </ImagePreviewOverlay>
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
    </>
  );
};

export default magicMemo(UniqueTokenExpandedState, 'asset');
