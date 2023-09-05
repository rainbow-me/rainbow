import {
  AccentColorProvider,
  Box,
  ColorModeProvider,
  Column,
  Columns,
  Cover,
  Inline,
  Inset,
  Stack,
  Text,
  globalColors,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import React, { useMemo, useReducer } from 'react';
import { ButtonPressAnimation } from '../animations';
import { useMintableCollections } from '@/resources/mintdotfun';
import { useAccountProfile, useDimensions } from '@/hooks';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { ImgixImage } from '../images';
import { abbreviateNumber } from '@/helpers/utilities';
import { BlurView } from '@react-native-community/blur';
import { Linking, View } from 'react-native';
import { IS_IOS } from '@/env';
import c from 'chroma-js';

const IMAGE_SIZE = 111;

export function FeaturedMintCard() {
  const { accountAddress } = useAccountProfile();
  const {
    data: {
      getMintableCollections: { collections },
    },
  } = useMintableCollections({
    walletAddress: accountAddress,
  });
  const { width: deviceWidth } = useDimensions();
  const [imageError, setImageError] = useReducer(() => true, false);
  const { colorMode } = useColorMode();
  const isDarkMode = colorMode === 'dark';

  // TODO: should be remotely configurable
  const featuredMint = collections?.[0];

  const labelSecondary = useForegroundColor('labelSecondary');
  const accentColor = usePersistentDominantColorFromImage(
    featuredMint?.imageURL
  );
  const hasImage = featuredMint?.imageURL && !imageError;
  const secondaryTextColor = hasImage ? 'accent' : 'labelSecondary';

  // from nft expanded state
  const primaryTextColor = useMemo(() => {
    if (accentColor) {
      const contrastWithWhite = c.contrast(accentColor, globalColors.white100);

      if (contrastWithWhite < 2.125) {
        return globalColors.grey100;
      } else {
        return globalColors.white100;
      }
    } else {
      return globalColors.white100;
    }
  }, [accentColor]);

  return featuredMint ? (
    <Inset vertical="10px">
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
              <Box
                as={ButtonPressAnimation}
                padding="12px"
                width="full"
                borderRadius={24}
                style={{
                  borderWidth: 1,
                  borderColor: 'rgba(245, 248, 255, 0.08)',
                  backgroundColor: hasImage
                    ? isDarkMode
                      ? `rgba(22, 22, 22, ${ios ? 0.4 : 1})`
                      : `rgba(26, 26, 26, ${ios ? 0.4 : 1})`
                    : '#272829',
                }}
                onPress={() => Linking.openURL(featuredMint.externalURL)}
              >
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
                            Featured Mint
                          </Text>
                        </Inline>
                        <Text
                          size="20pt"
                          weight="heavy"
                          color={{ custom: primaryTextColor }}
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
                          <Text
                            size="13pt"
                            weight="heavy"
                            color={{ custom: primaryTextColor }}
                          >
                            {`${abbreviateNumber(
                              featuredMint.totalMints
                            )} mint${featuredMint.totalMints === 1 ? '' : 's'}`}
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
                          <Text
                            size="13pt"
                            weight="heavy"
                            color={{ custom: primaryTextColor }}
                          >
                            {`${abbreviateNumber(
                              featuredMint.mintsLastHour
                            )} past hour`}
                          </Text>
                        </Inline>
                      </Stack>
                    </Box>
                  </Column>
                  <Column width="content">
                    {hasImage ? (
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
                          <ImgixImage
                            size={IMAGE_SIZE}
                            source={{ uri: featuredMint.imageURL }}
                            style={{
                              width: IMAGE_SIZE,
                              height: IMAGE_SIZE,
                              borderRadius: 12,
                            }}
                            onError={setImageError}
                          />
                        </View>
                      </View>
                    ) : (
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
                    )}
                  </Column>
                </Columns>
              </Box>
            </View>
          </View>
        </AccentColorProvider>
      </ColorModeProvider>
      {/* image blur mask */}
      {hasImage && (
        <Box
          borderRadius={24}
          position="absolute"
          left="0px"
          right="0px"
          top="0px"
          bottom="0px"
          style={{
            zIndex: -1,
          }}
        >
          <ImgixImage
            resizeMode="cover"
            fm="png"
            shouldRasterizeIOS
            style={{
              borderRadius: 24,
              height: '100%',
              width: '100%',
            }}
            source={{ uri: featuredMint.imageURL }}
            size={deviceWidth - 40}
          />
          <Cover>
            <BlurView
              blurAmount={100}
              blurType="light"
              style={{
                borderRadius: 24,
                width: '100%',
                height: '100%',
              }}
            />
          </Cover>
        </Box>
      )}
    </Inset>
  ) : (
    <></>
  );
}
