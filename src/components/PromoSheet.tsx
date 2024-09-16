import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { ImageSourcePropType, StatusBar, ImageBackground } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { SheetActionButton, SheetHandle, SlackSheet } from '@/components/sheet';
import { CampaignKey } from '@/components/remote-promo-sheet/localCampaignChecks';
import { analyticsV2 } from '@/analytics';
import { AccentColorProvider, Box, Stack, Text, Bleed, Column, Columns, useForegroundColor, useAccentColor } from '@/design-system';
import { useDimensions } from '@/hooks';
import { useTheme } from '@/theme';
import { IS_ANDROID } from '@/env';
import { safeAreaInsetValues } from '@/utils';

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
  const { colors } = useTheme();
  const { width: deviceWidth, height: deviceHeight } = useDimensions();
  const labelTertiary = useForegroundColor('labelTertiary');
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

  const contentHeight = deviceHeight - safeAreaInsetValues.top;

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
          <Box as={ImageBackground} height="full" source={backgroundImage}>
            <Box>
              <Box
                as={ImageBackground}
                height={{
                  custom: deviceWidth / headerImageAspectRatio,
                }}
                source={headerImage}
                width="full"
              >
                <SheetHandle alignSelf="center" color={sheetHandleColor} style={{ marginTop: 5 }} />
              </Box>
            </Box>
            <Box paddingVertical="28px" height={{ custom: deviceHeight - deviceWidth / headerImageAspectRatio - 58 }} flexGrow={1}>
              <Box alignItems="center" paddingHorizontal="20px" paddingBottom="20px" gap={14}>
                <Text color="labelSecondary" size="15pt" align="center" weight="heavy">
                  {subHeader}
                </Text>
                <Text color="label" align="center" size="30pt" weight="heavy">
                  {header}
                </Text>
              </Box>
              <Box flexGrow={1} paddingHorizontal="20px" paddingVertical="24px">
                <Stack space="24px">
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
              </Box>
              <Box paddingHorizontal="20px">
                <Stack space="12px">
                  <SheetActionButton
                    color={primaryButtonProps.color || accentColor}
                    label={primaryButtonProps.label}
                    lightShadows
                    onPress={primaryButtonOnPress}
                    textColor={primaryButtonProps.textColor}
                    textSize="large"
                    weight="heavy"
                  />
                  <SheetActionButton
                    color={secondaryButtonProps.color || colors.transparent}
                    isTransparent
                    label={secondaryButtonProps.label}
                    onPress={secondaryButtonProps.onPress || (() => {})}
                    textColor={secondaryButtonProps.textColor || labelTertiary}
                    textSize="large"
                    weight="heavy"
                  />
                </Stack>
              </Box>
            </Box>
          </Box>
        </Box>
      </AccentColorProvider>
    </SlackSheet>
  );
}
