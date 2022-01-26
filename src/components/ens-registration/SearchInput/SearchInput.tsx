import MaskedView from '@react-native-community/masked-view';
import React from 'react';
import { TextInputProps } from 'react-native';
import { Input } from '../../inputs';
import RadialGradientBackground from './RadialGradientBackground';
import {
  Box,
  Column,
  Columns,
  Cover,
  Heading,
  Inset,
  useHeadingStyle,
} from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';

export type SearchInputProps = {
  onChangeText: TextInputProps['onChangeText'];
  value: TextInputProps['value'];
  variant: 'rainbow' | 'warning' | 'success';
};

const SearchInput = ({
  onChangeText,
  value,
  variant = 'rainbow',
}: SearchInputProps) => {
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
          <RadialGradientBackground
            height={height}
            variant={variant}
            width={width}
          />
        </MaskedView>
      </Cover>
      <Cover>
        <Box style={{ height: '100%', width: '100%' }}>
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
              <RadialGradientBackground
                height={height}
                type="tint"
                variant={variant}
                width={width}
              />
            </MaskedView>
          </Inset>
        </Box>
      </Cover>
      <Box height={`${height}px`} justifyContent="center" width="full">
        <Inset left="15px" right="19px">
          <Columns alignHorizontal="justify">
            <Column width="content">
              <Box style={{ width: 42 }}>
                <MaskedView
                  maskElement={
                    <Box height={`${height}px`}>
                      <Heading size="30px" weight="heavy">
                        􀊫
                      </Heading>
                    </Box>
                  }
                >
                  <RadialGradientBackground
                    height={height}
                    variant={variant}
                    width={width}
                  />
                </MaskedView>
              </Box>
            </Column>
            <Input
              autoFocus
              onChangeText={onChangeText}
              style={{
                ...headingStyle,
                marginTop: -5,
              }}
              value={value}
            />
            <Column width="content">
              <Heading size="30px" weight="heavy">
                .eth
              </Heading>
            </Column>
          </Columns>
        </Inset>
      </Box>
    </Box>
  );
};

export default SearchInput;
