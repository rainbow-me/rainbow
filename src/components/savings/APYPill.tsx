import React from 'react';
import { StyleSheet } from 'react-native';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native-dotenv"' has no exported mem... Remove this comment to see the full error message
import { IS_TESTING } from 'react-native-dotenv';
import LinearGradient from 'react-native-linear-gradient';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import RadialGradient from 'react-native-radial-gradient';
import { lightModeThemeColors } from '../../styles/colors';
import { Centered } from '../layout';

import { GradientText, Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';

const sx = StyleSheet.create({
  container: {
    height: 30,
    paddingBottom: 0.5,
    paddingHorizontal: 10,
  },
  containerSmall: {
    height: 21,
    paddingHorizontal: 6,
    transform: [{ translateX: -6 }],
  },
  gradient: {
    ...position.coverAsObject,
    overflow: 'hidden',
  },
});

const gradientColors = ['#2CCC00', '#FEBE44'];
const gradientProps = {
  pointerEvents: 'none',
  style: sx.gradient,
};

const linearGradientProps = {
  ...gradientProps,
  end: { x: 1, y: 1 },
  start: { x: 0, y: 0 },
};

const radialGradientProps = {
  ...gradientProps,
  center: [0, 1],
  colors: [
    lightModeThemeColors.alpha(gradientColors[0], 0.1),
    lightModeThemeColors.alpha(gradientColors[1], 0.08),
  ],
};

const textProps = {
  end: { x: 1, y: 1 },
  start: { x: 0, y: 0 },
  steps: [0, 1],
};

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
if (android) {
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'color' does not exist on type '{ end: { ... Remove this comment to see the full error message
  textProps.color = lightModeThemeColors.green;
}

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const TextComponent = ios ? GradientText : Text;

function APYPill({ small, value }: any) {
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Centered style={small ? sx.containerSmall : sx.container}>
      {IS_TESTING === 'true' ? null : small ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <RadialGradient
          {...radialGradientProps}
          borderRadius={21}
          radius={81}
        />
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <LinearGradient
          {...linearGradientProps}
          // @ts-expect-error ts-migrate(2769) FIXME: No overload matches this call.
          borderRadius={17}
          colors={gradientColors}
          opacity={0.1}
        />
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <TextComponent
        {...textProps}
        align="center"
        angle={false}
        letterSpacing="roundedTight"
        size={small ? 'smedium' : 'lmedium'}
        weight="semibold"
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        {...(android && { lineHeight: small ? 24 : 30 })}
      >
        {value}% APY
      </TextComponent>
    </Centered>
  );
}

export default React.memo(APYPill);
