import { BlurView } from '@react-native-community/blur';
import c from 'chroma-js';
import lang from 'i18n-js';
import React, {
  Fragment,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
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
import { useTheme } from '@rainbow-me/context';
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
import { buildUniqueTokenName } from '@rainbow-me/helpers/assets';
import {
  useAccountProfile,
  useDimensions,
  useENSProfile,
  usePersistentDominantColorFromImage,
  useShowcaseTokens,
} from '@rainbow-me/hooks';
import { useNavigation, useUntrustedUrlOpener } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
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
const paragraphSpace: Space = '24px';
const listSpace: Space = '19px';

const Section = ({
  addonComponent,
  title,
  titleEmoji,
  titleImageUrl,
  children,
}: {
  addonComponent?: React.ReactNode;
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

const UniqueTokenExpandedState = ({
  asset,
  external,
}: UniqueTokenExpandedStateProps) => {
  const { accountAddress, accountENS } = useAccountProfile();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();
  const { isReadOnlyWallet } = useWallets();

  const {
    collection: { description: familyDescription, external_url: familyLink },
    currentPrice,
    description,
    familyImage,
    familyName,
    isSendable,
    lastPrice,
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
  const ensProfile = useENSProfile(uniqueId, { enabled: isENS });
  const ensData = ensProfile.data;

  const {
    addShowcaseToken,
    removeShowcaseToken,
    showcaseTokens,
  } = useShowcaseTokens();

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
    usePersistentDominantColorFromImage(asset.image_url).result ||
    colors.paleBlue;

  const textColor = useMemo(() => {
    const contrastWithWhite = c.contrast(imageColor, colors.whiteLabel);

    if (contrastWithWhite < 2.125) {
      return lightModeThemeColors.dark;
    } else {
      return colors.whiteLabel;
    }
  }, [colors.whiteLabel, imageColor]);

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

  const handlePressEdit = useCallback(() => {
    if (isENS) {
      navigate(Routes.REGISTER_ENS_NAVIGATOR, {
        ensName: uniqueId,
        mode: 'edit',
      });
    }
  }, [isENS, navigate, uniqueId]);

  const sheetRef = useRef();
  const yPosition = useSharedValue(0);

  const isActionsEnabled = !external && !isReadOnlyWallet;
  const hasSendButton = isActionsEnabled && isSendable;
  const hasEditButton = isActionsEnabled && isENS;

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
              backgroundColor={asset.background}
              imageUrl={asset.image_url}
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
                  {isNFT || isENS ? (
                    <Columns space="15px">
                      {hasEditButton ? (
                        <SheetActionButton
                          color={imageColor}
                          // @ts-expect-error JavaScript component
                          label="􀉮 Edit"
                          nftShadows
                          onPress={handlePressEdit}
                          textColor={textColor}
                          weight="heavy"
                        />
                      ) : (
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
                      )}
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
                            network={asset.network}
                            urlSuffixForAsset={urlSuffixForAsset}
                          />
                        )}
                        {isENS && (
                          <ENSBriefTokenInfoRow
                            expiryDate={ensData?.registration.expiryDate}
                            registrationDate={
                              ensData?.registration.registrationDate
                            }
                          />
                        )}
                      </Bleed>
                    ) : null}
                    {(isNFT || isPoap) && (
                      <>
                        {description ? (
                          <Section title="Description" titleEmoji="📖">
                            <Markdown>{description}</Markdown>
                          </Section>
                        ) : null}
                        {traits.length ? (
                          <Section title="Properties" titleEmoji="🎨">
                            <UniqueTokenAttributes
                              {...asset}
                              color={imageColor}
                              disableMenu={isPoap}
                              slug={asset.collection.slug}
                            />
                          </Section>
                        ) : null}
                      </>
                    )}
                    {isENS && (
                      <>
                        <Section
                          addonComponent={
                            hasEditButton && (
                              <TextButton
                                align="right"
                                onPress={handlePressEdit}
                                size="18px"
                                weight="bold"
                              >
                                Edit
                              </TextButton>
                            )
                          }
                          title="Profile Info"
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
                        <Section title="Configuration" titleEmoji="⚙️">
                          <ConfigurationSection
                            isLoading={ensProfile.isLoading}
                            owner={ensData?.owner}
                            registrant={ensData?.registrant}
                          />
                        </Section>
                        <Section title="Advanced" titleEmoji="👽">
                          <AdvancedSection resolver={ensData?.resolver} />
                        </Section>
                      </>
                    )}
                    {familyDescription ? (
                      <Section
                        title={`About ${familyName}`}
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
