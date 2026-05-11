import React from 'react';
import { Text as NativeText } from 'react-native';

import chroma from 'chroma-js';
import { type LinearGradientProps } from 'expo-linear-gradient';
import FastImage from 'react-native-fast-image';

import currentKingImage from '@/assets/kingOfTheHillExplainer/currentKing.png';
import { ExplainerSheet, type ExplainerSheetStep } from '@/components/explainer-sheet/ExplainerSheet';
import { GradientText } from '@/components/text';
import { Box, ColorModeProvider, Text } from '@/design-system';
import * as i18n from '@/languages';
import { fonts } from '@/styles';

const GRADIENT_COLORS = ['#8754C8', '#EE431D', '#FFF000', '#02ADDE'];
const PANEL_INNER_WIDTH = 332;

const translations = i18n.l.king_of_hill.explain_sheet;
const nextButtonLabel = i18n.t(translations.next);
const gotItButtonLabel = i18n.t(translations.got_it);

const STEPS: ExplainerSheetStep[] = [
  {
    id: 'step-1',
    titleComponent: () => (
      <Box bottom={{ custom: 24 }}>
        <Text align="center" size="34pt" weight="heavy" color="label">
          {i18n.t(translations.steps.step_1.title)}
        </Text>
      </Box>
    ),
    graphicComponent: () => (
      <FastImage
        source={currentKingImage}
        style={{ width: PANEL_INNER_WIDTH, height: '100%', position: 'absolute' }}
        resizeMode={FastImage.resizeMode.contain}
      />
    ),
    subtitleComponent: () => (
      <Box bottom={{ custom: 24 }} paddingHorizontal="20px" width="full">
        <Text align="center" size="17pt / 135%" weight="medium" color="labelTertiary">
          {i18n.t(translations.steps.step_1.subtitle_parts[0])}
          <Text size="17pt" weight="bold" color="label">
            {i18n.t(translations.steps.step_1.subtitle_parts[1])}
          </Text>
          {i18n.t(translations.steps.step_1.subtitle_parts[2])}
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
    graphicComponent: () => <NativeText style={{ fontSize: 90, fontFamily: fonts.family.SFProRounded, marginTop: -10 }}>{'👑'}</NativeText>,
    subtitleComponent: () => (
      <Text align="center" size="17pt / 135%" weight="medium" color="labelTertiary">
        {i18n.t(translations.steps.step_2.subtitle_parts[0])}
        <Text size="17pt / 135%" weight="bold" color="label">
          {i18n.t(translations.steps.step_2.subtitle_parts[1])}
        </Text>
        {i18n.t(translations.steps.step_2.subtitle_parts[2])}
      </Text>
    ),
  },
];

export function KingOfTheHillExplainSheet() {
  const textGradientColors = GRADIENT_COLORS.map(color => chroma(color).mix('#F5F8FF', 0.56).hex());

  return (
    <ColorModeProvider value={'dark'}>
      <ExplainerSheet
        steps={STEPS}
        headerTitleComponent={() => (
          <GradientText colors={textGradientColors as unknown as LinearGradientProps['colors']} locations={[0, 0.5, 0.75, 1]}>
            <Text size="20pt" weight="black" color="label" uppercase style={{ letterSpacing: 0.6 }}>
              {i18n.t(i18n.l.king_of_hill.king_of_the_hill)}
            </Text>
          </GradientText>
        )}
        gradientColors={GRADIENT_COLORS}
        nextButtonLabel={nextButtonLabel}
        completeButtonLabel={gotItButtonLabel}
      />
    </ColorModeProvider>
  );
}
