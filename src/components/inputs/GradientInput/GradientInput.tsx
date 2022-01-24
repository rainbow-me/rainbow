import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import { TextInputProps, View } from 'react-native';
import { Input } from '../';
import AnimatedRadialGradient from './AnimatedRadialGradient';
import {
  Box,
  Cover,
  Heading,
  Inset,
  useHeadingStyle,
} from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';

export type GradientInputProps = {
  onChangeText: TextInputProps['onChangeText'];
  value: TextInputProps['value'];
  variant: 'rainbow' | 'warning';
};

const GradientInput = ({
  onChangeText,
  value,
  variant = 'rainbow',
}: GradientInputProps) => {
  const { width: deviceWidth } = useDimensions();
  const headingStyle = useHeadingStyle({ size: '30px', weight: 'heavy' });

  const height = 64;
  const strokeWidth = 3;
  const width = deviceWidth;

  return (
    <Box width="full">
      <Cover>
        <MaskedView
          maskElement={
            <Box
              background="body"
              borderRadius={46}
              height={`${height}px`}
              width="full"
            />
          }
          style={{ height: '100%', width: '100%' }}
        >
          <AnimatedRadialGradient
            height={height}
            variant={variant}
            width={width}
          />
        </MaskedView>
      </Cover>
      <Cover>
        <View style={{ height: '100%', width: '100%' }}>
          <Inset space="3px">
            <MaskedView
              maskElement={
                <Box
                  background="body"
                  borderRadius={46}
                  height={{ custom: height - strokeWidth * 2 }}
                  width="full"
                />
              }
            >
              <AnimatedRadialGradient
                height={height}
                type="tint"
                variant={variant}
                width={width}
              />
            </MaskedView>
          </Inset>
        </View>
      </Cover>
      <Cover>
        <MaskedView
          maskElement={
            <Box
              height={`${height}px`}
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
            height: '100%',
            width: '100%',
          }}
        >
          <AnimatedRadialGradient
            height={height}
            variant={variant}
            width={width}
          />
        </MaskedView>
      </Cover>
      <Cover alignHorizontal="right" alignVertical="center">
        <Inset right="19px">
          <Heading size="30px" weight="heavy">
            .eth
          </Heading>
        </Inset>
      </Cover>
      <Box height={`${height}px`} justifyContent="center">
        <Inset left="60px" right="76px">
          <Input
            autoFocus
            onChangeText={onChangeText}
            style={{
              ...headingStyle,
              marginTop: -5,
            }}
            value={value}
          />
        </Inset>
      </Box>
    </Box>
  );
};

export default GradientInput;
