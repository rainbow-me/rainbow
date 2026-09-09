import React, { memo, useMemo } from 'react';
import { StyleSheet, View, type TextStyle } from 'react-native';

import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient, type LinearGradientProps } from 'expo-linear-gradient';

import { type TextProps } from '@/design-system/components/Text/Text';
import { useTextStyle } from '@/design-system/components/Text/useTextStyle';

interface TextShadowConfig {
  textShadowColor: string;
  textShadowOffset?: TextStyle['textShadowOffset'];
  textShadowRadius?: number;
}

interface GradientTextProps extends LinearGradientProps {
  bleed?: number;
  children: React.ReactElement<TextProps>;
  shadow?: TextShadowConfig;
}

export const GradientText = memo(function GradientText({
  children,
  bleed = 0,
  shadow,
  start = { x: 0, y: 0.5 },
  end = { x: 1, y: 0.5 },
  ...linearGradientProps
}: GradientTextProps) {
  let textStyle = useTextStyle({
    align: children.props.align,
    color: children.props.color,
    size: children.props.size,
    tabularNumbers: children.props.tabularNumbers,
    uppercase: children.props.uppercase,
    weight: children.props.weight,
  });

  const { marginTop, marginBottom } = textStyle;
  textStyle = {
    ...textStyle,
    marginTop: 0,
    marginBottom: 0,
  };

  const invisibleChild = useMemo(() => {
    return React.cloneElement(children, {
      style: [textStyle, children.props.style, { opacity: 0 }],
      testID: undefined,
    });
  }, [children, textStyle]);

  const visibleChild = useMemo(() => {
    return React.cloneElement(children, {
      style: [textStyle, children.props.style],
      testID: undefined,
    });
  }, [children, textStyle]);

  const shadowChild = useMemo(() => {
    if (!shadow) return null;
    return React.cloneElement(children, {
      color: { custom: 'transparent' },
      style: [textStyle, children.props.style, shadow],
      testID: undefined,
    });
  }, [children, shadow, textStyle]);

  const maskedView = (
    // The child is cloned into mask, gradient, and shadow layers; the id lives on this
    // root alone so the rendered element keeps the caller's identity exactly once.
    <MaskedView style={shadow ? undefined : { marginTop, marginBottom }} testID={children.props.testID} maskElement={visibleChild}>
      <LinearGradient
        start={start}
        end={end}
        pointerEvents="none"
        style={{ margin: -bleed }}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...linearGradientProps}
      >
        {invisibleChild}
      </LinearGradient>
    </MaskedView>
  );

  if (!shadow) return maskedView;

  return (
    <View style={{ marginTop, marginBottom }}>
      <View style={styles.shadow}>{shadowChild}</View>
      {maskedView}
    </View>
  );
});

const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    alignSelf: 'center',
  },
});
