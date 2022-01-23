import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import { TextInputProps, View } from 'react-native';
// @ts-ignore
import RadialGradient from 'react-native-radial-gradient';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import {
  RainbowGradientColorsDark,
  RainbowGradientColorsLight,
} from '../buttons/rainbow-button/RainbowButtonBackground';
import { Input } from './index';
import {
  Box,
  Heading,
  Inset,
  useForegroundColor,
} from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';

const Gradient = styled(RadialGradient).attrs(({ gradientColors, width }) => ({
  colors: gradientColors,
  radius: width,
  stops: [0, 0.6354, 1],
}))`
  position: absolute;
  transform: scaleY(0.7884615385);
  height: ${({ width }) => width};
  top: ${({ height, width }) => -(width - height) / 2};
  width: ${({ width }) => width};
`;

type GradientInputProps = {
  onChangeText: TextInputProps['onChangeText'];
  value: TextInputProps['value'];
};

const GradientInput = ({ onChangeText, value }: GradientInputProps) => {
  const { isDarkMode } = useTheme();
  const { width: deviceWidth } = useDimensions();
  const textColor = useForegroundColor('primary');
  const width = deviceWidth;

  const gradientColors = isDarkMode
    ? RainbowGradientColorsDark
    : RainbowGradientColorsLight;

  return (
    <Box
      height="64px"
      justifyContent="center"
      paddingLeft="60px"
      paddingRight="72px"
      width="full"
    >
      <MaskedView
        maskElement={
          <Box background="body" borderRadius={46} height="64px" width="full" />
        }
        style={{
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      >
        <Gradient
          center={[width, width / 2]}
          gradientColors={gradientColors.inner.rainbow}
          height={64}
          width={width}
        />
      </MaskedView>
      <View
        style={{ bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }}
      >
        <Inset space="3px">
          <MaskedView
            maskElement={
              <Box
                background="body"
                borderRadius={46}
                height={{ custom: 58 }}
                width="full"
              />
            }
          >
            <Gradient
              center={[width, width / 2]}
              gradientColors={gradientColors.inner.rainbowTint}
              height={60}
              width={width}
            />
          </MaskedView>
        </Inset>
      </View>
      <MaskedView
        maskElement={
          <Box
            height="64px"
            justifyContent="center"
            paddingLeft="15px"
            width="full"
          >
            <Heading size="30px" weight="heavy">
              􀊫
            </Heading>
          </Box>
        }
        style={{
          bottom: 0,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      >
        <Gradient
          center={[width, width / 2]}
          gradientColors={gradientColors.inner.rainbow}
          height={64}
          width={width}
        />
      </MaskedView>
      <Input
        autoFocus
        onChangeText={onChangeText}
        style={{
          color: textColor,
          fontSize: 30,
          fontWeight: '800',
          marginTop: -2.5,
        }}
        value={value}
      />
      <View
        style={{
          alignItems: 'flex-end',
          bottom: 0,
          justifyContent: 'center',
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      >
        <Inset right="19px">
          <Heading size="30px" weight="heavy">
            .eth
          </Heading>
        </Inset>
      </View>
    </Box>
  );
};

export default GradientInput;
