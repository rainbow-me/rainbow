import { createTextStyle } from '@capsizecss/vanilla-extract';
import mapValues from 'lodash/mapValues';
import merge from 'lodash/merge';

import { typeHierarchy as appTypeHierarchy } from '../../typography/typeHierarchy';
import { fontMetrics } from '../../typography/typography';

function createTextSize({ fontSize, lineHeight }: { fontSize: number; lineHeight: number }) {
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

export const typeHierarchy = merge(appTypeHierarchy, docsTypeHierarchy);

export const sizes = {
  heading: mapValues(typeHierarchy.heading, createTextSize),
  text: mapValues(typeHierarchy.text, createTextSize),
};

export type HeadingSizes = keyof (typeof sizes)['heading'];
export type TextSizes = keyof (typeof sizes)['text'];

export const letterSpacings = {
  heading: mapValues(typeHierarchy.heading, ({ letterSpacing }) => letterSpacing),
  text: mapValues(typeHierarchy.text, ({ letterSpacing }) => letterSpacing),
};
