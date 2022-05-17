import MaskedView from '@react-native-masked-view/masked-view';
import React, { useMemo, useRef } from 'react';
import { TextInputProps } from 'react-native';
import Spinner from '../../Spinner';
import { Input } from '../../inputs';
import SearchInputGradientBackground from './SearchInputGradientBackground';
import {
  Box,
  Column,
  Columns,
  Cover,
  Heading,
  Inset,
  useHeadingStyle,
} from '@rainbow-me/design-system';
import { useDimensions, useMagicAutofocus } from '@rainbow-me/hooks';

export type SearchInputProps = {
  isLoading?: boolean;
  onChangeText: TextInputProps['onChangeText'];
  value: TextInputProps['value'];
  variant?: 'rainbow';
  selectionColor?: string;
  state?: 'success' | 'warning';
  testID: string;
};

const SearchInput = ({
  isLoading,
  onChangeText,
  value,
  variant = 'rainbow',
  selectionColor,
  state,
  testID,
}: SearchInputProps) => {
  const { width: deviceWidth } = useDimensions();
  const headingStyle = useHeadingStyle({ size: '30px', weight: 'heavy' });

  const inputRef = useRef();
  const { handleFocus } = useMagicAutofocus(
    inputRef,
    undefined,
    // On Android, should show keyboard upon navigation focus.
    true,
    // On iOS, defer keyboard display until interactions finished (screen transition).
    ios
  );

  const height = 64;
  const strokeWidth = 3;

  return (
    <Box width="full">
      <Cover>
        <Box
          as={MaskedView}
          maskElement={
            <Box
              background="body"
              borderRadius={46}
              height={`${height}px`}
              width="full"
            />
          }
          style={useMemo(() => ({ height: '100%', width: '100%' }), [])}
        >
          <SearchInputGradientBackground
            height={height}
            state={state}
            variant={variant}
            width={deviceWidth}
          />
        </Box>
      </Cover>
      <Cover>
        <Box
          as={MaskedView}
          maskElement={
            <Inset space="3px">
              <Box
                background="body"
                borderRadius={46}
                height={{ custom: height - strokeWidth * 2 }}
                width="full"
              />
            </Inset>
          }
          style={useMemo(() => ({ height: '100%', width: '100%' }), [])}
        >
          <SearchInputGradientBackground
            height={height}
            state={state}
            type="tint"
            variant={variant}
            width={deviceWidth}
          />
        </Box>
      </Cover>
      <Box height={`${height}px`} justifyContent="center" width="full">
        <Inset left="15px" right="19px">
          <Columns alignHorizontal="justify" alignVertical="center">
            <Column width="content">
              <MaskedView
                maskElement={
                  <Box height={`${height}px`} paddingTop={{ custom: 22 }}>
                    {isLoading ? (
                      <Box marginLeft="-8px" marginTop="-4px">
                        <Spinner duration={1000} size={28} />
                      </Box>
                    ) : (
                      <Heading size="30px" weight="heavy">
                        􀊫
                      </Heading>
                    )}
                  </Box>
                }
                style={useMemo(() => ({ height, width: 42 }), [])}
              >
                <SearchInputGradientBackground
                  height={height}
                  state={state}
                  variant={variant}
                  width={deviceWidth}
                />
              </MaskedView>
            </Column>
            <Input
              autoCorrect={false}
              keyboardType="visible-password"
              onChangeText={onChangeText}
              onFocus={handleFocus}
              ref={inputRef}
              selectionColor={selectionColor}
              spellCheck={false}
              style={useMemo(
                () => ({
                  ...headingStyle,
                  height,
                  top: ios ? 1.5 : 8,
                }),
                [headingStyle]
              )}
              testID={testID}
              value={value}
            />
            <Column width="content">
              <Heading align="right" size="30px" weight="heavy">
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
