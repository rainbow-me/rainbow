import { createSprinkles, defineProperties } from '@vanilla-extract/sprinkles';

import {
  backgroundColors,
  fontWeight,
  negativeSpace,
  radii,
  space,
  textColors,
  typeHierarchy,
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
    borderColor: textColors,
    borderStyle: ['solid'],
    borderTopLeftRadius: radii,
    borderTopRightRadius: radii,
    borderWidth: ['1px'],
    bottom: space,
    color: textColors,
    display: ['flex'],
    flexBasis: [0] as const,
    flexDirection: ['row', 'column'],
    flexGrow: [1] as const,
    flexShrink: [1] as const,
    fontSize: [
      ...Object.keys(typeHierarchy.heading),
      ...Object.keys(typeHierarchy.text),
    ],
    fontWeight,
    gap: space,
    height: ['100%'],
    justifyContent: {
      center: 'center',
      left: 'flex-start',
      right: 'flex-end',
    },
    left: space,
    letterSpacing: [0.5, 0.6],
    marginLeft: negativeSpace,
    marginRight: negativeSpace,
    maxWidth: ['768px'],
    paddingBottom: space,
    paddingLeft: space,
    paddingRight: space,
    paddingTop: space,
    position: ['absolute', 'relative', 'sticky'],
    right: space,
    top: space,
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
