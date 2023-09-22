import styled from '@/styled-thing';
import {
  AccentColorProvider,
  Box,
  ColorModeProvider,
  Column,
  Columns,
  Cover,
  Inline,
  Stack,
  Text,
  globalColors,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import React, { useEffect, useState } from 'react';
import { ButtonPressAnimation } from '../animations';
import { useMints } from '@/resources/mints';
import { useAccountProfile, useDimensions } from '@/hooks';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { ImgixImage } from '../images';
import {
  abbreviateNumber,
  convertRawAmountToRoundedDecimal,
} from '@/helpers/utilities';
import { BlurView } from '@react-native-community/blur';
import { Linking, View } from 'react-native';
import { IS_IOS } from '@/env';
import { Media } from '../Media';
import { analyticsV2 } from '@/analytics';
import * as i18n from '@/languages';

const IMAGE_SIZE = 111;

const BlurWrapper = styled(View).attrs({
  shouldRasterizeIOS: true,
})({
  // @ts-expect-error missing theme types
  backgroundColor: ({ theme: { colors } }) => colors.trueBlack,
  height: '100%',
  left: 0,
  overflow: 'hidden',
  position: 'absolute',
  width: '100%',
});

export function FeaturedMintCard() {
  const { accountAddress } = useAccountProfile();
  const {
    data: { featuredMint },
  } = useMints({
    walletAddress: accountAddress,
  });
  const { width: deviceWidth } = useDimensions();

  const [mediaRendered, setMediaRendered] = useState(false);
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';

  const imageUrl =
    featuredMint?.imageURL ||
    featuredMint?.recentMints?.find(m => m.imageURI)?.imageURI;

  const mimeType = featuredMint?.imageURL
    ? featuredMint?.imageMimeType
    : featuredMint?.recentMints?.find(m => m.imageURI)?.mimeType;

  const labelSecondary = useForegroundColor('labelSecondary');
  const accentColor = usePersistentDominantColorFromImage(imageUrl);
  const secondaryTextColor = imageUrl ? 'accent' : 'labelSecondary';

  useEffect(() => setMediaRendered(false), [imageUrl]);

  return featuredMint ? (
    <ColorModeProvider value="darkTinted">
      <AccentColorProvider color={accentColor ?? labelSecondary}>
        <View
          style={
            IS_IOS
              ? {
                  shadowColor: globalColors.grey100,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.02,
                  shadowRadius: 3,
                }
              : {}
          }
        >
          <View
            style={
              IS_IOS
                ? {
                    shadowColor: globalColors.grey100,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDarkMode ? 0.24 : 0.08,
                    shadowRadius: 9,
                  }
                : {
                    shadowColor: globalColors.grey100,
                    elevation: 12,
                    shadowOpacity: 1,
                  }
            }
          >
            <ButtonPressAnimation
              style={{
                borderRadius: 24,
                overflow: 'hidden',
                padding: 12,
              }}
              onPress={() => {
                analyticsV2.track(
                  analyticsV2.event.mintsPressedFeaturedMintCard,
                  {
                    contractAddress: featuredMint.contractAddress,
                    chainId: featuredMint.chainId,
                    totalMints: featuredMint.totalMints,
                    mintsLastHour: featuredMint.totalMints,
                    priceInEth: convertRawAmountToRoundedDecimal(
                      featuredMint.mintStatus.price,
                      18,
                      6
                    ),
                  }
                );
                Linking.openURL(featuredMint.externalURL);
              }}
              scaleTo={0.96}
            >
              <Cover>
                <BlurWrapper>
                  {!!imageUrl && (
                    <Cover>
                      <ImgixImage
                        resizeMode="cover"
                        style={{
                          borderRadius: 24,
                          height: '100%',
                          width: '100%',
                        }}
                        source={{ uri: imageUrl }}
                        size={deviceWidth - 40}
                        fm="png"
                      />
                    </Cover>
                  )}
                  <Cover>
                    <BlurView
                      blurAmount={100}
                      blurType="light"
                      style={{
                        width: '100%',
                        height: '100%',
                      }}
                    />
                  </Cover>
                  <Cover>
                    <View
                      style={{
                        height: '100%',
                        width: '100%',
                        backgroundColor: `rgba(22, 22, 22, ${ios ? 0.5 : 1})`,
                      }}
                    />
                  </Cover>
                </BlurWrapper>
              </Cover>
              <Columns>
                <Column>
                  <Box
                    alignItems="flex-start"
                    justifyContent="space-between"
                    flexGrow={1}
                    flexBasis={0}
                    padding="8px"
                  >
                    <Stack space="10px">
                      <Inline space="6px" alignVertical="center">
                        <Text
                          size="11pt"
                          align="center"
                          weight="heavy"
                          color={secondaryTextColor}
                        >
                          􀫸
                        </Text>
                        <Text
                          size="13pt"
                          weight="heavy"
                          color={secondaryTextColor}
                        >
                          {i18n.t(
                            i18n.l.mints.featured_mint_card.featured_mint
                          )}
                        </Text>
                      </Inline>
                      <Text
                        size="20pt"
                        weight="heavy"
                        color="label"
                        numberOfLines={1}
                      >
                        {featuredMint.name}
                      </Text>
                    </Stack>
                    <Stack space={{ custom: 14 }}>
                      <Inline space="6px" alignVertical="center">
                        <Text
                          size="11pt"
                          align="center"
                          weight="heavy"
                          color={secondaryTextColor}
                        >
                          􀋥
                        </Text>
                        <Text size="13pt" weight="heavy" color="label">
                          {featuredMint.totalMints === 1
                            ? i18n.t(i18n.l.mints.featured_mint_card.one_mint)
                            : i18n.t(i18n.l.mints.featured_mint_card.x_mints, {
                                numMints: abbreviateNumber(
                                  featuredMint.totalMints
                                ),
                              })}
                        </Text>
                      </Inline>
                      <Inline space="6px" alignVertical="center">
                        <Text
                          size="11pt"
                          align="center"
                          weight="heavy"
                          color={secondaryTextColor}
                        >
                          􀐫
                        </Text>
                        <Text size="13pt" weight="heavy" color="label">
                          {i18n.t(i18n.l.mints.featured_mint_card.x_past_hour, {
                            numMints: abbreviateNumber(
                              featuredMint.mintsLastHour
                            ),
                          })}
                        </Text>
                      </Inline>
                    </Stack>
                  </Box>
                </Column>
                <Column width="content">
                  {!mediaRendered ? (
                    <Box
                      background="fillSecondary"
                      width={{ custom: IMAGE_SIZE }}
                      height={{ custom: IMAGE_SIZE }}
                      borderRadius={12}
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text
                        size="20pt"
                        weight="semibold"
                        color="labelQuaternary"
                        align="center"
                      >
                        􀣵
                      </Text>
                    </Box>
                  ) : (
                    <Box
                      width={{ custom: IMAGE_SIZE }}
                      height={{ custom: IMAGE_SIZE }}
                    />
                  )}
                  <Cover>
                    {!!imageUrl && (
                      <View
                        style={
                          IS_IOS
                            ? {
                                shadowColor: globalColors.grey100,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.02,
                                shadowRadius: 3,
                              }
                            : {}
                        }
                      >
                        <View
                          style={
                            IS_IOS
                              ? {
                                  shadowColor:
                                    isDarkMode || !accentColor
                                      ? globalColors.grey100
                                      : accentColor,
                                  shadowOffset: { width: 0, height: 4 },
                                  shadowOpacity: 0.16,
                                  shadowRadius: 6,
                                }
                              : {
                                  shadowColor:
                                    isDarkMode || !accentColor
                                      ? globalColors.grey100
                                      : accentColor,
                                  elevation: 8,
                                  opacity: 1,
                                }
                          }
                        >
                          <Media
                            onLayout={() => setMediaRendered(true)}
                            onError={() => setMediaRendered(false)}
                            url={imageUrl}
                            mimeType={mimeType ?? undefined}
                            style={{
                              width: IMAGE_SIZE,
                              height: IMAGE_SIZE,
                              borderRadius: 12,
                            }}
                            size={IMAGE_SIZE}
                          />
                        </View>
                      </View>
                    )}
                  </Cover>
                </Column>
              </Columns>
            </ButtonPressAnimation>
          </View>
        </View>
      </AccentColorProvider>
    </ColorModeProvider>
  ) : (
    <></>
  );
}
