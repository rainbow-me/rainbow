import React, { memo, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Box, Inline, Stack, Text, AccentColorProvider, TextIcon, useColorMode } from '@/design-system';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import infinityIcon from '@/assets/infinity.png';
import LinearGradient from 'react-native-linear-gradient';
import { ButtonPressAnimation } from '@/components/animations';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { usePerpsFeatureCard } from '@/features/perps/hooks/usePerpsFeatureCard';
import { useRemoteConfig } from '@/model/remoteConfig';
import * as i18n from '@/languages';
import ConditionalWrap from 'conditional-wrap';
import { THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

export const PERPS_FEATURE_CARD_HEIGHT = 92;

type PerpsFeatureCardProps = {
  brightenDarkModeBackground?: boolean;
  isDismissable?: boolean;
};

export const PerpsFeatureCard = memo(function PerpsFeatureCard({
  brightenDarkModeBackground = false,
  isDismissable = true,
}: PerpsFeatureCardProps) {
  const {
    perps_feature_card_copy: { title, subtitle },
  } = useRemoteConfig();
  const { isDarkMode } = useColorMode();

  const { accentColor } = useAccountAccentColor();
  const { dismiss } = usePerpsFeatureCard();
  const accentColors = useMemo(() => {
    return {
      opacity100: accentColor,
      opacity40: opacityWorklet(accentColor, 0.4),
      opacity20: opacityWorklet(accentColor, 0.2),
      opacity16: opacityWorklet(accentColor, 0.16),
      opacity12: opacityWorklet(accentColor, 0.12),
      opacity10: opacityWorklet(accentColor, 0.1),
      opacity8: opacityWorklet(accentColor, 0.08),
      opacity6: opacityWorklet(accentColor, 0.06),
      opacity1: opacityWorklet(accentColor, 0.01),
    };
  }, [accentColor]);

  return (
    <AccentColorProvider color={accentColor}>
      <ButtonPressAnimation onPress={navigateToPerps} scaleTo={0.96} style={styles.container}>
        <ConditionalWrap
          condition={isDarkMode}
          wrap={children => (
            <GradientBorderView
              borderGradientColors={[accentColors.opacity8, accentColors.opacity16]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              borderRadius={28}
              borderWidth={THICKER_BORDER_WIDTH}
              style={styles.gradientBorderView}
              backgroundColor={brightenDarkModeBackground ? accentColors.opacity20 : accentColors.opacity16}
            >
              {children}
            </GradientBorderView>
          )}
        >
          <ConditionalWrap
            condition={!isDarkMode}
            wrap={children => (
              <Box style={styles.gradientBorderView} background="surfacePrimaryElevated" shadow="24px">
                {children}
              </Box>
            )}
          >
            <Box flexDirection="row" justifyContent="flex-start" alignItems="center" gap={16}>
              <Box
                height={60}
                width={60}
                backgroundColor={accentColors[isDarkMode ? 'opacity8' : 'opacity6']}
                borderRadius={30}
                justifyContent="center"
                alignItems="center"
                borderWidth={isDarkMode ? 2 : 1}
                borderColor={{ custom: accentColors[isDarkMode ? 'opacity6' : 'opacity1'] }}
              >
                <LinearGradient
                  colors={['transparent', accentColor]}
                  style={[StyleSheet.absoluteFillObject, { opacity: 0.12 }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Image source={infinityIcon} resizeMode="contain" tintColor={accentColor} />
              </Box>
              <Box>
                <Stack space="10px">
                  <Text size="12pt" weight="black" color={{ custom: accentColor }}>
                    {i18n.t(i18n.l.new).toUpperCase()}
                  </Text>
                  <Stack space={'12px'}>
                    <Inline alignVertical="center" space="6px">
                      <Text size="20pt" weight="heavy" color="label" align="left">
                        {title}
                      </Text>
                      <TextIcon size="icon 13px" weight="heavy" color={'label'} opacity={0.3} align="left">
                        {'􀯻'}
                      </TextIcon>
                    </Inline>

                    <Text size="15pt" weight="bold" color="labelTertiary">
                      {subtitle}
                    </Text>
                  </Stack>
                </Stack>
              </Box>
            </Box>
          </ConditionalWrap>
        </ConditionalWrap>
      </ButtonPressAnimation>
      {isDismissable && (
        <View style={styles.dismissButton}>
          <ButtonPressAnimation onPress={dismiss} scaleTo={0.8}>
            <Box
              width={24}
              height={24}
              backgroundColor={isDarkMode ? accentColors.opacity8 : 'fillTertiary'}
              borderRadius={12}
              justifyContent="center"
              alignItems="center"
              hitSlop={12}
            >
              <TextIcon size="icon 12px" weight="black" color="labelQuaternary">
                {'􀆄'}
              </TextIcon>
            </Box>
          </ButtonPressAnimation>
        </View>
      )}
    </AccentColorProvider>
  );
});

function navigateToPerps() {
  Navigation.handleAction(Routes.PERPS_NAVIGATOR);
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  gradientBorderView: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: PERPS_FEATURE_CARD_HEIGHT,
    borderRadius: 28,
  },
  dismissButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
