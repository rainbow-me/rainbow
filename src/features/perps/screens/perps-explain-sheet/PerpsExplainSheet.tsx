import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AnimatedText, ColorModeProvider, Text } from '@/design-system';
import { ExplainerSheet, ExplainerSheetStep, PANEL_INNER_WIDTH } from '@/components/explainer-sheet/ExplainerSheet';
import FastImage from 'react-native-fast-image';
import magicOrbImage from '@/assets/perpsExplainer/magicOrb.png';
import leverageImage from '@/assets/perpsExplainer/leverage.png';
import { HYPERLIQUID_COLORS } from '@/features/perps/constants';
import { ETH_COLOR_DARK } from '@/__swaps__/screens/Swap/constants';
import { HyperliquidButton } from '@/features/perps/components/HyperliquidButton';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import * as i18n from '@/languages';

const translations = i18n.l.perps.explain_sheet;

const STEPS: ExplainerSheetStep[] = [
  {
    id: 'step-1',
    titleComponent: () => (
      <Text align="center" size="44pt" weight="heavy" color="label">
        {i18n.t(translations.steps.step_1.title_parts[0])}
      </Text>
    ),
    graphicComponent: () => (
      <FastImage source={magicOrbImage} style={{ width: PANEL_INNER_WIDTH, height: '100%' }} resizeMode={FastImage.resizeMode.contain} />
    ),
    subtitleComponent: () => (
      <Text align="center" size="17pt / 150%" weight="medium" color="labelTertiary" style={{ paddingHorizontal: 24 }}>
        {i18n.t(translations.steps.step_1.subtitle_parts[0])}
      </Text>
    ),
  },
  {
    id: 'step-2',
    titleComponent: () => (
      <Text align="center" size="44pt" weight="heavy" color="label" style={{ paddingHorizontal: 48 }}>
        {`${i18n.t(translations.steps.step_2.title_parts[0])} `}
        <Text size="44pt" weight="heavy" color="green">
          {`${i18n.t(translations.steps.step_2.title_parts[1])} `}
        </Text>
        {`${i18n.t(translations.steps.step_2.title_parts[2])} `}
        <Text size="44pt" weight="heavy" color="red">
          {i18n.t(translations.steps.step_2.title_parts[3])}
        </Text>
      </Text>
    ),
    graphicComponent: () => (
      <FastImage source={leverageImage} style={{ width: PANEL_INNER_WIDTH, height: '100%' }} resizeMode={FastImage.resizeMode.contain} />
    ),
    subtitleComponent: () => (
      <Text align="center" size="17pt / 150%" weight="medium" color="labelTertiary" style={{ paddingHorizontal: 24 }}>
        {i18n.t(translations.steps.step_2.subtitle_parts[0])}
      </Text>
    ),
  },
  {
    id: 'step-3',
    titleComponent: () => (
      <Text align="center" size="34pt" weight="heavy" color="label">
        {i18n.t(translations.steps.step_3.title_parts[0])}
      </Text>
    ),
    graphicComponent: () => (
      <FastImage source={leverageImage} style={{ width: PANEL_INNER_WIDTH, height: '100%' }} resizeMode={FastImage.resizeMode.contain} />
    ),
    subtitleComponent: () => (
      <Text align="center" size="17pt / 150%" weight="medium" color="labelTertiary" style={{ paddingHorizontal: 24 }}>
        {i18n.t(translations.steps.step_3.subtitle_parts[0])}
      </Text>
    ),
  },
];

export function PerpsExplainSheet() {
  return (
    <ColorModeProvider value={'dark'}>
      <PerpsAccentColorContextProvider>
        <ExplainerSheet
          steps={STEPS}
          panelHeight={650}
          headerTitleComponent={() => (
            <Text size="20pt" weight="black" color="label" uppercase style={{ letterSpacing: 0.6 }}>
              {i18n.t(translations.title)}
            </Text>
          )}
          BackgroundComponent={() => (
            <View style={StyleSheet.absoluteFill}>
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: HYPERLIQUID_COLORS.green, opacity: 0.04 }]} />
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: ETH_COLOR_DARK, opacity: 0.2 }]} />
            </View>
          )}
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
