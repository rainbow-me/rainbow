import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import {
  Circle,
  Defs,
  LinearGradient,
  RadialGradient,
  Rect,
  Stop,
  Svg,
} from 'react-native-svg';

const P = (ios, android) => (Platform.OS === 'ios' ? ios : android || ios);

const forLRBT = s => {
  return {
    bottom: s,
    left: s,
    right: s,
    top: s,
  };
};

function linearGradFactory(args, color) {
  return (
    <LinearGradient x1="0" x2="0" y1="0" y2="0" {...args}>
      <Stop offset="0" stopColor={color} stopOpacity="0" />
      <Stop offset="1" stopColor={color} stopOpacity={1} />
    </LinearGradient>
  );
}

function radialGradFactory(
  { id, x, y, transform },
  color,
  shadowRadius,
  borderRadius = 0
) {
  return (
    <RadialGradient
      cx={x}
      cy={y}
      fx={x}
      fy={y}
      gradientUnits="userSpaceOnUse"
      id={id}
      rx={shadowRadius + borderRadius}
      ry={shadowRadius + borderRadius}
      transform={transform}
    >
      <Stop offset="0" stopColor={color} stopOpacity={1} />
      <Stop
        offset={borderRadius / (shadowRadius + borderRadius)}
        stopColor={color}
        stopOpacity={1}
      />
      <Stop offset="1" stopColor={color} stopOpacity="0" />
    </RadialGradient>
  );
}

function splitPositionalStyleProps(style) {
  const {
    bottom,
    direction,
    display,
    end,
    left,
    margin,
    marginBottom,
    marginEnd,
    marginHorizontal,
    marginLeft,
    marginRight,
    marginStart,
    marginTop,
    marginVertical,
    position,
    right,
    start,
    top,
    zIndex,
    backfaceVisibility,
    opacity,
    transform,
    width,
    height,
    ...rest
  } = style;
  return [
    {
      backfaceVisibility,
      bottom,
      direction,
      display,
      end,
      height,
      left,
      margin,
      marginBottom,
      marginEnd,
      marginHorizontal,
      marginLeft,
      marginRight,
      marginStart,
      marginTop,
      marginVertical,
      opacity,
      position,
      right,
      start,
      top,
      transform,
      width,
      zIndex,
    },
    rest,
  ];
}

const INNERALIZING_OF_SHADOW = P(1.3, 1.4);
const MULTIPLICATING_SHADOW = P(2.4, 2.3);
const MIN_RADIUS = P(2, 10);
const EPSILON = P(0, 0.17);

function ShadowView(props) {
  const fstyle = StyleSheet.flatten(props.style);
  const {
    shadowColor,
    shadowOpacity = 1,
    shadowRadius,
    shadowOffset = {},
    ...restStyle
  } = fstyle;
  const { width = 0, height = 0 } = shadowOffset;
  const [outerProps, innerProps] = splitPositionalStyleProps(restStyle);
  const { borderRadius = 0 } = innerProps;
  const {
    borderTopRightRadius: rawBorderTopRightRadius = borderRadius,
    borderTopLeftRadius: rawBorderTopLeftRadius = borderRadius,
    borderBottomRightRadius: rawBorderBottomRightRadius = borderRadius,
    borderBottomLeftRadius: rawBorderBottomLeftRadius = borderRadius,
  } = innerProps;

  const borderTopRightRadius = Math.max(
    rawBorderTopRightRadius - shadowRadius,
    MIN_RADIUS
  );
  const borderTopLeftRadius = Math.max(
    rawBorderTopLeftRadius - shadowRadius,
    MIN_RADIUS
  );
  const borderBottomRightRadius = Math.max(
    rawBorderBottomRightRadius - shadowRadius,
    MIN_RADIUS
  );
  const borderBottomLeftRadius = Math.max(
    rawBorderBottomLeftRadius - shadowRadius,
    MIN_RADIUS
  );

  return (
    <View {...props} style={[outerProps, { backgroundColor: 'transparent' }]}>
      <View
        pointerEvents="none"
        style={{
          ...forLRBT('-150%'),
          flexDirection: 'column',
          justifyContent: 'center',
          opacity: shadowOpacity,
          position: 'absolute',
          transform: [{ translateX: width }, { translateY: height }],
        }}
      >
        <View
          style={{
            backgroundColor: 'transparent',
            flexDirection: 'row',
            height: '50%',
            width: '100%',
          }}
        >
          <View
            style={{
              backgroundColor: 'transparent',
              height: '100%',
              width: '50%',
            }}
          >
            <Svg height="100%" width="100%">
              <Defs>
                {linearGradFactory({ id: 'grad-top', y2: 1 }, shadowColor)}
                {linearGradFactory({ id: 'grad-left', x2: 1 }, shadowColor)}
                {radialGradFactory(
                  {
                    id: 'grad-top-left',
                    transform: `translate(${MULTIPLICATING_SHADOW *
                      shadowRadius +
                      borderTopLeftRadius}, ${MULTIPLICATING_SHADOW *
                      shadowRadius +
                      borderTopLeftRadius})`,
                    x: '75%',
                    y: '75%',
                  },
                  shadowColor,
                  shadowRadius * MULTIPLICATING_SHADOW,
                  borderTopLeftRadius
                )}
              </Defs>
              <Rect
                fill="url(#grad-left)"
                height="25%"
                transform={`translate(${INNERALIZING_OF_SHADOW *
                  shadowRadius}, ${INNERALIZING_OF_SHADOW * shadowRadius +
                  borderTopLeftRadius})`}
                width={-shadowRadius * MULTIPLICATING_SHADOW}
                x="75%"
                y="75%"
              />
              <Rect
                fill="url(#grad-top)"
                height={-shadowRadius * MULTIPLICATING_SHADOW}
                transform={`translate(${INNERALIZING_OF_SHADOW * shadowRadius +
                  borderTopLeftRadius}, ${INNERALIZING_OF_SHADOW *
                  shadowRadius})`}
                width="25%"
                x="75%"
                y="75%"
              />
              <Rect
                fill="url(#grad-top-left)"
                height={
                  shadowRadius * MULTIPLICATING_SHADOW + borderTopLeftRadius
                }
                transform={`translate(-${(MULTIPLICATING_SHADOW -
                  INNERALIZING_OF_SHADOW) *
                  shadowRadius}, -${(MULTIPLICATING_SHADOW -
                  INNERALIZING_OF_SHADOW) *
                  shadowRadius})`}
                width={
                  shadowRadius * MULTIPLICATING_SHADOW + borderTopLeftRadius
                }
                x="75%"
                y="75%"
              />
              <Rect
                fill={shadowColor}
                height="25%"
                transform={`translate(${INNERALIZING_OF_SHADOW * shadowRadius +
                  borderTopLeftRadius}, ${INNERALIZING_OF_SHADOW *
                  shadowRadius +
                  borderTopLeftRadius})`}
                width="25%"
                x="75%"
                y="75%"
              />
              <Rect
                fill={shadowColor}
                height="25%"
                transform={`translate(${INNERALIZING_OF_SHADOW *
                  shadowRadius}, ${INNERALIZING_OF_SHADOW * shadowRadius +
                  borderTopLeftRadius})`}
                width={borderTopLeftRadius}
                x="75%"
                y="75%"
              />
              <Rect
                fill={shadowColor}
                height={borderTopLeftRadius}
                transform={`translate(${INNERALIZING_OF_SHADOW * shadowRadius +
                  borderTopLeftRadius}, ${INNERALIZING_OF_SHADOW *
                  shadowRadius})`}
                width="25%"
                x="75%"
                y="75%"
              />
              <Circle
                cx="75%"
                cy="75%"
                fill={shadowColor}
                r={borderTopLeftRadius}
                transform={`translate(${INNERALIZING_OF_SHADOW * shadowRadius +
                  borderTopLeftRadius}, ${INNERALIZING_OF_SHADOW *
                  shadowRadius +
                  borderTopLeftRadius})`}
              />
            </Svg>
          </View>
          <View
            style={{
              backgroundColor: 'transparent',
              height: '100%',
              transform: [{ translateX: -EPSILON }],
              width: '50%',
            }}
          >
            <Svg height="100%" width="100%">
              <Defs>
                {linearGradFactory({ id: 'grad-top', y2: 1 }, shadowColor)}
                {linearGradFactory({ id: 'grad-right', x1: 1 }, shadowColor)}
                {radialGradFactory(
                  {
                    id: 'grad-top-right',
                    transform: `translate(0, ${MULTIPLICATING_SHADOW *
                      shadowRadius +
                      borderTopRightRadius})`,
                    x: '25%',
                    y: '75%',
                  },
                  shadowColor,
                  shadowRadius * MULTIPLICATING_SHADOW,
                  borderTopRightRadius
                )}
              </Defs>
              <Rect
                fill="url(#grad-right)"
                height="50%"
                transform={`translate(${-INNERALIZING_OF_SHADOW *
                  shadowRadius}, ${INNERALIZING_OF_SHADOW * shadowRadius +
                  borderTopRightRadius})`}
                width={shadowRadius * MULTIPLICATING_SHADOW}
                x="25%"
                y="75%"
              />
              <Rect
                fill="url(#grad-top)"
                height={shadowRadius * MULTIPLICATING_SHADOW}
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderTopRightRadius}, ${(INNERALIZING_OF_SHADOW -
                  MULTIPLICATING_SHADOW) *
                  shadowRadius})`}
                width="25%"
                x="0%"
                y="75%"
              />
              <Rect
                fill="url(#grad-top-right)"
                height={
                  shadowRadius * MULTIPLICATING_SHADOW + borderTopRightRadius
                }
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderTopRightRadius}, ${-(
                  MULTIPLICATING_SHADOW - INNERALIZING_OF_SHADOW
                ) * shadowRadius})`}
                width={
                  shadowRadius * MULTIPLICATING_SHADOW + borderTopRightRadius
                }
                x="25%"
                y="75%"
              />
              <Rect
                fill={shadowColor}
                height="25%"
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderTopRightRadius}, ${INNERALIZING_OF_SHADOW *
                  shadowRadius +
                  borderTopRightRadius})`}
                width="25%"
                x="0%"
                y="75%"
              />
              <Rect
                fill={shadowColor}
                height="25%"
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderTopRightRadius}, ${INNERALIZING_OF_SHADOW *
                  shadowRadius +
                  borderTopRightRadius})`}
                width={borderTopRightRadius + 2}
                x="25%"
                y="75%"
              />
              <Rect
                fill={shadowColor}
                height={borderTopRightRadius}
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderTopRightRadius}, ${INNERALIZING_OF_SHADOW *
                  shadowRadius})`}
                width="25%"
                x="0%"
                y="75%"
              />
              <Circle
                cx="25%"
                cy="75%"
                fill={shadowColor}
                r={borderTopRightRadius}
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderTopRightRadius}, ${INNERALIZING_OF_SHADOW *
                  shadowRadius +
                  borderTopRightRadius})`}
              />
            </Svg>
          </View>
        </View>
        <View
          style={{
            backgroundColor: 'transparent',
            flexDirection: 'row',
            height: '50%',
            width: '100%',
          }}
        >
          <View
            style={{
              backgroundColor: 'transparent',
              height: '100%',
              width: '50%',
            }}
          >
            <Svg height="100%" width="100%">
              <Defs>
                {linearGradFactory({ id: 'grad-bottom', y1: 1 }, shadowColor)}
                {linearGradFactory({ id: 'grad-left', x2: 1 }, shadowColor)}
                {radialGradFactory(
                  {
                    id: 'grad-bottom-left',
                    transform: `translate(${MULTIPLICATING_SHADOW *
                      shadowRadius +
                      borderBottomLeftRadius}, 0)`,
                    x: '75%',
                    y: '25%',
                  },
                  shadowColor,
                  shadowRadius * MULTIPLICATING_SHADOW,
                  borderBottomLeftRadius
                )}
              </Defs>
              <Rect
                fill="url(#grad-left)"
                height="25%"
                transform={`translate(${INNERALIZING_OF_SHADOW *
                  shadowRadius}, ${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderBottomLeftRadius})`}
                width={-shadowRadius * MULTIPLICATING_SHADOW}
                x="75%"
                y="0%"
              />

              <Rect
                fill="url(#grad-bottom)"
                height={shadowRadius * MULTIPLICATING_SHADOW}
                transform={`translate(${INNERALIZING_OF_SHADOW * shadowRadius +
                  borderBottomLeftRadius}, ${-INNERALIZING_OF_SHADOW *
                  shadowRadius})`}
                width="25%"
                x="75%"
                y="25%"
              />
              <Rect
                fill="url(#grad-bottom-left)"
                height={
                  shadowRadius * MULTIPLICATING_SHADOW + borderBottomLeftRadius
                }
                transform={`translate(${-(
                  MULTIPLICATING_SHADOW - INNERALIZING_OF_SHADOW
                ) * shadowRadius}, ${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderBottomLeftRadius})`}
                width={
                  shadowRadius * MULTIPLICATING_SHADOW + borderBottomLeftRadius
                }
                x="75%"
                y="25%"
              />
              <Rect
                fill={shadowColor}
                height="25%"
                transform={`translate(${INNERALIZING_OF_SHADOW * shadowRadius +
                  borderBottomLeftRadius}, ${-INNERALIZING_OF_SHADOW *
                  shadowRadius -
                  borderBottomLeftRadius})`}
                width="25%"
                x="75%"
                y="0%"
              />
              <Rect
                fill={shadowColor}
                height="25%"
                transform={`translate(${INNERALIZING_OF_SHADOW *
                  shadowRadius}, ${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderBottomLeftRadius})`}
                width={borderBottomLeftRadius}
                x="75%"
                y="0%"
              />
              <Rect
                fill={shadowColor}
                height={borderBottomLeftRadius}
                transform={`translate(${INNERALIZING_OF_SHADOW * shadowRadius +
                  borderBottomLeftRadius}, ${-INNERALIZING_OF_SHADOW *
                  shadowRadius -
                  borderBottomLeftRadius})`}
                width="50%"
                x="75%"
                y="25%"
              />
              <Circle
                cx="75%"
                cy="25%"
                fill={shadowColor}
                r={borderBottomLeftRadius}
                transform={`translate(${INNERALIZING_OF_SHADOW * shadowRadius +
                  borderBottomLeftRadius}, ${-INNERALIZING_OF_SHADOW *
                  shadowRadius -
                  borderBottomLeftRadius})`}
              />
            </Svg>
          </View>
          <View
            style={{
              height: '100%',
              transform: [{ translateX: -EPSILON }],
              width: '50%',
            }}
          >
            <Svg height="100%" width="100%">
              <Defs>
                {linearGradFactory({ id: 'grad-bottom', y1: 1 }, shadowColor)}
                {linearGradFactory({ id: 'grad-right', x1: 1 }, shadowColor)}
                {radialGradFactory(
                  { id: 'grad-bottom-right', x: '25%', y: '25%' },
                  shadowColor,
                  shadowRadius * MULTIPLICATING_SHADOW,
                  borderBottomRightRadius
                )}
              </Defs>
              <Rect
                fill="url(#grad-right)"
                height="25%"
                transform={`translate(${-INNERALIZING_OF_SHADOW *
                  shadowRadius}, ${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderBottomRightRadius})`}
                width={shadowRadius * MULTIPLICATING_SHADOW}
                x="25%"
                y="0%"
              />
              <Rect
                fill="url(#grad-bottom)"
                height={shadowRadius * MULTIPLICATING_SHADOW}
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderBottomRightRadius}, ${-INNERALIZING_OF_SHADOW *
                  shadowRadius})`}
                width="25%"
                x="0%"
                y="25%"
              />
              <Rect
                fill="url(#grad-bottom-right)"
                height={
                  shadowRadius * MULTIPLICATING_SHADOW + borderBottomRightRadius
                }
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderBottomRightRadius}, ${-INNERALIZING_OF_SHADOW *
                  shadowRadius -
                  borderBottomRightRadius})`}
                width={
                  shadowRadius * MULTIPLICATING_SHADOW + borderBottomRightRadius
                }
                x="25%"
                y="25%"
              />
              <Rect
                fill={shadowColor}
                height="25%"
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderBottomRightRadius}, ${-INNERALIZING_OF_SHADOW *
                  shadowRadius -
                  borderBottomRightRadius})`}
                width="25%"
                x="0%"
                y="0%"
              />
              <Rect
                fill={shadowColor}
                height="25%"
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderBottomRightRadius}, ${-INNERALIZING_OF_SHADOW *
                  shadowRadius -
                  borderBottomRightRadius})`}
                width={borderBottomRightRadius}
                x="25%"
                y="0%"
              />
              <Rect
                fill={shadowColor}
                height={borderBottomRightRadius}
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderBottomRightRadius}, ${-INNERALIZING_OF_SHADOW *
                  shadowRadius -
                  borderBottomRightRadius})`}
                width="25%"
                x="0%"
                y="25%"
              />
              <Circle
                cx="25%"
                cy="25%"
                fill={shadowColor}
                r={borderBottomRightRadius}
                transform={`translate(${-INNERALIZING_OF_SHADOW * shadowRadius -
                  borderBottomRightRadius}, ${-INNERALIZING_OF_SHADOW *
                  shadowRadius -
                  borderBottomRightRadius})`}
              />
            </Svg>
          </View>
        </View>
      </View>
      <View
        style={[
          innerProps,
          { height: '100%', position: 'absolute', width: '100%' },
        ]}
      />

      {props.children}
    </View>
  );
}
export default ShadowView;
