import React, { useCallback, useEffect, useReducer } from 'react';
import { ImageSourcePropType, Dimensions, StatusBar, ImageBackground } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { SheetActionButton, SheetHandle, SlackSheet } from '@/components/sheet';
import { CampaignKey } from '@/components/remote-promo-sheet/localCampaignChecks';
import { analyticsV2 } from '@/analytics';
import { AccentColorProvider, Box, Inset, Row, Rows, Stack, Text, Bleed, Column, Columns } from '@/design-system';
import { useDimensions } from '@/hooks';
import { sharedCoolModalTopOffset } from '@/navigation/config';
import { useTheme } from '@/theme';
import { IS_IOS, IS_ANDROID } from '@/env';

const MIN_HEIGHT = 740;

type SheetActionButtonProps = {
  label: string;
  onPress: () => void;
  textColor?: string;
  color?: string;
};

type PromoSheetProps = {
  headerImage: ImageSourcePropType;
  headerImageAspectRatio: number;
  backgroundImage?: ImageSourcePropType;
  backgroundColor: string;
  accentColor: string;
  sheetHandleColor?: string;
  campaignKey: CampaignKey | string;
  header: string;
  subHeader: string;
  primaryButtonProps: SheetActionButtonProps;
  secondaryButtonProps: SheetActionButtonProps;
  items: {
    icon: string;
    title: string;
    description: string;
    gradient: string[];
  }[];
};

export function PromoSheet({
  headerImage,
  headerImageAspectRatio,
  backgroundImage,
  backgroundColor,
  accentColor,
  sheetHandleColor,
  campaignKey,
  header,
  subHeader,
  primaryButtonProps,
  secondaryButtonProps,
  items,
}: PromoSheetProps) {
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const { colors } = useTheme();
  const renderedAt = Date.now();
  const [activated, activate] = useReducer(() => true, false);

  useEffect(
    () => () => {
      if (!activated) {
        const timeElapsed = (Date.now() - renderedAt) / 1000;
        analyticsV2.track(analyticsV2.event.promoSheetDismissed, {
          campaign: campaignKey,
          time_viewed: timeElapsed,
        });
      }
    },
    [activated, campaignKey, renderedAt]
  );

  const primaryButtonOnPress = useCallback(() => {
    activate();
    const timeElapsed = (Date.now() - renderedAt) / 1000;
    analyticsV2.track(analyticsV2.event.promoSheetShown, {
      campaign: campaignKey,
      time_viewed: timeElapsed,
    });
    primaryButtonProps.onPress();
  }, [activate, campaignKey, primaryButtonProps, renderedAt]);

  // We are not using `isSmallPhone` from `useDimensions` here as we
  // want to explicitly set a min height.
  const isSmallPhone = deviceHeight < MIN_HEIGHT;
  const contentHeight = deviceHeight - (!isSmallPhone ? sharedCoolModalTopOffset : 0);

  return (
    <SlackSheet
      additionalTopPadding={IS_ANDROID ? StatusBar.currentHeight : false}
      contentHeight={contentHeight}
      height="100%"
      hideHandle
      removeTopPadding
      scrollEnabled={false}
    >
      <StatusBar barStyle="light-content" />
      <AccentColorProvider color={backgroundColor}>
        <Box background="accent" style={{ height: contentHeight }} testID={campaignKey}>
          {/* @ts-ignore */}
          <Box as={ImageBackground} height="full" source={backgroundImage}>
            <Rows>
              <Row>
                <Stack space={{ custom: isSmallPhone ? 46 : 54 }}>
                  <Box>
                    <Box height={{ custom: isSmallPhone ? 195 : 265 }} width="full">
                      {/* @ts-ignore */}
                      <Box
                        as={ImageBackground}
                        height={{
                          custom: deviceWidth / headerImageAspectRatio,
                        }}
                        marginTop={{ custom: isSmallPhone ? -70 : 0 }}
                        source={headerImage}
                        width="full"
                      >
                        {/* @ts-ignore */}
                        <SheetHandle alignSelf="center" color={sheetHandleColor} style={{ marginTop: isSmallPhone ? 75 : 5 }} />
                      </Box>
                    </Box>
                    <Stack alignHorizontal="center" space={{ custom: 13 }}>
                      <Text color="labelSecondary" size="15pt" weight="heavy">
                        {subHeader}
                      </Text>
                      <Text color="label" size="30pt" weight="heavy">
                        {header}
                      </Text>
                    </Stack>
                  </Box>
                  <Inset horizontal={{ custom: 43.5 }}>
                    <Stack space={isSmallPhone ? '24px' : '36px'}>
                      {items.map(item => (
                        <Columns key={item.title} space={{ custom: 13 }}>
                          <Column width="content">
                            <MaskedView
                              maskElement={
                                <Box paddingTop={IS_ANDROID ? '6px' : undefined}>
                                  <Text align="center" color="accent" size="30pt" weight="bold">
                                    {item.icon}
                                  </Text>
                                </Box>
                              }
                              style={{ width: 42 }}
                            >
                              <Box
                                as={LinearGradient}
                                colors={item.gradient}
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
                              <Text color="label" size="17pt" weight="bold">
                                {item.title}
                              </Text>
                              <Text color="labelSecondary" size="15pt" weight="medium">
                                {item.description}
                              </Text>
                            </Stack>
                          </Bleed>
                        </Columns>
                      ))}
                    </Stack>
                  </Inset>
                </Stack>
              </Row>
              <Row height="content">
                <Inset bottom={isSmallPhone && IS_IOS ? '24px' : '42px (Deprecated)'} horizontal="19px (Deprecated)">
                  <Stack space="12px">
                    <SheetActionButton
                      color={primaryButtonProps.color || accentColor}
                      label={primaryButtonProps.label}
                      lightShadows
                      onPress={primaryButtonOnPress}
                      textColor={primaryButtonProps.textColor || backgroundColor}
                      textSize="large"
                      weight="heavy"
                    />
                    <SheetActionButton
                      color={secondaryButtonProps.color || colors.transparent}
                      isTransparent
                      label={secondaryButtonProps.label}
                      onPress={secondaryButtonProps.onPress || (() => {})}
                      textColor={secondaryButtonProps.textColor || accentColor}
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
}
