import React, { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Box, Inline, Stack, Text, AccentColorProvider, TextIcon, useColorMode, TextShadow, Bleed } from '@/design-system';
import { GradientBorderView } from '@/components/gradient-border/GradientBorderView';
import LinearGradient from 'react-native-linear-gradient';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import ConditionalWrap from 'conditional-wrap';
import { createOpacityPalette } from '@/worklets/colors';

type FeatureCardProps = {
  accentColor: string;
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

export const FeatureCard = memo(function FeatureCard({ accentColor, icon, title, subtitle, onPress }: FeatureCardProps) {
  const { isDarkMode } = useColorMode();
  const accentColors = useMemo(() => {
    return createOpacityPalette(accentColor, [0, 1, 4, 6, 8, 12, 14, 16, 20, 24, 60, 70, 100]);
  }, [accentColor]);

  return (
    <AccentColorProvider color={accentColor}>
      <View style={styles.container}>
        <ButtonPressAnimation onPress={onPress} scaleTo={0.95}>
          <ConditionalWrap
            condition={isDarkMode}
            wrap={children => (
              <GradientBorderView
                borderGradientColors={[accentColors.opacity8, accentColors.opacity16]}
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                borderRadius={32}
                borderWidth={2.5}
                style={styles.gradientBorderView}
                backgroundColor={accentColors.opacity16}
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
              <Box alignItems="center" gap={16}>
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
                    style={[StyleSheet.absoluteFill, { opacity: 0.12 }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />

                  <TextShadow blur={20} color={accentColor} x={0} y={0} shadowOpacity={0.6}>
                    <Text size="icon 26px" weight="heavy" color={{ custom: accentColor }} align="center">
                      {icon}
                    </Text>
                  </TextShadow>
                </Box>
                <Bleed horizontal={'8px'}>
                  <Stack space={'12px'}>
                    <Inline alignHorizontal="center" alignVertical="center" space="3px">
                      <Text size="20pt" weight="heavy" color="label" align="center">
                        {title}
                      </Text>
                      <TextIcon size="icon 13px" weight="heavy" color={'label'} opacity={0.3} align="center" textStyle={{ top: 1 }}>
                        {'􀯻'}
                      </TextIcon>
                    </Inline>

                    <Text size="15pt" weight="semibold" color="labelTertiary" align="center" numberOfLines={2}>
                      {subtitle}
                    </Text>
                  </Stack>
                </Bleed>
              </Box>
            </ConditionalWrap>
          </ConditionalWrap>
        </ButtonPressAnimation>
      </View>
    </AccentColorProvider>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBorderView: {
    width: '100%',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
    borderRadius: 32,
  },
});
