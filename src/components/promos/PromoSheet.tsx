import lang from 'i18n-js';
import React from 'react';
import { StatusBar } from 'react-native';
import {
  SheetActionButton,
  SheetHandle,
  SlackSheet,
} from '../../components/sheet';
import InfoRow from './InfoRow';
import { ImgixImage } from '@/components/images';
import {
  AccentColorProvider,
  Box,
  Heading,
  Inset,
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { sharedCoolModalTopOffset } from '@rainbow-me/navigation/config';
import { useTheme } from '@rainbow-me/theme';

const MIN_HEIGHT = 740;

type Promo = 'swaps';

interface PromoSheetProps {
  onPress: () => void;
  iconGradient: string[];
  headerImage: StaticImageData;
  headerImageAspectRatio: number;
  backgroundImage?: StaticImageData;
  backgroundColor: string;
  promoType: Promo;
  accentColor: string;
  sheetHandleColor?: string;
  icon1: string;
  icon2: string;
  icon3: string;
}

const PromoSheet = ({
  onPress,
  iconGradient,
  headerImage,
  headerImageAspectRatio,
  backgroundImage,
  backgroundColor,
  promoType,
  accentColor,
  sheetHandleColor,
  icon1,
  icon2,
  icon3,
}: PromoSheetProps) => {
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const { colors } = useTheme();
  const { goBack } = useNavigation();

  // We are not using `isSmallPhone` from `useDimensions` here as we
  // want to explicitly set a min height.
  const isSmallPhone = deviceHeight < MIN_HEIGHT;
  const contentHeight =
    deviceHeight - (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  return (
    // @ts-ignore
    <SlackSheet
      additionalTopPadding={android ? StatusBar.currentHeight : false}
      contentHeight={contentHeight}
      height="100%"
      hideHandle
      removeTopPadding
      scrollEnabled={false}
    >
      <StatusBar barStyle="light-content" />
      <AccentColorProvider color={backgroundColor}>
        <Box
          background="accent"
          style={{ height: contentHeight }}
          testID="ens-intro-sheet"
        >
          {/* @ts-ignore */}
          <Box as={ImgixImage} height="full" source={backgroundImage}>
            <Rows>
              <Row>
                <Stack space={{ custom: isSmallPhone ? 46 : 54 }}>
                  <Box>
                    <Box
                      height={{ custom: isSmallPhone ? 195 : 265 }}
                      width="full"
                    >
                      {/* @ts-ignore */}
                      <Box
                        as={ImgixImage}
                        height={{
                          custom: deviceWidth / headerImageAspectRatio,
                        }}
                        {...(isSmallPhone && { marginTop: { custom: -70 } })}
                        source={headerImage}
                        width="full"
                      >
                        {/* @ts-ignore */}
                        <SheetHandle
                          alignSelf="center"
                          color={sheetHandleColor}
                          style={{ marginTop: isSmallPhone ? 75 : 5 }}
                        />
                      </Box>
                    </Box>
                    <Stack alignHorizontal="center" space={{ custom: 13 }}>
                      <Text color="secondary60" size="15px" weight="heavy">
                        {lang.t(`promos.${promoType}.subheader`)}
                      </Text>
                      <Heading size="30px" weight="heavy">
                        {lang.t(`promos.${promoType}.header`)}
                      </Heading>
                    </Stack>
                  </Box>
                  <Inset horizontal={{ custom: 43.5 }}>
                    <Stack space={isSmallPhone ? '24px' : '36px'}>
                      <InfoRow
                        description={lang.t(
                          `promos.${promoType}.info_row_1.description`
                        )}
                        gradient={iconGradient}
                        icon={icon1}
                        title={lang.t(`promos.${promoType}.info_row_1.title`)}
                      />
                      <InfoRow
                        description={lang.t(
                          `promos.${promoType}.info_row_2.description`
                        )}
                        gradient={iconGradient}
                        icon={icon2}
                        title={lang.t(`promos.${promoType}.info_row_2.title`)}
                      />
                      <InfoRow
                        description={lang.t(
                          `promos.${promoType}.info_row_3.description`
                        )}
                        gradient={iconGradient}
                        icon={icon3}
                        title={lang.t(`promos.${promoType}.info_row_3.title`)}
                      />
                    </Stack>
                  </Inset>
                </Stack>
              </Row>
              <Row height="content">
                <Inset
                  bottom={isSmallPhone ? '24px' : '42px'}
                  horizontal="19px"
                >
                  <Stack space="12px">
                    <SheetActionButton
                      color={accentColor}
                      // @ts-expect-error JavaScript component
                      label={lang.t(`promos.${promoType}.primary_button`)}
                      lightShadows
                      onPress={onPress}
                      textColor={backgroundColor}
                      textSize="large"
                      weight="heavy"
                    />
                    <SheetActionButton
                      color={colors.transparent}
                      isTransparent
                      // @ts-expect-error JavaScript component
                      label={lang.t(`promos.${promoType}.secondary_button`)}
                      onPress={goBack}
                      textColor={accentColor}
                      textSize="large"
                      weight="heavy"
                    />
                  </Stack>
                </Inset>
              </Row>
            </Rows>
          </Box>
        </Box>
      </AccentColorProvider>
    </SlackSheet>
  );
};

export default PromoSheet;
