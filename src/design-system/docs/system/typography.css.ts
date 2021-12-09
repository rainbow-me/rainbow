import { createTextStyle } from '@capsizecss/vanilla-extract';
import mapValues from 'lodash/mapValues';

import { fontMetrics } from '../../typography/typography';
import { typeHierarchy } from './tokens.css';

function createTextSize({
  fontSize,
  lineHeight,
}: {
  fontSize: number;
  lineHeight: number;
}) {
  return createTextStyle({
    fontMetrics,
    fontSize,
    leading: lineHeight,
  });
}

export const sizes = {
  heading: mapValues(typeHierarchy.heading, createTextSize),
  text: mapValues(typeHierarchy.text, createTextSize),
};

export type HeadingSizes = keyof typeof sizes['heading'];
export type TextSizes = keyof typeof sizes['text'];

export const letterSpacings = {
  heading: mapValues(
    typeHierarchy.heading,
    ({ letterSpacing }) => letterSpacing
  ),
  text: mapValues(typeHierarchy.text, ({ letterSpacing }) => letterSpacing),
};
