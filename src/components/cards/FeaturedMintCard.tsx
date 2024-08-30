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
import React, { useCallback, useEffect, useState } from 'react';
import { ButtonPressAnimation } from '../animations';
import { useMints } from '@/resources/mints';
import { useAccountProfile, useDimensions } from '@/hooks';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { ImgixImage } from '../images';
import { abbreviateNumber, convertRawAmountToRoundedDecimal } from '@/helpers/utilities';
import { BlurView } from '@react-native-community/blur';
import { View } from 'react-native';
import { IS_IOS } from '@/env';
import { Media } from '../Media';
import { analyticsV2 } from '@/analytics';
import * as i18n from '@/languages';
import { navigateToMintCollection } from '@/resources/reservoir/mints';
import { ethereumUtils } from '@/utils';

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
  const { width: deviceWidth } = useDimensions();

  const {
    data: { featuredMint },
  } = useMints({ walletAddress: accountAddress });

  const [mediaRendered, setMediaRendered] = useState(false);
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';

  const imageUrl = featuredMint?.imageURL || featuredMint?.recentMints?.find(m => m.imageURI)?.imageURI;

  const mimeType = featuredMint?.imageURL ? featuredMint?.imageMimeType : featuredMint?.recentMints?.find(m => m.imageURI)?.mimeType;

  const labelSecondary = useForegroundColor('labelSecondary');
  const accentColor = usePersistentDominantColorFromImage(imageUrl);
  const secondaryTextColor = imageUrl ? 'accent' : 'labelSecondary';

  useEffect(() => setMediaRendered(false), [imageUrl]);

  const handlePress = useCallback(() => {
    if (featuredMint) {
      analyticsV2.track(analyticsV2.event.mintsPressedFeaturedMintCard, {
        contractAddress: featuredMint.contractAddress,
        chainId: featuredMint.chainId,
        totalMints: featuredMint.totalMints,
        mintsLastHour: featuredMint.totalMints,
        priceInEth: convertRawAmountToRoundedDecimal(featuredMint.mintStatus.price, 18, 6),
      });
      const network = ethereumUtils.getNetworkFromChainId(featuredMint.chainId);
      navigateToMintCollection(featuredMint.contract, featuredMint.mintStatus.price, network);
    }
  }, [featuredMint]);

  if (!featuredMint) return null;

  return (
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
              onPress={handlePress}
              scaleTo={0.96}
            >
              <Cover>
                <BlurWrapper>
                  {!!imageUrl && IS_IOS && (
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
                    {IS_IOS ? (
                      <BlurView
                        blurAmount={100}
                        blurType="light"
                        style={{
                          height: '100%',
                          width: '100%',
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          backgroundColor: accentColor || globalColors.blueGrey90,
                          height: '100%',
                          width: '100%',
                        }}
                      />
                    )}
                  </Cover>
                  <Cover>
                    <View
                      style={{
                        height: '100%',
                        width: '100%',
                        backgroundColor: `rgba(22, 22, 22, ${ios ? 0.5 : 0.8})`,
                      }}
                    />
                  </Cover>
                </BlurWrapper>
              </Cover>
              <Columns>
                <Column>
                  <Box alignItems="flex-start" justifyContent="space-between" flexGrow={1} flexBasis={0} padding="8px">
                    <Stack space="10px">
                      <Inline space="6px" alignVertical="center">
                        <Text size="11pt" align="center" weight="heavy" color={secondaryTextColor}>
                          􀫸
                        </Text>
                        <Text size="13pt" weight="heavy" color={secondaryTextColor}>
                          {i18n.t(i18n.l.mints.featured_mint_card.featured_mint)}
                        </Text>
                      </Inline>
                      <Box height={{ custom: 36 }} justifyContent="center" alignItems="flex-start">
                        <Text size="20pt" weight="heavy" color="label" numberOfLines={1} style={{ lineHeight: 36 }}>
                          {featuredMint.name}
                        </Text>
                      </Box>
                    </Stack>
                    <Stack space={{ custom: 14 }}>
                      <Inline space="6px" alignVertical="center">
                        <Text size="11pt" align="center" weight="heavy" color={secondaryTextColor}>
                          􀋥
                        </Text>
                        <Text size="13pt" weight="heavy" color="label">
                          {featuredMint.totalMints === 1
                            ? i18n.t(i18n.l.mints.featured_mint_card.one_mint)
                            : i18n.t(i18n.l.mints.featured_mint_card.x_mints, {
                                numMints: abbreviateNumber(featuredMint.totalMints),
                              })}
                        </Text>
                      </Inline>
                      <Inline space="6px" alignVertical="center">
                        <Text size="11pt" align="center" weight="heavy" color={secondaryTextColor}>
                          􀐫
                        </Text>
                        <Text size="13pt" weight="heavy" color="label">
                          {i18n.t(i18n.l.mints.featured_mint_card.x_past_hour, {
                            numMints: abbreviateNumber(featuredMint.mintsLastHour),
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
                      <Text size="20pt" weight="semibold" color="labelQuaternary" align="center">
                        􀣵
                      </Text>
                    </Box>
                  ) : (
                    <Box width={{ custom: IMAGE_SIZE }} height={{ custom: IMAGE_SIZE }} />
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
                                  shadowColor: isDarkMode || !accentColor ? globalColors.grey100 : accentColor,
                                  shadowOffset: { width: 0, height: 4 },
                                  shadowOpacity: 0.16,
                                  shadowRadius: 6,
                                }
                              : {
                                  shadowColor: isDarkMode || !accentColor ? globalColors.grey100 : accentColor,
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
  );
}
