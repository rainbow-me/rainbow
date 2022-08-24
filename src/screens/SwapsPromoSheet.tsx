import MaskedView from '@react-native-masked-view/masked-view';
import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {
  SheetActionButton,
  SheetHandle,
  SlackSheet,
} from '../components/sheet';
import { useNavigation } from '../navigation/Navigation';
import { sharedCoolModalTopOffset } from '../navigation/config';
import { ImgixImage } from '@/components/images';
import { delay } from '@/helpers/utilities';
import SwapsPromoBackground from '@rainbow-me/assets/swapsPromoBackground.png';
import SwapsPromoHeader from '@rainbow-me/assets/swapsPromoHeader.png';
import {
  AccentColorProvider,
  Bleed,
  Box,
  Column,
  Columns,
  Heading,
  Inset,
  Row,
  Rows,
  Stack,
  Text,
} from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';
import Routes from '@rainbow-me/routes';
import { useTheme } from '@rainbow-me/theme';

const MIN_HEIGHT = 740;

export default function SwapsPromoSheet() {
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const { colors } = useTheme();
  const { goBack, navigate } = useNavigation();

  // We are not using `isSmallPhone` from `useDimensions` here as we
  // want to explicitly set a min height.
  const isSmallPhone = deviceHeight < MIN_HEIGHT;

  const navigateToSwaps = useCallback(() => {
    goBack();
    delay(300).then(() => navigate(Routes.EXCHANGE_MODAL));
  }, [goBack, navigate]);

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
      <AccentColorProvider color={colors.black}>
        <Box
          background="accent"
          style={{ height: contentHeight }}
          testID="ens-intro-sheet"
        >
          {/* @ts-ignore */}
          <Box as={ImgixImage} height="full" source={SwapsPromoBackground}>
            <Rows>
              <Row>
                <Stack space={{ custom: 54 }}>
                  <Box>
                    <Box height={{ custom: 265 }} width="full">
                      {/* @ts-ignore */}
                      <Box
                        as={ImgixImage}
                        height={{ custom: deviceWidth * (285 / 390) }}
                        resizeMode="center"
                        source={SwapsPromoHeader}
                        width="full"
                      >
                        {/* @ts-ignore */}
                        <SheetHandle
                          alignSelf="center"
                          color={colors.white}
                          style={{ marginTop: 5 }}
                        />
                      </Box>
                    </Box>
                    <Stack alignHorizontal="center" space={{ custom: 13 }}>
                      <Text color="secondary60" size="15px" weight="heavy">
                        {lang.t('promos.swaps.subheader')}
                      </Text>
                      <Heading size="30px" weight="heavy">
                        {lang.t('promos.swaps.header')}
                      </Heading>
                    </Stack>
                  </Box>
                  <Inset horizontal={{ custom: 43.5 }}>
                    <Stack space={isSmallPhone ? '24px' : '36px'}>
                      <InfoRow
                        description={lang.t(
                          'promos.swaps.info_row_1.description'
                        )}
                        icon="􀖅"
                        title={lang.t('promos.swaps.info_row_1.title')}
                      />
                      <InfoRow
                        description={lang.t(
                          'promos.swaps.info_row_2.description'
                        )}
                        icon="􀯮"
                        title={lang.t('promos.swaps.info_row_2.title')}
                      />
                      <InfoRow
                        description={lang.t(
                          'promos.swaps.info_row_3.description'
                        )}
                        icon="􀙨"
                        title={lang.t('promos.swaps.info_row_3.title')}
                      />
                    </Stack>
                  </Inset>
                </Stack>
              </Row>
              <Row height="content">
                <Inset bottom="42px" horizontal="19px">
                  <Stack space="12px">
                    <SheetActionButton
                      color={colors.white}
                      // @ts-expect-error JavaScript component
                      label={lang.t('promos.swaps.primary_button')}
                      lightShadows
                      onPress={navigateToSwaps}
                      textColor={colors.almostBlack}
                      weight="heavy"
                    />
                    <SheetActionButton
                      color={colors.transparent}
                      isTransparent
                      // @ts-expect-error JavaScript component
                      label={lang.t('promos.swaps.secondary_button')}
                      onPress={goBack}
                      textColor={colors.white}
                      textSize="lmedium"
                      weight="bold"
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
}

function InfoRow({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  const { colors } = useTheme();

  return (
    <Columns space={{ custom: 13 }}>
      <Column width="content">
        <MaskedView
          maskElement={
            <Box
              {...(android && {
                paddingTop: '6px',
              })}
            >
              <Heading align="center" color="action" size="28px" weight="bold">
                {icon}
              </Heading>
            </Box>
          }
          style={{ width: 42 }}
        >
          <Box
            as={LinearGradient}
            colors={colors.gradients.swapPurpleTintToSwapPurple}
            end={{ x: 0.5, y: 1 }}
            height={{ custom: 50 }}
            marginTop="-10px"
            start={{ x: 0, y: 0 }}
            width="full"
          />
        </MaskedView>
      </Column>
      <Bleed top="3px">
        <Stack space="12px">
          <Text weight="bold">{title}</Text>
          <Text color="secondary60" size="14px" weight="medium">
            {description}
          </Text>
        </Stack>
      </Bleed>
    </Columns>
  );
}
