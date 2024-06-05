import { BlurView } from '@react-native-community/blur';
import { useFocusEffect } from '@react-navigation/native';
import c from 'chroma-js';
import lang from 'i18n-js';
import React, { ReactNode, useCallback, useMemo, useRef, useState } from 'react';
import { InteractionManager, Linking, Share, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import URL from 'url-parse';
import useWallets from '../../hooks/useWallets';
import L2Disclaimer from '../L2Disclaimer';
import Link from '../Link';
import { ButtonPressAnimation } from '../animations';
import ImagePreviewOverlay from '../images/ImagePreviewOverlay';
import ImgixImage from '../images/ImgixImage';
import { SendActionButton, SheetActionButton, SheetHandle, SlackSheet } from '../sheet';
import { Toast, ToastPositionContainer, ToggleStateToast } from '../toasts';
import { UniqueTokenAttributes, UniqueTokenImage } from '../unique-token';
import { CardSize } from '../unique-token/CardSize';
import ConfigurationSection from './ens/ConfigurationSection';
import ProfileInfoSection from './ens/ProfileInfoSection';
import { UniqueTokenExpandedStateContent, UniqueTokenExpandedStateHeader } from './unique-token';
import ENSBriefTokenInfoRow from './unique-token/ENSBriefTokenInfoRow';
import NFTBriefTokenInfoRow from './unique-token/NFTBriefTokenInfoRow';
import { PROFILES, useExperimentalFlag } from '@/config';
import partyLogo from '../../assets/partyLogo.png';
import {
  AccentColorProvider,
  Bleed,
  Box,
  ColorModeProvider,
  Columns,
  Heading,
  HeadingProps,
  Inline,
  Inset,
  MarkdownText,
  MarkdownTextProps,
  Separator,
  Space,
  Stack,
  Text,
  TextProps,
} from '@/design-system';
import { UniqueAsset } from '@/entities';
import { Network } from '@/helpers';
import { buildUniqueTokenName } from '@/helpers/assets';
import { ENS_RECORDS, REGISTRATION_MODES } from '@/helpers/ens';
import {
  useAccountProfile,
  useBooleanState,
  useCollectible,
  useDimensions,
  useENSProfile,
  useENSRegistration,
  useHiddenTokens,
  useShowcaseTokens,
} from '@/hooks';
import { useNavigation, useUntrustedUrlOpener } from '@/navigation';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { lightModeThemeColors, position } from '@/styles';
import { useTheme } from '@/theme';
import { getUniqueTokenType, magicMemo, safeAreaInsetValues } from '@/utils';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { buildRainbowUrl } from '@/utils/buildRainbowUrl';
import isHttpUrl from '@/helpers/isHttpUrl';
import { useNFTOffers } from '@/resources/reservoir/nftOffersQuery';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';

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
  size = '16px / 22px (Deprecated)',
  weight = 'heavy',
}: {
  onPress: () => void;
  children: ReactNode;
  align?: TextProps['align'];
  size?: TextProps['size'];
  weight?: TextProps['weight'];
}) => {
  const hitSlop: Space = '19px (Deprecated)';

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

const headingSize: HeadingProps['size'] = '18px / 21px (Deprecated)';
const textSize: TextProps['size'] = '18px / 27px (Deprecated)';
const textColor: TextProps['color'] = 'secondary50 (Deprecated)';
const sectionSpace: Space = '30px (Deprecated)';
const paragraphSpace: Space = { custom: 22 };
const listSpace: Space = '19px (Deprecated)';

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
                size={30}
              />
            </Bleed>
          )}
          {titleEmoji && (
            <Bleed right="1px (Deprecated)">
              <Heading
                containsEmoji
                color="primary (Deprecated)"
                size={ios ? '23px / 27px (Deprecated)' : '20px / 22px (Deprecated)'}
                weight="heavy"
              >
                {titleEmoji}
              </Heading>
            </Bleed>
          )}
        </Box>
        <Heading color="primary (Deprecated)" size={headingSize} weight="heavy">
          {title}
        </Heading>
      </Inline>
      {addonComponent}
    </Inline>
    {children}
  </Stack>
);

const Markdown = ({ children }: { children: MarkdownTextProps['children'] }) => {
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

// TODO(RNBW-4552): renable polygon once remote allowlist is updated on web.
const getIsSupportedOnRainbowWeb = (network: Network) => {
  switch (network) {
    case Network.mainnet:
      return true;
    default:
      return false;
  }
};

const UniqueTokenExpandedState = ({ asset: passedAsset, external }: UniqueTokenExpandedStateProps) => {
  const { accountAddress } = useAccountProfile();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate, setOptions } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { isReadOnlyWallet } = useWallets();
  const collectible = useCollectible(passedAsset?.uniqueId);
  const asset = external ? passedAsset : collectible;
  const {
    data: { nftOffers },
  } = useNFTOffers({
    walletAddress: accountAddress,
  });

  const offer = useMemo(() => nftOffers?.find(offer => offer.nft.uniqueId === asset.fullUniqueId), [asset.fullUniqueId, nftOffers]);
  const offerValue = useMemo(
    () =>
      offer
        ? convertAmountToNativeDisplay(
            offer.netAmount.usd,
            'USD',
            undefined,
            // don't show decimals
            true,
            // abbreviate if amount is >= 10,000
            offer.netAmount.decimal >= 10_000
          )
        : undefined,
    [offer]
  );

  const isSupportedOnRainbowWeb = getIsSupportedOnRainbowWeb(asset.network);

  const [isRefreshMetadataToastActive, setIsRefreshMetadataToastActive] = useState(false);
  const [isReportSpamToastActive, setIsReportSpamToastActive] = useState(false);

  const activateRefreshMetadataToast = useCallback(() => {
    if (!isRefreshMetadataToastActive) {
      setIsRefreshMetadataToastActive(true);
      setTimeout(() => {
        setIsRefreshMetadataToastActive(false);
      }, 3000);
    }
  }, [isRefreshMetadataToastActive]);

  const activateReportSpamToast = useCallback(() => {
    if (!isReportSpamToastActive) {
      setIsReportSpamToastActive(true);
      setTimeout(() => {
        setIsReportSpamToastActive(false);
      }, 3000);
    }
  }, [isReportSpamToastActive]);

  const {
    collection: { description: familyDescription, external_url: familyLink, slug },
    description,
    familyImage,
    familyName,
    isSendable,
    marketplaceName,
    traits,
    uniqueId,
    fullUniqueId,
  } = asset;

  const filteredTraits = traits.filter(
    trait => trait.value !== undefined && trait.value !== null && trait.value !== '' && trait.trait_type && !isHttpUrl(trait.value)
  );

  const uniqueTokenType = getUniqueTokenType(asset);

  // Create deterministic boolean flags from the `uniqueTokenType` (for easier readability).
  const isPoap = uniqueTokenType === 'POAP';
  const isENS = uniqueTokenType === 'ENS';
  const isNFT = uniqueTokenType === 'NFT';

  // Fetch the ENS profile if the unique token is an ENS name.
  const cleanENSName = isENS ? (uniqueId ? uniqueId?.split(' ')?.[0] : uniqueId) : '';
  const ensProfile = useENSProfile(cleanENSName, {
    enabled: isENS,
  });
  const ensData = ensProfile.data;

  useFocusEffect(
    useCallback(() => {
      if (uniqueTokenType === 'ENS') {
        setOptions({ limitActiveModals: false });
      }
    }, [setOptions, uniqueTokenType])
  );

  const profileInfoSectionAvailable = useMemo(() => {
    const available = Object.keys(ensData?.records || {}).some(key => key !== ENS_RECORDS.avatar);
    return available;
  }, [ensData?.records]);

  const { addShowcaseToken, removeShowcaseToken, showcaseTokens } = useShowcaseTokens();
  const { hiddenTokens, removeHiddenToken } = useHiddenTokens();

  const [contentFocused, handleContentFocus, handleContentBlur] = useBooleanState();
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
  const contentOpacity = useDerivedValue(() => 1 - ensCoverAnimationProgress.value);
  // TODO(jxom): This is temporary until `ZoomableWrapper` refactor
  const ensCoverOpacity = useDerivedValue(() => 1 - animationProgress.value);

  const handleL2DisclaimerPress = useCallback(() => {
    navigate(Routes.EXPLAIN_SHEET, {
      type: asset.network,
    });
  }, [asset.network, navigate]);

  const isHiddenAsset = useMemo(() => hiddenTokens.includes(fullUniqueId) as boolean, [hiddenTokens, fullUniqueId]);
  const isShowcaseAsset = useMemo(() => showcaseTokens.includes(uniqueId) as boolean, [showcaseTokens, uniqueId]);

  const rainbowWebUrl = buildRainbowUrl(asset, cleanENSName, accountAddress);

  const imageColor = usePersistentDominantColorFromImage(asset.lowResUrl) ?? colors.paleBlue;

  const textColor = useMemo(() => {
    const contrastWithWhite = c.contrast(imageColor, colors.whiteLabel);

    if (contrastWithWhite < 2.125) {
      return lightModeThemeColors.dark;
    } else {
      return colors.whiteLabel;
    }
  }, [colors.whiteLabel, imageColor]);

  const handlePressMarketplaceName = useCallback(() => Linking.openURL(asset.permalink), [asset.permalink]);
  const handlePressParty = useCallback(() => Linking.openURL(asset.external_link!), [asset.external_link]);

  const handlePressShowcase = useCallback(() => {
    if (isShowcaseAsset) {
      removeShowcaseToken(asset.uniqueId);
    } else {
      addShowcaseToken(asset.uniqueId);

      if (isHiddenAsset) {
        removeHiddenToken(asset);
      }
    }
  }, [addShowcaseToken, isHiddenAsset, isShowcaseAsset, removeHiddenToken, removeShowcaseToken, asset]);

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
  const hasSendButton = isSendable;
  const isParty = asset?.external_link?.includes('party.app');

  const hasEditButton = isActionsEnabled && profilesEnabled && isENS && ensProfile.isOwner;
  const hasExtendDurationButton = !isReadOnlyWallet && profilesEnabled && isENS;

  const familyLinkDisplay = useMemo(() => (familyLink ? new URL(familyLink).hostname.replace(/^www\./, '') : null), [familyLink]);

  const hideNftMarketplaceAction = isPoap || !slug;

  return (
    <>
      {ios && (
        <BlurWrapper height={deviceHeight} width={deviceWidth}>
          <BackgroundImage>
            <UniqueTokenImage backgroundColor={asset.background || imageColor} imageUrl={asset.lowResUrl} item={asset} size={CardSize} />
            <BackgroundBlur />
          </BackgroundImage>
        </BlurWrapper>
      )}
      <SlackSheet
        backgroundColor={isDarkMode ? `rgba(22, 22, 22, ${ios ? 0.4 : 1})` : `rgba(26, 26, 26, ${ios ? 0.4 : 1})`}
        bottomInset={42}
        hideHandle
        {...(ios ? { height: '100%' } : { additionalTopPadding: true, contentHeight: deviceHeight })}
        ref={sheetRef}
        scrollEnabled
        showsVerticalScrollIndicator={!contentFocused}
        testID="unique-token-expanded-state"
        yPosition={yPosition}
      >
        <ColorModeProvider value="darkTinted">
          <AccentColorProvider color={imageColor}>
            <ImagePreviewOverlay enableZoom={ios} opacity={ensCoverOpacity} yPosition={yPosition}>
              <Inset bottom={sectionSpace} top={{ custom: 33 }}>
                <Stack alignHorizontal="center">
                  <Animated.View style={sheetHandleStyle}>
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
                    <Stack space="42px (Deprecated)">
                      <Inline alignHorizontal="justify" wrap={false}>
                        {isActionsEnabled ? (
                          <TextButton onPress={handlePressShowcase}>
                            {isShowcaseAsset
                              ? `􀁏 ${lang.t('expanded_state.unique_expanded.in_showcase')}`
                              : `􀁍 ${lang.t('expanded_state.unique_expanded.showcase')}`}
                          </TextButton>
                        ) : (
                          <View />
                        )}
                        {isSupportedOnRainbowWeb || asset.permalink ? (
                          <TextButton align="right" onPress={handlePressShare}>
                            􀈂 {lang.t('button.share')}
                          </TextButton>
                        ) : null}
                      </Inline>
                      <UniqueTokenExpandedStateHeader
                        asset={asset}
                        hideNftMarketplaceAction={hideNftMarketplaceAction}
                        isModificationActionsEnabled={isActionsEnabled}
                        isSupportedOnRainbowWeb={isSupportedOnRainbowWeb}
                        rainbowWebUrl={rainbowWebUrl}
                        onRefresh={activateRefreshMetadataToast}
                        onReport={activateReportSpamToast}
                      />
                    </Stack>
                    <Stack space="15px (Deprecated)">
                      {isNFT || isENS ? (
                        <Columns space="15px (Deprecated)">
                          {hasEditButton ? (
                            <SheetActionButton
                              color={imageColor}
                              label={`􀉮 ${lang.t('expanded_state.unique_expanded.edit')}`}
                              nftShadows
                              onPress={handlePressEdit}
                              testID="edit"
                              textColor={textColor}
                              weight="heavy"
                            />
                          ) : isParty ? (
                            <SheetActionButton
                              color={imageColor}
                              nftShadows
                              onPress={handlePressParty}
                              testID="unique-expanded-state-party-button"
                              textColor={textColor}
                              weight="heavy"
                            >
                              <ImgixImage resizeMode="contain" source={partyLogo as any} size={20} style={{ height: 25, width: 25 }} />
                              <Text weight="heavy" size="20pt" color={{ custom: textColor }}>
                                Party
                              </Text>
                            </SheetActionButton>
                          ) : asset.permalink ? (
                            <SheetActionButton
                              color={imageColor}
                              label={
                                hasSendButton
                                  ? `􀮶 ${marketplaceName}`
                                  : `􀮶 ${lang.t('expanded_state.unique_expanded.view_on_marketplace_name', {
                                      marketplaceName,
                                    })}`
                              }
                              nftShadows
                              onPress={handlePressMarketplaceName}
                              testID="unique-expanded-state-send"
                              textColor={textColor}
                              weight="heavy"
                            />
                          ) : null}
                          {hasSendButton ? <SendActionButton asset={asset} color={imageColor} nftShadows textColor={textColor} /> : null}
                        </Columns>
                      ) : null}
                      {!!offer && (
                        <SheetActionButton
                          color={imageColor}
                          label={`􀋡 ${lang.t('expanded_state.unique_expanded.sell_for_x', {
                            price: offerValue,
                          })}`}
                          nftShadows
                          onPress={() => navigate(Routes.NFT_SINGLE_OFFER_SHEET, { offer })}
                          textColor={textColor}
                          weight="heavy"
                        />
                      )}
                    </Stack>
                    {asset.network !== Network.mainnet ? (
                      // @ts-expect-error JavaScript component
                      <L2Disclaimer
                        network={asset.network}
                        colors={colors}
                        hideDivider
                        isNft
                        marginBottom={0}
                        marginHorizontal={0}
                        onPress={handleL2DisclaimerPress}
                        symbol="NFT"
                        forceDarkMode
                      />
                    ) : null}
                    <Stack separator={<Separator color="divider20 (Deprecated)" />} space={sectionSpace}>
                      {isNFT || isENS ? (
                        <Bleed // Manually crop surrounding space until TokenInfoItem uses design system components
                          bottom={android ? '15px (Deprecated)' : '6px'}
                          top={android ? '10px' : '4px'}
                        >
                          {isNFT && <NFTBriefTokenInfoRow asset={asset} />}
                          {isENS && (
                            <ENSBriefTokenInfoRow
                              color={imageColor}
                              ensName={uniqueId}
                              expiryDate={ensData?.registration?.expiryDate}
                              externalAvatarUrl={asset?.lowResUrl}
                              registrationDate={ensData?.registration?.registrationDate}
                              showExtendDuration={hasExtendDurationButton}
                            />
                          )}
                        </Bleed>
                      ) : null}
                      {(isNFT || isPoap) && (
                        <>
                          {description ? (
                            <Section title={`${lang.t('expanded_state.unique_expanded.description')}`} titleEmoji="📖">
                              <Markdown>{description}</Markdown>
                            </Section>
                          ) : null}
                          {filteredTraits.length ? (
                            <Section title={`${lang.t('expanded_state.unique_expanded.properties')}`} titleEmoji="🎨">
                              <UniqueTokenAttributes
                                {...asset}
                                color={imageColor}
                                hideNftMarketplaceAction={hideNftMarketplaceAction}
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
                                  <TextButton align="right" onPress={handlePressEdit} size="18px / 27px (Deprecated)" weight="bold">
                                    {lang.t('expanded_state.unique_expanded.edit')}
                                  </TextButton>
                                )
                              }
                              paragraphSpace={{ custom: 22 }}
                              title={`${lang.t('expanded_state.unique_expanded.profile_info')}`}
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
                            title={`${lang.t('expanded_state.unique_expanded.configuration')}`}
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
                        </>
                      )}
                      {familyDescription ? (
                        <Section
                          paragraphSpace={{ custom: 26 }}
                          title={`${lang.t('expanded_state.unique_expanded.about', { assetFamilyName: familyName })}`}
                          titleImageUrl={familyImage}
                        >
                          <Stack space={sectionSpace}>
                            <Markdown>{familyDescription}</Markdown>
                            {familyLink ? (
                              <Bleed // Manually crop surrounding space until Link uses design system components
                                bottom={android ? '15px (Deprecated)' : undefined}
                                top="15px (Deprecated)"
                              >
                                {/* @ts-expect-error JavaScript component */}
                                <Link color={imageColor} display={familyLinkDisplay} url={familyLink} weight="bold" />
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
          addCopy={lang.t('expanded_state.unique_expanded.toast_added_to_showcase')}
          isAdded={isShowcaseAsset}
          removeCopy={lang.t('expanded_state.unique_expanded.toast_removed_from_showcase')}
        />
        <Toast isVisible={isRefreshMetadataToastActive} text={lang.t('expanded_state.unique_expanded.refreshing')} />
        <Toast isVisible={isReportSpamToastActive} text={lang.t('expanded_state.unique_expanded.reported')} />
      </ToastPositionContainer>
    </>
  );
};

export default magicMemo(UniqueTokenExpandedState, 'asset');
