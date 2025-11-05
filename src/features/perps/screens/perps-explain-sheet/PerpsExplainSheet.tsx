import React, { useCallback } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { AnimatedText, Box, ColorModeProvider, Text, TextShadow } from '@/design-system';
import { ExplainerSheet, ExplainerSheetStep, PANEL_INNER_WIDTH } from '@/components/explainer-sheet/ExplainerSheet';
import FastImage from 'react-native-fast-image';
import magicOrbImage from '@/assets/perpsExplainer/magicOrb.png';
import leverageImage from '@/assets/perpsExplainer/leverage.png';
import longShortImage from '@/assets/perpsExplainer/long-short.png';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { useFocusEffect } from '@react-navigation/native';
import * as i18n from '@/languages';
import { useRoute } from '@/navigation/Navigation';
import { HyperliquidLogo } from '@/features/perps/components/HyperliquidLogo';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { easing } from '@/components/animations/animationConfigs';

const translations = i18n.l.perps.explain_sheet;

const config = {
  titleShadow: {
    blur: 10,
    color: '#25292E',
    shadowOpacity: 0.1,
  },
  titleStyle: {
    bottom: 8,
  },
  subtitleStyle: {
    alignSelf: 'center',
    bottom: 4,
    maxWidth: 266,
  } satisfies ViewStyle,
};

const STEPS: ExplainerSheetStep[] = [
  {
    id: 'step-1',
    titleComponent: () => (
      <TextShadow
        color={config.titleShadow.color}
        blur={config.titleShadow.blur}
        containerStyle={config.titleStyle}
        shadowOpacity={config.titleShadow.shadowOpacity}
      >
        <Text color={'label'} align="center" size="44pt" weight="heavy">
          {i18n.t(translations.steps.step_1.title_parts[0])}
        </Text>
      </TextShadow>
    ),
    graphicComponent: () => (
      <View style={{ width: PANEL_INNER_WIDTH, height: PANEL_INNER_WIDTH, marginTop: 32 }}>
        <FastImage
          source={magicOrbImage}
          style={{ width: PANEL_INNER_WIDTH, height: PANEL_INNER_WIDTH - 28 }}
          resizeMode={FastImage.resizeMode.contain}
        />
        <EasingGradient
          startColor={opacityWorklet('#171E20', 0)}
          endColor={'#171E20'}
          startPosition={'bottom'}
          endPosition="top"
          style={{ position: 'absolute', height: 100, left: 0, right: 0, top: 0 }}
        />
      </View>
    ),
    subtitleComponent: () => (
      <Text align="center" size="17pt / 135%" weight="semibold" color="labelTertiary" style={config.subtitleStyle}>
        {i18n.t(translations.steps.step_1.subtitle_parts[0])}
      </Text>
    ),
  },
  {
    id: 'step-2',
    titleComponent: () => (
      <TextShadow
        color={config.titleShadow.color}
        blur={config.titleShadow.blur}
        containerStyle={config.titleStyle}
        shadowOpacity={config.titleShadow.shadowOpacity}
      >
        <Text align="center" size="44pt" weight="heavy" color="label" style={{ maxWidth: 200, alignSelf: 'center' }}>
          {`${i18n.t(translations.steps.step_2.title_parts[0])} `}
          <Text size="44pt" weight="heavy" color="green">
            {`${i18n.t(translations.steps.step_2.title_parts[1])} `}
          </Text>
          {`${i18n.t(translations.steps.step_2.title_parts[2])} `}
          <Text size="44pt" weight="heavy" color="red">
            {i18n.t(translations.steps.step_2.title_parts[3])}
          </Text>
        </Text>
      </TextShadow>
    ),
    graphicComponent: () => (
      <Box
        style={{
          width: PANEL_INNER_WIDTH + 24,
          height: PANEL_INNER_WIDTH,
          overflow: 'visible',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 36,
        }}
      >
        <FastImage
          source={longShortImage}
          style={{ width: PANEL_INNER_WIDTH + 24 + 200, height: 320 }}
          resizeMode={FastImage.resizeMode.contain}
        />
        <EasingGradient
          easing={easing.inOut.ease}
          endColor={'#171E20'}
          endPosition={{ x: 0.5, y: 0.64 }}
          startColor={'#171E20'}
          startPosition={{ x: 0.5, y: 0 }}
          style={{ position: 'absolute', height: 150, left: 0, right: 0, bottom: 0 }}
        />
      </Box>
    ),
    subtitleComponent: () => (
      <Text align="center" size="17pt / 135%" weight="semibold" color="labelTertiary" style={[config.subtitleStyle, { maxWidth: 260 }]}>
        {i18n.t(translations.steps.step_2.subtitle_parts[0])}
      </Text>
    ),
  },
  {
    id: 'step-3',
    titleComponent: () => (
      <TextShadow
        color={config.titleShadow.color}
        containerStyle={config.titleStyle}
        blur={config.titleShadow.blur}
        shadowOpacity={config.titleShadow.shadowOpacity}
      >
        <Text align="center" size="44pt" weight="heavy" color="label">
          {i18n.t(translations.steps.step_3.title_parts[0])}
        </Text>
      </TextShadow>
    ),
    graphicComponent: () => (
      <FastImage source={leverageImage} style={{ width: PANEL_INNER_WIDTH, height: 240 }} resizeMode={FastImage.resizeMode.contain} />
    ),
    subtitleComponent: () => (
      <Text align="center" size="17pt / 135%" weight="semibold" color="labelTertiary" style={config.subtitleStyle}>
        {i18n.t(translations.steps.step_3.subtitle_parts[0])}
      </Text>
    ),
  },
];

export function PerpsExplainSheet() {
  const route = useRoute();
  const params = route.params as { onDismiss?: () => void } | undefined;
  const onDismiss = params?.onDismiss;

  useFocusEffect(
    useCallback(() => {
      return () => {
        onDismiss?.();
      };
    }, [onDismiss])
  );

  return (
    <ColorModeProvider value={'dark'}>
      <PerpsAccentColorContextProvider>
        <ExplainerSheet
          steps={STEPS}
          panelHeight={675}
          headerTitleComponent={() => (
            <Box flexDirection="row" alignItems="center" justifyContent="center" gap={10}>
              <HyperliquidLogo />
              <Text color="label" size="20pt" weight="black">
                {i18n.t(i18n.l.perps.common.title)}
              </Text>
            </Box>
          )}
          BackgroundComponent={() => <View style={[StyleSheet.absoluteFill, { backgroundColor: '#171E20' }]} />}
          ButtonComponent={({ label, onPress }) => (
            <HyperliquidButton onPress={onPress}>
              <AnimatedText size="20pt" weight="black" color={'black'}>
                {label}
              </AnimatedText>
            </HyperliquidButton>
          )}
          nextButtonLabel="Next"
          completeButtonLabel="Got it"
          showSunrays={false}
        />
      </PerpsAccentColorContextProvider>
    </ColorModeProvider>
  );
}
