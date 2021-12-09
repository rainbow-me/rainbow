import { createSprinkles, defineProperties } from '@vanilla-extract/sprinkles';

import {
  backgroundColors,
  fontWeight,
  negativeSpace,
  radii,
  space,
  textColors,
} from './tokens.css';

const properties = defineProperties({
  properties: {
    alignItems: {
      bottom: 'flex-end',
      center: 'center',
      top: 'flex-start',
    },
    backgroundColor: backgroundColors,
    borderBottomLeftRadius: radii,
    borderBottomRightRadius: radii,
    borderTopLeftRadius: radii,
    borderTopRightRadius: radii,
    bottom: [0],
    color: textColors,
    display: ['flex'],
    flexBasis: [0] as const,
    flexDirection: ['row', 'column'],
    flexGrow: [1] as const,
    flexShrink: [1] as const,
    fontWeight,
    gap: space,
    height: ['100%'],
    justifyContent: {
      center: 'center',
      left: 'flex-start',
      right: 'flex-end',
    },
    left: [0],
    letterSpacing: [0.5, 0.6],
    marginLeft: negativeSpace,
    marginRight: negativeSpace,
    maxWidth: ['768px'],
    paddingBottom: space,
    paddingLeft: space,
    paddingRight: space,
    paddingTop: space,
    position: ['absolute', 'relative', 'sticky'],
    top: [0],
    width: ['100%'],
    wordBreak: ['break-word'],
    zIndex: [1],
  },
  shorthands: {
    borderBottomRadius: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
    borderRadius: [
      'borderTopLeftRadius',
      'borderBottomLeftRadius',
      'borderTopRightRadius',
      'borderBottomRightRadius',
    ],
    borderTopRadius: ['borderTopLeftRadius', 'borderTopRightRadius'],
    padding: ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'],
    paddingHorizontal: ['paddingLeft', 'paddingRight'],
    paddingVertical: ['paddingTop', 'paddingBottom'],
  },
});

const pseudoProperties = defineProperties({
  conditions: {
    default: {},
    hover: { selector: '&:hover' },
  },
  defaultCondition: 'default',
  properties: {
    textDecoration: ['underline'],
  },
});

export const sprinkles = createSprinkles(properties, pseudoProperties);
