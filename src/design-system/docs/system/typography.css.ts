import { createTextStyle } from '@capsizecss/vanilla-extract';

import { typeHierarchy as appTypeHierarchy } from '../../typography/typeHierarchy';
import { fontMetrics } from '../../typography/typography';

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

const docsTypeHierarchy = {
  heading: {
    '32px': {
      fontSize: 32,
      letterSpacing: 0.6,
      lineHeight: 36,
    },
  },
} as const;

export const typeHierarchy = Object.assign(
  {},
  appTypeHierarchy,
  docsTypeHierarchy
);

const mapLetterSpacingValues = <T extends object>(
  objectForMap: T
): { [P in keyof T]: number } => {
  return Object.entries(objectForMap).reduce((a, [key, { letterSpacing }]) => {
    Object.assign(a, { [key]: letterSpacing });
    return a;
  }, {} as { [P in keyof T]: number });
};

const mapTextSizeValues = <T extends object>(
  objectForMap: T
): { [P in keyof T]: string } => {
  return Object.entries(objectForMap).reduce(
    (a, [key, { fontSize, lineHeight }]) => {
      Object.assign(a, { [key]: createTextSize({ fontSize, lineHeight }) });
      return a;
    },
    {} as { [P in keyof T]: string }
  );
};

export const sizes = {
  heading: mapTextSizeValues(typeHierarchy.heading),
  text: mapTextSizeValues(typeHierarchy.text),
};

export type HeadingSizes = keyof typeof sizes['heading'];
export type TextSizes = keyof typeof sizes['text'];

export const letterSpacings = {
  heading: mapLetterSpacingValues(typeHierarchy.heading),
  text: mapLetterSpacingValues(typeHierarchy.text),
};
