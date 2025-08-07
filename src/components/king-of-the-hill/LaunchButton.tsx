import { opacity } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { GradientText } from '@/components/text';
import { globalColors, Text, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { Canvas, Group, Paint, RoundedRect, Shadow, LinearGradient, vec } from '@shopify/react-native-skia';
import React, { memo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

const BORDER_RADIUS = 28;

export const LaunchButton = memo(function LaunchButton() {
  const { isDarkMode } = useColorMode();

  return (
    <View style={styles.launchButtonPosition}>
      <ButtonPressAnimation
        onPress={() => {
          Navigation.handleAction(Routes.TOKEN_LAUNCHER_SCREEN);
        }}
      >
        <View
          style={[
            styles.launchButton,
            {
              shadowColor: isDarkMode ? '#000' : 'rgba(0,0,0,0.4)',
            },
          ]}
        >
          <InnerGlow />
          <View style={styles.launchButtonContent}>
            <View style={styles.launchButtonTextContainer}>
              <GradientText colors={['#3D1E0A', '#7A600A']}>
                <Text color="accent" size="icon 18px" weight="heavy" style={{ marginTop: -1 }}>
                  􀅼
                </Text>
              </GradientText>
              <GradientText colors={['#3D1E0A', '#7A600A']}>
                <Text color="accent" size="20pt" weight="heavy" style={{ marginTop: -1 }}>
                  {i18n.t(i18n.l.king_of_hill.launch)}
                </Text>
              </GradientText>
            </View>
          </View>
        </View>
      </ButtonPressAnimation>
    </View>
  );
});

const InnerGlow = memo(function InnerGlow() {
  const [{ width, height }, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  const borderRadius = BORDER_RADIUS;

  return (
    <View
      onLayout={event => {
        const { width, height } = event.nativeEvent.layout;
        setDimensions({ width: width + 1, height: height + 1 });
      }}
      style={[StyleSheet.absoluteFillObject, { borderRadius, overflow: 'hidden', pointerEvents: 'none' }]}
    >
      {Boolean(width && height) && (
        <Canvas style={{ width, height }}>
          <Group>
            <RoundedRect x={0} y={0} width={width} height={height} r={borderRadius}>
              <Paint antiAlias dither>
                <Shadow blur={3} color={opacity(globalColors.white100, 0.97)} dx={0} dy={3} inner />
              </Paint>
              <LinearGradient colors={['#EBAF09', '#FFC800']} start={vec(0, 0)} end={vec(width, 0)} />
            </RoundedRect>
          </Group>
        </Canvas>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  launchButtonPosition: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    zIndex: 10,
  },

  launchButton: {
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },

  // separate from launchButton so overflow hidden doesnt mess up shadow
  launchButtonContent: {
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffee5888',
    paddingVertical: 12,
  },

  launchButtonTextContainer: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
});
