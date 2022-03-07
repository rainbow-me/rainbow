import React, { useCallback, useMemo, useState } from 'react';
import { TextInputProps } from 'react-native';
import Input from './Input';
import {
  Column,
  Columns,
  Inset,
  Text,
  useTextStyle,
} from '@rainbow-me/design-system';

const textSize = 16;

export type InlineFieldProps = {
  autoFocus?: TextInputProps['autoFocus'];
  defaultValue?: string;
  label: string;
  placeholder?: string;
  inputProps?: Partial<TextInputProps>;
  onChangeText: (text: string) => void;
  onEndEditing?: TextInputProps['onEndEditing'];
  validations?: {
    allowCharacterRegex?: { match: RegExp };
    maxLength?: { value: number };
  };
  value?: string;
};

export default function InlineField({
  autoFocus,
  defaultValue,
  label,
  onChangeText,
  placeholder,
  inputProps,
  validations,
  onEndEditing,
  value,
}: InlineFieldProps) {
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

  const handleChangeText = useCallback(
    text => {
      const { allowCharacterRegex } = validations || {};
      if (!allowCharacterRegex) {
        onChangeText(text);
        return;
      }
      if (text === '') {
        onChangeText(text);
        return;
      }
      if (allowCharacterRegex?.match.test(text)) {
        onChangeText(text);
        return;
      }
    },
    [onChangeText, validations]
  );

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
        ? 11
        : 0,
      textAlignVertical: 'top',
    }),
    [textStyle, inputHeight, inputProps?.multiline]
  );

  return (
    <Columns>
      <Column width="1/3">
        <Inset top="19px">
          <Text size={`${textSize}px`} weight="heavy">
            {label}
          </Text>
        </Inset>
      </Column>
      <Input
        autoFocus={autoFocus}
        defaultValue={defaultValue}
        maxLength={validations?.maxLength?.value}
        onChangeText={handleChangeText}
        onContentSizeChange={
          android && inputProps?.multiline ? handleContentSizeChange : undefined
        }
        onEndEditing={onEndEditing}
        placeholder={placeholder}
        style={style}
        value={value}
        {...inputProps}
        keyboardType={android ? 'visible-password' : inputProps?.keyboardType}
      />
    </Columns>
  );
}
