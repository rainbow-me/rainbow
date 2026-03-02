import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import * as i18n from '@/languages';
import { Box, ColorModeProvider, Text } from '@/design-system';
import step1Image from '@/assets/polymarketExplainer/step1.png';
import step2Image from '@/assets/polymarketExplainer/step2.png';
import step3Image from '@/assets/polymarketExplainer/step3.png';
import FastImage from 'react-native-fast-image';
import { ExplainerSheet, type ExplainerSheetStep } from '@/components/explainer-sheet/ExplainerSheet';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, type RouteProp, useRoute } from '@react-navigation/native';
import { type RootStackParamList } from '@/navigation/types';
import type Routes from '@/navigation/routesNames';

const PANEL_INNER_WIDTH = 332;

const translations = i18n.l.predictions.explain_sheet;

const STEPS: ExplainerSheetStep[] = [
  {
    id: 'step-1',
    titleComponent: () => (
      <Box>
        <Text align="center" size="34pt" weight="heavy" color="label">
          {i18n.t(translations.steps.step_1.title)}
        </Text>
      </Box>
    ),
    graphicComponent: () => (
      <FastImage
        source={step1Image}
        style={{ width: PANEL_INNER_WIDTH, height: '100%', position: 'absolute' }}
        resizeMode={FastImage.resizeMode.contain}
      />
    ),
    subtitleComponent: () => (
      <Box paddingHorizontal="20px" width="full">
        <Text align="center" size="17pt / 135%" weight="medium" color="labelTertiary">
          {i18n.t(translations.steps.step_1.subtitle_parts[0])}
        </Text>
      </Box>
    ),
  },
  {
    id: 'step-2',
    titleComponent: () => (
      <Text align="center" size="34pt" weight="heavy" color="label">
        {i18n.t(translations.steps.step_2.title)}
      </Text>
    ),
    graphicComponent: () => (
      <FastImage
        source={step2Image}
        style={{ width: PANEL_INNER_WIDTH, height: '100%', position: 'absolute' }}
        resizeMode={FastImage.resizeMode.contain}
      />
    ),
    subtitleComponent: () => (
      <Text align="center" size="17pt / 135%" weight="medium" color="labelTertiary">
        {i18n.t(translations.steps.step_2.subtitle_parts[0])}
      </Text>
    ),
  },
  {
    id: 'step-3',
    titleComponent: () => (
      <Text align="center" size="34pt" weight="heavy" color="label">
        {i18n.t(translations.steps.step_3.title)}
      </Text>
    ),
    graphicComponent: () => (
      <FastImage
        source={step3Image}
        style={{ width: PANEL_INNER_WIDTH, height: '100%', position: 'absolute' }}
        resizeMode={FastImage.resizeMode.contain}
      />
    ),
    subtitleComponent: () => (
      <Box gap={16}>
        <Text align="center" size="17pt / 135%" weight="medium" color="labelTertiary">
          {i18n.t(translations.steps.step_3.subtitle_parts[0])}
        </Text>
      </Box>
    ),
  },
];

export function PolymarketExplainSheet() {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_EXPLAIN_SHEET>>();
  const onDismiss = params?.onDismiss;

  const nextButtonLabel = i18n.t(translations.next);
  const gotItButtonLabel = i18n.t(translations.get_started);

  useFocusEffect(
    useCallback(() => {
      return () => {
        onDismiss?.();
      };
    }, [onDismiss])
  );

  return (
    <ColorModeProvider value={'dark'}>
      <ExplainerSheet
        panelHeight={625}
        steps={STEPS}
        nextButtonLabel={nextButtonLabel}
        headerTitleComponent={() => (
          <Text color="label" size="20pt" weight="black">
            {i18n.t(translations.title)}
          </Text>
        )}
        completeButtonLabel={gotItButtonLabel}
        showSunrays={false}
        BackgroundComponent={() => (
          <View style={StyleSheet.absoluteFill}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,1)' }]} />
            <LinearGradient
              colors={['rgba(255,255,255,0)', 'rgba(255,255,255,1)']}
              locations={[0.06, 1]}
              start={{ x: 0, y: 1.24 }}
              end={{ x: 0, y: -0.12 }}
              style={[StyleSheet.absoluteFill, { opacity: 0.08 }]}
            />
          </View>
        )}
      />
    </ColorModeProvider>
  );
}
