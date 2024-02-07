import { createSprinkles, defineProperties } from '@vanilla-extract/sprinkles';

import { colorModeVars, dark } from './colorModes.css';
import { fontWeights, negativeSpace, radii, space } from './tokens.css';
import { typeHierarchy } from './typography.css';

const properties = defineProperties({
  properties: {
    alignItems: {
      bottom: 'flex-end',
      center: 'center',
      top: 'flex-start',
    },
    borderBottomLeftRadius: radii,
    borderBottomRightRadius: radii,
    borderStyle: ['solid'],
    borderTopLeftRadius: radii,
    borderTopRightRadius: radii,
    borderWidth: ['1px'],
    bottom: space,
    display: ['flex'],
    flexBasis: [0] as const,
    flexDirection: ['row', 'column'],
    flexGrow: [1] as const,
    flexShrink: [1] as const,
    fontSize: [...Object.keys(typeHierarchy.heading), ...Object.keys(typeHierarchy.text)] as (
      | keyof typeof typeHierarchy.heading
      | keyof typeof typeHierarchy.text
    )[],
    fontWeight: fontWeights,
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
    position: ['absolute', 'relative', 'sticky', 'fixed'],
    right: space,
    top: space,
    width: ['100%'],
    wordBreak: ['break-word'],
    zIndex: [1],
  },
  shorthands: {
    borderBottomRadius: ['borderBottomLeftRadius', 'borderBottomRightRadius'],
    borderRadius: ['borderTopLeftRadius', 'borderBottomLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius'],
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

const colorModeProperties = defineProperties({
  conditions: {
    darkMode: { selector: `.${dark} &` },
    lightMode: {},
  },
  defaultCondition: 'lightMode',
  properties: {
    backgroundColor: colorModeVars.backgroundColors,
    borderColor: colorModeVars.foregroundColors,
    color: colorModeVars.foregroundColors,
  },
});

const responsiveProperties = defineProperties({
  conditions: {
    collapsed: { '@media': 'screen and (max-width: 840px)' },
    default: {},
  },
  defaultCondition: 'default',
  properties: {
    visibility: ['visible', 'hidden'],
  },
});

export const sprinkles = createSprinkles(properties, colorModeProperties, pseudoProperties, responsiveProperties);
