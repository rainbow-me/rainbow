import React, { useCallback, useMemo, useRef, useState } from 'react';
import { TextInputProps } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import Input from './Input';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { Bleed, Column, Columns, Inline, Inset, Text, TextProps, useTextStyle } from '@/design-system';
import { useDimensions } from '@/hooks';

const textSize: TextProps['size'] = '16px / 22px (Deprecated)';
const textSizeNumeric = 16;

export type InlineFieldProps = {
  autoFocus?: TextInputProps['autoFocus'];
  defaultValue?: string;
  errorMessage?: string;
  label: string;
  placeholder?: string;
  inputProps?: Partial<TextInputProps>;
  onChangeText: (text: string) => void;
  onFocus?: TextInputProps['onFocus'];
  onEndEditing?: TextInputProps['onEndEditing'];
  selectionColor?: string;
  shouldFormatText?: boolean;
  startsWith?: string;
  validations?: {
    onChange?: {
      match?: RegExp;
    };
  };
  value?: string;
  testID?: string;
  key?: string;
};

export default function InlineField({
  autoFocus,
  defaultValue,
  errorMessage,
  label,
  onChangeText,
  onFocus,
  placeholder,
  inputProps,
  onEndEditing,
  selectionColor,
  shouldFormatText,
  startsWith,
  value,
  testID,
}: InlineFieldProps) {
  const { colors } = useTheme();
  const { width } = useDimensions();

  const paddingVertical = 17;
  const textStyle = useTextStyle({
    color: 'primary (Deprecated)',
    size: textSize,
    weight: 'bold',
  });

  const [inputHeight, setInputHeight] = useState(textSizeNumeric);
  const handleContentSizeChange = useCallback(({ nativeEvent }: { nativeEvent: { contentSize: { width: number; height: number } } }) => {
    const contentHeight = nativeEvent.contentSize.height - textSizeNumeric - paddingVertical;
    if (contentHeight > 30) {
      setInputHeight(contentHeight);
    } else {
      setInputHeight(textSizeNumeric);
    }
  }, []);

  const valueRef = useRef(value);
  const style = useMemo(
    () => ({
      ...textStyle,
      lineHeight: android ? textStyle.lineHeight : undefined,
      marginBottom: 0,
      marginTop: 0,
      minHeight: inputHeight + paddingVertical * 2 + (android ? 2 : 0),
      paddingBottom: inputProps?.multiline ? (ios ? 15 : 7) : 0,
      paddingTop: inputProps?.multiline ? (android ? 11 : 15) : android ? (valueRef.current ? 16 : 11) : 0,
      width: startsWith ? (ios ? 0.55 * width : 0.56 * width) : ios ? 0.6 * width : 0.61 * width,
    }),
    [textStyle, inputHeight, inputProps?.multiline, startsWith, width]
  );

  let keyboardType = inputProps?.keyboardType;
  if (android) {
    keyboardType = shouldFormatText ? 'default' : 'visible-password';
  }

  return (
    <Columns>
      <Column width="1/3">
        <Inset top="19px (Deprecated)">
          <Inline space="4px">
            <Text color={errorMessage ? { custom: colors.red } : 'primary (Deprecated)'} size={textSize} weight="heavy">
              {label}
            </Text>
            {errorMessage && (
              <Bleed space="10px">
                <ButtonPressAnimation onPress={() => Alert.alert(errorMessage)} testID={`${testID}-error`}>
                  <Inset space="10px">
                    <Text color={{ custom: colors.red }} size={textSize} weight="heavy">
                      􀇿
                    </Text>
                  </Inset>
                </ButtonPressAnimation>
              </Bleed>
            )}
          </Inline>
        </Inset>
      </Column>
      <Column>
        <Inline alignVertical="center" space="2px" wrap={false}>
          {startsWith && (
            <Inset top={ios ? '2px' : '1px (Deprecated)'}>
              <Text color="secondary30 (Deprecated)" size="16px / 22px (Deprecated)" weight="heavy">
                {startsWith}
              </Text>
            </Inset>
          )}
          <Input
            autoCapitalize={shouldFormatText ? 'sentences' : 'none'}
            autoCorrect={shouldFormatText}
            autoFocus={autoFocus}
            defaultValue={defaultValue}
            onChangeText={onChangeText}
            onContentSizeChange={android && inputProps?.multiline ? handleContentSizeChange : undefined}
            onEndEditing={onEndEditing}
            onFocus={onFocus}
            placeholder={placeholder}
            scrollEnabled={false}
            selectionColor={selectionColor}
            spellCheck={false}
            style={style}
            textAlignVertical="top"
            value={value}
            {...inputProps}
            keyboardType={keyboardType}
            testID={testID}
          />
        </Inline>
      </Column>
    </Columns>
  );
}
