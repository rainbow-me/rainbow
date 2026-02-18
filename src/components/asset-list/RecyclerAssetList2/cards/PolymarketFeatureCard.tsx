import React, { memo, useMemo } from 'react';
import { GestureResponderEvent, StyleSheet, View } from 'react-native';
import { Box, Inline, Stack, Text, AccentColorProvider, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import { LinearGradient } from 'expo-linear-gradient';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { usePolymarketFeatureCard } from '@/features/polymarket/hooks/usePolymarketFeatureCard';
import { navigateToPolymarket } from '@/features/polymarket/utils/navigateToPolymarket';
import * as i18n from '@/languages';
import ConditionalWrap from 'conditional-wrap';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { deepFreeze } from '@/utils/deepFreeze';
import { createOpacityPalette } from '@/worklets/colors';

export const POLYMARKET_FEATURE_CARD_HEIGHT = 92;

type PolymarketFeatureCardProps = {
  brightenDarkModeBackground?: boolean;
  isDismissable?: boolean;
};

const OPACITIES = deepFreeze([0, 1, 6, 8, 10, 12, 16, 20, 40, 100]);

export const PolymarketFeatureCard = memo(function PolymarketFeatureCard({
  brightenDarkModeBackground = false,
  isDismissable = true,
}: PolymarketFeatureCardProps) {
  const { isDarkMode } = useColorMode();
  const fillSecondary = useForegroundColor('fillSecondary');
  const accentColor = '#C863E8';
  const accentColors = useMemo(() => {
    return createOpacityPalette(accentColor, OPACITIES);
  }, [accentColor]);

  const { dismiss: dismissPolymarketFeatureCard } = usePolymarketFeatureCard();
  const onDismiss = (e?: GestureResponderEvent) => {
    if (e && 'stopPropagation' in e) {
      e.stopPropagation();
    }
    dismissPolymarketFeatureCard();
  };

  return (
    <AccentColorProvider color={accentColor}>
      <View style={styles.container}>
        <ButtonPressAnimation onPress={() => navigateToPolymarket()} scaleTo={0.96}>
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
                    colors={[accentColors.opacity0, accentColor]}
                    style={[StyleSheet.absoluteFillObject, { opacity: 0.12 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text size="icon 28px" weight="bold" color={{ custom: accentColor }}>
                    {'􀫸'}
                  </Text>
                </Box>
                <Box>
                  <Stack space="10px">
                    <Text size="12pt" weight="black" color={{ custom: accentColor }}>
                      {i18n.t(i18n.l.new).toUpperCase()}
                    </Text>
                    <Stack space={'12px'}>
                      <Inline alignVertical="center" space="6px">
                        <Text size="20pt" weight="heavy" color="label" align="left">
                          {i18n.t(i18n.l.predictions.feature_card.title)}
                        </Text>
                        <TextIcon size="icon 13px" weight="heavy" color={'label'} opacity={0.3} align="left">
                          {'􀯻'}
                        </TextIcon>
                      </Inline>

                      <Text size="15pt" weight="bold" color="labelSecondary">
                        {i18n.t(i18n.l.predictions.feature_card.subtitle)}
                      </Text>
                    </Stack>
                  </Stack>
                </Box>
              </Box>
            </ConditionalWrap>
          </ConditionalWrap>
          {isDismissable && (
            <View style={styles.dismissButton}>
              <ButtonPressAnimation onPress={onDismiss} scaleTo={0.8}>
                <Box
                  width={24}
                  height={24}
                  backgroundColor={isDarkMode ? accentColors.opacity8 : fillSecondary}
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
        </ButtonPressAnimation>
      </View>
    </AccentColorProvider>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  gradientBorderView: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: POLYMARKET_FEATURE_CARD_HEIGHT,
    borderRadius: 28,
  },
  dismissButton: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
});
