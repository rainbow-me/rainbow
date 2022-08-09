import React, { useCallback, useMemo, useRef, useState } from 'react';
import { TextInputProps } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';
import ButtonPressAnimation from '../animations/ButtonPressAnimation';
import Input from './Input';
import { WrappedAlert as Alert } from '@/helpers/alert';
import {
  Bleed,
  Column,
  Columns,
  Inline,
  Inset,
  Text,
  useTextStyle,
} from '@rainbow-me/design-system';
import { useDimensions } from '@rainbow-me/hooks';

const textSize = 16;

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
  const textStyle = useTextStyle({ size: `${textSize}px`, weight: 'bold' });

  const [inputHeight, setInputHeight] = useState(textSize);
  const handleContentSizeChange = useCallback(({ nativeEvent }) => {
    const contentHeight =
      nativeEvent.contentSize.height - textSize - paddingVertical;
    if (contentHeight > 30) {
      setInputHeight(contentHeight);
    } else {
      setInputHeight(textSize);
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
      paddingTop: inputProps?.multiline
        ? android
          ? 11
          : 15
        : android
        ? valueRef.current
          ? 16
          : 11
        : 0,
      textAlignVertical: 'top',
      width: startsWith
        ? ios
          ? 0.55 * width
          : 0.56 * width
        : ios
        ? 0.6 * width
        : 0.61 * width,
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
        <Inset top="19px">
          <Inline space="4px">
            <Text
              {...(errorMessage && {
                color: { custom: colors.red },
              })}
              size={`${textSize}px`}
              weight="heavy"
            >
              {label}
            </Text>
            {errorMessage && (
              <Bleed space="10px">
                <ButtonPressAnimation onPress={() => Alert.alert(errorMessage)}>
                  <Inset space="10px">
                    <Text
                      color={{ custom: colors.red }}
                      size={`${textSize}px`}
                      weight="heavy"
                    >
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
            <Inset top={ios ? '2px' : '1px'}>
              <Text color="secondary30" weight="heavy">
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
            onContentSizeChange={
              android && inputProps?.multiline
                ? handleContentSizeChange
                : undefined
            }
            onEndEditing={onEndEditing}
            onFocus={onFocus}
            placeholder={placeholder}
            scrollEnabled={false}
            selectionColor={selectionColor}
            spellCheck={false}
            style={style}
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
