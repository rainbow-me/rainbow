import React from 'react';
import * as i18n from '@/languages';
import { Text as NativeText } from 'react-native';
import { Box, ColorModeProvider, Text } from '@/design-system';
import currentKingImage from '@/assets/kingOfTheHillExplainer/currentKing.png';
import pointsMultiplierImage from '@/assets/kingOfTheHillExplainer/pointsMultiplier.png';
import FastImage from 'react-native-fast-image';
import { fonts } from '@/styles';
import { ExplainerSheet, ExplainerSheetStep } from '@/components/explainer-sheet/ExplainerSheet';
import { GradientText } from '@/components/text';
import chroma from 'chroma-js';

const GRADIENT_COLORS = ['#8754C8', '#EE431D', '#FFF000', '#02ADDE'];
const PANEL_INNER_WIDTH = 332;

const translations = i18n.l.king_of_hill.explain_sheet;
const nextButtonLabel = i18n.t(translations.next);
const gotItButtonLabel = i18n.t(translations.got_it);

const STEPS: ExplainerSheetStep[] = [
  {
    id: 'step-1',
    titleComponent: () => (
      <Text align="center" size="34pt" weight="heavy" color="label">
        {i18n.t(translations.steps.step_1.title)}
      </Text>
    ),
    graphicComponent: () => (
      <FastImage source={currentKingImage} style={{ width: PANEL_INNER_WIDTH, height: '100%' }} resizeMode={FastImage.resizeMode.contain} />
    ),
    subtitleComponent: () => (
      <Text align="center" size="17pt / 135%" weight="medium" color="labelTertiary">
        {i18n.t(translations.steps.step_1.subtitle_parts[0])}
        <Text size="17pt" weight="bold" color="label">
          {i18n.t(translations.steps.step_1.subtitle_parts[1])}
        </Text>
        {i18n.t(translations.steps.step_1.subtitle_parts[2])}
      </Text>
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
  {
    id: 'step-3',
    titleComponent: () => (
      <Text align="center" size="34pt" weight="heavy" color="label">
        {i18n.t(translations.steps.step_3.title)}
      </Text>
    ),
    graphicComponent: () => (
      <FastImage
        source={pointsMultiplierImage}
        style={{ width: PANEL_INNER_WIDTH, height: '80%' }}
        resizeMode={FastImage.resizeMode.contain}
      />
    ),
    subtitleComponent: () => (
      <Box gap={16}>
        <Text align="center" size="17pt" weight="medium" color="labelTertiary">
          {`⚡️ ${i18n.t(translations.steps.step_3.subtitle_parts[0])}`}
          <Text size="17pt" weight="bold" color="label">
            {i18n.t(translations.steps.step_3.subtitle_parts[1])}
          </Text>
        </Text>
        <Text align="center" size="17pt" weight="medium" color="labelTertiary">
          {`👑 ${i18n.t(translations.steps.step_3.subtitle_two_parts[0])}`}
          <Text size="17pt" weight="bold" color="label">
            {i18n.t(translations.steps.step_3.subtitle_two_parts[1])}
          </Text>
          {i18n.t(translations.steps.step_3.subtitle_two_parts[2])}
        </Text>
      </Box>
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
          <GradientText colors={textGradientColors} locations={[0, 0.5, 0.75, 1]}>
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
