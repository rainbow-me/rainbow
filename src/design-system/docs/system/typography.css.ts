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

export const typeHierarchy = {
  ...appTypeHierarchy,
  heading: { ...docsTypeHierarchy.heading, ...appTypeHierarchy.heading },
};

const mapTextSizeValues = <T extends object>(objectForMap: T) => {
  return Object.entries(objectForMap).reduce(
    (acc, [key, { fontSize, lineHeight }]) => {
      acc[key as keyof T] = createTextSize({ fontSize, lineHeight });
      return acc;
    },
    {} as { [k in keyof T]: string }
  );
};

const mapLetterSpacingValues = <T extends object>(objectForMap: T) => {
  return Object.entries(objectForMap).reduce(
    (acc, [key, { letterSpacing }]) => {
      acc[key as keyof T] = letterSpacing;
      return acc;
    },
    {} as { [k in keyof T]: number }
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
